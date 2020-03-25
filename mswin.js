'use strict';

const fs   = require('fs')
const core = require('@actions/core')

const { execSync, getInput } = require('./common')

let mingw = getInput('mingw')  // only parsed for openssl
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
      if (!choco.includes('openssl')) { choco += ' openssl' }
    }

    if (choco !== '') {
      execSync(`choco install --no-progress ${choco}`)
      if (choco.includes('openssl')) {
        fs.renameSync('C:\\Program Files\\OpenSSL-Win64', 'C:\\openssl-win')
        core.exportVariable('SSL_DIR', '--with-openssl-dir=C:\\openssl-win')
      }
    }

    if (vcpkg !== '') {
      execSync(`vcpkg --triplet x64-windows install ${vcpkg}`)
      core.exportVariable('OPT_DIR', `--with-opt-dir=${process.env.VCPKG_INSTALLATION_ROOT}\\installed\\x64-windows`)
      const vcpkgTools = `${process.env.VCPKG_INSTALLATION_ROOT}\\installed\\x64-windows\\tools`
      if (fs.existsSync(vcpkgTools) && fs.readdirSync(vcpkgTools).length >= 0) {
        core.addPath(vcpkgTools)
        console.log(`Added to Path: ${vcpkgTools}`)
      }
    }

  } catch (error) {
    core.setFailed(error.message)
  }
}
