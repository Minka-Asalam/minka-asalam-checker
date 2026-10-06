# Inventory B: finding each claim's source and level

Compiled 4 Oct 2026 for the claims pipeline redesign. Stage B = find each extracted claim's source and give it a level. Numbers copied as written; where files disagree, both are given. Short names: MEM-FLOW / MEM-PRINT / MEM-AI / MEM-LESSONS / BACKLOG = the memory files `project_deeni_claims_flow_redesign.md`, `project_deeni_printed_references.md`, `project_deeni_ai_learning_experiments.md`, `project_deeni_lessons.md`, `project_deeni_backlog.md`; CUR = `D:/Deeni Docs/curation/`; AIL = `D:/Deeni Docs/AI_Learning_2026-10/`.

## Items

### A. Across all kinds: the checker itself

**Checker v1 (the claims pass and the reader record)**
- What it does: one Claude agent per ~6 videos grades every extracted claim (red / amber / fine, later ok / imprecise / weak / wrong / unverifiable / not_a_claim) and drafts the one-line reader record.
- How it runs: Claude workflow `claims-workflow.js`; quran.com text and dorar hits attached BEFORE the agent (prep-claims.mjs, dorar-lookup.js in a browser, later curl); plus its own knowledge and up to six web searches.
- Measured: first test 21 Sep, 59 claims, 11 min / 7 min, ~80–105k tokens (`D:/Deeni Docs/Deeni_Claims_Pass.md` §6); batch A 22 Sep, 535 claims, 224 of 244 hadith on dorar, 484 fine / 30 imprecise / 21 weak (CUR `README.md`).
- Worked: cheap, fast; a three-reader pre-apply review caught blockers.
- Failed: the reader line was a synthesis from memory (see assertions); 61 of 252 live hadith lines do not match their dorar page; the lookup skipped hadith not attributed to the Prophet or carrying a verse key; one long query mixing two narrations found nothing (witr).
- Status: live data, replaced by v2 for new runs (~48 batch A videos and all of batch B still on v1).
- Where: CUR `tools 2026-09-21 sources/` (claims-workflow.js, prep-claims.mjs, dorar-lookup.js, dorar-curl.mjs, post-claims.mjs) and CUR `tools 2026-09-21 claims pass/`.

**Assertions: a reader line split into its parts (migrations 211, 212, 214)**
- What it does: one row per thing a line asserts (ruling / attribution / standing / quote / report / figure), each with its own citation and verbatim quote. The checker must give a chapter reference (never a page) for any majority, agreed or differ standing, or drop the standing.
- How it runs: the checker schema plus generator refusals.
- Measured 25 Sep (MEM-PRINT): see Numbers (composite lines, 147 badges); 212 = 94 citations on 80 claims; owner's review 16 accept / 1 keep, reading 14 yes / 1 partly.
- Worked: two separate checks, fidelity to what was said and support from the source.
- Failed: the standing badge never had a source; the rewrite of claim 72e806f7 switched topic to something findable.
- Status: live.
- Where: CUR `tools 2026-09-24 usul/gen-assertions-backfill.mjs`; `supabase/211`, `212`, `214`.

**The flows per kind and the record model (two axes, 218, 229)**
- What it does: one flow per kind (Qur'an, hadith, ruling, fatwa, report, number, no-origin); every branch ends in an exit with a STATE (what the comparison found) and a LEVEL (source strength on the kind's scale). Written by a 15-agent workflow (7 authors, 7 sceptics, 1 critic); the owner accepted 109/109 exits and all 124 product recommendations; rendered as one "sheet" per kind for the checker.
- Measured: the two axes moved 10 tones (28 Sep); source-name links resolved 310 of 334 (MEM-FLOW).
- Status: live; 218 holds four PROVISIONAL scholarly tables; 229 = 111 exits and a guard against non-publishable exits.
- Where: CUR `cloud-package 2026-10-02 checker-v2 joined/sheets/` (seven flow sheets, model.md, works.md); CUR `tools 2026-09-24 usul/gen-record-model-migration.mjs`, `resolve-sources.mjs`.

