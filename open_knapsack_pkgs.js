'use strict';

const baseUri = 'https://github.com/MSP-Greg/ruby-msys2-package-archive/releases/download/ri-msys-pkgs'

const baseSuf64 = 'x64-windows.tar.lzma'

export const old_pkgs = {
  'gdbm'    : `${baseUri}/gdbm-1.8.3-${baseSuf64}`,
  'libffi'  : `${baseUri}/libffi-3.2.1-${baseSuf64}`,
  'libiconv': `${baseUri}/libiconv-1.14-${baseSuf64}`,
  'libiyaml': `${baseUri}/libyaml-0.1.7-${baseSuf64}`,
  'openssl' : `${baseUri}/openssl-1.0.2j-${baseSuf64}`,
  'ragel'   : `${baseUri}/ragel-6.7-${baseSuf64}`,
  'sqlite3' : `${baseUri}/sqlite-3.7.15.2-${baseSuf64}`,
  'zlib'    : `${baseUri}/zlib-1.2.8-${baseSuf64}`
}
