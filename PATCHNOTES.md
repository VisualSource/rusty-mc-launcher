# v0.10.0
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.10.0...v0.10.1](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.10.1...v0.10.1)

### Changes
 - Order completed queue items by date.

### Fixes
 - fix render bug in profile edit.
 - Fix bug [#34](https://github.com/VisualSource/rusty-mc-launcher/issues/34). profile fav list buttons not alighing correctly.
 - Fix bug [#33](https://github.com/VisualSource/rusty-mc-launcher/issues/33). Taost background not match theme.
 - Fix bug [#32](https://github.com/VisualSource/rusty-mc-launcher/issues/32). Modrinth modpack updater not setting profile loader version
 - Fix bug [#30](https://github.com/VisualSource/rusty-mc-launcher/issues/31). toast exiting too soon for new profiles.
 - Fix bug [#30](https://github.com/VisualSource/rusty-mc-launcher/issues/30). memory slider not displaying correctly

# v0.10.0
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.11...v0.10.0](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.11...v0.10.0)

### New 
- Launcher timeout

### Changes
- New Modrinth impl. 
- Updated javascript deps.
- Updated rust deps.
- Changes order of themes in settings.
- Disabled 'validate' in profile settings.
- Categories remember state
- Added fonts
- Profiles use 4GB by default.
- Show logs on crash
- Toast on profile installed.

### Fixes
- Fix reveal in dir.
- Fix invalid timestamps in download queue.
- Fix navigation menu bug.
- Fix typo in download queue.
- Fix copy profile.
- Fix profiles list not being invalidated on modpack install.
- Fix bug #26

# v0.9.11
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.10...v0.9.11](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.10...v0.9.11)

### Fixes
- Fix bug report

# v0.9.10
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.9...v0.9.10](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.9...v0.9.10)

### Changes
- New Bug reporting system.

### Fixes
- Fixed bug #27
- Fixed profile names being displayed incorrectly.
- Removed a console.log
- Fixed a few type errors.

# v0.9.9
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.8...v0.9.9](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.8...v0.9.9)

### Changes
- Changed how themes are defined.


# v0.9.8
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.7...v0.9.8](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.7...v0.9.8)

### Fixes
- Fixed failing client installs

# v0.9.7
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.5...v0.9.7](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.5...v0.9.7)

### New
- Added Modrinth modpacks installed from workshop to have a updater

### Changes
- Add timestamp to queue items

### Fixes
- Now fixed curseforge modpack imports

# v0.9.5
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.4...v0.9.5](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.4...v0.9.5)

### Changes
- Add deeplink checks
- Allow viewing patch notes when not logged in.

### Fixes
- Fix importing for curseforge modpack imports

# v0.9.4
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.2...v0.9.4](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.2...v0.9.4)

### Changes
- Changed format of modpack metadata

### Fixes
- Resloved isuse where content type could not be determined for content when importing a curseforge modpack.

### Other 
- Fixed github action

# v0.9.2
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.1...v0.9.2](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.1...v0.9.2)

### Fixes
- Fixed bug where download settings page does not load on fresh install.

# v0.9.1
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.0...v0.9.1](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.9.0...v0.9.1)

### Fixes
- Fixed bug where database was not able to be created on new fresh install.

# v0.9.0
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.8.7...v0.9.0](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.8.7...v0.9.0)

### New
- Theme system.
- Locked modpacks.
- Global options copy.

#### Changes
- Reworked Auth system.
- Upgrade shadcn components to use react 19 and tailwindcss v4.
- Render Optimizations.
- Add Last Played to profile page.
- Last played is now updated on starting profile.
- Failed queue items now display a toast on fail.
- Changed workshop search result card layout.
- Skin page now no longer shows user profiles list.
- Added drag handle on pages with profiles list.
- Reworked toast api and style.
- Updated ReadMe

#### Fixes
- Fixed bug where setting 'path.app' was not set on first init.
- Fixed bug where java install test was not checking the correct value.
- Fixed pagation layout shifts in workshop search
- Fixed download queue items visablity not beening set correctly

# v0.8.7
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.8.6...v0.8.7](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.8.6...v0.8.7)

