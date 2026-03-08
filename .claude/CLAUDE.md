# Rendomat Project Guidelines

## Design System

This project uses a VSCO-inspired editorial design system with warm, muted tones.

### Styling Approach

- **CSS handles appearances**: Colors, typography, spacing, borders, and visual styling use CSS custom properties defined in `globals.css`
- **Framer Motion handles animation**: Use Framer Motion for transitions, enter/exit animations, gestures, and orchestrated motion
- Do not remove Framer Motion from components that use it for animation
- Do not use Framer Motion for static styling (colors, sizes, etc.)

### Color Tokens

Use HSL CSS variables for all colors:
```css
hsl(var(--background))
hsl(var(--foreground))
hsl(var(--accent))
hsl(var(--surface))
hsl(var(--border))
hsl(var(--error))
hsl(var(--success))
hsl(var(--warning))
```

### Typography

- `.headline` - Serif font (Instrument Serif) for titles
- `.caption` - Uppercase, tracked text for labels
- `.link-subtle` - Muted underlined links
- `.pill` - Tag/chip styling

### Visual Style

- **Sharp corners**: No border-radius (editorial aesthetic)
- **Warm tones**: Background hue ~30, amber/gold accent at hue 38
- **Minimal**: Avoid gradients, excessive shadows, or decorative elements

### Components

UI components are in `app/components/ui/`:
- `Button` - with variants: default, secondary, ghost, destructive
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Badge` - with variants: default, secondary, success, warning, error, outline
- `Input`, `Textarea`, `Label`

Import from `@/components/ui` or `@/components/ui/[component]`.

## Transition Previews

When transition rendering code is modified (`remotion/components/Transition.tsx` or `remotion/lib/transitions.ts`), re-render the transition preview clips:

```bash
node scripts/render-transition-previews.mjs
```

To re-render a single transition type:
```bash
node scripts/render-transition-previews.mjs --type crossfade
```

Preview clips are stored in `public/transitions/` as MP4 files (320×180, 30fps).

## Testing Philosophy

- Tests exist to **find and fix bugs** based on expected correct behavior, not just to verify existing code passes.
- Write tests that encode what the behavior **should** be. If a test fails, that's a bug to fix in the production code — don't weaken the test to match broken behavior.
- When a test reveals a bug, fix the production code first, then confirm the test passes.
- Server-side database tests: `node --test server/test/state-management.test.mjs` (imports `server/database.mjs` directly, no running server needed)
- Cloud/Neon tests: `cd app && node --test test/*.test.mjs` (requires `DATABASE_URL` env var)
