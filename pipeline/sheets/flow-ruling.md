# FLOW: Checking flow: Ruling (fiqh position) / مسار التدقيق: الحكم الفقهي

## INTAKE
The extractor (the program that cuts claims out of the video) hands over: the speaker's words verbatim as spoken, colloquial included, with the start and end second; and a first reading as PARTS (a reading is the breakdown of the words into parts, each sourced on its own): the matter (the act being ruled on); the ruling word as spoken (obligatory, prescribed, forbidden, sunna, recommended, disliked, permitted, allowed, valid, invalid, innovation, breaks the fast, invalidates, sinful), with colloquial forms such as «ma yajuz», «lazim», «mish sah», «bardu sahih» mapped to their fiqh word while the quote stays as uttered; one part per school, scholar or book the speaker named; a DEGREE-OF-AGREEMENT part (whether the ruling is consensus, the majority view or one school's view) if he said «consensus», «the majority», «all scholars», «the four imams», «some scholars» or «a view in the school»; and a condition part if he tied the ruling to a condition. Every part is marked by origin: spoken (the speaker said it) or checker-added. Also: whether the words answer one questioner's case or concern a contemporary matter; whether the speaker named a book, a fatwa body or a contemporary scholar; and any verse or hadith cited as evidence (each becomes its own claim of its own kind). If he ruled on two acts in one sentence, that is two claims. No composed line from the extractor is ever the reading; the parts are the unit.

## HOW WE SEARCH — How we search for a ruling (the ladder measured on 25 Sep)
1. Chapter first: match the chapter the checker named against the named book's headings (the local heading index for the nine, usul's headings for the rest) and open the two best pages of that chapter. (32 of 81 on its own.)
2. A reading agent over the verified copy: it reads the chapter's pages and their neighbours, exact wording not required; nothing counts as a hit without a quote the page actually carries. (Took us from 32 to 62 of 81.)
3. Shamela with several phrasings: the ruling as a classical fiqh sentence, then two paraphrases; a hit is a page id with the ready citation (vol/page). An exact quote of 6–8 words finds the page every time; an empty result is retried once, since Shamela returns empty under load.
4. A web citation, then locate it: search the ruling with the book's name on Islamweb, dorar and IslamQA, keep ONLY the quote (page numbers were wrong in 14 of 20 across printings), then locate the quote on Shamela or usul and pin the page to its printing.
5. One page naming every position first, then the parts: for a composite line look for one page that names all the positions (a Kuwaiti entry is the model); if none, source each part alone.
6. Re-point: if the named book carries only one part, cite the work that states both, say so in the difference slot, and keep the speaker's attribution as he said it.
7. The cleared fatwa bodies for matters the classical books cannot treat (the fatwa flow), then "not found". Fixed rules: no link without a pinned printing; no link rather than a wrong one; never a page from memory, since a model knows the chapter and not the page (31 of 31 chapters right, 0 of 31 pages).

