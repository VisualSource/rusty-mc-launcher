
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
2. Insert the follow contents into that file. 
```css
.config {
  --name: REPLACE_WITH_THEME_NAME
  --id: REPLACE_WITH_THEME_ID
}

:root {
  --background: oklch(0.95 0.01 197.01);
  --foreground: oklch(0.38 0.06 212.66);
  --card: oklch(0.97 0.01 197.07);
  --card-foreground: oklch(0.38 0.06 212.66);
  --popover: oklch(0.97 0.01 197.07);
  --popover-foreground: oklch(0.38 0.06 212.66);
  --primary: oklch(0.56 0.09 203.28);
  --primary-foreground: oklch(1.00 0 0);
  --secondary: oklch(0.92 0.02 196.84);
  --secondary-foreground: oklch(0.38 0.06 212.66);
  --muted: oklch(0.93 0.01 196.97);
  --muted-foreground: oklch(0.54 0.06 201.57);
  --accent: oklch(0.90 0.03 201.89);
  --accent-foreground: oklch(0.38 0.06 212.66);
  --destructive: oklch(0.57 0.19 25.54);
  --destructive-foreground: oklch(1.00 0 0);
  --border: oklch(0.89 0.02 204.41);
  --input: oklch(0.92 0.02 196.84);
  --ring: oklch(0.56 0.09 203.28);
  --chart-1: oklch(0.56 0.09 203.28);
  --chart-2: oklch(0.64 0.10 201.59);
  --chart-3: oklch(0.71 0.11 201.25);
  --chart-4: oklch(0.77 0.10 201.18);
  --chart-5: oklch(0.83 0.08 200.97);
  --sidebar: oklch(0.93 0.02 205.32);
  --sidebar-foreground: oklch(0.38 0.06 212.66);
  --sidebar-primary: oklch(0.56 0.09 203.28);
  --sidebar-primary-foreground: oklch(1.00 0 0);
  --sidebar-accent: oklch(0.90 0.03 201.89);
  --sidebar-accent-foreground: oklch(0.38 0.06 212.66);
  --sidebar-border: oklch(0.89 0.02 204.41);
  --sidebar-ring: oklch(0.56 0.09 203.28);
  --font-sans: Courier New, monospace;
  --font-serif: Courier New, monospace;
  --font-mono: Courier New, monospace;
  --radius: 0.125rem;
  --shadow-2xs: 1px 1px 2px 0px hsl(185 70% 30% / 0.07);
  --shadow-xs: 1px 1px 2px 0px hsl(185 70% 30% / 0.07);
  --shadow-sm: 1px 1px 2px 0px hsl(185 70% 30% / 0.15), 1px 1px 2px -1px hsl(185 70% 30% / 0.15);
  --shadow: 1px 1px 2px 0px hsl(185 70% 30% / 0.15), 1px 1px 2px -1px hsl(185 70% 30% / 0.15);
  --shadow-md: 1px 1px 2px 0px hsl(185 70% 30% / 0.15), 1px 2px 4px -1px hsl(185 70% 30% / 0.15);
  --shadow-lg: 1px 1px 2px 0px hsl(185 70% 30% / 0.15), 1px 4px 6px -1px hsl(185 70% 30% / 0.15);
  --shadow-xl: 1px 1px 2px 0px hsl(185 70% 30% / 0.15), 1px 8px 10px -1px hsl(185 70% 30% / 0.15);
  --shadow-2xl: 1px 1px 2px 0px hsl(185 70% 30% / 0.38);
}

.dark {
  --background: oklch(0.21 0.02 224.45);
  --foreground: oklch(0.85 0.13 195.04);
  --card: oklch(0.23 0.03 216.07);
  --card-foreground: oklch(0.85 0.13 195.04);
  --popover: oklch(0.23 0.03 216.07);
  --popover-foreground: oklch(0.85 0.13 195.04);
  --primary: oklch(0.85 0.13 195.04);
  --primary-foreground: oklch(0.21 0.02 224.45);
  --secondary: oklch(0.38 0.06 216.50);
  --secondary-foreground: oklch(0.85 0.13 195.04);
  --muted: oklch(0.29 0.04 218.82);
  --muted-foreground: oklch(0.66 0.10 195.05);
  --accent: oklch(0.38 0.06 216.50);
  --accent-foreground: oklch(0.85 0.13 195.04);
  --destructive: oklch(0.62 0.21 25.81);
  --destructive-foreground: oklch(0.96 0 0);
  --border: oklch(0.38 0.06 216.50);
  --input: oklch(0.38 0.06 216.50);
  --ring: oklch(0.85 0.13 195.04);
  --chart-1: oklch(0.85 0.13 195.04);
  --chart-2: oklch(0.66 0.10 195.05);
  --chart-3: oklch(0.58 0.08 195.07);
  --chart-4: oklch(0.43 0.06 202.62);
  --chart-5: oklch(0.31 0.05 204.16);
  --sidebar: oklch(0.21 0.02 224.45);
  --sidebar-foreground: oklch(0.85 0.13 195.04);
  --sidebar-primary: oklch(0.85 0.13 195.04);
  --sidebar-primary-foreground: oklch(0.21 0.02 224.45);
  --sidebar-accent: oklch(0.38 0.06 216.50);
  --sidebar-accent-foreground: oklch(0.85 0.13 195.04);
  --sidebar-border: oklch(0.38 0.06 216.50);
  --sidebar-ring: oklch(0.85 0.13 195.04);
  --font-sans: Source Code Pro, monospace;
  --font-serif: Source Code Pro, monospace;
  --font-mono: Source Code Pro, monospace;
  --radius: 0.125rem;
  --shadow-2xs: 1px 1px 2px 0px hsl(180 70% 60% / 0.10);
  --shadow-xs: 1px 1px 2px 0px hsl(180 70% 60% / 0.10);
  --shadow-sm: 1px 1px 2px 0px hsl(180 70% 60% / 0.20), 1px 1px 2px -1px hsl(180 70% 60% / 0.20);
  --shadow: 1px 1px 2px 0px hsl(180 70% 60% / 0.20), 1px 1px 2px -1px hsl(180 70% 60% / 0.20);
  --shadow-md: 1px 1px 2px 0px hsl(180 70% 60% / 0.20), 1px 2px 4px -1px hsl(180 70% 60% / 0.20);
  --shadow-lg: 1px 1px 2px 0px hsl(180 70% 60% / 0.20), 1px 4px 6px -1px hsl(180 70% 60% / 0.20);
  --shadow-xl: 1px 1px 2px 0px hsl(180 70% 60% / 0.20), 1px 8px 10px -1px hsl(180 70% 60% / 0.20);
  --shadow-2xl: 1px 1px 2px 0px hsl(180 70% 60% / 0.50);
}
```
3. Replace `REPLACE_WITH_THEME_NAME` with the name of your theme.
4. Replace `REPLACE_WITH_THEME_ID` with a id, its recommened to use a uuid/guid.
4. Go to Settings -> System -> Apperance then click `Reload Themes` or restart launcher.

> If you want to tweak the values for the theme check out [Tweakcn](https://tweakcn.com/editor/theme)

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

