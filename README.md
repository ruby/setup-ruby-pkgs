[ruby/setup-ruby]:https://github.com/ruby/setup-ruby

# setup-ruby-pkgs

Cross platform action that installs Ruby, along with tools and packages needed for compiling.

If you don't need any changes to tools or packages, please use [ruby/setup-ruby].

The action's inputs are shown below:

```yaml
- uses: MSP-Greg/setup-ruby-pkgs@v1
  with:
    ruby-version:
    apt:             # Ubuntu
    brew:            # macOS
    mingw:           # Windows mingw / mswin
    msys2:           #         mingw
    mswin:           # Windows mswin
    choco:           #         mswin
    vcpkg:           #         mswin
```

## Input Information

All inputs are optional.

### ruby-version:

Installs the Ruby version using the code from [ruby/setup-ruby].  The available versions can be found in its [README](https://github.com/ruby/setup-ruby/blob/master/README.md#supported-versions).

### apt: (Ubuntu)

List of packages to install.  Space delimited. Special options are `_update_` and `_upgrade_`.

### brew: (macOS)

List of packages to install.  Space delimited. Special options are `_update_` and `_upgrade_`.

### mingw: (Windows)

<dl>
  <dt><b>Ruby 2.4 & later</b></dt>
  <dd>List of MSYS2 MinGW packages to install.
    Space delimited.  The package prefix (<code>mingw-w64-x86_64-</code>) is not required.<br/>If <code>_upgrade_</code> is included in the input, all packages needed by the gcc tools are updated.<br/>If <code>openssl</code> is included, an appropriate package will be installed.
  </dd>
  <dt><b>Ruby 2.3 & earlier</b></dt>
  <dd>The following DevKit packages are available:
    <ul>
      <li>libffi-3.2.1</li>
      <li>openssl-1.0.2j</li>
      <li>ragel-6.7</li>
      <li>sqlite-3.7.15.2  (sqlite3)</li>
      <li>zlib-1.2.8</li>
    </ul>
  </dd>
  <dt><b>Ruby mswin</b></dt>
  <dd>If <code>openssl</code> is included, it will be installed for mswin as a convenience.<br/>Likewise, if <code>ragel</code> is included, the MSYS2 ragel package will be installed.
</dl>

### msys2: (Windows)

<dl>
  <dt><b>Ruby 2.4 & later</b></dt>
  <dd>List of MSYS2 packages to install.  Space delimited.  These are command line utilities, and are rarely needed.
  </dd>
  <dt><b>Ruby 2.3 & earlier</b></dt>
  <dd>No action, as no utilities are available for the older MSYS/DevKit.</dd>
</dl>

### mswin: (Windows)

Installs MSYS2 packages.  These are typically build utilities, such as bison, ragel, etc.  As in pacman, MinGW packages must be prefixed with `mingw-w64-x86_64-`.

### choco: (Windows)

List of packages to install.  Space delimited.  Most packages are compiled with msvc, so normally used with mswin builds.

### vcpkg: (Windows)

List of packages to install.  Space delimited.  All packages are compiled with msvc, so normally used with mswin builds.  An environment variable `OPT_DIR` is set to
```
--with-opt-dir=${process.env.VCPKG_INSTALLATION_ROOT}\\installed\\x64-windows
```

After install, the tools folder is checked, and if any files are present, it is added to path.

## Ruby and Windows

For additional information see [Ruby and Windows](Ruby_and_Windows.md)
