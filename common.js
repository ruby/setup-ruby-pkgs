'use strict';

const cp = require('child_process')
const fs    = require('fs')
const httpc = require('@actions/http-client')

export const download = async (url, dest) => {
  const http = new httpc.HttpClient('MSP-Greg', [], {
    allowRetries: true,
    maxRetries: 3
  })

  return new Promise (async (resolve, reject) => {
    const response = await http.get(url)
    if (response.message.statusCode !== 200) {
      const msg = `Failed to download from:\n  ${url}\n  Code: ${response.message.statusCode}\n  Message: ${response.message.statusMessage}`
      reject(new Error(msg))
    }
    
    const file = fs.createWriteStream(dest)

    file.on('open', async () => {
      try {
        const stream = response.message.pipe(file)
        stream.on('close', () => {
          resolve(dest)
        })
      } catch (err) {
        const msg = `Failed to download from:\n  ${url}\n  Code: ${response.message.statusCode}\n  Message: ${response.message.statusMessage}\n  Error: ${err.message}`
        reject(new Error(msg))

      }
    })
    file.on('error', err => {
      file.end()
      reject(err)
    })
  }).catch( err => console.error(err) )
}

// get Ruby info in one pass
export const ruby = () => {
  let map = {}
  let ary = ['platform', 'engine', 'engineVersion', 'vers', 'abiVers' ]
  let cmd = 'ruby -e "puts RUBY_PLATFORM, RUBY_ENGINE, (Object.const_defined?(:RUBY_ENGINE_VERSION) ? RUBY_ENGINE_VERSION : nil), RUBY_VERSION, RbConfig::CONFIG[%q[ruby_version]]"';
  cp.execSync(cmd).toString().trim().split(/\r?\n/).forEach( (v,i) => {
    map[ary[i]]  = v
  })
  return map
}

export const execSync = (cmd) => cp.execSync(cmd, {stdio: ['ignore', 'inherit', 'ignore']})
