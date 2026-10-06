# Inventory A: listening and extraction (video to a list of claims)

Compiled 4 Oct 2026, read-only, for the from-scratch redesign of the claims pipeline. Every number is copied from the file named; nothing is estimated.

**Source keys** (memory = `C:/Users/user/.claude/projects/D--Deeni/memory/`; Docs = `D:/Deeni Docs/`):
CUR = memory/project_deeni_automated_curation.md · FLOW = memory/project_deeni_claims_flow_redesign.md · AIL = memory/project_deeni_ai_learning_experiments.md · LES = memory/project_deeni_lessons.md · BAZ = memory/project_deeni_bazil_ai_challenge.md · BL = memory/project_deeni_backlog.md · SU = Docs/curation/2026-10-01 Extractor source units/README.md (+ its `run */measure.txt`, `run.log`) · TGG = header of `mobile/scripts/tag-with-gemini.ts` (copy: SU folder `extractor-tag-with-gemini.ts`) · TIER = Docs/curation/2026-09-23 Sources back-fill B (Yasser Mamdouh) - the model tier finding.md · CR = Docs/curation/README.md · PKG = Docs/curation/cloud-package 2026-10-02 checker-v2 joined/README.md · DRY = Docs/curation/2026-10-02 Joined package dry run/README.md · NOTES = Docs/curation/2026-09-30 Checker v2 test/run 2026-10-01/NOTES.md · SPEC = Docs/Deeni_Claims_Pass.md · L5 = Docs/AI_Learning_2026-10/prompt-chain-L5/RESULTS.md · MOCK / RUNBOOK / PLANS = Docs/Bazil_Challenge_Days_2026-10/checker-and-clip-doors-mockup.html, runbook.html, plans.html

## Items

**1. The Gemini listen (claims pass inside the tagger)** · One request per video: Gemini is handed the public YouTube URL (nothing downloaded) and returns every checkable statement with kind, timestamp, verbatim quote, attribution, reference, `key_ar`, `stated_as`, `claim_en`, plus four flags. · Gemini free tier, `generativelanguage.googleapis.com/v1beta/interactions`, script `tag-with-gemini.ts`. · First test 21 Sep: 59 claims on 4 videos (13/25/16/5), verbatim in Egyptian dialect and English; 8 of 10 hadith found on dorar (CUR; SPEC says "all eight hadith with a key" were found). Cost ~1,500 output tokens per 25 claims, no extra listen (CUR, SPEC). Back-fill A 22 Sep: 535 claims on 49 videos (244 hadith, 127 verses, 120 rulings, 22 sayings, 15 history, 7 other), 224 of 244 hadith found on dorar (CR). · Worked: verbatim quotes never corrected toward the canonical text; one listen feeds tags and claims. · Failed: see items 4, 9, 10. · LIVE. · `D:/Deeni/mobile/scripts/tag-with-gemini.ts`.

**2. Kinds the listen emits** · `quran | hadith | saying | ruling | history | number | other` (full); `quran | hadith` only with `--claims=light` (scholars). · TGG lines 289, 346; SPEC. · Kind label accuracy, computed 3 Oct: the listen labels all 64 real hadith as hadith and 1 of 75 non-hadith as hadith (L5, AIL). · Mismatch: the redesigned flows use `quran, hadith, ruling, fatwa, report, number, no_origin` (FLOW decision 8, item 11); the listen never emits `fatwa` or `no_origin`, and history + saying were to merge into `report` with a sub-kind (FLOW, 124 recommendations). Ayat al-Kursi before sleep came labelled Qur'an and the checker re-routed it to hadith (DRY). · LIVE.

**3. Other fields: `attribution`, `key_ar`, `stated_as`, flags, audience** · `attribution` = only what the speaker said, never supplied; `key_ar` = the classical wording, 6–10 words, for a hadith-database search; `stated_as` definitive/opinion/disputed; flags takfir_of_persons, sectarian_polemic, sensitive_for_teens, political; audience captured but not written to the database (TGG, CUR). · Measured on batch A: 100% of hadith claims carried the classical wording dorar needs (CUR). · Failed: the OLD dorar step skipped hadith claims whose attribution was not the Prophet or whose reference looked like a verse key: 2 of 64 reached the checker with no lookup and ended "pending" (NOTES item 11). · LIVE (key_ar now a hint only; the checker searches dorar itself, PKG).

