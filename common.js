'use strict';

const cp = require('child_process')
const fs = require('fs')
const path  = require('path')
const core  = require('@actions/core')
const httpc = require('@actions/http-client')

const blu = '\x1b[94m'                     // eslint-disable-line no-unused-vars
const yel = '\x1b[33m'                     // eslint-disable-line no-unused-vars
const rst = '\x1b[0m'                      // eslint-disable-line no-unused-vars

export const download = async (uri, dest) => {
  if (!fs.existsSync(path.dirname(dest))) {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
  }

  console.log(`[command]Downloading:\n  ${uri}`)

  const http = new httpc.HttpClient('MSP-Greg', [], {
    allowRetries: true,
    maxRetries: 3
  })

  // eslint-disable-next-line no-async-promise-executor
  return new Promise (async (resolve, reject) => {
    const response = await http.get(uri)
    if (response.message.statusCode !== 200) {
      const msg = `Failed to download from:\n  ${uri}\n  Code: ${response.message.statusCode}\n  Message: ${response.message.statusMessage}`
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
        const msg = `Failed to download from:\n  ${uri}\n  Code: ${response.message.statusCode}\n  Message: ${response.message.statusMessage}\n  Error: ${err.message}`
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

export const execSync = (cmd) => {
  console.log(`[command]${cmd}`)
  cp.execSync(cmd, {stdio: ['ignore', 'inherit', 'inherit']})
}

export const getInput = (name) => core.getInput(name).replace(/[^a-z_ \d.-]+/gi, '').trim().toLowerCase()
