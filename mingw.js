'use strict';

const fs   = require('fs')
const core = require('@actions/core')

// , updateKeyRing
const { download, execSync, execSyncQ, grpSt, grpEnd, getInput, is2022orLater, win2nix } = require('./common')

// group start time
let msSt

// used to only update MSYS2 database (y parameter) once
let msys2Sync = '-Sy'

// SSD drive, used for most downloads and MSYS
const drive = (process.env.GITHUB_WORKSPACE || 'C')[0]

// location to extract old MSYS packages
const dirDK7z  = `${drive}:\\DevKit64\\mingw\\x86_64-w64-mingw32`

const dlPath = `${process.env.RUNNER_TEMP}\\srp`
if (!fs.existsSync(dlPath)) {
  fs.mkdirSync(dlPath, { recursive: true })
}

let ruby
let old_pkgs
let RELEASE_ASSET

// clean inputs
let mingwPkgs = getInput('mingw')
let msys2Pkgs = getInput('msys2')

let pre // package prefix, set in setRuby
// standard pacman args
const args  = '--noconfirm --noprogressbar --needed --disable-download-timeout'

// Not used. Installs packages stored in GitHub release.
// Only needed for exceptional cases.
const install = async (pkg, release) => {  // eslint-disable-line no-unused-vars
  const uriBase = 'https://github.com/MSP-Greg/ruby-msys2-package-archive/releases/download'
  const suff    = '-any.pkg.tar.xz'

  const uri = `${uriBase}/${release}`

  const dir = `${dlPath}\\msys2_gcc`
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  let f = `${pre}${pkg}${suff}`
  await download(`${uri}/${f}`    , `${dir}\\${f}`)
  await download(`${uri}/${f}.sig`, `${dir}\\${f}.sig`)
  console.log(`pacman.exe -Udd ${args} ${dir}\\${f}`)

  const cwd = process.cwd()
  try {
    process.chdir(dir)
    execSync(`pacman.exe -Udd ${args} ${f}`)
    process.chdir(cwd)
  } catch (error) {
    process.chdir(cwd)
    core.setFailed(error.message)
  }
}

/* Renames OpenSSL dlls in System32 folder, installs OpenSSL 1.0.2 for Ruby 2.4.
 * At present, all versions of Ruby except 2.4 can use the OpenSSL packages
 * provided by the generic package install code.  But that may change...
 */
const openssl = async () => {
  let ssl = 'C:\\Windows\\System32\\'
  let badFiles = [`${ssl}libcrypto-1_1-x64.dll`, `${ssl}libssl-1_1-x64.dll`]
  badFiles.forEach( (bad) => {
    if (fs.existsSync(bad)) { fs.renameSync(bad, `${bad}_`) }
  })

  if (ruby.abiVers === '2.4.0') {
    let uri = 'https://github.com/MSP-Greg/ruby-loco/releases/download/old-ruby/mingw-w64-x86_64-openssl-1.0.2.u-1-any.pkg.tar.zst'
    let fn = `${dlPath}\\ri2.tar.zst`
    msSt = grpSt('install 2.4 OpenSSL')

    // appveyor ri2 package signing key
    // let key = 'F98B8484BE8BF1C5'
    // execSync(`bash.exe -c "pacman-key --recv-keys ${key}"`)
    // execSync(`bash.exe -c "pacman-key --lsign-key ${key}"`)
    // await download(`${uri}.sig`, `${fn}.sig`)

    await download(uri, fn)
    checkSpace
    execSync(`pacman.exe -Udd --noconfirm --noprogressbar ${fn}`)
    grpEnd(msSt)
    mingwPkgs = mingwPkgs.replace(/\bopenssl\b/gi, '').trim()
  } else if ((is2022orLater && ruby.abiVers >= '2.5.0') || core.getInput('ruby-version') === 'head')
    // Ruby 'head' uses a custom OpenSSL 3 package
    mingwPkgs = mingwPkgs.replace(/\bopenssl\b/gi, '').trim()
}

