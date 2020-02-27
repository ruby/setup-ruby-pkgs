'use strict';

const child_process = require('child_process')

const run = () => {
  let runner = null
  let rubyPlatform = null
  let rubyEngine   = null

  let cmd = 'ruby -e "puts RUBY_PLATFORM, RUBY_ENGINE"';

  [ rubyPlatform,
    rubyEngine ] = child_process.execSync(cmd).toString().trim().split(/\r?\n/)

  if (rubyEngine === 'ruby') {
         if ( rubyPlatform.includes('linux' ) ) { runner = require('./apt' ) }
    else if ( rubyPlatform.includes('darwin') ) { runner = require('./brew' ) }
    else if ( rubyPlatform.includes('mingw' ) ) { runner = require('./mingw') }
    else if ( rubyPlatform.includes('mswin' ) ) { runner = require('./mswin') }
  } else {
    return
  }

  if (runner) {
    runner.run()
  } else {
    return
  }
}

run()
