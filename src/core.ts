import chalk from "chalk";
import { readdir } from "node:fs/promises";
import path from "node:path";
import fs from "node:fs/promises";
import type { ConfigOptions } from "./config";

export const NEXT_FILE_MAPPER = {
  page: "index",
  layout: "_layout",
  ["not-found"]: "+not-found",
};

function getNextFilePatterns(extensions: string[]) {
  return Object.keys(NEXT_FILE_MAPPER).flatMap((pattern) =>
    extensions.map((ext) => `${pattern}.${ext}`)
  );
}

type GetRouteFilesOptions = Pick<
  ConfigOptions,
  "appDir" | "pagesDir" | "extensions"
>;

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

    if (contentCheck.includes("export") && contentCheck.includes("default")) {
      await createFileIfNotExists(
        route.expoRoutePath,
        `export { default } from '${relativePath}'`
      );
    }
  }

  await cleanupOrphanedFiles({ appDir, pagesDir, extensions });
}

async function cleanupOrphanedFiles({
  appDir,
  pagesDir,
  extensions,
}: GetRouteFilesOptions) {
  const files = await listFilesAndDirectoriesRecursive(appDir);

  const validExpoRoutePaths = new Set(
    (await listFilesAndDirectoriesRecursive(pagesDir))
      .filter((filePath) => {
        const ext = path.extname(filePath);

        return (
          filePath.endsWith(ext) &&
          getNextFilePatterns(extensions).some((pattern) =>
            filePath.endsWith(pattern)
          )
        );
      })
      .map((filePath) =>
        filePath
          .replace(pagesDir, appDir)
          .replace(
            path.basename(filePath).split(".")[0]!,
            NEXT_FILE_MAPPER[
              path
                .basename(filePath)
                .split(".")[0]! as keyof typeof NEXT_FILE_MAPPER
            ]
          )
      )
  );

  //remove orphaned files
  for (const filePath of files) {
    if (!validExpoRoutePaths.has(filePath)) {
      try {
        await fs.unlink(filePath);
      } catch {
        //continue
      }
    }
  }

  //clear empty folders
  await removeEmptyDirs(appDir);
}

async function removeEmptyDirs(dir: string): Promise<boolean> {
  let isDirEmpty = true;

  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const emptied = await removeEmptyDirs(fullPath);
      if (!emptied) {
        isDirEmpty = false;
      }
    } else {
      isDirEmpty = false;
    }
  }

  if (isDirEmpty) {
    await fs.rmdir(dir);

    return true;
  }

  return false;
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
