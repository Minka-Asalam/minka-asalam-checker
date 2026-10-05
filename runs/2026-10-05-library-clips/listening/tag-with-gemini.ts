/// <reference types="node" />
// Tags YouTube videos against the live tag vocabulary by LISTENING to them.
//
// Hands Gemini each video's public YouTube URL — nothing is downloaded,
// Google processes its own platform's video — together with the current
// node_tags vocabulary, and asks for at most three tags, each carrying the
// timestamp and the sentence spoken at that moment. That evidence rule is
// the whole point: a moderator jumps to 10:31, hears one sentence, and
// approves in seconds instead of watching forty-five minutes.
//
// Since 2026-09-17 it also asks WHO each video is for (children / teens /
// new_to_islam / general_adult / student_of_knowledge) and how much it
// assumes -- recorded in the results, NOT written to video_audience_levels:
// the app's levels are tied to map modes that are being reshaped, so the
// answer is captured now and mapped onto real levels in one migration once
// the modes settle. Owner's decision 2026-09-17.
//
// Born 2026-09-11 as a scratch experiment on the first eight videos, kept
// because it worked (migration 145 is its output): two of the eight titles
// described a different video from the one the sheikh gave, which is why
// tagging is content-first and titles are only a cross-check. What the run
// taught — the first two tags are stable across repeat runs, the third
// varies; Q&A digressions do not tag a lecture — is in the project memory
// and in Deeni_Automated_Curation_Design.md.
//
// It PROPOSES. It writes nothing to the database. Results land as JSON in
// a temp folder (printed at the end) for a human to review; the decisions
// then go into a numbered migration, keyed by YouTube id and Arabic label,
// the way 145 did it.
//
// DEEP MODE (the default since 2026-09-17, owner's decision the same day):
// Gemini is given the WHOLE talib-ilm tree (1,420 node paths) and asked for
// the deepest node the video substantially teaches, not a label from the
// shallow vocabulary. The first three days had tagged at branch/sub-branch
// level only, so a video on wudu sat on "Purification" and the Wudu node --
// and every interest under level 2 -- pooled nothing. A deep tag rolls up
// by itself (own -> descendants), so nothing else in the app changes. Each
// result tag now carries node_path; tag_ar is the node's tag if it has one,
// else the node's own label, with new_tag=true -- the migration creates the
// tag on that node (the deepening pattern of 147/148/160/169, made routine).
// --shallow restores the vocabulary-only prompt.
//
// CLAIMS PASS (2026-09-21, owner's decision of the 20th): the same listen
// also EXTRACTS every checkable statement -- a verse cited, a hadith quoted
// with whatever attribution the speaker gives, a ruling stated as the
// religion's position, a historical fact, a figure -- each with its
// timestamp and the speaker's own wording, plus four content flags (takfir
// of persons, sectarian polemic, sensitive for teens, political). Gemini
// only extracts; it never judges. An independent checker pass grades the
// claims against the Bāzil reference framework (red: fabricated hadith as
// authentic, a verse misquoted as Qur'an, takfir, a position outside
// recognised scholarship presented as the religion, invented history;
// amber: a weak hadith used without saying so, a disputed ruling as the
// only view, sectarian polemic, sensitive for teens), and the review page
// shows them. --claims=light asks only for verses and hadith (scholars);
// --claims=off drops the block. Default: full.
//
// --claims-only (the Sources back-fill, 2026-09-22): the listen asks for
// the claims and the flags ALONE — no tree in the prompt, no tags in the
// answer — for a video that is already tagged and only needs its Sources.
// The prompt is a fifth the size (the 1,400-path tree is what makes a deep
// prompt long), and the run can never propose a tag change on a video
// nobody asked about.
//
// SOURCE UNITS — THE DEFAULT since 2026-10-02 (born 2026-10-01 as the opt-in
// --units; --sentences now restores the old cut). A claim is cut by SOURCE UNIT,
// not by sentence. The test found one narration told over 80 seconds cut
// into six claims, a knots hadith in two halves (twice), a hadith told in
// halves three minutes apart and a list hadith one clause per claim — 17 of
// 147 claims — so each piece was checked alone and two landed "pending" or
// "not found" although they sit in the same hadith. With source units each claim
// is one verse passage, one narration, one saying, one ruling or one episode,
// kept open while the speaker comments in his own voice (the switch from the
// classical quote to the dialect) and re-entered when he returns to it; each
// stretch where the source is quoted or retold is a PIECE with its own start
// and end. A Prophet's saying told inside a story or a ruling becomes its own
// hadith claim, pointing at the claim it sits in ("inside"), so its dorar
// lookup runs. The claim's timestamp, timestamp_end and quote are filled from
// its pieces, so everything downstream reads it unchanged. Measured in
// D:\Deeni Docs\curation\2026-10-01 Extractor source units\ against the old
// prompt re-run the same morning (2 Oct, ten videos): units kept 4 of 5 split
// sources whole (old 1 of 5), lost 4% of the published claims (old 16%),
// joined separate rulings once (old once), ~7% more tokens.
//
// LOCAL FILES (2026-10-05, the challenge's clip library): a positional argument
// that is an existing .m4a/.mp3/.wav/.mp4 file is sent to Gemini inline (base64)
// instead of a YouTube URL. The video id is the file name without its extension
// (the library run names each file <videos.id>.m4a), so result-<id>.json reads
// exactly like a YouTube result. The app's clips live in Mux, not on YouTube;
// their sound is joined from the audio-only stream (Docs, 2026-10-05 Clip
// library run/fetch-clip-audio.mjs). Inline is fine for clips: a 3-minute clip
// is ~3 MB; keep it under ~15 MB per request.
//
// Run:  npx tsx mobile/scripts/tag-with-gemini.ts <youtubeId|url|file> [...]
//         [--models=a,b,c | --model=X] [--fps=0.2] [--shallow]
//         [--claims=full|light|off] [--claims-only] [--sentences] [--dry-run]
// Key:  GEMINI_API_KEY in the environment, or a line GEMINI_API_KEY=... in
//       D:\Deeni\.env — a FILE at the repo root (gitignored). A folder named
//       .env there breaks `npx supabase db query`; keep it a file.
//
// Free tier, measured 2026-09-12: 250k input tokens PER MINUTE (one hour-
// long lecture is ~420k at the default frame rate and spends the whole
// minute — the script waits out the "retry in Ns" it gets back and pauses
// between videos) and 8 hours of YouTube video per day. --fps lowers the
// frame sampling; the audio, which is what matters, is untouched. It is
// untested on this endpoint as of 2026-09-12 — compare the token count
// against a default run of the same video to see whether it took.

