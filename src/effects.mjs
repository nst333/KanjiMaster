import { chooseEffects, effectsKey, medianFrameTime, readEffectsMode, saveEffectsMode, validEffectsMode } from './effects-policy.mjs';

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const pointer = matchMedia('(hover: hover) and (pointer: fine)');
const connection = navigator.connection;
const radios = [...document.querySelectorAll('input[name="effects-mode"]')];
const status = document.getElementById('effects-status');
const mascot = document.querySelector('.study-companion img');
const header = document.querySelector('.site-header');
const animations = new Set(), pending = new Map();
const running = new WeakMap();
let mode = readEffectsMode(), tier = 'off', frameTime, persistenceFailed = false, interactionSampled = false;
let probeId = 0, flushId = 0, pointerId = 0, pointerX = 0, pointerY = 0;

function stopMotion() {
  for (const animation of animations) animation.cancel();
  animations.clear(); pending.clear();
  cancelAnimationFrame(probeId); cancelAnimationFrame(flushId); cancelAnimationFrame(pointerId);
  probeId = flushId = pointerId = 0;
  mascot?.style.removeProperty('--look-x'); mascot?.style.removeProperty('--look-y');
}
function animate(element, kind, index = 0) {
  if (tier === 'off' || document.hidden || !element?.isConnected || typeof element.animate !== 'function') return;
  if (!element.getBoundingClientRect().width || getComputedStyle(element).visibility === 'hidden') return;
  running.get(element)?.cancel();
  let frames = [{ opacity: .65 }, { opacity: 1 }], duration = 140;
  if (tier === 'full') {
    duration = kind === 'selected' ? 380 : 240;
    if (kind === 'selected') frames = [
      { transform: 'scale(.88) rotate(-5deg)', filter: 'blur(2px)' },
      { transform: 'scale(1.08) rotate(2deg)', filter: 'blur(0px)', offset: .55 },
      { transform: 'scale(1) rotate(0deg)', filter: 'blur(0px)' },
    ];
    else if (kind === 'answer') frames = [
      { opacity: .5, transform: 'perspective(700px) rotateX(-12deg)', clipPath: 'inset(0 0 18% 0)' },
      { opacity: 1, transform: 'perspective(700px) rotateX(0deg)', clipPath: 'inset(0)' },
    ];
    else if (kind === 'candidate') frames = [
      { opacity: .4, transform: 'translateY(7px) scale(.94)' }, { opacity: 1, transform: 'none' },
    ];
    else if (kind === 'result') frames = [
      { opacity: .6, transform: 'translateX(10px)', clipPath: 'inset(0 0 0 2%)' },
      { opacity: 1, transform: 'none', clipPath: 'inset(0)' },
    ];
    else frames = [{ opacity: .6, clipPath: 'inset(0 0 8% 0)' }, { opacity: 1, clipPath: 'inset(0)' }];
  }
  const animation = element.animate(frames, {
    duration, delay: tier === 'full' ? Math.min(index, 7) * 12 : 0,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  });
  animations.add(animation); running.set(element, animation);
  const clean = () => { animations.delete(animation); if (running.get(element) === animation) running.delete(element); };
  animation.finished.then(clean, clean);
}
function enqueue(element, kind, index = 0) {
  if (tier === 'off' || document.hidden || !element) return;
  pending.set(element, { kind, index });
  if (!flushId) flushId = requestAnimationFrame(() => {
    flushId = 0;
    const batch = [...pending]; pending.clear();
    for (const [element, effect] of batch.slice(0, 16)) animate(element, effect.kind, effect.index);
  });
}

// Sample just twelve foreground frame intervals, once per automatic decision.
// No background loop, GPU probe, permission prompt, or device data transmission.
function sampleFrames() {
  if (mode !== 'auto' || tier === 'off' || frameTime !== undefined || document.hidden || probeId) return;
  const samples = []; let previous;
  function sample(time) {
    probeId = 0;
    if (document.hidden || mode !== 'auto') return;
    if (previous !== undefined) samples.push(time - previous);
    previous = time;
    if (samples.length < 12) probeId = requestAnimationFrame(sample);
    else { frameTime = medianFrameTime(samples); apply(); }
  }
  probeId = requestAnimationFrame(sample);
}
function apply(reset = false) {
  const decision = chooseEffects(mode, {
    reducedMotion: reduced.matches, saveData: connection?.saveData,
    cores: navigator.hardwareConcurrency, memory: navigator.deviceMemory,
    finePointer: pointer.matches, frameTime,
  });
  if (reset || tier !== decision.tier) stopMotion();
  tier = decision.tier;
  root.dataset.effects = tier;
  for (const radio of radios) radio.checked = radio.value === mode;
  const label = { off: '효과 꺼짐', gentle: '가벼운 효과', full: '전체 효과' }[tier];
  const reasons = {
    'manual': mode === 'off' ? '선택한 설정에 따라 움직임을 끕니다.' : '선택한 설정에 따라 모든 인터랙션을 사용합니다.',
    'reduced-motion': '기기의 모션 줄이기 설정을 반영합니다.',
    'save-data': '기기의 데이터 절약 설정을 반영해 효과를 쉽니다.',
    'limited-device': '기기 성능에 맞춰 효과를 가볍게 조절했습니다.',
    'slow-frames': '화면 반응이 느려 효과를 가볍게 조절했습니다.',
    'touch-device': '터치 기기에서는 가벼운 반응을 사용합니다.',
    'unknown-device': '성능 정보가 충분하지 않아 가벼운 반응을 사용합니다.',
    'capable-device': '현재 기기에서 반응형 모션을 사용합니다.',
  };
  const text = `${mode === 'auto' ? '자동 · ' : ''}${label}. ${reasons[decision.reason]}`
    + (persistenceFailed ? ' 이 페이지에는 적용했지만 브라우저에 설정을 저장하지 못했습니다.' : '');
  if (status.textContent !== text) status.textContent = text;
  sampleFrames();
}
for (const radio of radios) radio.addEventListener('change', () => {
  if (!radio.checked || !validEffectsMode(radio.value)) return;
  mode = radio.value; frameTime = undefined; interactionSampled = false;
  persistenceFailed = !saveEffectsMode(mode); apply(true);
});
window.addEventListener('storage', event => {
  if (event.key !== effectsKey && event.key !== null) return;
  mode = validEffectsMode(event.newValue) ? event.newValue : 'auto'; frameTime = undefined; interactionSampled = false; persistenceFailed = false; apply(true);
});
function environmentChanged() { frameTime = undefined; interactionSampled = false; apply(true); }
reduced.addEventListener('change', environmentChanged);
pointer.addEventListener('change', environmentChanged);
connection?.addEventListener?.('change', environmentChanged);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopMotion(); else sampleFrames(); });