**Checker v2, the ten-video test (1 Oct)**
- What it does / how: Workflow `claims-workflow-v2.js`, effort high; one checker per video emits flow_kind / state / level / parts (verbatim said + source), then one SCEPTIC per video re-runs the tools and corrects. Tools: usul-lookup / usul-online, shamela.mjs, the usul search API, WebSearch (web-quote rung).
- Measured, run wf_968cebad-1e1 (CUR `2026-09-30 Checker v2 test/run 2026-10-01/NOTES.md`): 147/147 claims, 198 parts, 99 book citations each with a tool-printed quote, 0 unknown exits (run size and states in Numbers). Owner's review 146 accept + 1 note; written back as 225 + 226; three grades corrected live by 228.
- Worked: quotes always tool-printed; the sceptic; the review page.
- Failed: 4 hadith "not found" only because the pre-run dorar lookup returned nothing; 2 hadith never looked up ("pending"); 6 groups (17 claims) were one source unit cut into pieces (owner later: the Ashura pair is a correct cut, so 5); "major sin" matched to a page lacking the term; sweat/wudu "not found" though an Islamweb fatwa names the case; the 4,500-rewards figure took the wrong exit.
- Which model ran it: Fable 5.1, read from the run's own transcripts (AIL `prompt-chain-L5-opus/RESULTS.md`); the workflow names no model and inherits the session's. Not a conflict with the dorar-path README: its "Opus 5.5" is the separate 1 Oct hadith-rung measurement (helpers launched as Opus), not this run. (Resolved 4 Oct.)
- Status: tested, written back.
- Where: CUR `2026-09-30 Checker v2 test/`; review page https://claude.ai/artifact/3LhRzWXoMQczbGe6Q9kFMj.

**The sceptic pass**
- A second agent re-runs the tools to verify every quote, state and level. Changed substance in about 8 places on 1 Oct (re-pinned hits, a claim raised, a school fixed, a fatwa re-kinded; NOTES.md item 7). Live. Never measured: its minimum model; the compare step's redundancies.

**The joined package and its dry runs (2 Oct)**
- What it does: v2 plus the hadith dorar path, source units / continuation-first, the fixed dorar order, and the grader's word alone.
- How it runs: Opus 5.5, effort high, `bookTool` usul-online.mjs.
- Measured (CUR `2026-10-02 Joined package dry run/README.md`; figures in Numbers): both checks pass on all ten videos; 71 of 72 approved hadith parts found on the same hadith (the miss was the listen's); ranks differ on 3 + 3.
- What failed: the launch message's deadline reached every agent, so 12 rulings were left unsearched as "pending". Rulings vary much more than hadith between runs.
- Status: ready for the 4–6 Oct measured run.
- Where: CUR `cloud-package 2026-10-02 checker-v2 joined/`; migration 229.

**The fast search (one small model + one trusted engine, per kind)**
- What it does: measures whether a small model writing short queries finds each part's source fast.
- How it runs: Haiku 4.5 and Sonnet at low effort. Tools: dorar-search.mjs, usul-online.mjs, quran-verse.mjs, timed.mjs. At most 3 queries and 3 pages per part. Scored by `score-fast-search.js`.
- Measured 1 Oct on the owner's PC, NOT the cloud (CUR `cloud-package 2026-10-01 fast-search/results/`; per-kind figures and the backlog's differing counts in Numbers). Viable = hit rate ≥ 90% and median under 20 s.
- Verdict: viable for the Qur'an only; rulings and reports keep the full checker; hadith finds the right hadith but needs the entry order.
- Failed: Haiku mostly ran one query then gave up, reused one page for several parts, searched dorar instead of the named books for reports. The FIRST attempt was spoiled: agents read the README, opened the answer key, ran the scorer, pushed commits.
- Status: tested only.

**Isolation of measured agents**
- Inputs and tools copied outside the repo, the key moved out of reach, an ISOLATION paragraph in the prompt, every agent's tool calls audited. Audits clean on 78 + 82 + 4 chain helpers and both dry runs. Live practice (MEM-LESSONS).

### B. Hadith

**dorar from a real browser (the old lookup step)**
- What it does: `dorar-lookup.js` v2/v3 in the browser pane reads the search PAGE for permalinks (the JSON endpoint has none).
- What failed: run detached because the pane caps at 45 s. It skipped some claims. Its single long queries missed.
- Status: retired as a step; kept only as the fallback for x_pending_lookup.
- Where: CUR `tools 2026-09-21 sources/dorar-lookup.js`.