import { createClient } from '@supabase/supabase-js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { basename, extname, join } from 'path';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

function loadEnvFile(path: string): void {
  let text = '';
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    return;
  }
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

loadEnvFile(join(__dirname, '..', '.env')); // Supabase, same as every other script here
loadEnvFile(join(__dirname, '..', '..', '.env')); // the Gemini key, repo root

const args = process.argv.slice(2);
const flag = (name: string): string | undefined =>
  args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const DRY_RUN = args.includes('--dry-run');
const DEEP = !args.includes('--shallow');
const CLAIMS = (flag('claims') ?? 'full') as 'full' | 'light' | 'off';
if (!['full', 'light', 'off'].includes(CLAIMS)) {
  console.error('--claims must be full, light or off');
  process.exit(2);
}
const CLAIMS_ONLY = args.includes('--claims-only');
if (CLAIMS_ONLY && CLAIMS === 'off') {
  console.error('--claims-only needs the claims block (--claims=full or light)');
  process.exit(2);
}
// Source units are the DEFAULT since 2026-10-02 (the owner's call after the
// ten-video measurement); --sentences restores the old one-sentence cut, to
// reproduce a run made before that day. --units is still accepted.
if (args.includes('--units') && args.includes('--sentences')) {
  console.error('--units and --sentences contradict each other; source units are the default, so pass neither or --sentences');
  process.exit(2);
}
if (args.includes('--units') && CLAIMS === 'off') {
  console.error('--units needs the claims block (--claims=full or light)');
  process.exit(2);
}
const UNITS = CLAIMS !== 'off' && !args.includes('--sentences');
// The free tier allows about 20 requests PER DAY PER MODEL (found the hard
// way on 2026-09-15: `generate_content_free_tier_requests, limit: 20`), and
// every retry is a request. So the script carries a rotation: when a
// model's daily bucket is spent it moves to the next, rather than failing
// the rest of the batch. --model=X pins a single model; --models=a,b,c sets
// the rotation. 2.5 Flash is retired for new accounts (404), so it is not
// in the default list. The two LITE models are not in it either (2026-10-02):
// on batch B they quietly under-extracted (1 claim against 12 on the same
// video), so when the full models are spent the run STOPS instead of
// degrading. A lite model runs only when named with --model or --models.
const MODELS: string[] = flag('model')
  ? [flag('model')!]
  : (flag('models') ?? 'gemini-3.6-flash,gemini-3.7-flash,gemini-3.5-flash,gemini-3.8-flash').split(',');
let modelIndex = 0;
const MODEL = () => MODELS[modelIndex];
const FPS = flag('fps') ? Number(flag('fps')) : null;

const GEMINI_KEY = process.env.GEMINI_API_KEY ?? '';
if (!GEMINI_KEY && !DRY_RUN) {
  console.error('No GEMINI_API_KEY. Put GEMINI_API_KEY=... in D:\\Deeni\\.env (a file) or the environment.');
  process.exit(2);
}

// Accept bare ids or any youtube.com / youtu.be URL.
function toYoutubeId(arg: string): string | null {
  if (/^[A-Za-z0-9_-]{11}$/.test(arg)) return arg;
  const m = arg.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
// A local media file (see LOCAL FILES above): its id is the file name.
const MEDIA_TYPES: Record<string, [string, string]> = {
  '.m4a': ['audio', 'audio/mp4'],
  '.mp3': ['audio', 'audio/mpeg'],
  '.wav': ['audio', 'audio/wav'],
  '.mp4': ['video', 'video/mp4'],
};
const LOCAL_FILES = new Map<string, string>();
function toId(arg: string): string | null {
  if (MEDIA_TYPES[extname(arg).toLowerCase()] && existsSync(arg)) {
    const id = basename(arg, extname(arg));
    LOCAL_FILES.set(id, arg);
    return id;
  }
  return toYoutubeId(arg);
}
const VIDEO_IDS = args.filter((a) => !a.startsWith('--')).map(toId).filter((x): x is string => !!x);
if (VIDEO_IDS.length === 0 && !DRY_RUN) {
  console.error('Usage: npx tsx mobile/scripts/tag-with-gemini.ts <youtubeId|url|file> [...] [--model=] [--fps=] [--dry-run]');
  process.exit(2);
}

const OUT = join(tmpdir(), 'deeni-gemini');
mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// The vocabulary — live, so it is always the current node_tags set
// ---------------------------------------------------------------------------

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!);

