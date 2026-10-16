// The unmodified upstream engine expects browser globals at load time.
self.window = self;
self.document = { addEventListener() {} };
(async () => { try {
  importScripts('../vendor/kanjicanvas/kanji-canvas.js', '../vendor/kanjicanvas/ref-patterns.js');
  const { recognizeWithEngine } = await import('./domain.mjs');
  self.onmessage = ({ data }) => {
    const started = performance.now();
    try {
      const candidates = recognizeWithEngine(KanjiCanvas, data.strokes);
      self.postMessage({ id: data.id, candidates, elapsedMs: performance.now() - started });
    } catch (error) { self.postMessage({ id: data.id, error: error.message }); }
  };
  self.postMessage({ ready: true, patterns: KanjiCanvas.refPatterns.length, characters: new Set(KanjiCanvas.refPatterns.map(p => p[0])).size });
} catch (error) { self.postMessage({ fatal: error.message }); }
})();
