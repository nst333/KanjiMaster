import { createStudyStore, reviewQueue, studyKey } from './study-store.mjs';

export function createNotebook(onSearch) {
  const $ = id => document.getElementById(id);
  const store = createStudyStore();
  let entries = [], current = '', editing = '', removed = null, queue = [], reviewed = 0;
  const panel = $('notebook-panel'), dialog = $('review-dialog');
  const status = message => { $('notebook-status').textContent = message; };
  function showPanel() {
    panel.hidden = false;
    $('notebook-toggle').setAttribute('aria-expanded', 'true');
  }
  function edit(entry) {
    editing = entry.term;
    $('note-term').textContent = entry.term;
    $('note-text').value = entry.note;
    $('note-editor').hidden = false;
    showPanel();
    $('note-text').focus();
  }
  function button(text, label, action) {
    const el = document.createElement('button');
    el.type = 'button'; el.textContent = text; el.setAttribute('aria-label', label); el.onclick = action;
    return el;
  }
  function render() {
    $('notebook-toggle').textContent = `학습 단어장 · ${entries.length}개`;
    $('notebook-empty').hidden = !!entries.length;
    $('start-review').disabled = !reviewQueue(entries).length;
    $('review-hint').textContent = entries.length && !reviewQueue(entries).length
      ? '읽는 법이나 뜻을 메모하면 복습을 시작할 수 있어요.' : '메모를 보고 단어를 떠올려 보세요. 오래 복습하지 않은 단어부터 나옵니다.';
    const rows = entries.map(entry => {
      const row = document.createElement('li');
      const word = button(entry.term, `${entry.term} 다시 검색`, () => onSearch(entry.term));
      word.className = 'notebook-word'; word.lang = 'ja';
      const note = document.createElement('p'); note.textContent = entry.note || '메모를 추가해 복습해 보세요.';
      const content = document.createElement('div'); content.className = 'notebook-entry'; content.append(word, note);
      const actions = document.createElement('div'); actions.className = 'notebook-row-actions';
      actions.append(button('메모 수정', `${entry.term} 메모 수정`, () => edit(entry)), button('삭제', `${entry.term} 삭제`, () => {
        try {
          const deleted = store.remove(entry.term);
          entries = store.read();
          if (deleted) { removed = deleted; $('undo-notebook-delete').hidden = false; }
          if (editing === entry.term) { $('note-editor').hidden = true; editing = ''; }
          render(); status(`${entry.term}을 단어장에서 삭제했습니다. 삭제 취소로 되돌릴 수 있어요.`);
          $('undo-notebook-delete').focus();
        } catch (error) { status(error.message); }
      }));
      row.append(content, actions); return row;
    });
    $('notebook-list').replaceChildren(...rows);
  }
  try { entries = store.read(); } catch (error) { status(error.message); }
  render();
  $('notebook-toggle').onclick = () => {
    panel.hidden = !panel.hidden;
    $('notebook-toggle').setAttribute('aria-expanded', String(!panel.hidden));
  };
  $('save-word').onclick = () => {
    try {
      entries = store.save(current);
      render(); status(`${current}을 단어장에 저장했습니다. 메모를 남겨 보세요.`);
      edit(entries.find(entry => entry.term === current));
    } catch (error) { status(error.message); }
  };
  $('note-editor').onsubmit = event => {
    event.preventDefault();
    try {
      entries = store.save(editing, $('note-text').value);
      $('note-editor').hidden = true; render(); status(`${editing} 메모를 저장했습니다.`);
      $('notebook-list').querySelector('button')?.focus();
    } catch (error) { status(error.message); }
  };
  $('cancel-note').onclick = () => { $('note-editor').hidden = true; $('notebook-toggle').focus(); };
  $('undo-notebook-delete').onclick = () => {
    if (!removed) return;
    try {
      entries = store.restore(removed); status(`${removed.term}을 복원했습니다.`);
      removed = null; $('undo-notebook-delete').hidden = true; render(); $('notebook-toggle').focus();
    } catch (error) { status(error.message); }
  };
  function showQuestion() {
    const done = !queue.length;
    $('review-question').hidden = done;
    $('review-done').hidden = !done;
    $('review-progress').textContent = done ? `${reviewed}개 복습 완료` : `남은 단어 ${queue.length}개`;
    $('review-answer').hidden = true;
    $('review-ratings').hidden = true;
    $('reveal-answer').hidden = done;
    if (!done) {
      $('review-note').textContent = queue[0].note;
      $('review-term').textContent = queue[0].term;
      $('reveal-answer').focus();
    } else $('close-review').focus();
  }
  $('start-review').onclick = () => {
    try {
      entries = store.read(); queue = reviewQueue(entries); reviewed = 0;
      if (!queue.length) { render(); status('복습할 메모가 없습니다. 단어에 메모를 먼저 남겨 주세요.'); return; }
      dialog.showModal(); showQuestion();
    } catch (error) { status(error.message); }
  };
  $('reveal-answer').onclick = () => {
    $('review-answer').hidden = false; $('review-ratings').hidden = false; $('reveal-answer').hidden = true;
    $('review-again').focus();
  };
  $('review-again').onclick = () => { queue.push(queue.shift()); showQuestion(); };
  $('review-remembered').onclick = () => {
    try {
      entries = store.remember(queue[0].term); queue.shift(); reviewed++; render(); showQuestion();
      $('review-error').textContent = '';
    } catch (error) { $('review-error').textContent = error.message; }
  };
  $('close-review').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { queue = []; $('review-error').textContent = ''; $('start-review').focus(); });
  window.addEventListener('storage', event => {
    if (event.key !== studyKey && event.key !== null) return;
    try { entries = store.read(); render(); }
    catch (error) { status(error.message); }
  });
  return { select(term) { current = term.trim(); $('save-word').disabled = false; } };
}