interface Tag {
  id: string;
  ar: string;
  en: string;
  path: string;
  depth: number;
}

async function loadVocabulary(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('node_tags')
    .select('tag_id, tags(label_ar, tag_translations(locale, label)), map_nodes!inner(path_ar)')
    .eq('mode', 'talib-ilm');
  if (error) throw error;
  const tags: Tag[] = (data ?? []).map((r: any) => ({
    id: r.tag_id,
    ar: r.tags.label_ar,
    en: (r.tags.tag_translations ?? []).find((t: any) => t.locale === 'en')?.label ?? '',
    path: r.map_nodes.path_ar,
    depth: r.map_nodes.path_ar.split('/').length,
  }));
  tags.sort((a, b) => a.path.localeCompare(b.path, 'ar'));
  return tags;
}

// The whole tree, for deep mode. supabase-js caps a select at 1,000 rows,
// so it is paged; the vocabulary is joined by path so a chosen node knows
// whether it already has a tag.
interface Node {
  id: string;
  path: string;
  label: string;
  depth: number;
  tagAr?: string;
  tagEn?: string;
}

async function loadTree(tags: Tag[]): Promise<Node[]> {
  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('map_nodes')
      .select('id, label_ar, path_ar')
      .eq('mode', 'talib-ilm')
      .order('path_ar')
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const byPath = new Map(tags.map((t) => [t.path, t]));
  const nodes: Node[] = rows.map((r) => {
    const t = byPath.get(r.path_ar);
    return { id: r.id, path: r.path_ar, label: r.label_ar, depth: r.path_ar.split('/').length, tagAr: t?.ar, tagEn: t?.en };
  });
  nodes.sort((a, b) => a.path.localeCompare(b.path, 'ar'));
  return nodes;
}

function treeBlock(nodes: Node[]): string {
  let out = '';
  let branch = '';
  for (const n of nodes) {
    const b = n.path.split('/')[0];
    if (b !== branch) {
      branch = b;
      out += '\n';
    }
    out += n.path + '\n';
  }
  return out.trim();
}

function vocabularyBlock(tags: Tag[]): string {
  let out = '';
  let branch = '';
  for (const t of tags) {
    const b = t.path.split('/')[0];
    if (b !== branch) {
      branch = b;
      out += '\n';
    }
    out += (t.depth === 1 ? '● ' : '    ') + `${t.ar} — ${t.en}\n`;
  }
  return out.trim();
}

// ---------------------------------------------------------------------------
// The prompt
// ---------------------------------------------------------------------------

// The claims block of the deep prompt: the JSON shape and its rules. Light
// mode (scholars) asks only for verses and hadith; full mode adds rulings,
// history and figures. Extraction only -- the grading is the checker's.
function claimsShape(): string {
  if (CLAIMS === 'off') return '';
  const kinds = CLAIMS === 'light' ? '"quran" | "hadith"' : '"quran" | "hadith" | "saying" | "ruling" | "history" | "number" | "other"';
  if (UNITS) return `,
  "claims": [
    {
      "kind": ${kinds},
      "unit": "one line in English naming the source unit: which verse passage, which narration, which saying, which ruling, which episode",
      "pieces": [
        {
          "timestamp": "MM:SS",
          "timestamp_end": "MM:SS",
          "quote": "what the speaker says in this piece, in the language spoken, verbatim",
          "voice": "source" | "retelling",
          "cue": "the speaker's words that hand over to the source at the start of this piece, verbatim (e.g. 'فقال صلى الله عليه وسلم', 'ثم قال', 'وتكملة الحديث'), or an empty string"
        }
      ],
      "inside": 0,
      "attribution": "how the speaker sources it, verbatim — a surah name, 'رواه البخاري', 'قال الشافعي', a book — or an empty string if none is given",
      "reference": "for quran: surah:ayah when identifiable, e.g. 2:255, or a range 2:255-257 for a passage; for hadith: the collection if the speaker names one; else an empty string",
      "key_ar": "for hadith only: the narration's classical Arabic wording as best known, 6–10 words, for a hadith-database search; else an empty string",
      "stated_as": "definitive" | "opinion" | "disputed",
      "claim_en": "one line in English: what is asserted"
    }
  ],
  "flags": {
    "takfir_of_persons": true | false,
    "sectarian_polemic": true | false,
    "sensitive_for_teens": true | false,
    "political": true | false,
    "why": "one line in English, or an empty string"
  }`;
  return `,
  "claims": [
    {
      "kind": ${kinds},
      "timestamp": "MM:SS",
      "timestamp_end": "MM:SS",
      "quote": "what the speaker says at that moment, in the language spoken, verbatim",
      "attribution": "how the speaker sources it, verbatim — a surah name, 'رواه البخاري', 'قال الشافعي', a book — or an empty string if none is given",
      "reference": "for quran: surah:ayah when identifiable, e.g. 2:255; for hadith: the collection if the speaker names one; else an empty string",
      "key_ar": "for hadith only: the narration's classical Arabic wording as best known, 6–10 words, for a hadith-database search; else an empty string",
      "stated_as": "definitive" | "opinion" | "disputed",
      "claim_en": "one line in English: what is asserted"
    }
  ],
  "flags": {
    "takfir_of_persons": true | false,
    "sectarian_polemic": true | false,
    "sensitive_for_teens": true | false,
    "political": true | false,
    "why": "one line in English, or an empty string"
  }`;
}

