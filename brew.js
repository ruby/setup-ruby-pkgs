'use strict';

const core = require('@actions/core')

const { execSync, grpSt, grpEnd } = require('./common')

// group start time
let msSt

// clean inputs
let brew = core.getInput('brew').replace(/[^a-z_ \d.@-]+/gi, '').trim().toLowerCase()

export const run = async () => {
  try {
    if (brew !== '') {
      let needUpdate = true

      if (/\b_update_\b/.test(brew)) {
        msSt = grpSt('brew update')
        execSync('brew update')
        grpEnd(msSt)
        needUpdate = false
        brew = brew.replace(/\b_update_\b/gi, '').trim()
      }

      if (/\b_upgrade_\b/.test(brew)) {
        msSt = grpSt('brew upgrade')
        if (needUpdate) { execSync('brew update') }
        execSync('brew upgrade')
        grpEnd(msSt)
        brew = brew.replace(/\b_upgrade_\b/gi, '').trim()
      }
      
      if (/\b_link_\b/.test(brew)) {
        msSt = grpSt('brew link')
        execSync('brew link')
        grpEnd(msSt)
        brew = brew.replace(/\b_link_\b/gi, '').trim()
      }

      if (brew !== '') {
        msSt = grpSt(`brew install ${brew}`)
          execSync(`brew install ${brew}`)
        grpEnd(msSt)
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
