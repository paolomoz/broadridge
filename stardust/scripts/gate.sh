#!/bin/bash
# gate.sh <slug> <live-url> <page-url> <width> [iter-label]
SLUG=$1; LIVE_URL=$2; PAGE=$3; W=$4; LBL=${5:-iter}
DIR="stardust/replica/gates/$SLUG-$W"
mkdir -p "$DIR"
[ -f "$DIR/live.png" ] || node scripts/replica/stitch-shot.mjs "$LIVE_URL" "$DIR/live.png" --width $W --settle >/dev/null 2>&1
node scripts/replica/stitch-shot.mjs "$PAGE" "$DIR/eds.png" --width $W >/dev/null 2>&1
node scripts/replica/pixel-compare.mjs "$DIR/live.png" "$DIR/eds.png" --out "$DIR/diff-$LBL.png" 2>&1 | grep -E "differing|height delta|A [0-9]+x" | head -3
