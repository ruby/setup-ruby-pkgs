[ruby/setup-ruby]:https://github.com/ruby/setup-ruby
[README]:https://github.com/ruby/setup-ruby/blob/master/README.md
[action.yml]:https://github.com/ruby/setup-ruby/blob/master/action.yml

# setup-ruby-pkgs

Cross platform action that installs Ruby, along with tools and packages needed for compiling.

If you don't need any changes to tools or packages, please use [ruby/setup-ruby].

The action's inputs are shown below:

```yaml
- uses: ruby/setup-ruby-pkgs@v1
  with:
    ruby-version:      # passed to ruby/setup-ruby
    bundler:           #   "    "   "     "    "
    bundler-cache:     #   "    "   "     "    "
    cache-version:     #   "    "   "     "    "
    rubygems:          #   "    "   "     "    "
    working-directory: #   "    "   "     "    "
    apt:               # Ubuntu
    brew:              # macOS
    mingw:             # Windows mingw / mswin /ucrt
    msys2:             #         mingw / mswin /ucrt
    mswin:             # Windows mswin
    choco:             #         mswin
    vcpkg:             #         mswin
```

## Input Information

Information on inputs passed to [ruby/setup-ruby] is contained in its [README] and
[action.yml] files.

All inputs are optional.

### apt: (Ubuntu)

List of packages to install.  Space delimited. Special options are `_update_`, `_upgrade_`, and `_dist-upgrade_`.

If `_upgrade_` or `_dist-upgrade_` are included, `_update_` will also be done.

If neither is included and you're just installing  package(s), `_update_` WILL NOT BE DONE unless it's included.


### brew: (macOS)

List of packages to install.  Space delimited. Special options are `_update_` and `_upgrade_`, and both work similar to `apt-get:`.

### mingw: (Windows)

* **Ruby 2.4 & later**<br/>
  List of MSYS2 MinGW packages to install.<br/>
  Space delimited.  The package prefix (`mingw-w64-x86_64-` or `mingw-w64-ucrt-x86_64-`) is not required.<br/>If `_upgrade_` is included in the input, all packages needed by the gcc tools are updated.<br/>If `openssl` is included, an appropriate package will be installed.

* **Ruby 2.3 & earlier**<br/>
  The following DevKit packages are available:<br/>
    * libffi-3.2.1
    * openssl-1.0.2j
    * ragel-6.7
    * sqlite-3.7.15.2  (sqlite3)</li>
    * zlib-1.2.8

* **Ruby mswin**<br/>
  If `openssl` is included, it will be installed for mswin as a convenience.<br/>Likewise, if `ragel` is included, the MSYS2 ragel package will be installed.
</dl>

### msys2: (Windows)

* **Ruby 2.4 & later**<br/>
  List of MSYS2 packages to install.  Space delimited.  These are command line utilities, and are rarely needed.

* **Ruby 2.3 & earlier**<br/
  No action, as no utilities are available for the older MSYS/DevKit.</dd>

### mswin: (Windows)

Installs MSYS2 packages.  These are typically build utilities, such as bison, ragel, etc.  As in pacman, MinGW packages must be prefixed with `mingw-w64-x86_64-`.

### choco: (Windows)

List of packages to install.  Space delimited.  Most packages are compiled with msvc, so normally used with mswin builds.

### vcpkg: (Windows)

List of packages to install.  Space delimited.  All packages are compiled with msvc, so normally used with mswin builds.  An environment variable `OPT_DIR` is set to
```ruby
"--with-opt-dir=#{ENV['VCPKG_INSTALLATION_ROOT']}/installed/x64-windows"
```

After install, the tools folder is checked, and if any files are present, it is added to path.

## Ruby and Windows

For additional information see [Ruby and Windows](Ruby_and_Windows.md)
