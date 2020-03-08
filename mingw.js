'use strict';

const fs   = require('fs')
const core = require('@actions/core')

const { execSync, download } = require('./common')

let ruby

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
    await install('openssl-1.1.1.d-2', 'gcc-9.2.0-2')
    
    // const openssl = `${prefix}openssl`
    // execSync(`pacman.exe -S ${args} ${openssl}`)

  } else if (ruby.abiVers === '2.4.0') {
    const openssl_24 = `https://dl.bintray.com/larskanis/rubyinstaller2-packages/${prefix.trim()}openssl-1.0.2.t-1-any.pkg.tar.xz`
    const openssl_24_path = `${process.env.RUNNER_TEMP}\\ri2.tar.xz`
    await download(openssl_24, openssl_24_path)
    execSync(`pacman.exe -Udd --noconfirm --noprogressbar ${openssl_24_path}`)

  } else if (ruby.abiVers <= '2.4') {
    const openssl_23 = 'http://dl.bintray.com/oneclick/OpenKnapsack/x64/openssl-1.0.2j-x64-windows.tar.lzma'
    const openssl_23_path = `${process.env.RUNNER_TEMP}\\ri.tar.lzma`
    await download(openssl_23, openssl_23_path)
    fs.mkdirSync('C:\\openssl-win')
    let fn = openssl_23_path.replace(/:/, '').replace(/\\/, '/')
    execSync(`tar.exe --lzma -C /c/openssl-win --exclude=ssl/man -xf /${fn}`)
    core.info('Installed OpenKnapsack openssl-1.0.2j-x64 package')
  }
}

// updates MSYS2 MinGW gcc items
const updateGCC = async () => {
  await require('./mingw_gcc').run(ruby.vers)

  // full update, takes too long
  // await exec.exec(`pacman.exe -Syyuu ${args}`);

  // TODO: code for installing gcc 9.2.0-1 or 9.1.0-3
//  if (ruby.abiVers >= '2.4') {
  if (ruby.abiVers >= '9.9') {
    core.info(`********** Upgrading gcc for Ruby ${ruby.vers}`)
    let gccPkgs = ['', 'binutils', 'crt', 'dlfcn', 'headers', 'libiconv', 'isl', 'make', 'mpc', 'mpfr', 'windows-default-manifest', 'libwinpthread', 'libyaml', 'winpthreads', 'zlib', 'gcc-libs', 'gcc']
    execSync(`pacman.exe -S ${args} ${gccPkgs.join(prefix)}`)
  }
}

// updates MSYS2 package databases
const runBase = async () => {
  // setup and update MSYS2
  execSync(`bash.exe -c "pacman-key --init"`)
  execSync(`bash.exe -c "pacman-key --populate msys2"`)
  execSync(`pacman.exe -Sy`)
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
    await install('ragel-6.10-1', 'gcc-9.2.0-2')
    mingw = mingw.replace(/ragel/gi, '').trim()
  }

  if (mingw !== '') {
    let pkgs = mingw.split(/ +/)
    if (pkgs.length > 0) {
      pkgs.unshift('')
      execSync(`pacman.exe -S ${args} ${pkgs.join(prefix)}`)
    }
  }
}

// install MSYS2 packages from mys2 input
const runMSYS2 = async () => {
  execSync(`pacman.exe -S ${args} ${msys2}`)
}

export const setRuby = async (_ruby) => { ruby = _ruby }

export const run = async () => {
  try {
    // normal Actions TEMP/TMP settings use a short file pathname
    // unexpected errors may ocurr...
    core.exportVariable('TMPDIR', process.env.RUNNER_TEMP)

    // rename files that cause build conflicts with MSYS2
    let badFiles = ['C:\\Strawberry\\c\\bin\\gmake.exe']
    badFiles.forEach( (bad) => {
      if (fs.existsSync(bad)) { fs.renameSync(bad, `${bad}_`) }
    })

    // update package database and general MSYS2 initialization
    if (mingw.includes('_update_') || msys2.includes('_update_')) {
      await runBase()
      mingw = mingw.replace(/_upgrade_/g, '').trim()
      msys2 = msys2.replace(/_upgrade_/g, '').trim()
    }

    // install user specificied packages
    if (mingw !== '') { await runMingw() }
    if (msys2 !== '') { await runMSYS2() }
  } catch (error) {
    core.setFailed(error.message)
  }
}
