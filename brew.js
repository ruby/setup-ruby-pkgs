'use strict';

const core = require('@actions/core')

const { execSync } = require('./common')

// clean inputs
let brew = core.getInput('brew').replace(/[^a-z_ \d.@-]+/gi, '').trim().toLowerCase()

export const run = async () => {
  try {
    if (brew !== '') {
      let needUpdate = true

      if (/\b_update_\b/.test(brew)) {
        execSync('brew update')
        needUpdate = false
        brew = brew.replace(/\b_update_\b/gi, '').trim()
      }

      if (/\b_upgrade_\b/.test(brew)) {
        if (needUpdate) { execSync('brew update') }
        brew = brew.replace(/\b_upgrade_\b/gi, '').trim()
      }

      if (brew !== '') { execSync(`brew install ${brew}`) }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
