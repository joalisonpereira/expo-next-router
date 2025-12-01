import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  splitting: false,
  sourcemap: false,
  clean: true,
  dts: false,
  esbuildPlugins: [],
  banner: {
    js: "#!/usr/bin/env node",
  },
});
