'use strict';

(async () => {
  const core = require('@actions/core')
  const { performance } = require('perf_hooks')

  const common = require('./common')

  const platform = require('os').platform()

  let ref = core.getInput('setup-ruby-ref')
  if (ref === '') { ref = 'ruby/setup-ruby/v1' }

  let rubyInfo
  let timeSt
  let doBundler = false

  const timeEnd = (msSt) => {
    const timeStr = ((performance.now() - msSt)/1000).toFixed(2).padStart(6)
    console.log(`  took ${timeStr} s`)
  }

  try {

    core.exportVariable('TMPDIR', process.env.RUNNER_TEMP)
    core.exportVariable('CI'    , 'true')

    const pkgs = async (ri) => {
      rubyInfo = ri
      timeEnd(timeSt)
      common.log(`  —————————————————— Package tasks using: MSP-Greg/setup-ruby-pkgs ${common.version}`)
      // console.log(rubyInfo)
      let runner
      let ruby

      switch (platform) {
        case 'linux':
          runner = require('./apt')  ; break
        case 'darwin':
          runner = require('./brew') ; break
        case 'win32':
          ruby = common.ruby()

          if      ( ruby.platform.includes('mingw') ) { runner = require('./mingw') }
          else if ( ruby.platform.includes('mswin') ) { runner = require('./mswin') }

          if (runner) { runner.setRuby(ruby) }  // pass Ruby info to runner
      }

      if (runner) { await runner.run() }

      if ((core.getInput('bundler')       !== 'none') ||
          (core.getInput('bundler-cache') === 'true')) {
        doBundler = true
        timeSt = performance.now()
        common.log(`  —————————————————— Bundler tasks using: ${ref}`)
      }
    }

    timeSt = performance.now()

    if (core.getInput('ruby-version') !== 'none') {
      const fn = `${process.env.RUNNER_TEMP}\\setup_ruby.js`
      common.log(`  ——————————————————    Ruby tasks using: ${ref}`)
      await common.download(`https://raw.githubusercontent.com/${ref}/dist/index.js`, fn, false)
      // pass pkgs function to setup-ruby, allows package installation before
      // 'bundle install' but after ruby setup (install, paths, compile tools, etc)
      await require(fn).setupRuby({afterSetupPathHook: pkgs})
      if (doBundler) { timeEnd(timeSt) }
    } else {
      // install packages if setup-ruby is not used
      await pkgs()
    }
  } catch (e) {
    console.log(`::error::${e.message}`)
    process.exitCode = 1
  }
})()
