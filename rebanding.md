# Rebranding Guide — SMV Holdings Frontend

## Files to Change

| # | File | Purpose | Type |
|---|------|---------|------|
| 1 | `index.html` | Page title, favicon links, theme color | Text |
| 2 | `public/site.webmanifest` | PWA install name, colors, icons | Text |
| 3 | `src/config/brand.ts` | Central brand config | Text |
| 4 | `package.json` | Project name, description | Text |
| 5 | `README.md` | Project docs | Text |
| 6 | `public/favicon.svg` | Browser tab icon (vector) | Asset |
| 7 | `public/favicon.ico` | Legacy browser icon | Asset |
| 8 | `public/favicon-96x96.png` | 96×96 PNG fallback | Asset |
| 9 | `public/apple-touch-icon.png` | iOS home screen icon (180×180) | Asset |
| 10 | `src/assets/logo2.jpg` | In-app logo | Asset |

Backend SMS/email templates also reference the brand — coordinate separately.

---

## 1. `index.html`

**Location:** Project root

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />

    <!-- Favicons -->
    <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

    <!-- PWA manifest -->
    <link rel="manifest" href="/site.webmanifest" />

    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Brand theme -->
    <meta name="theme-color" content="#2563eb" />

    <!-- SEO / PWA -->
    <meta name="description" content="SMV Holdings Microfinance & SME Credit Division" />
    <meta name="application-name" content="SMV Holdings" />
    <meta name="apple-mobile-web-app-title" content="SMV Holdings" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />

    <title>SMV Holdings</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Change on rebrand:**

| Element | Current value |
|---------|---------------|
| `<title>` | `SMV Holdings` |
| `<meta name="theme-color">` | `#2563eb` |
| `<meta name="description">` | `SMV Holdings Microfinance & SME Credit Division` |
| `<meta name="application-name">` | `SMV Holdings` |
| `<meta name="apple-mobile-web-app-title">` | `SMV Holdings` |

Keep the `href` paths unchanged (filenames are the same).

---

## 2. `public/site.webmanifest`

The PWA manifest. Defines the install name, home-screen icon, theme color,
startup URL, and display mode. **Without this, the "Install App" button never
appears** — Chrome's `beforeinstallprompt` event requires a valid manifest.

```json
{
  "name": "SMV Holdings",
  "short_name": "SMV",
  "description": "Microfinance & SME Credit Division",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/favicon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ]
}
```

**Change on rebrand:**

| Field | Current | Notes |
|-------|---------|-------|
| `name` | `SMV Holdings` | Full app name — install prompt, app drawer, task switcher |
| `short_name` | `SMV` | Home-screen label, keep ≤ 12 chars |
| `description` | `Microfinance & SME Credit Division` | Shown in some install UIs |
| `theme_color` | `#2563eb` | Colors mobile status bar |
| `background_color` | `#ffffff` | Splash screen background |
| `icons[].src` | paths above | Only change if you rename the icon files |

### Field reference

| Field | Purpose | Values |
|-------|---------|--------|
| `start_url` | Where the app opens when launched from the icon | Keep `/` |
| `scope` | URL scope the app "owns" | Keep `/` |
| `display` | Chrome UI shown | `standalone`, `fullscreen`, `minimal-ui`, `browser` |
| `orientation` | Initial orientation lock | `portrait`, `landscape`, `any` |
| `purpose` (icon) | Icon rendering mode | `any`, `maskable`, `monochrome` |

### Icon requirements (Chrome/Android install)

For the install prompt to fire, Chrome wants:

- At least one icon **≥ 144×144** — `apple-touch-icon.png` (180×180) satisfies this
- At least one icon **≥ 192×192** — recommended
- At least one icon **≥ 512×512** — recommended for high-DPI + splash

Your current set passes the minimum. For a proper install experience, add
192×192 and 512×512 icons:

```bash
mkdir -p public/icons
convert logo-master.png -resize 192x192 public/icons/icon-192x192.png
convert logo-master.png -resize 512x512 public/icons/icon-512x512.png

# Maskable variant: logo centered on a solid background with ~10% padding
convert logo-master.png -resize 410x410 -background "#2563eb" -gravity center \
  -extent 512x512 public/icons/icon-maskable-512x512.png
```