## THE STEPS AND GATES, IN ORDER (a gate has yes/no targets; a target is a step id or an exit id)
1. [s1] STEP: Write the reading from the speaker's words alone, part by part, each marked spoken. Never add a degree-of-agreement part or an attribution to a school from your own knowledge; anything you add is marked checker-added, is shown only if a page states it, and is never shown as the speaker's. A verse or hadith the speaker cited as evidence is its own claim in its own flow; its grade never enters the ruling's rank. (note: Measured 25 Sep: the part that failed was almost always the standing badge the checker had added from its own knowledge (14 overstated lines of 29).) → next: g1
2. [g1] GATE: Is a fiqh ruling claimed: a religious ruling on an act (obligatory, forbidden, recommended, disliked, permitted, valid, invalid, sunna, innovation, breaks the fast, invalidates, sinful) in any wording, formal or colloquial? (note: An answer to one questioner («your fast is invalid») is a ruling claim too; it stays in this flow and the next gate hands it to the fatwa flow.) → yes: g2 · no: g1b
3. [g1b] GATE: Are the words a scholar's saying quoted verbatim («al-Shafi'i said: …»), or a matter of creed rather than fiqh? → yes: x_rekind_other · no: x_not_a_claim
4. [g2] GATE: Is the matter one the classical books cannot treat: a modern thing (insurance, cryptocurrency, a vaccine…), an answer to a specific person's case, or a ruling the speaker attributed to a fatwa body, a mufti or a contemporary scholar (Ibn Baz, al-Albani, al-Qaradawi…)? → yes: x_to_fatwa · no: s2
5. [s2] STEP: First look for ONE page stating every spoken part: the entry on the matter in the Kuwaiti Fiqh Encyclopaedia first (it reports each school from the school's own books and usually names the adopted view, the view the school gives as its own), then Ibn Qudama's al-Mughni, then al-Nawawi's al-Majmu'. Chapter first, then a 6–8-word quote to pin the page on Shamela or usul.ai with an edition-pinned link. Copy the page's words verbatim. The other six cleared books (Zad al-Ma'ad, al-Ashbah wa-l-Naza'ir, Ibn Hisham's Sira, the two tafsirs, Tarikh al-Tabari) are never used to attribute a position to a school: a maxims book, a sira, a tafsir and a history are not books of furu'. — by the search ladder in "How we search". (note: The model knows the chapter, not the page (31/31 vs 0/31); the quote finds the page. Web page numbers were wrong 14 of 20 (different printings); quotes transfer perfectly.) → next: g2b
6. [g2b] GATE: Did the sources answer reliably: a page was found, or a retried search came back truly empty, not an empty page Shamela returned under load? (note: Shamela returns an empty page under load; an empty page is never NOT FOUND.) → yes: g3 · no: x_pending
7. [g3] GATE: Does one page state every spoken part? → yes: s4 · no: s3
8. [s3] STEP: Source each spoken part alone the same way. If the nine books fail, search the matter's entry on dorar.net/feqhia (the Dorar fiqh encyclopaedia, an approved source in the standard we adopted) and copy its words verbatim with a link to that page. A checker-added part no page states is removed from the reader's record with no marker (it was never said) and stays in the moderator's log. A spoken part not found stays, marked not found; never dropped. — by the search ladder in "How we search". (note: Whether dorar.net/feqhia counts among the cleared sources is an open question for the owner; until then the moderator log says where each part was found.) → next: s4
9. [s4] STEP: For each spoken part record: found or not; if found: does the page say what was said, its opposite, or a ruling of a different degree (the speaker says «forbidden», the page «disliked»); does it state the case and its condition as spoken or only the principle; and the page's own agreement words («they agreed», «by consensus», «the jurists agreed», «we know of no difference», «the majority», «with the Hanbalis», «a transmitted view», «an aspect», «an anomalous view»). Record whose book the page is: a school's position from its own books or from the Kuwaiti outweighs another school's book reporting it. Compare ruling words in the named school's own terminology: for the Hanafis «wajib» sits below «fard» and «makruh tahriman» is near forbidden; no reversal or degree difference is declared before that comparison. The page's words are what is shown, never the checker's description. → next: g4
10. [g4] GATE: Does the page report a holder the speaker named (a school or a scholar) holding the OPPOSITE of what was attributed to him, compared in that school's own terms, and from the Kuwaiti or that school's own books? (note: A Hanbali book reporting that Abu Hanifa «did not require» something may mean he denied its fard status, not its wajib status in Hanafi terms; a reversal is never declared from another school's report alone.) → yes: x_reversed · no: g4b
11. [g4b] GATE: Did the speaker name a specific book, and a quote search in it on Shamela (retried) finds the ruling absent from it, while another page states it? → yes: x_wrong_book · no: g4c
12. [g4c] GATE: For the same holder, does the page give a ruling of a different degree, not the opposite (obligatory vs recommended, forbidden vs disliked), or tie it to a condition the speaker dropped, or state it absolutely where he added a condition? → yes: x_stated_differently · no: g5
13. [g5] GATE: Is any spoken part not found in any cleared source? → yes: g5b · no: g6
14. [g5b] GATE: Is the ruling itself among the unfound, not merely an attribution to a school or a degree of agreement? → yes: g5c · no: x_part_notfound
15. [g5c] GATE: Does a page state the principle the ruling rests on, but not this case itself or its condition? → yes: x_case_unstated · no: g5d
16. [g5d] GATE: Does a trusted fatwa body (from the fatwa flow's list) answer the claim's exact question, not a neighbouring one? → yes: x_to_fatwa · no: x_notfound
17. [g6] GATE: Did the speaker state a degree of agreement: «consensus», «the majority», «all scholars», «the four imams», «they agreed»? (note: «Some scholars» or «a view in the school» is not an overstatement; the later gates treat it as an acknowledgement of difference.) → yes: g7 · no: g8a
18. [g7] GATE: Does the page state that degree in the same words or stronger (a documented consensus for a spoken «consensus»; three schools or the word «majority» for a spoken «majority»; the four agreeing for a spoken «the four imams»)? → yes: g8a · no: x_standing_overstated
19. [g8a] GATE: Does the page state agreement on the ruling in consensus wording («they agreed», «by consensus») or in the wording of the jurists' agreement («the jurists agreed», «we know of no difference»), and records no dissenter with it? (note: Whether «the jurists agreed» and «we know of no difference» amount to consensus proper is a shaykh question in open_questions; until settled the page's own phrase is shown in the difference slot.) → yes: x_ijma · no: g8b
20. [g8b] GATE: Does the page attribute the spoken ruling to the majority (most jurists: three of the four schools, or the page's own word «the majority») and name who differs? → yes: x_jumhur · no: g8c
21. [g8c] GATE: Does the page show the schools divided, with the spoken position the adopted view of two schools and the rest differing? → yes: g8c2 · no: g8d
22. [g8c2] GATE: Did the speaker name the holder or acknowledge the difference («with the Hanbalis», «some scholars», «a view among the jurists»)? → yes: x_khilaf_named · no: x_khilaf_as_only
23. [g8d] GATE: Is the spoken position a view within one of the four schools (adopted, or a transmitted view or aspect)? → yes: g8d2 · no: g8e
24. [g8d2] GATE: Does the page name the school's adopted view in its own words («the adopted», «the school's view», «the sound view of the school», «the apparent transmission», «the well-known», «the more apparent», «the more correct»)? (note: al-Mughni reports the transmitted views and rarely settles the adopted one; the Kuwaiti or the school's own tarjih books (al-Mardawi's al-Insaf for the Hanbalis) name it. Check the Kuwaiti before leaving here.) → yes: g8d3 · no: x_school_unsettled
25. [g8d3] GATE: Is the spoken position the adopted view itself? → yes: g8d4 · no: x_minor_view
26. [g8d4] GATE: Did the speaker name the school or acknowledge the difference? → yes: x_school · no: x_school_as_only
27. [g8e] GATE: Did the speaker name a holder outside the four schools (the Zahiris, Ibn Hazm, a named companion or early jurist) and the page attributes it to him? → yes: x_outside_named · no: x_outside_as_only

