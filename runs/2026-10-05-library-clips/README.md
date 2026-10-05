# Run of 5 October 2026: every clip in the app's library

Challenge day 2. The owner's call: every clip in the library is placed on the map and checked first; the full lessons follow if time allows. Nothing here was written to the app's database by the checker. The owner reviews every line first.

## What happened, in order

1. **Sound.** The 27 live clips are stored in the app's own video store, not on YouTube. Each clip's sound was joined from the store's audio-only stream into one file (`tools/fetch-clip-audio.mjs`). The sound files are the creators' content and are not in this repository; neither are the clips' stream addresses (`clips.json` lists id, title, credited teacher, languages and length).
2. **Listening.** Gemini listened to each clip once (`listening/tag-with-gemini.ts`, which learned on this day to take a local sound file beside a YouTube link) and returned two things: up to three places on the knowledge map, each with the sentence that justifies it, and every checkable statement cut by source unit (`listen/`). 19 clips ran on the free tier until every model's daily allowance was spent; the last 8 ran on the paid tier. One clip, a Qur'an recitation, was refused by Gemini's copyright filter; `tools/recite.mjs` asks for the surah and the first and last verse instead of the words (the owner's rule: a recitation's source names its surah and verse range). Result: Maryam 19:77-96.
3. **Placements.** The owner reviewed the proposed places on `placements.html` (accept / not this). His choices for 19 clips are live in the app; the rest are under review.
4. **Checking.** The checker in `../../pipeline/` (the starting version, unchanged) ran on the 25 clips that had something to check (2 had nothing quotable): one checker and one sceptic per clip, hadith looked up on dorar.net from the owner's own PC (dorar refuses cloud servers). The only change: `tools/build-batch.mjs` keeps up to 30 verses a claim (was 5) so a recitation shows its whole range. Two runs (18 clips, then 7): 50 agents, 0 errors, about 5.2 M tokens, 35 minutes in all.
5. **The two checks, both passed before anything is published** (`check/checks/`):
   - every dorar link and field as the tool printed it: no faults (28 links, 11 hadith claims);
   - every grading against its dorar page: 22 of 24 match word for word, 2 unclear because the page adds a note, 0 wrong.
6. **The review page** (`check/review.html`): 70 claims in 81 parts. 59 match their source, 1 corrected (a reward told without the hadith's condition of certainty, al-Bukhari 6306), 4 not found in any cleared source, 6 not claims. Four citations come from books outside the nine verified copies and are highlighted for the owner to confirm or refuse (his rule of 4 October).

## Next, committed as it happens

The owner's review decisions, then the records published from them.

## The owner's review (5 October, evening)

- **Placements:** all 27 clips reviewed; 50 topics accepted, 1 rejected; live in the app.
- **Sources:** all 70 claims decided (`review/claims/`): 65 accepted as the checker wrote them, 5 changed from his notes (a matching narration found, al-Tirmidhi 3393; a woven-in verse approved as a verse in that one case; three books confirmed, which joined the app's cleared sources). The poetry line (clip 11) was re-checked with the new poetry kind and accepted as the same meaning.
- **His rule for books outside the verified ones** (`review/book-rule.md`): a book confirmed in review shows no note; one not confirmed shows "Book not yet reviewed by a specialist" with the reason on tap.
- **The sources were not written into the app** (his decision): the reviewed records stand here and on the review page.
