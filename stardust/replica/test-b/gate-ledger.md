# Gate ledger — /test-b home replica (broadridge.com), 2026-08-25

Prototype: `stardust/prototypes/test-b-home.html`, authored from scratch per
replica Phase 3(b): measure first (`stardust/replica/test-b/measurements.json`,
two probe passes at 1440 AND 360), author second. No DOM copying, no
page-level CSS porting. Typekit kit CSS same as live (use.typekit.net/xmw3hcn.css —
verified byte-identical font URLs to the site's self-hosted kit copy).

## Final results

| breakpoint | pixel diff | height Δ | content-diff | visual-diff |
|---|---|---|---|---|
| 1440 | **3.55%** (bar ≤10%) | **4px** (bar ≤8) | **0 structural 🔴** (329/329 nodes, 7/7 headings, 24/24 CTAs, 16/16 img; 1 justified 🟠) | 3 justified advisories |
| 360 | **5.56%** | **2px** | **"Findings: none — content + roles match"** (329/329) | 3 justified advisories |

## Instrument defects found and fixed (before any prototype credit)

1. **F-B2 — standard-headers CORS font kill.** `live-session.mjs` forced the
   anti-bot header set on EVERY request via `extraHTTPHeaders`; cross-origin
   CORS-mode font fetches (use.typekit.net) became non-simple and died with
   `net::ERR_FAILED`, so ALL live captures (and the first measurement pass)
   silently rendered fallback sans — an asymmetric false measurement (the
   prototype side loaded the same kit fine). Fixed in the project copy of
   `scripts/diff/live-session.mjs`: headers now ride on `document` requests
   only (bot managers fingerprint the navigation request). Verified:
   `document.fonts.check('16px freight-sans-pro')` false→true under the
   hardened context. Live captures + measurements retaken (live doc height
   6669→6518 @1440, 9024→8636 @360; 6518 matches the extract-era screenshot
   exactly). **Candidate for upstreaming into the diff skill.**
2. **Un-lifted text-rendering mode.** Live sets `text-rendering:
   optimizespeed` (kerning/ligatures OFF), `-webkit-font-smoothing:
   antialiased`, `font-synthesis: none`, `font-variant-numeric: lining-nums
   proportional-nums` globally. The prototype's default kerning rendered every
   line ~1% narrower → systematic one-line-fewer wraps (top-tabber intro 6 vs
   7 lines at 360, phone-CTA width-probe fork at 1440). Lifted onto the
   prototype body; wraps now match.

## Iteration history (pixel probe)

1440 (4 runs; runs 1–2 measured the instrument-defect state, not the page):
- iter1 8.31% Δ103 → font-fork diagnosis → instrument fix F-B2, live retake
- iter2 6.09% Δ−62 → analyst missing section padding (py-48), contact left
  column not direct grid children (588px/auto rows, form spans 2 rows),
  form row gaps 40/32/48, footer nav item type 16px/1.3 mb8, hr/websites
  block heights — all re-lifted from corrected live measurements
- iter3 4.64% Δ4 → band table: analyst grid 64px left-shift (wrap padding
  64px vertical-only → 64px all sides)
- iter4/final **3.55% Δ4** — all bands <15%

360 (6 runs; the breakpoint budget overran the 3-iteration cap by 3 —
runs 1–2 predate the kerning lift (defect #2, discovered at this breakpoint),
runs 4–6 were single-fix arithmetic passes off live-measured anchors):
- iter1 17.60% Δ226 → container-1184 mobile padding 24 (not 8; live headings
  wrap at 312px), hero side-card min-heights 234/266 (in-flow media aspect),
  featured grid gap 16, analyst mobile section padding 32
- iter2 9.25% Δ−29 → mobile `text-group` gap is 16 (vs 8 desktop; explains
  systematic +8/card), top-tabber intro 24px w/ 32px gaps, photo card 406px
  (not stale 470), insight slide min-height 451, footer triggers 52px,
  social icons 50px
- iter3 9.13% Δ−114 → text-rendering lift (defect #2) widened text; junction
  fixes: side-tabber hidden-panel column phantom 32px grid gap → 0, analyst
  sub gap 16, analyst wrap pt 24
- iter4 6.73% Δ−34 → live-measured form row gaps (40 base, 32 on rows 2/7/8),
  disclaimer lh 1.5, phone rows natural height (only NA row wraps to 48),
  footer inner gap 20
- iter5 5.93% Δ−18 → footer right column double margins removed, websites gap
  40, accordion trigger padding 11px
- iter6/final **5.56% Δ2**

## Justified flags (permanent)

- 🟠 content-diff @1440: width-probe fork on cta "+65 31 351 278" (−13%).
  Both sides render freight-sans-pro; direct rect probe shows live 111px vs
  build ~110px at identical computed styles (18px/400). Probe artifact of the
  line-matching, not a face substitution. (360 run reports findings: none.)
- visual-diff both widths: 3 STRETCHED IMAGE advisories (insight card images
  and IMG-ABS-018.jpg) — intentional `object-fit: cover` crops that mirror
  the live rendering exactly (live uses `aspect-[3/2]`/`card__media-cover`).

## Residuals (pixel, explained)

- 1440 y4000–4500 10.8%: high-frequency JPEG edge AA on the architecture
  photo (IMG-ABS-018.jpg) + ~10px sub-band text offsets + the live-only
  OneTrust floating cookie button (bottom-left, repeats at every stitch
  chunk seam ≈0.1–0.3%/band). Cause: AA/offset ghosting, no structural delta.
  Inherits: none (accepted).
- 1440 y5500–6000 7.9%: same ~10px offsets in the form card + 4px tail crop.
- 360 y2000–2500 8.9% and y7000–8000 10–13%: insight-slide photo content AA
  and footer white-on-navy text sub-line offsets (±10px), plus cookie floater
  seams. No structural deltas.
- Footer stock ticker: live renders the unpopulated JS state ("BR (NYSE)" +
  both arrows, no price) under the headless instrument; replicated as
  captured per capture-state policy. On a real browser live shows a price the
  replica won't — flagged for delivery (`user` decision whether to wire a
  ticker; the EDS page keeps the captured state).

## Live-hit budget

Live stitches taken twice per breakpoint (once poisoned pre-F-B2, once after
the hardening change — retake sanctioned by "capture hardening changed").
content-diff ×4, visual-diff ×2, measurement probes ×~10. Site showed no
bot-management pressure (no challenges observed).

## EDS conversion (/test-b, published 2026-08-25)

Delivery: DA doc `/test-b` (+ isolated fragment copy `/fragments/contact-us-test-b`)
uploaded via DA source API; code on `main` (commits 7582a78..): `styles/test-b.css`
+ `scripts/test-b.js` loaded ONLY when template metadata = `test-b` (same gating
pattern as the existing cit mini-canon); `scripts/scripts.js` gained the 6-line
gated hook. No block CSS edited; /index untouched. Isolation verified: only
/test-b carries `template: test-b`; local render of /index with the new code
shows body class `landing` and no test-b.css request.

### Final gate — live www.broadridge.com vs https://main--broadridge--paolomoz.aem.page/test-b

| breakpoint | pixel diff | height Δ | verdict |
|---|---|---|---|
| 1440 | **6.89%** | **4px** | PASS |
| 360 | **9.86%** | **27px** | PASS |

(After the hero picture-layer fix below — earlier published runs measured
7.21%/11.38% before it; the fix pulled 360 under the bar.)

content-diff (EDS vs live, 1440+360): 17 structural 🔴, ALL the same class —
**block-model granularity artifacts** (#87 JOIN/SPLIT + role parity): live wraps
whole cards in a single `<a>` ("PRESS RELEASE Payward…", awards cards,
side-tabber panels) where the EDS blocks emit badge-eyebrow + separate title
link; live tab labels are plain `<button>` text where EDS panel titles are
links. Verified: every "missing" CTA's href exists in the build on the title
link, and the text concatenates (badge + title). Confirmed-justified.
NAVIGATE h2→h1 corrected via test-b.js (matches live's h1).

### Publish-pipeline deltas found at the final gate (fixed)

- aem.page wraps images in `<p><picture>` (the local harness serves raw `<img>`):
  top-tabber panel grid placement had to target the wrapper (`p:has(picture)`),
  outweighing the badge-desc rule's 5-class specificity.
- Same wrapper class in the HERO: the base paint-order rule makes the wrapping
  `<p>` position:relative, so the absolutely-positioned img collapsed into a
  0×0 paragraph — main-card background SVG and the REPORT card artwork
  vanished, and the empty flex child spread the card text. Fixed by making
  `p:has(picture)` the full-bleed background layer (absolute inset 0, z 0).
  Also: badge `<p>` line box 32px→20px (display:flex, line-height 1), live
  gaps restored (badge→title 8 desktop/16 mobile, title→arrow 16), which
  un-clipped the top card's arrow (it was overflowing the 199px card).
- The metadata-only trailing section renders as an empty `.section` div with
  2×48px padding on aem.page → hidden via `.section:not(:has(*))`.
- Footer picture wrappers added line-box height (logo/social) → line-height 0.

### EDS residuals (360, documented; 1440 warm bands same class as prototype's)

- side-tabber section −72px vs live (accordion row/desc internals of the shared
  tabs block at mobile).
- footer internals ±(ticker values nondeterministic on live — populated in some
  captures, empty in others; legal-link row grouping; websites row pitch).
- hero side card 2 +16px (badge paragraph line box).
- contact phone rows: live uses a region-label column (124px); the fragment
  renders them as inline copy — same text, different layout (~40px/row zone).
- The archetype prototype (stardust/prototypes/test-b-home.html) remains the
  gated source of truth: 3.55% / 5.56% with 0 structural red and content+roles
  matching at both breakpoints.

### Post-review fix round (user-flagged hero deltas, 2026-08-25 PM)

User flagged four first-section differences: main-card background image,
bottom-right card background, top-right card arrow, right-card text
positioning. All four were one root cause — the aem.page `<p><picture>`
wrapper collapse described above — plus the badge line box. Fixed in
`styles/test-b.css` (commit "test-b hero: picture-wrapper as bg layer…").
Verified on the published page: badge 192/20, titles y529, CTA y532 — all
matching live to ≤8px.

Second user-flagged delta: featured-solutions icon positioning. On aem.page
the base cards rules survived over the test-b overrides for the icon image:
`max-height: 200px` clamped the 356px icon, `object-fit: contain` +
`padding-top: 16px` shrank it inside the clamped box — only a sliver of the
icon reached the 204px window. Fixed with explicit `max-height: none;
object-fit: fill; padding: 0`; published icon now measures 356×356 at
x176/y690, exactly the live-measured crop.

Final published gate after both fix rounds: 1440 **6.89% Δ4** PASS,
360 **9.86% Δ27** PASS.

### Post-review fix round 3 (2026-08-25 evening)

1. **Analyst CTA / light-blue box (user screenshot):** investigated and NOT
   reproduced by any instrument. Live measured fresh at 1440, 1920, and 1000px
   plus the stitched gate capture: the "Explore all analyst coverage" CTA
   renders BELOW the award cards on the grey page background — identical to
   /test-b. The user's screenshot (Celent card extended behind the button)
   appears to be an A/B or cookie/geo variant the headless instruments are
   never served. Recorded as not-actionable; revisit if the variant becomes
   the served default.
2. **Footer parity** via scoped fragment `/footer-test-b` (wired with the
   `footer` metadata override — the shared `/footer` doc untouched): social
   ICON images (live PNGs) instead of text links; stock ticker rendered as a
   static replica of the populated live state ("BR 185.45 ↑ 3.27%", green
   arrow, BR underlined) — note the headless live capture shows the
   UNPOPULATED ticker, so the pixel gate carries a small permanent delta
   here in exchange for matching what real browsers show; websites +
   copyright moved to the bottom-left column (live layout; at mobile they
   reorder after the legal links via display:contents + order); link columns
   flex to natural width (no "Manage email preferences" wrap).
3. **Hover/transition parity**, probed live per component (hover diff of
   computed styles) and replicated scoped:
   - light cards (featured): hover bg #f2f2f2 + shadow 0 0 1px/#000c3626,
     0 8px 16px/#000c361a + arrow translateX(12px); transition all .15s
     cubic-bezier(.4,0,.2,1)
   - dark insight cards: hover bg #000c36 + same shadow/arrow
   - hero side cards + awards cards + side-tab panel: arrow slide only
     (probe showed no bg/shadow change on live)
   - "Let's go": hover bg #e7f1fc; primary buttons + header Contact us:
     hover bg #0f3db5 (source .cta-primary:hover)
   - side-tab labels: hover color #0f3db5, transition all .5s
   - top-tabber Explore links: hover color #6ca5fe (.cta-link:hover)
   - card titles keep their color on hover (suppressed base cards.css blue)
   - featured icons: live has transition but NO hover/entrance transform
     (probe + source CSS) — none reproduced
   Verified on published page: featured-card hover measures bg 242/242/242,
   live shadow, arrow matrix(+12px).

Final published gate after round 3: 1440 **6.89% Δ9px**, 360 **9.89% Δ61px**
— both under the 10% bar; the height-Δ growth vs round 2 is the deliberate
populated-ticker/footer trade-off above.

### Post-review fix round 4 (header + tab motion)

1. **Header parity** (user screenshots): live caps BOTH header bars at the
   1312 container at every scroll state (page shows through the sides) —
   /test-b rendered full-width bars. Fixed: navy bg moved to the utility UL,
   white bg to .nav-main, wrappers transparent. Added the utility bar's
   vertical divider before Search and the magnifier icon (masked SVG);
   nav item gap 32 and chevrons re-aligned (7px, vertically centered,
   proper text gap).
2. **Tab motion** (probed live source CSS): the 3px blue underline is a
   sliding "activator" (`left/width` transition .5s cubic-bezier(.4,0,.2,1))
   — reproduced via a template-gated `.testb-activator` element positioned
   under the aria-selected tab by test-b.js (click + resize reposition).
   Panel switches fade in .5s (testb-fade keyframes on the un-hidden panel,
   both tab variants). Top-tabber panel text group now centers as a unit
   against the image (1fr/auto/auto/auto/1fr row sandwich — the spanning
   picture no longer stretches the text rows apart). Verified on published:
   click Wealth Management → activator slides to left 673px width 220.5px,
   panel fades in.

Final published gate after round 4: 1440 **6.81% Δ9px** PASS,
360 **9.89% Δ61px** PASS.

## Page 2 pilot — /test-b-asset-management (2026-08-25 evening)

Method validation for scaling: reuse the migration's content skeleton + the
test-b template infrastructure; measure-first for the four NEW modules only
(hero-general, c2-text-slider ×2, key-stats, bento-grid-four-plus-one —
probe: measurements-am.json at 1440+360); side-tabber/insights/contact/chrome
reused from the home replica for free. No standalone prototype (sibling-tier:
same module vocabulary) — authored the DA doc directly and gated the EDS page.

Content fixes vs the old migrated doc: un-tripled key-stats, restored both
text-slider slide sets (old doc reduced them to bare banners), added 5 missing
side-tabber descriptions, removed a fabricated insights CTA (live AM shows
slider controls instead — bullets + round arrows at DESKTOP for 5+ slide
insights, now generalized in test-b.js/css), per-page slide heights
(home 429/451, AM 402/424 — variant via :has(>div:nth-child(5))).

New structural findings (recorded for page 3+):
- Adjacent white wraps need explicit 96px junction margins (48px margins
  collapse); the junction selectors must repeat the :has() of the wrap rule
  they outrank; mobile junctions are 64px.
- Module wraps: white (slider/stats), tint (bento), transparent hero band
  bleeding behind the header (margin-top:-118px + pt 182/150).
- Live slide-height and type specs are PER-PAGE (hero h1 56/40px,
  intro 24px both breakpoints) — measure, don't assume the home values.

### Final gate — live /who-we-serve/asset-management vs published /test-b-asset-management

| breakpoint | pixel diff | height Δ | verdict |
|---|---|---|---|
| 1440 | **7.19%** | **1px** | PASS (6 iterations) |
| 360 | **18.87%** | **177px** | over bar — residuals: hero/side/insights ±30-70px mobile text-wrap offsets (same class the home 360 pass closed in its rounds 4-6); needs one more mobile pass |

Effort comparison: home archetype ≈ 20+ gate runs including instrument
repairs; this sibling page ≈ 9 runs with desktop landing at home-parity —
the banked chrome/tokens/traps did the rest.

### AM round 2 — functional carousels + slide titles + bento hovers

Playwright behavior analysis of the live "Serving the industry…" module
(probe-am-carousel.mjs): 4 slides ×373px at 405.33px pitch in a clipped
1184px viewport; next/prev = wrapper translateX ±405.33 with .3s ease;
2 dash bullets; 50px round arrows (disabled = grey border); slider 1
(3 slides) and key-stats LOCK at desktop (controls hidden — swiper-lock);
slides carry TITLES the old migration dropped ("Asset Managers",
"Alternative Asset Managers", "Fund Administrators", "Asset Owners") —
restored in the doc; slide spec: border-left 1px #bad1f5, pl24 pt8,
gap 12, title 24/31.2, desc 18/23.4 (mobile slide 312/gap 16; stats
mobile slides 257 with peek).

Implemented as one generic scroll-carousel in test-b.js (buildCarousel):
arrows drive scrollTo({behavior:'smooth'}) on the already-overflow-hidden
containers — no DOM restructuring for stats/insights, swiper-lock semantics
fall out naturally (controls auto-hide when content fits; re-rendered late
for post-decoration layout). Applied to text-sliders, key-stats, and
insights (home insights: 4 slides fit at desktop → locked, exactly live).
Verified on published: sl2 = 2 bullets, click → scroll 404px (live 405.33),
bullet 2 activates, prev enables; insights = 5 bullets (= live).

Bento hovers (probed): sub-cards → bg #bad1f5, title+arrow → #2662fc,
shadow, arrow 10→12px; photo card → shadow only. All in test-b.css.

Published gate after round 2: 1440 **8.68% Δ84** PASS (delta is the live
capture's pre-interaction state vs richer control UI + ±small text offsets);
360 **25.11%** — mobile pass still pending (known ±30-70px wrap offsets +
carousel mobile layout tuning; queued).

## Autonomous wave run (2026-08-25/26) — fleet status

Eight review pages live under /test-b-* (template-gated, production untouched).
Published desktop (1440) gates vs live; mobile (360) where run:

| page | 1440 | Δ | 360 | notes |
|---|---|---|---|---|
| /test-b (home) | **6.89% PASS** | 9 | **9.89% PASS** | complete incl. motion |
| /test-b-asset-management | **8.66% PASS** | 84 | 14.30% Δ76 | carousels live |
| /test-b-capital-markets | **8.76% PASS** | 113 | 26.25% | media/video module |
| /test-b-wealth-management | **9.83% PASS** | 4 | 15.27% | b1 banner |
| /test-b-issuers | 12.32% | 3 | 22.28% | banner comp residuals |
| /test-b-consumer-industries | 10.13% | 106 | 24.37% | 12-stat carousel |
| /test-b-capability-wealth-advisor-solutions | 13.72% | 183 | — | archetype pilot (3 iters) |
| /test-b-pulse-study | 16.35% | 126 | — | archetype pilot (2 iters) |

Waves executed: W0 AM mobile (25.1→14.3%, stats rule conflict + contact
spacing); W1 four segment siblings via the new generator
(stardust/scripts/gen-testb-segment.py — parses saved live HTML into DA docs:
hero/slider/tabs/stats/bento×3/b1-banner/media-video/insights/download-form
handlers, entity-unescape, content recovery of dropped titles/descriptions);
W2 pilots for the capability and insights-campaign archetypes.

New reusable findings this run:
- Insights slide height = natural content + 16px universally (replaced all
  per-page min-heights with one arrow padding rule; verified home/AM/CM,
  desktop+mobile).
- bento-six rows minmax(282px/226px, auto); card-grid keeps a 48px reserved
  controls row even when locked (swiper-lock reserves space).
- Oversized-SVG 409: content-bus rejects docs whose images resolve to >40KB
  SVGs at PREVIEW time with an opaque "error from content-bus" 409 —
  binary-searching sections + a known-good doc on the same path isolates it;
  rasterize to PNG on DA /media/ (pulse-study hero, 583KB svg).
- Wrap-junction margins list must grow per module pair (grid-navy, bento-six,
  columns/media-card, b1-banner combos added).

Queued (not run): mobile passes for W1/W2 pages (same ±wrap-offset class),
issuers/ci desktop residuals, press-release/about/article(sidebar-layout)
archetype pilots, W3 bulk fan-out per proven archetype, locale + /cit.

Tooling banked for the fan-out: gate.sh (one-line gates), anchor.mjs
(generic section-box probe), gen-testb-segment.py (archetype doc generator),
probe scripts for carousel/hover analysis.
