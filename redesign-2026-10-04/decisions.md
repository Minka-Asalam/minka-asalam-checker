# Claims redesign — the owner's decisions (step 3)

The principle (owner, 4 Oct): the script holds the steps, a model answers one small question at a time, the agent is only the fallback; decided per stage, untested stages measured first.
All rules on the inventory page (https://claude.ai/artifact/5cyppRF3phAT6E8mn2hAQy) confirmed by the owner, 4 Oct 07:00.
The test on two videos (pkH5vlUGc5U, vl5WtmIa1Fc) and its fresh baseline: PARKED by the owner to day 2 or 3 (4 Oct 09:10); the redesign itself first.

## Stage 1 · Listen — decided 4 Oct
Keep Gemini reading the YouTube link (full models only, the source-unit prompt), with a script guard around it:
1. refuse a result from a lite model;
2. compare the last claim's time with the video's length, and listen again to the rest when it stopped early (the 4:56 case);
3. record the paid cost of every listen.
TO TEST on day 2 or 3, with the parked test: speech-to-text first (ElevenLabs) for files we hold (our clips, Checker files), for exact time buttons; a model then picks the claims from the text.

## Stage 2 · Cut into claims — decided 4 Oct
Keep Gemini's cut by source (one verse passage, one narration, one ruling = one claim, in timed pieces), with a script guard: a video that comes back with exactly 25 claims (the prompt's cap per VIDEO) has its second half listened to separately. The "is this the rest of the same source?" check stays as a free script step.
TO TEST on day 2 or 3, with the speech-to-text test: a model cutting the written text into claims (no cap; files we hold only).

## Stage 3 · Route by kind — decided 4 Oct
Gemini labels each claim with the checking paths' own seven kinds (verse, hadith, ruling, fatwa, report, number, no origin), replacing its old list (saying, history, other); the script routes each claim by its label, no model. A claim may change path only AFTER its search (the Ayat al-Kursi case: labelled a verse, its hadith found). The prompt change is confirmed in the day 2/3 test (Gemini must still find as many claims).

## Stage 4a · Verses — decided 4 Oct
The script does it, no model by default: search quran.com with the speaker's words (or use his reference), fetch the verse, compare word by word, verse RANGES included (today's gap). Words match → done. One letter differs → a moderator listens at the time (as today). More differs → one small question to a model: a different reading, a slip, or a translation?

## Stage 4b · Hadith — decided 4 Oct
The owner's tree (Level 5, prompt-chain-L5/chain5.mjs) with Gemini's kind label as the gate instead of question 1: Haiku answers the small questions (where can I find it · which one · say it another way · the safeguard); the script searches dorar from the PC, ranks the printed hits and copies every field; the level comes from the grading by the fixed rule. A claim Haiku cannot finish (nothing found, or a weak/fabricated pick while a sound narration was printed) is done again by OPUS through the same tree; only if Opus also fails, the big checker tries. Gates stay: check-dorar-links (R1–R7) and check-gradings. Measured: 64/64 on the reviewed set at ≈ 1.3¢ a hadith (tuned on those 64) → CONFIRM on fresh hadith in the day 2/3 test; today's checker stays ready as the fallback.

## A rule (owner, 4 Oct): a usul.ai book outside the nine verified books
ALLOWED, but every time it happens it is flagged: the review page highlights that part and names the book (title, author, printing, the link at its page), so the owner confirms the book is acceptable. A confirmed book joins the sources list (marked confirmed by the owner) so it is not asked again; a refused one sends the part back to "not found". Applies to today's pipeline too (S4's review pages).

## Stage 4c · Rulings, reports, fatwas, figures — decided 4 Oct (as recommended)
The script climbs the ladder; a model answers small questions on each step:
1. "Which book and chapter would hold this?" → the script opens that chapter in the verified copy (PC: our downloaded copy; cloud: usul.ai online, same printing);
2. "Write three exact sentences this book would use" → the script searches the book and Shamela with them (6–8 words);
3. the script shows the passage it found → ONE judging question: "Does this say what he said: the same, partly, more than the book says, or no?" (may need a bigger model, for this question only);
4. nothing found → the fatwa bodies → "not found";
5. figures (e.g. the 4,500 rewards) are calculated by the script;
6. the big checker takes only what falls through.
To BUILD and MEASURE in the day 2/3 test against the owner's 62 confirmed rulings (Sept) and the rulings of the ten reviewed videos; it may also cure the run-to-run variance (48 of 74 pages differed). Until it passes, the big checker keeps doing rulings in the real runs.

