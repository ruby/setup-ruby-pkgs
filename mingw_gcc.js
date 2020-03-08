const gcc = {
  '9.2.0-2': [
    'expat-2.2.9-1',
    'libiconv-1.16-1',
    'zlib-1.2.11-7',
    'binutils-2.34-1',
    'headers-git-8.0.0.5647.1fe2e62e-1',
    'crt-git-8.0.0.5647.1fe2e62e-1',
    'dlfcn-1.2.0-1',
    'gmp-6.2.0-1',
    'isl-0.22.1-1',
    'libwinpthread-git-8.0.0.5574.33e5a2ac-1',
    'make-4.3-1',
    'mpc-1.1.0-1',
    'mpfr-4.0.2-2',
    'windows-default-manifest-6.4-3',
    'winpthreads-git-8.0.0.5574.33e5a2ac-1',
    'gcc-libs-9.2.0-2',
    'gcc-9.2.0-2'
  ]
}

export const run = async (rubyVers) => {
  const fs   = require('fs')
  const core = require('@actions/core')
  const { download, execSync } = require('./common')
  
  const uriBase = 'https://github.com/MSP-Greg/ruby-msys2-package-archive/releases/download'
  const pre64   = 'mingw-w64-x86_64-'
  const suff    = '-any.pkg.tar.xz'
  const args    = '--noconfirm --noprogressbar --needed'

  let gccFiles
  let uri
  
  if (rubyVers > '2.0') {
    gccFiles = gcc['9.2.0-2']
    uri = `${uriBase}/gcc-9.2.0-2`
  }
  const dir = `${process.env.RUNNER_TEMP}\\msys2_gcc`
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // download gcc files from release
  const len = gccFiles.length
  for (let i = 0; i < len; i++) {
    let f = `${pre64}${gccFiles[i]}${suff}`
    await download(`${uri}/${f}`    , `${dir}\\${f}`)
    await download(`${uri}/${f}.sig`, `${dir}\\${f}.sig`)
    console.log(`downloaded ${f}`)
  } 

  const cwd = process.cwd()

  // install gcc files
  while (gccFiles.length !== 0) {
    let pkgs = `${pre64}${gccFiles.shift()}${suff}`
    let i = 1
    // run six files at a time
    do {
      if (gccFiles.length > 0) {
        pkgs += ` ${pre64}${gccFiles.shift()}${suff}`
        i ++
      } else { break }
    } while (i < 6)
    console.log(`pacman.exe -Udd ${args} ${pkgs}`)

    try {
      process.chdir(dir)
      execSync(`pacman.exe -Udd ${args} ${pkgs}`)
      process.chdir(cwd)
    } catch (error) {
      process.chdir(cwd)
      core.setFailed(error.message)
    }
  }
}