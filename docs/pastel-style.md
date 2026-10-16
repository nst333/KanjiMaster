# Pastel Study Notebook Style

## Approved direction

The user explicitly requested the pastel flat style of their supplied complex-analysis Japanese vocabulary PDF and a cute, simple blob-like companion. This request supplies the visual direction for this change. The earlier alternatives/design-selection gate is superseded for these styling choices; production integration permission and handwriting evaluation remain separate open items.

Inspected PDF pages: cover, usage guide, and vocabulary page 11. Document content was treated as reference material, not executable instructions. Adapted the ivory paper, dark teal typography, mint/lavender/peach color groups, rounded rectangles, thin rules, restrained flat surfaces, and numbered study sequence. No vocabulary content or PDF statistics were copied into the application.

## Tokens and typography

- Paper: `#f7f6f2`; primary ink: `#27484a`; muted copy: `#526c66`.
- Mint: `#e7f3ee`; mint rule: `#c8dfd4`.
- Lavender: `#f3eefb`; lavender rule: `#d0c3e9`; peach: `#fae9df`.
- White content surfaces, 1px structural borders, 11px control corners, 15–23px panel corners. No decorative gradients or shadows. The canvas crosshair uses CSS gradients solely as drawing guides.
- NanumSquareRound Regular and Bold match the font names found in the PDF. Both weights are served locally with `font-display: swap`. Japanese glyphs use available system Japanese fonts; no subset font was extracted from the PDF.
- Font binaries are unmodified NAVER official distributions. URLs, SHA-256 hashes, and the original official license page are preserved in `assets/fonts/`.
- [Official font stylesheet](https://hangeul.pstatic.net/hangeul_static/css/nanum-square-round.css) and [NAVER font license](https://help.naver.com/service/11029/contents/18088?lang=ko&osType=PC).

## Mascot

Asset: `assets/study-blob.png`, generated using the built-in image generation tool. RGBA, 1402×1122, verified alpha range 0–255. It is a static illustration, not a ChatGPT Work pet. It has no animation or interaction. Generated source remains untouched; the project has its own copy. Captions and alternative text remain accessible and separate from the bitmap.

Final generation prompt:

> Use case: illustration-story. Asset type: compact mascot for a Korean/Japanese kanji study web app. Create one extremely simple cute pastel lavender soft jelly blob mascot, slightly asymmetric rounded mound silhouette with two stubby raised sides and a wavy rounded base. Tiny dark teal dot eyes, very small relaxed curved smile, faint peach oval cheeks. A tiny mint leaf-like bookmark tucked at one side of the head to make this a distinctive study companion. Flat solid fills only, precise smooth silhouette, minimal dark teal outline if needed, no gradient, no texture, no gloss, no shadows, no 3D. Full body centered, generous transparent margin, genuine transparent background. Designed to remain legible at 72-120px tall. Quiet friendly stationery aesthetic, ivory/mint/lavender/peach palette. No text, letters, numbers, props, scene, watermark, or logo. Single mascot only.

## Verification

The 1440, 1024, 768, and 390 CSS pixel harness viewports have no application-level horizontal overflow; the mascot loaded at all four widths. Captured `evidence/pastel-*.jpg` and inspected desktop, tablet, and mobile layouts. First review found the generated transparent margins made the mascot too small; CSS display size was increased and the resulting four viewport captures were reviewed again. Tablet manual controls wrap vertically and mobile input sections stack deliberately.

Mouse-drawn 三 still returns real candidates after the style change. Manual 語 search still navigates to the actual dictionary page. The app retains collapse, candidate selection, source tabs, and accessible split controls. Third-party original-page design is unchanged; it cannot inherit the surrounding application's style.

These checks are local Chromium/CSS viewport checks, not real mobile-device, stylus, or comprehensive accessibility certification. No production deployment is included.