// Updates MSYS2 MinGW gcc items
const updateGCC = async () => {
  // TODO: code for installing gcc 9.2.0-1 or 9.1.0-3

  msSt = grpSt(`Upgrading gcc for Ruby ${ruby.vers}`)
  checkSpace
  let gccPkgs = ['', 'binutils', 'crt', 'dlfcn', 'headers', 'libiconv', 'isl', 'make', 'mpc', 'mpfr', 'pkgconf', 'windows-default-manifest', 'libwinpthread', 'libyaml', 'winpthreads', 'zlib', 'gcc-libs', 'gcc']
  execSync(`pacman.exe ${msys2Sync} --nodeps ${args} ${gccPkgs.join(pre)}`)
  grpEnd(msSt)

  // await require('./mingw_gcc').run(ruby.vers)
}

// Used to install pre-built MSYS2 from a GitHub release asset, hopefully never
// needed once Actions Windows images have MSYS2 installed.
const installMSYS2 = async () => {
  const fn = `${dlPath}\\msys64.7z`
  const cmd = `7z x ${fn} -oC:\\`
  await download(`https://github.com/MSP-Greg/ruby-msys2-package-archive/releases/download/${RELEASE_ASSET}/msys64.7z`, fn)
  fs.rmdirSync('C:\\msys64', { recursive: true })
  execSyncQ(cmd)
  core.info('Installed MSYS2 for Ruby 2.4 and later')
}

let checkSpaceIsDone = false

// disable slow disk space check
const checkSpace = () => {
  if (!checkSpaceIsDone) {
    execSync("sed -i 's/^CheckSpace/#CheckSpace/g' C:/msys64/etc/pacman.conf")
    checkSpaceIsDone = true
  }
}

// install MinGW packages from mingw input
const runMingw = async () => {

  if (ruby.abiVers >= '2.4' && !is2022orLater) {
    msSt = grpSt(`pacman.exe -Sy pacman-mirrors`)
    checkSpace
    execSync(`pacman.exe -Sy ${args} pacman-mirrors`)
    grpEnd(msSt)
  }

  if (mingwPkgs.includes('_upgrade_')) {
    if (ruby.abiVers >= '2.4' && !is2022orLater) {
      await updateGCC()
      msys2Sync = '-S'
    }
    mingwPkgs = mingwPkgs.replace(/\b_upgrade_\b/gi, '').trim()
  }

  /* _msvc_ can be used when building mswin Rubies
   * when using an installed mingw Ruby, normally _upgrade_ should be used
   */
  if (mingwPkgs.includes('_msvc_')) {
    await require('./mswin').addVCVARSEnv()
    return
  }

  if (ruby.abiVers >= '2.4.0') {
    let list = ''
    if (mingwPkgs !== '') {
      if (is2022orLater) {
        const preInstalled2022 = /\b(dlfcn|gmp|libffi|libyaml|ragel|readline)\b/gi
        mingwPkgs = mingwPkgs.replace(preInstalled2022, '').trim()
      }
      if (mingwPkgs.includes('openssl')) {
        await openssl()
      }
      if (mingwPkgs !== '') {
        let pkgs = mingwPkgs.split(/\s+/)
        pkgs.unshift('')
        list = pkgs.join(pre)
      }
    }
    if (msys2Pkgs !== '') {
      if (is2022orLater) msys2Pkgs = msys2Pkgs.replace(/\bbison\b/gi, '').trim()
      if (msys2Pkgs !== '') {
        list += ' ' + msys2Pkgs
        msys2Pkgs = ''
      }
    }
    if (list !== '') {
      msSt = grpSt(`pacman.exe -S ${list}`)
      checkSpace
      execSync(`pacman.exe ${msys2Sync} ${args} ${list}`)
      grpEnd(msSt)
    }
  } else if (mingwPkgs !== '') {
    // install old DevKit packages
    let toInstall = []
    let pkgs = mingwPkgs.split(/\s+/)
    pkgs.forEach( (pkg) => {
      if (old_pkgs[pkg]) {
        toInstall.push({ pkg: pkg, uri: old_pkgs[pkg]})
      } else {
        core.warning(`Package '${pkg}' is not available`)
      }
    })
    if (toInstall.length !== 0) {
      const list = toInstall.map(item => item.pkg).join(' ')
      msSt = grpSt(`installing MSYS packages: ${list}`)
      for (const item of toInstall) {
        let fn = `${dlPath}\\${item.pkg}.tar.lzma`
        await download(item.uri, fn)
        let cmd = `7z x -tlzma ${fn} -so | 7z x -aoa -si -ttar -o${dirDK7z}`
        execSyncQ(cmd)
      }
      grpEnd(msSt)
    }
  }
}

