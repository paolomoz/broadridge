# Inconsistency register — broadridge.com replica

_The ONLY permitted deltas from the captured source. Everything else is a fidelity bug._

| id | item | basis | status |
|---|---|---|---|
| R1 | Media hotlinked from www.broadridge.com CDN (images/video posters not yet rehosted to DA) | delivery-phase decision; EDS serves external refs; rehost pass scripted in deliver.sh (optional) | open |
| R2 | Typekit kit xmw3hcn loaded via self-served kit CSS; font files from use.typekit.net under Broadridge's license | replica font rule: never rehost licensed fonts; verify domain allowlist for aem.page/aem.live | open |
| R3 | Consent banner is a first-party replica (visual + Consent Mode parity), not the source CMP vendor | source CMP is proprietary/config-bound; GTM consent-mode defaults identical | accepted |
| R4 | Site search is client-side over query-index (title+description), not the source's server search | /search-results, /product-search — EDS pattern; body full-text not indexed | accepted |
| R5 | Press/insights archives paginate with Load more + year/category facets reading query-index | source used JS listings backed by CMS API; behavior parity, markup differs | accepted |
| R6 | Lead forms post to configurable first-party endpoint (meta form-endpoint) + dataLayer event; source posted to CMS backend | endpoint to be wired at go-live (Worker or marketing-automation REST) | open |
| R7 | Hero carousel static-renders all three panels (main + 2 promos) without autoplay rotation | source swiper autoplay; motion parity deferred | open |
| R8 | jp/de body typography inherits en article scale (24px) where locale CSS differed slightly | spot-checked similar; full locale gate not run | open |
