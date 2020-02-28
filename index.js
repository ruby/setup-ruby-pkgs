'use strict';

const run = () => {
  const { ruby } = require('./common')
  const core     = require('@actions/core')

  const platform = require('os').platform()

  try {
    let runner

    if      ( platform === 'linux' )            { runner = require('./apt'  ) }
    else if ( platform === 'darwin')            { runner = require('./brew' ) }
    else if ( ruby.platform.includes('mingw') ) { runner = require('./mingw') }
    else if ( ruby.platform.includes('mswin') ) { runner = require('./mswin') }

    if (platform === 'win32') {
      // choco, vcpkg, etc
    }

    if (runner) {
      runner.run()
    } else {
      return
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
