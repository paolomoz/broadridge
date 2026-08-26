# Defect ledger — broadridge.com replica, fidelity pass 2 (2026-08-25)

Every defect found in the user's faithfulness assessment, with verified root cause
and the evidence that proved it. All fixed in commit `ca15218`.

| # | defect (visible symptom) | verified root cause | evidence | class |
|---|---|---|---|---|
| 1 | NAVIGATE + hero copy rendered grey, CTA looked disabled | **Paint order, not color**: absolutely-positioned decorative img (opacity .5) painted above static text siblings in the same cell. Computed color WAS `rgb(255,255,255)` | `dbg-hero.mjs`: `elementFromPoint` at headline position returned `IMG`; computed styles all correct | stacking/occlusion — invisible to style inspection |
| 2 | Hero panel offset ~55px down/right, too narrow | Guessed geometry vs captured: live container 1312px, cols 876/420, gap 16, content top-anchored 56/64px inset; replica used container-wide + centered flex | `measure2.mjs` rect probe: live NAVIGATE y=232 x=128, EDS y=288 x=168; panel w 876 vs 768 | unmeasured geometry |
| 3 | Label chips plain text (hero, insights) | Chip treatment (solid `--c-blue` bg, white text) never authored; source `.badge` styles not lifted | live vs EDS crops | missed component state |
| 4 | Arrows missing on every card type | Source cards carry an SVG arrow glyph; importer dropped SVGs, CSS never re-added affordance | source DOM `card__cta svg`; crops | dropped affordance |
| 5 | "Powering the pulse" panel stacked text-above-image | Grid auto-placement; live is media-left/text-right; panel "Explore …" link + section intro copy dropped by `t_tabs` | crops; importer code | transform gap |
| 6 | Awards grid 3-col, tints lost, photo shrunk | Authored 3-col + white cards; live is 2-col, photo card spans rows full-bleed, side cards `--c-blue-tint` | crops | unmeasured geometry |
| 7 | Header nav top-aligned two-row look | `.nav-sections` content not vertically centered within the 80px row after `.nav-main` restructure | crops; fixed via flex align rules | CSS regression from restructure |
| 8 | Utility bar stayed pinned on scroll | Live scrolls the 38px utility bar away (sticky main bar only); replica fixed the whole wrapper | stitch seam pattern; live behavior | unobserved scroll-state morph (the exact class `recreation-procedure.md` § Fixed and sticky chrome warns about) |
| 9 | Form band: form left, intro copy missing, literal "contact" text visible | (a) no 2-col layout; (b) `gen-fragments` matched the hidden contact **modal** section first, and intro copy is a `<span>` not `<p>`; (c) form block rendered its own config cell | fragment content dump; source DOM probe | wrong-source-node + config leak |
| 10 | Footer links flowed horizontally | Legal-row selector `footer .footer > div:last-child ul {display:flex}` over-matched after fragment wrapping added a container div — hit every footer ul | `dbg-footer.mjs`: `ulDisplay: "flex"` | selector scope vs decorated DOM |
| 11 | Footer social as text | gen-chrome deliberately emitted text names; source uses icon imgs | source DOM | transform shortcut |
| 12 | "Explore all insights/analyst coverage" plain links | Importer emitted bare links; EDS buttonization requires `<strong>` wrap | boilerplate `decorateButtons` contract | authoring-convention miss |

**Gate metrics:** home 1440: 27.5% → 22.3% with height Δ 299→44px (remaining diff is
sub-30px AA/offset ghosting distributed across sections, no structural deltas).
Fixed-header seam repeats inflate the % on both sides.

**Meta-observation:** 6 of 12 defects (1, 2, 6, 8, and the two earlier height blowups —
hero pt=168, article 24px/778px type) were **measurable facts about the live page**
that guessing missed and a single live-DOM probe resolved instantly. None were
findable in the captured JSON alone.
