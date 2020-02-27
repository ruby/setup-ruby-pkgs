'use strict';

const fs    = require('fs')
const child_process = require('child_process')

const tc    = require('@actions/tool-cache')
const core  = require('@actions/core')
const exec  = require('@actions/exec')

// clean input
let   mingw = core.getInput('mingw').replace(/[^a-z_ \d.-]+/gi, '').trim().toLowerCase()
let   msys2 = core.getInput('msys2').replace(/[^a-z_ \d.-]+/gi, '').trim().toLowerCase()

let cmd = 'ruby -e "puts RUBY_PLATFORM, RUBY_ENGINE, RUBY_ENGINE_VERSION, RUBY_VERSION, RbConfig::CONFIG[%q[ruby_version]]"';
let [ rubyPlatform,
      rubyEngine,
      rubyEngineVersion,
      rubyVers,
      rubyABIVers ] = child_process.execSync(cmd).toString().trim().split(/\r?\n/)

let bits = '64'
const prefix = (bits === '64') ? ' mingw-w64-x86_64-' : ' mingw-w64-i686-'
const args  = '--noconfirm --noprogressbar --needed'

// Install OpenSSL 1.0.2 for Ruby 2.3 & 2.4, 1.1.1 for Ruby 2.5 and later
const openssl = async () => {
  let ssl = 'C:\\Windows\\System32\\'
  let ary = [`${ssl}libcrypto-1_1-x64.dll`, `${ssl}libssl-1_1-x64.dll`]
  ary.forEach( (bad) => {
    if (fs.existsSync(bad)) { fs.renameSync(bad, `${bad}_`) }
  })

  if (rubyABIVers >= '2.5') {
    const openssl = `${prefix}openssl`
    await exec.exec(`pacman.exe -S ${args} ${openssl}`)
  } else if (rubyABIVers === '2.4.0') {
    const openssl_24 = `https://dl.bintray.com/larskanis/rubyinstaller2-packages/${prefix.trim()}openssl-1.0.2.t-1-any.pkg.tar.xz`
    const openssl_24_path = await tc.downloadTool(openssl_24)
    await exec.exec(`pacman.exe -Udd --noconfirm --noprogressbar ${openssl_24_path}`)
  } else if (rubyABIVers <= '2.4') {
    const openssl_23 = 'http://dl.bintray.com/oneclick/OpenKnapsack/x64/openssl-1.0.2j-x64-windows.tar.lzma'
    const openssl_23_path = await tc.downloadTool(openssl_23)
    fs.mkdirSync('C:\\openssl-win')
    let fn = openssl_23_path.replace(/:/, '').replace(/\\/, '/')
    await exec.exec(`tar.exe --lzma -C /c/openssl-win --exclude=ssl/man -xf /${fn}`)
    core.info('Installed OpenKnapsack openssl-1.0.2j-x64 package')
  }
}

// Updates MSYS2 MinGW gcc items
const updateGCC = async () => {
  // full update, takes too long
  // await exec.exec(`pacman.exe -Syu ${args}`);
  // await exec.exec(`pacman.exe -Su  ${args}`);
  let gccPkgs = ['', 'binutils', 'crt', 'dlfcn', 'headers', 'libiconv', 'isl', 'make', 'mpc', 'mpfr', 'windows-default-manifest', 'libwinpthread', 'libyaml', 'winpthreads', 'zlib', 'gcc-libs', 'gcc']
  await exec.exec(`pacman.exe -S ${args} ${gccPkgs.join(prefix)}`)
}

// Updates MSYS2 package databases
const runBase = async () => {
  // setup and update MSYS2
  await exec.exec(`bash.exe -c "pacman-key --init"`)
  await exec.exec(`bash.exe -c "pacman-key --populate msys2"`)
  await exec.exec(`pacman.exe -Sy`)
}

// Install MinGW packages from mingw input
const runMingw = async () => {
  await runBase()
  if (mingw.includes('_update_')) {
    await updateGCC()
    mingw = mingw.replace(/_update_/g, '').trim()
  }

  if (mingw.includes('openssl')) {
    await openssl()
    mingw = mingw.replace(/openssl/gi, '').trim()
  }

  if (mingw !== '') {
    let pkgs = mingw.split(/ +/)
    if (pkgs.length > 0) {
      pkgs.unshift('')
      await exec.exec(`pacman.exe -S ${args} ${pkgs.join(prefix)}`)
    }
  }
}

// Install MSYS2 packages from mys2 input
const runMSYS2 = async () => {
  if (msys2 !== '') {
    await exec.exec(`pacman.exe -S ${args} ${msys2}`)
  }
}

export const run = async () => {
  try {
    core.exportVariable('CI', 'true')

    core.exportVariable('TMPDIR', process.env.RUNNER_TEMP)

    if (mingw !== '') { await runMingw() }
    if (msys2 !== '') { await runMSYS2() }
  } catch (error) {
    core.setFailed(error.message);
  }
}