header?.addEventListener('pointermove', event => {
  if (tier !== 'full' || !pointer.matches || document.hidden || !mascot) return;
  pointerX = event.clientX; pointerY = event.clientY;
  if (!pointerId) pointerId = requestAnimationFrame(() => {
    pointerId = 0;
    const rect = header.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (pointerX - rect.left) / Math.max(rect.width, 1) * 2 - 1));
    const y = Math.max(-1, Math.min(1, (pointerY - rect.top) / Math.max(rect.height, 1) * 2 - 1));
    mascot.style.setProperty('--look-x', x); mascot.style.setProperty('--look-y', y);
  });
}, { passive: true });
header?.addEventListener('pointerleave', () => {
  cancelAnimationFrame(pointerId); pointerId = 0;
  mascot?.style.removeProperty('--look-x'); mascot?.style.removeProperty('--look-y');
});

// A short ink impression acknowledges presses without moving the drawing surface.
document.addEventListener('click', event => {
  const button = event.target.closest?.('button');
  if (tier !== 'full' || document.hidden || !button?.isConnected || button.disabled || typeof button.animate !== 'function') return;
  const rect = button.getBoundingClientRect(), size = Math.max(rect.width, rect.height) * 2;
  if (!rect.width || getComputedStyle(button).visibility === 'hidden') return;
  const ink = document.createElement('span'); ink.className = 'interaction-ink'; ink.setAttribute('aria-hidden', 'true');
  const x = event.detail ? event.clientX - rect.left : rect.width / 2;
  const y = event.detail ? event.clientY - rect.top : rect.height / 2;
  Object.assign(ink.style, { width: `${size}px`, height: `${size}px`, left: `${x - size / 2}px`, top: `${y - size / 2}px` });
  button.append(ink);
  const animation = ink.animate([{ transform: 'scale(.15)', opacity: .18 }, { transform: 'scale(1)', opacity: 0 }], {
    duration: 380, easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  });
  animations.add(animation);
  const clean = () => { animations.delete(animation); ink.remove(); };
  animation.finished.then(clean, clean);
});

const observer = new MutationObserver(records => {
  if (tier === 'off' || document.hidden) return;
  for (const record of records) {
    const target = record.target;
    if (record.type === 'childList') {
      if (target.id === 'selected') {
        enqueue(target, 'selected');
        if (mode === 'auto' && !interactionSampled) {
          interactionSampled = true; frameTime = undefined;
          cancelAnimationFrame(probeId); probeId = 0; sampleFrames();
        }
      }
      if (target.id === 'notebook-toggle' && [...record.addedNodes].some(node => node.nodeType === 3)) enqueue(target, 'acknowledge');
      if (['candidates', 'reference-results', 'notebook-list'].includes(target.id)) {
        [...record.addedNodes].filter(node => node.nodeType === 1).slice(0, 8).forEach((node, index) => {
          enqueue(node, target.id === 'candidates' ? 'candidate' : 'result', index);
        });
      }
    } else if (record.attributeName === 'hidden' && !target.hidden) {
      if (['notebook-panel', 'note-editor', 'review-answer', 'review-question'].includes(target.id)) enqueue(target, target.id === 'review-answer' ? 'answer' : 'panel');
    } else if (record.attributeName === 'open' && target.open) {
      if (target.id === 'review-dialog') enqueue(target, 'panel');
      else if (target.id === 'ink-settings') enqueue(target.querySelector('.ink-settings-panel'), 'panel');
      else if (target.id === 'input-panel') enqueue(target.querySelector('.input-grid'), 'panel');
      else if (target.classList.contains('kanji-result')) enqueue(target.querySelector('.result-comparison'), 'result');
    }
  }
});
observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'open'] });
apply();
