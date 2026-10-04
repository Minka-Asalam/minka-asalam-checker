# FLOW: Checking flow for the Report kind: history, sirah, a scholar's saying, Israiliyyat / مسار فحص الخبر: تاريخ، سيرة، قول عالم، إسرائيليات

## INTAKE
The extractor hands the checker: the speaker's words verbatim with start and end seconds; the sub-kind (a sirah/history event, a companion's or successor's saying, a scholar's saying, a story in a tafsir); who the report is attributed to (a named person, 'the historians' or 'the scholars' with no name, or 'it is reported' with no attribution); the book or narrator if the speaker named one; every name, place, date and number inside the report; whether the speaker told it as a report ('it is reported that') or as settled fact ('as is known'); and whether he claimed a standing for it ('agreed upon', 'well known', 'sahih', 'undisputed'). Every part is marked 'spoken'. The extractor adds nothing of its own, never summarises and never corrects.

## HOW WE SEARCH — How we search for a report
1. A scholar's saying: his own works first on usul.ai and Shamela, by chapter, then by the reading agent when the work is a verified copy.
2. Sirah and history: Ibn Hisham and al-Tabari (verified copies), then dorar's history encyclopaedia, then the cleared sirah works on usul.
3. Shamela with several phrasings, then a web citation whose quote alone is kept and located; one retry on empty.
4. The report's parts (the event, the person, the detail, the standing) each with its source, one page naming all first.
5. The chain's grading from dorar when the report has a chain; else the "reported in the sources" level. Then "not found" with the "where we searched" line.

