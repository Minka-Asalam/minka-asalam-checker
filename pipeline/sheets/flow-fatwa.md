# FLOW: Checking flow: contemporary fatwa / مسار التحقق: الفتوى المعاصرة

## INTAKE
The extractor hands over: the speaker's words verbatim, start and end seconds, the checker's internal reading line (never seen by viewers), the actual question the speaker answered written as one question with the conditions as spoken, the answer he gave (valid/void, permitted/forbidden, obligatory/recommended...), whether he asserts the ruling himself or only relays another's fatwa, whom he attributed it to (nobody = his own view / a named body / a named scholar / a school / "the scholars" / "consensus"), whether it is one person's own case (a questioner describing his circumstances), a named instance (a specific bank, product, company or country) or a general question, and whether the matter has a chapter in the classical fiqh books or is contemporary (insurance, IVF, crypto...). A claim reaches this kind either from the extractor directly (a contemporary matter or an answer to a questioner) or re-kinded from the ruling flow when that flow finds no book treating the matter (claim 15: the fast of one who does not pray).

## HOW WE SEARCH — How we search for a fatwa
1. The cleared bodies' sites, each searched with the question and its condition words, in two phrasings.
2. For each matching fatwa: the answer sentence verbatim with its condition, the date, the link, the fetch date.
3. If no fatwa is found and the matter has a chapter in the cleared fiqh books → the ruling flow with its ladder.
4. Else "not found" with "needs a mufti"; never a fatwa of our own.