## THE EXITS (id · state · level · publishable · name). Templates use {placeholders}; fill them from what you found.

### x_ijma — state matches · level 1 · publishable — Agreed upon (consensus or agreement of the schools) / متفق عليه (إجماع أو اتفاق المذاهب)
- said slot: «{quote}»
- source slot: «{page_quote}» — {work} {vol_page} ({printing}) ↗
- difference slot (EN): The source records the scholars' agreement on this ruling, in its own words: «{page_standing}»[; the speaker attributed it to {holder}, who are among those agreeing].
- difference slot (AR): المصدر يذكر اتفاق العلماء على هذا الحكم بلفظه: «{page_standing}»[؛ وقد نسبه المتحدث إلى {holder}، وهم من أهل هذا الاتفاق].

### x_jumhur — state matches · level 2 · publishable — The majority view / قول الجمهور
- said slot: «{quote}»
- source slot: «{page_quote}» — {work} {vol_page} ({printing}) ↗
- difference slot (EN): The source attributes this ruling to the majority of jurists and names who differs: {dissent}[; it was stated with no mention of the difference][; the speaker attributed it to {holder}, who are among the majority].
- difference slot (AR): المصدر ينسب هذا الحكم إلى الجمهور (أكثر الفقهاء) ويسمّي من خالف: {dissent}[؛ وقد قيل بلا إشارة إلى الخلاف][؛ وقد نسبه المتحدث إلى {holder}، وهم من الجمهور].

### x_khilaf_named — state matches · level 3 · publishable — Recognised difference, the sides named / خلاف معتبر، وقد سُمّيت أقواله
- said slot: «{quote}»
- source slot: «{page_quote}» — {work} {vol_page} ({printing}) ↗ (one card per position when the pages differ)
- difference slot (EN): The speaker named the holder or acknowledged the difference; the source records each position to its holder: {positions}.
- difference slot (AR): المتحدث سمّى صاحبَ القول أو أقرّ بالخلاف؛ والمصدر يذكر كلَّ قولٍ لصاحبه: {positions}.

