# FLOW: Not found: what none of the sources we rely on states / لم نجد له مصدرًا: ما لم تذكره المصادر المعتمدة عندنا

## INTAKE
This kind never starts from the extractor. It receives what the other kinds' flows (hadith, ruling, fatwa, report, number, saying) ended with and found nothing. The Qur'an flow never hands here: the mushaf is a complete preserved text, so words absent from it verbatim or nearby are 'not Qur'an', that flow's own verdict, never 'not found'. Per part it is handed: (1) the speaker's words verbatim with the timestamp; (2) the kind tried first; (3) the search log: every store searched and what each answered: an explicit no result, an empty page with no message, or a timeout; (4) whether the speaker said the part or the checker added it; (5) whether the speaker named a specific source (a book, a person, a hadith collection); (6) whether he said it tentatively ('it is said', 'I heard'); (7) the harm level if a viewer acted on the words as said, on the existing harm ladder (none, minor, real, severe). Entry rules: (a) a checker-added part with no source is deleted from the reader record and never enters, since we show only what the speaker said. (b) 'The sources we rely on' is the list the shaykh cleared (quran.com, dorar hadith and feqhia, the nine books on usul.ai, Shamela editions of cleared works, the cleared fatwa bodies); a hit in an uncleared Shamela work does not count as found and is logged for the moderator. (c) 'Not found' is a report about OUR search, not a judgment on the words or the speaker, and is distinct from the hadith scholars' verdict 'no origin', a scholar's ruling that words attributed to the Prophet have no chain. (d) Internal exits are never published and carry rank 0 = unranked.

