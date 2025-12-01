import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src"],
  format: ["esm"],
  splitting: false,
  sourcemap: false,
  clean: true,
  dts: false,
  esbuildPlugins: [],
});