### x_khilaf_as_only — state matches · level 3 · publishable — Recognised difference stated as the only view / خلاف معتبر قيل على أنه الحكم الوحيد
- said slot: «{quote}»
- source slot: «{page_quote}» — {work} {vol_page} ({printing}) ↗
- difference slot (EN): Stated as the ruling, with no mention of the difference; the source records that the jurists differ: {positions}.
- difference slot (AR): قيل على أنه الحكم، بلا ذكرٍ للخلاف؛ والمصدر يذكر أن الفقهاء اختلفوا فيه: {positions}.

### x_school — state matches · level 4 · publishable — A named school's adopted position / قول مذهب سُمّي
- said slot: «{quote}»
- source slot: «{page_quote}» — {work} {vol_page} ({printing}) ↗
- difference slot (EN): The source records this as the adopted position (the view the school gives as its own) of the {school} school; the others hold: {others}.
- difference slot (AR): المصدر يذكر أن هذا هو المعتمد (القول الذي يُفتى به في المذهب) عند {school}؛ وغيرهم على: {others}.

### x_school_as_only — state matches · level 4 · publishable — One school's position stated as the only view / قول مذهب واحد قيل على أنه الحكم الوحيد
- said slot: «{quote}»
- source slot: «{page_quote}» — {work} {vol_page} ({printing}) ↗
- difference slot (EN): Stated as the ruling, with no attribution; the source attributes it to the {school} school alone; the others hold: {others}.
- difference slot (AR): قيل على أنه الحكم، بلا نسبة؛ والمصدر ينسبه إلى {school} وحدهم، وغيرهم على: {others}.

### x_school_unsettled — state matches · level 4 · publishable — A view within a school; the page names no adopted view / قول في مذهب، والصفحة لا تسمّي المعتمد
- said slot: «{quote}»
- source slot: «{page_quote}» — {work} {vol_page} ({printing}) ↗
- difference slot (EN): The source records it as one of the {school} school's views («{page_words}») without naming which is adopted; the others hold: {others}.
- difference slot (AR): المصدر يذكره قولًا من أقوال {school} («{page_words}») ولا يسمّي المعتمدَ منها؛ وغيرهم على: {others}.

### x_minor_view — state matches · level 5 · publishable — A non-adopted view within a school / قول غير معتمد في مذهب
- said slot: «{quote}»
- source slot: «{page_quote}» — {work} {vol_page} ({printing}) ↗
- difference slot (EN): The source records it as a transmitted view or aspect within the {school} school, not its adopted position; the adopted position: {adopted}.
- difference slot (AR): المصدر يذكره روايةً أو وجهًا (قولًا منقولًا داخل المذهب) غير معتمد عند {school}؛ والمعتمد عندهم: {adopted}.

### x_outside_named — state matches · level 5 · publishable — A view outside the four schools, holder named / قول خارج المذاهب الأربعة، سُمّي صاحبه
- said slot: «{quote}»
- source slot: «{page_quote}» — {work} {vol_page} ({printing}) ↗
- difference slot (EN): The speaker attributed it to {holder}; the source records it as his; the four schools hold otherwise: {schools}.
- difference slot (AR): المتحدث نسبه إلى {holder}، والمصدر يذكره عنه؛ والمذاهب الأربعة على خلافه: {schools}.

### x_outside_as_only — state matches · level 5 · publishable — A view outside the four schools stated as the ruling / قول خارج المذاهب الأربعة قيل على أنه الحكم
- said slot: «{quote}»
- source slot: «{page_quote}» — {work} {vol_page} ({printing}) ↗
- difference slot (EN): Stated as the ruling; the source attributes it to none of the four schools but to {holder}; the schools hold: {schools}.
- difference slot (AR): قيل على أنه الحكم؛ والمصدر لا ينسبه إلى مذهب من الأربعة بل إلى {holder}، والمذاهب على: {schools}.

### x_standing_overstated — state overstated · level 2 · publishable — Degree of agreement overstated / مبالغة في حكاية الاتفاق
- said slot: «{quote}»
- source slot: «{page_quote}» — {work} {vol_page} ({printing}) ↗
- difference slot (EN): Said «{spoken_standing}»; the source records «{page_standing}» and names who differs: {dissent}.
- difference slot (AR): قيل «{spoken_standing}»؛ والمصدر يذكر «{page_standing}» ويسمّي من خالف: {dissent}.

