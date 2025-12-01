import { getConfig } from "./config";
import { sync } from "./core";
import { watcher } from "./watcher";

async function run() {
  const config = await getConfig();

  if (config) {
    await sync(config);
    if (config.watch) {
      watcher({
        dir: config.workDir,
        verbose: config.verbose,
        onChange: () => sync(config),
      });
    }
  }
}

run();
