'use strict';

(async () => {
  const core = require('@actions/core')

  const common = require('./common')

  const platform = require('os').platform()

  try {
    if (platform !== 'darwin') {
      console.log(`Image tag: https://github.com/actions/virtual-environments/tree/${process.env.ImageOS}/${process.env.ImageVersion}`)
    } else {
      console.log(`Using Image ${process.env.ImageOS} / ${process.env.ImageVersion}`)
    }

    if (core.getInput('ruby-version') !== '') {
      const fn = `${process.env.RUNNER_TEMP}\\setup_ruby.js`
      await common.download('https://raw.githubusercontent.com/ruby/setup-ruby/v1/dist/index.js', fn)
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

      if (runner) { runner.setRuby(ruby) }  // pass Ruby info to runner
    }

    if (runner) { await runner.run() }

  } catch (e) {
    console.log(`::error::${e.message}`)
    process.exitCode = 1
  }
})()