#### Fixes
- Fix workshop search filter
- Fix app breaking bug [Issue 24](https://github.com/VisualSource/rusty-mc-launcher/issues/24)
- Fix layout movement in workshop search header

#### Changes
- Downgrade masl to 3.28.1 as v4 cache no longer persists across browser sessions 

# v0.8.6
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.8.4...v0.8.5](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.8.4...v0.8.6)

#### Fixes
- Fix Blur bug
- Fix workshop seach

# v0.8.4
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.8.2...v0.8.3](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.8.2...v0.8.4)

#### Fixes 
 - Fix build script
 - Fix border bug on windows 10

#### Changes
 - Upgrade tailwindcss to v4
 - Upgrade msal
 - Upgrade other deps

# v0.8.2
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.8.1...v0.8.2](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.8.1...v0.8.2)

#### New
- Curseforge project page

#### Changes 
- Add Window boarder patch
- Lazy load images

# v0.8.1
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.8.0...v0.8.1](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.8.0...v0.8.1)

#### Changes 
- Add toats to updates check btn
- Add loaders to update check btn
- Add disable when checking for updates after clicking btn

# v0.8.0
**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.7.3...v0.8.0](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.7.2...v0.8.0)

#### New
- Add Preconnect tags
- List Installed Java versions

#### Changes 
- Changed format of modrinth notifications.
- Added notice about modrinth login on account page.
- Updated tauri to v2.
- Use pnpm patch to patch masl.
- Center "No Screenshots!" text on profile screenshots page.
- Center profile icon on profile page.
- Update issuse reporter.
- Copying a profile now copies profile content
- Fix typo on download settings page of the "App Directory" description.
- Remove "Clear Cached Images" button on download settings page.
- Remove file path when listing installed minecraft versions in download settings page.
- Fix height on card in the Popular modpacks section on home page.
- Update react to v19
- Better game crash dialog

#### Fixes
- Fix Issue [21](https://github.com/VisualSource/rusty-mc-launcher/issues/21)

# v0.7.3

**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.6.4...v0.7.1](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.7.2...v0.7.3)

#### New
- Modrinth account notifications

#### Changes
- Updated Javascript deps
- Removed unused struct fields in rust laucher library
- Switched current queue item interval check from 60_000 ms to 30_000 ms

#### Fixes
- Fixed Modrinth account login
- Fixed Neoforge loader version select 'undefined' error
- Fixed Neoforge install
- Fixed Neoforge start
- Laucher lib now dedups libraries when inheriting

# v0.7.2

Fix version deployment

# v0.7.1

**Full Changelog**: [https://github.com/VisualSource/rusty-mc-launcher/compare/v0.6.4...v0.7.1](https://github.com/VisualSource/rusty-mc-launcher/compare/v0.6.4...v0.7.1)

#### New
- Added JVM args form control
- Added Crash Notice Dialog

#### Changes
- Update javascript deps
- No long bind logger at frontend startup

#### Fixes
- Fix stop process "no such column: id" error
- Fix play button being stuck in "Installing" state after install

# v0.7.0

**Full Changelog**: https://github.com/VisualSource/rusty-mc-launcher/compare/v0.6.4...v0.7.0

#### New
- Added Report bug form page
- Added Patch notes page
- Added MIT license file
- Added bug report template
- Added feature request template
- Added editable home page

#### Changes
- Change delay between installs from 30 sec to 5 sec
- Notifications list now displays content under title
- Update Tauri from 1.6.8 to 1.7.0
- Update javascript deps
- Update Rust deps
- Update Readme
- Dev only react dev tools script
- Update rust version 1.78.0 to 1.79.0
- Minor performance improvements

#### Fixes
- fix typo in curseforge modpack install error

# v0.6.4

**Full Changelog**: https://github.com/VisualSource/rusty-mc-launcher/compare/v0.6.3...v0.6.4

#### Fixes
- Fix release system

# Pre v0.6.4

**Full Changelog**: https://github.com/VisualSource/rusty-mc-launcher/compare/app-v0.1.0...v0.6.4

#### New

- Everything

#### Fixes

- Everything