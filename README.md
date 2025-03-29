
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


## Custom Theme Creation/Example

1. Create a file in the `themes` directory at

Windows `%appdata%/us.visualsource.rmcl/themes`

1. Give it the name of your theme. For example `blue.css`
2. Insert the follow contents into that file. Replace `blue` with the name of your theme.

```css
.dark[data-theme="blue"] {    
    --background: hsl(222.2 84% 4.9%);    
    --foreground: hsl(210 40% 98%);    
    --card: hsl(222.2 84% 4.9%);    
    --card-foreground: hsl(210 40% 98%);    
    --popover: hsl(222.2 84% 4.9%);    
    --popover-foreground: hsl(210 40% 98%);    
    --primary: hsl(217.2 91.2% 59.8%);    
    --primary-foreground: hsl(222.2 47.4% 11.2%);    
    --secondary: hsl(217.2 32.6% 17.5%);    
    --secondary-foreground: hsl(210 40% 98%);    
    --muted: hsl(217.2 32.6% 17.5%);    
    --muted-foreground: hsl(215 20.2% 65.1%);    
    --accent: hsl(217.2 32.6% 17.5%);    
    --accent-foreground: hsl(210 40% 98%);    
    --destructive: hsl(0 62.8% 30.6%);    
    --destructive-foreground: hsl(210 40% 98%);    
    --border: hsl(217.2 32.6% 17.5%);    
    --input: hsl(217.2 32.6% 17.5%);    
    --ring: hsl(224.3 76.3% 48%);    
    --chart-1: hsl(220 70% 50%);    
    --chart-2: hsl(160 60% 45%);    
    --chart-3: hsl(30 80% 55%);    
    --chart-4: hsl(280 65% 60%);    
    --chart-5: hsl(340 75% 55%);  
}
```

3. Resert the launcher.
4. Go to Settings -> System -> Apperance and Select theme.


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

