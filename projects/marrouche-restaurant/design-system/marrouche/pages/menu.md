# Menu Page Overrides

> **PROJECT:** Marrouche
> **Page Type:** Menu / ordering (functional, repeated use)
> Rules in this file **override** the Master file. The generated override (Enterprise Gateway, navy palette) was a
> mismatch from the page-type search and has been replaced.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1160px; two columns of dishes from 1024px, one column below.
- **Sections:** 1. Compact header (title + search), 2. Sticky category bar (scroll-spy), 3. Category groups, 4. Cart pill + bottom sheet.
- Sticky category bar sits under the site header (`top: var(--header-height)`), horizontally scrollable with `scroll-snap`.

### Density Override

- Density 5/10 here (standard): dish rows 16px vertical padding, 72px thumbnails. The page is read and scanned, not browsed.

### Motion Override (stricter than Master)

- **No animation** on category switch, search filtering, quantity changes or scroll-spy updates: these happen tens of times per visit.
- Allowed: button press feedback (`scale(0.97)`), the add button → stepper cross-fade (200ms, blur 2px), cart pill entrance
  (first item only), bottom sheet.

### Color Overrides

- Light surface only (no night sections) for maximum legibility of prices.

---

## Page-Specific Components

- **Dish row:** thumbnail (restaurant photo, lazy, fallback monogram), name, tags (végé / épicé — only when obvious from the name),
  price, add button that becomes a − / qty / + stepper.
- **Search:** filters as you type, accent-insensitive, shows a no-result state with a WhatsApp fallback.
- **Cart sheet:** see Master (Bottom sheet).
