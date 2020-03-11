'use strict';

(async () => {
  const core = require('@actions/core')

  const common = require('./common')

  const platform = require('os').platform()

  try {
    if (core.getInput('ruby-version') !== '') {
      const fn = `${process.env.RUNNER_TEMP}\\setup_ruby.js`
      await common.download('https://raw.githubusercontent.com/MSP-Greg/ruby-setup-ruby/v1exp/dist/index.js', fn)
      await require(fn).run()
    }

    let runner

    core.exportVariable('TMPDIR', process.env.RUNNER_TEMP)
    core.exportVariable('CI'    , 'true')

    if      ( platform === 'linux' )              { runner = require('./apt'  ) }
    else if ( platform === 'darwin')              { runner = require('./brew' ) }
    else if (platform === 'win32'  ) {
      const ruby = common.ruby()
      if      ( ruby.platform.includes('mingw') ) { runner = require('./mingw') }
      else if ( ruby.platform.includes('mswin') ) { runner = require('./mswin') }
      // pass Ruby props to runner
      if (runner) { runner.setRuby(ruby) }
      
      // choco, vcpkg, etc
    }

    if (runner) { await runner.run() }
    
    console.log(`*** Using Image ${process.env.ImageOS} / ${process.env.ImageVersion}`)
    

  } catch (error) {
    core.setFailed(error.message)
  }
})()
