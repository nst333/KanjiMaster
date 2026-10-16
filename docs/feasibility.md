# Discovery and Technical Feasibility Report

Observed on 2026-10-16, Asia/Seoul. Evidence files retain UTC timestamps.

## PRD baseline

**Audience:** Korean learners studying Japanese who encounter an unfamiliar kanji in a book or document.

**Outcome:** identify the exact character from handwriting and repeatedly compare its original Nihongo Kanji and NAVER reference pages without unnecessary application navigation.

**Journey:** draw with mouse/touch/stylus → request recognition → inspect several candidates → select the intended code points → open both references → read independently → repeat. Manual single-character input remains available throughout.

**MVP:** high-DPI canvas, Pointer Events, undo/clear/cancellation, real recognition, honest loading/error/no-match states, shared exact-character selection, verified source search links, side-by-side adjustable desktop panels, collapsible handwriting, mobile source tabs, accessible controls, and original-page links.

**Excluded:** history, favorites, notes, copy shortcuts, dark mode, accounts, databases, bulk dictionary extraction, and mirrored dictionary content. The sample collector and benchmark screens are spike tools, not proposed MVP features.

**Acceptance:** unchanged code points at both resolver boundaries; all five specified dictionary cases verified; at least 80% top-five accuracy across 60 independent handwriting samples; p95 recognition below one second on a recorded test device after initialization; one source failure must not erase selection or the other source; keyboard access and four responsive widths. Browser/device results must be reported individually.

## Findings

| Capability | Status | Evidence and limits |
| --- | --- | --- |
| Both original pages in cross-origin iframes | Verified for tested environment | All five characters rendered inside real iframes on a local Chromium page, without login. This does not establish permission, future availability, or cross-browser behavior. |
| Character search URLs | Verified | Nihongo: `https://nihongokanji.com/?s=<encoded character>`; NAVER: `https://ja.dict.naver.com/#/search?query=<encoded character>`. Discovered through each site's search UI. |
| HTTP framing restrictions | Verified observation | No X-Frame-Options or Content-Security-Policy on either root or the final Nihongo responses tested. HTTP 200 for those responses. Full redirect headers and all subresources have not been exhaustively audited. |
| Local handwriting recognition | Verified smoke test | Mouse-drawn 三 returned multiple real candidates; selecting 三 updated both destinations. Uses pinned upstream math functions, not hardcoded candidates. |
| Recognition coverage | Conditional | 2,213 unique Han reference patterns. 日、人、学、語、鬱 present; 學 and 𠮷 absent. Full Japanese variant coverage is not provided. Manual entry preserves these characters. |
| Human handwriting accuracy | Unverified | No independent 60-sample human dataset was available. Geometric fixtures must not be substituted for this acceptance test. |
| Browser recognition latency | Verified limited benchmark | Geometric fixtures: 60/60 in top five; warm p95 worker round trip 28.1ms on Windows Chromium 155, DPR 1, 12 reported logical processors. See raw evidence. |
| Pointer Events and high-DPI drawing | Conditional | Mouse drawing, undo, and clear observed. Touch, stylus, cancellation, multi-pointer behavior, non-1 DPR, and screen-reader operation need real-device/assistive-technology testing. |
| Responsive application shell | Verified CSS viewport test | 1440, 1024, 768, 390px real iframe viewports, no application document horizontal overflow. At 390px one source is visible; Enter and arrow-key tabs work. |
| Independent reading | Verified limited check | Left-frame document scrolled from 0 to 1304 while right document stayed at 0. Right wheel attempt did not establish a right-scroll result. No synchronized scrolling is implemented. |
| NAVER dictionary handwriting API | Unverified / unavailable as a documented option | No public dictionary handwriting SDK/API found in the official API catalog reviewed. This is not proof that no private/partner API exists. No internal endpoints used. |
| Production redistribution/display permissions | Conditional | Direct links are explicitly allowed by Nihongo; explicit permission for third-party framing was not established. NAVER content rights and service terms apply. Technical framing success is not a license. |

### Search cases

| Character | Nihongo observed final URL / title | NAVER observed exact entry route |
| --- | --- | --- |
| 日 | `/8/` — `1.「日」` | `#/entry/jako/f6b4cf8e5d134946b95126346e4d5bac` |
| 人 | `/12/` — `5.「人」` | `#/entry/jako/a94f980b394c416fb647ffa3321a96e3` |
| 学 | `/44/` — `36.「学」` | `#/entry/jako/d5dbf865fff347c18dfd62f8a1965939` |
| 語 | `/80/` — `72.「語」` | `#/entry/jako/2e2d1ae45af541d8a379f1e337054d7e` |
| 鬱 | `/2136/` — `2124.「鬱」` | `#/entry/jako/f76f8ee36a12471cb3328551ab4283bf` |

Paths are observed evidence, not a numeric URL-generation rule. The prototype uses verified search URLs rather than inventing a complete mapping. A successful search does not guarantee an exact result for arbitrary characters.

Edge cases: 學 remains 學 at both destinations; Nihongo shows a not-found page, while NAVER returns a search result set (not verified as an exact standalone entry). 𠮷 remains supplementary-plane 𠮷; Nihongo shows not-found and NAVER explicitly shows no search results. The parent application cannot read these cross-origin states, so it never claims a match based on an iframe load event.

### Recognition options and licensing

The inspected kanjicanvas commit is `a9214105f156def3b96930e5fcf10b7652b7a1f7`, dated 2024-07-21, the upstream master head returned at acquisition. There is a maintenance-age risk; no claim of active maintenance is made. Sources and 6,705,472-byte pattern asset are vendored with SHA-256 provenance. The upstream license text includes attribution and backlink requirements; preserve both. No runtime package dependencies or recognition service charges are introduced by the local engine.