function claimsRules(): string {
  if (CLAIMS === 'off') return '';
  const scope = CLAIMS === 'light'
    ? `- "claims" lists EVERY verse the speaker recites or cites (kind "quran") and EVERY hadith or companion's report the speaker quotes or paraphrases (kind "hadith"), whether or not the speaker sources it.`
    : `- "claims" lists every statement a reviewer could check. Kinds: "quran" = a verse recited or cited; "hadith" = a prophetic hadith or a companion's report, quoted or paraphrased; "saying" = the words of a companion, an early scholar or a later one (Ibn al-Qayyim, al-Ghazali, the salaf…) cited as wisdom or teaching, with the work if the speaker names it; "ruling" = a position stated as the religion's — halal, haram, obligatory, invalid, a condition, a punishment; "history" = a fact about the past with names, places, dates or numbers (sirah, companions, later history); "number" = a figure or statistic; "other" = anything else checkable (a scientific claim, a claim about another religion). List EVERY verse and EVERY hadith, whether or not the speaker sources it; for rulings and history, list what the lesson rests on, not passing remarks. At most 25 claims — if there are more, keep the ones that carry the lesson.`;
  if (UNITS) return `
${scope.replace('At most 25 claims', 'At most 25 claims (units, below; a unit may have any number of pieces)')}
- CUT BY SOURCE UNIT, NOT BY SENTENCE. One claim = one source unit: one verse, or one run of consecutive verses recited as one passage; one narration (a hadith or a companion's report) — the whole of what it tells, every word and deed inside it and its closing line; one saying of a scholar; one ruling (one question and the answer given to it); one historical episode; one figure. A speaker often tells a narration over a minute or more, sentence by sentence, with his own comments between: that is still ONE claim.
- PIECES. Every stretch in which the speaker quotes or retells the unit is a piece, with its own "timestamp" (the second he BEGINS it) and "timestamp_end" (the second he FINISHES it), precise to the second — the app lights the claim under the video for exactly those spans. "voice": "source" when he gives the source's own words (usually classical Arabic: a recited verse, the hadith's wording, a scholar's words); "retelling" when he tells its content in his own words (often in dialect). The commentary BETWEEN pieces — where he speaks in his own voice about the unit, explains it, addresses the audience (often a switch from the classical register to the dialect, "يعني", "شوف", "تخيل") — is NOT a piece, but it does NOT close the unit. The unit stays open, and his return to it ("فقال", "ثم قال", "قال", "وفي رواية", "وتكملة الحديث", picking the story up again) is the next piece of the SAME claim; copy those handing-over words into "cue".
- NOTHING IS DROPPED. Cutting by unit only JOINS the pieces of one source; it never removes a claim. List every statement you would list cutting sentence by sentence: every ruling (each different ruling is its own claim — when something is done, how, how many times, what invalidates it, what is best, who may receive it are different rulings), every hadith even a short phrase given in passing, every saying, every figure, every historical fact.
- THE SAME UNIT AGAIN is more pieces of the same claim, never a new claim: the same narration resumed minutes later with other claims in between, its other half told in a different part of the lesson, repeated as a refrain, told by meaning first and verbatim afterwards, its second half told before its first, two wordings of it mixed, a dialect gloss inside the quote; a list hadith told item by item ("whoever does X… whoever does Y… whoever does Z") is one claim with one piece per item; the same verse recited again is a piece of the claim that already holds it.
- A DIFFERENT UNIT inside a unit is its own claim as well: a verse quoted inside a hadith, a hadith quoted inside a ruling or an explanation, words the speaker attributes to the Prophet ﷺ inside a story, a ruling or a report — even a short phrase, a practice ("he used to fast Mondays and Thursdays") or a title he gave someone. Give that inner unit its own claim (a "hadith" claim with its own key_ar for the Prophet's words), set its "inside" to the number (1 = the first claim in your list) of the claim it is told inside, and keep the piece in the outer claim too. "inside" is 0 for every other claim.
- BUT a story that IS a narration — the companions relating what happened with the Prophet ﷺ, what he said and did in it — is ONE "hadith" claim, not a "history" claim plus separate hadith claims: the Prophet's words inside his own narration are pieces of that narration, not inner units.
- Distinct units stay distinct claims: two different hadith, two verses not recited as one passage, two different rulings even on the same subject and even back to back (how many rak'as a prayer has and when it is prayed are two rulings; the zakat due on camels and the zakat due on crops are two rulings), and each position the speaker names in a scholarly disagreement (the majority's, a school's) is its own claim.
- Before answering, check your list four ways: every ruling, figure, hadith and verse in the video is in it; no two claims hold pieces of the same narration or passage; no claim holds two different rulings; every word or deed the speaker attributes to the Prophet ﷺ inside a story, a ruling or a report has its own "hadith" claim with "inside" set.
- "quote" in a piece is the speaker's own wording in that piece. Do NOT correct it toward the canonical text of a verse or hadith; the reviewer needs to hear what was actually said. A translation spoken in English is quoted in English.
- "attribution" is only what the speaker says about the source; if nothing is said, leave it empty. Never supply a source the speaker did not give.
- "key_ar" is different: for a hadith, give the classical Arabic wording of the narration you recognise (a paraphrase in dialect or in English still gets its Arabic key), so it can be looked up in a hadith database. If you do not recognise the narration, leave it empty.
- "stated_as": "definitive" = presented as the settled position of Islam; "opinion" = presented as the speaker's own view or one view among several; "disputed" = the speaker says scholars differ.
- Do not judge the claims — no gradings, no corrections. Extraction only.
- "flags": takfir_of_persons = the speaker declares a named person or a Muslim group to be disbelievers; sectarian_polemic = attacking another Islamic group beyond scholarly disagreement; sensitive_for_teens = intimate or marital detail, graphic violence or other adult matters; political = current rulers, states or parties. Set "why" when any flag is true.`;
  return `
${scope}
- "timestamp" is the second the speaker BEGINS the cited words; "timestamp_end" is the second the speaker FINISHES them — the end of the recitation, the narration or the sentence that carries the claim, not of the discussion around it. The app lights the claim under the video for exactly that span, so be precise to the second; never later than the next claim's timestamp.
- "quote" is the speaker's own wording at that moment. Do NOT correct it toward the canonical text of a verse or hadith; the reviewer needs to hear what was actually said. A translation spoken in English is quoted in English.
- "attribution" is only what the speaker says about the source; if nothing is said, leave it empty. Never supply a source the speaker did not give.
- "key_ar" is different: for a hadith, give the classical Arabic wording of the narration you recognise (a paraphrase in dialect or in English still gets its Arabic key), so it can be looked up in a hadith database. If you do not recognise the narration, leave it empty.
- "stated_as": "definitive" = presented as the settled position of Islam; "opinion" = presented as the speaker's own view or one view among several; "disputed" = the speaker says scholars differ.
- Do not judge the claims — no gradings, no corrections. Extraction only.
- "flags": takfir_of_persons = the speaker declares a named person or a Muslim group to be disbelievers; sectarian_polemic = attacking another Islamic group beyond scholarly disagreement; sensitive_for_teens = intimate or marital detail, graphic violence or other adult matters; political = current rulers, states or parties. Set "why" when any flag is true.`;
}

