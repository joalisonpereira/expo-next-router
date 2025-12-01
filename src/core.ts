import chalk from "chalk";
import { readdir } from "node:fs/promises";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);

export const DIRNAME = dirname(__filename);

export const NEXT_FILE_MAPPER = {
  page: "page",
  layout: "layout",
  ["not-found"]: "+not-found",
};

function getNextFilePatterns(extensions: string[]) {
  return Object.keys(NEXT_FILE_MAPPER).flatMap((pattern) =>
    extensions.map((ext) => `${pattern}.${ext}`)
  );
}

type GetRouteFilesOptions = Pick<Config, "appDir" | "pagesDir" | "extensions">;

export async function sync({
  extensions,
  pagesDir,
  appDir,
}: GetRouteFilesOptions) {
  const files = await listFilesAndDirectoriesRecursive(pagesDir);

  const filteredFiles = files.filter((filePath) => {
    const ext = path.extname(filePath);

    return (
      filePath.endsWith(ext) &&
      getNextFilePatterns(extensions).some((pattern) =>
        filePath.endsWith(pattern)
      )
    );
  });

  const routesConfig = filteredFiles.map((filePath) => {
    const name = path.basename(filePath).split(".")[0]!;

    const expoRouteName =
      NEXT_FILE_MAPPER[name as keyof typeof NEXT_FILE_MAPPER];

    return {
      filePath,
      expoRoutePath: filePath
        .replace(pagesDir, appDir)
        .replace(name, expoRouteName),
    };
  });

  for (const route of routesConfig) {
    const ext = path.extname(route.filePath);

    const relativePath = path
      .relative(path.dirname(route.expoRoutePath), route.filePath)
      .replace(ext, "");

    const contentCheck = await fs.readFile(route.filePath, "utf-8");

    console.log(
      route.filePath,
      contentCheck.includes("export"),
      contentCheck.includes("default")
    );

    if (contentCheck.includes("export") && contentCheck.includes("default")) {
      await createFileIfNotExists(
        route.expoRoutePath,
        `export { default } from '${relativePath}'`
      );
    }
  }

  return routesConfig;
}

async function listFilesAndDirectoriesRecursive(
  dir: string
): Promise<string[]> {
  const result: string[] = [];

  async function walk(currentPath: string) {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      result.push(fullPath);

      if (entry.isDirectory()) {
        await walk(fullPath);
      }
    }
  }

  await walk(dir);

  return result;
}

interface Config {
  watch: boolean;
  extensions: string[];
  appDir: string;
  pagesDir: string;
  verbose: boolean;
}

export async function getConfig() {
  const CONFIG_FILE_PATH = path.join(DIRNAME, "../expo-next-router.config.js");

  console.log(CONFIG_FILE_PATH);

  try {
    const config = await import(CONFIG_FILE_PATH).then(
      (mod) => mod.default || mod
    );

    return config as Config;
  } catch (e) {
    console.log(e);
    console.log(
      chalk.red(
        "Failed to load configuration file [expo-next-router.config.js]"
      )
    );
  }
}

async function createFileIfNotExists(filePath: string, content: string) {
  try {
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });

    try {
      await fs.access(filePath);

      return;
    } catch {
      // continue
    }

    await fs.writeFile(filePath, content);
  } catch (error: any) {
    console.error(
      chalk.red(`Failed to create file at ${filePath}: ${error.message}`)
    );
  }
}