## Stage 5 · Second look — decided 4 Oct
Split the sceptic. SCRIPTS run every mechanical check, a failure sends the claim back to its step: every link printed by a search (R1–R7), every quote on its page, grade/book/number as on dorar (check-gradings), the speaker's words copied exactly, the ladder fully tried before "not found", the exit exists and its state/level match the sheet, the claim's state = the worst of its parts, no "severe", continuation. A DIFFERENT model from the one that picked answers only the two judgement questions: does the chosen source say what he said? is the difference line fair to the speaker and natural Arabic? MEASURE in the day 2/3 test: would it have caught the 8 substantive changes the sceptic made on 1 Oct (NOTES.md item 7)?

## Stage 6 · The record — decided 4 Oct
Keep the record model (218 + the publish guard 229) and add four small things, as ONE database change the owner approves, built after the test passes (migration number from the ledger then):
1. the rules version each claim was checked under;
2. how each part was found ("the path": script + Haiku · Opus · the big checker);
3. what each claim cost (tokens and cents, per step);
4. the "book outside the nine" flag, with the owner's confirmation.
Also: every read pages past the 1,000-row limit; after the test passes, the ~48 older batch A videos and batch B move into the new record by running them through the new pipeline.

## Stage 7 · Review and write back — decided 4 Oct
One PERMANENT review page builder (in Docs, never a temporary folder), built from the record:
- "what needs you" first: every flagged part at the top with its reason (Haiku failed and Opus took it · the safeguard held a weak/fabricated pick · the judge said "partly" or "more than the book says" · a book outside the nine (highlighted, the owner confirms the book) · one letter off in a verse · a long narration sourced whole to one book · the big checker needed);
- the rest in clean groups (e.g. "12 hadith matched in Bukhari or Muslim, all checks passed"): the owner scans and accepts a group with one tap or opens any item — every item stays the owner's decision, nothing reaches a viewer unreviewed;
- the page times the owner's review (the first measure of the review's cost);
- write-back as today: generated from the page's decisions, held first, the publish guard, every probe with its expected count.

### Stage 4c MEASURED 4 Oct (rulings-ladder/RESULTS.md)
Against the owner's 62 confirmed rulings, the same Opus reader for both: the ladder found a page stating the ruling fully 11, partly 29 (40 of 62) — the confirmed pages 28 fully, 29 partly (57 of 62). The second look caught all 12 pages Haiku's judge wrongly accepted. ≈ 2.7¢ a ruling. Not yet good enough to replace the big checker on rulings; the weak step is FINDING the page (the confirmed page reached the judge 12 times of 62). The big checker keeps doing rulings. Next options: chapter-first reading held by the script; a bigger model for the two questions; a cascade (ladder first, big checker for the rest).

### Stage 4c REVISED by measurement 4 Oct (rulings-ladder/RESULTS.md, round 3)
The first question ("which book, which chapter, which exact sentences") goes to OPUS; the script searches the verified copies; Haiku judges the passages; Opus's second look reads the whole page. Measured on the 62 confirmed rulings: 28 fully + 27 partly = 55 of 62 (the confirmed pages 57), 4 wrong pages caught, ≈ 3.9¢ a ruling. Confirm on fresh rulings before adoption.

## STEP 4, the test on two reviewed videos — RUN 4 Oct (test-2videos/RESULTS.md)
41 claims (pkH5vlUGc5U, vl5WtmIa1Fc), the same listen for both, the same scorer and the same Opus page reader:
- verses 3/3 both (the new way's script also found the 25:75 range gap); hadith: the new way all but one Companion's report, today's checker all; wrong hadith attached 0 both (the second look caught Haiku's one wrong pick);
- rulings, a page stating the ruling: today's checker 19/19 (7 fully, 11 partly, 1 fatwa page) · the new way 14/19 (8 fully, 6 partly), 4 wrong pages caught;
- cost measured: today's checker ≈ 62¢ a claim · the new way ≈ 3.6¢ a claim.
The new way ALONE misses the 13:00 rule on sources (5 rulings + 1 report fewer); WITH the design's fallback (the big checker for the 6 left unsourced) coverage equals today's at an estimated ≈ 13¢ a claim, about a fifth.

