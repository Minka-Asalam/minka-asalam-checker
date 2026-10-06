# Inventory C: the record and the review (compiled 4 Oct 2026)

Stage C of the claims-pipeline redesign inventory. Read-only survey; every number is copied from the file named beside it. Abbreviations: CFR = memory project_deeni_claims_flow_redesign.md; SUV = memory project_deeni_sources_under_video.md; PR = memory project_deeni_printed_references.md; BZ = memory project_deeni_bazil_ai_challenge.md; NOTES = Docs curation/2026-09-30 Checker v2 test/run 2026-10-01/NOTES.md; BL = memory project_deeni_backlog.md.

## Items

**1. Legacy record (181-207)** · one public row per claim (`video_claims`, reader-shaped columns only) + moderator-only `video_claim_checks` (verdict, severity, harm, reason) + `video_claim_reviews` (per video) · rows inserted HELD, then checks + review row, then `published = true`; a publish-guard trigger on every write · measured: 594 claims on 53 videos, 588 published; verdicts 530 ok / 41 imprecise / 23 weak; harm 563 none / 24 minor / 7 real / 0 severe (23 Sep, BZ); re-read 26 Sep: 568 rows a reader can reach on 51 videos (BZ) · worked: database refuses bad publishes; judgment never public · failed: one `corrected` flag carried three situations (33 rows, SUV); `standing` shown as words with no source (147 claims, PR); grader names came from model memory (202, 1,253 hits, SUV) · status: live for every claim with `state` null (all videos except the ten) · where: supabase/181-207, mobile/scripts/gen-claims-migration.ts.

**2. Harm ladder (184)** · per claim harm none/minor/real/severe + load_bearing + correction none/silent/shown; video decision publish / publish_corrected / hold / out · computed by post-claims, enforced by guard (severe refused regardless) · measured: batch B full-model re-run found 4 red videos + 1 marked OUT where the lite pass found none (SUV) · status: live; in the new record "severe" is moderator-only, the checker caps harm at "real" (CFR) · where: supabase/184, video_claim_checks.

**3. Reader states derived, not stored (194/195)** · misworded / weak / disputed / plain derived in sourceCaption.ts; "Corrected" wording retired; a published disputed row must name a source · status: live for legacy rows; superseded by the 9 states · where: SUV, supabase/194-195.

**4. Printed-page columns (209)** · source_volume (text), page, edition, `source_page_url` pinned by `?versionId=` (CHECK) · measured 24 Sep: of 151 published rulings 93 name a work, 3 give volume+page (209 header) · decided: no "must have a page" rule, ever (209 header) · status: live · where: supabase/209.

**5. claim_assertions (211 + 212 + 214)** · one row per thing a reader line asserts (kind, origin spoken/checker, own citation + verbatim quote required with a link) · measured 25 Sep on 19 unsourceable rulings: 18 composite; 30 of 59 limbs on a page, 29 not in the book; 14 overstated, 3 wrong book, 3 reversed a school (PR; CFR says "29 of 59 parts" unsourced, same data) · 212 applied 28 Sep: 94 citations on 80 claims (62 ruling + 32 limbs); 214: 14 lines rewritten, 2 re-pointed, 1 chapter cleared (PR) · failed: 212's first run raised "74 primary, expected 62" (primary inferred from position) - fixed with `is_primary` (PR); re-point bug: slug swapped, coordinates not re-resolved (PR) · status: live; 218 made it the PART table · where: supabase/211, 212, 214.

**6. Owner review pages, legacy generation** · batch A: static page read in prose, overrides hand-written; batch B (24 Sep): interactive artifact with Publish / Hold / Needs-a-fix per row, pipeline decision pre-filled, opens on "Needs you", language switch, decisions in the page db read back by ArtifactData (SUV) · measured: build cost about two hours each (SUV) · failed: batch B (317 claims) never reviewed; migration 205 reserved; must now use the new record (BL) · status: pattern reused; batch B dropped to the new pipeline.

**7. Pre-apply review workflow** · three readers over a generated migration (DB rules, every reader line, every source vs its dorar hit) · measured on batch A: 3 blockers + thirty smaller findings the generator let through (SUV) · status: used on batch A; not repeated on 225/226 (dry run in rollback used instead).

