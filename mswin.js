'use strict';

const fs   = require('fs')
const child_process = require('child_process')

const core = require('@actions/core')
const exec  = require('@actions/exec')

const addVCVARSEnv = async () => {
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

export const run = async () => {
  try {
    let mingw = core.getInput('mingw').replace(/[^a-z_ \d.-]+/gi, '').trim().toLowerCase()

    if (mingw.includes('_update_')) {
      await addVCVARSEnv()
      mingw = mingw.replace(/_update_/gi, '').trim()
    }

    if (mingw.includes('openssl')) {
      await exec.exec('C:\\ProgramData\\Chocolatey\\bin\\choco install --no-progress openssl')
      fs.renameSync('C:\\Program Files\\OpenSSL-Win64', 'C:\\openssl-win')
      mingw = mingw.replace(/openssl/gi, '').trim()
    }

    core.exportVariable('CI'    , 'true')
    core.exportVariable('TMPDIR', process.env.RUNNER_TEMP)

  } catch (error) {
    core.setFailed(error.message);
  }
}
