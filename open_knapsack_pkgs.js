'use strict';

const baseUri = 'https://dl.bintray.com/oneclick/OpenKnapsack/x64'

const baseSuf64 = 'x64-windows.tar.lzma'

export const old_pkgs = {
  'libffi'  : `${baseUri}/libffi-3.2.1-${baseSuf64}`,
  'openssl' : `${baseUri}/openssl-1.0.2j-${baseSuf64}`,
  'ragel'   : `${baseUri}/ragel-6.7-${baseSuf64}`,
  'sqlite3' : `${baseUri}/sqlite-3.7.15.2-${baseSuf64}`,
  'zlib'    : `${baseUri}/zlib-1.2.8-${baseSuf64}`
}
