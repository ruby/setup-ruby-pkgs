# setup-ruby-pkgs

Cross platform action for Ruby CI that configures build tools and installs packages needed for compiling.

The action's input are shown below:

```yaml
- uses: MSP-Greg/setup-ruby-pkgs@v1
  with:
    ruby-version:
    apt:        # Ubuntu
    brew:       # macOS
    mingw:      # Windows mingw
    msys2:      #         mingw
    mswin:      # Windows mswin
    choco:      #         mswin
    vcpkg:      #         mswin
```

### Input Information

All inputs are optional.  If ruby-versions is used, the code for [ruby/setup-ruby](https://github.com/ruby/setup-ruby) is used.

#### apt (Ubuntu)

List of packages to install.  Space delimited. Special options are `_update_` and `_upgrade_`.

#### brew (macOS)

List of packages to install.  Space delimited. Special options are `_update_` and `_upgrade_`.


#### mingw (Windows)

List of MSYS2 MinGW packages to install.  Space delimited.  The package prefix (`mingw-w64-x86_64-`) is not required.  At present, only 64 bit Rubies and MSYS2 are available.

An input string of `_upgrade_` can be included, and will update all packages needed by the gcc tools.

TODO: add correct gcc update for Rubies built with older 9.2 and 8.3 gcc.

#### msys2 (Windows)

List of MSYS2 packages to install.  Space delimited.
