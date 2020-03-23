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
  // make sure the folder exists
  if (!fs.existsSync(path.dirname(dest))) {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
  }

  console.log(`[command]Downloading:\n  ${uri}`)

  const http = new httpc.HttpClient('MSP-Greg', [], {
    allowRetries: true,
    maxRetries: 3
  })

  const msg = (await http.get(uri)).message

  return new Promise ( (resolve, reject) => {
    if (msg.statusCode !== 200) {
      const errMsg = `Failed to download from:\n  ${uri}\n` +
                     `  StatusCode: ${msg.statusCode}  Message: ${msg.statusMessage}`
      reject(new Error(errMsg))
    }

    const file = fs.createWriteStream(dest)

    file.on('open', async () => {
      try {
        const stream = msg.pipe(file)
        stream.on('close', () => {
          resolve(dest)
        })
      } catch (err) {
        const errMsg = `Failed to download from:\n  ${uri}\n` +
                       `  StatusCode: ${msg.statusCode}  Message: ${msg.statusMessage}\n  Error: ${err.message}`
        reject(new Error(errMsg))
      }
    })
    file.on('error', err => {
      file.end()
      reject(err)
    })
  })
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