### x_stated_differently — state corrected · level 4 · publishable — Ruling word or condition differs from the source / الحكم أو شرطه غير ما في المصدر
- said slot: «{quote}»
- source slot: «{page_quote}» — {work} {vol_page} ({printing}) ↗
- difference slot (EN): Said «{spoken_wording}»; for the same holder the source records «{page_wording}».
- difference slot (AR): قيل «{spoken_wording}»؛ والمصدر يذكر لصاحب القول نفسه «{page_wording}».

### x_wrong_book — state corrected · level 4 · publishable — Attributed to a book that does not state it / نُسب إلى كتاب لا يذكره
- said slot: «{quote}»
- source slot: Not found in «{named_work}» (text search on Shamela); the source that states it: «{page_quote}» — {work} {vol_page} ({printing}) ↗
- difference slot (EN): Said to be in «{named_work}»; a text search did not find it there; the source that states it: {work} {vol_page}.
- difference slot (AR): قيل إنه في «{named_work}»؛ ولم نجده فيه بالبحث بالنص، والمصدر الذي يذكره: {work}، {vol_page}.

### x_reversed — state corrected · level 4 · publishable — Reversed attribution / نسبة معكوسة
- said slot: «{quote}»
- source slot: «{page_quote}» — {work} {vol_page} ({printing}) ↗
- difference slot (EN): Said that {holder} hold «{spoken_position}»; the source reports them holding the opposite: «{page_position}».
- difference slot (AR): قيل إن {holder} على «{spoken_position}»؛ والمصدر ينقل عنهم عكسه: «{page_position}».

### x_part_notfound — state not_found · level 2 · publishable — A part not found in the cleared sources / جزء لم يوجد في المصادر المعتمدة
- said slot: «{quote}»
- source slot: Found parts: «{page_quote}» — {work} {vol_page} ({printing}) ↗; for «{part}»: not found in the cleared sources
- difference slot (EN): {found_parts} is as the source has it; «{part}» was not found in the cleared sources.
- difference slot (AR): {found_parts} كما في المصدر؛ أما «{part}» فلم نجده في المصادر التي نملك.

### x_case_unstated — state not_found · level 0 · publishable — Principle found, case not stated / الأصل موجود والحالة غير مذكورة
- said slot: «{quote}»
- source slot: «{premise_quote}» — {work} {vol_page} ({printing}) ↗
- difference slot (EN): The source states the principle ({premise}) and does not name this case ({case}); the case's ruling was not found in the cleared sources.
- difference slot (AR): المصدر يذكر الأصل ({premise}) ولا يذكر هذه الحالة بعينها ({case})؛ فحكم الحالة لم نجده في المصادر التي نملك.

### x_notfound — state not_found · level 0 · publishable — Not found in the cleared sources / لم يوجد في المصادر المعتمدة
- said slot: «{quote}»
- source slot: Not found in the cleared sources
- difference slot (EN): This ruling was not found in the cleared sources.
- difference slot (AR): لم نجد هذا الحكم في المصادر التي نملك.

### x_to_fatwa — state rekinded · level 0 · NOT published — Handed to the fatwa flow / يُحال إلى مسار الفتوى
- said slot: «{quote}» (the speaker's words do not change with the flow)
- source slot: Filled by the fatwa flow (body, date, link)
- difference slot (EN): Filled by the fatwa flow
- difference slot (AR): يملؤه مسار الفتوى

### x_rekind_other — state rekinded · level 0 · NOT published — Re-kinded to another flow / يُحال إلى نوع آخر
- said slot: Not shown from this flow
- source slot: —
- difference slot (EN): —
- difference slot (AR): —

### x_not_a_claim — state not_a_claim · level 0 · NOT published — Not a ruling claim / ليس ادعاءَ حكم
- said slot: Not shown
- source slot: —
- difference slot (EN): —
- difference slot (AR): —

### x_pending — state pending · level 0 · NOT published — Pending: the source did not answer / معلّق: المصدر لم يُجب
- said slot: Not shown until the sources answer
- source slot: —
- difference slot (EN): —
- difference slot (AR): —
