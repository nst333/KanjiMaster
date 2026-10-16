import { mkdir, writeFile } from 'node:fs/promises';

// Only the explicitly selected feasibility cases; no crawling or content storage.
const characters = ['日', '人', '学', '語', '鬱', '學', '𠮷'];
const urls = ['https://nihongokanji.com/', 'https://ja.dict.naver.com/', ...characters.map(c => `https://nihongokanji.com/?s=${encodeURIComponent(c)}`)];
const results = [];
for (const url of urls) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
    results.push({ requestedUrl: url, finalUrl: response.url, status: response.status, redirected: response.redirected, xFrameOptions: response.headers.get('x-frame-options'), contentSecurityPolicy: response.headers.get('content-security-policy'), accessControlAllowOrigin: response.headers.get('access-control-allow-origin'), setCookiePresent: response.headers.has('set-cookie') });
    await response.body?.cancel();
  } catch (error) { results.push({ requestedUrl: url, error: error.message }); }
}
await mkdir('evidence', { recursive: true });
await writeFile('evidence/headers.json', JSON.stringify({ recordedAt: new Date().toISOString(), note: 'HTTP GET headers only. URL fragments never reach the server. No response bodies stored.', results }, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
