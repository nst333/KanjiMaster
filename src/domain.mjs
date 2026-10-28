/** Preserve the exact code points, including an optional ideographic variation selector. */
export function isSingleKanji(value) {
  return typeof value === 'string' && /^\p{Unified_Ideograph}[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]?$/u.test(value);
}

/** Extract distinct kanji in reading order without normalizing their code points. */
export function extractKanji(value) {
  if (typeof value !== 'string') return [];
  return [...new Set(value.match(/\p{Unified_Ideograph}[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]?/gu) || [])];
}

export function resolveReferences(character) {
  if (!isSingleKanji(character)) throw new Error('한자 한 글자를 입력해 주세요.');
  const encoded = encodeURIComponent(character);
  return [
    { source: 'nihongo', character, kind: 'search', url: `https://nihongokanji.com/?s=${encoded}` },
    { source: 'naver', character, kind: 'search', url: `https://ja.dict.naver.com/#/search?query=${encoded}` },
  ];
}

export function validateStrokes(strokes) {
  if (!Array.isArray(strokes) || strokes.length === 0 || strokes.length > 64) throw new Error('1–64획을 그려 주세요.');
  let count = 0;
  for (const stroke of strokes) {
    if (!Array.isArray(stroke) || stroke.length < 2) throw new Error('너무 짧은 획입니다. 다시 그려 주세요.');
    for (const point of stroke) {
      if (!Array.isArray(point) || point.length !== 2 || point.some(n => !Number.isFinite(n) || n < 0 || n > 256)) throw new Error('올바르지 않은 좌표입니다.');
      count++;
    }
  }
  if (count > 20000) throw new Error('입력이 너무 깁니다. 획을 줄여 주세요.');
  const points = strokes.flat();
  if (points.every(([x, y]) => x === points[0][0] && y === points[0][1])) throw new Error('점을 찍는 대신 획을 그려 주세요.');
  return strokes;
}

export function recognizeWithEngine(engine, strokes) {
  validateStrokes(strokes);
  // Use math-only functions; upstream canvas event handlers are deliberately unused.
  engine.recordedPattern_spike = structuredClone(strokes);
  try {
    const normalized = engine.momentNormalize('spike');
    const features = engine.extractFeatures(normalized, 20);
    const coarse = engine.coarseClassification(features);
    // Upstream fineClassification scores 100 patterns but serializes only ten.
    // Apply its scoring formula here so the UI can paginate the full ranked set.
    const ranked = coarse.slice(0, 100).flatMap(([index]) => {
      const [character, strokeCount, pattern] = engine.refPatterns[index];
      if (!(features.length < strokeCount + 2 && features.length > strokeCount - 3)) return [];
      let map = engine.getMap(pattern, features, engine.initialDistance);
      map = engine.completeMap(pattern, features, engine.wholeWholeDistance, map);
      const distance = engine.computeWholeDistanceWeighted(pattern, features, map) / Math.min(features.length, pattern.length);
      return Number.isFinite(distance) && isSingleKanji(character) ? [{ character, distance }] : [];
    });
    ranked.sort((a, b) => a.distance - b.distance);
    return [...new Set(ranked.map(candidate => candidate.character))];
  } finally { delete engine.recordedPattern_spike; }
}