// install MSYS2 packages from mys2 input
const runMSYS2 = async () => {
  let pacman = 'pacman.exe'
  if (ruby.abiVers < '2.4.0') {
    pacman = 'C:\\msys64\\usr\\bin\\pacman.exe'
  }
  msSt = grpSt(`pacman.exe ${msys2Sync} ${msys2Pkgs}`)
  execSync(`${pacman} ${msys2Sync} ${args} ${msys2Pkgs}`)
  grpEnd(msSt)
}

export const setRuby = (_ruby) => {
  ruby = _ruby
  pre = (ruby.platform === 'x64-mingw-ucrt') ? ' mingw-w64-ucrt-x86_64-' :
        (ruby.platform === 'x64-mingw32')    ? ' mingw-w64-x86_64-' : ' mingw-w64-i686-'
}

export const run = async () => {
  try {
    // rename files that cause build conflicts with MSYS2
    // let badFiles = ['C:\\Strawberry\\c\\bin\\gmake.exe']
    // badFiles.forEach( (bad) => {
    //   if (fs.existsSync(bad)) { fs.renameSync(bad, `${bad}_`) }
    // })

    // await updateKeyRing('1~20210213-1')

    if (mingwPkgs !== '' || msys2Pkgs !== '') {
      if (ruby.abiVers >= '2.4.0') {
        // remove pacman CheckSpace, move cache dir to SSD
        const conf_fn = 'C:\\msys64\\etc\\pacman.conf'
        let conf      = fs.readFileSync(conf_fn, 'utf-8')
        let cache_dir = `${process.env.RUNNER_TEMP}\\pacman\\pkg`

        fs.mkdirSync(cache_dir, { recursive: true })

        cache_dir = win2nix(cache_dir)

        conf = conf.replace(/^CheckSpace/m, '#CheckSpace')
        conf = conf.replace(/^#CacheDir( += )[^\n]+/m, (m, p1) => {
          return `CacheDir ${p1}${cache_dir}`
        })
        fs.writeFileSync(conf_fn, conf, 'utf-8')

        /* setting to string uses specified release asset for MSYS2,
         * setting to null uses pre-installed MSYS2
         * release contains all Ruby building dependencies,
         * used when MSYS2 install or server have problems
         */
        RELEASE_ASSET = fs.lstatSync('C:\\msys64').isSymbolicLink() ?
          'msys2-2020-05-20' : null
        if (RELEASE_ASSET) {
          msSt = grpSt('Updating MSYS2')
          await installMSYS2()
          grpEnd(msSt)
        }

      } else {
        // get list of available pkgs for Ruby 2.2 & 2.3
        old_pkgs = require('./open_knapsack_pkgs').old_pkgs
      }

      // install user specificied packages
      if (mingwPkgs !== '') { await runMingw() }
      if (msys2Pkgs !== '') { await runMSYS2() }
    }

    if (ruby.abiVers >= '2.4.0') {
      // add home directory for user
      const dirHome = `C:\\msys64\\home\\${process.env.USERNAME}`
      if (!fs.existsSync(dirHome)) {
        fs.mkdirSync(dirHome, { recursive: true })
      }
    }

  } catch (error) {
    core.setFailed(error.message)
  }
}