function buildDeepPrompt(nodes: Node[]): string {
  return `You are placing an Islamic lecture video (Arabic or English) onto a knowledge tree for a knowledge app${CLAIMS === 'off' ? '' : ', and noting every statement in it a reviewer could check'}. Listen to the WHOLE video before answering.

Return ONLY a JSON object — no prose before or after — with exactly this shape:
{
  "language": "ar-msa" | "ar-egyptian" | "ar-mixed" | "en" | "other",
  "summary_ar": "2–3 sentences in Arabic describing what the speaker actually says",
  "summary_en": "the same, in English",
  "tags": [
    {
      "node_path": "one path copied EXACTLY from the tree below, segments separated by /",
      "timestamp": "MM:SS",
      "quote_ar": "the sentence the speaker says at that moment, in the language spoken, verbatim",
      "why": "one line in English: why this sentence places the video on this node",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "not_covered": "one line: a major subject of the video that has NO fitting node in the tree, or an empty string",
  "audience": {
    "for": ["one or more of: children | teens | new_to_islam | general_adult | student_of_knowledge"],
    "assumes": "none | basic | advanced  (how much prior knowledge the speaker assumes)",
    "why": "one line in English"
  }${claimsShape()}
}

Rules:
- At most 3 nodes. Fewer is better than a weak third.
- node_path must be copied verbatim from the tree below. Never invent, shorten or edit a path.
- Choose the DEEPEST node the video substantially teaches. A path with three or more segments is the normal answer. Give a two-segment path only when the video treats that whole subject in general; never give a one-segment path unless nothing beneath it fits at all.
- Substantial means the speaker teaches that subject, not that a word matches: a video on common mistakes in wudu belongs at الفقه/الطهارة/الوضوء, and at الفقه/الطهارة/الوضوء/نواقض الوضوء only if the mistakes discussed are specifically what nullifies wudu.
- Every node MUST carry a real timestamp and a real sentence from the audio. If you cannot point to a sentence, do not give the node.
- A subject raised only in an audience Q&A at the end of the lecture is not what the lecture is about; do not tag it.
- "high" = the speaker addresses this subject at length; "medium" = clearly touched on but not the main subject; "low" = plausible but you are unsure.
- For "audience", judge from the register and what is assumed, not from the subject: colloquial and practical with no terms explained is general_adult; simple and gentle with nothing assumed is new_to_islam; technical terms used without explanation is student_of_knowledge. List every group it genuinely serves, most-served first.${claimsRules()}

The tree — one node per line, grouped by branch:

${treeBlock(nodes)}`;
}

function buildPrompt(tags: Tag[]): string {
  return `You are tagging an Islamic lecture video (Arabic or English) for a knowledge app. Listen to the WHOLE video before answering.

Return ONLY a JSON object — no prose before or after — with exactly this shape:
{
  "language": "ar-msa" | "ar-egyptian" | "ar-mixed" | "en" | "other",
  "summary_ar": "2–3 sentences in Arabic describing what the speaker actually says",
  "summary_en": "the same, in English",
  "tags": [
    {
      "tag_ar": "one label copied EXACTLY from the approved list below",
      "timestamp": "MM:SS",
      "quote_ar": "the sentence the speaker says at that moment, in the language spoken, verbatim",
      "why": "one line in English: why this sentence supports this tag",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "not_covered": "one line: a major subject of the video that has NO matching tag in the list, or an empty string",
  "audience": {
    "for": ["one or more of: children | teens | new_to_islam | general_adult | student_of_knowledge"],
    "assumes": "none | basic | advanced  (how much prior knowledge the speaker assumes)",
    "why": "one line in English"
  }
}

Rules:
- At most 3 tags. Fewer is better than a weak third.
- Use only tag_ar values from the approved list, copied verbatim. Never invent a tag.
- Every tag MUST carry a real timestamp and a real sentence from the audio. If you cannot point to a sentence, do not give the tag.
- Prefer the most specific tag the evidence supports. Do not add a branch tag (marked ●) when a sub-branch beneath it already fits.
- A subject raised only in an audience Q&A at the end of the lecture is not what the lecture is about; do not tag it.
- "high" = the speaker addresses this subject at length; "medium" = clearly touched on but not the main subject; "low" = plausible but you are unsure.
- For "audience", judge from the register and what is assumed, not from the subject: colloquial and practical with no terms explained is general_adult; simple and gentle with nothing assumed is new_to_islam; technical terms used without explanation is student_of_knowledge. List every group it genuinely serves, most-served first.

Approved tags — each branch (●) followed by its sub-branches, as "label_ar — English":

${vocabularyBlock(tags)}`;
}

