# Stardust plugin improvements — proposed from the broadridge session (2026-08-25/26)

Scope: generic only. Every item below was hit on this project but is a property
of the instruments, the EDS pipeline, or the replica method itself — not of the
site. Ranked by expected benefit × confidence.

## 1. diff/live-session.mjs: scope the anti-bot headers to document requests (bug fix)

`extraHTTPHeaders` applies the standard header set to EVERY request, which makes
cross-origin CORS-mode subresource fetches (webfonts from Typekit, Google Fonts,
any font CDN) non-simple; they die with `net::ERR_FAILED` and every live capture
and measurement silently renders fallback type. This poisons the entire gate —
wrong wraps, wrong heights, wrong doc height — with no error anywhere. Field
evidence: live doc height moved 6669→6518 after the fix; a whole class of
"one-line-off" defects vanished.

Fix (validated in this project's copy): keep the full header set, but deliver it
via `context.route` on `resourceType() === 'document'` only — bot managers
fingerprint the navigation request, not subresources.

Companion hardening rule: **captures assert fonts loaded** (`document.fonts.ready`
then `document.fonts.check(...)` for any face the page declares) and fail loud
like the challenge detection does. A silent font fork is the same defect class
as silently measuring a Cloudflare interstitial.

## 2. replica/recreation-procedure.md § CSS lifting: add the text-rendering group

The lifting checklist names the type ramp but not the *rendering mode*. Sites
commonly set `text-rendering`, `-webkit-font-smoothing`, `font-synthesis`,
`font-variant-numeric`, `font-kerning` globally; a ±1% glyph-width difference
produces systematic one-line-fewer/more wraps that present as inexplicable
per-section height errors at every breakpoint. Add these five properties to the
step-2 token list, and add the diagnostic: when wraps disagree at identical
computed font/size/width, measure a literal string's rendered width on both
sides — it settles whether the fork is metric or layout.

## 3. replica + deploy: the final gate MUST run against the published origin

The local render harness understates deltas because the real pipeline transforms
markup. Three recurring, generic transforms to document (deploy skill or a new
"pipeline deltas" section in the replica reference):

- **Images get wrapped in `<p><picture>`.** If any base rule makes that `<p>`
  positioned, absolutely-positioned imgs collapse to 0×0 (backgrounds vanish)
  and the empty paragraph distorts flex/grid flow. Style `p:has(picture)` as
  the layer, and expect specificity fights with `:not()`-heavy base selectors.
- **Metadata-only sections render as empty `.section` divs** carrying full
  section padding (~96px of phantom height at the page tail).
- **Media URLs are rewritten to `/media_<hash>`** renditions with width params —
  size/ratio assumptions from the authored URL don't survive.

Rule of thumb proven here: a page that gates at X% on the harness lands at
X±(large) on aem.page until these are handled; only the published number counts.

## 4. deploy: fail-loud diagnosis for content-bus 409

`POST /preview` returning 409 "error from content-bus" is opaque. Two cheap
diagnostics worth codifying: (a) upload a known-good doc to the same path —
distinguishes path-state from content; (b) check every image URL referenced in
the doc for **SVG > 40KB** (hard pipeline limit; the failure is at preview
time, not upload). Remedy: rasterize to PNG on DA media. This turned a
dead-end error into a 3-minute fix.

## 5. replica: an "interaction parity" phase (optional, after the static gate)

The gate is static-pixels only; hover states, transitions, and slider behavior
are invisible to it, and users notice them immediately. Two probe patterns
proved cheap and general:

- **Hover diff**: for each component class, snapshot computed styles
  (bg/color/shadow/transform/border + sub-elements), hover via `mouse.move` to
  the box center (after overlay dismissal — overlays intercept the pointer),
  snapshot again, report the diff. Output is directly translatable to CSS.
- **Behavior diff**: click a control, sample the animated property mid-flight
  and settled (`transform`/`scrollLeft` + `transition-*`) — yields pitch,
  easing, and duration without reading the site's JS.

Also worth one paragraph: **Swiper-lock semantics** (the dominant carousel
library): controls hide when content fits the viewport; a scroll-based replica
(arrows drive `scrollTo` on the already-`overflow:hidden` container, positions
= round((scrollWidth−clientWidth)/pitch)+1) reproduces the whole behavior with
no DOM restructuring and auto-degrades to the static case.

## 6. replica: ship a section-anchor probe next to stitch-shot/pixel-compare

The band table says *where*; the fastest converging loop in practice was:
one generic probe printing `[y, height]` per top-level `main > section` (+
footer + doc height) for live and build, fix the first mismatched section
top-down, then re-run pixels. This cut iterations roughly in half vs
band-reading alone. It's ~40 lines (`anchor.mjs` in this project) and pairs
with a one-line `gate.sh` wrapper (stitch both sides + compare + grep the
verdict). Both are instrument-grade and site-agnostic.

## 7. migrate: run content-diff as per-page acceptance

The first-pass importer silently dropped slide titles, tab descriptions, and
stats copy; nothing caught it until the replica pass a day later. content-diff
already exists and classifies exactly this (missing headings/CTAs/body). Making
a scoped content-diff (or even just its node-count summary) part of migrate's
per-page acceptance would catch dropped-content bugs at import time, when the
importer can still be fixed cheaply.

## 8. recreation-procedure: two small doc additions

- **Wrap-junction margins.** Sites built as "cards on a canvas" (white/tint
  wrap sections on a page background) tempt the replica into margin-based
  boxes; adjacent margins collapse and every junction loses one section-pad
  (e.g. 96→48). Either keep transparent padded sections with an inner wrap, or
  document explicit junction margins — and note the selector-specificity trap:
  junction rules must match or exceed the `:has()`-based wrap rules they
  override.
- **Nondeterministic live elements** (stock tickers, dates, view counts):
  extend the capture-state policy — replicate structure, freeze a captured
  value, log as a permanent residual. The live capture itself varies run-to-run
  on these, so they can flip between "populated" and "empty" across gates.

## 9. source-fidelity-gate: iteration-cap bookkeeping for instrument-invalidated runs

The 3-iteration cap assumes valid instruments. When a run is later shown to
have measured an instrument defect (items 1–2 above), the ledger practice that
kept the discipline honest was: count the runs, but mark which measured the
defect state and exclude them from the cap — with the fix named. One sentence
in the iteration-discipline section legitimizes this without weakening the cap.

---

Explicitly NOT proposed (site-specific, excluded per the conservative bar):
module specs (bento/tabber/stats geometry), the "+16px slide" constant, badge
markup conventions, any color/type values, DA org/paths, the segment doc
generator (archetype-shaped, not generic).
