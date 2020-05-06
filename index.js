'use strict';

(async () => {
  const core = require('@actions/core')

  const { performance } = require('perf_hooks')

  const common = require('./common')

  const platform = require('os').platform()

  try {
    const msgPre = 'Image info: https://github.com/actions/virtual-environments/tree/' +
                   `${process.env.ImageOS}/${process.env.ImageVersion}`
    switch (platform) {
      case 'linux':
        console.log(`${msgPre}/images/linux`)
        break;
      case 'win32':
        console.log(`${msgPre}/images/win`)
        break;
      case 'darwin':
        console.log('See https://github.com/actions/virtual-environments/commits/master/images/macos')
        console.log(`Using Image ${process.env.ImageOS} / ${process.env.ImageVersion}`)
        break;
      default:
        console.log(`Using Image ${process.env.ImageOS} / ${process.env.ImageVersion}`)
    }

    if (core.getInput('ruby-version') !== '') {
      const fn = `${process.env.RUNNER_TEMP}\\setup_ruby.js`
      common.log('  Running ruby/setup-ruby')
      console.log(`  pwd: ${process.cwd()}`)
      const msSt = performance.now()
      await common.download('https://raw.githubusercontent.com/ruby/setup-ruby/v1/dist/index.js', fn, false)
      await require(fn).run()
      const timeStr = ((performance.now() - msSt)/1000).toFixed(2).padStart(6)
      console.log(`  took ${timeStr} s`)
    }

    common.log(`  Running MSP-Greg/setup-ruby-pkgs ${common.version}`)

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
