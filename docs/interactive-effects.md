# Adaptive interactive design

The focal interaction is a selected kanji settling into the selected-character output. Supporting feedback includes a short ink impression on button presses, up to eight staggered candidate/result entries, clipped panel reveals, a folding recall-answer reveal, toggle-thumb continuity, and a small pointer-following mascot response. No layout-wide entrance choreography or idle animation loop is used. Existing light/dark palettes and border hierarchy are preserved. The drawing canvas is never transformed, so stroke coordinates remain stable.

## Modes

The settings panel exposes a keyboard-accessible three-way control: automatic (default), on and off. Only the preference is stored in `kanjimaster.effects`; other tabs synchronize it. Denied storage retains the page choice and reports the failure. The effective tier and reason are shown in ordinary language.

- Off cancels active Web Animations, pending reveal work, frame sampling and mascot tracking; existing button press transforms/transitions also stop.
- On ignores automatic hardware/data-saving estimates. OS reduced motion still selects gentle color/opacity feedback, with no spatial movement or pointer following.
- Automatic turns off for OS reduced motion, data saving, <=2 logical cores, <=2 GB exposed device memory, or sustained frame intervals above 45 ms. <=4 cores or <=4 GB, touch-oriented pointers, missing performance evidence, or intervals above 24 ms select gentle feedback. Fine-pointer devices with >=8 cores or >=8 GB exposed memory can use full effects if no limiting signal exists.

These are conservative heuristics, not a GPU benchmark or OS-brand ranking. Browser CPU and memory values are coarse and sometimes unavailable. OS settings, rather than user-agent sniffing, express platform preferences. No GPU identifiers, battery permissions, remote classification or telemetry are used.

## Budget and lifecycle

Twelve foreground frame intervals are sampled on startup and once during the first search when automatic effects are active. The median avoids an isolated startup stall. Sampling is bounded and not continuously repeated; a slow result lowers the tier rather than flapping between levels. A changed preference or environment resets the estimate. An unchanged decision does not interrupt an active selection animation. Explicitly choosing on bypasses frame-based downgrades.

Animation batches are capped at sixteen elements, list stagger at seven delays of 12 ms, routine effects at 140–240 ms and selected-character/ink feedback at 380 ms. Content remains present by default; animations have no retained fill that could hide it. Blur is confined to the small selected-character output. Only pointer movement schedules mascot updates, with at most one read/write per animation frame. Hidden tabs cancel work; returning can resume an unfinished bounded sample. Mutation observation does not cross iframe documents. Closing/opening panels preserves reference iframes.

## Validation

47 tests pass, including capability decisions, unknown/invalid device information, reduced-motion/data-saving paths, manual overrides, denied storage, frame median calculation, immediate cancellation, background lifecycle, cross-tab changes, gentle non-spatial keyframes, and unchanged-decision continuity. Runtime tests execute the actual motion controller against deterministic frame/event doubles. Browser checks confirm ink impressions exist and clean up, forced-off transitions compute to zero, mascot transforms reset, preferences survive reload, and the settings panel remains usable at mobile width in light and dark themes. Existing notebook, recognition, domain and theme tests continue to pass.

Real OS preference changes and physical low-end hardware were represented by deterministic tests, not physical-device certification. Automatic classification is deliberately conservative where browser capabilities are missing. Existing canvas drawing-guide gradients remain intentional; no new decorative glow or palette exception was introduced.