Then update the `icons` array:

```json
"icons": [
  { "src": "/favicon-96x96.png", "sizes": "96x96", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-maskable-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
  { "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" }
]
```

### `any` vs `maskable`

- **`any`** — rendered as-is, corners intact
- **`maskable`** — Android crops it into a circle/squircle; keep the logo
  centered with ~10–20% padding so nothing important gets clipped

Without a `maskable` icon, Android puts your `any` icon on a white rounded
square — often off-brand.

### Optional — shortcuts (long-press menu on Android)

```json
"shortcuts": [
  {
    "name": "New Loan",
    "short_name": "New Loan",
    "url": "/applications",
    "icons": [{ "src": "/favicon-96x96.png", "sizes": "96x96" }]
  },
  {
    "name": "Payments",
    "short_name": "Payments",
    "url": "/payments",
    "icons": [{ "src": "/favicon-96x96.png", "sizes": "96x96" }]
  }
]
```

### Verification

Chrome DevTools → **Application** → **Manifest**:

- Check name, short name, description render
- Check theme color swatch
- Check all icon previews appear (errors mean a broken path or wrong size)
- "Installability" section should say **Installable**

Common failures:

- **404 on the manifest** → path or file location wrong
- **Icons 404** → check each `src` by opening it in the browser
- **Icons wrong size** → Chrome compares declared `sizes` to actual file dimensions; a mismatch causes it to be skipped
- **Wrong MIME type** → server must serve `.webmanifest` as `application/manifest+json`. Vite does this in dev; check Nginx in prod

### Important caveat

Chrome **caches the manifest** for the installed app. Users who already
installed the old PWA must **uninstall and reinstall** to pick up the new name
and icon — a page reload won't refresh them. There is no server-side workaround.

### iOS note

Safari ignores `site.webmanifest` for home-screen installs. It uses
`<link rel="apple-touch-icon">` and `<meta name="apple-mobile-web-app-title">`
from `index.html` instead. Make sure those are updated too.

---

## 3. `src/config/brand.ts`

The single source of truth for everything brand-related inside React. Every
component imports from here.

```ts
export const BRAND = {
  // -------- Names --------
  name: "SMV Holdings",
  shortName: "SMV",
  legalName: "SMV HOLDINGS (PVT) LTD",
  tagline: "Micro Finance Enterprise",
  description: "Microfinance & SME Credit Division",
  location: "Colombo, Sri Lanka",

  // -------- Assets --------
  logo: "/src/assets/logo2.jpg",
  logoAlt: "SMV Holdings",

  // -------- Theme --------
  themeColor: "#2563eb",
  primaryColor: "#2563eb",
  primaryDarkColor: "#1d4ed8",
  accentColor: "#059669",

  // -------- Contact --------
  contact: {
    developer: "Axperia Information Systems",
    phone: "+94 788 017 808",
    email: "ask.axperia@gmail.com",
  },

  // -------- Version --------
  version: "v1.0.0",

  // -------- PWA --------
  pwa: {
    installFlagKey: "smv_pwa_installed_at",
    installFlagTtlDays: 30,
  },
} as const;

export type Brand = typeof BRAND;
```

**Change on rebrand:** every value in this file. If you rename the logo file,
update `BRAND.logo` to match.

Keep `themeColor` in sync with the `theme_color` field in `site.webmanifest`
and the `<meta name="theme-color">` in `index.html`.

---

## 4. `package.json` and `README.md`

**`package.json`:**

```json
{
  "name": "smv-holdings-frontend",
  "description": "SMV Holdings Microfinance Platform"
}
```

Change to the new project name and description.

**`README.md`:** update the title, screenshots, and any brand references.

---

## 5. Assets (Binary — Replace the File)

Filenames must stay the same unless you also update references in `index.html`
and `site.webmanifest`.

### `public/favicon.svg`

- **Format:** SVG (vector)
- **Source:** Export from Figma/Illustrator, simplified for 16–32 px display
- **Tip:** Flat icons work best; detailed illustrations become unreadable at tab size

