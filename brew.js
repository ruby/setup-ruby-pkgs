'use strict';

const child_process = require('child_process')

const core = require('@actions/core')
const exec = require('@actions/exec')

// clean inputs
let brew = core.getInput('brew').replace(/[^a-z_ \d.@-]+/gi, '').trim().toLowerCase()

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

    if (brew !== '') {
      await exec.exec('brew update')

      if (brew.includes('_upgrade_')) {
        await exec.exec('brew upgrade')
        brew = brew.replace(/_upgrade_/gi, '').trim()
      }
      
      if (brew !== '') {
        await exec.exec(`brew install ${brew}`)
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}
