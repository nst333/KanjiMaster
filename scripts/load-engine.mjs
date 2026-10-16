import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
export async function loadEngine() {
  const sandbox = { document:{addEventListener(){}}, console:{log(){}}, structuredClone };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const name of ['kanji-canvas.js','ref-patterns.js']) vm.runInContext(await readFile(new URL(`../vendor/kanjicanvas/${name}`,import.meta.url),'utf8'),sandbox);
  return sandbox.KanjiCanvas;
}
