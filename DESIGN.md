# DayFlow design read

## Dials

- Energy: 2. The interface supports everyday planning, so the palette stays quiet and the red is reserved for actions and current-day emphasis.
- Rhythm: 3. The dashboard gives a compact overview; task and note pages use reading lists; the calendar gets a denser date grid; settings use grouped forms.
- Motion: 2. Short page, menu, and dialog transitions support orientation and feedback. Nothing moves on a loop.

## Direction

Fiery Arctic Midnight comes from the supplied palette: Arctic Cream (`#F6F7EB`) is the light canvas, Fiery Red (`#E94F37`) marks key actions and the current day, and Midnight Charcoal (`#393E41`) anchors navigation and dark mode. Cream and charcoal carry most text so the accent is not asked to do too many jobs. The primary red uses near-black text to retain readable contrast.

Inter is requested by the brief and uses a local system fallback, avoiding a render-blocking font request. Lucide icons identify navigation and named actions; they are paired with text labels. The repeated day-line marker ties date-focused sections together and refers to the current point in a person's day.

Small uppercase eyebrow labels serve as wayfinding between section metadata and user-entered content. Their tracking stays restrained, and they are not used as decorative badges.

Calendar categories use a small set of low-saturation palette variants so activity types can be scanned at a glance. Category names remain visible, so color is not the only label.

The initial workspace contains no sample records. Every count and chart reflects data the person adds. The dashboard can be pared back from Settings, and all changes are saved in one local data store.

Interactive controls use the same tokens in both themes. Select menus are custom listboxes with keyboard navigation, type-to-select, a visible selected check, and viewport-aware placement. On phones, a three-item glass navigation capsule keeps the main pages within thumb reach; secondary pages open from the “Lainnya” menu. Blur stays on overlays and navigation surfaces so the reading surfaces remain clear.
