---
_provenance:
  writtenBy: stardust:direct (Phase 2.5)
  writtenAt: 2026-08-24T12:55:00Z
  readArtifacts:
    - stardust/current/brand-review.html
    - stardust/current/_brand-extraction.json
    - stardust/current/pages/index.json
  note: >
    Direction is EXACT REPLICA (user chose it explicitly over
    "replica + hygiene fixes"). Under this direction the improvements
    list is NOT a render brief — prototype archetypes must reproduce
    the captured pages, not improve them. The items below are recorded
    so the observations are not lost; they are deferred to a
    post-migration uplift and MUST NOT alter migration output, except
    item 3 (alt text), which is content authoring rather than design
    and may be applied at migrate time only if the user opts in later.
---

# Deferred improvements (not applied — replica direction)

1. **[accessibility / T-img-alt-empty]** 30% of images (39/129 in the
   5-page sample) ship empty alt text, and 5 hero banners use the literal
   alt "header". Deferred fix: re-author alt text during a content pass.
2. **[dated pattern / T-scale]** Heading scale is ad-hoc (128 → 40 → 36 →
   32; ratios 3.2/1.11/1.13). Deferred fix: adopt a modular scale in a
   future uplift.
3. **[missed opportunity / T-logo-variants]** Only the white-on-navy logo
   variant exists; no dark-on-light wordmark. Deferred fix: commission a
   variant set. (Migration workaround: keep logo on navy grounds exactly
   as the live site does.)
4. **[cliché convention]** The "Powering the pulse" tab section renders a
   generic illustration placeholder with no tab-panel content depth
   (captured: single illustration card per tab). Deferred: give tab
   panels real content parity with the capability pages they link to.
