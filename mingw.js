'use strict';

const fs   = require('fs')
const path = require('path')
const core = require('@actions/core')

const { execSync, download } = require('./common')

// setting to true uses pacman download, false uses release files
// used when MSYS2 has server issues
const USE_MSYS2 = true

// SSD drive, used for most downloads
const drive = (process.env['GITHUB_WORKSPACE'] || 'C')[0] 

const tar = 'C:\\msys64\\usr\\bin\\tar.exe'
const oldDKTar = `/${drive}/DevKit64/mingw/x86_64-w64-mingw32`


let ruby
let old_pkgs
let addOldDKtoPath = false

// clean inputs
let mingw = core.getInput('mingw').replace(/[^a-z_ \d.-]+/gi, '').trim().toLowerCase()
let msys2 = core.getInput('msys2').replace(/[^a-z_ \d.-]+/gi, '').trim().toLowerCase()

// need more logic if support for 32 bit MinGW Rubies is added
let bits = '64'
const prefix = (bits === '64') ? ' mingw-w64-x86_64-' : ' mingw-w64-i686-'
const args  = '--noconfirm --noprogressbar --needed'

const install = async (pkg, release) => {
  const uriBase = 'https://github.com/MSP-Greg/ruby-msys2-package-archive/releases/download'
  const pre64   = 'mingw-w64-x86_64-'
  const suff    = '-any.pkg.tar.xz'
  const args    = '--noconfirm --noprogressbar --needed'

  const uri = `${uriBase}/${release}`

  const dir = `${process.env.RUNNER_TEMP}\\msys2_gcc`
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }  

  let f = `${pre64}${pkg}${suff}`
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

// install OpenSSL 1.0.2 for Ruby 2.3 & 2.4, 1.1.1 for Ruby 2.5 and later
const openssl = async () => {
  let ssl = 'C:\\Windows\\System32\\'
  let badFiles = [`${ssl}libcrypto-1_1-x64.dll`, `${ssl}libssl-1_1-x64.dll`]
  badFiles.forEach( (bad) => {
    if (fs.existsSync(bad)) { fs.renameSync(bad, `${bad}_`) }
  })

  if (ruby.abiVers >= '2.5') {
    if (USE_MSYS2) {
      execSync(`pacman.exe -S ${args} ${prefix}openssl`)
    } else {
      await install('openssl-1.1.1.d-2', 'gcc-9.2.0-2')
    }

  } else if (ruby.abiVers === '2.4.0') {
    const openssl_24 = `https://dl.bintray.com/larskanis/rubyinstaller2-packages/${prefix.trim()}openssl-1.0.2.t-1-any.pkg.tar.xz`
    const openssl_24_path = `${process.env.RUNNER_TEMP}\\ri2.tar.xz`
    await download(openssl_24, openssl_24_path)
    execSync(`pacman.exe -Udd --noconfirm --noprogressbar ${openssl_24_path}`)

  } else if (ruby.abiVers <= '2.4') {
    let fn = `${process.env.RUNNER_TEMP}\\ri.tar.lzma`
    await download(old_pkgs['openssl'], fn)
    fn = fn.replace(/:/, '').replace(/\\/g, '/')
    const cmd = `${tar} --lzma -C ${oldDKTar} --exclude=ssl/man -xf /${fn}`
    execSync(cmd)
    core.info('Installed OpenKnapsack openssl-1.0.2j-x64 package')
  }
}

// updates MSYS2 MinGW gcc items
const updateGCC = async () => {
  // full update, takes too long
  // await exec.exec(`pacman.exe -Syyuu ${args}`);
  // TODO: code for installing gcc 9.2.0-1 or 9.1.0-3
  
  if (USE_MSYS2) {
    if (ruby.abiVers >= '2.4.0') {
      const fn = `${process.env.RUNNER_TEMP}\\msys64.7z`
      const cmd = `7z x ${fn} -oC:\\`

      await download('https://github.com/MSP-Greg/ruby-msys2-package-archive/releases/download/msys2-2020-03-11/msys64.7z', fn)
      fs.rmdirSync('C:\\msys64', { recursive: true })
      execSync(cmd)
      core.info('  Installed MSYS2 for Ruby 2.4 and later')
      
      // core.info(`********** Upgrading gcc for Ruby ${ruby.vers}`)
      // let gccPkgs = ['', 'binutils', 'crt', 'dlfcn', 'headers', 'libiconv', 'isl', 'make', 'mpc', 'mpfr', 'windows-default-manifest', 'libwinpthread', 'libyaml', 'winpthreads', 'zlib', 'gcc-libs', 'gcc']
      // execSync(`pacman.exe -S ${args} ${gccPkgs.join(prefix)}`)
    } else {
      const dirDK = `${drive}:\\DevKit64`
      const uri = 'https://dl.bintray.com/oneclick/rubyinstaller/DevKit-mingw64-64-4.7.2-20130224-1432-sfx.exe'
      const fn  = `${process.env.RUNNER_TEMP}\\DevKit64.7z`
      const cmd = `7z x ${fn} -o${dirDK}`

      await download(uri, fn)
      execSync(cmd)
      addOldDKtoPath = true
      core.info('Installed RubyInstaller DevKit for Ruby 2.2 or 2.3')
    }
  } else {
    await require('./mingw_gcc').run(ruby.vers)
  }
}

