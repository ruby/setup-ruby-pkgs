'use strict';

const main = async () => {
  const core = require('@actions/core')
  const tc   = require('@actions/tool-cache')

  const platform = require('os').platform()

  try {
    const dl = await tc.downloadTool('https://raw.githubusercontent.com/MSP-Greg/ruby-setup-ruby/test/dist/index.js')
    await require(dl).run()

    let runner

    const { ruby } = require('./common')

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

main()
