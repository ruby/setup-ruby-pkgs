'use strict';

const fs   = require('fs')
const core = require('@actions/core')

const { execSync } = require('./common')

let mingw = core.getInput('mingw').replace(/[^a-z_ \d.-]+/gi, '').trim().toLowerCase()

let ruby

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

    core.exportVariable('CI'    , 'true')
    core.exportVariable('TMPDIR', process.env.RUNNER_TEMP)

  } catch (error) {
    core.setFailed(error.message)
  }
}