// install MinGW packages from mingw input
const runMingw = async () => {
  if (mingw.includes('_upgrade_')) {
    await updateGCC()
    mingw = mingw.replace(/_upgrade_/g, '').trim()
  }

  /* _msvc_ can be used when building mswin Rubies, but using an installed mingw
   * Ruby, normally _update_ should be used
   */
  if (mingw.includes('_msvc_')) {
    let runner = require('./mswin')
    await runner.addVCVARSEnv()
    mingw = mingw.replace(/_msvc_/g, '').trim()
    if (mingw.includes('openssl')) {
      await runner.openssl()
    }
    mingw = mingw.replace(/openssl/g, '').trim()
    return
  }

  if (mingw.includes('openssl')) {
    await openssl()
    mingw = mingw.replace(/openssl/gi, '').trim()
  }

  if (mingw.includes('ragel')) {
    if (ruby.abiVers >= '2.4.0') {
      if (!USE_MSYS2) {
        await install('ragel-6.10-1', 'gcc-9.2.0-2')
        mingw = mingw.replace(/ragel/gi, '').trim()
      }
    }
  }

  if (mingw !== '') {
    let pkgs = mingw.split(/\s+/)
    if (pkgs.length > 0) {
      if (ruby.abiVers >= '2.4.0') {
        pkgs.unshift('')
        execSync(`pacman.exe -S ${args} ${pkgs.join(prefix)}`)
      } else {
        let toInstall = []
        pkgs.forEach( (pkg) => {
          if (old_pkgs[pkg]) {
            toInstall.push({ pkg: pkg, uri: old_pkgs[pkg]})
          } else {
            core.warning(`Package '${pkg}' is not available`)
          }
        })
        if (toInstall.length !== 0) {
          for (const item of toInstall) {
            let fn = `${process.env.RUNNER_TEMP}\\${item.pkg}.tar.lzma`
            await download(item.uri, fn)
            fn = fn.replace(/:/, '').replace(/\\/g, '/')
            let cmd = `${tar} --lzma -C ${oldDKTar} -xf /${fn}`
            execSync(cmd)
          }
        }
      }
    }
  }
  if (addOldDKtoPath) {
    const dirDK = `${drive}:\\DevKit64`
    core.exportVariable('RI_DEVKIT', dirDK)
    core.exportVariable('CC' , 'gcc')
    core.exportVariable('CXX', 'g++')
    core.exportVariable('CPP', 'cpp')

    let aryPath = process.env.PATH.split(path.delimiter)
    const rubyPath = aryPath.shift()
    // two msys2 paths
    aryPath.shift()
    aryPath.shift()
    aryPath.unshift(`${dirDK}\\mingw\\x86_64-w64-mingw32\\bin`)
    aryPath.unshift(`${dirDK}\\mingw\\bin`)
    aryPath.unshift(`${dirDK}\\bin`)
    aryPath.unshift(rubyPath)
    core.exportVariable('Path', aryPath.join(path.delimiter))
  }
}

// install MSYS2 packages from mys2 input
const runMSYS2 = async () => {
  execSync(`pacman.exe -S ${args} ${msys2}`)
}

export const setRuby = (_ruby) => { ruby = _ruby }

export const run = async () => {
  try {
    // rename files that cause build conflicts with MSYS2
    let badFiles = ['C:\\Strawberry\\c\\bin\\gmake.exe']
    badFiles.forEach( (bad) => {
      if (fs.existsSync(bad)) { fs.renameSync(bad, `${bad}_`) }
    })

    if (mingw !== '' || msys2 !== '') {
      if (ruby.abiVers >= '2.4.0') {
        // update package database and general MSYS2 initialization
        // execSync(`bash.exe -c "pacman-key --init ; pacman-key --populate msys2"`)
        // execSync(`pacman.exe -Sy`)
      } else {
        // get list of available pkgs for Ruby 2.2 & 2.3
        old_pkgs = require('./open_knapsack_pkgs').old_pkgs
      }

      // install user specificied packages
      if (mingw !== '') { await runMingw() }
      if (msys2 !== '') { await runMSYS2() }
    }

  } catch (error) {
    core.setFailed(error.message)
  }
}
