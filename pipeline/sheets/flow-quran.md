# FLOW: The checking flow for Qur'an citations / مسار التحقق من آيات القرآن

## INTAKE
The extractor hands over: the speaker's words verbatim as spoken (the raw machine transcript, flagged if doubtful), start and end seconds, the language (Arabic or other), how he presented the words (said 'verse', 'surah', 'in the Qur'an', 'Allah says', recited with no attribution, or attributed them to a hadith or a person), any spoken reference (surah name, verse number, a description like 'the verse of debt'), any hedge ('or as he said', 'something like'), and whatever he added beyond the text (a meaning, an occasion of revelation, a ruling, a virtue). Rule: this flow checks the verse's TEXT and REFERENCE only; recitation, pronunciation and vowels are never checked. Rank 0 means: never shown to viewers under this kind (held, handed to another kind, or not a claim).

## THE STEPS AND GATES, IN ORDER (a gate has yes/no targets; a target is a step id or an exit id)
1. [s1] STEP: Unify the spoken words' spelling for matching: strip vocalisation, unify hamza/alif/ta marbuta/ya, collapse stutters and fillers inside the recitation. Keep the raw text untouched for display. → next: g1
2. [g1] GATE: Are there words to compare, or a verse or surah referred to by name, number or description? → yes: g_formula · no: x_not_a_claim
3. [g_formula] GATE: Is it a short phrase woven into the speech with no attribution and no recitation framing (what scholars call iqtibas: weaving a word or two of the Qur'an into one's speech), or an everyday formula or du'a (bismillah, 'to Allah we belong and to Him we return')? (note: Internal rule: under four words with no attribution and no 'Allah says' = not a claim; a moderator may reverse it.) → yes: x_not_a_claim · no: s2
4. [s2] STEP: Split off everything beyond the text: a meaning given to the verse, an occasion of revelation, a ruling drawn, a virtue of the surah. Each becomes its own part in its own kind (saying, ruling, history, hadith). Only the text and its reference stay here. (note: Framework rule: separate scripture from explanation.) → next: g2
5. [g2] GATE: Did the speaker say the verse's words (recited or quoted them, in any language), not merely refer to it? → yes: g_lang · no: s_ref
6. [s_ref] STEP: Identify what was referred to (a verse, a run of verses, or a surah) from the name, number or description on quran.com, accepting a surah's established alternative names (Bani Isra'il for al-Isra', al-Mu'min for Ghafir, al-Dahr for al-Insan, Bara'a for al-Tawba). → next: g_ref
7. [g_ref] GATE: Is the intended verse, range or surah identified without doubt? → yes: x_reference_only · no: x_hold_moderator
8. [g_lang] GATE: Are the spoken words in Arabic? → yes: s3 · no: s_tr
9. [s_tr] STEP: Search the words in the adopted translations' index for that language (English: the Hilali-Khan translation the app shows, plus any the owner adopts later), then confirm on the Arabic verse. If the language has no adopted translation, hold for a moderator who reads it. → next: g_tr
10. [g_tr] GATE: Do the words match an adopted translation's wording (trivial differences aside, like 'Allah'/'God')? → yes: g_pres_tr · no: s5
11. [g_pres_tr] GATE: Did the speaker attribute these words to a hadith or to someone's saying, not to the Qur'an? → yes: x_said_as_hadith · no: x_translation
12. [s3] STEP: Search the unified words in the mushaf text (quran.com / quranpedia). A match is a whole verse, a run of verses, or a portion of three or more consecutive words. → next: g3
13. [g3] GATE: Do the words match the mushaf text word for word, whole or a portion? → yes: g_multi · no: g_asr
14. [g_multi] GATE: Did the speaker stitch two or more non-adjacent passages (verses from two surahs, or ends of distant verses) into one quotation? → yes: s_split · no: g_pres
15. [s_split] STEP: Make each passage its own part with its own source (decision 5: one part per place) and continue from the next gate for each. → next: g_pres
16. [g_pres] GATE: Did the speaker attribute these words to a hadith or to someone's saying, not to the Qur'an? → yes: x_said_as_hadith · no: g_cut
17. [g_cut] GATE: Did the speaker stop where the cut portion carries a sense the rest of the verse denies? (Scholars of pausing call this the 'ugly stop': one that corrupts the meaning.) Test: the mushaf's printed pause marks and the waqf books' examples first, then the full sentence's meaning in Tafsir al-Tabari or al-Baghawi. (note: The mushaf's «لا» mark alone is not enough; quoting a portion of a verse is fine unless the meaning inverts.) → yes: x_cut_meaning · no: g_refmatch
18. [g_refmatch] GATE: If he named a surah or number, does it match the verse found? (Yes if he named none; a surah's established alternative name counts as a match.) (note: A number off by one may follow another verse count (the Kufan count is used in Hafs mushafs; others exist) or a translation's numbering; say so in the difference line.) → yes: x_exact · no: x_exact_ref_fixed
19. [g_asr] GATE: Could the mismatch be the transcript's rather than the speaker's (a homophone, a dropped letter, a vocalisation)? → yes: s_listen · no: s4
20. [s_listen] STEP: The moderator (or the checker on the audio segment) listens at the timestamp and writes the words as heard. → next: g_listen
21. [g_listen] GATE: Do the words as heard match the mushaf word for word? → yes: g_multi · no: g_clear
22. [g_clear] GATE: Were the words heard clearly? → yes: s4 · no: x_hold_moderator
23. [s4] STEP: Compare the words with the ten canonical readings (ten transmitted ways of reciting; all are Qur'an). Candidates: nquran.com, the King Fahd Complex mushafs in Warsh, Qalun, al-Duri and Shu'ba, Ibn al-Jazari's al-Nashr. → next: g4
24. [g4] GATE: Do the words match one of the ten readings? → yes: x_qiraa · no: s5
25. [s5] STEP: Find the nearest verse (same subject, most shared words; for a translation, the nearest verse in the adopted translation) and lay the two texts side by side. → next: g5
26. [g5] GATE: Is the intended verse identified beyond doubt? → yes: g6 · no: s_cand
27. [s_cand] STEP: Search by topic for candidate verses (up to three) on quran.com or quranpedia and in the indexes of Tafsir al-Tabari and al-Baghawi. → next: g_cand
28. [g_cand] GATE: Does one or more candidate verse carry the spoken sense as Tafsir al-Tabari or al-Baghawi state it? → yes: x_by_meaning · no: s6
29. [g6] GATE: Do the spoken words keep the verse's meaning as Tafsir al-Tabari or al-Baghawi state it (a paraphrase, a synonym, an added or dropped word that leaves the sense, or a faithful translation not in the adopted wording)? (note: A non-canonical reading presented as the mushaf goes to the corrected exit; attributed to its companion ('Ibn Mas'ud's reading') it is a report, split at s2.) → yes: x_by_meaning · no: g6b
30. [g6b] GATE: Is the difference in the verse's own wording (most words shared; a word or letter changed, added or dropped), rather than a free rendering carrying a sense the tafsirs do not give? → yes: x_misworded · no: x_meaning_not_found
31. [s6] STEP: Search the words as a hadith on dorar.net and as a saying, proverb or line of poetry on shamela.ws. → next: g7
32. [g7] GATE: Do they match a hadith? → yes: g8 · no: g9
33. [g8] GATE: Did he explicitly call them a verse or Qur'an? ('Allah says' alone may introduce a hadith qudsi: a hadith whose meaning is from Allah and wording from the Prophet.) → yes: x_is_hadith · no: x_rekind_silent
34. [g9] GATE: Do they match a known saying, proverb or line of poetry? → yes: x_not_in_quran_known · no: x_invented

## THE EXITS (id · state · level · publishable · name). Templates use {placeholders}; fill them from what you found.

### x_exact — state matches · level 1 · publishable — Matches the mushaf / مطابق للمصحف
- said slot: «{said_text}»
- source slot: «{verse_text}» — {surah_name} {verse_key} · {translation_name}: “{translation_text}” · quran.com ↗
- difference slot (EN): Matches the mushaf text.
- difference slot (AR): مطابق لنص المصحف.

### x_exact_ref_fixed — state matches · level 1 · publishable — Matches the mushaf; the reference differs / مطابق للمصحف، والإحالة مختلفة
- said slot: «{said_text}»
- source slot: «{verse_text}» — {surah_name} {verse_key} · {translation_name} · quran.com ↗
- difference slot (EN): The text matches; the speaker named {said_ref}, and the verse is in {surah_name} {verse_key}.
- difference slot (AR): النص مطابق؛ سمّى المتحدث {said_ref}، والآية في {surah_name} {verse_key}.

### x_qiraa — state matches · level 1 · publishable — In one of the ten readings / على قراءة من العشر
- said slot: «{said_text}»
- source slot: «{verse_text}» — {surah_name} {verse_key} (Hafs) · quran.com ↗ · the reading of {reader_name}: «{reading_text}» · {reading_source} ↗
- difference slot (EN): Matches the reading of {reader_name}, one of the ten canonical readings; the displayed text is Hafs.
- difference slot (AR): مطابق لقراءة {reader_name}، وهي من القراءات العشر المتواترة؛ النص المعروض برواية حفص.

### x_translation — state by_meaning · level 2 · publishable — In an adopted translation / بترجمة معتمدة
- said slot: «{said_text}»
- source slot: «{verse_text}» — {surah_name} {verse_key} · {translation_name}: “{translation_text}” · quran.com ↗
- difference slot (EN): The verse was given in the {translation_name} translation; the Arabic text as in the mushaf is above.
- difference slot (AR): نُقلت الآية بترجمة {translation_name}؛ النص العربي كما في المصحف أعلاه.

### x_reference_only — state by_meaning · level 1 · publishable — A verse or surah referred to, not recited / إشارة إلى آية أو سورة دون تلاوة
- said slot: «{said_text}»
- source slot: {ref_text} — {surah_name} {verse_key_or_range} · {translation_name} · quran.com ↗
- difference slot (EN): The place was referred to; its words were not recited. The text is above.
- difference slot (AR): أشار إلى الموضع ولم يتلُ نصه؛ النص أعلاه.

### x_by_meaning — state by_meaning · level 2 · publishable — By meaning / بالمعنى
- said slot: «{said_text}»
- source slot: «{verse_text}» — {surah_name} {verse_key} · {translation_name}: “{translation_text}” · quran.com ↗ {more_candidates}
- difference slot (EN): The verse's meaning was conveyed, not its wording; the text as in the mushaf is above.
- difference slot (AR): نُقل معنى الآية لا لفظها؛ النص كما في المصحف أعلاه.

### x_meaning_not_found — state not_found · level 1 · publishable — A meaning not found in the cleared tafsirs / معنى لم نجده في التفاسير
- said slot: «{said_text}»
- source slot: «{verse_text}» — {surah_name} {verse_key} · {translation_name} · quran.com ↗ · Tafsir al-Tabari ↗ · Tafsir al-Baghawi ↗
- difference slot (EN): This meaning was not found in the cleared tafsirs; the verse's text is above.
- difference slot (AR): هذا المعنى لم نجده في التفاسير المعتمدة؛ نص الآية أعلاه.

### x_misworded — state corrected · level 1 · publishable — Differs from the mushaf text / مغاير لنص المصحف
- said slot: «{said_text}»
- source slot: «{verse_text}» — {surah_name} {verse_key} · {translation_name}: “{translation_text}” · quran.com ↗
- difference slot (EN): Said: «{said_fragment}»; in the mushaf: «{verse_fragment}».
- difference slot (AR): قيل «{said_fragment}»، وفي المصحف: «{verse_fragment}».

### x_cut_meaning — state corrected · level 1 · publishable — Cut where the meaning inverts / مقتطع في موضع يقلب المعنى
- said slot: «{said_text}»
- source slot: «{full_verse_text}» — {surah_name} {verse_key} · {translation_name}: “{translation_text}” · quran.com ↗
- difference slot (EN): The stop came before «{next_words}»; the full verse is above.
- difference slot (AR): وُقف قبل «{next_words}»؛ الآية كاملة أعلاه.

### x_said_as_hadith — state corrected · level 1 · publishable — A verse attributed to a hadith or a person / آية نُسبت إلى حديث أو إلى قائل
- said slot: «{said_text}»
- source slot: «{verse_text}» — {surah_name} {verse_key} · {translation_name} · quran.com ↗
- difference slot (EN): The words were attributed to {said_attribution}; they are a verse of the Qur'an in {surah_name} {verse_key}, and the text matches.
- difference slot (AR): نُسبت الكلمات إلى {said_attribution}؛ وهي آية من القرآن في {surah_name} {verse_key}، والنص مطابق.

### x_is_hadith — state corrected · level 3 · publishable — A hadith attributed to the Qur'an / حديث نُسب إلى القرآن
- said slot: «{said_text}»
- source slot: Not in the mushaf. The words are a hadith: {hadith_source} · dorar.net ↗
- difference slot (EN): Presented as a verse; the words are a hadith, whose grade is in its own hadith row under this video.
- difference slot (AR): قُدّمت آيةً وهي حديث؛ درجته في سطر الحديث الخاص به تحت هذا الفيديو.

### x_rekind_silent — state rekinded · level 0 · NOT published — 'Allah says' for a hadith qudsi — re-kinded to hadith / «قال الله» لحديث قدسي — يُحوَّل إلى نوع الحديث
- said slot: «{said_text}»
- source slot: (handed to the hadith flow under its kind, with the spoken attribution 'Allah says' for that flow to check)
- difference slot (EN): No difference shown here; 'Allah says' fits a hadith qudsi.
- difference slot (AR): لا فرق يُعرض هنا؛ «قال الله» تصحّ للحديث القدسي.

### x_not_in_quran_known — state corrected · level 3 · publishable — A known saying attributed to the Qur'an / قول مشهور نُسب إلى القرآن
- said slot: «{said_text}»
- source slot: Not in the mushaf. The words are {saying_kind}: {saying_source} · shamela.ws ↗
- difference slot (EN): Presented as a verse; not in the Qur'an.
- difference slot (AR): قُدّمت آيةً وليست في القرآن.

### x_invented — state corrected · level 3 · NOT published — Words with no origin presented as Qur'an / كلمات لا أصل لها قُدّمت قرآنًا
- said slot: «{said_text}»
- source slot: Not in the mushaf or any of the ten readings, and not found in the cleared sources.
- difference slot (EN): (moderator only) Not in the Qur'an. The harm ladder counts words presented as scripture as severe: the video goes out; the owner may keep it from the review page.
- difference slot (AR): (للمشرف فقط) ليست في القرآن. سلّم الضرر يعدّ كلامًا يُقدَّم قرآنًا ضررًا شديدًا: الفيديو يخرج، وللمالك أن يبقيه من صفحة المراجعة.

### x_hold_moderator — state pending · level 0 · NOT published — Held for a moderator / محجوز حتى ينظر المشرف
- said slot: «{said_text}» (unconfirmed transcript, an unresolved reference, or a language with no adopted translation)
- source slot: (unresolved)
- difference slot (EN): (not shown)
- difference slot (AR): (لا يُعرض)

### x_not_a_claim — state not_a_claim · level 0 · NOT published — Not a claim / ليس ادعاءً
- said slot: «{said_text}»
- source slot: (none)
- difference slot (EN): (not shown)
- difference slot (AR): (لا يُعرض)