**4. Full vs lite Gemini models** · The script rotated models when a daily bucket ran out; lite models were at the end of the default list. · Batch B 22–23 Sep: 49 of 50 videos fell to lite; 3.5-flash-lite 34 videos at 3.6 claims/video (3 with none), 3.1-flash-lite 15 at 4.6, the one full-model video 18.0. Same two videos re-run on gemini-3.5-flash: 0→4 and 1→8, "1 claim against 12" (TIER). Full models on batch A: 3.5-flash 11.2, 3.8-flash 12.1, 3.7-flash 11.9, 3.6-flash 17.8 claims per 10 minutes (CUR). · Worked: full models interchangeable. · Failed: lite under-extracts silently; only the `model` field in each result file shows it. Lite pass discarded, nothing reached the database. · Lite DROPPED from the default rotation 2 Oct (811ff5a); default = four full flash models; a spent day stops the run (FLOW, BL, PKG). · `tag-with-gemini.ts`.

**5. Deep tagging vs claims-only listen** · `--claims-only` (22 Sep) asks for claims and flags alone, no 1,400-path tree; the prompt is "a fifth the size" (TGG). · Deep mode measured on AMAU 24 Sep: 77k–145k tokens per video; a day's full-model allowance carried 7 of 21 videos (CUR); a 10-min video ≈ 85k with deep mode (CUR). Prompt sizes in the 2 Oct logs: 4,184 chars (old claims prompt) vs 8,493 (v3 units) (SU run logs). · Status: claims-only is the claims route (PKG step 1). The deep tagging prompt now also cuts by unit — UNMEASURED (SU).

**6. Source units (v1 → v2 → v3)** · A claim = one source unit (one verse passage, narration, saying, ruling, episode, figure) with timed `pieces [{timestamp, timestamp_end, quote, voice: source|retelling, cue}]`, `unit` line, `inside`; the claim's time and quote are filled from its pieces so downstream reads it unchanged. · Prompt rules: commentary between pieces does not close a unit; nothing is dropped; the same unit again = more pieces; distinct rulings and each named school position stay apart; a four-way self-check (TGG 349–356). · Measured on the 10 test videos (147 claims): v1 dropped 12% and wrongly joined 2 of 14; v2 3 of 5 groups whole, 0 of 5 wrong joins measured, 6% lost, inside-cut 0 of 2; v3 (2 Oct) vs old prompt re-run same morning: groups whole 4 of 5 vs 1 of 5; with the builder 5 of 5; wrong joins 1 of 15 each; sayings inside other claims cut out 2 of 2 vs 0 of 2; published claims not found again 6 of 147 (4%) vs 23 of 147 (16%); tokens 622k (62k/video) vs 580k (58k/video) (SU). · Failed: the inside cut-out was unstable (v1 2/2, v2 0/2, v3 2/2 "one test"); v3's one wrong join = night prayer's time and its best time (pkH5vlUGc5U 18+19) (SU). · LIVE as default since c910b7e (2 Oct); `--sentences` restores the old cut. · SU folder; `tag-with-gemini.ts`.

**7. Why units (the old sentence cut)** · Checker v2 test 1 Oct: 6 groups, 17 of 147 claims, were one source cut into pieces (Sahih Muslim 680 told over 80 s, cut into six); the Ashura pair was later ruled a correct cut, so 5 groups (FLOW, SU, NOTES). Pieces checked alone landed "pending"/"not found" (TGG). · DROPPED for item 6.

**8. Continuation-first tool and the builder's merge (layers 2 and 3)** · `continuation.mjs` checks the next claim against the open source's full text before any search; `merge-units.js` merges same hadith/verse by time, only FLAGS same-page rulings, never joins through a claim resting on two hadith. · On the old cut: builder alone 3 of 5, continuation alone 3 of 5, both 4 of 5, 0 of 15 wrong (SU). First version of continuation.mjs: 20 wrong links of 26; after fixes 6 automatic links (5 right) (SU). In the 2 Oct dry run continuation answered "no" for every pair because the v3 listen already kept units whole (DRY). · Status: joined into the 2 Oct package (PKG); checker's by-meaning continuation "unmeasured until a checker run" (SU). · `SU folder/tools/continuation.mjs`, `builder/merge-units.js`.