// The claims and the flags alone (--claims-only): the same extraction
// rules, no tree, "tags" always empty so the result reads like any other.
function buildClaimsOnlyPrompt(): string {
  return `You are noting every statement in an Islamic lecture video (Arabic or English) that a reviewer could check, for a knowledge app. Listen to the WHOLE video before answering.

Return ONLY a JSON object — no prose before or after — with exactly this shape:
{
  "language": "ar-msa" | "ar-egyptian" | "ar-mixed" | "en" | "other",
  "summary_ar": "2–3 sentences in Arabic describing what the speaker actually says",
  "summary_en": "the same, in English",
  "tags": []${claimsShape()}
}

Rules:
- "tags" is always an empty list here; do not place the video on any subject.${claimsRules()}`;
}

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function askGemini(youtubeId: string, prompt: string): Promise<{ response: unknown; model: string }> {
  const file = LOCAL_FILES.get(youtubeId);
  const media = file ? MEDIA_TYPES[extname(file).toLowerCase()] : null;
  const video: Record<string, unknown> = file && media
    ? { type: media[0], data: readFileSync(file).toString('base64'), mime_type: media[1] }
    : { type: 'video', uri: `https://www.youtube.com/watch?v=${youtubeId}` };
  if (FPS && !file) video.processing = { type: 'static', fps: FPS };

  let busyStreak = 0; // consecutive 500s on the current model
  for (let attempt = 1; attempt <= 6; attempt++) {
    if (modelIndex >= MODELS.length) throw new Error('every model in the rotation has spent its daily free-tier bucket');
    const model = MODEL();
    const body = { model, input: [{ type: 'text', text: prompt }, video] };
    // Node's fetch has no timeout of its own: on 2026-09-15 one request sat
    // on a dead connection for 24 minutes and stalled the whole batch. Four
    // minutes is generous — an hour-long lecture answered in about two.
    // A network-level failure ("fetch failed", an abort) is transient like
    // a 500 and is retried the same way, not thrown.
    let res: Response;
    let text: string;
    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 4 * 60 * 1000);
      try {
        res = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
          method: 'POST',
          headers: { 'x-goog-api-key': GEMINI_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: ac.signal,
        });
        text = await res.text();
      } finally {
        clearTimeout(timer);
      }
    } catch (e) {
      const why = (e as Error).name === 'AbortError' ? 'timed out after 4 min' : `network error (${(e as Error).message})`;
      if (attempt < 6) {
        console.log(`  ${why} on ${model}, waiting 30s (attempt ${attempt})…`);
        await sleep(30_000);
        continue;
      }
      throw new Error(why);
    }
    writeFileSync(join(OUT, `raw-${youtubeId}.json`), text);
    if (res.ok) return { response: JSON.parse(text), model };

    // Three different refusals, told apart by what Google says:
    //   - the DAILY per-model request bucket is spent -> move to the next model, now
    //   - the per-MINUTE token meter -> wait it out, same model
    //   - 500 "high demand" -> transient, wait and retry, same model
    //   - 404 model retired -> next model, now
    // The daily bucket now also answers "limit: 20 requests per day on Free Tier"
    // with a misleading "retry in 55s" (2026-09-20); both wordings mean rotate.
    // "Your project has exceeded a quota" (seen 2026-10-01/02) is NOT one
    // model's bucket: every model answers it at once, text requests still
    // pass, and waiting minutes does not clear it. It is the PROJECT's free
    // video allowance, which resets at midnight Pacific time (10:00 in Egypt
    // in summer). Rotating or retrying only spends requests, so stop the run.
    if (res.status === 429 && /exceeded a quota/i.test(text)) {
      throw new Error("the project's free Gemini video allowance is spent for today; it resets at midnight Pacific time");
    }
    const daily = res.status === 429 && (/free_tier_requests/.test(text) || /requests per day/i.test(text));
    const retired = res.status === 404 && /no longer available/i.test(text);
    if (daily || retired) {
      console.log(`  ${model}: ${daily ? 'daily bucket spent' : 'retired'} -> switching to ${MODELS[modelIndex + 1] ?? '(none left)'}`);
      modelIndex++;
      continue;
    }
    // A model that says "high demand" twice in a row is not coming back this
    // minute, and every 500 still counts against its daily bucket. So the
    // second consecutive busy reply rotates to the next model (found
    // 2026-09-17: 3.7 Flash answered busy five times running and would have
    // failed the video and spent the shared 3.7/3.8 bucket doing it).
    // "High demand" also arrives as a 503 (2026-09-20, 3.6 Flash, mid-batch:
    // it fell through to a hard failure); same treatment.
    if ((res.status === 500 || res.status === 503) && attempt < 6) {
      busyStreak++;
      if (busyStreak >= 2 && modelIndex + 1 < MODELS.length) {
        console.log(`  ${model}: busy twice running -> switching to ${MODELS[modelIndex + 1]}`);
        modelIndex++;
        busyStreak = 0;
        continue;
      }
      console.log(`  server busy on ${model}, waiting 35s (attempt ${attempt})…`);
      await sleep(35_000);
      continue;
    }
    if (res.status === 429 && attempt < 6) {
      const m = text.match(/retry in ([\d.]+)s/i);
      const wait = Math.ceil((m ? Number(m[1]) : 60) + 5);
      console.log(`  rate-limited on ${model}, waiting ${wait}s (attempt ${attempt})…`);
      await sleep(wait * 1000);
      continue;
    }
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 600)}`);
  }
  throw new Error('gave up after 6 attempts');
}

interface TagResult {
  tag_ar: string;
  timestamp: string;
  quote_ar?: string;
  quote?: string; // Gemini sometimes renames the field; read either
  why: string;
  confidence: 'high' | 'medium' | 'low';
  // deep mode
  node_path?: string; // as Gemini wrote it
  path_ar?: string; // the tree path it resolved to
  new_tag?: boolean; // the node has no tag yet; the migration creates one
  unresolved?: boolean; // no such path in the tree; cannot enter as is
}

// Deep mode: turn Gemini's node_path into a tag decision. An exact path is
// the normal case. Failing that, a unique node label (Gemini dropping the
// ancestors) is accepted with a note; anything else is unresolved.
function resolveNode(t: TagResult, byPath: Map<string, Node>, byLabel: Map<string, Node[]>): void {
  const raw = String(t.node_path ?? t.tag_ar ?? '').trim();
  const clean = raw.replace(/\s*\/\s*/g, '/');
  let node = byPath.get(clean);
  let note = '';
  if (!node) {
    const last = clean.split('/').pop() ?? '';
    const hits = byLabel.get(last) ?? [];
    if (hits.length === 1) {
      node = hits[0];
      note = ` (path given as "${raw}", resolved by its unique label)`;
    }
  }
  t.node_path = raw;
  if (!node) {
    t.unresolved = true;
    t.tag_ar = raw;
    return;
  }
  t.path_ar = node.path;
  t.tag_ar = node.tagAr ?? node.label;
  t.new_tag = !node.tagAr;
  if (note) t.why = (t.why ?? '') + note;
}
interface Claim {
  kind: 'quran' | 'hadith' | 'saying' | 'ruling' | 'history' | 'number' | 'other';
  timestamp: string;
  // The second the cited words end (188); the app lights the row for [timestamp, timestamp_end).
  timestamp_end?: string;
  quote: string;
  attribution?: string;
  reference?: string;
  key_ar?: string;
  stated_as?: 'definitive' | 'opinion' | 'disputed';
  claim_en?: string;
  // source units only (the default; not with --sentences)
  unit?: string;
  pieces?: Piece[];
  inside?: number; // 1-based number of the claim this one is told inside; 0 = none
}
interface Piece {
  timestamp: string;
  timestamp_end?: string;
  quote: string;
  voice?: 'source' | 'retelling';
  cue?: string;
}
interface Flags {
  takfir_of_persons?: boolean;
  sectarian_polemic?: boolean;
  sensitive_for_teens?: boolean;
  political?: boolean;
  why?: string;
}
interface Result {
  language: string;
  summary_ar: string;
  summary_en: string;
  tags: TagResult[];
  not_covered?: string;
  audience?: { for?: string[]; assumes?: string; why?: string };
  claims?: Claim[];
  flags?: Flags;
}

// The response shape is not something to depend on: walk every string in
// it and take the first JSON object that has a "tags" array.
function extractResult(anything: unknown): Result | null {
  const strings: string[] = [];
  (function walk(v: unknown) {
    if (typeof v === 'string') strings.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v as object).forEach(walk);
  })(anything);
  for (const s of strings) {
    const start = s.indexOf('{');
    if (start < 0) continue;
    for (let end = s.lastIndexOf('}'); end > start; end = s.lastIndexOf('}', end - 1)) {
      try {
        const obj = JSON.parse(s.slice(start, end + 1));
        if (obj && Array.isArray(obj.tags)) return obj as Result;
      } catch {
        /* keep shrinking */
      }
    }
  }
  return null;
}

// Source units: a claim's own timestamp, timestamp_end and quote are filled from
// its pieces (first start, last end, the pieces joined with " … "), so the
// prep and checker steps read a unit exactly like a one-sentence claim. A
// claim that came back without pieces keeps what it has and becomes its own
// single piece.
const toSec = (t: string | undefined): number => {
  const p = String(t ?? '').split(':').map(Number);
  return p.some((n) => !Number.isFinite(n)) ? NaN : p.reduce((a, n) => a * 60 + n, 0);
};
function fillFromPieces(claims: Claim[]): void {
  for (const c of claims) {
    let pieces = (Array.isArray(c.pieces) ? c.pieces : []).filter((p) => p && p.timestamp);
    if (pieces.length === 0) pieces = [{ timestamp: c.timestamp, timestamp_end: c.timestamp_end, quote: c.quote ?? '' }];
    pieces.sort((a, b) => toSec(a.timestamp) - toSec(b.timestamp));
    c.pieces = pieces;
    c.timestamp = pieces[0].timestamp;
    const ends = pieces.map((p) => p.timestamp_end ?? p.timestamp).sort((a, b) => toSec(a) - toSec(b));
    c.timestamp_end = ends[ends.length - 1];
    c.quote = pieces.map((p) => p.quote).join(' … ');
    c.inside = Number(c.inside) || 0;
  }
}

function totalTokens(resp: unknown): number | null {
  const m = JSON.stringify(resp).match(/"(?:total_tokens|totalTokens|total_token_count|totalTokenCount)":\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  const tags = await loadVocabulary();
  const byAr = new Map(tags.map((t) => [t.ar, t]));
  const nodes = DEEP ? await loadTree(tags) : [];
  const byPath = new Map(nodes.map((n) => [n.path, n]));
  const byLabel = new Map<string, Node[]>();
  for (const n of nodes) byLabel.set(n.label, [...(byLabel.get(n.label) ?? []), n]);
  const prompt = CLAIMS_ONLY ? buildClaimsOnlyPrompt() : DEEP ? buildDeepPrompt(nodes) : buildPrompt(tags);
  console.log(`${CLAIMS_ONLY ? 'claims only, ' : DEEP ? `tree: ${nodes.length} nodes, ` : ''}vocabulary: ${tags.length} tags   models: ${MODELS.join(' > ')}   prompt: ${prompt.length.toLocaleString()} chars`);
  console.log(`results: ${OUT}\n`);

  if (DRY_RUN) {
    writeFileSync(join(OUT, 'prompt.txt'), prompt);
    console.log('dry run — prompt written, nothing sent');
    return;
  }

  for (const [i, id] of VIDEO_IDS.entries()) {
    if (i > 0) {
      console.log('  (pausing 62s for the per-minute meter)');
      await sleep(62_000);
    }
    console.log('='.repeat(78));
    console.log(LOCAL_FILES.get(id) ?? `https://www.youtube.com/watch?v=${id}`);
    const t0 = Date.now();
    let resp: unknown;
    let usedModel = '';
    try {
      ({ response: resp, model: usedModel } = await askGemini(id, prompt));
    } catch (e) {
      console.log(`  FAILED: ${(e as Error).message}\n`);
      continue;
    }
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const tokens = totalTokens(resp);
    console.log(`  ${secs}s${tokens ? `, ${tokens.toLocaleString()} tokens` : ''}, ${usedModel}\n`);

    const result = extractResult(resp);
    if (!result) {
      console.log(`  no JSON result found — see raw-${id}.json\n`);
      continue;
    }
    console.log(`  language: ${result.language}`);
    console.log(`  summary:  ${result.summary_en}`);
    console.log(`            ${result.summary_ar}\n`);
    for (const t of result.tags) {
      if (DEEP) {
        resolveNode(t, byPath, byLabel);
        const state = t.unresolved ? '   *** NOT IN THE TREE ***' : t.new_tag ? '   (new tag on this node)' : `  (${byAr.get(t.tag_ar)?.en ?? ''})`;
        console.log(`  [${(t.confidence ?? '?').padEnd(6)}] ${t.tag_ar}${state}`);
        console.log(`           ${t.path_ar ?? t.node_path}`);
      } else {
        const known = byAr.get(t.tag_ar);
        console.log(`  [${(t.confidence ?? '?').padEnd(6)}] ${t.tag_ar}${known ? `  (${known.en})` : '   *** NOT IN VOCABULARY ***'}`);
      }
      console.log(`           @ ${t.timestamp}  "${t.quote_ar ?? t.quote ?? '(no quote given)'}"`);
      console.log(`           ${t.why}`);
    }
    if (result.not_covered) console.log(`\n  not covered by any tag: ${result.not_covered}`);
    if (result.audience) console.log(`  audience: ${(result.audience.for ?? []).join(', ')} · assumes ${result.audience.assumes ?? '?'} — ${result.audience.why ?? ''}`);
    if (CLAIMS !== 'off') {
      const claims = Array.isArray(result.claims) ? result.claims : [];
      if (UNITS) fillFromPieces(claims);
      const byKind: Record<string, number> = {};
      for (const c of claims) byKind[c.kind] = (byKind[c.kind] ?? 0) + 1;
      console.log(`  claims: ${claims.length}${claims.length ? ' (' + Object.entries(byKind).map(([k, n]) => `${n} ${k}`).join(', ') + ')' : ''}${UNITS ? `, ${claims.reduce((a, c) => a + (c.pieces?.length ?? 0), 0)} pieces` : ''}`);
      for (const c of claims) console.log(`           @ ${c.timestamp}  [${c.kind}${c.stated_as ? ', ' + c.stated_as : ''}]${UNITS ? ` ${c.pieces?.length ?? 0} piece(s)${c.inside ? `, inside #${c.inside}` : ''}` : ''}${c.attribution ? ' ' + c.attribution : ''}${c.reference ? ' (' + c.reference + ')' : ''}  "${(c.quote ?? '').slice(0, 90)}"`);
      const f = result.flags ?? {};
      const raised = (['takfir_of_persons', 'sectarian_polemic', 'sensitive_for_teens', 'political'] as const).filter((k) => f[k]);
      if (raised.length) console.log(`  FLAGS: ${raised.join(', ')} — ${f.why ?? ''}`);
    }
    console.log('');
    writeFileSync(join(OUT, `result-${id}.json`), JSON.stringify({ ...result, model: usedModel, mode: CLAIMS_ONLY ? 'claims-only' : DEEP ? 'deep' : 'shallow', claims_mode: CLAIMS, ...(UNITS ? { units: true } : {}), tokens }, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