## THE STEPS AND GATES, IN ORDER (a gate has yes/no targets; a target is a step id or an exit id)
1. [s1] STEP: Split the words into parts, each sourced alone: the event or statement itself; the person it is attributed to; the book the speaker named, if he named one; each detail (date, place, number, name) as its own part; and any standing the speaker claimed ('agreed upon', 'sahih') as its own part. An unnamed plural attribution ('the historians say') counts as sourced when the report is found in one cleared work; 'all the historians' or 'undisputed' is a claimed standing, sourced on its own. Every part is marked 'spoken'. (note: Owner's decision 5: a part per named position and a part for the standing. Measured 2026-09-25: the part that failed was almost always a standing the checker had added from its own knowledge, so a standing part is created only from the speaker's own words.) → next: g1
2. [g1] GATE: Is the report attributed to the Prophet as his own words or deed? Or is it in truth a verse, a legal ruling (halal and haram, valid and void) even when framed as 'Shaykh so-and-so said', or a bare figure? (note: A companion's words the speaker raised to the Prophet, or words he gave to Umar that are in fact a hadith, go to the hadith flow. A scholar's saying whose content is a legal ruling or a fatwa goes to the ruling or fatwa flow; what stays here is a scholar's wisdom, or his account of a person, a book or an event. The reverse is the hadith flow's job: what reached it as a hadith but is a scholar's saying is handed here.) → yes: x_rekind · no: g2
3. [g2] GATE: Are the words the speaker's own opinion, inference or lesson drawn from the event, not something he transmits from another? → yes: x_not_a_claim · no: s2
4. [s2] STEP: Name the sub-kind and the search order. A scholar's saying: his own works first (shamela.ws / usul.ai), then his school's recognised books or the recognised works that quote him, then dorar.net entries that quote him. A sirah/history event or a companion's or successor's saying: Ibn Hisham's Sira, Tarikh al-Tabari, dorar's hadith search (athar and their gradings live there), then dorar's history section. A tafsir story: Tafsir al-Tabari, Tafsir al-Baghawi, dorar. Search by an exact 6-8 word quote of the speaker's key phrase, then by its expected classical wording; never by the checker's summary. A page on a general website (an article, a forum, a preacher's site) is not a source; it may lead to the book, and the book itself is what is cited. — by the search ladder in "How we search". (note: Measured: an exact quote finds the page every time; the page number comes from the text, never from model recall. Shamela silently returns empty under load: retry before ruling 'not found'. The checker's own reading of a chain ('so-and-so is weak', 'the chain is mursal') is neither a source nor a grading; a grading is what a recognised grader said, in his words, in a cleared source.) → next: g3
5. [g3] GATE: Was the report found in a source: a specific page carrying the words? → yes: g3b · no: g9
6. [g3b] GATE: Is the work it was found in on the cleared list (today's nine works, dorar.net, and whatever the shaykh clears later)? (note: A report found in a work not yet cleared (Siyar A'lam al-Nubala' or al-Bidaya wa-l-Nihaya today) is shown to the viewer as 'not found in the cleared sources' — which is true — and the work and page go to the moderator queue for the shaykh to consider clearing the work; once cleared, the row is re-checked. See the open question on the three works.) → yes: g4 · no: x_notfound
7. [g4] GATE: Does one page state every part as the speaker said it: the same person, the event, each detail, and the claimed standing in words that carry it? (note: A page that establishes the event but not the date the speaker added supports a part, not the whole. The wudu-intention case (Kuwaiti 10/296) is the model: the page supports the premise, not the stated case. A derived detail (a Gregorian date converted from the hijri, an age computed from two dates) is rarely on a page; the checker never computes it, and it counts as found only when a page states it.) → yes: g6 · no: s3
8. [s3] STEP: Source each unfound part alone: another page of the same work, or another cleared work. Record one of three for every part: found (with its page); contradicted by a page (a different date, number or person, or a grader's ruling against the standing the speaker claimed); or not found. The standing part counts as found only when a page says it in so many words ('the sirah scholars do not differ', 'its chain is sound'). The book the speaker named: if we hold it and the exact quote is not in it, record 'not found in {named work}'; if we do not hold it, record 'we do not hold {named work}', never a bare 'not found'. Whatever stays without a page is recorded NOT FOUND, the speaker's words kept. — by the search ladder in "How we search". → next: g5
9. [g5] GATE: Does a page attribute the words or deed to a person other than the one the speaker named? (note: Owner's decision 3: a reversed attribution is shown, never silently replaced.) → yes: x_reversed · no: g5b
10. [g5b] GATE: Does a page give a detail that contradicts the speaker's: a different date, place, number or name? (note: Contradiction is not absence: 'Badr was in year 3' while the page says year 2 is a correction shown in the page's words; 'he stayed so many days' while the page is silent is 'not found'.) → yes: x_misworded · no: g5c
11. [g5c] GATE: After the second search, is any part still without a page? → yes: x_partly · no: g6
12. [g6] GATE: Does the speaker's wording carry the same substance as the page, with nothing added and no changed meaning? (Telling a report in one's own words — what the scholars call 'narrating by meaning' — is fine; changing the meaning is not.) → yes: g7 · no: x_misworded
13. [g7] GATE: Does the source itself state that the report is Israiliyyat (reports handed down from the Jews and Christians, from their books and sayings): it says 'from the People of the Book', relays it from Wahb ibn Munabbih or Ka'b al-Ahbar as one of their reports, or the commentator names it so? (note: The marker comes from the source, not the checker; if the source does not say it, the checker does not. The app never sorts a report itself into accepted / rejected / silent — that is a ruling; the three kinds appear in 'How to receive it', and the commentator's own ruling is shown only when it is on the page, in his words.) → yes: x_israiliyyat · no: g8
14. [g8] GATE: Is the report a scholar's own words, found in his own work in his wording? → yes: g8a · no: g8b
15. [g8a] GATE: Does the page present these words as the scholar's own view, not as another's view he relays to refute or discuss, and not as a position the page says he left? (note: If the scholar relays the view from a named person ('and Abu Hanifa said…') and then refutes it, the source attributes it to that person: the reversed-attribution exit. If no one is named ('someone said') or the page says he later left the view, the changed-meaning exit is used, with the page's words shown.) → yes: x_saying_own_work · no: x_reversed
16. [g8b] GATE: Is there a grading of its chain (its line of narrators) by a recognised grader: a dorar.net hit by one of the accepted graders, or the work's author or editor grading it on the page itself with a grading word (sahih, hasan, weak, fabricated…)? (note: Accepted graders today: al-Albani, Shu'ayb al-Arna'ut, Ibn Hajar, al-Dhahabi; Bukhari and Muslim are sahih by definition. A description of the chain alone ('mursal', 'broken') with no grading word is not a grading (open question); the checker's own reading of the chain is never one.) → yes: g8f · no: g8g
17. [g8f] GATE: Do the accepted graders differ on it: one graded it sound and another weak? (note: The app no more chooses between graders than between schools; both gradings are shown in their words with their authors' names.) → yes: x_graders_differ · no: g8c
18. [g8c] GATE: Is the grade sahih or hasan, or the grader's equivalent ('its chain is good', 'established')? → yes: x_established · no: g8e
19. [g8e] GATE: Is the grade fabricated, 'no basis', false, or a lie? (note: 'Munkar', 'very weak' and 'wahin' are degrees of weakness in the hadith scholars' terminology, not a ruling of fabrication; they go to the weak exit with the grader's word shown verbatim.) → yes: x_baseless · no: x_weak
20. [g8g] GATE: Do the cleared sources carry more than one account of the event, differing on whether or how it happened, or does the historian write 'and they differed' or the like on the page? (note: The standard's level C: contested history is shown with its difference, never settled to one account. The difference comes from the page (the historian states it, or two pages we hold disagree), not from the checker's knowledge.) → yes: x_accounts_differ · no: g8d
21. [g8d] GATE: Is it a settled sirah fact: stated in the cleared sirah works, with the historian noting on the page that it is undisputed? (note: The standard's level A, 'basic sirah'. 'Undisputed' needs a page saying so, not the checker's estimate; such a page is rare in Ibn Hisham and al-Tabari, so most basic sirah will land at level 2 unless an alternative is adopted. See open question 6.) → yes: x_established · no: x_reported
22. [g9] GATE: Does a recognised scholar or grader state, in a cleared source, that this report has no basis or is fabricated? (note: 'Not found' is not 'no basis': the first is our sources' silence, the second is a scholar's ruling shown in his words.) → yes: x_baseless · no: x_notfound

## THE EXITS (id · state · level · publishable · name). Templates use {placeholders}; fill them from what you found.

### x_rekind — state rekinded · level 0 · NOT published — Handed to another kind's flow / يُحوَّل إلى مسار صنف آخر
- said slot: «{said}»
- source slot: —
- difference slot (EN): Checked in the {target_kind} flow; no row here.
- difference slot (AR): يُفحَص في مسار {target_kind}؛ لا سطر هنا.

### x_not_a_claim — state not_a_claim · level 0 · NOT published — The speaker's own view / رأي المتحدث نفسه
- said slot: «{said}»
- source slot: —
- difference slot (EN): The speaker's own view, not a transmitted report; not checked, no row published.
- difference slot (AR): رأيٌ للمتحدث لا خبرٌ منقول؛ لا يُفحَص ولا يُنشَر له سطر.

### x_established — state matches · level 1 · publishable — An established report / خبر ثابت
- said slot: «{said}»
- source slot: «{source_text}» — {work} {vol_page}{, {edition} printing}{ · {grading} · {grader}} ↗
- difference slot (EN): Established · {grading_or_undisputed}
- difference slot (AR): ثابت · {grading_or_undisputed}

### x_saying_own_work — state matches · level 1 · publishable — A scholar's saying in his own work / قول عالم في كتابه
- said slot: «{said}»
- source slot: {scholar} wrote: «{source_text}» — {work} {vol_page}{, {edition} printing} ↗
- difference slot (EN): In his own work, in his words
- difference slot (AR): في كتابه بلفظه

### x_reported — state matches · level 3 · publishable — Reported in the sources / مرويّ في المصادر
- said slot: «{said}»
- source slot: «{source_text}» — {work} {vol_page}{, {edition} printing}{ · via {chain_head}} ↗
- difference slot (EN): Reported in {work} · we found no grading of its chain by the accepted graders
- difference slot (AR): مرويّ في {work} · لم نقف على حكمٍ لإسناده عند المحكِّمين المعتمدين

### x_accounts_differ — state matches · level 4 · publishable — The accounts differ / اختلفت الروايات فيه
- said slot: «{said}»
- source slot: «{source_text}» — {work} {vol_page} ↗{ · another account: «{source_text_2}» — {work_2} {vol_page_2} ↗}
- difference slot (EN): The accounts differ · the sources carry {n} versions{ · the historian wrote: «{historian_words}»}
- difference slot (AR): اختلفت الروايات · المصادر تذكر {n} روايات{ · قال المؤرخ: «{historian_words}»}

### x_graders_differ — state matches · level 4 · publishable — The graders differ on its chain / اختلف المحدّثون في إسناده
- said slot: «{said}»
- source slot: «{source_text}» — {work} {vol_page} ↗ · {grader_a}: {grade_a}, {grading_work_a} {grading_ref_a} ↗ · {grader_b}: {grade_b}, {grading_work_b} {grading_ref_b} ↗
- difference slot (EN): The graders differ: {grader_a} {grade_a}; {grader_b} {grade_b}
- difference slot (AR): اختلف المحدّثون: {grader_a} {grade_a}، و{grader_b} {grade_b}

### x_israiliyyat — state matches · level 4 · publishable — An Israiliyyat report / من الإسرائيليات
- said slot: «{said}»
- source slot: «{source_text}» — {work} {vol_page} · {source_marker} ↗
- difference slot (EN): Israiliyyat (reports handed down from the People of the Book) · reported in {work} · {source_marker}{ · {commentator} wrote: «{commentator_words}»}
- difference slot (AR): من الإسرائيليات (أخبار نُقلت عن أهل الكتاب) · مرويّ في {work} · {source_marker}{ · قال {commentator}: «{commentator_words}»}

### x_weak — state matches · level 5 · publishable — A report with a weak chain / خبر ضعيف الإسناد
- said slot: «{said}»
- source slot: «{source_text}» — {work} {vol_page} · {grader_word} · {grader}, {grading_work} {grading_ref} ↗
- difference slot (EN): Weak report · {grader}: «{grader_word}»{ · the speaker said «{claimed_standing}»; we found no one who said so}
- difference slot (AR): ضعيف · {grader}: «{grader_word}»{ · قال المتحدث «{claimed_standing}»، ولم نجد من قاله}

### x_baseless — state matches · level 6 · publishable — A recognised grader ruled it baseless / حكم محدّثٌ معتبر بأنه لا أصل له
- said slot: «{said}»
- source slot: {«{source_text}» — {work} {vol_page} ↗ · }{grader} wrote: «{grader_words}» — {grading_work} {grading_ref} ↗
- difference slot (EN): {grading_word} per {grader}
- difference slot (AR): {grading_word} عند {grader}

### x_reversed — state corrected · level 3 · publishable — A reversed attribution / نسبة معكوسة
- said slot: «{said}»
- source slot: «{source_text}» — {work} {vol_page}{, {edition} printing} ↗
- difference slot (EN): The source attributes it to {source_person}; the speaker attributed it to {said_person}
- difference slot (AR): المصدر ينسبه إلى {source_person}، والمتحدث نسبه إلى {said_person}

### x_misworded — state corrected · level 3 · publishable — A changed meaning or a differing detail / معنى مغيَّر أو تفصيل مخالف
- said slot: «{said}»
- source slot: «{source_text}» — {work} {vol_page}{, {edition} printing}{ · {grading} · {grader}} ↗
- difference slot (EN): The source says: «{source_key_phrase}»
- difference slot (AR): المصدر يقول: «{source_key_phrase}»

### x_partly — state not_found · level 3 · publishable — Part found, part not found / جزءٌ موجود وجزءٌ لم يوجد
- said slot: «{said}»
- source slot: «{source_text}» — {work} {vol_page} ↗ · found in it: {found_parts}
- difference slot (EN): {found_rank_word} · «{missing_part}»: not found in the cleared sources{ · «{cited_work}»: we do not hold it}
- difference slot (AR): {found_rank_word} · «{missing_part}»: لم يوجد في المصادر التي نملكها{ · «{cited_work}»: لا نملكه}

### x_notfound — state not_found · level 0 · publishable — Not found in the cleared sources / لم يوجد في المصادر التي نملكها
- said slot: «{said}»
- source slot: Not found in the cleared sources: {works_searched}
- difference slot (EN): Not found · searched in {works_searched}
- difference slot (AR): لم يوجد · بحثنا في {works_searched}
