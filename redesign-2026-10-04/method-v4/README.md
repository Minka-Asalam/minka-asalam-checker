# Method v4 — the fixes from the review panel (4 Oct 2026, night)

The tested versions stay untouched in `../test-2videos/` and `../test-fresh/` so their results can be reproduced. v4 is the version for the re-test.

| File | What changed (panel finding) | Test |
|---|---|---|
| `hadith/chain6.mjs` | grade read from a fixed word list, whole words, negations first, the first verdict word decides; a suspended Bukhari/Muslim entry is graded, not auto-sahih (v1 read «صحيح، وهذا إسناد ضعيف» as weak, «ليس بصحيح» as sahih, «رواه» as «واه») · pick: wording before tier · safeguard switches only to a sound narration that carries his words · "partly" carried as by_meaning · a missing model answer is pending, not not-found · every accepted grader of the same narration kept, "graders differ" flagged (level by the written rule, rank at the weaker; sahih-vs-hasan and chain-only grades stay the owner's open questions) | `tests/test-grade.mjs` 19/19 |
| `hadith/hcheck2.mjs` | the speaker's words from the claim's OWN video (v1 used the group's first video; harmless in the test, each group held one video) · judge only from the text · "who said it" (prophet / qudsi / companion) against how he introduced it | syntax |
| `verses/verses2.mjs` | in-order comparison per recited stretch (dropped, added, reordered words, a dropped negation at the edge), the Mushaf spelling accepted (dagger alif), no blanket alif deletion; the range-gap search only adds a verse that removes 3+ and half of the unexplained words | `tests/test-verses.mjs` 9/9; the ten videos' 24 verses: 19 match, 5 flagged are real (3 descriptions, 1 qala/qālā to a listener, 1 slip in 5:38) |
| `rulings/ladder4.mjs` | fatwa: only the answer block (opening to «والله أعلم», never the related-links menu) · split: every part carries his EXACT words + how he framed it (rule / one_view / agreement), checked by `checksplit` · judges decide from the text only and copy the sentence, checked by the script · "partly" → narrower / one_view / other_view (+ more, opposite with a strict meaning) · narrower goes back to Opus for a fuller page · `record` maps verdict + framing to a fair state (colour the evidence, never the person; every correction confirmed by the owner) | `tests/test-fatwa.mjs` 3/3 (zakat #4, #8, #20), `tests/test-state.mjs` all |

Run order for rulings: `s0 → merge s0 → checksplit → q1 → merge q1 → books → (fatwa-urls.json) → fatwas → q2 → merge q2 → final → valid → merge valid → redo → merge redo → final2 → valid2 → merge valid2 → record`.

**Added 5 Oct:** `poetry/poetry.mjs` (the poetry kind, 242 + 243: aldiwan.net, "the oldest record we found"; `tests/test-poetry.mjs` 7/7) · `books/bookStatus.mjs` (the owner's unreviewed-book rule: a book not cleared on claim_sources is flagged for the review page; 245 cleared three; `tests/test-books.mjs` 7/7; wired into ladder4 `record`).

**Not in v4 yet:** the step that writes the viewer's line (all 18 reviewers); a Companions'-reports path before the fallback; Dar al-Ifta al-Misriyya in the fatwa search; search by meaning (the retrieval specialist's test plan, ≈ $10–30).

**The re-test (owner, 4 Oct night):** on the 30 challenge clips, after S4's measured run of today's checker on them (no deadline). v4 runs on the same clips; the owner's review of 5 Oct is the independent answer key; scored blind (the owner does not know which side produced a page), "partly"/"opposite" kept in their own columns, the cost from real token counts.
