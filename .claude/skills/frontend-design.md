# Frontend Design — Anti-AI-Slop

Use when building or redesigning UI components, pages, or layouts. Auto-invoked for frontend work.

## Core Principle

**Intentionality over intensity.** Every design choice should be deliberate. Bold maximalism and refined minimalism both work — the key is having a clear direction, not defaulting to generic patterns.

## Before Writing Any UI Code

1. **Purpose & audience** — what is this page/component for? Who uses it?
2. **Tone** — gaming aesthetic (dark, vibrant accents), data-driven (clean, readable), immersive (splash art, gradients)?
3. **What makes it memorable** — what's the ONE thing users should notice?

## Design Rules for This Project

### Typography
- **Geist Sans / Geist Mono** — our font system. Use weight and size contrast, not different fonts.
- Headings: bold, generous size. Body: regular weight, comfortable line-height.
- Numbers in stats: use tabular figures, monospace for alignment.

### Color
- **Primary (violet)** — brand, interactive elements, CTAs
- **Success/Danger (green/red)** — win/loss states. These are strong signals, use sparingly.
- **Tier colors** — `tier-iron` through `tier-challenger`. Always use semantic tokens, never hardcode hex.
- **Dark mode first** — deep violet background (`oklch(0.13 0.035 290)`). Cards should feel like they float.

### Layout
- **Break the grid when it matters** — hero sections, featured content, stat highlights
- **Consistent spacing** — `space-y-6` between sections, `gap-3` or `gap-4` in grids
- **Responsive grids**: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- **Avoid excessive borders** — prefer subtle backgrounds (`bg-muted/50`) and spacing over `border` on every card

### Motion
- `active:scale-[0.98]` on interactive elements for press feedback
- `transition-colors duration-200` for hover states
- `animate-fade-up` with stagger delays for page entrance
- `animate-shine` for premium tier badges
- **Respect `prefers-reduced-motion`**

### Components
- Use **shadcn/ui** from `@/components/ui/` — never reinvent form controls, dialogs, buttons
- **PageHero** for page headers — integrate key controls via `children` prop
- **StatTile** for metric cards — use `emphasis` prop for semantic coloring
- **TierBadge** for S+/S/A/B/C/D ratings
- **Badge** with `emphasis` system for semantic data labels
- **Skeleton** loaders that match final content dimensions

### Images
- All game assets via `constants/ddragon.ts` builders
- Champion splashes as subtle backgrounds: `opacity-20` + `object-cover`
- `priority` on above-the-fold hero images
- Profile icons: `rounded-full` with no extra borders

## Anti-Patterns to Avoid

- **Generic card grids** with identical styling — vary card sizes, feature important items
- **Borders on everything** — not every container needs a border
- **Gray-on-gray** — use the color system. Violet accents, tier colors, win/loss green/red
- **Centered text blocks** in wide layouts — left-align body text
- **Tiny text** for important stats — if it matters, make it big
- **Decoration without purpose** — every gradient, shadow, animation should serve a function

## Checklist Before Shipping UI

- [ ] Dark mode looks intentional, not just inverted
- [ ] Interactive elements have visible hover/focus/active states
- [ ] Text is readable against all backgrounds
- [ ] Spacing is consistent (not random padding values)
- [ ] Mobile layout doesn't just stack — it's redesigned for the viewport
- [ ] Loading states use appropriate skeletons
- [ ] No orphaned text (single words on a line)
