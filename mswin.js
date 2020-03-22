'use strict';

const fs   = require('fs')
const core = require('@actions/core')

const { execSync, getInput } = require('./common')

let mingw = getInput('mingw')
let vcpkg = getInput('vcpkg')

let ruby                                   // eslint-disable-line no-unused-vars

export const setRuby = (_ruby) => { ruby = _ruby }

// installs 1.1.1d
export const openssl = async () => {
  execSync('C:\\ProgramData\\Chocolatey\\bin\\choco install --no-progress openssl')
  fs.renameSync('C:\\Program Files\\OpenSSL-Win64', 'C:\\openssl-win')
  core.exportVariable('SSL_DIR', '--with-openssl-dir=C:/openssl-win')
  mingw = mingw.replace(/openssl/gi, '').trim()
}

export const run = async () => {
  try {
    if (mingw.includes('openssl')) { openssl() }
    
    if (vcpkg !== '') {
      execSync(`vcpkg --triplet x64-windows install ${vcpkg}`)
      core.addPath(`${process.env.VCPKG_INSTALLATION_ROOT}\\installed\\x64-windows\\tools`)
    }

  } catch (error) {
    core.setFailed(error.message)
  }
}
