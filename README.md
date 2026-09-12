# Integrating the new design into ChikwambiTanatswa.github.io

Your repo currently has: `_config.yml`, `index.md`, `about.md`, `projects.md`, using the
built-in Cayman theme. Here's how to swap in the new design without losing any content.

## 1. Add these three new files to your repo

- `_layouts/default.html`
- `assets/css/style.scss`
- `assets/js/terminal.js`

(create the `_layouts` and `assets/css` / `assets/js` folders — GitHub's web UI lets you
type a path like `_layouts/default.html` directly into the "Add file → Create new file" box
and it'll make the folders for you)

## 2. Edit `_config.yml`

Remove or comment out the theme line:

```yaml
# theme: jekyll-theme-cayman   <-- delete or comment this out
```

Keep your `title` and `description` lines — the new layout reads those automatically.

## 3. Add front matter to your existing pages

Your `index.md`, `about.md`, and `projects.md` already have content — you don't need to
rewrite them. Just make sure each starts with:

```yaml
---
layout: default
title: About        # (or "Projects", or leave blank on index.md)
---
```

The layout automatically shows the interactive terminal hero only on `index.md` (the
homepage) — `about.md` and `projects.md` will render as plain title + your existing
content, styled to match (dark background, list-style formatting if you use bullet lists).

## 4. Commit and push

GitHub Pages rebuilds automatically (usually under a minute). Check the **Actions** tab
if it doesn't show up — Jekyll build errors show there.

## What's new in `terminal.js` vs. the first preview

- **Command history** — up/down arrows cycle through what you've typed
- **Tab completion** — partial command + Tab autocompletes
- **`man <topic>`** — try `man nmap`, `man metasploit`, `man n8n`, `man cyberchef`
- **Easter egg** — try typing `nmap` on its own, it "scans" the site itself

## Things to fix before this ships

- `projects.md` still says "coming soon" for Metasploitable2 — worth having at least one
  real writeup live before the flashy terminal draws attention to an empty page
- The sidebar's GitHub link and email are hardcoded in `_layouts/default.html` — update
  them there if either ever changes
