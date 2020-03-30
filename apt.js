'use strict';

const core = require('@actions/core')

const { execSync } = require('./common')

// clean inputs
let apt = core.getInput('apt-get').replace(/[^a-z_ \d.-]+/gi, '').trim().toLowerCase()

export const run = async () => {
  try {
    if (apt !== '') {
      if (apt.includes('_update_')) {
        execSync('sudo apt-get -qy update')
        apt = apt.replace(/\b_update_\b/gi, '').trim()
      }
      
      if (apt.includes('_upgrade_')) {
        execSync('sudo apt-get -qy update')
        execSync('sudo apt-get -qy dist-upgrade')
        apt = apt.replace(/\b_upgrade_\b/gi, '').trim()
      }

      if (apt !== '') {
        execSync(`sudo apt-get -qy --no-install-recommends install ${apt}`)
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
