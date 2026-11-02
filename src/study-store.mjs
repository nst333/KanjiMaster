import { extractKanji } from './domain.mjs';

export const studyKey = 'kanjimaster.notebook.v1';
const limit = 500;
export function validateTerm(value) {
  const term = typeof value === 'string' ? value.trim() : '';
  if (!term || term.length > 80 || !extractKanji(term).length) throw new Error('한자가 포함된 80자 이내의 단어를 저장해 주세요.');
  return term;
}
function validateNote(note) {
  if (typeof note !== 'string' || note.length > 500) throw new Error('메모는 500자 이내로 입력해 주세요.');
  return note.trim();
}
export function createStudyStore(getStorage = () => localStorage, now = () => Date.now()) {
  function read() {
    let raw;
    try { raw = getStorage().getItem(studyKey); }
    catch { throw new Error('이 브라우저에서 단어장을 읽을 수 없습니다. 저장소 설정을 확인해 주세요.'); }
    if (raw === null) return [];
    try {
      const data = JSON.parse(raw);
      if (data.version !== 1 || !Array.isArray(data.entries) || data.entries.length > limit) throw new Error();
      const seen = new Set();
      return data.entries.map(entry => {
        const term = validateTerm(entry.term), note = validateNote(entry.note);
        if (seen.has(term) || !Number.isFinite(entry.createdAt) || entry.createdAt < 0 || !Number.isFinite(entry.reviewedAt) || entry.reviewedAt < 0) throw new Error();
        seen.add(term);
        return { term, note, createdAt: entry.createdAt, reviewedAt: entry.reviewedAt };
      });
    } catch { throw new Error('저장된 단어장을 읽을 수 없어 원본을 보존했습니다. 다른 브라우저 탭의 단어장도 확인해 주세요.'); }
  }
  function write(entries) {
    try { getStorage().setItem(studyKey, JSON.stringify({ version: 1, entries })); }
    catch { throw new Error('저장하지 못했습니다. 브라우저 저장 공간이나 저장소 설정을 확인해 주세요.'); }
    return entries;
  }
  return {
    read,
    save(value, note) {
      const term = validateTerm(value), entries = read();
      const existing = entries.find(entry => entry.term === term);
      if (!existing && entries.length >= limit) throw new Error('단어장은 최대 500개까지 저장할 수 있습니다.');
      if (existing) {
        if (note !== undefined) existing.note = validateNote(note);
      } else entries.unshift({ term, note: validateNote(note ?? ''), createdAt: now(), reviewedAt: 0 });
      return write(entries);
    },
    remove(term) {
      const entries = read(), removed = entries.find(entry => entry.term === term);
      write(entries.filter(entry => entry.term !== term));
      return removed;
    },
    restore(entry) {
      const entries = read();
      if (entries.some(item => item.term === entry.term)) return entries;
      if (entries.length >= limit) throw new Error('단어장이 가득 차서 복원하지 못했습니다.');
      return write([entry, ...entries]);
    },
    remember(term) {
      const entries = read(), entry = entries.find(item => item.term === term);
      if (entry) entry.reviewedAt = now();
      return write(entries);
    },
  };
}

export function reviewQueue(entries) {
  return entries.filter(entry => entry.note).toSorted((a, b) => a.reviewedAt - b.reviewedAt || a.createdAt - b.createdAt);
}
