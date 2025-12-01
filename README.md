# expo-next-router 🚀

Library that brings the familiar Next.js file-based routing conventions to Expo Router projects. By introducing an intermediate `pages/` folder, it ensures only files following the `page`, `layout`, and `not-found` conventions become routes, leaving the rest of your feature structure free for plain components.

## Why it helps 🌟

- Mirrors the Next.js feature folder layout to reduce onboarding friction.
- Prevents auxiliary components from unintentionally becoming Expo routes.
- Syncs files between `pages/` and `app/` automatically, optionally in watch mode.
- Removes orphaned route files and empty folders to keep the project tidy.
- Works with both JavaScript and TypeScript projects out of the box.

## Installation 📦

```bash
npm install --save-dev expo-next-router
```

Using Yarn:

```bash
yarn add --dev expo-next-router
```

## Configuration ⚙️

Create an `expo-next-router.config.js` (or `.mjs`, `.cjs`, `.json`) at the project root:

```js
module.exports = {
  watch: true,
  verbose: true,
  extensions: ["js", "jsx", "ts", "tsx"],
  appDir: "example/app",
  pagesDir: "example/pages",
};
```

### Available options

| Key          | Type       | Default                      | Description                                                                                                 |
| ------------ | ---------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `watch`      | `boolean`  | `false`                      | Enables the watcher so routes stay in sync with `pagesDir` on every change.                                 |
| `verbose`    | `boolean`  | `false`                      | Prints colorful logs for watcher events.                                                                    |
| `extensions` | `string[]` | `["js", "jsx", "ts", "tsx"]` | File extensions considered during sync.                                                                     |
| `appDir`     | `string`   | —                            | Target Expo `app/` directory. Accepts relative or absolute paths.                                           |
| `pagesDir`   | `string`   | —                            | Source folder with Next.js-style files (`page`, `layout`, `not-found`). Accepts relative or absolute paths. |

> `appDir` and `pagesDir` must be provided. The remaining options have defaults and can be omitted.

## Usage ▶️

Run the sync through the CLI:

```bash
npx expo-next-router
```

- Reads the config file, mirrors `page`, `layout`, and `not-found` files into `app/`, and removes orphaned routes.
- When `watch: true`, a watcher observes `pagesDir` and keeps routes synchronized automatically.

For day-to-day development, add `concurrently` to your `package.json` so the router runs alongside `expo start`:

```json
{
  "scripts": {
    "start": "concurrently \"npx expo-next-router\" \"expo start\""
  }
}
```

### Recommended structure

```
project/
├─ app/             # generated automatically; do not edit manually
├─ pages/           # build your features here
│  ├─ page.tsx
│  ├─ layout.tsx
│  └─ about/
│     └─ page.tsx
└─ expo-next-router.config.js
```

Inside `pages/`, feel free to add any other files or components without the reserved filenames (`page`, `layout`, `not-found`); they remain ordinary modules you can import.

## Support and contributions 🤝

Open an issue at `https://github.com/joalisonpereira/expo-next-router/issues` for questions, suggestions, or bug reports. Pull requests are welcome!