**8. Printed-references review page** (WRz8wtX24TMhUR5ynYSMhK) · `rewrites/<id>` accept/edit/keep, `reading/<id>` yes/no/partly · measured 27 Sep: rewrites 16 accept + 1 keep; reading 14 yes + 1 partly (PR) · status: closed.

**9. Flows page review** (HoyF9wWrYnPVPNExZAJ3bk) · per exit accept / edit / reject / needs-a-shaykh; a "for the shaykh" tab · measured: 109 of 109 exits accepted as drafted, none edited/rejected/marked (30 Sep); 124 product recommendations accepted in one sentence (30 Sep night); 133 open questions split 9 scholarly / 74 product / 50 both, 59 on the shaykh tab (CFR) · worked: owner called it the explainer for judges and scholars · failed: two accepted exits contradicted others (fabricated, worldly figure) - caught later, flipped (CFR) · status: done; is the spec of 218.

**10. The record model (218)** · four reference tables of scholarly DATA with status provisional/cleared, cleared_by, version, revised_at: `claim_states` 9, `claim_levels` 40, `claim_exits` 109, `claim_sources` 23 (9 verified copies cleared, 14 provisional); parts get flow_kind/exit_id/state/level/said_text/source_link/difference/search_log; claims get state (worst), level, flow_kind, sub_kind; kinds report + fatwa legal; six legacy publish constraints waived when state is set; RLS everyone reads, moderators update, no client insert/delete · measured: 10 refusal tests passed live; 0 rows carried a state at apply (30 Sep, CFR) · level scales: Qur'an 0-3, hadith 0-5, ruling 0-5, fatwa 0-4, report 0-6, number 0-6, no_origin 0-4 (no exit lands on 1-4) (CFR) · two axes applied to 109 exits: matches 38, not found 22, corrected 19, re-kinded 12, not a claim 7, by meaning 3, overstated 3, pending 3, not checked 2 (28 Sep, CFR) · reverses 181's never-publish-fabricated: a fabricated hadith with a state publishes "corrected" with grader's word (CFR) · status: live · where: supabase/218_claims_record_model.sql (436 KB), gen-record-model-migration.mjs, Docs Sources_Under_Video_218_refusal_tests.sql.

