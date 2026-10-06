<p align="center"><img src="assets/minka-asalam-mark.png" width="112" alt="The Minka Asalam mark"></p>

# Minka Asalam · the Checker («منك السلام» · «التبيّن»)

*Knowledge the Heart Rests In*

[العربية أدناه](#arabic)

The Checker listens to a short Islamic clip or lesson and writes down every checkable thing the speaker said: a verse, a hadith, a ruling, a report, a number or a line of poetry. For each one it looks for where it comes from, in an agreed list of sources, and shows the source's own words beside the speaker's, with a link. It never gives a verdict on the clip or on its speaker. In the app, a person reviews every line before anything is published.

**How the AI is used.** Google Gemini listens to the clip once and writes each quote with its moment. Then scripts hold the steps, and Claude (Opus 5.5, Sonnet 5.5, Haiku 4.5) answers one small question at a time: where to look, which search result is the same text, whether a page says what the speaker said. Each answer is checked by the script or by a second model before it is used. Anything the tools did not print, such as a link, a grading or a page, is never shown.

This repository is Minka Asalam's entry in the Bāzil Foundation challenge "AI in Service of Islamic Content" (4–6 October 2026). The working app's link and the Checker's tester code are given to the judges in the submission. The project's site is https://minkasalam.com.

## What is here

| Folder | What it is | When |
|---|---|---|
| `pipeline/` | **The starting version:** the checker as it stood on 2 October 2026, copied unchanged | before the challenge |
| `runs/2026-10-05-library-clips/` | The first run of the challenge: the app's 27 library clips listened, placed on the knowledge map and checked; the two automatic checks; the review page; the owner's review decisions; and the records published from them | 5–6 Oct |
| `checker-worker/` | The Checker tab's worker and **Checker 3**, the redesign built on the days: the script holds the steps, a model answers one small question at a time. Its own README explains each step. | 5–6 Oct |
| `checker-worker/retest/` | The measurements: each part of Checker 3 run against the owner's review of the library clips | 6 Oct |
| `supabase/247_checker_tab.sql` | The database change behind the Checker tab: requests, private results, and the limits | 5 Oct |
| `SOURCES_TOOLS_LICENSES.md` | Every source, tool, model and library used, with its licence or terms | 6 Oct |
| `docs/sources-and-verification.pdf` | The sources and how they are verified (deliverable 5), Arabic first with an English twin | 6 Oct |
| `LICENSE.md` | All rights reserved; read and run for evaluation only | 4 Oct |

The tag `starting-version-2026-10-04` marks the first commit. **Every later commit is challenge-days work**, with its real date and time (Riyadh time). Each commit message says what it did and what was measured.

## What was built on 4–6 October

- **5 Oct, the library run** (`dae7321` … `fcc028c`). The starting-version checker ran on all 27 clips in the app's library: 25 had something to check, 70 quotes in 81 parts. Both automatic checks passed before review. The owner reviewed every quote and every map placement.
- **5 Oct, the poetry kind** (`adfe5c4`). A recited line of poetry is traced to the oldest record found on aldiwan.net.
- **5 Oct, the Checker tab's worker** (`546436f`, `68f4e1c`). A tester pastes a YouTube link or picks a file of up to 3 minutes, and gets counts and one row per quote, for themselves only. The worker runs on the owner's PC, because dorar.net answers a home line and refuses data-centre servers (measured 4 Oct: the PC 72 of 72, the cloud 0 of 8).
- **6 Oct, Checker 3** (`cc71907` … `8d57614`). Verses are compared with the Mushaf by script, with one small question when they differ. Then come the hadith tree, the rulings ladder, poetry, numbers, reports and the verse-meaning look. Each is measured against the owner's review, has a hard cost cap per check ($1.00), and has a test mode that spends nothing.
- **6 Oct, the published records** (`d83306d`). The owner's reviewed sources went live in the app: 65 claims on 24 clips, 76 parts.
- **6 Oct, the file route** (`6a85186`). A clip uploaded from the phone is checked the same way, rows arrive as they are found, and the person is notified when the check is done.

## How a check works

1. **The clip is checked first.** For a link: it exists, it is public, and it is at most 3 minutes. *Seconds, free.*
2. **Gate 1:** a very small model reads the title and descriptions. Only a clear "not Islamic content" is refused, and it is not counted. *Seconds, about 0.1¢.*
3. **The listen:** Gemini writes each quote with its moment, cut by source unit. The canonical verse text comes from quran.com. *About a minute, about 5¢.*
4. **Gate 2:** if there is nothing to look up, the check stops and is not counted. *Instant.*
5. **Checker 3**, one route per kind of quote: verses, hadith, rulings, poetry, numbers, reports. *Minutes; most of the cost, capped at $1.00 a check.*
6. **The two automatic checks:** no dorar link, grading or quote the dorar tool did not print, and every grading equal to its dorar page. A quote that fails becomes "pending", never shown with an invented source. *About a minute, free.*
7. **The counts and rows are written for that person only**, stamped with the engine and the rules version. *Instant.*

Limits, enforced in the database: 3 checks per person a day, 30 a day for the app, $100 in total for 4–22 October, signed-in accounts with a tester code, and children's profiles excluded.

## Results measured on the days

These are small samples, checked by one reviewer, against rules that are still provisional until a scholar clears them.

**The library run (5 Oct, the starting-version checker), `runs/2026-10-05-library-clips/`:**

| | |
|---|---|
| Quotes found | 70, in 81 parts, on 25 clips |
| Matched their source | 59 · corrected: 1 · not found in any cleared source: 4 · not a claim: 6 |
| Automatic check: dorar links | 28 links on 11 hadith quotes, no fault |
| Automatic check: gradings against their page | 22 of 24 word for word, 2 unclear (the page adds a note), 0 wrong |
| The owner's review | 65 accepted as written, 5 changed from his notes |
| Published in the app | 65 claims on 24 clips, 76 parts |

**Checker 3 (6 Oct)**, against the owner's review. Most samples ran in test mode, where saved model answers replace the API and the cost is estimated from the text's length:

| Route | Result | Cost |
|---|---|---|
| Verses that differ from the Mushaf | 8 of 8 as expected, no wrong verse linked | ≈ 0.3¢ a verse |
| Poetry | the one poem found, the same as the owner's review; no poem given to the other 13 | ≈ 0.1¢ in all |
| Numbers | 2 of 2 right (including a sound 33/33/34 the first version had wrongly corrected); a worldly figure "not checked" | ≈ 1.4¢ a figure |
| Reports | 23 quotes in three sets: no wrong source, no false correction; 9 approved pages found, 2 missed | ≈ 2.4–3.5¢ a quote |
| Rulings (sample of 4) | 3 sourced within a few pages of the approved page or in another verified book; 1 too strict; no wrong source | 15.5¢ a ruling |
| A real end-to-end check, one library clip | real models, the paid key | $0.13, 2.9 minutes |
| The file route, one test upload | 4 quotes, 4 sourced | 16¢, 1.3 minutes |

## Run it yourself

You need Node.js 22 or later (tested on 24), npm, curl, and your own keys: Anthropic, Gemini and the YouTube Data API. The worker mode also needs a Supabase project with `supabase/247_checker_tab.sql` applied.

```
cd checker-worker
npm ci
copy .env.example .env        (fill in the keys; never commit .env)
node src/check-one.mjs <youtube link> --engine=checker3      (one check, no database)
npm start                                                     (the worker, polling the database)
```

Test mode, which spends no API credit: set `CHECKER_REPLAY=<folder>`. Each question is written to a file, a helper answers it, and the run is started again.

**What runs only on the owner's PC, said plainly:**

- **dorar.net refuses data-centre servers.** The hadith steps work from a home internet line.
- **Two inputs are not in this repository.** The listening script (`tag-with-gemini.ts`) is part of the app's private code; the copy used for the library run is in `runs/2026-10-05-library-clips/listening/`. The verified books are other publishers' texts, downloaded from usul.ai to the PC. The worker reads both from the owner's folders, and the README in `checker-worker/` names them.
- The scripts in `checker-worker/retest/` read the owner's documents folders. They are the record of how each measurement was made.

## Reliability and safety

- **Abstain rather than invent.** No page from memory, only links a search printed. "Pending" is shown when a source does not answer, and "not found" when none was found.
- **Never a correction from one page.** A page with another detail sends the checker back for the speaker's own version.
- **A person decides.** In the app, nothing reaches a reader unreviewed, and the review decisions are kept apart from the checker's raw output (see `runs/…/review/`).
- **Colour the evidence, never the person.** A result describes the source found, not the speaker. Each quote's internal moderation mark is left out of the published run files.
- **A clip's words are untrusted.** The checking helper has no shell. It can only read its own folder, run the checker's own tools and fetch from the trusted source sites.

## What is not in this repository, and why

The rest of the app (the knowledge map, accounts, feeds, the clip pages) is private ahead of its store release. It is shown working through the link given in the submission. The clips' sound and stream addresses belong to their creators and are not here.

## Licence and name

All rights reserved; you may read and run this code for evaluation only (`LICENSE.md`). The name Minka Asalam, the name «التبيّن», and the mark are the team's own work. Sources, tools and libraries made by others keep their own licences and terms (`SOURCES_TOOLS_LICENSES.md`).

---

<a id="arabic"></a>

<div dir="rtl">

# «منك السلام» · «التبيّن»

*علمٌ تطمئنُّ به القلوب*

تستمع أداة «التبيّن» إلى المقطع أو الدرس الإسلامي القصير، فتكتب كلَّ ما يمكن التحقق منه مما قاله المتكلم: آيةً أو حديثًا أو حكمًا أو خبرًا أو رقمًا أو بيتَ شعر. ثم تبحث عن موضع كلٍّ منها في قائمةٍ متفقٍ عليها من المصادر، وتضع نصَّ المصدر نفسه بجوار كلام المتكلم مع رابطه. ولا تحكم على المقطع ولا على صاحبه. وفي التطبيق يراجع إنسانٌ كلَّ سطرٍ قبل نشر أي شيء.

**كيف يُستعمل الذكاء الاصطناعي:** يستمع «جيميناي» من «جوجل» إلى المقطع مرةً واحدة، ويكتب كلَّ استشهادٍ بلحظته. ثم يتولى السكربتُ الخطوات، ويجيب «كلود» (Opus 5.5 وSonnet 5.5 وHaiku 4.5) عن سؤالٍ صغيرٍ واحد في كل مرة: أين يُبحث؟ وأيُّ نتائج البحث هو النصُّ نفسه؟ وهل تقول الصفحةُ ما قاله المتكلم؟ ويُتحقَّق من كل جوابٍ بالسكربت أو بنموذجٍ ثانٍ قبل استعماله. وما لم تطبعه الأدوات، من رابطٍ أو حكمٍ على حديثٍ أو صفحة، لا يُعرض أبدًا.

هذا المستودع مشاركة «منك السلام» في تحدي مؤسسة «بازل» «الذكاء الاصطناعي في خدمة المحتوى الإسلامي» (4–6 أكتوبر 2026). ورابط التطبيق العامل ورمز المختبِر لتبويب «التبيّن» مرفقان للمحكّمين في التسليم، وموقع المشروع https://minkasalam.com.

## ما في المستودع

- `pipeline/`: **النسخة الابتدائية**، أي أداة التحقق كما كانت يوم 2 أكتوبر 2026، منقولةً دون تغيير.
- `runs/2026-10-05-library-clips/`: أول تشغيلٍ في أيام التحدي على مقاطع مكتبة التطبيق السبعة والعشرين: الاستماع، ووضعها على خريطة العلوم، والتحقق، والفحصان الآليان، وصفحة المراجعة، وقرارات صاحب المشروع، والسجلات المنشورة منها.
- `checker-worker/`: عامل تبويب «التبيّن»، و**التبيّن 3**، وهو إعادة التصميم المبنية في أيام التحدي: السكربت يتولى الخطوات، والنموذج يجيب عن سؤالٍ صغيرٍ واحد في كل مرة. وفي المجلد دليلٌ يشرح كل خطوة.
- `checker-worker/retest/`: القياسات، أي كل جزءٍ من «التبيّن 3» مقيسًا على مراجعة صاحب المشروع لمقاطع المكتبة.
- `supabase/247_checker_tab.sql`: تعديل قاعدة البيانات الذي يقوم عليه تبويب «التبيّن»: الطلبات، والنتائج الخاصة، والحدود.
- `SOURCES_TOOLS_LICENSES.md`: كل مصدرٍ وأداةٍ ونموذجٍ ومكتبةٍ استُعملت، مع ترخيصها أو شروطها.
- `docs/sources-and-verification.pdf`: المصادر وكيفية التحقق منها (التسليم الخامس)، بالعربية ثم بالإنجليزية.

يدلّ الوسم `starting-version-2026-10-04` على الإيداع الأول. **وكل إيداعٍ بعده هو عمل أيام التحدي**، بتاريخه ووقته الحقيقيين بتوقيت الرياض، وتذكر رسالة كل إيداعٍ ما صُنع فيه وما قيس.

## ما بُني في 4–6 أكتوبر

- **5 أكتوبر، تشغيل المكتبة:** شُغّلت أداة النسخة الابتدائية على مقاطع المكتبة السبعة والعشرين. كان في 25 منها ما يُتحقق منه: 70 استشهادًا في 81 جزءًا. ونجح الفحصان الآليان قبل المراجعة، ثم راجع صاحب المشروع كل استشهادٍ وكل موضعٍ على الخريطة.
- **5 أكتوبر، الشعر:** يُرجَع بيت الشعر المُنشَد إلى أقدم سجلٍّ وُجد له على موقع الديوان.
- **5 أكتوبر، عامل تبويب «التبيّن»:** يلصق المختبِر رابطًا من «يوتيوب» أو يختار ملفًّا لا يتجاوز ثلاث دقائق، فيحصل على العدد وعلى سطرٍ لكل استشهاد، له وحده. ويعمل العامل على جهاز صاحب المشروع، لأن موقع الدرر السنية يجيب الخطَّ المنزلي ويرفض خوادم مراكز البيانات (قيس يوم 4 أكتوبر: الجهاز 72 من 72، والسحابة 0 من 8).
- **6 أكتوبر، «التبيّن 3»:** تُقارَن الآيات بالمصحف بالسكربت، مع سؤالٍ صغيرٍ واحد عند الاختلاف. ثم شجرة الحديث، وسُلَّم الأحكام، والشعر، والأرقام، والأخبار، والبحث عن آيةٍ تؤدي المعنى. وكلٌّ منها مقيسٌ على مراجعة صاحب المشروع، وله سقفُ كلفةٍ لكل فحص (دولار واحد)، ووضعُ اختبارٍ لا ينفق شيئًا.
- **6 أكتوبر، السجلات المنشورة:** صارت المصادر المراجَعة ظاهرةً في التطبيق: 65 استشهادًا على 24 مقطعًا، في 76 جزءًا.
- **6 أكتوبر، الملف من الهاتف:** يُفحص المقطع المرفوع من الهاتف بالطريقة نفسها، وتصل السطور تباعًا كلما وُجدت، ويُنبَّه صاحب الطلب عند انتهاء الفحص.

## النتائج المقيسة في أيام التحدي

هذه عيّناتٌ صغيرة، راجعها مراجعٌ واحد، على قواعد ما تزال مؤقتةً حتى يعتمدها عالِم. والجداول التفصيلية في القسم الإنجليزي أعلاه.

- **تشغيل المكتبة:** من 70 استشهادًا وافق 59 مصدرَه، وصُحِّح واحد، ولم يوجد 4 في أي مصدرٍ معتمد، و6 ليست ادعاءات. وفي فحص الدرر: 28 رابطًا لأحد عشر حديثًا بلا خطأ، و22 من 24 حكمًا مطابقٌ لصفحته حرفيًّا، واثنان غير واضحين، ولا خطأ. قبِل صاحب المشروع 65 كما هي وعدّل 5، ونُشر 65 استشهادًا على 24 مقطعًا.
- **«التبيّن 3»:** الآيات المختلفة عن المصحف 8 من 8 بلا آيةٍ خاطئة؛ الشعر وُجدت القصيدة الوحيدة كما في المراجعة؛ الأرقام 2 من 2؛ الأخبار 23 استشهادًا بلا مصدرٍ خاطئ ولا تصحيحٍ خاطئ؛ الأحكام (عيّنة من 4) بلا مصدرٍ خاطئ. وفحصٌ حقيقيٌّ كامل لمقطعٍ واحد كلّف 13 سنتًا في 2.9 دقيقة.

## التشغيل

يلزم Node.js الإصدار 22 أو أحدث، وnpm، وcurl، ومفاتيحك الخاصة لـ«أنثروبيك» و«جيميناي» وخدمة بيانات «يوتيوب». الأوامر في القسم الإنجليزي أعلاه.

**وما لا يعمل إلا على جهاز صاحب المشروع، بصراحة:** موقع الدرر السنية يرفض خوادم مراكز البيانات، فخطوات الحديث تعمل من خطٍّ منزلي. وسكربت الاستماع جزءٌ من شيفرة التطبيق الخاصة، ونسخته المستعملة في تشغيل المكتبة موجودةٌ في مجلد التشغيل. والكتب الموثَّقة نصوصُ ناشرين آخرين نُزّلت إلى الجهاز ولا تُنشر هنا. وسكربتات القياس تقرأ مجلدات وثائق صاحب المشروع، وهي سجلُّ كيف أُجري كل قياس.

## الموثوقية والسلامة

- **الامتناع خيرٌ من الاختلاق:** لا صفحة من الذاكرة، ولا رابط إلا ما طبعه البحث. ويظهر «قيد البحث» حين لا يجيب المصدر، و«لم يُعثر عليه» حين لا يوجد.
- **لا تصحيح من صفحةٍ واحدة:** الصفحة التي تذكر تفصيلًا آخر تُعيد أداة التحقق إلى البحث عن رواية المتكلم نفسه.
- **الإنسان يقرر:** لا يصل شيءٌ إلى القارئ في التطبيق دون مراجعة، وقرارات المراجعة محفوظةٌ منفصلةً عن مخرجات أداة التحقق الخام.
- **يُلوَّن الدليل لا الشخص:** النتيجة تصف المصدر الذي وُجد، لا المتكلم. وقد حُذفت علامة الإشراف الداخلية لكل استشهادٍ من ملفات التشغيل المنشورة.
- **كلام المقطع غير مأمون:** ليس للمساعد الذي يتحقق أيُّ وصولٍ إلى سطر الأوامر، ولا يقرأ إلا مجلده، ولا يشغّل إلا أدوات التحقق، ولا يجلب إلا من مواقع المصادر الموثوقة.

## ما ليس في المستودع، ولماذا

بقية التطبيق (خريطة العلوم، والحسابات، والصفحة الرئيسية، وصفحات المقاطع) خاصةٌ قبل إطلاقه في المتاجر، وتُرى عاملةً عبر الرابط المرفق في التسليم. وأصوات المقاطع وعناوين بثها ملكٌ لأصحابها، فليست هنا.

## الترخيص والاسم

جميع الحقوق محفوظة، ويجوز قراءة الشيفرة وتشغيلها للتقييم فقط (`LICENSE.md`). واسم «منك السلام» واسم «التبيّن» والشعار من عمل الفريق. وما صنعه غيرنا من مصادر وأدوات ومكتبات يبقى على تراخيصه وشروطه (`SOURCES_TOOLS_LICENSES.md`).

</div>
