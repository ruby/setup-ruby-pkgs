'use strict';

const core = require('@actions/core')

const { execSync } = require('./common')

// clean inputs
let apt = core.getInput('apt-get').replace(/[^a-z_ \d.-]+/gi, '').trim().toLowerCase()

export const run = async () => {
  let needUpdate = true
  try {
    if (apt !== '') {
      
      if (apt.includes('_upgrade_')) {
        execSync('sudo apt-get -qy update')
        needUpdate = false
        execSync('sudo apt-get -qy dist-upgrade')
        apt = apt.replace(/\b_upgrade_\b/gi, '').trim()
      }

      if (apt !== '') {
        if (needUpdate) { execSync('sudo apt-get -qy update') }
        execSync(`sudo apt-get -qy --no-install-recommends install ${apt}`)
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