## THE STEPS AND GATES, IN ORDER (a gate has yes/no targets; a target is a step id or an exit id)
1. [s1] STEP: Receive the part: the speaker's words, the kind tried, and the search log store by store. → next: g1
2. [g1] GATE: Did every store relevant to this kind give a real answer (an explicit no result), not an empty page or a timeout? (note: Shamela returns an empty page under load with no error; empty is not 'no result'. A hit in an uncleared work is logged internally and does not count as found.) → yes: g2 · no: s2
3. [s2] STEP: Re-run the stores that did not answer, once after a pause, by short quote (6-8 words) then by meaning. → next: g1b
4. [g1b] GATE: Did the retry give a real answer? → yes: g2 · no: x_pending
5. [g2] GATE: Is it advice or a personal preference in the speaker's own name, claiming no religious ruling (no lawful/forbidden/valid/void) and attributing nothing to the religion or a source? (note: 'In my view this is forbidden' is a ruling in his own name, not advice; it continues. Categorical words with no attribution ('this is forbidden') claim a ruling and continue.) → yes: x_own_view · no: g3
6. [g3] GATE: If a viewer acted on the words as said, would that fall in the 'severe' rung of the harm ladder (takfir of named persons, invalidating people's worship at scale, sectarian incitement, adding words to the Qur'an)? (note: Words presented as hadith are not here: they go through the takhrij books first (g7), since absence from dorar does not make them a lie.) → yes: x_severe_hold · no: g7
7. [g7] GATE: Is the wording in hadith form: 'the Messenger of Allah said', or a du'a, a virtue of an act or a counted reward attributed to him, or a rhymed maxim people relay as hadith? → yes: s4 · no: g4
8. [s4] STEP: Search the works that collected what people relay as hadith and stated its status: al-Sakhawi's al-Maqasid al-Hasana, al-Ajluni's Kashf al-Khafa, al-Qari's al-Asrar al-Marfu'a, al-Shawkani's al-Fawa'id al-Majmu'a, al-Albani's al-Da'ifa, and dorar's hits at every grade; by wording then by meaning, since people relay hadith by meaning. → next: g8
9. [g8] GATE: Did a recognised scholar rule on these words in any way ('no origin', fabricated, false, does not hold, or any hadith grade)? → yes: x_scholar_ruled · no: x_hadith_form_not_found
10. [g4] GATE: Did the speaker name a specific source: a book ('in al-Mughni'), a person ('Ibn Taymiyya said', 'Shaykh Ibn Baz said', 'Umar said'), or a hadith collection? (note: A vague reference ('a study', 'scholars say', 'a shaykh') is not a named source; it continues from g4 with 'no'.) → yes: g4b · no: s5
11. [g4b] GATE: Is what was named a specific book (not merely a person)? → yes: g5 · no: s3b
12. [g5] GATE: Is the named book available in a store we search: the nine books on usul.ai, a Shamela edition, or dorar? (note: Shamela carries most of the classical corpus, so a work we 'do not hold' is usually a lecture, a website or a contemporary print not uploaded.) → yes: s3 · no: x_source_unheld
13. [s3] STEP: Search the named book alone: in the chapter the matter belongs to, by short quote then by meaning, recording the edition searched. → next: g6
14. [g6] GATE: Is the statement in the named book (verbatim or in explicit meaning)? → yes: x_reroute · no: x_named_work_absent
15. [s3b] STEP: Search for the saying attributed to the named person: in his works if on Shamela, on his official site if among the cleared bodies, and in what the Kuwaiti and dorar quote from him. → next: g6b
16. [g6b] GATE: Was the saying found attributed to this person in a cleared source? → yes: x_reroute · no: x_named_person_absent
17. [s5] STEP: Search by topic: locate the chapter the matter belongs to (the Kuwaiti entry, the book and chapter of al-Mughni and al-Majmu') and read it, naming the case as the fiqh books name it (the shower without intention is the question 'does a bath count as wudu'). (note: Measured: the model named the chapter 31/31 and the page 0/31; the text supplies the page.) → next: g9a
18. [g9a] GATE: Was the case itself, as the speaker said it, found in that chapter? → yes: x_reroute · no: g9
19. [g9] GATE: Does the source state the general rule the case rests on, without the case itself? → yes: x_premise_only · no: g10
20. [g10] GATE: Is the part a claim of standing (the majority, consensus, a school: 'the majority hold', 'the scholars agreed', 'the Shafi'i position') with no source stating that attribution? → yes: x_standing_not_found · no: g11
21. [g11] GATE: Is the statement a practical matter people act on (lawful, forbidden, permitted, not permitted, valid, void)? → yes: x_needs_mufti · no: g12
22. [g12] GATE: Did the speaker say it tentatively ('it is said', 'I heard that', 'I don't recall the source')? → yes: x_hedged_not_found · no: x_not_found

## THE EXITS (id · state · level · publishable · name). Templates use {placeholders}; fill them from what you found.

### x_pending — state pending · level 0 · NOT published — Search incomplete / البحث لم يكتمل
- said slot: "{quote}"
- source slot: (internal) no answer from: {failed_stores_en}
- difference slot (EN): (internal) held until the stores answer; the pipeline retries on its own and the moderator sees it only if it stays unanswered. Not published.
- difference slot (AR): (داخلي) معلّق حتى تُجيب المخازن؛ يعيده النظام تلقائيًا، ولا يراه المشرف إلا إن بقي بلا جواب. لا يُنشر.

### x_own_view — state not_a_claim · level 0 · NOT published — Advice in the speaker's own name / نصيحة باسم قائلها
- said slot: "{quote}"
- source slot: (internal) no source sought: advice or a personal preference with no religious ruling.
- difference slot (EN): (internal) not a claim about a source.
- difference slot (AR): (داخلي) ليس ادعاءً عن مصدر.

### x_severe_hold — state not_found · level 0 · NOT published — Severe harm with no source: held for the moderator / ضرر شديد بلا مصدر: يُحجز للمشرف
- said slot: "{quote}"
- source slot: (internal) found in no cleared source; harm: severe; basis: {harm_basis_en}
- difference slot (EN): (internal) the part is held for the moderator, who may publish it through one of this kind's publishable exits or keep it held; any decision on the video itself belongs to the moderation rules, not this flow. (Existing rule 184: severe harm never publishes.)
- difference slot (AR): (داخلي) يُحجز الجزء للمشرف؛ له أن ينشره بأحد مخارج هذا النوع القابلة للنشر أو يبقيه محجوزًا؛ أي قرار في الفيديو نفسه يعود إلى قواعد الإشراف لا إلى هذا المسار. (قاعدة ١٨٤ القائمة: الضرر الشديد لا يُنشر.)

### x_scholar_ruled — state rekinded · level 0 · NOT published — A scholar ruled on it: back to the hadith flow / حكم عليه عالم: يعود إلى مسار الحديث
- said slot: "{quote}"
- source slot: (internal) {grader_en} says in "{work_en}" {ref}: "{grader_quote_ar}"; his ruling: {grade_en}.
- difference slot (EN): (internal) handed to the hadith flow with the scholar's ruling ('no origin', fabricated, weak...); that flow decides display and rank.
- difference slot (AR): (داخلي) يُسلَّم إلى مسار الحديث بحكم العالم («لا أصل له»، موضوع، ضعيف…)؛ ذاك المسار يقرر العرض والرتبة.

### x_hadith_form_not_found — state not_found · level 0 · publishable — Presented as hadith, not found / قُدِّم حديثًا ولم نجده
- said slot: "{quote}"
- source slot: We did not find these words in the hadith sources we rely on, nor a scholar's ruling on them. Searched: {searched_stores_en}.{named_collection_clause_en}
- difference slot (EN): We neither affirm nor deny it as hadith; what is not known to be sound is not relayed as 'the Messenger of Allah said' but as 'it is narrated' until its origin is known.
- difference slot (AR): لا نُثبتها حديثًا ولا ننفيها؛ ما لم يُعرف ثبوته لا يُنقل بصيغة «قال رسول الله ﷺ» بل «يُروى» حتى يُعرف أصله.

### x_source_unheld — state not_checked · level 0 · publishable — A named source we do not search / سُمّي مصدر لا نبحث فيه
- said slot: "{quote}"
- source slot: The speaker attributed it to "{named_source_en}", which is not among the sources we rely on. Searched: {searched_stores_en}.
- difference slot (EN): Not found in the sources we rely on; the named source is not in our hands, so we neither affirm nor deny it.
- difference slot (AR): لم نجد له مصدرًا عندنا؛ المصدر المسمّى ليس بين أيدينا، فلا نُثبته ولا ننفيه.

### x_reroute — state rekinded · level 0 · NOT published — Found: back to its kind's flow / وُجد: يعود إلى مسار نوعه
- said slot: "{quote}"
- source slot: (internal) found in {work_en} {volume}/{page}: "{source_quote_ar}"
- difference slot (EN): (internal) the first search missed the place; handed to the {kind} flow to compare and rank there.
- difference slot (AR): (داخلي) البحث الأول أخطأ الموضع؛ يُسلَّم إلى مسار {kind} ليُقارَن ويُرتَّب هناك.

### x_named_work_absent — state not_found · level 0 · publishable — Not in the named work / ليس في الكتاب الذي سُمّي
- said slot: "{quote}"
- source slot: The speaker attributed it to "{named_source_en}". We did not find it there in the edition we searched ({edition_en}), chapter {chapter_en}.
- difference slot (EN): Not found in the named work; the speaker's words stay as said, with no source on our side. Absence in one edition is not a judgment on the speaker.
- difference slot (AR): لم نجده في الكتاب المسمّى؛ كلام المتحدث باقٍ كما قاله، ولا مصدر له عندنا. عدم وجوده في طبعة ليس حكمًا على قائله.

### x_named_person_absent — state not_found · level 0 · publishable — Attributed to a scholar, not found from him / نُسب إلى عالم ولم نجده عنه
- said slot: "{quote}"
- source slot: The speaker attributed it to {person_en}. We did not find it attributed to him in the sources we rely on. Searched: {searched_stores_en}.
- difference slot (EN): We did not find this saying from {person_en} in our sources; we neither affirm nor deny the attribution, since a scholar's words exceed what we hold.
- difference slot (AR): لم نجد هذا القول عن {person_ar} في المصادر المعتمدة؛ لا نُثبت نسبته ولا ننفيها، لأن كلام العالم أوسع مما بين أيدينا.

### x_premise_only — state not_found · level 0 · publishable — The rule is in the sources; the case is not / القاعدة في المصادر، والحالة ليست فيها
- said slot: "{quote}"
- source slot: {work_en} {volume}/{page} on the general rule: "{premise_quote_ar}". The case the speaker named ({case_en}) is not stated there.
- difference slot (EN): The source states the rule, not this case itself; applying the rule to the case is scholars' work we do not do, so the speaker's case stays unsourced.
- difference slot (AR): المصدر يذكر القاعدة ولا يذكر هذه الحالة بعينها؛ تطبيق القاعدة على الحالة عمل للعلماء لا نقوم به، فيبقى كلام المتحدث بلا مصدر لحالته.

### x_standing_not_found — state not_found · level 0 · publishable — Attributed to the majority or consensus; no source states it / نُسب إلى الجمهور أو الإجماع ولم نجد من ذكره
- said slot: "{quote}"
- source slot: The speaker attributed this ruling to {standing_claimed_en}. We found no cleared source stating that attribution. Searched: {searched_stores_en}.
- difference slot (EN): We found no source saying this is the majority's view or agreed upon; the attribution is shown as said, neither affirmed nor denied.
- difference slot (AR): لم نجد من يذكر أن هذا قول الجمهور أو محل إجماع؛ نعرض النسبة كما قالها ولا نُثبتها ولا ننفيها.

### x_needs_mufti — state not_found · level 0 · publishable — Not found: ask a mufti / لم نجد له مصدرًا: يُسأل عنه مفتٍ
- said slot: "{quote}"
- source slot: We did not find this matter in the fiqh works we rely on nor in the cleared bodies' fatwas. Searched: {searched_stores_en}.
- difference slot (EN): A practical matter with no text and no fatwa in our sources, so it is for a mufti to answer; we do not fill that gap.{hedge_clause_en}
- difference slot (AR): مسألة عملية لم نجد فيها نصًّا ولا فتوى، فيُسأل عنها أهل الفتوى؛ نحن لا نملأ هذا الفراغ.{hedge_clause_ar}

### x_hedged_not_found — state not_found · level 0 · publishable — Said tentatively, and not found / قاله على التردد ولم نجده
- said slot: "{quote}"
- source slot: Not found in the sources we rely on. Searched: {searched_stores_en}.
- difference slot (EN): The speaker himself did not assert it ("{hedge_word_en}"), and we found no source for it; neither believed nor disbelieved until its origin is known.
- difference slot (AR): المتحدث نفسه لم يجزم به («{hedge_word_ar}»)، ولم نجد له مصدرًا عندنا؛ لا يُصدَّق ولا يُكذَّب حتى يُعرف أصله.

### x_not_found — state not_found · level 0 · publishable — Not found in the sources we rely on / لم نجده في المصادر المعتمدة عندنا
- said slot: "{quote}"
- source slot: Not found in the sources we rely on. Searched: {searched_stores_en}.
- difference slot (EN): No text to compare with; the speaker's words stay as said, and we neither affirm nor deny them.
- difference slot (AR): لا نص يُقارَن به؛ كلام المتحدث باقٍ كما قاله، ولا نُثبته ولا ننفيه.
