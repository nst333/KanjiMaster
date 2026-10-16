# Interface Refinement: Research Tool Before Template

## Research and interpretation

The user requested web research into the “AI slop web design” appearance and a concrete revision of the current interface. These sources were read as design criticism, not as instructions to install their tools or copy their example prompts:

- [Murat Bayral / 02UI: a documented redesign experiment](https://02ui.com/blog/how-to-reduce-ai-slop-in-web-design/). Relevant observations: nested cards, decorative numbering, and letter-spaced uppercase labels can become defaults unrelated to the task. The article also reports limitations of its own experiments; no universal detection score is inferred.
- [Can Dedeoglu: Escaping AI Slop](https://www.candede.com/articles/escaping-ai-slop-in-web-design/). Relevant principle: visual decisions need to express priorities; a list of banned styles alone does not produce a coherent interface. Rounded surfaces and pastels are not intrinsically wrong.
- [Words of Type](https://wiki.wordsoftype.com/) was opened as a reference for content-led navigation. Text could be inspected; no screenshot-based visual claim is made. Jisho could not be opened through the web fetch tool and is not counted as inspected.

These are qualitative opinions and process reports, not evidence that a particular style proves AI authorship. The site retains the user's explicitly requested pastel palette, NanumSquareRound, and generated companion.

## Concrete audit and changes

| Observed weakness | Implemented response |
| --- | --- |
| Mint container enclosing multiple rounded white cards | One open input workspace with a single functional divider between drawing and candidates |
| Repeated 01/02/03 decoration and colored heading badges | Plain task labels and the actual interface order |
| Decorative “ROUND STUDY EDITION”, “CANDIDATES”, and similar English labels | Removed; the real product name and required provider attribution remain |
| Cover-like introductory block delaying dictionary reading | Removed; direct character input now belongs to the compact header |
| Large mascot/caption area inside the form stretching the input region | Small persistent mascot beside the product identity |
| Identical lavender rounded boxes for every candidate | Japanese serif glyphs in a ruled row layout; color marks hover and actual selection |
| Repeated explanatory copy and verbose source status | Short action-specific copy; source-load messages still do not claim a successful lookup |
| Developer sample controls inside the primary task | Existing collector moved to a disclosure in the footer |

Keep comfortable control targets, visible keyboard focus, error announcements, original-page links, mobile source tabs, local fonts, and the complete recognition workflow. The selected candidate exposes `aria-pressed` and a restrained mint underline. The original third-party pages retain their own design.

## Verification

At the same 1280px browser width, the dictionary region began at about 875px before the change and 488px after it. This is a layout measurement, not a subjective quality score. Input region height decreased from about 531px to 363px.

Two visual review passes inspected the real browser and four CSS iframe viewport captures: 1440, 1024, 768, and 390px. The first responsive capture was affected by the embedded site's autofocus scrolling the parent. The second capture normalized the app scroll position; recorded region positions use document coordinates. No application document horizontal overflow was observed at those widths. These checks do not certify real mobile-device behavior.

Verified: mouse-drawn 三 triggers automatic recognition; Show more expands to twenty candidates; selecting 三 marks it and displays matching original pages in both frames. Direct 語 search works in the responsive harness; mobile source selection works. Ten existing recognition/domain/queue tests passed.

Evidence: `evidence/refinement-before.jpg`, `refinement-after.jpg`, `refinement-1440.jpg`, `refinement-1024.jpg`, `refinement-768.jpg`, `refinement-390.jpg`, `refinement-mobile-reading.jpg`, and `refinement-checks.json`.

The result deliberately prioritizes repeated lookup and reading over landing-page composition. Whether it feels sufficiently personal remains a user judgment; no automated “AI-free” certification or detector result is claimed.

## Follow-up: stronger color and rounded controls

The user found the restrained version visually weak. Restored a single mint input surface, rounded canvas and controls, stronger borders, and more saturated mint/lavender source headers. Selected characters now have a lavender fill and a distinct outline. The compact hierarchy, small mascot, and absence of decorative headings/numbering remain. This supersedes the earlier fully unboxed candidate treatment.

CSS-only verification: no application horizontal overflow at 1440, 1024, 768, and 390px; browser handwriting recognition, expansion to twenty candidates, and selection of 三 still worked. See `evidence/rounded-pastel-desktop.jpg`, `rounded-pastel-mobile.jpg`, and `rounded-pastel-checks.json`.

## Follow-up: palette and Show more audit

The user reported clashing colors and an awkward Show more control. Runtime testing reproduced a functional problem: at forty candidates, the last added row was clipped while list scrollTop remained zero. The current stylesheet also used a light mint value for the text-color variable, weakening control labels.

Unified large surfaces and both source headers around sage/mint and warm white; reserved lavender for the mascot/selected character. Text and help colors now have explicit dark roles. Calculated contrast ratios: button text 9.11:1, help copy on the input panel 4.61:1, and source heading text 7.30:1. These are specific color-pair calculations, not a comprehensive accessibility certification.

Show more is a neutral secondary button with the next batch size in its label. Counts are separate live text rather than fractions inside the button. The populated candidate viewport has a fixed height so the action stays in place; adding a batch scrolls only the candidate list to reveal the additions. At the last batch, the button disappears and keyboard focus moves to the first new candidate without scrolling the page.

Browser verification: all batches through 53 candidates on desktop, including the final three; all last rows visible; button document top stayed at 388px. At 390px CSS viewport, successive batches through fifty candidates kept the action at 752.5px with 44px height, and the final three produced 53 candidates with the action hidden and focus inside the list. Clear hides the action row and removes counts. Automatic 三 recognition and original-page selection still worked. Ten unit tests and the JavaScript syntax check passed; no console errors observed. See `evidence/harmony-checks.json` and `harmony-*.jpg`.