**11. Checker v2 review page** (3LhRzWXoMQczbGe6Q9kFMj) · old record beside new, accept/edit/reject per claim, db `claims/<videoId>__<i>`; built by assemble-v2.js which flags unknown exits, exit/state/level mismatch, book page without quote; corrections kept as data in corrections.json · measured (1 Oct, NOTES): 147/147 results, 198 parts, 99 book citations all with tool-printed quote, 0 unknown exits; states matches 128 / not_found 10 / by_meaning 3 / pending 4 / not_a_claim 2; harm none 133 / minor 14; old→new ok→matches 116, ok→not_found 10, imprecise→matches 9 · owner found on the page: 6 groups (17 of 147 claims) were one source unit cut into pieces; later ruled 5 groups (Ashura pair is two hadith) (CFR) · grouping same-source parts: 31 of 147 claims, 69 parts (NOTES 16) · decisions: 147/147 decided, "146 accept + the 4,500 note" (CFR); NOTES 15 also records one EDIT ("Misworded", tiDYQlk7_Q0 #9) - the two sources word it differently · failed: assemble-v2.js reads from a session scratchpad path (fragile) · status: done.

**12. Write-backs 225 / 226 / 228** · generators turn reviewed results into SQL: parts in first, then claim takes its state; folded pieces HELD, never deleted; `origin 'implied'` = a part not said (no words, no time); sourced part needs `source_title_ar` · measured: 225 (1 Oct) Fajr video 18 → 12 claims, 28 parts; 226 (2 Oct) 123 claims published + 172 parts, 4 folded held, 2 not-a-claim held; live total 137 claims with state (135 published), 200 parts (NOTES 18, CFR) · 228 (2 Oct) corrected 3 grades 226 wrote as weak → sahih / sahih / hasan · failed in dry run: `claim_exits.revised_at` NOT NULL; folded rows keep null state, probe must read "published and state is null"; `video_claim_reviews` keyed per video (CFR) · status: live · where: supabase/225, 226, 228; Docs tools 2026-10-01 claim display/gen-225.mjs, tools 2026-10-02 write-back 226/gen-226.mjs (+ titles-226.json, 141 links named both languages).

**13. Publish guard 229** · a claim with a state publishes only if every part with a state names an exit that is `publishable` (NULL or missing = refuse); a published claim's part cannot move to a hidden exit; an exit in use cannot be closed; hadith re-kind exits closed; `x_pending_lookup` added · measured: 0 published rows on a hidden exit before apply among 135; 11 refusal tests live (2 Oct, CFR) · status: live · where: supabase/229, Docs tools 2026-10-02 publish guard 229/gen-229.mjs, Sources_Under_Video_229_refusal_tests.sql.

**14. Grading check against the linked page** · check-gradings.mjs compares each hadith line with its dorar page (curl, no model) · measured: 61 of 252 published legacy lines mismatch (33 flattened, 7 different grade, 23 book not named), 10 unclear, 5 link a search page (SUV); v2 test 63/70 parts match, 6 failures = checker note inside the grader's word (CFR); joined dry run 28/28 (CFR) · rule: store the page's word alone; a grading is never rewritten by script · status: a must-pass gate before write-back.

**15. Review panel method** · scholar + sceptic + six research-based simulated visitors, separate, merged by topic, v2 with "what changed and why" · measured: Visitor map, ~10 min wall clock (2 Oct, reference_review_panel_method.md); 5-8 of 8 agreement = signal · status: used on maps; NOT yet used on claim records · limit: cannot rule on religious content.

**16. Rules version stamp** · each result stamped with the rules version (reference tables already carry version/revised_at per row) · status: PROPOSED for the Checker and the public repo; plans say "note the rules version and the package's commit in the results file before the first run" (Docs Bazil_Challenge_Days_2026-10/plans.html; BL) · no stamp column exists on claims today.

## Rules and lessons that must survive

- The record unit is SAID vs SOURCE; the checker's own line is never what viewers read (CFR decision 1).
- Colour the evidence, never the person; no per-video or per-speaker total, count or score ever shown (CFR decision 2). The panel warned a weak line beside a teacher's face can read as a verdict on him (runbook.html).
- Harm marks stay moderator-only and are left out of the public repo; checker reasoning goes public only labelled "the checker's working note, written before human review" (BL, plans.html).
- Two axes: LEVEL = strength of source found; STATE = what the comparison found; tone from state first; a multi-part row shows its worst state (CFR decision 11).
- Unsourced part shown as NOT FOUND with the speaker's words kept; never dropped (CFR decision 4). No link rather than a wrong one (PR).
- A reversed attribution is shown, never silently replaced (CFR decision 3).
- Scholarly content is data rows marked provisional/cleared; a scholar's answer changes a row, not code (CFR decision 12).
- Reasoning stays internal; viewers get fixed slots (CFR decision 7).
- Folded pieces are held, never deleted; parts written before the claim takes its state (225/226 headers).
- Carry the QUOTE, not the page; every stored link pinned by `?versionId=`; a re-point re-resolves volume/page/quote in the new book (PR).
- Every apply-time probe carries its expected count (PR, 212 lesson); "applied" only after a live probe (lessons).
- Coalesce every comparison in a security-definer guard; NULL must refuse (feedback file; 229 header).
- Redefine a function/constraint from LIVE state, not the file you had open (lessons; 229 copies 218's branches word for word).
- PostgREST returns at most 1,000 rows silently; read with pagedSelect.ts, ordered on unique columns (lessons). The record will cross 1,000 parts on the full run.
- A failed Supabase read returns `{data: null}`, not an error; the display falls back to legacy on a failed label read (lessons, CFR).
- The Arabic reader never meets a Latin word in a source line (SUV, 196).
- Keep the sceptic: it changed substance in 8 places (NOTES 7).
- A one-letter Qur'an transcript difference is decided by a moderator's ear, never the checker (NOTES 15).
- A workflow agent sees the whole disk: keep answer keys (e.g. a reviewed page) out of reach (lessons).
- Read every finished public text against live data before handing it over (BZ).

## Open questions

- How long a review takes was never measured (no timing on any page). The runbook allots 5 Oct 09:00-13:00 for 30 clips; the 147-claim page was decided over 1-2 Oct.
- Rules version stamp: format, where stored, what it covers (tables' version vs package commit).
- Shaykh clearing: all rulebook entries, 14 provisional sources, x_derived, x_pending_lookup, "graders differ" exit, whether sahih-vs-hasan counts, al-Dhahabi and the Ibn Hajar list (CFR).
- no_origin levels 1-4 unused: keep or drop (CFR).
- Recall: what the checker misses is not measured (recall test dropped 3 Oct, BL).
- 88 of 200 live parts share the claim's start and end (Gemini timed claims, not parts); no re-timing queued (CFR).
- History + saying conversion to report sub-kinds "with the display migration": not confirmed done.
- Legacy rows (~48 batch A videos + batch B) remain on the old record until the big run.
- Review flag for long narrations sourced whole to one book (Khaybar case) - planned, not built.
- Moderator UI needs "listen at timestamp" (NOTES 5).
- Review panel method never tried on claim records.

## Numbers

| What | Value | Date | Source |
|---|---|---|---|
| Legacy claims / videos | 594 / 53 | 23 Sep | BZ |
| Legacy published rows | 588 (568 reachable, 51 videos) | 23 / 26 Sep | BZ |
| Verdicts ok / imprecise / weak | 530 / 41 / 23 | 23 Sep | BZ |
| Harm none / minor / real / severe | 563 / 24 / 7 / 0 | 23 Sep | BZ |
| Batch A claims, published, held, corrected | 535, 530, 5, 32 | 22 Sep | SUV |
| Batch B claims (full model) vs lite | 317 vs 210 | 24 Sep | SUV |
| Rulings with volume+page | 3 of 151 | 24 Sep | 209 header |
| Unsourced standing badges | 147 | 25 Sep | PR |
| Limbs not in the book | 29 of 59 (14 overstated, 3 wrong book, 3 reversed) | 25 Sep | PR |
| 212 citations | 94 on 80 claims | 28 Sep | PR |
| Rewrites review | 16 accept + 1 keep | 27 Sep | PR |
| Reading review | 14 yes + 1 partly | 27 Sep | PR |
| Exits accepted | 109 of 109 | 30 Sep | CFR |
| Product recommendations accepted | 124 | 30 Sep | CFR |
| Open questions | 133 (9 / 74 / 50); 59 to shaykh | 30 Sep | CFR |
| Reference rows at 218 | states 9, levels 40, exits 109, sources 23 (9 cleared) | 30 Sep | 218 probes |
| Exits now | 110 in record-model.json (x_derived); 111 after 229 | 1-2 Oct | record-model.json; CFR |
| 218 refusal tests | 10 passed | 30 Sep | CFR |
| v2 test claims / parts / book cites | 147 / 198 / 99 | 1 Oct | NOTES |
| v2 states | matches 128, not_found 10, by_meaning 3, pending 4, not_a_claim 2 | 1 Oct | NOTES |
| v2 run cost | 20 agents, 4,103,755 tokens, 61 min | 1 Oct | NOTES |
| Sceptic substance changes | 8 | 1 Oct | NOTES |
| One unit cut into pieces | 6 groups / 17 claims; later 5 groups | 1 Oct | NOTES, CFR |
| Same-source part groups | 31 claims, 69 parts | 1 Oct | NOTES |
| Review decisions | 147/147 | 2 Oct | CFR |
| Live new record | 137 claims (135 published), 200 parts | 2 Oct | CFR, NOTES |
| 225 / 226 | 12 claims, 28 parts / 123 claims, 172 parts | 1 / 2 Oct | NOTES |
| Grades fixed by 228 | 3 | 2 Oct | 228 header |
| 229 refusal tests | 11 | 2 Oct | CFR |
| Legacy hadith lines off their page | 61 of 252 | 1 Oct | SUV |
| v2 parts matching dorar page | 63 of 70 | 1 Oct | CFR |
| Parts sharing claim start+end | 88 of 200 | 3 Oct | CFR |
| Review page build cost | ~2 hours | 24 Sep | SUV |
| Review panel wall clock | ~10 min | 2 Oct | review panel method |
