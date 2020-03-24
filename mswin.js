'use strict';

const fs   = require('fs')
const core = require('@actions/core')

const { execSync, getInput } = require('./common')

let mingw = getInput('mingw')
let mswin = getInput('mswin')
let choco = getInput('choco')
let vcpkg = getInput('vcpkg')

let ruby                                   // eslint-disable-line no-unused-vars

export const setRuby = (_ruby) => { ruby = _ruby }

export const run = async () => {
  try {
    if (mswin !== '') {
      execSync(`pacman.exe -S --noconfirm --noprogressbar --needed ${mswin}`)
    }

    if (mingw.includes('openssl')) {
      execSync(`choco install --no-progress openssl`)
      fs.renameSync('C:\\Program Files\\OpenSSL-Win64', 'C:\\openssl-win')
      core.exportVariable('SSL_DIR', '--with-openssl-dir=C:/openssl-win')
      choco = choco.replace(/openssl/gi, '').trim()
    }

    if (choco !== '') {
      execSync(`choco install --no-progress ${choco}`)
      if (choco.includes('openssl')) {
        fs.renameSync('C:\\Program Files\\OpenSSL-Win64', 'C:\\openssl-win')
        core.exportVariable('SSL_DIR', '--with-openssl-dir=C:/openssl-win')
      }
    }

    if (vcpkg !== '') {
      execSync(`vcpkg --triplet x64-windows install ${vcpkg}`)
      core.exportVariable('OPT_DIR', `--with-opt-dir=${process.env.VCPKG_INSTALLATION_ROOT}/installed/x64-windows`)
    }

  } catch (error) {
    core.setFailed(error.message)
  }
}
