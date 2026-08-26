---
name: Broadridge (current state)
description: Descriptive snapshot of broadridge.com's live design system, extracted 2026-08-24
colors:
  white: "#ffffff"
  navy-deep: "#000c36"
  navy: "#001f5a"
  blue-primary: "#2662fc"
  blue-link: "#0f3db5"
  surface-grey: "#f9f9f9"
  surface-blue-tint: "#e7f1fc"
  text-primary: "#1a1a1a"
typography:
  display:
    fontFamily: "freight-sans-pro, sans-serif"
    fontSize: "128px"
    fontWeight: 700
    lineHeight: 1.15
  headline:
    fontFamily: "freight-sans-pro, sans-serif"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: 1.15
  title:
    fontFamily: "freight-sans-pro, sans-serif"
    fontSize: "36px"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "freight-sans-pro, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body-large:
    fontFamily: "freight-sans-pro, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "2px"
  md: "4px"
  pill: "9999px"
spacing:
  gutter: "24px"
  section: "48px"
  container: "1184px"
components:
  button-primary:
    backgroundColor: "{colors.blue-primary}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "16px 24px"
  button-ghost-on-navy:
    backgroundColor: "transparent"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "16px 24px"
  card-tinted:
    backgroundColor: "{colors.surface-blue-tint}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "24px"
  card-navy:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "24px"
---

# Broadridge — current-state design system

Descriptive snapshot written by `stardust:extract`. This documents what the
live site **is**, not what it should become. Sources cited per section from
`stardust/current/_brand-extraction.json`.

## Overview

An institutional fintech marketing system: deep-navy hero bands and mega-footer
frame white/grey content sections; a single bright blue (#2662fc) carries every
interactive affordance; FreightSans Pro at light-to-regular weights does all
typographic work. Density is editorial-corporate — wide 1184px container,
48px section rhythm, 4-up card grids, and sharp 2px corners throughout.

## Colors

(§ palette) White page ground; #000c36 deep navy for hero bands, footer, and
navy card faces; #f9f9f9 grey and #e7f1fc blue-tint alternate section
surfaces; #2662fc is the sole action color (buttons, links-as-CTAs); #0f3db5
is the in-text link/accent blue; text is #1a1a1a. No warm hues anywhere —
the palette is strictly navy/blue/neutral.

## Typography

(§ type) One family: freight-sans-pro (Adobe Typekit, weights 300/400/500/600/700,
font-display: swap). H1 display moments reach 128px/700 (home hero "NAVIGATE");
standard interior H1 sits at ~48-56px; H2 40px/400; H3 36px/400; body 16-20px/400.
Scale audit: **ad-hoc** (ratios 3.2 / 1.11 / 1.13 — no modular scale). Headings
are sentence-case (uppercase rate 4%); the display hero is the exception.

## Layout

(§ spacing) 1184px design container (`--container-width`), observed wrappers to
1360px. 24px gutter (`--gutter: 1.5rem`), 48px dominant section padding, 8px base
unit. Recurring layouts: full-bleed navy hero band (headline left, subcopy right),
4-up card grid, left link-list + right detail-card ("tabbed capability list"),
stat carousel, awards band, full-width contact-form band above the footer.

## Elevation & Depth

(§ motifs.shadows) Essentially flat. Shadows are rare: `0 4px 8px rgba(0,0,0,.2)`
on floating UI and a soft `1px 1px 56px rgba(0,12,54,.15)` glow on select cards.
Depth is achieved by surface alternation (white → grey → blue-tint → navy), not
shadow stacks.

## Shapes

(§ motifs.borderRadius) Sharp corners are the signature: 2px primary radius
(130 occurrences), 4px secondary (80), pill radius reserved for small
badges/controls. Angled/diagonal edge crops appear on gradient promo bands
(Client portal band). Thin-line financial illustrations sit on tinted card faces.

## Components

- **Buttons** (§ componentStyle.buttons): primary = #2662fc/white, 2px radius,
  16×24 padding, weight 500; ghost-on-navy = transparent with white border;
  tertiary = blue text link + arrow glyph. Dual-CTA pattern: primary button then
  arrow-link.
- **Cards**: flat, borderless, 2px radius; faces are blue-tint, navy, or
  full-bleed photo with white label chip (REPORT / ARTICLE / CASE STUDIES).
- **Inputs**: white, 1px #b3b3b3 border, 2px radius, 12×16 padding (lead forms).
- **Header** (system component, 5/5 pages): two-tier — navy utility bar
  (Client access, Careers, Search) over white primary nav (Who we serve,
  Capabilities, Insights, About us) + blue Contact us button.
- **Footer** (5/5): navy mega-footer, 3 link columns, NYSE: BR ticker, locale
  links, legal row.
- **Contact-form band** (4/5): "What's next for your business?" blue-tint band,
  left copy + right lead form with regional phone numbers.
- **Insights rail** (3/5): card carousel with "Explore all insights" CTA.

## Do's and Don'ts

Descriptive observations of the live system's own rules:

- Do keep #2662fc exclusively for actions; content color is navy/neutral.
- Do alternate section surfaces for rhythm; don't stack shadows.
- Do close commercial pages with the contact-form band.
- Don't round corners beyond 4px except pills on small controls.
- Don't introduce a second typeface; weight and size carry all hierarchy.

## Third-party embeds (opaque to extraction)

Vimeo players (about hero video, capital-markets mid-page band — the blank
region in its screenshot), Qualified chat widget (loads Roboto/Inter — not
brand fonts), lead-form backend. Computed styles inside these iframes are not
captured; screenshots are the only evidence.
