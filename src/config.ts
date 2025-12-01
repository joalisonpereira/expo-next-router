import chalk from "chalk";
import path from "node:path";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

export interface ConfigOptions {
  watch: boolean;
  extensions: string[];
  appDir: string;
  workDir: string;
  verbose: boolean;
}

export async function getConfig() {
  const projectRoot = process.cwd();

  const configBaseName = "expo-next-router.config";

  const supportedExtensions = [".js", ".mjs", ".cjs", ".json"] as const;

  let configPath: string | undefined;

  let selectedExt: (typeof supportedExtensions)[number] | undefined;

  for (const ext of supportedExtensions) {
    const candidatePath = path.resolve(projectRoot, `${configBaseName}${ext}`);

    try {
      await fs.access(candidatePath);
      configPath = candidatePath;
      selectedExt = ext;
      break;
    } catch {
      // continue searching
    }
  }

  if (!configPath || !selectedExt) {
    console.log(
      chalk.red(
        `Failed to load configuration file [${configBaseName}.{js,mjs,cjs,json}] under ${projectRoot}`
      )
    );

    return;
  }

  try {
    const userConfig = await loadConfig(configPath, selectedExt);

    return {
      ...userConfig,
      appDir: path.isAbsolute(userConfig.appDir)
        ? userConfig.appDir
        : path.resolve(projectRoot, userConfig.appDir),
      workDir: path.isAbsolute(userConfig.workDir)
        ? userConfig.workDir
        : path.resolve(projectRoot, userConfig.workDir),
    };
  } catch {
    console.log(
      chalk.red(
        `Failed to load configuration file [${path.basename(configPath)}]`
      )
    );
  }
}

type SupportedExtension = ".js" | ".mjs" | ".cjs" | ".json";

async function loadConfig(
  configPath: string,
  ext: SupportedExtension
): Promise<ConfigOptions> {
  if (ext === ".cjs") {
    const require = createRequire(import.meta.url);

    return require(configPath) as ConfigOptions;
  }

  if (ext === ".json") {
    const contents = await fs.readFile(configPath, "utf-8");

    return JSON.parse(contents) as ConfigOptions;
  }

  if (ext === ".js") {
    try {
      const mod = await import(pathToFileURL(configPath).href);

      return (mod.default ?? mod) as ConfigOptions;
    } catch (error) {
      if (isCommonJSInESMError(error)) {
        const require = createRequire(configPath);

        return require(configPath) as ConfigOptions;
      }

      throw error;
    }
  }

  const mod = await import(pathToFileURL(configPath).href);

  return {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    watch: false,
    verbose: false,
    ...(mod.default ?? mod),
  } as ConfigOptions;
}

function isCommonJSInESMError(error: unknown): boolean {
  if (!(error instanceof Error) || typeof error.message !== "string") {
    return false;
  }

  return (
    error.message.includes("module is not defined in ES module scope") ||
    error.message.includes("exports is not defined in ES module scope")
  );
}