### Rulings ladder v3 — 4 Oct afternoon (test-2videos/RESULTS.md, "Rulings, round 3")
Owner's guidance after walking through each ruling: split compound claims first (two rulings, or a rule + its application); search fatwas as a plain question with the key term named; a "says the opposite" verdict; Opus judges again only where Haiku found nothing or the second look rejected it, Sonnet checks Opus. On the 19 rulings: a page for all 19 (8 fully, 11 partly) = today's checker's 19 (7 fully, 11 partly), at ≈ 9.9¢ a ruling vs ≈ 62¢. ADOPTED by the owner 4 Oct evening, after the fresh-video confirmation: v3 is the rulings stage (design page updated).
**CONFIRMED on a fresh video 4 Oct (test-fresh/RESULTS.md):** NyPugm_OXSQ (zakat, 19 rulings, never seen): v3 a page for 19 (6 fully, 13 partly) vs today's checker 16 (8 fully, 8 partly, 3 with nothing), ≈ 10.3¢ a ruling. Over both tests: 38/38 vs 35/38; "fully" 14 vs 15.
**THE FALLBACK MEASURED 4 Oct evening (test-2videos/RESULTS.md, "The fallback"):** one claim left over three videos (Ibn Abbas's report); today's checker + sceptic on it alone found the approved dorar entry (al-Khilafiyat 567), judged "accounts differ" L4 where the owner approved "reported" L3; $1.87 measured. Whole design on the two videos ≈ 11¢ a claim vs ≈ 62¢.

### CORRECTION 4 Oct night (the review panel, panel/merged.md)
The "38 of 38 vs 35 of 38" headline is withdrawn: today's checker's three zakat misses were rulings it left unsearched under the 2 Oct deadline. On the rulings both sides searched: 35 vs 35, fully 15 vs 14 — a tie at a lower cost. The rulings method stays adopted by the owner; the panel's findings (circular scoring, fatwa excerpt bug, unfair "opposite"/"partly", untested viewer line, in-sample hadith) are the next work.

### Method v4 — the panel's fixes, built 4 Oct night (method-v4/README.md)
Free script and question fixes, each with seeded tests: hadith grade reading, wording before tier, the safeguard keeps his words, partly/pending carried, graders kept and flagged; the hadith second look from the claim's own video + who said it; verses compared in order; fatwa answer block only; the split keeps his exact words + how he framed it; judges copy the proving sentence (checked); "partly" replaced by fair reasons mapped to states (owner confirms every correction).
**THE RE-TEST (owner's choice): on the 30 challenge clips**, after S4's measured run of today's checker on them; the owner's 5 Oct review is the independent key, scored blind.

### When hadith graders differ — owner's rule, 5 Oct (graders-differ-rule.md), PENDING THE SHAYKH
Researched in the books (Nuzhat al-Nazar p.120; Tadrib al-Rawi 1/348 and 1/157; Ibn al-Salah p.109, p.221). The owner chose three cases: A all accept (sahih/hasan mix) → accepted, badge at the lower rank, graders named; B a grade on the hadith beats a remark on one chain (the chain remark is a note); C accept vs reject → a "graders differ" badge, both named, no verdict from the app, flagged for review. Replaces "rank at the weaker" for B and C once the shaykh confirms; then chain6's record step, rule s5 and a new badge (mockup first).

### Poetry and the unreviewed-book rule — 5 Oct
Poetry became a kind of its own (owner): 242 (kind, levels, six exits) + 243 (aldiwan.net, provisional); "the oldest record we found", the poet a soft note. The unreviewed-book rule (owner, via the clip-library review): a book not confirmed in review shows "Book not yet reviewed by a specialist"; confirmed books join the list (245: three added) and are never asked again; refused → not found. Both carried into method v4 (poetry.mjs, bookStatus.mjs).
