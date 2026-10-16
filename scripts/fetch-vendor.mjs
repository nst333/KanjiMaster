import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const repository = 'https://api.github.com/repos/asdfjkl/kanjicanvas';
const revision = 'a9214105f156def3b96930e5fcf10b7652b7a1f7';
const response = await fetch(`${repository}/commits/${revision}`);
if (!response.ok) throw new Error(`GitHub: ${response.status}`);
const commit = await response.json();
const root = `https://raw.githubusercontent.com/asdfjkl/kanjicanvas/${commit.sha}/`;
const paths = ['docs/resources/javascript/kanji-canvas.js', 'docs/resources/javascript/ref-patterns.js', 'LICENSE.TXT', 'README.md'];
await mkdir('vendor/kanjicanvas', { recursive: true });
const files = [];
for (const path of paths) {
  const url = root + path;
  const result = await fetch(url);
  if (!result.ok) throw new Error(`${url}: ${result.status}`);
  const bytes = Buffer.from(await result.arrayBuffer());
  const name = path.split('/').at(-1);
  await writeFile(`vendor/kanjicanvas/${name}`, bytes);
  files.push({ name, url, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
const manifest = { repository, commit: commit.sha, commitDate: commit.commit.committer.date, fetchedAt: new Date().toISOString(), files };
await writeFile('vendor/kanjicanvas/provenance.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