## THE STEPS AND GATES, IN ORDER (a gate has yes/no targets; a target is a step id or an exit id)
1. [s1] STEP: Pin down the question: write the matter the speaker answered as one question with the conditions as spoken; separate the general premise from the case he mentioned. Record the answer he gave, whether he asserts it himself or only relays another's fatwa, whom he attributed it to, any standing word he used ("consensus", "all scholars", "the majority", "no disagreement", "scholars differ"), and whether he called it his own view. (note: Internal only. The speaker's own opinion runs through the flow like any position and is measured against the bodies' fatwas, never our judgment; a speaker who is himself a mufti is measured the same way, since the app authenticates nobody.) → next: g0
2. [g0] GATE: Does the speaker actually assert or relay a ruling? (One who only says "I do not know", "ask a mufti" or "this needs a fatwa" has claimed nothing.) → yes: s2 · no: x_not_a_claim
3. [s2] STEP: Decompose: one part per named position; an attribution part per body, scholar or school he named; a standing part if he said "consensus", "all scholars", "the majority" (i.e. most scholars), "no disagreement" or "scholars differ". A verse or hadith he cited as evidence is a part that leaves to its own kind (Qur'an or hadith) while the ruling stays here. An attribution to a classical school ("the Shafi'is hold") is sourced from the fiqh books in the ruling flow while the position itself stays here. Mark each part spoken or checker-added. (note: A part the checker added from its own knowledge is never shown without a source; that was the part that failed in most of the 2026-09-25 cases.) → next: g1
4. [g1] GATE: After decomposition: is a part left that is a ruling on a matter (not a verse, a hadith, a historical report, a figure or a saying of an early scholar)? → yes: g1b · no: x_rekind
5. [g1b] GATE: Does the matter have a chapter in the fiqh cleared books (al-Mughni, al-Majmu', the Kuwaiti encyclopaedia...) and did the claim come straight from the extractor, not re-kinded from the ruling flow? (note: Books first: a classical matter is sourced from the schools' books on the ruling flow's own scale (consensus, majority, recognised difference...). A contemporary fatwa is sought only when no book treats it.) → yes: x_to_ruling_flow · no: g1c
6. [g1c] GATE: Is it an answer to one person's own case (a questioner describing his circumstances) or to a named instance (a specific bank, product, company or country) rather than a general question? → yes: s1b · no: s3
7. [s1b] STEP: Generalise: write the general question the case or instance falls under and set the personal-case flag. The rest of the flow measures the general question, and every publishable exit opens a fixed panel section reading: "He spoke of a specific case; a personal case is put to a mufti. What is shown here is the general question alone." → next: s3
8. [s3] STEP: Search the cleared list of trusted bodies for fatwas answering the same question. The list is cleared like the book list (Dar al-Ifta al-Misriyya, the Permanent Committee for Scholarly Research and Ifta, the OIC International Islamic Fiqh Academy, the Muslim World League's Islamic Fiqh Academy, Islamweb, IslamQA...). If the speaker gave a fatwa number or link, start there. Record per fatwa: the body, its kind (fiqh-academy resolution / official ifta body / fatwa site), the mufti if named, date, number, link to the body's own page, the question it answered verbatim, and the answer sentence verbatim. — by the search ladder in "How we search". (note: A site or shaykh outside the list is not a source even if the speaker named him; that attribution shows as "outside the cleared sources" (not checked), which differs from "not found" (checked, absent). The body's kind is shown beside each fatwa for information only and does not enter the rank (open question).) → next: g2
9. [g2] GATE: Did at least one fatwa answer the actual question (same matter, same conditions), not a neighbouring one? (note: The hardest gate in the flow; owner decision 8 requires the checker to verify the fatwa answers the claim's own question. When in doubt the checker answers no.) → yes: s4 · no: g3
10. [g3] GATE: Was a fatwa found that answers only the general premise or a neighbouring case (e.g. intention is a condition of wudu, but not the ordinary-shower case)? → yes: x_premise_only · no: g4
11. [g4] GATE: Did the search reveal that the matter does have a chapter in the fiqh cleared books, and the claim had not already come re-kinded from the ruling flow? (note: A second look after gate 1b; the second condition stops the two flows bouncing the claim back and forth.) → yes: x_to_ruling_flow · no: x_no_origin
12. [s4] STEP: For each matching fatwa: copy the answer sentence verbatim with its conditions (its provisos and exceptions), the date, the body, the signatory and the link; open the link and confirm it opens the body's own page. A fatwa whose page will not open is neither counted nor linked, and is logged for the moderator. → next: s5
13. [s5] STEP: Group the fatwas by position: one answer with one set of conditions = one group. Count each group and order it by date from the earliest (an undated fatwa goes last, marked "undated"). Record any body that answered the same question differently at two dates; that is a revision, and it is not one if the two questions differ in a condition. (note: This is the timeline the viewer sees inside the panel: the positions, each one's bodies, their dates and their count. No count appears on the row itself.) → next: g5b
14. [g5b] GATE: Does the speaker's position match only an earlier fatwa that its body later revised, with no cleared body stating his position today? (note: If another body still holds the earlier position this is not the exit; the revision shows in the timeline and the flow continues.) → yes: x_superseded · no: g5
15. [g5] GATE: Did the speaker attribute the position to a named body or contemporary scholar? (Gates 5a to 6c run once per attribution part if he named more than one.) → yes: g5a · no: g7
16. [g5a] GATE: Is the body he named on our cleared list? → yes: g6 · no: s6a
17. [s6a] STEP: Mark the attribution part "outside the cleared sources" and keep his words; we did not check that body and pass no judgment on the attribution. Continue rating the position itself. → next: g7
18. [g6] GATE: Does the named body itself state what he attributed to it, on the same question with its conditions? (note: A fatwa of that body on a neighbouring question does not count as stating it; it shows in the panel as "the body's fatwa on a related question".) → yes: g7 · no: g6b
19. [g6b] GATE: Does the named body state the opposite of what he attributed to it? → yes: x_reversed · no: g6c
20. [g6c] GATE: Does another body on our list state the position he attributed? → yes: x_misattributed_body · no: s6
21. [s6] STEP: Mark the attribution part "not found in the cleared sources", keep his words, and continue rating the position itself. → next: g7
22. [g7] GATE: Did the speaker use a standing word for the position ("consensus", "all scholars", "no disagreement", "the majority", or "scholars differ")? → yes: s7 · no: g9
23. [s7] STEP: Mark the standing part and write its fixed panel line from what step 5 found: (a) he said "consensus", "all scholars" or "no disagreement" and the bodies hold one position: "Calling it '{standing_claimed}' goes beyond what we show here; contemporary bodies agreeing is not consensus, which to the scholars of legal method is the agreement of all the community's qualified jurists in one age, reported from those who recorded it." (b) He said so and the bodies differ: corrected at the exit "claimed consensus; the bodies differ". (c) He said "the majority" (most scholars): show the count only, "of the cleared bodies, {k_of_n_phrase} share his position"; counting a handful of bodies neither proves nor refutes a majority. (d) He said "scholars differ" and the bodies differ: supported. (e) He said "scholars differ" and the bodies hold one position: "the difference he mentioned is not among the cleared bodies", and that is not a correction. → next: g9
24. [g9] GATE: Do the fatwas hold a single position? → yes: g10 · no: g11
25. [g10] GATE: Is the speaker's position the bodies' position, with the same conditions? → yes: g10b · no: g10c
26. [g10c] GATE: Does his position match the bodies' answer in its core but drop or alter a condition the fatwa states (a proviso or an exception)? → yes: x_condition_dropped · no: x_position_unheld
27. [g10b] GATE: Did more than one body answer? → yes: x_agreed · no: x_one_body
28. [g11] GATE: Is the speaker's position among the bodies' positions, with the same conditions? → yes: g11b · no: g11c
29. [g11c] GATE: Does his position match one of the positions in its core but drop or alter a condition that fatwa states? → yes: x_condition_dropped · no: x_position_unheld
30. [g11b] GATE: Did he say "consensus", "all scholars" or "no disagreement"? ("The majority" does not enter here; only its count is shown.) → yes: x_standing_overstated · no: g12
31. [g12] GATE: Did the speaker say whose position it is, that others differ, or that the matter is disputed? → yes: x_differ_named · no: x_differ_as_only

## THE EXITS (id · state · level · publishable · name). Templates use {placeholders}; fill them from what you found.

### x_not_a_claim — state not_a_claim · level 0 · NOT published — Not a claim: the speaker asserted no ruling / ليس ادّعاءً: المتحدث لم يقرر حكمًا
- said slot: "{quote}"
- source slot: —
- difference slot (EN): Not shown; the speaker referred to a mufti and did not rule.
- difference slot (AR): لا يُعرض؛ المتحدث أحال إلى مفتٍ ولم يفتِ.

### x_rekind — state rekinded · level 0 · NOT published — Not a fatwa: re-kinded / ليس فتوى: يُحوَّل إلى نوعه
- said slot: "{quote}"
- source slot: —
- difference slot (EN): Handled in the {target_kind} flow.
- difference slot (AR): يُعالَج في مسار {target_kind}.

### x_to_ruling_flow — state rekinded · level 0 · NOT published — The books treat it: back to the ruling flow / للمسألة باب في الكتب: تعود إلى مسار الحكم
- said slot: "{quote}"
- source slot: —
- difference slot (EN): Handled in the ruling flow against the fiqh books.
- difference slot (AR): يُعالَج في مسار الحكم على كتب الفقه.

### x_no_origin — state not_found · level 0 · publishable — No answer found: needs a mufti / لم نجد جوابًا: يحتاج مفتيًا
- said slot: "{quote}"
- source slot: No answer to this question in the fatwas and cleared books.
- difference slot (EN): Unsourced. We never rule; this question is put to a mufti.
- difference slot (AR): غير مسنَد. لا نفتي؛ هذه المسألة تُعرض على مفتٍ.

### x_premise_only — state not_found · level 0 · publishable — The fatwa answers the premise, not the case / الفتوى تجيب عن المقدّمة لا عن الحالة
- said slot: "{quote}"
- source slot: On a related question ({neighbour_question}) — {body}, {date}: "{answer_quote}"
- difference slot (EN): The case he stated ({case}) has no answer in the cleared sources; what we found answers the premise alone.
- difference slot (AR): الحالة التي ذكرها ({case}) لم نجد لها جوابًا في المصادر المعتمدة؛ ما وجدناه يجيب عن المقدّمة وحدها.

### x_superseded — state matches · level 4 · publishable — A fatwa its body later revised / فتوى عادت عنها الهيئة لاحقًا
- said slot: "{quote}"
- source slot: {body}, {earlier_date}: "{earlier_quote}" — then {body}, {later_date}: "{later_quote}"
- difference slot (EN): His position agrees with the {earlier_date} fatwa; the same body ruled otherwise in {later_date}, and no cleared body states it today.
- difference slot (AR): قوله يوافق فتوى {earlier_date}؛ الهيئة نفسها أفتت في {later_date} بخلافها، ولا تقوله اليومَ هيئة نحتفظ بها.

### x_reversed — state corrected · level 2 · publishable — Reversed attribution: the body says the opposite / نسبة معكوسة: الجهة تقول العكس
- said slot: "{quote}"
- source slot: {named_body}, {date}, fatwa {fatwa_no}: "{answer_quote}"
- difference slot (EN): He attributed {position} to {named_body}; its fatwa says otherwise. Corrected. {holders_line: "Cleared bodies that do state his position: {holders}" or "No cleared body states his position"}
- difference slot (AR): نسب إلى {named_body} أنها تقول {position}؛ فتواها تقول خلافه. مصحَّح. {holders_line: «ومن يقول قوله من الهيئات المعتمدة: {holders}» أو «ولم نجد قوله عند هيئة نحتفظ بها»}

### x_misattributed_body — state corrected · level 2 · publishable — The position is held, but by another body / القول موجود لكن عند جهة أخرى
- said slot: "{quote}"
- source slot: {other_body}, {date}: "{answer_quote}"
- difference slot (EN): The position is {other_body}'s; we did not find it with {named_body}, whom he named. Attribution corrected. {other_positions_line: "Other cleared bodies say otherwise: {other_positions}" or nothing}
- difference slot (AR): القول عند {other_body}؛ لم نجده عند {named_body} التي سمّاها. مصحَّح في النسبة. {other_positions_line: «وهيئات أخرى نحتفظ بها على غيره: {other_positions}» أو لا شيء}

### x_condition_dropped — state corrected · level 2 · publishable — The fatwa is conditional; he stated it without its condition / الفتوى مقيَّدة وقالها بلا قيدها
- said slot: "{quote}"
- source slot: {body}, {date}: "{answer_quote}"
- difference slot (EN): The fatwa says {ruling} with a condition ({condition}); he did not state the condition. Corrected: the fatwa is read with its condition.
- difference slot (AR): الفتوى تقول {ruling} بقيد ({condition})؛ لم يذكر القيد. مصحَّح: تُقرأ الفتوى بقيدها.

### x_standing_overstated — state overstated · level 3 · publishable — Claimed consensus; the bodies differ / ادّعى إجماعًا والهيئات تختلف
- said slot: "{quote}"
- source slot: {positions_list} — each position with its bodies and dates
- difference slot (EN): He said "{standing_claimed}"; the cleared bodies take {n_positions_phrase}, and his is one of them. The standing is corrected, not the position.
- difference slot (AR): قال «{standing_claimed}»؛ الهيئات المعتمدة على {n_positions_phrase}، وقوله أحدها. مصحَّح في المرتبة لا في القول.

### x_agreed — state matches · level 1 · publishable — The cleared bodies agree / الهيئات المعتمدة متفقة
- said slot: "{quote}"
- source slot: {n_bodies_phrase}, one position — earliest {body}, {date}: "{answer_quote}"
- difference slot (EN): Agrees with what every cleared body ruled: {n_fatwas_phrase} from {n_bodies_phrase}, {first_date} to {last_date}.
- difference slot (AR): يوافق ما أفتت به الهيئات المعتمدة كلها: {n_fatwas_phrase} من {n_bodies_phrase}، من {first_date} إلى {last_date}.

### x_one_body — state matches · level 2 · publishable — One body's fatwa, no known dissent / فتوى هيئة واحدة ولا مخالف نعلمه
- said slot: "{quote}"
- source slot: {body}, {mufti}, {date}, fatwa {fatwa_no}: "{answer_quote}"
- difference slot (EN): Agrees with this fatwa. One fatwa in the cleared sources, with no dissent among them.
- difference slot (AR): يوافق هذه الفتوى. فتوى واحدة في المصادر المعتمدة، ولا مخالف فيها.

### x_position_unheld — state not_found · level 0 · publishable — His position is not among the fatwas found / قوله ليس في الفتاوى المعتمدة
- said slot: "{quote}"
- source slot: {positions_list} — each position with its bodies and dates
- difference slot (EN): His position ({position}) is with no cleared body; the bodies hold: {positions_short}.
- difference slot (AR): قوله ({position}) لم نجده عند أي هيئة نحتفظ بها؛ الهيئات على: {positions_short}.

### x_differ_named — state matches · level 3 · publishable — The bodies differ; he said whose position it is / الهيئات تختلف، وقال لمن القول
- said slot: "{quote}"
- source slot: {positions_list} — each position with its bodies and dates
- difference slot (EN): The cleared bodies take {n_positions_phrase}, and he said so. {pick_line: "What he chose ({position}) is {body}'s position" or "He chose no position"}
- difference slot (AR): الهيئات المعتمدة على {n_positions_phrase}، وقد ذكر الخلاف. {pick_line: «وما اختاره ({position}) قول {body}» أو «ولم يختر قولًا»}

### x_differ_as_only — state matches · level 3 · publishable — One position told as the only one / قال أحد الأقوال كأنه الوحيد
- said slot: "{quote}"
- source slot: {positions_list} — each position with its bodies and dates
- difference slot (EN): His position is {body}'s. Other cleared bodies say otherwise: {other_positions}. A statement of difference, not a correction.
- difference slot (AR): قوله قول {body}. هيئات أخرى نحتفظ بها تقول غيره: {other_positions}. بيانٌ للخلاف لا تصحيح.
