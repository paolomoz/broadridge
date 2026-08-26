# Broadridge → EDS migration — handoff

**State: DELIVERED AND LIVE — https://main--broadridge--paolomoz.aem.live/**
(Repo created with the PAT per user instruction; code synced; all content published.
`./deliver.sh` is now only a re-run/repair tool.)

## What's live where

| artifact | location | status |
|---|---|---|
| DA content — **2,223 docs, 0 failures** (incl. locale index aliases, 59 rasterized SVG→PNG media) | https://da.live/#/paolomoz/broadridge | ✅ uploaded + published |
| EDS code repo | https://github.com/paolomoz/broadridge | ✅ pushed, Code Sync active |
| Redirects — **4,133 rules** (240 inventory 301s + 1,958 legacy-sitemap sources × slash variants) | `/redirects.json` | ✅ published, verified |
| Query index config | `broadridge/helix-query.yaml` | ✅ in repo |
| Delivery script | `./deliver.sh` | kept for re-runs |

## Scope delivered

- **2,207 of 2,208 pages** migrated (us-en 1,507 + de 656 + jp 670 + cit 17 approx.;
  1 cit form-widget fragment had no parseable body — logged in `stardust/migrated/_import-failures.json`).
- **Templates:** landing, segment, capability, press-release, article/insight,
  legal/static, listing, form, hub, cit (own mini-canon `styles/cit.css`).
- **21 blocks** incl. dynamic: `listing (press)` (1,305 releases, year facet + text filter),
  `listing (insights)` (category facet), `search` (client-side over query-index,
  replaces /search-results + /product-search), `insights` rail with Tier-1 index enrichment.
- **Chrome:** two-tier mega header + mega footer per locale (`/nav`, `/footer`,
  `/de/...`, `/jp/...`, `/cit/...`), fragments (`/fragments/contact-us`,
  `/fragments/about-broadridge` × 3 locales).
- **Martech:** Google Consent Mode v2 (source-identical denied defaults) + consent
  banner replica → GTM-PW7DJ8 (always, consent-gated) → Qualified chat post-consent.
- **Forms:** lead + gated-download blocks with the captured field set; posts to
  `meta[name=form-endpoint]` when configured + dataLayer `form_submit` event.
- **Fonts:** FreightSans Pro via Typekit kit `xmw3hcn` (self-served kit CSS,
  files from use.typekit.net under Broadridge's license).

## Fidelity evidence (stardust/replica/)

- `gates/home-1440/`, `gates/press-1440/` — stitched live-vs-replica pixel diffs.
  Press archetype: 28% → **16.0%** in 3 instrument-driven iterations; home: 43% → **24.7%**
  (residuals: ~40px vertical drift ghosting, hero composition). Height deltas ≤ ~300px
  on 6,500–7,700px pages. All remaining hot bands are text-offset ghosting, not
  structural divergence. Mobile 360 visually verified.
- `progress.json` — per-archetype gate ledger. `inconsistency-register.md` — the 8
  permitted deltas (R1 media hotlinking, R2 Typekit allowlist, R6 form endpoint are
  the open ones to close before go-live).

## To finish (after re-auth if DA token expired)

```bash
./deliver.sh
```

Creates `paolomoz/broadridge` from aem-boilerplate, force-pushes the replica code,
registers Code Sync, waits for `/scripts/aem.js` 200, bulk previews + publishes all
2,219 paths, smoke-checks home/press-hub/query-index.

## Post-launch follow-ups (from the register)

1. **R1** media rehost: images/posters currently hotlink www.broadridge.com.
2. **R2** Typekit: add aem.page/aem.live (or production domain) to the kit's domain allowlist.
3. **R6** form endpoint: point `meta[name=form-endpoint]` (site-wide via metadata) at a
   Worker or the marketing-automation REST hook; GTM currently captures submissions as events.
4. Deferred design items: `stardust/prototypes/home-improvements.md` (alt-text pass,
   modular scale, logo variants) — explicitly out of scope under the exact-replica direction.
