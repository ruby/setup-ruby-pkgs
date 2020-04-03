'use strict';

const core = require('@actions/core')

const { execSync } = require('./common')

// clean inputs
let apt = core.getInput('apt-get').replace(/[^a-z_ \d.-]+/gi, '').trim().toLowerCase()

export const run = async () => {
  try {
    if (apt !== '') {

      const opts = '-o Acquire::Retries=3'
      let needUpdate  = true
      let needUpgrade = true

      if (/\b_update_\b/.test(apt)) {
        execSync(`sudo apt-get ${opts} -qy update`)
        apt = apt.replace(/\b_update_\b/gi, '').trim()
        needUpdate = false
      }

      if (/\b_dist-upgrade_\b/.test(apt)) {
        if (needUpdate) { execSync('sudo apt-get -qy update') }
        execSync(`sudo apt-get ${opts} -qy dist-upgrade`)
        needUpgrade = false
        apt = apt.replace(/\b_dist-upgrade_\b/gi, '').trim()
      }
      
      if (/\b_upgrade_\b/.test(apt)) {
        if (needUpgrade) {
          if (needUpdate) { execSync(`sudo apt-get ${opts} -qy update`) }
          execSync(`sudo apt-get ${opts} -qy upgrade`)
        }
        apt = apt.replace(/\b_upgrade_\b/gi, '').trim()
      }

      if (apt !== '') {
        execSync(`sudo apt-get ${opts} -qy --no-install-recommends install ${apt}`)
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
