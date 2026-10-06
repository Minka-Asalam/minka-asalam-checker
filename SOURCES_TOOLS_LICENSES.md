# Sources, tools and licences

The log the challenge guide asks for: every source the Checker reads, every service and model it uses, and every library in the code, each with its licence or terms. Nothing made by others is copied into this repository beyond short quotations used to check a speaker's words, each with a link to its source.

## 1. Sources the Checker reads

The agreed list lives in the app's database and in `pipeline/record-model.json` (`sources`). "Cleared" means confirmed through a shaykh on 25 September 2026. "Provisional" means in use, waiting for a scholar.

| Source | Used for | Status | How it is used | Terms |
|---|---|---|---|---|
| quran.com (Hafs, Madina Mushaf) and its API `api.quran.com` | the verse text a speaker's verse is compared with | provisional | read through its public API; the verse text is quoted with a link | Quran.com terms of use |
| quranpedia.net | the Qur'an, a second reference | provisional | linked | the site's terms |
| dorar.net: the hadith encyclopaedia | a hadith's narration, its grading and the grader's name, copied from the page | provisional | searched with the site's own search; short quotations with a link | the site's terms |
| dorar.net: the fiqh, creed and history encyclopaedias; widespread reports that do not hold | rulings, creed, history, reports | provisional | linked | the site's terms |
| usul.ai: nine verified copies, each pinned to one printing: al-Mughni, al-Majmu', the Kuwaiti Fiqh Encyclopaedia, Zad al-Ma'ad, al-Ashbah wa-l-Naza'ir, Ibn Hisham's Sira, Tafsir al-Baghawi, Tafsir al-Tabari, Tarikh al-Tabari | rulings, tafsir, sira, history | cleared | each book downloaded whole to the owner's PC and searched there; a page is quoted briefly with its link. The books are not in this repository. | usul.ai's terms; the texts belong to their publishers |
| usul.ai: any other book, at a page pinned to its printing | reports and sayings outside the nine | provisional | searched online; shown with "Book not yet reviewed by a specialist" unless the owner confirmed it in review | usul.ai's terms |
| al-Maktaba al-Shamela (shamela.ws) | confirming a page of a verified book | provisional | linked | the site's terms |
| aldiwan.net | a recited line of poetry: the oldest record found | provisional | searched; the line quoted with its link | the site's terms |
| Fatwa bodies: the Saudi General Presidency of Scholarly Research and Ifta (alifta.gov.sa), Dar al-Ifta al-Misriyya, the International Islamic Fiqh Academy (iifa-aifi.org), IslamQA, the Islamweb Fatwa Centre | rulings: what the bodies ruled | provisional | found by web search; quoted briefly with a link | each site's terms |
| YouTube (official channels) | the clips and lessons being checked | n/a | the YouTube Data API reads a video's title, length and channel; Gemini listens to the video | YouTube Terms of Service and API Services Terms |
| The 27 library clips in `runs/` | the first run's test set | n/a | each clip's teacher credited by name; their sound and stream addresses are not in this repository | the creators' rights; permission is asked before any public release |

## 2. Services and AI models

| Service | Used for | Model or version | Terms |
|---|---|---|---|
| Anthropic API | the small questions, the second looks, gate 1 | `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-4-5` | Anthropic Commercial Terms of Service and Usage Policy |
| Google Gemini API (AI Studio) | the listen: each quote and its moment | the Gemini Flash models named in the listening script (`gemini-3.5-flash` to `gemini-3.8-flash`) | Gemini API Additional Terms of Service |
| YouTube Data API v3 | a clip exists, is public, and is at most 3 minutes; the channel's description | v3 | YouTube API Services Terms of Service |
| Supabase | the database behind the Checker tab: requests, private results, limits | hosted Postgres | Supabase Terms of Service |
| Mux | the app's own clips (the 5 Oct run read their sound) | n/a | Mux Terms of Service |

## 3. Software and libraries

| Name | Version | Licence |
|---|---|---|
| Node.js | 22 or later (tested on 24.18) | MIT |
| curl | any recent | curl licence (MIT-style) |
| @anthropic-ai/sdk | 0.131.0 | MIT |
| @supabase/supabase-js (auth-js, functions-js, postgrest-js, realtime-js, storage-js) | 2.117.2 | MIT |
| @supabase/phoenix | 0.4.5 | MIT |
| @babel/runtime | 7.29.7 | MIT |
| @stablelib/base64 | 1.0.1 | MIT |
| iceberg-js | 0.8.1 | MIT |
| json-schema-to-ts | 3.1.1 | MIT |
| standardwebhooks | 1.1.1 | MIT |
| ts-algebra | 2.0.0 | MIT |
| fast-sha256 | 1.3.0 | Unlicense |
| tslib | 2.8.1 | 0BSD |
| tsx (runs the listening script) | via npx | MIT |
| IBM Plex Sans Arabic and IBM Plex Mono (the review pages, loaded from Google Fonts) | n/a | SIL Open Font License 1.1 |

The library list is read from `checker-worker/package-lock.json`.

## 4. Our own work

The code written by the team, the rules (`pipeline/sheets/`, `pipeline/record-model.json`), the review decisions, the Minka Asalam name and the mark (`assets/minka-asalam-mark.png`): all rights reserved, read and run for evaluation only (`LICENSE.md`). The code was written by the project owner with AI coding assistants (Claude).
