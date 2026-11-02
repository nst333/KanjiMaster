# Learning notebook

The screen answers: which searched words should I revisit, and can I recall them from my own notes?

Saved data is a term (exact Unicode), optional learner note, creation time and last remembered time. It starts empty; there are no seeded entries or invented dictionary definitions. A Korean learner can save a handwritten candidate or typed word, add a reading/meaning, reopen its dictionary results, or practice recall in a focused dialog. Terms with notes are ordered by the least recent remembered time; unreviewed words come first. Retry rotates the queue, and remembering removes the word for this session. This is a simple recall queue, not a claim to a validated spaced-repetition algorithm.

The existing NanumSquareRound, pastel/mint/lavender and dark blue-gray themes remain authoritative. The app design sheet used Achromatic ledger (seed 562451690), preserving palette and type: a flat ruled list, quiet controls, and Japanese terms as the distinctive content. The existing shell is preserved. There are no new illustrations or chart surfaces. An initially collapsed panel keeps dictionary lookup first; its two controls sit beside the existing workflow. Dialog backgrounds hide the searched word and saved list so the prompt does not reveal the answer. The dark-mode border hierarchy remains intact.

Validation: 34 automated tests pass, including notebook reload, duplicate save preserving notes, Unicode variation selectors, corrupt-data preservation, failed writes, undo, latest-list cross-tab updates, 500-word capacity and recall ordering. Browser checks covered empty/saved/editor states, reopen search, duplicate save, deletion and undo, reload, reveal/retry/remember/completion, Escape/focus restoration, light/dark and mobile. The source lint and Impeccable detector reported no issues in the new UI.

Taste inspector rendered 1440/768/390 screens after an elevated retry. Its gradient finding is the existing canvas crosshair (a drawing guide rather than decorative fill); fallback Japanese font and pre-existing compact labels/empty drawing areas were left in place to preserve the lookup workspace. The generated screenshots were visually reviewed; the notebook panel and review dialog were separately exercised with real test entries. Test data lives only in the local test browser, not in the source or deployed site.

Storage is local to this browser, not account sync. Storage errors are shown to the learner; malformed records are not replaced. A deletion can be undone once while the page remains open. No external messages or note uploads occur.