**dorar from a script (curl)**
- What it does: the service `dorar.net/dorar_api.json?skey=` gives up to 15 structured hits (narrator, grader, source, number, grading) with no permalink. The page `dorar.net/hadith/search?q=` carries the /h/ permalinks. The same search with `&s[]=6216&s[]=3088` returns Bukhari/Muslim cards with their links.
- Measured, 1 Oct:
  - Speed: about 0.6 s per call (MEM-PRINT); about 2 s per search with 8/8 known answers (CLOUD-TEST.md); about 5 s per search of three requests (AIL `prompt-chain/RESULTS.md`).
  - The five claims the run had failed on: 5/5 on the first page with 4–6 canonical words.
- What failed: node fetch gets 403 (TLS fingerprint). Curl was intermittently blocked on 30 Sep. A bare "Mozilla/5.0" agent gets 403.
- Status: live (PC).

**dorar.mjs + the ledger + check-dorar-links.mjs**
- What it does: search / open / cite; four tries on a block, then `STATUS blocked` (exit 3); every answer logged; `cite` refuses a link no search printed. The check fails R1 an unprinted link, R2 fields not as printed, R3 a quote not in the hit, R4 a hadith never searched, R5 pending without a blocked search, R6 a grade outside tiers 1–4, R7 a packed or unprinted extra grader.
- Measured: no faults in either dry run. LIVE in the joined package (`tools/`; origin CUR `2026-10-01 Hadith dorar path/tools/`).

