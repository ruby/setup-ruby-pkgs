[MSYS2]:https://github.com/msys2
[ruby/setup-ruby]:https://github.com/ruby/setup-ruby

# Ruby and Windows

This document is intended to provide information on Windows Ruby builds that may help with Windows CI problems.

Problems are most likely to occur with gems/repos that require compiling.  They may also occur when installing dependencies that require compiling.

Much of the below information is general, and may also help with users having problems locally.

## A few specifics

Unlike Ubuntu and macOS, standard Windows does not have native compiling tools, nor does it have package libraries.

* Because of this, Windows Rubies are self-contained.  All non-system runtime dlls are packaged with each build, but their lib and header files are not included.

  For example, if one has both Ruby 2.4 and Ruby 2.7 installed, 2.4 will use its bundled OpenSSL 1.0.2 dlls, and 2.7 will use its bundled OpenSSL 1.1.1 dlls.  Both can be running at the same time.

* Standard Windows Rubies (`RUBY_PLATFORM.include? 'mingw'` is true) are built with either MSYS or [MSYS2](https://github.com/msys2) build tools and packages, and are often referred to as 'mingw' builds.  These are available in both 32 and 64 bit builds, but only 64 bit builds are available on GitHub Actions.

* Ruby mswin builds (`RUBY_PLATFORM.include? 'mswin'` is true) are built with the Microsoft Visual C tools.  The [ruby/ruby](https://github.com/ruby/ruby) repo runs CI on mswin builds, and several of the stdlib repos do the same.

* Ruby MinGW builds and mswin builds use different versions of Microsoft Visual C.  MinGW builds have a dependency on `msvcrt.dll`, while mswin builds have a dependency on `vcruntime140.dll`.  Because of this, the compiled code is not compatible.

* All builds from 2.4 and later use a Windows specific mechanism for finding dll's (known simply as 'manifest').  The dlls are located in `bin/ruby_builtin_dlls`.  The manifest places them first in the 'lookup resolution'.  Hence, testing against a specific dll version requires adjustments.

## MinGW builds - general info

What is DevKit?  You may have seen `-rdevkit` or `require 'devkit'` in scripts for Windows Ruby CI.  The term 'devkit' is also used to refer to the collection of build tools used to compile both MinGW Ruby and extension gems.  So, one might see the phrase 'have you installed devkit?'.  As above, the file that 'activates' the devkit thru ENV settings is named `devkit.rb`.

### Ruby 2.4 & later

Compiled with a set of gcc tools that are part of [MSYS2].  [MSYS2] is independent of Ruby and includes four general categories: a set of bash tools (tar, sed, grep, etc), a set of compiler tools (gcc, llvm, cmake, etc), a set of library packages (libffi, openssl, zlib, etc), and applications/languages (git, perl, python, imagemagick, inkscape, etc).

### Ruby 2.3 & earlier

Compiled with a set of gcc tools known as MSYS.  MSYS is no longer supported and a limited number of packages are available.  The MSYS build tools 'devkit' was packaged by the group that built the Rubies.

### Build Tool Activation

[ruby/setup-ruby] adds all `ENV` information required to use the correct set of build tools.  Most of the below information is general background that pertains to local use.

* MinGW Rubies include a file named `devkit.rb`.  Requiring it adds the build tools' locations to Path.  For CI, the locations are added by [ruby/setup-ruby].

* MinGW Rubies also include a file `rubygems/defaults/operating_system.rb`, which essentially performs the same function as `devkit.rb`.  When a gem needs to be compiled, it adds the builds tools to `ENV`.  It also adds the locations of the devkit package dlls to the dll library 'lookup resolution' chain.  This is done with a Windows specific system call.

* The MSYS build tools used in older MinGW Rubies was a proprietary package.  The code to generate `devkit.rb` was contained in it, and the location of the tools was hard coded by the install.

* In newer MinGW Rubies, `devkit.rb` and `operating_system.rb` are included in the Ruby build and use vendored code to determine the [MSYS2] location.  One can install [MSYS2] independent of Ruby and `devkit.rb` and `operating_system.rb` will still find it.


## MinGW builds - gcc compatibility

Many Windows CI providers only have the most recent Ruby patch/teeny versions installed.  With GitHub Actions and [ruby/setup-ruby], all Windows versions from Ruby 2.4 and later are available.  There may be compatibility issues when using a current MSYS2 gcc with older Ruby patch versions.

| gcc \\ ruby |  2.4   |  2.5   |  2.6   |  2.7   | master |
|  :---:      | :---   | :---   | :---   |  :---  | :---:  |
| **6.3.0-3** | 2.4.1  |        |        |        |        |
| **7.2.0-1** | 2.4.2  |        |        |        |        |
|             | 2.4.3  |        |        |        |        |
| **7.2.0-2** |        | 2.5.0  |        |        |        |
| **7.3.0-1** | 2.4.4  | 2.5.1  |        |        |        |
| **8.2.0-3** | 2.4.5  | 2.5.3  |        |        |        |
| **8.2.1-1** |        |        | 2.6.0  |        |        |
|             |        |        | 2.6.1  |        |        |
| **8.3.0-2** | 2.4.6  | 2.5.5  | 2.6.2  |        |        |
|             |        |        | 2.6.3  |        |        |
| **9.2.0-1** | 2.4.7  | 2.5.6  | 2.6.4  |        |        |
| **9.2.0-2** | 2.4.9  | 2.5.7  | 2.6.5  | 2.7.0  |        |
| **9.3.0-1** | 2.4.10 | 2.5.8  | 2.6.6  | 2.7.1  | mingw  |

## Windows OpenSSL

The following lists the OpenSSL versions used for the most recent release:

|   Ruby    | OpenSSL | Compiler  |
|   :---:   |  :---:  |  :---:    |
| **2.2**   | 1.0.2j  | MSYS gcc  |
| **2.3**   | 1.0.2j  | MSYS gcc  |
| **2.4**   | 1.0.2u  | MSYS2 gcc |
| **2.5**   | 1.1.1f  | MSYS2 gcc |
| **2.6**   | 1.1.1f  | MSYS2 gcc |
| **2.7**   | 1.1.1f  | MSYS2 gcc |
| **mingw** | 1.1.1f  | MSYS2 gcc |
| **mswin** | 1.1.1f  | msvc      |

On the mswin platform, `openssl` can used in either the `mingw:` input or the `choco:` input, both will install an msvc OpenSSL build.

When `openssl` is included, the correct OpenSSL version (based on the Ruby version and platform) will be installed.  For the mswin platform, the environment variable `SSL_DIR` is set to the following, which is the location of the msvc OpenSSL package:
```
--with-openssl-dir=C:\openssl-win
```
