'use strict';

const core = require('@actions/core')

const { execSync, grpSt, grpEnd, getInput } = require('./common')

// group start time
let msSt

export const run = async () => {
  try {
    // clean input
    let apt = getInput('apt-get')

    if (apt !== '') {

      // fix for server timeout issues
/*      msSt = grpSt('apt-get server fix')
 *      apt += ' _update_'
 *      execSync(`sudo sed -i 's/azure\\.//' /etc/apt/sources.list`)
 *      grpEnd(msSt)
 */

      const opts = '-o Acquire::Retries=3'
      let needUpdate  = true
      let needUpgrade = true

//      if (/\b_update_\b/.test(apt)) {
        msSt = grpSt('apt-get update')
        execSync(`sudo apt-get ${opts} -qy update`)
        grpEnd(msSt)
        apt = apt.replace(/\b_update_\b/gi, '').trim()
        needUpdate = false
//      }

      if (/\b_dist-upgrade_\b/.test(apt)) {
        msSt = grpSt('apt-get dist-upgrade')
        if (needUpdate) { execSync('sudo apt-get -qy update') }
        execSync(`sudo apt-get ${opts} -qy dist-upgrade`)
        grpEnd(msSt)
        needUpgrade = false
        apt = apt.replace(/\b_dist-upgrade_\b/gi, '').trim()
      }
      
      if (/\b_upgrade_\b/.test(apt)) {
        if (needUpgrade) {
          msSt = grpSt('apt-get upgrade')
          if (needUpdate) { execSync(`sudo apt-get ${opts} -qy update`) }
          execSync(`sudo apt-get ${opts} -qy upgrade`)
        grpEnd(msSt)
        }
        apt = apt.replace(/\b_upgrade_\b/gi, '').trim()
      }

      if (apt !== '') {
        msSt = grpSt(`apt-get ${apt}`)
        execSync(`sudo apt-get ${opts} -qy --no-install-recommends install ${apt}`)
        grpEnd(msSt)
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
