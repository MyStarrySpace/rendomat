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
