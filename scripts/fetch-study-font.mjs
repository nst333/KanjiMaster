import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
await mkdir('assets/fonts', {recursive:true});
const files = [];
for (const weight of ['R','B']) {
  const name = `NanumSquareRound${weight}.woff2`;
  const url = `https://hangeul.pstatic.net/hangeul_static/webfont/NanumSquareRound/${name}`;
  const result = await fetch(url);
  if (!result.ok) throw new Error(`${url}: ${result.status}`);
  const bytes = Buffer.from(await result.arrayBuffer());
  await writeFile(`assets/fonts/${name}`,bytes);
  files.push({name,url,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
const licenseUrl = 'https://help.naver.com/service/11029/contents/18088?lang=ko&osType=PC';
const licenseResponse = await fetch(licenseUrl);
if (!licenseResponse.ok) throw new Error(`License: ${licenseResponse.status}`);
const license = await licenseResponse.text();
if (!license.includes('SIL') || !license.includes('NanumSquareRound')) throw new Error('License notice missing.');
await writeFile('assets/fonts/LICENSE.html',license);
await writeFile('assets/fonts/provenance.json',JSON.stringify({recordedAt:new Date().toISOString(),licenseUrl,files},null,2));
console.log(files);
