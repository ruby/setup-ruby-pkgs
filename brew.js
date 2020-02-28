'use strict';

const core = require('@actions/core')

const { execSync } = require('./common')

// clean inputs
let brew = core.getInput('brew').replace(/[^a-z_ \d.@-]+/gi, '').trim().toLowerCase()

export const run = async () => {
  try {
    // normal Actions TEMP/TMP settings use a short file pathname
    // unexpected errors may ocurr...
    core.exportVariable('TMPDIR', process.env.RUNNER_TEMP)

    if (brew !== '') {
      if (brew.includes('_upgrade_')) {
        execSync('brew update')
        execSync('brew upgrade')
        brew = brew.replace(/_upgrade_/gi, '').trim()
      }
      
      if (brew !== '') {
        execSync(`brew install ${brew}`)
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
