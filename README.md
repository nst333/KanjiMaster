# Kanji Research Workspace

Feasibility prototype for Korean learners identifying Japanese kanji and comparing original reference pages, with classic pastel and aurora glass designs. A preview is deployed with GitHub Pages; production acceptance is still pending.

## Run

Requires Node.js 22 or newer. No package installation, API key, database, or build step is required.

```sh
npm run dev
```

Open http://127.0.0.1:4173/. To use a different port:

```sh
npm run dev -- 4174
```

- `/`: handwriting input, recognition candidates, word search, and independent reference toggles. Word input extracts distinct kanji in reading order (e.g. `接線` → `接`, `線`; `食べ物` → `食`, `物`; `日曜日` → `日`, `曜`) while preserving supplementary characters and variation selectors. Each kanji has its own collapsible result group; only the first opens initially. Closed groups load on first expansion, and collapsing keeps existing pages alive. The study reference is on by default. One reference uses a 30:70 handwriting/reading layout on desktop; both restore handwriting above two resizable panes per kanji. Source toggles, width and mobile tabs apply to all groups without resetting their expansion state.
- `/benchmark.html`: browser worker timing against 60 explicitly geometric fixtures.
- `/responsive.html`: layout testing at 1440, 1024, 768, and 390 CSS pixels inside an iframe. This is not mobile-device emulation.

The header's **구버전 / 신버전** selector switches between the classic pastel design and the new aurora glass design. First visits use glass; the last selection is saved in `localStorage` under `kanjimaster.design`. The theme is applied before styles load. Switching changes only the document theme, preserving handwriting, results, open groups and existing iframe browsing contexts. If storage is unavailable, glass is the default and switching still works for the current page. External reference pages retain their original appearance.

**설정 → 인터랙티브 디자인** selects **자동 / 켜기 / 끄기**, saved under `kanjimaster.effects`. Automatic mode uses OS reduced-motion preference, data saving, coarse CPU/memory capabilities, pointer type and two short foreground frame-cadence samples (startup and first search) to choose full, gentle or off. Forced on bypasses performance estimates but retains opacity/color feedback when the OS requests reduced motion. Off cancels active animations, queued frames and pointer tracking immediately. Effects include button ink impressions, character selection, bounded candidate/result reveals, notebook/review transitions, toggle continuity and pointer-following mascot feedback. Drawing coordinates, dictionary browsing contexts, theme colors and saved learning data are unaffected. No device information is uploaded. See [motion policy and validation](docs/interactive-effects.md).

**학습 단어장** saves the current searched term, optional reading/meaning notes (up to 500 characters), and the last remembered time in this browser under `kanjimaster.notebook.v1`. Up to 500 terms are supported. Repeated saves preserve existing notes; deletion has a one-step undo. Saved terms reopen the dictionary search. **메모로 복습** uses the learner’s own notes as prompts, hides the searched word behind a modal, and queues unreviewed then least recently remembered terms. **한 번 더** returns the word to the queue; **기억나요** records completion. No reading or meaning is fabricated or fetched for the notebook. Storage failures are reported, malformed data is preserved, and writes read the latest stored list to retain changes from other tabs. Data is local to this browser and is not synced to an account.

**설정 → 화면 모드** selects device preference (default), light, or dark independently of the classic/glass layout. The choice is saved under `kanjimaster.colorMode` and applied before CSS loads. Device mode follows live OS appearance changes; saved choices synchronize across tabs. Embedded third-party dictionary pages retain their own appearance.

**설정 → 레이저 효과** controls the handwriting glow and bright core in either design. The default is on, with the last selection stored under `kanjimaster.laser`. Turning it off retains the thicker blue-violet-rose gradient. Changes repaint existing strokes immediately; recognition continues to use their original coordinates.

The vendor engine and its patterns are already included. Restore the exact pinned revision if necessary:

```sh
npm run vendor
```

This needs network access; provenance, hashes, and the upstream license are in `vendor/kanjicanvas/`. The license additionally requires an upstream backlink, included in the prototype footer.

## Verify

```sh
npm test
npm run benchmark
npm run probe:headers
```

The header probe makes only the named feasibility requests, stores headers, and does not retain dictionary response bodies. It is not a crawler. Recognition runs locally in a Web Worker; only the selected search character is passed to each dictionary. Embedded third-party pages may make their own network requests.

Handwriting candidates update automatically after every completed stroke and after undo. Clear removes all candidates and cancels waiting updates. One recognition job runs at a time; only the latest waiting strokes are retained and stale results are discarded. The first ten candidates appear immediately; **Show more candidates** adds ten at a time from up to 100 genuinely ranked matches, resetting to ten when the handwriting changes. The manual recognition button remains available for retry. Expanded ranking uses the upstream fine-scoring formula without changing the vendored source; regression tests verify the original top ten remain identical.

To collect actual handwriting samples, expand the sample collector, draw a character, label it, and save each example. Export before reloading; samples exist only in browser memory. Then:

```sh
node scripts/benchmark.mjs path/to/handwriting-samples.json
```

The importer reports results without certifying sample independence. The required human evaluation needs 20 distinct characters, three independently written samples each, and recorded input-device provenance. The included 60 geometric fixtures do not satisfy that gate.

## Structure and boundaries

- `src/`: exact Unicode validation/resolution, math-only recognition adapter, worker, and disposable prototype UI.
- `scripts/`: local static server, pinned vendor acquisition, header probe, and Node benchmark.
- `fixtures/`, `tests/`: independent geometric fixtures and domain/real-engine regression tests.
- `evidence/`: captured headers, timings, browser observations, and screenshots.
- [Feasibility report](docs/feasibility.md): verified behavior, limitations, reproduction steps, and next approval gate.

Search links are explicitly search destinations, not guaranteed matching entries. No full character-to-entry database is fabricated. Cross-origin pages retain their own design, advertisements, navigation, and scrolling. The application cannot inspect their results or detect every framing failure. An iframe `load` event is never labeled successful dictionary lookup.

## Delivery status

The user subsequently selected a pastel flat study-notebook direction based on a supplied PDF. The interface now uses that palette, locally served NanumSquareRound, and a generated static lavender companion. See [style notes and asset prompt](docs/pastel-style.md). Reference-display permissions and independent handwriting evaluation remain open.

The subsequent [design refinement](docs/design-refinement.md) removes decorative numbering, English labels, introductory blocks, and nested cards. The palette and small mascot remain; the page is now organized as a compact lookup tool with ruled candidate rows and earlier access to the original dictionary panes.

Production architecture, reference-display permissions, independent handwriting evaluation, real-device tests, and production delivery remain pending. The user's PDF styling request supersedes the pending visual-alternatives selection for this theme. Do not publish this prototype as a completed MVP. Any later production build/deployment instructions must follow the approved architecture.
