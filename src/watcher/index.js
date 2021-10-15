import chokidar from "chokidar";

export const createWatcher = (root='.', { onAdd, onChange, onReady }) => {

  const watcher = chokidar.watch(root, {
    ignored: [/node_modules/, /(^|[\/\\])\../],
    persistent: true,
  });
  
  return watcher
    .on("add", onAdd)
    .on("change", onChange)
    .on("ready", onReady);
}

