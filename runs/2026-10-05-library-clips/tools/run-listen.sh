#!/bin/bash
# Listens to every library clip not yet listened (result in the shared tmp folder), one tool call.
cd /d/Deeni/.claude/worktrees/dreamy-curran-f3073c
set -a; . /d/Deeni/mobile/.env; . /d/Deeni/.env; set +a
R="D:/Deeni Docs/curation/2026-10-05 Clip library run"
T="$(cygpath -u "$TEMP")/deeni-gemini"
FILES=()
for f in "$R"/audio/*.m4a; do id=$(basename "$f" .m4a); [ -f "$T/result-$id.json" ] || FILES+=("$f"); done
echo "to listen: ${#FILES[@]}"
npx tsx mobile/scripts/tag-with-gemini.ts "${FILES[@]}" --models=gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash,gemini-3.8-flash
mkdir -p "$R/listen"; for f in "$R"/audio/*.m4a; do id=$(basename "$f" .m4a); [ -f "$T/result-$id.json" ] && cp "$T/result-$id.json" "$R/listen/"; done
echo "copied: $(ls "$R/listen" | wc -l)"
