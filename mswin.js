'use strict';

const fs = require('fs')
const child_process = require('child_process')

const core = require('@actions/core')
const exec = require('@actions/exec')

let mingw = core.getInput('mingw').replace(/[^a-z_ \d.-]+/gi, '').trim().toLowerCase()

/* runs process.env.VCVARS and sets environment for use in Actions
 * allows steps to run without running vcvars*.bat, also allows using PS scripts
 */
export const addVCVARSEnv = async () => {
  let cmd = `cmd.exe /c "${process.env.VCVARS} && set"`

  let newSet = child_process.execSync(cmd).toString().trim().split(/\r?\n/)

  newSet = newSet.filter(line => line.match(/\S=\S/))

  let newEnv = new Map()

  newSet.forEach(s => {
    let [k,v] = s.split('=', 2)
    newEnv.set(k,v)
  })

  newEnv.forEach( (v, k, ) => {
    if (process.env[k] !== v) {
      core.exportVariable(k, v)
      // console.log(`${k} = ${v}`)
    }
  })
}

// installs 1.1.1d
export const openssl = async () => {
  await exec.exec('C:\\ProgramData\\Chocolatey\\bin\\choco install --no-progress openssl')
  fs.renameSync('C:\\Program Files\\OpenSSL-Win64', 'C:\\openssl-win')
  core.exportVariable('SSL_DIR', '--with-openssl-dir=C:/openssl-win')
  mingw = mingw.replace(/openssl/gi, '').trim()
}

export const run = async () => {
  try {
    if (mingw.includes('_update_') || mingw.includes('_msvc_')) {
      await addVCVARSEnv()
      mingw = mingw.replace(/_update_|_msvc_/gi, '').trim()
    }

    if (mingw.includes('openssl')) { openssl() }

    core.exportVariable('CI'    , 'true')
    core.exportVariable('TMPDIR', process.env.RUNNER_TEMP)

  } catch (error) {
    core.setFailed(error.message);
  }
}
