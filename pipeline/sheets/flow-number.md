# FLOW: Number or figure / الرقم والتقدير

## INTAKE
The extractor hands the checker: the timestamp and the speaker's words verbatim as spoken (colloquial kept); the figure as spoken — digits, words, a fraction or a range ('three hundred and something') — its unit and the thing counted; the precision qualifier if any (about, roughly, more than, exactly); the convention if he named one (with repetitions, by the Kufan count, Hijri); the origin he named, if any (in the Qur'an, the Prophet said, in al-Bukhari, a specific book); the holder he named, if any (the Hanafis hold, Ibn Hajar said, the Permanent Committee); the case he carried the figure to, if any (on your salary, every month); any claim of agreement or consensus (all the scholars, without dispute); and kind = number, with re-kinding allowed. Plus the checker's reading split into parts, each marked spoken or checker-added: the figure, the thing counted, the convention, the attribution to a source, the holder, the case, and the claim of agreement. A part the checker added from its own knowledge is never shown unless a source states it verbatim. Nothing of the checker's reading reaches the viewer; what reaches them is the speaker's words verbatim, the source's words verbatim with a link, the difference, and the rank; and every part appears with its source or with the line 'not found'.

## HOW WE SEARCH — How we search for a figure
1. The text first: the verse on quran.com, the narration on dorar with its grading.
2. A count on the text with a cleared tool (no hand count, and quran.com's verse search is not a count).
3. The scholars' works and the Kuwaiti encyclopaedia through Shamela with several phrasings, then a web citation whose quote is located.
4. Every figure found for the same thing is recorded with its source and level; never stop at the first hit.

## THE STEPS AND GATES, IN ORDER (a gate has yes/no targets; a target is a step id or an exit id)
1. [s1] STEP: Fix the figure on one internal line: the numeral, its unit, the thing counted, and the convention if he named one. Convert words, colloquial forms and fractions to a numeral (a quarter of a tenth = 2.5%; one dirham in every forty = 1/40); record a range as a range ('three hundred and ten-odd' = 310–319); take the last figure when the speaker corrects himself; record the precision he gave (exactly / about / roughly / more than / less than). Never change what is being counted, and never convert units yourself: dinar to gram, burud to kilometres, or a Hijri year to a Gregorian one is a new figure that needs its own source. (note: Default precision rule: 'about' matches when the source's figure, rounded to the speaker's last spoken digit, equals his; 'more than / less than' matches when the source's figure lies on that side; a range matches when the source's figure falls inside it; an exact figure must equal the source's after normalising the expression (words, numerals and fractions are one expression; units and calendars are not).) → next: g1
2. [g1] GATE: Is it a checkable figure — a count, amount, date, age, rate or distance about something the sources could hold — that the speaker states as a fact he himself asserts? Excluded: a personal guess ('most young people'), his own arithmetic ('that makes 109,500 prayers'), a manner of speech ('I told you seventy times'), and a figure he quotes in order to deny it or warn against it ('they say a hundred rak'as… and that is a fabricated hadith'). (note: When the arithmetic rests on a base figure he also asserted ('zakat is 2.5%, so on 100,000 you pay 2,500'), the base is a claim checked on its own; only the result is not a claim. 'Seventy' for 'many' in the speaker's own speech is a manner of speech; inside a text it is the text, and the commentators decide (see the level-1 rulebook entry).) → yes: g2 · no: x_not_a_claim
3. [g2] GATE: Is the figure a worldly statistic — the world's Muslim population, a survey percentage, the result of a scientific or medical study, a present-day count only statistics could hold — that none of the religious cleared sources could carry? → yes: x_outside_scope · no: g3
4. [g3] GATE: Is the speaker reciting the text in its own wording — reading the verse word for word, or relating the narration in its wording — so that the figure is one word of a recited text? (A speaker who gives the meaning in his own words and attributes it — 'Our Lord says in the Qur'an that seventy thousand enter Paradise' — is making his own claim, and the attribution is one part of it, checked in this flow.) (note: The boundary is recitation, not attribution: an attribution alone never moves the claim to another flow, or the 'attributed to a source it is not in' exit could never be reached.) → yes: x_rekind · no: s2
5. [s2] STEP: Search for the figure for this thing in every one of these layers, never stopping at the first hit; record every hit: (a) the Qur'an text on quran.com; (b) dorar.net hadith search, with the grading and the grader (the scholar who graded the narration) and every other grading dorar shows from another grader; (c) a count on the text or on the collection itself: the number of surahs, the number of verses by a named counting school (the schools of counting = the Madinan, Makkan, Basran, Kufan and Damascene ways of counting the Qur'an's verses), a collection's hadith count as its introduction or its commentator gives it (Ibn Hajar's Hady al-Sari, the introduction to Fath al-Bari, for Sahih al-Bukhari; al-Nawawi's introduction to Sharh Sahih Muslim); (d) the fiqh cleared works (the Kuwaiti Fiqh Encyclopaedia, al-Mughni, al-Majmu'), dorar's fiqh encyclopaedia, and the decisions of the fiqh academies, standing committees and cleared fatwa bodies, for fiqh amounts and their modern conversions, dated; (e) the sirah and history cleared works (Ibn Hisham's Sira, Tarikh al-Tabari) for dates, ages and troop counts; (f) the tafsir cleared works (al-Tabari, al-Baghawi) for reports. Record for each hit: the source's words verbatim, its link (verse key; dorar permalink; the usul.ai page pinned to its printing, found by an exact 6–8 word quote and cross-checked on Shamela), the figure exactly as the source states it, the thing counted, the convention the source names, whom the source attributes the figure to (school / scholar / body), the grading and grader when it is a narration, and the date when it is a body's decision. If the speaker named an origin, check it first and record whether the figure is there. (The Qur'an is a closed text we hold in full, so 'not in it' can be said; for a book or a hadith collection say 'not found in it' unless the work itself was checked.) — by the search ladder in "How we search". (note: Shamela silently returns empty under load: retry, and never conclude absence from one empty answer. Web page numbers are not trusted (14 of 20 differed); the quote finds the page. The model names the chapter; the text supplies the page. A fabricated narration is a hit recorded for the moderator, never counted as a 'recorded figure'.) → next: g4
6. [g4] GATE: Did any cleared source count the very thing the speaker counted — under any convention, with any figure? → yes: s3 · no: g5
7. [g5] GATE: Did the speaker carry a figure we found for another thing, or for a general case, to his own case — a general amount applied to a particular case ('a quarter of a tenth' applied to a monthly salary), or the count of one thing given as the count of another? (note: Never show a source found for a different thing as this figure's source; that is the topic switch of claim 15.) → yes: x_case_not_stated · no: x_not_found
8. [s3] STEP: Gather every figure the cleared sources record for this thing — another narration with another number, another counting school, the range the sirah works carry, another school's estimate, another body's conversion — each with its words verbatim, its link and its convention, its grading and grader when it is a narration, whose it is when it is a position, and its date when it is a body's decision. A narration the named grader rules fabricated or baseless is not listed among the 'recorded figures'; it is flagged internally for the moderator only. Place every figure on the rank scale (text; count; the scholars' works; weak narration or report). — by the search ladder in "How we search". → next: g6
9. [g6] GATE: Is the speaker's figure among the recorded figures — after normalising the expression — or within the precision or range he gave, under the same convention? (note: A convention the source names (with or without repetitions; the Kufan or the Madinan count; lunar or solar years; with or without the Prophet himself) is accepted even when the speaker named none; but when the speaker named a convention that contradicts the source's convention for that figure, it is not a match.) → yes: g9 · no: g7
10. [g7] GATE: Is the only carrier of the speaker's figure a narration the named grader rules fabricated (falsely attributed to the Prophet) or baseless? → yes: x_fabricated · no: g8
11. [g8] GATE: Is there, among the recorded figures, one from a source at levels 1 to 3 — a text, a count, or the scholars' works? (note: A weak narration, an Israiliyyat report or a report no other work follows corrects no one; when the recorded figures are only of that kind, the speaker's figure is 'not found', and those reports are listed in the panel as reports carrying other figures, with their grade.) → yes: x_corrected · no: x_not_found
12. [g9] GATE: Did the speaker name an origin ('in the Qur'an', 'the Prophet said', 'in al-Bukhari', a specific book) that does not carry his figure — it does not speak of the thing at all, or gives another figure for it — while another cleared source carries his figure? (note: A slip between two sources of the same level for the same thing (he said 'Muslim' and it is in both al-Bukhari and Muslim; a verse number) is corrected silently: the speaker's words stay verbatim and the source card shows the real source (see open questions). A move across levels or kinds (Qur'an ↔ hadith; sahih ↔ weak; text ↔ a scholar's saying) is shown, never silently replaced. When more than one exit applies to one claim (attributed to a source it is not in AND told 'by agreement'), the exit is the one at the highest matching gate in this order, and the panel shows every part with its source.) → yes: x_misattributed · no: g10
13. [g10] GATE: Did the speaker attribute the figure to a holder — a school, a scholar or a body ('the Hanafis hold', 'Malik said', 'the Permanent Committee') — while the source attributes that figure to someone else, or attributes a different figure to the holder he named? (note: This is the reversed attribution of decision 3: shown beside the speaker's words with the corrected marker, never replaced.) → yes: x_wrong_holder · no: g11
14. [g11] GATE: Do the sources record more than one figure for this thing, and did the speaker present his as the only or the agreed one ('all the scholars', 'without dispute', 'by agreement', 'the correct number')? → yes: x_one_as_only · no: s4
15. [s4] STEP: Of the recorded figures that match the speaker's, take the strongest on the rank scale (text → count → the scholars' works → weak narration or report); the gates below ask about that one; the other figures go to the 'Also recorded' section. (note: When graders differ on one narration (one grades it sahih, another weak), show both graders' rulings with their names, rank on the ruling of the grader that comes first in the dorar order we adopted (al-Albani, Shu'ayb al-Arna'ut, Ibn Hajar, al-Dhahabi), and never hide the other ruling (see open questions).) → next: g12
16. [g12] GATE: Is the source a verse, or a narration the named grader calls accepted — sahih or hasan, in whatever wording the grader uses ('sahih', 'hasan', 'hasan sahih', 'sahih li-ghayrihi', 'its chain is sahih') — with al-Bukhari and Muslim sahih by definition? → yes: x_in_text · no: g13
17. [g13] GATE: Is the source a count on the text (surahs, verses by a named counting school, words) or the collection's own count of its hadith as its introduction or commentator gives it? → yes: x_counted · no: g14
18. [g14] GATE: Is the source a narration the named grader rules weak, or a report the work itself marks as Israiliyyat (accounts carried from the Children of Israel in the tafsir works), or a report the work carries from a single reporter without support and without adopting it? (note: The line between level 3 (a report the sirah and history works adopt) and level 4 (a lone report no work follows) needs a rule the shaykh fixes; see open questions. Provisional default: level 3 when the work gives it as its own account of the event, or two of the cleared works carry it; level 4 when one work carries it from one reporter, or marks it as Israiliyyat.) → yes: x_weak_report · no: x_scholars_figure

## THE EXITS (id · state · level · publishable · name). Templates use {placeholders}; fill them from what you found.

### x_in_text — state matches · level 1 · publishable — In the text: the figure is in a verse or in a sahih/hasan narration / في النصّ: الرقم في آية أو في حديث صحيح أو حسن
- said slot: “{quote}” · {time}
- source slot: Verse: “{verse_text}” — {surah_name} {verse_key} · quran.com ↗ | Narration: “{hadith_text}” — {collection} {number} · {grading} · {grader} · dorar.net ↗ (Bukhari/Muslim: “sahih”, no grader named)
- difference slot (EN): As the text has it[; also recorded: {other_figures}]
- difference slot (AR): كما ورد في النصّ[؛ وورد أيضًا: {other_figures}]

### x_counted — state matches · level 2 · publishable — A count on the text: a tally anyone can redo on the mushaf or the collection / عدٌّ على النصّ: عدد يُعاد عدُّه على المصحف أو على الكتاب
- said slot: “{quote}” · {time}
- source slot: {count_as_stated} by {convention} — “{source_words}” — {work} {vol}/{page} ({edition}) · usul.ai ↗ | for surah/verse totals: {count_as_stated} by the mushaf's numbering ({convention}) · quran.com ↗
- difference slot (EN): The count follows {convention}[; other countings: {other_counts}]
- difference slot (AR): العدد على {convention}[؛ وعلى غيره: {other_counts}]

### x_scholars_figure — state matches · level 3 · publishable — In the scholars' works: a school's or a body's estimate, or a report the sirah and history works carry / في كتب أهل العلم: تقدير مذهب أو هيئة، أو خبر تنقله كتب السيرة والتاريخ
- said slot: “{quote}” · {time}
- source slot: “{source_words}” — {work} {vol}/{page} ({edition}) · usul.ai ↗ | “{decision_words}” — {body}, {decision_ref}, {date} · {site} ↗
- difference slot (EN): The reckoning of {whose}[; the works also record: {other_figures}] | A report in {work}[; the works also carry: {other_figures}]
- difference slot (AR): تقدير {whose}[؛ وتذكر المصادر أيضًا: {other_figures}] | خبر في {work}[؛ وتنقل الكتب أيضًا: {other_figures}]

### x_one_as_only — state overstated · level 4 · publishable — One of several recorded figures, told as the only or the agreed one (the part not found sets the pill; the panel gives the figure's own level) / رقمٌ من عدّة أرقام منقولة، قيل على أنه الوحيد أو المتفق عليه (الجزء الذي لم نجده يحدّد الشارة؛ واللوحة تعطي رتبة الرقم نفسه)
- said slot: “{quote}” · {time}
- source slot: “{source_words}” — {source_ref} ↗; also: “{other_source_words}” — {other_ref} ↗
- difference slot (EN): As the text has it | The reckoning of {whose} | A report in {work}; the works also record: {other_figures}; his words “{agreement_words}” are not found in the cleared sources
- difference slot (AR): كما ورد في النصّ | تقدير {whose} | خبر في {work}؛ وتذكر المصادر أيضًا: {other_figures}؛ وقولُه «{agreement_words}» لم نجده في المصادر التي بين أيدينا

### x_weak_report — state matches · level 5 · publishable — A figure from a weak narration, a lone report, or the Israiliyyat / رقمٌ في رواية ضعيفة أو خبرٍ لا يُتابَع أو من الإسرائيليات
- said slot: “{quote}” · {time}
- source slot: “{report_text}” — {collection} {ref} · weak (da'if) · {grader} · dorar.net ↗ | “{report_text}” — {work} {vol}/{page} ({edition}) · from the Israiliyyat / a single report · usul.ai ↗
- difference slot (EN): In a weak narration · {grader} | A report in {work}, from the Israiliyyat | A single report in {work}[; in a sahih narration: {other_figures}]
- difference slot (AR): في رواية ضعيفة · {grader} | خبر في {work} من الإسرائيليات | خبر واحد في {work}[؛ وفي حديث صحيح: {other_figures}]

### x_corrected — state corrected · level 2 · publishable — The source gives a different figure: shown corrected beside the speaker's words (rank = the correcting source's level; only a level 1–3 source corrects) / المصدر يذكر رقمًا آخر: يُعرض التصحيح بجوار كلام المتحدّث (الرتبة = رتبة المصدر المصحِّح، ولا يصحّح إلا مصدر من الرتب الأولى إلى الثالثة)
- said slot: “{quote}” · {time}
- source slot: “{source_words}” — {source_ref}[ · {grading} · {grader}] ↗
- difference slot (EN): Said {said_figure}[ by {said_convention}]; the source gives {source_figure}[ by {convention}][; the works also record: {other_figures}][; not in {named_source} | not found in {named_source}]
- difference slot (AR): قال {said_figure}[ على {said_convention}]؛ والمصدر يذكر {source_figure}[ على {convention}][؛ وتذكر المصادر أيضًا: {other_figures}][؛ وليس في {named_source} | ولم نجده في {named_source}]

### x_misattributed — state corrected · level 1 · publishable — The figure exists, but not in the source the speaker named (rank = the real source's level) / الرقم موجود، لكن ليس في المصدر الذي سمّاه المتحدّث (الرتبة = رتبة المصدر الحقيقي)
- said slot: “{quote}” · {time}
- source slot: “{source_words}” — {actual_source_ref}[ · {grading} · {grader}] ↗
- difference slot (EN): Not in {named_source} (for the Qur'an only) | Not found in {named_source}[ (which gives for this thing: {named_source_figure})]; it is in {actual_source}[ · {grading} · {grader}]
- difference slot (AR): ليس في {named_source} (للقرآن وحده) | لم نجده في {named_source}[ (وفيه لهذا المعدود: {named_source_figure})]؛ وهو في {actual_source}[ · {grading} · {grader}]

### x_wrong_holder — state corrected · level 3 · publishable — The figure exists, but the source attributes it to a different holder than the speaker named (reversed attribution; rank = the source's level) / الرقم موجود، لكن المصدر ينسبه إلى غير من نسبه إليه المتحدّث (قلب النسبة؛ الرتبة = رتبة المصدر)
- said slot: “{quote}” · {time}
- source slot: “{source_words}” — {work} {vol}/{page} ({edition}) · usul.ai ↗ | “{decision_words}” — {body}, {decision_ref}, {date} · {site} ↗
- difference slot (EN): He attributed it to {named_holder}; {work} attributes {said_figure} to {actual_holder}[, and to {named_holder}: {holder_figure}]
- difference slot (AR): نسبه إلى {named_holder}؛ و{work} ينسب {said_figure} إلى {actual_holder}[، وينسب إلى {named_holder}: {holder_figure}]

### x_case_not_stated — state not_found · level 0 · publishable — The source gives the figure for its own case, not for the case the speaker stated / المصدر يثبت الرقم لأصله، لا للحالة التي قالها المتحدّث
- said slot: “{quote}” · {time}
- source slot: “{source_words}” — {source_ref} ↗ (for {source_case})
- difference slot (EN): The source gives {source_figure} for {source_case}; {said_case} is not found in the cleared sources
- difference slot (AR): المصدر يذكر {source_figure} لـ{source_case}؛ ولم نجد {said_case} في المصادر التي بين أيدينا

### x_not_found — state not_found · level 0 · publishable — Not found: no cleared source gives a figure for this thing (or only a weak report gives another figure) / لم نجده: لا مصدر معتمد يذكر رقمًا لهذا المعدود (أو لا يذكره إلا خبرٌ ضعيف برقم آخر)
- said slot: “{quote}” · {time}
- source slot: — (no source; searched: {sources_searched})
- difference slot (EN): [Not in {named_source}; | Not found in {named_source}; ]not found in the cleared sources[; the tafsir or sirah works carry reports with other figures: {weak_figures} · {grade_or_label}]
- difference slot (AR): [ليس في {named_source}؛ | لم نجده في {named_source}؛ ]لم نجده في المصادر التي بين أيدينا[؛ وتنقل كتب التفسير أو السيرة أخبارًا بأرقام أخرى: {weak_figures} · {grade_or_label}]

### x_fabricated — state matches · level 6 · publishable — The figure's origin is a fabricated narration: shown corrected with the grader's word / أصل الرقم رواية موضوعة: يُعرض مُصحَّحًا بكلمة المحدّث
- said slot: “{quote}” · {time} (moderator only)
- source slot: “{report_text}” — {collection} {ref} · fabricated (mawdu') · {grader} · dorar.net ↗ (moderator only)
- difference slot (EN): (internal) A fabricated narration · {grader}; the row is not published; harm is rated on the harm ladder and the video decision goes to the moderator
- difference slot (AR): (داخلي) رواية موضوعة · {grader}؛ لا يُنشر الصف؛ يُقدَّر الضرر على سلّم الضرر ويُعرض قرار الفيديو للمشرف
- owner's decision: Owner, 30 Sep: one rule for every kind, as on the hadith tab — shown in the corrected colour with the grader's word and link, never hidden.

### x_outside_scope — state not_checked · level 0 · publishable — A worldly statistic: shown as "not checked" / رقم دنيوي: يُعرض بعلامة «لا نفحصه»
- said slot: “{quote}” · {time} (moderator only)
- source slot: —
- difference slot (EN): (internal) A worldly statistic the religious sources do not carry; nothing shown (default; see open questions)
- difference slot (AR): (داخلي) إحصاء دنيوي لا تحمله المصادر الشرعية؛ لا يُعرض شيء (افتراضيًا؛ انظر الأسئلة المفتوحة)
- owner's decision: Owner, 30 Sep: the speaker's words are shown with the "not checked" marker and one fixed panel line, "a worldly figure, outside what we check"; never dropped, never called "not found".

### x_not_a_claim — state not_a_claim · level 0 · NOT published — Not a claim: a personal guess, arithmetic, a manner of speech, or a figure quoted to deny it / ليس دعوى: تقدير شخصي أو حساب أو أسلوب كلام أو رقم نُقل للإنكار
- said slot: “{quote}” · {time} (moderator only)
- source slot: —
- difference slot (EN): (internal) Not a checkable claim; nothing shown
- difference slot (AR): (داخلي) ليس دعوى قابلة للتحقق؛ لا يُعرض شيء

### x_rekind — state rekinded · level 0 · NOT published — Re-kinded: a recited text handed to the Qur'an or hadith flow, or a question handed to the ruling or fatwa flow / أُعيد تصنيفه: نصٌّ مُتلوّ يُحال إلى مسار القرآن أو الحديث، أو مسألةٌ يُحال بها إلى مسار الحكم أو الفتوى
- said slot: “{quote}” · {time}
- source slot: — (the receiving flow decides)
- difference slot (EN): (internal) Re-kinded to {new_kind}; the figure is one word of the text and is checked with it, or the question is a fatwa or ruling and the figure is its amount
- difference slot (AR): (داخلي) أُعيد تصنيفه إلى {new_kind}؛ الرقم كلمة من النصّ ويُفحص معه، أو المسألة فتوى أو حكم والرقم مقدارها
