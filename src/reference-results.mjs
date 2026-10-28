import { resolveReferences } from './domain.mjs';

const sources = ['nihongo', 'naver'];
const names = { nihongo: '일본어 한자 공부방', naver: 'NAVER 일본어사전' };

/** Keep each result's browsing context alive across collapse and view changes. */
export function createReferenceResults() {
  const $ = id => document.getElementById(id);
  const root = $('reference-results');
  const workspace = $('workspace');
  let groups = [], generation = 0, activeSource = 'nihongo', splitValue = 50, drag = null;

  function endResize() {
    const previous = drag;
    drag = null;
    document.body.classList.remove('resizing');
    if (previous?.divider.hasPointerCapture(previous.pointerId)) previous.divider.releasePointerCapture(previous.pointerId);
  }

  function setSplit(value) {
    splitValue = Math.max(25, Math.min(75, value));
    workspace.style.setProperty('--reference-columns', `minmax(0, ${splitValue}fr) 12px minmax(0, ${100 - splitValue}fr)`);
    for (const group of groups) group.divider.setAttribute('aria-valuenow', String(Math.round(splitValue)));
  }

  function loadReference(pane, force = false) {
    if (pane.frame && !force) return;
    pane.cancelLoad?.();
    const loadController = new AbortController();
    let timer;
    pane.cancelLoad = () => { clearTimeout(timer); loadController.abort(); };
    const frame = document.createElement('iframe');
    frame.title = `${pane.reference.character} · ${names[pane.reference.source]} 원문`;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    pane.status.textContent = '원문 로딩 중…';
    frame.addEventListener('load', () => {
      clearTimeout(timer);
      pane.status.textContent = '결과가 없거나 화면이 비어 있으면 원문 열기를 이용하세요.';
    }, { signal: loadController.signal });
    frame.addEventListener('error', () => {
      clearTimeout(timer);
      pane.status.textContent = '원문을 불러오지 못했습니다. 원문 열기로 확인하세요.';
    }, { signal: loadController.signal });
    timer = setTimeout(() => {
      pane.status.textContent = '로딩이 지연되거나 표시가 제한될 수 있습니다. 원문 열기로 확인하세요.';
    }, 12000);
    frame.src = pane.reference.url;
    pane.frame = frame;
    pane.slot.replaceChildren(frame);
  }

  function loadOpenGroup(group) {
    if (!group.details.open) return;
    for (const [source, pane] of group.panes) {
      if ($(`show-${source}`).checked) loadReference(pane);
    }
  }

  function createGroup(references, index) {
    const details = $('kanji-result-template').content.firstElementChild.cloneNode(true);
    const character = references[0].character;
    const controller = new AbortController();
    const group = { details, panes: new Map(), controller,
      comparison: details.querySelector('.result-comparison'), divider: details.querySelector('.reference-divider') };
    details.dataset.character = character;
    details.querySelector('.result-character').textContent = character;
    details.open = index === 0;
    details.addEventListener('toggle', () => loadOpenGroup(group), { signal: controller.signal });
    for (const reference of references) {
      const element = details.querySelector(`[data-source="${reference.source}"]`);
      element.id = `result-${generation}-${index}-${reference.source}`;
      const heading = element.querySelector('h3');
      heading.id = `${element.id}-title`;
      element.setAttribute('aria-labelledby', heading.id);
      const pane = { element, reference, slot: element.querySelector('.frame-slot'),
        status: element.querySelector('.reference-status'), frame: null, cancelLoad: null };
      element.querySelector('a').href = reference.url;
      element.querySelector('button').addEventListener('click', () => loadReference(pane, true), { signal: controller.signal });
      group.panes.set(reference.source, pane);
    }
    const divider = group.divider;
    divider.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      drag = { divider, pointerId: event.pointerId };
      divider.setPointerCapture(event.pointerId);
      document.body.classList.add('resizing');
    }, { signal: controller.signal });
    divider.addEventListener('pointermove', event => {
      if (drag?.divider !== divider || drag.pointerId !== event.pointerId) return;
      const rect = group.comparison.getBoundingClientRect();
      setSplit((event.clientX - rect.left) / rect.width * 100);
    }, { signal: controller.signal });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      divider.addEventListener(type, endResize, { signal: controller.signal });
    }
    divider.addEventListener('keydown', event => {
      const next = { ArrowLeft: splitValue - 5, ArrowRight: splitValue + 5, Home: 25, End: 75 }[event.key];
      if (next !== undefined) { event.preventDefault(); setSplit(next); }
    }, { signal: controller.signal });
    return group;
  }

  function updateView() {
    const enabled = sources.filter(source => $(`show-${source}`).checked);
    const both = enabled.length === 2;
    workspace.dataset.view = both ? 'both' : enabled.length ? 'single' : 'none';
    root.hidden = !enabled.length;
    $('reference-empty').hidden = enabled.length !== 0;
    $('search-empty').hidden = !enabled.length || groups.length !== 0;
    $('reset-split').hidden = $('reference-tabs').hidden = !both || !groups.length;
    if (enabled.length && !enabled.includes(activeSource)) activeSource = enabled[0];
    for (const source of sources) {
      const tab = $(`tab-${source}`);
      tab.setAttribute('aria-selected', String(source === activeSource));
      tab.tabIndex = source === activeSource ? 0 : -1;
      const controls = groups.map(group => group.panes.get(source).element.id).join(' ');
      if (controls) tab.setAttribute('aria-controls', controls);
      else tab.removeAttribute('aria-controls');
    }
    for (const group of groups) {
      group.divider.hidden = !both;
      for (const [source, pane] of group.panes) {
        pane.element.hidden = !enabled.includes(source);
        pane.element.classList.toggle('mobile-hidden', source !== activeSource);
      }
      loadOpenGroup(group);
    }
    setSplit(splitValue);
  }

  for (const source of sources) {
    $(`show-${source}`).onchange = () => { endResize(); updateView(); };
    const tab = $(`tab-${source}`);
    tab.onclick = () => { activeSource = source; updateView(); };
    tab.onkeydown = event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      activeSource = event.key === 'Home' ? 'nihongo' : event.key === 'End' ? 'naver' : source === 'nihongo' ? 'naver' : 'nihongo';
      updateView();
      $(`tab-${activeSource}`).focus();
    };
  }
  $('reset-split').onclick = () => setSplit(50);
  updateView();

  return {
    show(characters) {
      const references = characters.map(resolveReferences);
      endResize();
      for (const group of groups) {
        group.controller.abort();
        for (const pane of group.panes.values()) pane.cancelLoad?.();
      }
      generation++;
      groups = references.map(createGroup);
      root.replaceChildren(...groups.map(group => group.details));
      updateView();
    },
  };
}
