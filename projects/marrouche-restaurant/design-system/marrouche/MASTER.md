# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/marrouche/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Marrouche
**Generated:** 2026-10-04 by `ui-ux-pro-max --design-system --persist` — then edited by hand to record the final decisions below.
**Category:** Restaurant/Food Service
**Design Dials:** Variance 7/10 (Balanced / Modern) | Motion 5/10 (Standard) | Density 3/10 (Spacious)
**Token source of truth:** `assets/design-tokens.json` → `assets/css/tokens.css` (generated with `design-system/scripts/generate-tokens.cjs`)
**Brand source of truth:** `docs/brand-guidelines.md`

---

## Decisions vs. raw recommendation

| Recommendation (search output) | Final decision | Why |
| --- | --- | --- |
| Pattern: Hero-Centric + Conversion, CTA above fold | **Kept** | Matches the audit: every screen leads to Commander / Réserver / Appeler / Itinéraire |
| Palette: Restaurant red #DC2626 + gold #A16207 on #FEF2F2 | **Replaced** by the logo's colours: grenade #C21F24, cèdre #0A6634, braise #E19A2C on tahini #FAF5EC; night sections #17120F | The brand already exists (green rooster, red comb). A generic red/pink palette would erase it. |
| Style: Vintage Analog / Retro Film (film grain, VHS) | **Rejected** → Warm editorial + "Nature Distilled" (earthy warmth, soft shadows) with dark "braise" sections | VHS effects don't match a Lebanese grill; the style search's Nature Distilled entry fits better |
| Typography: Playfair Display SC + Karla | **Kept**, Playfair Display (with italic) for titles, SC replaced by Karla uppercase labels | Mixed-case display reads better in French; small caps used via tracking on labels |
| Motion: GSAP stagger `back.out(1.4)`, `scale: 0.92` | **Replaced** by CSS: stagger 60ms, `opacity + translateY(10px)`, `--ease-out`; no GSAP | Emil/animate rules: no bounce on UI, no scale below 0.95, cheapest tool (CSS) first |
| Component specs with `transition: all 200ms ease` | **Replaced** by named properties (`transform`, `opacity`, `background-color`) | `transition: all` is a never-ship item |
| Key effects: hover `translateY(-2px)` on cards | **Gated** behind `@media (hover: hover) and (pointer: fine)` | Touch devices keep a stuck hover otherwise |

## Global Rules

### Color Palette (semantic)

| Role | Token | Light | Night (`.dark`) |
|------|-------|-------|-----------------|
| Background | `--color-bg` | #FAF5EC | #17120F |
| Surface | `--color-surface` | #FFFCF7 | #1F1915 |
| Text | `--color-text` | #17120F | #FAF5EC |
| Text muted | `--color-text-muted` | #5A4C42 (7.6:1) | #BFAE9C (8.6:1) |
| Primary / CTA | `--color-primary` | #C21F24 (white text 6.0:1) | same |
| Brand (eyebrows, veg) | `--color-brand` | #0A6634 (6.5:1) | #6CC08A (8.5:1) |
| WhatsApp | `--color-whatsapp` | #077E3D (white text 5.2:1) | same |
| Highlight (italic words) | `--color-highlight` | #C21F24 | #EDB04F (9.7:1) |
| Focus ring | `--color-focus` | #E19A2C | same |
| Border (decorative) / strong (inputs) | `--color-border` / `--color-border-strong` | #E6D8C3 / #8A7869 (≥3:1) | #3D332C / #8A7869 |

### Typography

- **Display:** Playfair Display 600–800, italic for one accent word per title. Tracking −0.028em (hero) / −0.018em (titles).
- **Body:** Karla 400–700, 16px minimum (inputs 16px to avoid iOS zoom), line-height 1.6.
- **Labels:** Karla 700 uppercase 12px, tracking +0.16em.
- **Arabic accent:** Aref Ruqaa 700, subset to « صحتين » and « أهلاً وسهلاً » only.
- Self-hosted WOFF2, `font-display: swap`, the two critical files preloaded.

### Spacing (density 3 — spacious, 4pt rhythm)

`--space-1..10` = 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128px; `--space-section` = clamp(64px, 9vw, 128px); `--space-gutter` = clamp(16px, 4vw, 40px).

### Shadows

`--shadow-1` cards · `--shadow-2` lifted cards / pill · `--shadow-3` bottom sheet. Warm-tinted (charcoal), never pure black.

### Z-index scale

sticky 20 · header 30 · action bar 40 · cart pill 45 · scrim 60 · sheet 61 · toast 70 · prototype ribbon 80.

---

## Component Specs

### Buttons

| Property | Primary | WhatsApp | Ghost |
|---|---|---|---|
| Background | `--color-primary` | `--color-whatsapp` | transparent + 1.5px inset border |
| Hover (fine pointer only) | `--color-primary-hover` | `--color-whatsapp-hover` | border `--color-text-muted` |
| Active | `scale(0.97)` 160ms `--ease-out` | same | same |
| Height / radius | 52px / pill | same | same |

One primary button per screen; secondary actions are ghost.

### Cards (dish)

Arch or 4:3 image with dominant-colour placeholder, name (Playfair 600), one-line description, price in tabular figures, add button 44×44 minimum.

### Inputs

52px height, radius 14px, 1.5px `--color-border-strong`, 16px text, visible label above, helper text below, error below the field with `role="alert"`.

### Bottom sheet (cart)

Slides from the bottom (`translateY(100%)` → 0) in 480ms `--ease-drawer`, exits in 280ms; drag-to-dismiss with velocity threshold 0.11px/ms and rubber-band above the top; scrim 55%; focus trapped; Escape closes.

---

## Anti-Patterns (Do NOT Use)

- ❌ Low-quality imagery, inconsistent backgrounds, logos baked into photos
- ❌ Outdated or unverified hours (show "à confirmer" until validated)
- ❌ Emojis as icons — inline SVG, 1.75px stroke, one family
- ❌ `transition: all`, `scale(0)`, `ease-in` on UI, bounce on UI
- ❌ Ungated `:hover` motion
- ❌ Animating keyboard-driven or high-frequency actions (category switch, search, quantity steppers)
- ❌ Invented facts (founding date, labels, testimonials)

---

## Pre-Delivery Checklist

- [ ] No emojis as icons; one SVG icon family
- [ ] `cursor: pointer` on clickable elements; touch targets ≥ 44×44
- [ ] Hover states gated behind `(hover: hover) and (pointer: fine)`
- [ ] Text contrast ≥ 4.5:1 in light and night sections
- [ ] Focus states visible for keyboard navigation; skip link
- [ ] `prefers-reduced-motion` respected (fades kept, movement removed)
- [ ] Responsive: 320px, 375px, 768px, 1024px, 1440px; no horizontal scroll
- [ ] Images: WebP, `srcset`/`sizes`, width/height or aspect-ratio, lazy below the fold