**9. Timing (timestamps, ends, pieces)** · Timestamps MM:SS from the listen; ends added by a separate pass `claim-end-times.ts` on 21 Sep: 38 ends, 2–10 s each, none capped (migration 192) (CR). · Drift found: XG4P6tBuuzs Muslim 2588 at 12:24 in the 2 Oct listen vs 14:24 in the approved record (DRY, BL); the Hasan-and-Husayn hadith 3:41 vs 3:23 (DRY). 88 of 200 live parts share the claim's start AND end — "Gemini timed claims, not parts"; display spreads them evenly, no re-timing (FLOW). · Truncation: the v3 listen of 6lHj2h1NcFU has no claim after 4:56, so the 5:46 hadith was never handed to the checker — "the one miss was the listening step's" (DRY, BL). · Status: the 12:24/14:24 check placed in the runbook for day 1 13:45 (RUNBOOK, BAZ); open.

**10. Transcript slips on Qur'an quotes** · Two Qur'an parts held for a moderator's listen: pkH5vlUGc5U #8 (aqwa/aqwam, the machine transcript dropped a letter; owner accepted as exact) and tiDYQlk7_Q0 #9 (la/kalla, the speaker really misworded) (NOTES items 5, 15). · Worked: the Qur'an flow never decides a one-letter difference itself. · Need found: moderator UI "listen at timestamp" (FLOW, NOTES). · Gate live in the flows.

**11. Gemini's own run-to-run variance** · A second listen with the OLD prompt missed 23 of 147 published claims (16%) (SU). · A fact to design around.

**12. Free-tier quota handling in the script** · Rotation of the four full flash models; two consecutive 500/503 rotate; "limit: 20 requests per day" rotates; "Your project has exceeded a quota" STOPS the run (57453bc); 4-minute abort; network errors retry 30 s ×5 (TGG, CUR, SU). · Measured 20 Sep: 3.6 ×11, 3.7 ×13, 3.5 ×21, 3.8 ×18 requests, then lite; 3.5-lite gave 37–60+ a day (CUR). 7 videos failed when the PC lost internet (CUR). · Failed: before 20 Sep five retries per video were burned on a misread daily message (CUR); before 57453bc waiting out the project quota spent five more requests (SU). · LIVE.

**13. Daily capacity** · 20 Sep: 9.8 h of video went through in one day, "~70–80 short videos a day" (CUR). 2 Oct: about 20 videos fitted into one day's allowance alongside retries; plan 15–20 a day after 10:00 Egypt time (SU, PKG). Deep-mode tagging: 7 of 21 per day after another batch (CUR). · Status: planning figure 15–20/day.

**14. Paid listening (Checker tab and challenge days)** · Google AI Studio paid tier, $20 once, budget alert at $15, also carries the 60 placement listens (PLANS, BL). Listen cost: "about a minute; about 5¢" (MOCK); "Gemini paid ≈ 5–10¢/video", price doubles 1 Jan 2027 (AIL); "~2–5¢ per short video" (CUR). · Status: decided 3 Oct, set-up on 4 Oct not yet reported (BL). Not measured.

**15. The Checker's gates before money is spent** · Length gate: a YouTube link is measured with the free YouTube Data API, over 3:00 refused; a file ≤ 50 MB. Gate 1: title, description, channel name and channel description read by "a tiny AI step" (~0.1¢), "not Islamic content" refused and not counted; "unclear" and every file go on. Gate 2: after the ~5¢ listen, stop if no verse, hadith, ruling or report. The channel is never a reason to refuse (MOCK, RUNBOOK, PLANS, BL). Limits: 3 checks per person a day, 30 a day, $100 total (≈$80 Anthropic + $20 Google) (BAZ, BL). · Status: PROPOSED/being built 4–6 Oct; nothing measured.

