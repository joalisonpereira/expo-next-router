import chokidar from "chokidar";
import path from "node:path";
import chalk from "chalk";
import { DIRNAME } from "./core";

const EVENTS = {
  ALL: "all",
  READY: "ready",
  ADD: "add",
  CHANGE: "change",
  ADD_DIR: "addDir",
  UNLINK: "unlink",
  UNLINK_DIR: "unlinkDir",
  RAW: "raw",
  ERROR: "error",
} as const;

const EVENT_COLORS: Record<
  (typeof EVENTS)[keyof typeof EVENTS],
  (input: string) => string
> = {
  [EVENTS.ALL]: chalk.blue,
  [EVENTS.READY]: chalk.green,
  [EVENTS.ADD]: chalk.green,
  [EVENTS.CHANGE]: chalk.yellow,
  [EVENTS.ADD_DIR]: chalk.cyan,
  [EVENTS.UNLINK]: chalk.red,
  [EVENTS.UNLINK_DIR]: chalk.magenta,
  [EVENTS.RAW]: chalk.gray,
  [EVENTS.ERROR]: chalk.redBright,
};

interface Config {
  dir: string;
  onChange: () => void;
  verbose?: boolean;
}

export function watcher({ dir, verbose = false, onChange }: Config) {
  const pagesDir = path.join(DIRNAME, "..", dir);

  const watcher = chokidar.watch(pagesDir, {
    ignored: /(^|[/\\])\../,
    ignoreInitial: true,
    persistent: true,
  });

  watcher.on("all", (event, filePath) => {
    const colorize =
      EVENT_COLORS[event as keyof typeof EVENT_COLORS] ?? chalk.white;

    const eventLabel = String(event).toUpperCase();

    const formattedEvent = colorize(`[${eventLabel}]`);

    const relativePath = path.relative(process.cwd(), filePath);

    const displayPath = relativePath.length > 0 ? relativePath : filePath;

    onChange();

    if (verbose) {
      console.log(
        `${chalk.bold.blue("[Router]")} ${formattedEvent} ${chalk.dim(
          displayPath
        )}`
      );
    }
  });
}