Upstream canvas handling uses mouse/touch events and is not suitable unchanged for the requested Pointer Events/high-DPI experience. The prototype owns stroke capture and sends normalized 0–256 coordinates to the worker. It calls the real normalization, extraction, coarse classification, and fine classification functions without invoking upstream UI handlers. The worker keeps recognition off the input thread; the reference data loads once at startup. Cold startup/font/network/memory costs are not comprehensively benchmarked.

NAVER Cloud [CLOVA OCR](https://www.ncloud.com/product/aiService/ocr) documents Japanese handwriting support. Its [General OCR API](https://api.ncloud-docs.com/docs/en/ai-application-service-ocr-ocr) requires a provisioned endpoint and `X-OCR-SECRET`. This is an image/document OCR service, not documented access to the dictionary stroke engine or an ordered top-N single-kanji candidate API. It would require credentials and a server-side secret boundary, plus separate accuracy, pricing, data-handling, and license evaluation. No cloud account was provisioned, no billable requests made, and current pricing was not established. It is not selected for this spike.

### Display options and recommendation

| Option | Preserves original pages? | Trade-off |
| --- | --- | --- |
| Direct dual iframes with original-page links | Yes, inside the workspace in tested Chromium | Closest to the requested interaction. Third-party minimum widths, advertisements, permission uncertainty, cookie policies, and future framing changes remain outside application control. |
| Explicit links opening browser tabs | Yes, in separate tabs | Verified destinations and simple fallback, but simultaneous in-app reading is lost. |
| User-arranged browser windows | Yes, simultaneously outside the app | Potentially retains side-by-side reading; automatic positioning and named-window reuse are not tested and must not be promised. |

**Recommendation:** approve direct original-page iframes as the conditional display direction, retain explicit original-page links, and avoid claiming guaranteed embedding or production permission. The application must never strip security headers, proxy protected pages, hide original-site content, or inspect third-party DOM. A dictionary clone is not proposed.

Same-origin restrictions prevent application-controlled result inspection, scroll synchronization, or reliable framing-failure detection. Missing Access-Control-Allow-Origin does not prevent ordinary iframe navigation. Browser automation can inspect frames with testing privileges; this does not grant equivalent powers to application JavaScript. The iframe load event indicates navigation lifecycle only.

## Verification and reproduction

1. Run the local server using the README instructions; select 日 through manual input. Confirm original source titles and results in both frames. Repeat with 人、学、語、鬱、學、𠮷. No authentication was needed for this test; authenticated cookies and stricter third-party-cookie configurations remain unverified.
2. Draw three horizontal strokes, select recognition, confirm 三 among real candidates, select it, and observe both destinations. Undo reduces the count by one; clear resets it to zero. The browser smoke test measured approximately 7ms engine time for 三.
3. Focus the divider, press ArrowRight, and confirm 50→55; reset returns to 50. Pointer resize implementation exists; automated drag verification remains pending.
4. Open `/responsive.html`, choose each target width, and inspect the shell. At 390px, press Enter on NAVER and ArrowLeft to return. Browser viewport overrides did not affect the target tab, so these screenshots explicitly use a CSS iframe harness. They are not iOS/Android/device-emulation results.
5. Run `npm test`: five tests passed, covering Unicode preservation, invalid input, stroke validation, real recognition without input mutation, and honest empty candidates. Run `/benchmark.html` for browser timings and `npm run benchmark` for Node timings. Raw browser p95 was 28.1ms; Node VM p95 was approximately 688.8ms. These are distinct runtimes and must not be conflated.
6. Run the header probe to reproduce only the small specified URL matrix. Review `evidence/headers.json`, `browser-dictionaries.json`, `browser-edge-cases.json`, `browser-benchmark.json`, `geometric-benchmark.json`, `responsive.json`, and the screenshots.

Screenshots were visually inspected. The disposable UI has deliberately plain styling. Observed design issues to resolve after approval: verbose pane status consumes reading space; NAVER needs horizontal scrolling in narrow panes; original-site headers consume substantial mobile reading space; controls wrap at small widths; the drawing panel occupies substantial height when expanded. Third-party layouts cannot be restyled from the app. No polished-design or anti-slop acceptance claim is made.

### Source policies reviewed

- [Nihongo copyright and usage](https://nihongokanji.com/copyright/): direct links permitted; automated extraction, off-site content storage, redistribution, and commercial uses have explicit restrictions or advance-contact requirements. No bulk extraction or dictionary body storage performed.
- [NAVER service terms](https://policy.naver.com/rules/service.html): content rights remain with rightsholders; reviewed terms do not establish an affirmative third-party framing license.
- [NAVER public API catalog](https://developers.naver.com/products/intro/plan/plan.md): no documented dictionary handwriting API identified in the reviewed catalog.
- [kanjicanvas source and README](https://github.com/asdfjkl/kanjicanvas), plus the locally preserved upstream license and provenance manifest.

## Go / no-go and next gate

**GO:** local prototype evaluation, verified character search navigation, and real local recognition experiments.

**CONDITIONAL GO:** original-page iframe direction, subject to explicit user approval and unresolved production permission/browser limitations.

**NO-GO for a production-complete claim:** independent 60-sample handwriting evaluation, real touch/stylus/cancellation/DPR validation, Firefox/Safari/Edge tests, comprehensive accessibility/error/performance checks, final architecture, and design approval are outstanding.

The next requested decision is approval of the reference-display direction. After approval, research at least six real websites, create three distinct design proposals with visual mockups, and obtain visual-direction approval before final UI implementation. That work and deployment have intentionally not started; these are the explicit gates in the approved user plan, not new approval requirements introduced by a skill.
