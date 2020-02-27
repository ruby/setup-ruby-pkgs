'use strict';

const child_process = require('child_process')

const core = require('@actions/core')
const exec = require('@actions/exec')

// clean inputs
let apt = core.getInput('apt-get').replace(/[^a-z_ \d.-]+/gi, '').trim().toLowerCase()

// get Ruby info in one pass
let cmd = 'ruby -e "puts RUBY_PLATFORM, RUBY_ENGINE, RUBY_ENGINE_VERSION, RUBY_VERSION, RbConfig::CONFIG[%q[ruby_version]]"';
let [ rubyPlatform,
      rubyEngine,
      rubyEngineVersion,
      rubyVers,
      rubyABIVers ] = child_process.execSync(cmd).toString().trim().split(/\r?\n/)

export const run = async () => {
  try {
    // normal Actions TEMP/TMP settings use a short file pathname
    // unexpected errors may ocurr...
    core.exportVariable('TMPDIR', process.env.RUNNER_TEMP)
    
    if (apt !== '') {
      await exec.exec('sudo apt-get -qy update')

      if (apt.includes('_upgrade_')) {
        await exec.exec('sudo apt-get -qy dist-upgrade')
        apt = apt.replace(/_upgrade_/gi, '').trim()
      }

      if (apt !== '') {
        await exec.exec(`sudo apt-get -qy install ${apt}`)
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}