**16. Input routes Gemini accepts** · Read from Google's docs 27 Sep: YouTube links read directly (public only, free tier max 8 h of video/day, no length cap on paid); an HTTP URL only when it points at a file (≤100 MB); Files API up to 2 GB; TikTok/Instagram links are HTML pages and extracting the file breaks their terms (FLOW decision 9). · Risk: "Gemini cannot read a Mux copy" listed with fallback "upload the file to Gemini directly (Files API)"; one clip to be tried first (RUNBOOK, PLANS). · Status: Mux route UNTESTED.

**17. Speech-to-text alternatives (ElevenLabs, Whisper)** · ElevenLabs Scribe v2, $0.22/h, "top for Arabic incl. Egyptian", but needs the audio file; downloading from YouTube breaks the "never a scraper" rule, so it fits only files we hold (Checker tab) (AIL). Whisper: no file reviewed records it being tried. · Status: PROPOSED only, never measured.

**18. `--fps` frame-rate flag** · Lowers video frame sampling, audio untouched. ~100 tokens per second of video at default fps; an hour lecture ~420k tokens (TGG 12 Sep; CUR). · Status: built, UNTESTED ("--fps untested", CUR, TGG).

**19. `build-batch.mjs` (listen → checker input)** · KEEPS `unit`, `pieces`, `inside` (the old `prep-claims.mjs` dropped them), adds quran.com verse text, no dorar fields, warns on a lite listen (PKG). · Used in the 2 Oct dry run. · `Docs/curation/cloud-package 2026-10-02 checker-v2 joined/build-batch.mjs`.

**20. Re-cut detection** · `video-health.ts` + Data API durations; a changed duration = every timestamp suspect. 274/274 durations agree; 0 re-cut of 233 (23 Sep) (CUR). · LIVE.

**21. Up-front claim cap** · The prompt says "At most 25 claims — if there are more, keep the ones that carry the lesson" (units: "a unit may have any number of pieces") (TGG 346, 348). The 21 Sep "40 common mistakes in prayer" video returned 25 claims (SPEC). · Status: LIVE; effect on long lessons UNMEASURED.

## Rules and lessons that must survive

- Never extract on lite models; check the `model` field of every result before trusting a batch; a spent bucket must stop the run, not degrade it (TIER, CR, CUR).
- Every retry, 500 included, counts as a request (CUR, TIER).
- "Your project has exceeded a quota" = the project's free video allowance, shared by every model and every session that day; text requests still pass, so a text probe proves nothing; stop, do not rotate (LES, SU).
- Gemini extracts, never judges; quotes stay verbatim, never corrected toward the canonical text; attribution only as spoken (TGG, SPEC).
- Content first, titles only a cross-check (two of the first eight titles described a different video) (TGG, CUR).
- Cut by source unit; a saying told inside another claim gets its own claim with `inside`; distinct rulings and school positions stay apart (SU, TGG).
- The builder never joins through a claim that rests on two hadith; it flags (SU).
- A one-letter Qur'an transcript difference is decided by a human ear, never the checker (NOTES).
- A changed video duration makes every timestamp on it suspect (CUR).
- Stopping a background task on Windows does not stop `npx tsx`; kill the node children, or two runs share a log and spend requests twice (LES).
- A workflow's launching message reaches every agent; no deadline/stop/reset words (LES, BL).
- Never a scraper: YouTube via Gemini's URL input or the official API; no downloading from YouTube (CUR, AIL).
- Do not stack API keys to dodge quota (CUR).
- The Gemini key lives in `D:/Deeni/.env` as a FILE; a folder there breaks `supabase db query` (CUR, TGG).

## Open questions

