# The Checker worker (التبيّن)

The Checker tab in the Minka Asalam app lets a signed-in tester paste a YouTube link to a short clip (up to 3 minutes) and get back, for that person only, **counts** ("5 quotes: 4 with a source, 1 not found") and one row per quote with its source. Nothing is published about the clip or its speaker.

This folder is the part that does the checking. It runs on the owner's PC, because dorar.net (the hadith encyclopaedia) answers a home internet line and refuses data-centre servers (measured 4 Oct 2026: the PC 72 of 72, the Anthropic cloud 0 of 8).

## How a check runs

The app writes a request into the database (`checker_runs`, migration 247). The worker only reaches **out**: every 5 seconds it asks the database for the oldest waiting check. Nothing on the PC is opened to the internet. While the PC is off, requests wait, and the app tells the person the Checker will answer when it is back.

| Step | What happens | Time | Cost |
|---|---|---|---|
| 1 | YouTube's data service: the clip exists, is public, is at most 3 minutes | seconds | free |
| 2 | **Gate 1:** a very small model (Claude Haiku) reads the title, the description and the channel's own description: is this Islamic content? Only a clear "no" is refused, and it does not count against the person's three a day. The channel is never a reason by itself. | seconds | about 0.1¢ |
| 3 | **The listen:** Gemini listens to the clip and writes each quote with its moment, cut by source unit (`D:/Deeni/mobile/scripts/tag-with-gemini.ts --claims-only`); the canonical verse text comes from quran.com (`src/build-batch.mjs`) | about a minute | about 5¢ |
| 4 | **Gate 2:** nothing to look up → stop, not counted | instant | — |
| 5 | **The engine** (one setting, `CHECKER_ENGINE`; Checker 3 since 6 Oct): Checker 2 or Checker 3, below | minutes | most of the cost |
| 6 | **The two automatic gates** of the library run: no dorar link, grade or quote the dorar tool did not print (`check-dorar-links.mjs`), every grade equal to its dorar page (`check-gradings.mjs`). A failing quote becomes "pending", never shown with an invented source. | about a minute | free |
| 7 | The counts and rows, written for that person only, stamped with the engine and the rules version | instant | — |

### The engines

- **Checker 2** (`src/checker2.mjs`) is the checker as it stood on 2 October (`pipeline/`), the one the 27 library clips ran on and the owner reviewed on 5 October. Its own workflow script `pipeline/claims-workflow-v2.js` is executed **unchanged**: the checker's and the second reviewer's prompts, rules and output schema are the reviewed ones. Only the way each helper runs differs: `src/agent.mjs` calls Claude Opus 5.5 through the API.
- **Checker 3** (`src/checker3.mjs`) is the redesign from scratch (4–5 October): the script holds the steps and a model answers one small question at a time. First build: **verses** are compared with the Mushaf by script alone (`src/c3/verses2.mjs`); **hadith** go through the owner's branching tree (`src/c3/hadith.mjs`: Haiku asks where to look, the script searches dorar, Haiku picks, Opus looks second; what is left goes once more with Opus, Sonnet looking second); **everything else** goes to Checker 2, as the design's "big checker last".

### Safety on the PC

A clip's words are untrusted: anyone can upload anything. So the checking helper has **no shell**. It can read files only inside its own check folder, write only in a scratch folder, run only the checker's own Node tools (dorar, usul.ai, Shamela, continuation) with plain arguments, fetch only from the trusted source sites, and use Anthropic's server-side web search.

## Running it

```
cd D:\minka-asalam-checker\checker-worker
npm install
copy .env.example .env      (then put the two keys in .env yourself)
npm start                   (the worker; keep it running)
node src/check-one.mjs <youtube link> [--engine=checker3]   (one check from the command line, no database)
```

Settings (`.env`, never committed): `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. The Supabase address and the YouTube and Gemini keys are read from the app's own files on the PC. `CHECKER_ENGINE` (checker2 | checker3), `CHECKER_RUNS` (where each check's folder goes, default `D:/checker-runs/tab`).

## The limits (enforced in the database, migration 247)

3 checks per person a day, 30 a day for the app, $100 in total for 4–22 October. Signed-in accounts only, children's profiles excluded, and a tester code entered once per account.
