'use strict';

const child_process = require('child_process')

const run = () => {
  let runner = null
  let rubyPlatform = null
  let rubyEngine   = null

  let cmd = 'ruby -e "puts RUBY_PLATFORM, RUBY_ENGINE"';

  [ rubyPlatform,
    rubyEngine ] = child_process.execSync(cmd).toString().trim().split(/\r?\n/)

  if      ( rubyPlatform.includes('mingw') ) { runner = require('./mingw') }
  else if ( rubyPlatform.includes('mswin') ) { runner = require('./mswin') }

  if (runner) {
    runner.run()
  } else {
    return
  }
}

run()