### `public/favicon.ico`

- **Format:** ICO with multiple sizes (16, 32, 48, 64)
- **Generate:**
  ```bash
  convert logo-master.png -define icon:auto-resize=16,32,48,64 favicon.ico
  ```

### `public/favicon-96x96.png`

- **Format:** PNG, exactly 96×96
- **Generate:**
  ```bash
  convert logo-master.png -resize 96x96 favicon-96x96.png
  ```

### `public/apple-touch-icon.png`

- **Format:** PNG, exactly 180×180, **no transparency** (iOS masks it itself)
- **Generate:**
  ```bash
  convert logo-master.png -resize 180x180 -background white -flatten apple-touch-icon.png
  ```

### `src/assets/logo2.jpg`

- Replaced in place; filename stays the same
- If you switch to a transparent PNG (`logo.png`), update `BRAND.logo`

**Fastest path:** [realfavicongenerator.net](https://realfavicongenerator.net) —
upload a 512×512 master logo, it generates every size plus a manifest.

---

## 6. Backend (Coordinate Separately)

The backend sends SMS and email with hardcoded brand strings. These aren't in
the frontend repo but affect what users see.

```bash
grep -rn "SMV Holdings" src/
```

Typical SMS templates:

```
"LKR X received for Loan Y. Thank you, SMV Holdings."
"Your loan X has been EARLY SETTLED ... Thank you, SMV Holdings."
"Your loan X has been disbursed. ... Thank you, SMV Holdings."
```

Also check:

- Email templates
- Server-generated PDFs (statements, invoices)
- API error messages mentioning the company

---

## 7. Search Commands

Run before and after rebranding to catch every hit.

```bash
# Brand strings
grep -rn "SMV"              src/ public/ index.html package.json
grep -rn "SMV Holdings"     src/ public/ index.html
grep -rn "SMV HOLDINGS"     src/ public/ index.html
grep -rn "Micro Finance"    src/ public/
grep -rn "Microfinance"     src/ public/
grep -rn "Axperia"          src/ public/
grep -rn "Colombo"          src/ public/

# Contact
grep -rn "94 788"           src/ public/
grep -rn "ask.axperia"      src/ public/

# Asset references
grep -rn "logo2.jpg"        src/
grep -rn "favicon"          src/ public/ index.html
```

Save as `scripts/rebrand-audit.sh`:

```bash
#!/usr/bin/env bash
echo "=== Brand strings ==="
grep -rn "SMV\|Micro Finance\|Microfinance\|Axperia\|Colombo" \
  src/ public/ index.html package.json 2>/dev/null

echo ""
echo "=== Asset references ==="
grep -rn "logo2\.jpg\|favicon\|apple-touch-icon" \
  src/ public/ index.html 2>/dev/null

echo ""
echo "=== Public assets ==="
ls -la public/*.png public/*.ico public/*.svg public/*.webmanifest 2>/dev/null
```

After rebranding, the only expected hit is inside `src/config/brand.ts`.

---

## 8. Step-by-Step Rebrand Process

### Step 1 — Prepare assets
- [ ] New logo as SVG (vector) + 512×512 PNG master
- [ ] Generate favicon pack from [realfavicongenerator.net](https://realfavicongenerator.net)
- [ ] Decide new primary brand color (hex)

### Step 2 — Replace binary files
- [ ] `public/favicon.svg`
- [ ] `public/favicon.ico`
- [ ] `public/favicon-96x96.png`
- [ ] `public/apple-touch-icon.png`
- [ ] `src/assets/logo2.jpg`
- [ ] (Optional) `public/icons/icon-192x192.png`, `icon-512x512.png`, `icon-maskable-512x512.png`

### Step 3 — Edit config
- [ ] `src/config/brand.ts` — update all values

### Step 4 — Edit root files
- [ ] `index.html` — `<title>`, `theme-color`, description metas
- [ ] `public/site.webmanifest` — `name`, `short_name`, `description`, `theme_color`, icons if renamed
- [ ] `package.json` — `name`, `description`
- [ ] `README.md`

### Step 5 — Coordinate with backend
- [ ] SMS templates
- [ ] Email templates
- [ ] Server-generated PDFs
- [ ] API error messages

### Step 6 — Test locally
- [ ] Hard refresh — verify tab title + favicon
- [ ] `npm run build` — no missing-asset errors
- [ ] Install as PWA — verify home screen name + icon
- [ ] Chrome DevTools → Application → Manifest → "Installable"
- [ ] Open receipt modal → print preview → PDF
- [ ] Open clearance certificate → print preview → PDF
- [ ] Mobile brand bar, desktop sidebar, drawer
- [ ] Test SMS on a real payment (if backend updated)

### Step 7 — Deploy
- [ ] Commit + push
- [ ] Deploy frontend
- [ ] Verify production tab title, favicon, PWA install
- [ ] Announce change to users

### Step 8 — Post-deploy notes
- Users on the **old PWA** must uninstall + reinstall to pick up new icons
  (the manifest and icons are cached at install time)
- Favicon cache: users may see the old icon for hours. Temporary fix:
  append `?v=2` to favicon URLs in `index.html`, remove after verification
- Hard refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`) forces a fresh fetch

---

## 9. Post-Rebrand Checklist

- [ ] All grep searches return zero hits except in `brand.ts`
- [ ] Tab title shows new name
- [ ] Favicon shows new logo (hard refresh to verify)
- [ ] `site.webmanifest` name, short_name, theme_color updated
- [ ] PWA install uses new name + icon
- [ ] Chrome DevTools → Application → Manifest shows "Installable"
- [ ] Sidebar header shows new name + tagline
- [ ] Mobile brand bar shows new name
- [ ] Drawer header shows new name
- [ ] Receipt modal shows new legal name, address, footer
- [ ] Clearance certificate shows new legal name
- [ ] SMS on test payment uses new name
- [ ] `npm run build` succeeds with no asset errors
- [ ] Deploy + verify in production
- [ ] Announce to users

---

## 10. Color Reference

If you're changing the primary brand color, these are the Tailwind values used
throughout the app.

| Role | Tailwind | Hex |
|------|----------|-----|
| Primary | `blue-600` | `#2563eb` |
| Primary hover | `blue-700` | `#1d4ed8` |
| Primary light bg | `blue-50` | `#eff6ff` |
| Success | `emerald-600` | `#059669` |
| Success light bg | `emerald-50` | `#ecfdf5` |
| Danger | `rose-600` | `#e11d48` |
| Danger light bg | `rose-50` | `#fff1f2` |
| Warning | `amber-600` | `#d97706` |
| Neutral dark | `slate-900` | `#0f172a` |
| Neutral text | `slate-700` | `#334155` |

**To rebrand colors globally:**

Option A — find and replace Tailwind classes:

```bash
grep -rn "blue-600" src/
```

Replace with the new color class across the codebase.

Option B (recommended) — move to CSS variables:

```css
/* src/index.css */
:root {
  --brand-primary: 37 99 235;
  --brand-primary-dark: 29 78 216;
}
```

```js
// tailwind.config.js
colors: {
  brand: {
    DEFAULT: "rgb(var(--brand-primary) / <alpha-value>)",
    dark: "rgb(var(--brand-primary-dark) / <alpha-value>)",
  },
},
```

Then use `bg-brand` / `text-brand` throughout. Rebrand = change two CSS lines.

---

## 11. Summary — Files that Change on Every Rebrand

| # | File | Type |
|---|------|------|
| 1 | `index.html` | Text |
| 2 | `public/site.webmanifest` | Text |
| 3 | `src/config/brand.ts` | Text |
| 4 | `package.json` | Text |
| 5 | `README.md` | Text |
| 6 | `public/favicon.svg` | Asset |
| 7 | `public/favicon.ico` | Asset |
| 8 | `public/favicon-96x96.png` | Asset |
| 9 | `public/apple-touch-icon.png` | Asset |
| 10 | `src/assets/logo2.jpg` | Asset |

Plus backend SMS/email templates.

**Key gotcha:** Users with the old PWA installed must uninstall and reinstall
for the new icons to show. The manifest and icons are cached by the browser at
install time and aren't refreshed by a normal page reload.