- Does the listen drift? XG4P6tBuuzs 12:24 vs 14:24 unresolved (check day 1 13:45) (RUNBOOK, BL).
- Why the 6lHj2h1NcFU listen stops at 4:56 (truncation, cap, or a one-off) — never investigated (DRY).
- Per-PIECE timing accuracy: 88 of 200 parts share the claim's times; never re-timed (FLOW).
- Recall: nothing measures what was never extracted; the recall test was dropped 3 Oct (BAZ, BL).
- The 25-claim cap on long lessons: unmeasured.
- The inside cut-out rests on one test (2 of 2) (SU).
- Unit cutting inside the deep tagging prompt: unmeasured (SU).
- Can Gemini read a Mux copy; the Files API path for the Checker's files: untested (RUNBOOK, PLANS).
- Paid-tier cost per video and per clip: quoted 2–5¢, ~5¢, 5–10¢ — never measured.
- ElevenLabs/Whisper accuracy on Egyptian Arabic against Gemini: never measured (AIL).
- `--fps` token saving: untested (CUR, TGG).
- The listen's kinds (7) vs the flows' kinds (7, incl. fatwa, no_origin, report): who assigns fatwa/no_origin, and is the listen's kind the gate? (FLOW, L5).
- Gate 1 and gate 2 refusal accuracy: unmeasured (MOCK).
- Free-tier rules disagree (see Numbers): reset rolling vs midnight Pacific; 8 h/day cap real or not.

## Numbers

| What | Value | Date | Source |
|---|---|---|---|
| First test claims | 59 on 4 videos (13/25/16/5) | 21 Sep | CUR, SPEC |
| Extraction output cost | ~1,500 output tokens per 25 claims | 21 Sep | CUR, SPEC |
| End-seconds pass | 38 ends, 2–10 s, none capped | 21 Sep | CR |
| Back-fill A | 535 claims / 49 videos; 224 of 244 hadith on dorar | 22 Sep | CR |
| Full-model density | 11.2 / 12.1 / 11.9 / 17.8 claims per 10 min (3.5/3.8/3.7/3.6) | 23 Sep | CUR |
| Lite claims/video | 3.6 (3.5-lite, 34 videos), 4.6 (3.1-lite, 15) vs 18.0 full | 22–23 Sep | TIER |
| Lite vs full same videos | 0→4, 1→8 (1 vs 12) | 23 Sep | TIER |
| Requests per model per day | ~20 | 15–20 Sep | CUR, TGG |
| Free-tier minute meter | 250k input tokens/minute | 12 Sep | TGG, CUR |
| Video tokens | ~100 tokens per second; hour lecture ~420k | 12–20 Sep | CUR, TGG |
| Daily video cap | "8 hours" (TGG 12 Sep; Google docs 27 Sep, FLOW) vs "NOT real: 9.8 h on 20 Sep" (CUR) | — | both |
| Reset | rolling ~24 h per model (CUR, 20 Sep) vs project allowance at midnight Pacific (LES, SU, 1–2 Oct) | — | both |
| Videos per day | ~70–80 short (CUR, 20 Sep) vs ~20, plan 15–20 (SU, 2 Oct) | — | both |
| Deep-mode tokens | 77k–145k per video; 7 of 21 per day | 24 Sep | CUR |
| Split units found | 6 groups / 17 of 147 claims (5 after the Ashura ruling) | 1 Oct | FLOW, SU |
| v3 vs old prompt | groups whole 4/5 vs 1/5; wrong joins 1/15 each; inside 2/2 vs 0/2; not found again 6/147 vs 23/147 | 2 Oct | SU |
| Tokens v3 vs old | 622k (62k/video) vs 580k (58k/video) | 2 Oct | SU |
| v1 / v2 losses | 12% / 6% | 1 Oct | SU |
| Listen wall time | 27.0–99.9 s per video (10 test videos) | 2 Oct | SU run logs |
| Kind label | 64/64 hadith right; 1/75 non-hadith called hadith | 3 Oct | L5 |
| Time drift seen | 12:24 vs 14:24; 3:41 vs 3:23 | 2 Oct | DRY |
| Parts sharing claim times | 88 of 200 | 3 Oct | FLOW |
| Listen miss in dry run | 1 of 72 hadith parts (no claim after 4:56) | 2 Oct | DRY |
| Transcript slips held | 2 Qur'an parts | 1 Oct | NOTES |
| Paid listen | ~5¢ per clip; 5–10¢/video; 2–5¢ short video | 3 Oct / 2 Oct / Sep | MOCK, AIL, CUR |
| Gate 1 | ~0.1¢ | 3 Oct | MOCK, BL |
| ElevenLabs Scribe v2 | $0.22/h (quoted, not measured) | 2 Oct | AIL |
| Durations agree / re-cut | 274/274; 0 re-cut of 233 | 23 Sep | CUR |