**The hadith dorar path: Opus vs Haiku (1 Oct)**
- What it does: the checker writes 2–3 short classical queries and searches mid-run. No pre-lookup and no web rung for hadith. After three empty queries, one look in the Kuwaiti encyclopedia for a wording, then one more query.
- Measured on the 64 hadith claims (CUR `2026-10-01 Hadith dorar path/README.md`, `measure/score.txt`): Opus 5.5 64/64 strict, 0 faults; Haiku 4.5 39/64 (skipped searches, collection/number from memory, off-list graders, Ayat al-Kursi sent to the Qur'an flow). Opus picked another card on 20 claims; the old record was wrong on 3 of them.
- Verdict: the hadith rung stays on Opus. Sonnet 5.5 was never measured.
- Status: live.

**The fixed dorar order (tiers 1–4) and the grader's word alone**
- What it does: tier 1 Bukhari / Muslim; 2 al-Albani's grading books; 3 Shu'ayb al-Arna'ut (Musnad, every Sunan, Ibn Hibban); 4 Ibn Hajar's grading works (OUR list of seven). Side books and fatwas never grade; al-Dhahabi dropped. `source.grading` = the page's word alone; every other grader its own `source.gradings` entry.
- Measured: all 68 approved dorar sources are in tiers 1–4; Haiku fast search re-scored 23% → 38%.
- Status: live (owner, 2 Oct); two readings await the owner or the shaykh. Where: joined package `tools/hadith-tiers.mjs`, `sheets/flow-hadith.md` s4/s5.

**x_pending_lookup** (blocked is never "not found"): provisional exit, live after 229, not published.

**The grading pass test (check-gradings.mjs)**
- What it does: compares grade, grader, book and number with the linked dorar page. No model, curl only, about 5 min for 183 pages.
- Measured (CUR `tools 2026-10-01 grading check/README.md`; figures in Numbers): of v1's 61 mismatches, 33 flattened, 7 a different grade, 23 a book the page does not name. v2's 6 failures = the checker's note appended to the grader's word.
- Status: live gate before any write-back.

**dorar from the cloud and from Render**
- What it does: `cloud-probe.mjs` searches eight known claims.
- Measured: PC GO 8/8 (1 Oct). Anthropic cloud NO-GO, 0/8, all blocked, 4 tries of ~60 s each (4 Oct). Source: CUR `2026-10-01 Hadith dorar path/cloud-probe-2026-10-04-anthropic-cloud.md`.
- Status: hadith look-ups stay on the PC. Render is NOT measured (CHECK 1, 4 Oct 12:00); fallbacks are a Cloudflare worker, then "lookup pending" with a search link.

**The prompt chain, Levels 1–4 (the owner's idea)**
- What it does: Haiku answers small questions. The SCRIPT searches dorar, ranks hits, copies every field, and sets the level from the grading.
- Measured (AIL `prompt-chain/RESULTS.md`; levels in Numbers): 0 skipped searches, 0 memory fields, 0 off-list graders at every level.
- Failed: Level 3's misses were mostly the script's tier-only sort; the meaning check missed the one wrong hadith; Level 4 picked a FABRICATED narration (Ayat al-Kursi) and a weak one (witr) over sound ones.
- Status: tested only; tuned on the same 64.

**Level 5, the owner's branching tree (3 Oct)** — AIL `prompt-chain-L5/RESULTS.md`, on all 147 claims: no wrong hadith published, 0 real hadith stopped, but non-hadith claims got a supporting hadith attached; gating on the Gemini listen's kind label fixes that (question 1 adds errors both ways). Tested only; a backlog proposal waits on batch B and a grade safeguard.

**Opus in the same tree on the 6 misses (3 Oct)** — AIL `prompt-chain-L5-opus/RESULTS.md`: 6/6 the same hadith; Haiku first + Opus for the rest = 64/64. Tested on 6 hard claims only.

**"Propose from memory, confirm from the page" (the DeepSeek test)**
- Measured: DeepSeek's three dorar links for the witr hadith were real, 3/3 (NOTES.md item 13).
- Lesson: memory is fine for famous hadith and dangerous for rare, weak or fabricated ones. Superseded by the tool path.

### C. Qur'an

**The verse text from quran.com, and the Qur'an flow**
- What it does: build-batch.mjs fetches each verse on the PC. The flow matches words, readings, a listen gate (a moderator hears the timestamp), translations, and "not in the Qur'an".
- Measured: 1 Oct test 27 quran.com parts, 2 held for a listen (decided by the owner's ear); dry runs found every approved verse again; fast search 26/26.
- Failed: a quran-cache entry written before the `text_imlaei` fix had to be purged (the "simple" fields drop letters; CUR `README.md`); verse ranges (32:16-17) are not read by the comparison. Status: live.

### D. Rulings, reports, fatwas, numbers (books)

**Nine verified copies of the books (usul.ai)**
- Downloads each book with 20 echo probes and builds a printed-page map; 55,025 pages, owner-confirmed via a shaykh 25 Sep. Failed once: a filename pattern dropped 61 part files past page 9,999. Live (cleared). Where: CUR `usul-books/`; `tools 2026-09-24 usul/usul-curl.mjs`, `usul-index.mjs`, `works.json`.

**The 25 Sep page-finding methods, in the order tried** (all measured on 81 rulings over the nine books, figures in Numbers; MEM-PRINT; tools in CUR `tools 2026-09-24 usul/`)
- Word-overlap scorer: wrong two times in three; retrieval, not thresholds, was the problem. DROPPED.
- Chapter-first (`usul-candidates.mjs`; the chapter a hint, never a fence): 17 → 32. One-per-chapter diversity lost 8, reverted. LIVE as rung 1.
- A searching reader over the verified copy (`usul-lookup.mjs` toc / find / page / near): to 62 of 81, every quote on its page. LIVE (PC only).
- Model recall alone: right chapter, never the page. DROPPED.
- Web citations: page numbers mostly from other printings; quotes transfer perfectly. LIVE as a rung, quote only; never for hadith.
- Shamela (`shamela.mjs`, official MCP, book ids pinned by key; page-aligned with our copies; 8463 vs 6910 = two al-Mughni printings, same sentence at 1/136 vs 1/247): an exact 6–8-word quote finds the right page every time (4 words: 7 wrong). Returns empty under load, so retry once. LIVE.

**usul-online.mjs (any usul.ai book, online)**
- Measured: identical to the local copy on page 6409. Local find ≈ 3.0 s vs site 3–6 s. The site found 3 hits vs 0 locally, with noise 20 vs 4.
- Status: live (the cloud's book tool).
- Where: CUR `tools 2026-09-24 usul/usul-online.mjs`.

**The ruling search ladder (7 rungs)**
- The rungs: chapter-first → reader → Shamela → web quote → one page for all positions → re-point → fatwa bodies → not found. Shorter ladders for report, number and fatwa.
- Status: in the sheets. Rulings vary run to run (48 of 74 pages differ in dry run 2).

**Fatwa bodies / the fatwa kind**
- Measured: cases solved by hand, Dar al-Ifta 3276 and Islamweb 215716. The 1 Oct test sourced islamweb 3 parts and dar-alifta 1.
- What failed: the ladder only asked the bodies "for a modern matter".
- Status: the flow sheet exists. The kind with its dated timeline is NOT built. The list of bodies is provisional.

**Numbers / derived figures**
- Measured: letters per mushaf page: 332,122 letters, mean 550, median 553 (`_letters_per_page.mjs`).
- Status: provisional exit x_derived, live. The checker did not reproduce it in dry run 2.

## Rules and lessons that must survive

- Never a page, collection or number from memory. Every source is a hit or page the tool printed, with its quote (MEM-PRINT; the dorar path README).
- Carry the QUOTE, never the page. Quotes locate pages; readers judge claims (MEM-PRINT).
- The edition trap: a page without its printing is meaningless. Every link is pinned with `?versionId=`, which comes from `works.json` only (MEM-PRINT).
- No link rather than a wrong one. A link, never a preview. Ingest once, resolve never (MEM-PRINT).
- A re-point must re-resolve volume, page, index and quote in the NEW book, never just swap the slug (MEM-PRINT).
- Two checks per claim: fidelity to what was said, and support from the source (MEM-PRINT).
- Normalise diacritics on both sides before matching (`usul-arabic.mjs`). Hand-encode Arabic for curl. Use `type=keyword`, because `semantic` silently returns 0 (MEM-PRINT).
- Two methods agreeing proves nothing if they share a failure mode. Write the expected count into every apply-time probe (MEM-PRINT).
- dorar search requires every word in one narration: 4–6 canonical words, 2–3 phrasings, never the speaker's dialect (NOTES.md items 13–14).
- Search EVERY hadith claim whatever its attribution or reference. A claim ABOUT a verse is a hadith. Re-kind only after the search (the dorar path README).
- Blocked is never "not found" (x_pending_lookup) (the dorar path README).
- The grade follows the wording said and its chain, not the meaning. A narrator note is not a grade. Store the page's word alone and give one entry per grader (flow-hadith.md; grading check README).
- A Bukhari mu'allaq is not automatically sahih (the dorar path README, finding 4).
- A fabricated hadith is shown with the grader's word, never hidden (MEM-FLOW, owner 30 Sep).
- An unsourced part is shown as "not found", never dropped (MEM-FLOW decision 4).
- Scholarly content (scales, rulebook, bodies, tiers) is DATA with a provisional or cleared mark, never code (MEM-FLOW decision 12).
- A term of art (kabira, ijma') needs a source that uses the term (NOTES.md item 9; BACKLOG).
- When the books state the rule but not the case, ask the cleared fatwa bodies before "case not stated" (NOTES.md item 17).
- Keep the sceptic (NOTES.md item 7).
- A small model fails when it holds the steps. Let the SCRIPT hold the steps and copy fields. Give small batches of about 4 claims with results cut to 300 characters, and rank hits by shared words, not by tier alone (MEM-AI; AIL `prompt-chain/RESULTS.md`).
- A weak or fabricated pick when a sound narration was printed goes to review (AIL `prompt-chain/RESULTS.md`, Level 4).
- Gate the hadith path on the listen's kind label. A "same meaning" branch attaches supporting hadith to rulings (AIL `prompt-chain-L5/RESULTS.md`).
- Workflow agents see the whole disk: keep answer keys out of reach and audit calls. The launch message reaches EVERY agent, so set no deadline. Run an LF copy of the script on Windows (MEM-LESSONS).
- Score the untouched baseline with your own scorer first, and check SAME HADITH, not just "pass" (MEM-LESSONS; MEM-AI).
- dorar refuses the Anthropic cloud. Run hadith look-ups from the PC (cloud-probe report).
- Never extract on lite Gemini models. This is stage A, but it starves stage B (CUR `2026-09-23 … the model tier finding.md`).

## Open questions

- Does "graders differ" get its own exit (level 3 is unreachable today), or stay "rank at the weaker"? Does sahih against hasan count as "differ"? This touched 4 claims on 1 Oct, 3 in dry run 1 and cLTiGxU4D3E 1 in run 2. For the shaykh.
- The fixed order: is our list of Ibn Hajar's seven grading works right? Is every Sunan Shu'ayb edited tier 3? Should al-Dhahabi and al-Albani's or Shu'ayb's other books come back? (Mentor's first question, day 1, 14:00.)
- Does a Bukhari mu'allaq count as tier 1?
- Is dorar's own "no basis" enough, or must a named scholar say it?
- Does the "any usul.ai book at a pinned page" source stay? Two claims used it.
- Is the "no fabricated level against an accepted hasan" rule right? All rulebook entries are provisional, none cleared.
- Which fatwa bodies are trusted? The fatwa kind with its timeline is unbuilt and unmeasured.
- Does dorar answer Render? Unmeasured. Is a Cloudflare worker needed?
- Unmeasured models: Sonnet 5.5 on the hadith rung, the sceptic's minimum model, and Opus vs Fable on the whole checker, like for like.
- The prompt chain (Level 4, Level 5, hybrid) was tuned on the same 64 claims. Unconfirmed on batch B (317 claims).
- Rulings and reports: no fast method works. Will a better engine (usul.ai's paid semantic search, $25/month, licence unknown) or our own meaning search beat the ladder? Never measured.
- Dry run 1 claim 16: weak vs hasan ("the first half is sahih") needs the owner's look.
- Run-to-run variance on rulings (48 of 74 pages differed). Is it acceptable, and how will review absorb it?
- The second grader has no slot on the display, and "How to receive it" texts wait for the shaykh.
- Qur'an: do the three readings beyond the seven count? Verse-range comparison is missing.
- Cost per Checker-tab video: estimated ~$1.50 per 10-min video at ~10 cents per claim (MEM-AI). Not measured.

## Numbers

| What | Value | Date | Source |
|---|---|---|---|
| v1 first test: checker tokens / time | ~80–105k for 59 claims; 11 min and 7 min runs | 21 Sep | Deeni_Claims_Pass.md §6 |
| v1 batch A | 535 claims; 224/244 hadith on dorar; 484 fine / 30 imprecise / 21 weak | 22 Sep | CUR README.md |
| v1 grades vs dorar page (grade word only) | 216/240 matched; 14 to review | 23 Sep | CUR 2026-09-23 Gradings to review |
| Grading pass test, v1 live | 252 lines: 176 match / 61 not / 10 unclear / 5 unchecked | 1 Oct | grading check README |
| Grading pass test, v2 test | 70 parts: 63 / 6 / 1 unclear (stricter: 10 of 70 fail) | 1–2 Oct | grading check README; BACKLOG |
| Word-overlap scorer | 5 right of 15; 54/80 right page never a candidate | 25 Sep | MEM-PRINT |
| Chapter-first | 17 → 32 of 81; diversity lost 8 | 25 Sep | MEM-PRINT |
| Searching reader | 62 of 81 | 25 Sep | MEM-PRINT |
| Model recall | 0/31 pages, 31/31 chapters | 25 Sep | MEM-PRINT |
| Web citations | found 36/49; pages wrong 14/20; quote→page 46/47, 27 state claim; web-first 23, Shamela 36, union 37 | 25 Sep | MEM-PRINT |
| Shamela paraphrases | 34 exact of 53 | 25 Sep | MEM-PRINT |
| Composite lines | 18 of 19; 30/59 parts on a page; 14 overstated, 3 wrong book, 3 reversed | 25 Sep | MEM-PRINT |
| Unsourced standing badges | 147 live claims | 25 Sep | MEM-PRINT |
| Verified copies | 9 books, 55,025 pages | 25 Sep | MEM-PRINT |
| usul local vs site | 3.0 s vs 3–6 s; 3 hits vs 0; noise 20 vs 4 | 1 Oct | MEM-FLOW |
| Source links resolved | 310/334 (21 internal, 3 unlinked) | 30 Sep | MEM-FLOW |
| v2 test run | 20 agents, 576 tool uses, 4,103,755 tokens, 61 min (~6 min, 410k per video) | 1 Oct | NOTES.md |
| v2 test states | matches 128, not_found 10, by_meaning 3, pending 4, not_a_claim 2 | 1 Oct | NOTES.md |
| v2 test sources by part | usul.ai 96, dorar 64, quran.com 27, islamweb 3, dar-alifta 1 | 1 Oct | NOTES.md |
| v2 run cost at list price | Fable $82.41 (56¢/claim); same tokens at Opus $36.39 (25¢/claim) (memory's "2.41" was a shell typo for $82.41, fixed 4 Oct) | 3 Oct | L5-opus RESULTS; MEM-AI |
| v2 run tokens, other count | 3.5 M cache write, 34.3 M cache read, 0.6 M out | 3 Oct | L5-opus RESULTS |
| Old checker per claim | ~28k tokens (all kinds, with sceptic) | 1 Oct | dorar path README |
| Source-unit groups cut | 6 groups / 17 of 147 (owner: 5 groups) | 1 Oct | NOTES.md; MEM-FLOW |
| dorar speed | ~0.6 s / ~2 s per search / ~5 s per 3-request search | 1–2 Oct | MEM-PRINT; CLOUD-TEST; prompt-chain RESULTS |
| dorar short queries on failures | 5/5 | 1 Oct | NOTES.md item 14 |
| Hadith rung Opus 5.5 | 64/64 strict; 907,513 tokens; ~14.2k, ~46 s per claim; ≈ $0.07; 11 min wall | 1 Oct | dorar path README |
| Hadith rung Haiku 4.5 | 39/64; 60 returned; 10 unsearched; 14 link faults; 7 off-list; 753,869 tokens; ≈ $0.015 | 1 Oct | dorar path README |
| score.txt raw | Opus sameLink 37, sameLevel 57; Haiku sameLink 30, sameLevel 47 | 1 Oct | measure/score.txt |
| Old record wrong (grades) | 3 claims, fixed by 228 | 1–2 Oct | dorar path README; MEM-FLOW |
| Approved dorar sources in tiers 1–4 | 68 of 68 | 2 Oct | joined README |
| Cloud probe | PC 8/8 GO; Anthropic cloud 0/8 NO-GO | 1 / 4 Oct | CLOUD-TEST; cloud-probe report |
| Fast search Haiku (tiers) | all 43% (77/179); quran 100%; hadith 38% (26/69); ruling 43% (21/49), 16.2 s; report 11%; number 1/5; fatwa 0/3 | 1–2 Oct | results/haiku-low-score.md |
| Fast search Haiku (no tiers) | all 37% (67/179); hadith 23% (16/69). Backlog: 36% (65/179), quran 92% (24/26) | 1 Oct | haiku-low-no-tiers-score.md; BACKLOG |
| Fast search rerun rulings/reports | Haiku ruling 19/47 40% (backlog: 31%), report 5/26 19%; Sonnet ruling 33/62 53% 19.6 s, report 6/26 23% | 1 Oct | results/*ruling-report*; BACKLOG |
| Dry run 1 (2 videos) | 910,165 tokens, 25.7 min; 28/28 grades; 24/24 hadith (18 same entry); ranks differ 3 | 2 Oct | dry run README |
| Dry run 2 (8 videos) | 2.40 M tokens, 20 min; 51/51 grades; 47/48 hadith; rulings 26 same, 48 differ; 12 unsearched | 2 Oct | dry run README |
| All ten videos | 71/72 hadith; 3.31 M tokens / 154 claims ≈ 21.5k per claim, ≈ 330k per video | 2 Oct | dry run README |
| Batch A estimate | 24 M tokens (1 Oct pkg) / ≈ 26 M, $110–150 / 19–26 M / whole checker ≈ $165 Opus, ≈ $370 Fable | 1–3 Oct | 1 Oct pkg README; dry run README; L5-opus RESULTS |
| Batch A hadith step | ~4 M tokens ≈ $20 Opus one-task; ≈ $10 Opus tree; ≈ $4 hybrid | 1–3 Oct | dorar path README; L5-opus RESULTS |
| Prompt chain same hadith | L1 39, L2 49, L3 51, L4 57 (strict 39/50/52/57) | 2–3 Oct | prompt-chain RESULTS |
| Chain cost estimate | ≈ 4–5k Haiku tokens ≈ $0.005–0.01 per claim | 2 Oct | prompt-chain RESULTS |
| Level 5 tree | 58/64; 17/75 non-hadith got a hadith; listen-label gate 58/64, 0/75 | 3 Oct | L5 RESULTS |
| Opus on 6 misses | 6/6; ≈ 3.4¢ per claim ($0.20 for six); hybrid ≈ 1.3¢, 64/64 | 3 Oct | L5-opus RESULTS |
| Letters per mushaf page | 332,122 total; mean 550, median 553 | 1 Oct | NOTES.md item 12 |
| Exits | 109 (28 Sep) → 111 (229) | 28 Sep / 2 Oct | MEM-FLOW |
