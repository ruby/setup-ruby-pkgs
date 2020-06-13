'use strict';

const fs   = require('fs')
const core = require('@actions/core')

const { execSync, grpSt, grpEnd, getInput } = require('./common')

// group start time
let msSt

let mingw = getInput('mingw')  // only parsed for openssl
let mswin = getInput('mswin')
let choco = getInput('choco')
let vcpkg = getInput('vcpkg')

let ruby

export const setRuby = (_ruby) => { ruby = _ruby } // eslint-disable-line no-unused-vars

export const run = async () => {
  try {
    if (mswin !== '') {
      if (mingw.includes('ragel') && !mswin.includes('ragel')) {
        mswin += ' mingw-w64-x86_64-ragel'
        mswin = mswin.trim()
      }
      msSt = grpSt(`install msys2 packages: ${mswin}`)
      execSync(`pacman.exe -Sy --noconfirm --noprogressbar --needed ${mswin}`)
      grpEnd(msSt)
    }

    if (mingw.includes('openssl')) {
      if (!choco.includes('openssl')) {
        choco += ' openssl'
        choco = choco.trim()        
      }
    }

    if (choco !== '') {
      msSt = grpSt(`choco install ${choco}`)
      execSync(`choco install --no-progress ${choco}`)
      if (choco.includes('openssl')) {
        fs.renameSync('C:\\Program Files\\OpenSSL-Win64', 'C:\\openssl-win')
        core.exportVariable('SSL_DIR', '--with-openssl-dir=C:/openssl-win')
      }
      grpEnd(msSt)
    }

    if (vcpkg !== '') {
      msSt = grpSt(`vcpkg --triplet x64-windows install ${vcpkg}`)
      execSync(`vcpkg --triplet x64-windows install ${vcpkg}`)
      const vcpkgRoot = process.env.VCPKG_INSTALLATION_ROOT.replace(/\\/g, '/')
      core.exportVariable('OPT_DIR', `--with-opt-dir=${vcpkgRoot}/installed/x64-windows`)
      const vcpkgTools = `${process.env.VCPKG_INSTALLATION_ROOT}\\installed\\x64-windows\\tools`
      if (fs.existsSync(vcpkgTools) && fs.readdirSync(vcpkgTools).length >= 0) {
        core.addPath(vcpkgTools)
        console.log(`Added to Path: ${vcpkgTools}`)
      }
      grpEnd(msSt)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
