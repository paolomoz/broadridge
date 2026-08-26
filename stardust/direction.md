# Direction — Broadridge 1:1 EDS migration

_provenance: written by stardust:direct, 2026-08-24. Phrase supplied via
prepare-migration flow; scope decisions collected via structured questions._

## Phrase

> "exact replica — preserve the current Broadridge design system verbatim for a 1:1 EDS migration"

User's original request: *"build a 1:1 migration plan to EDS with Stardust for
https://www.broadridge.com/"*

## Restatement (dimensional vocabulary)

Zero-movement direction. This is a **platform migration**, not a redesign:
the target visual system equals the captured brand surface on every axis.
Success = pixel-faithful reproduction of the live site on Edge Delivery
Services, with content authored in DA and blocks reproducing the captured
component vocabulary.

## Movements

| axis | movement |
|---|---|
| expressive | unchanged (pinned — replica) |
| distinctiveness | unchanged (pinned — replica) |
| tone | unchanged (pinned — replica) |
| density | unchanged — preserve captured 48px section rhythm (user-pinned via "exact replica"; density question skipped: axis moved by phrase) |
| audience | unchanged — institutional financial-services segments |
| register | brand (inherited from current/PRODUCT.md) |
| ia-fidelity | **verbatim (user-pinned)** — same section sequence, same content beats, surface reproduced 1:1 |

## Mode detection

- Captured brand signal: **signal-strong** (8-color clustered palette, named
  family FreightSans Pro with 5 captured weights).
- Mode: **Mode A — brand-faithful**, replica sub-case. Palette and type
  pinned; no divergence-seed roll — every dimension is inherited by user
  instruction, so the seed is inert (recorded as such, not rolled).
- Rebrand triggers: none.

## Questions asked & answers (structured, 2026-08-24)

1. **Inventory scope** → Full us-en sitemap (1,044 pages).
2. **Locales** → **Include locales**: /de (701 URLs), /jp (674), /cit (18).
   /ca is retired (301 → root) — excluded, record redirect only.
   Total inventory ≈ 2,437 URLs before junk filtering.
3. **Direction** → **Exact replica** (chosen over "replica + hygiene fixes").
   Consequence: the Phase 2.5 improvements list is intentionally out of scope
   for rendering; known tensions are carried as observations for a
   post-migration uplift, not applied during migration.

## Divergence (brand-faithful replica mode)

```
decade           inert (replica)   → as-captured
craft            inert (replica)   → as-captured
register         inherited         → brand
ground-family    inherited         → stark-white (brand-native; pure #ffffff retained — brand_faithful_inversion)
font deck        inherited         → freight-sans-pro (Adobe Typekit; licensingFlag: private — verify license for EDS delivery)
palette          inherited         → captured 8-role set (hex retained; pure white + near-black retained — brand_faithful_inversions)
```

## Image-reuse contract

Active (Mode A). All captured media reused at identical semantic positions
via original URLs or local copies. Synthesized placeholders forbidden.
Signature preservation: home hero carousel (swiper), about-page Vimeo hero,
capital-markets Vimeo band must be reproduced, not flattened.

## IA priorities (locked — verbatim)

1. **audience-routing** — "Who we serve" segment nav is the primary journey;
   preserve as first nav group site-wide. locked.
2. **commercial-conversion** — "What's next for your business?" lead-form
   band above footer on commercial templates. locked.
3. **content-engine** — "Insights & perspectives" cross-promo rail on
   commercial pages. locked.
4. **client-access** — utility-bar login affordance on every page. locked.

## Command sequence

1. ~~$stardust extract~~ (done — 5-page discovery, vision-verified)
2. ~~$stardust direct~~ (this file)
3. $stardust prepare-migration — extract --prep (full 2,437-URL inventory,
   junk-filtered), direct --prep (type + module catalogs), prototype --prep
   (archetypes = replicas per template), assets prep, dynamic-blocks gate
4. $stardust migrate
5. $stardust rollout / deploy → EDS + DA

## Named assumptions

- Adobe Typekit license: Broadridge owns a Typekit seat; EDS pages will load
  the same Typekit kit (or self-host with license confirmation). Flagged
  `private` — verify before go-live.
- Third-party surfaces preserved as-is: Qualified chat, Vimeo embeds,
  lead-form backend, Workday careers links, OneTrust-style consent.
- Search (/search-results, /product-search) is a dynamic surface that EDS
  must re-implement or proxy — flagged for the dynamic-blocks gate.
- Locale pages replicate the same design system; language content is
  authored per locale (no machine translation in scope).

## Hands-off activation (2026-08-24T16:00Z)

User directive: "setup a new EDS repo with my personal skill and proceed with the migration of the site, IA and design high fidelity, content on DA, implement all the dynamic functionalities, integrations, APIs, query filters, dynamic lists, dynamic blocks and martech. do not ask my input because I will not monitor the session. stop only when full site is migrated." All gates auto-resolve per SKILL.md § Hands-off mode. CIT: own mini-canon (user-confirmed). Scope: full 2,208-page inventory incl. locales.
