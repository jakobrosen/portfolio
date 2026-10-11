# Portfolio

My personal developer portfolio: a single-page site in Swedish and English with a sticky sidebar, scroll-aware navigation and a dark theme.

Built with React, TypeScript, Tailwind CSS and Vite.

## Features

- **Swedish and English.** All content can be translated, and the chosen language is remembered in `localStorage`. Swedish is the default.
- **Responsive layout.** From the `lg` breakpoint the profile sits in a sticky sidebar with section navigation. Below `lg` everything stacks into one column.
- **Scroll-aware navigation.** The nav highlights the section currently in view.
- **Subtle motion.** Content fades in on load, staggered from top to bottom, and the hover cards have a spotlight that follows the pointer. Both are turned off for users who prefer reduced motion.
- **Static.** No backend, so it can be hosted anywhere that serves files.

## Getting started

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

| Script            | What it does                                 |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Starts the dev server with hot reload        |
| `npm run build`   | Type-checks and builds the site into `dist/` |
| `npm run preview` | Serves the production build locally          |
| `npm run lint`    | Runs ESLint                                  |

Code is formatted with Prettier, which sorts the Tailwind classes too (`npx prettier --write .`).

## Project structure

```
public/              Favicons and the link-preview image, served as-is
src/
  assets/projects/   Project thumbnails
  components/        Reusable UI: cards, nav, section shell, language switcher
  data/              All page content (profile, about, projects, education, …)
  hooks/             Active-section tracking and the staggered reveal
  i18n/              Language context, useLanguage hook and interface text
  sections/          The page sections: Header, About, Projects, …
  index.css          Theme tokens, animations and base styles
```

## Editing content

All content lives in `src/data`, so you rarely need to touch the components.

Any text can be either a plain string, shown in both languages, or an object with one string per language:

```ts
title: "Country Explorer",                                  // same in both
period: { en: "2025 - Present", sv: "2025 - Nu" },          // translated
```

Interface text that isn't content, such as section headings and button labels, lives in `src/i18n/ui.ts`.

### Adding a project

1. Add a thumbnail to `src/assets/projects/` with an 8:5 aspect ratio, for example 640×400 WebP:
   ```sh
   magick screenshot.png -resize 640x400^ -gravity north -extent 640x400 -quality 80 src/assets/projects/my-project.webp
   ```
2. Import it in `src/data/projects.ts` and add an entry with `title`, `description`, `tech`, and optionally `url` and `image`.

## Theming

Colors, the description text size and the reveal animation are defined in `src/index.css`. Change the tokens under `@theme inline` (`background`, `surface`, `foreground`, `muted`, `accent`, `glow`) to restyle the whole site.

## Deployment

`npm run build` outputs a static site to `dist/`. Any static host works, for example Cloudflare Pages, Netlify or Vercel. Use `npm run build` as the build command and `dist` as the output directory.

The Open Graph tags in `index.html` use absolute URLs (`https://jakobrosen.se/`). Update them if the site is served from another domain.
