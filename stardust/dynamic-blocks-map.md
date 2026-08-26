# Dynamic blocks map — broadridge.com → EDS

_provenance: written by prepare-migration Phase 4.5 / replica delivery,
2026-08-24. Metadata contract authored at import time (every page's
metadata block), indexes in `broadridge/helix-query.yaml`._

## Listing blocks

| surface | block | mode | index | tier notes |
|---|---|---|---|---|
| /press-hub, /news-room press archives (en/de/jp) | `listing (press)` | **dynamic** — query-index, year facet + text filter | default index filtered `path~/press-release/` per locale | Tier 2: `publishdate` emitted per page (parsed from body dateline or URL year) |
| Insights hubs (/insight-pages/*, /broadridge-insights) | `listing (insights)` | **dynamic** — category facet + text filter | default index filtered by content-type paths | Tier 2: `category` emitted from URL segment (`/article/<category>/…`) |
| Site search (/search-results, /product-search) | `search` | **dynamic** — client-side over query-index (title+description) | default index | replaces the source's server search; parity = title/desc match, not full-text body |
| "Insights & perspectives" rails (142 pages) | `insights` | **static curated + Tier-1 enrichment** | — | Source rails are editorially curated; 1:1 fidelity keeps authored links. Block enriches missing card images from the index (Tier 1). |
| "Related products/solutions" cards | `cards` | **static** (Tier 3) | — | Many-to-many product relationships are not modeled as index fields; stays static until a `related` join field is authored. Recorded, not faked. |
| hub/fiduciary-governance event calendar | default content | **static** (Tier 3) | — | source events are hand-authored; no event index yet |

## Metadata contract (emitted per page at import)

- all pages: `template`, `locale`, `description`, `og:image`
- press-release / article: + `publishdate` (ISO), `category` (articles)

## Integrations / martech (delayed phase)

- GTM `GTM-PW7DJ8` — loaded always with Google Consent Mode v2 defaults **denied** (source-identical); granular update on banner accept
- Consent banner — first-party replica (`scripts/consent-check.js`), stores in localStorage; source used a custom OneTrust-style banner
- Qualified chat — `token=z3sgiJDTqMdTFT3y`, loads post-consent (`scripts/consented.js`)
- Lead forms — `form` block replicates the captured field set; posts to `meta[name=form-endpoint]` when configured, always pushes `form_submit` to dataLayer for GTM routing. **Open item: first-party form endpoint** (source posts to its CMS backend; wire a Worker/AppSync endpoint or the client's marketing-automation REST hook before go-live).
- Vimeo — `video` block reproduces player embeds
- Workday careers, client-access portal — external links preserved as-is
- Typekit `xmw3hcn` kit CSS self-referenced from `/styles/typekit.css` (font files still served by use.typekit.net under Broadridge's license; verify domain allowlist includes the EDS hosts before go-live)

## Redirects

`/redirects.json` — 240 resolved 301s from the source (legacy IA → current IA), preserving the live site's redirect behavior on EDS.
