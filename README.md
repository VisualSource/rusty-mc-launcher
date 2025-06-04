
![Logo](./public/logo.svg)


# Rusty Minecraft Launcher

Rusty Minecraft Launcher is a Minecraft Client launcher and a simple one click mod installer.


![GitHub License](https://img.shields.io/github/license/VisualSource/rusty-mc-launcher?style=flat-square)![GitHub Release](https://img.shields.io/github/v/release/VisualSource/rusty-mc-launcher?include_prereleases&style=flat-square) ![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/VisualSource/rusty-mc-launcher/publish.yml?style=flat-square)

## Features

- Installable clients
  - [x] Vanilla
  - [x] Forge
  - [x] Neoforge
  - [x] Fabric
  - [x] Quilt
- Profile Support
  - [x] Import profiles from offical launcher
  - [ ] Export profiles to offical launcher
- Modpacks
  - [x] One click Install (modrinth)
  - [x] Import curseforge Modpack
  - [ ] Auto update (modrinth)
- Mods
  - [x] One Click Install (modrinth)
  - [ ] Auto update
- Accounts
  - [x] Multi microsoft account
  - [x] Modrinth account

- Custom themes

## Patch Notes

See `PATCHNOTES.md` or view in app from 
  View -> Patch Notes

## Installation

Click [here](https://github.com/VisualSource/rusty-mc-launcher/releases/latest) or click the releases section and download the installer for your platform.
    
## Feedback

If you have any feedback, create a github issue for any suggestions or features that you would think would benefit this project.


## Contributing

Contributions are always welcome!

See `contributing.md` for ways to get started.

Please adhere to this project's `code of conduct`.

## Themes

See [Theme](./docs/theme.md) Docs


## Run Locally

Clone the project

```bash
  git clone https://github.com/VisualSource/rusty-mc-launcher
```

Go to the project directory

```bash
  cd rusty-mc-launcher
```

Install dependencies

```bash
  pnpm install
```

Create a .env.development file add the following varaiables

- VITE_CLIENT_ID
    - Microsoft TenentId
- VITE_AUTHORITY
    - Microsoft authority id
- VITE_MODRINTH_CLIENT_ID
    - Modrinth application id
- VITE_MODRINTH_SCOPES
    - Scope for modrinth application. Default 'NOTIFICATION_READ+NOTIFICATION_WRITE+USER_READ+USER_WRITE'
- VITE_MODRINTH_CLIENT_SECRET
- VITE_GITHUB
- VITE_GITHUB_API_VERSION
    - Version of git api. Example '2022-11-28'
Start the application

```bash
  pnpm tauri dev
```


## Acknowledgements
 - [Mojang API Documentation](https://mojang-api-docs.gapple.pw/)
 - [minecraft-launcher-lib (Python)](https://codeberg.org/JakobDev/minecraft-launcher-lib)
 - [Modrinth](https://modrinth.com/)
 - [Modrinth Theseus](https://github.com/modrinth/theseus)
 - [CFWidget](https://cfwidget.com/)


## Authors

- [VisualSource](https://www.github.com/VisualSource)

