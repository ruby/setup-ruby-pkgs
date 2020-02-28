'use strict';

const cp = require('child_process')

// get Ruby info in one pass
const ruby = (() => {
  let map = {}
  let ary = ['platform', 'engine', 'engineVersion', 'vers', 'abiVers' ]
  let cmd = 'ruby -e "puts RUBY_PLATFORM, RUBY_ENGINE, (Object.const_defined?(:RUBY_ENGINE_VERSION) ? RUBY_ENGINE_VERSION : nil), RUBY_VERSION, RbConfig::CONFIG[%q[ruby_version]]"';
  cp.execSync(cmd).toString().trim().split(/\r?\n/).forEach( (v,i) => {
    map[ary[i]]  = v
  })
  return map
})()

const execSync = (cmd) => cp.execSync(cmd, {stdio: ['ignore', 'inherit', 'ignore']})

module.exports = { ruby, execSync }