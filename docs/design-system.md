# Design system notes

Source: the OjaBook guide (brand, 5.x) and the landing page design skill (Part B). Where they disagree on brand, the guide wins. See the repository README for the list.

| Topic | Rule applied | Where |
|---|---|---|
| Brand | Charcoal `#21232E`, Royal Blue `#105BFF` (dominant), Tangerine `#FE8500` (sparingly, and never as text on white: 2.5:1) | `globals.css` `@theme` |
| Fonts | Space Grotesk for headings (guide), Manrope for everything else. No italics. Weights capped at semibold. Tabular numerals for money. | `globals.css` |
| Text styles | `heading-1..6`, `title-1..5`, `body-1..6`, `button-*`, `caption-1..5`. Headings step down one size on phones. | `globals.css` |
| Spacing | Only 0, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96 px. Main buttons 8px by 12px. | enforced by `check-design-rules.mjs` |
| Radius | Tailwind radii. Nested radius = outer minus gap (24px frame with 8px padding gives a 16px screen). | `previews.tsx` |
| Borders and backgrounds | Full borders only. Flat backgrounds. The single gradient is on the hero heading text. | enforced by the checker |
| Icons | Phosphor | |
| Motion | `cubic-bezier(0.22,1,0.36,1)`, 500ms for position, 300ms for colour. Transform and opacity only. Scroll reveals rise 32px over 700ms once, via IntersectionObserver. Reduced motion becomes a plain fade. | `motion.tsx`, `globals.css` |
| Navigation | Floating translucent bar, animated menu icon, full height mobile panel, links arriving 60ms apart within 400ms | `nav.tsx` |
| States | Hover, active (scale 0.98), visible focus, loading skeletons, empty, inline error. Status is never colour alone. | `ui/` |
| Accessibility | Labels wired to controls, `aria-live` sync status, dialogs trap focus, 48px inputs, WCAG AA contrast on text pairs | |
