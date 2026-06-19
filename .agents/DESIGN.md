---
name: Lumina Extension System
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#009eb9'
  on-tertiary-container: '#002f38'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  panel-padding: 20px
  stack-gap: 12px
---

## Brand & Style

The design system is centered around a **Premium Glassmorphic** aesthetic tailored for high-focus productivity. It targets professionals and power users who value a workspace that feels light, unobtrusive, and technologically advanced. 

The visual narrative is built on the metaphor of "Digital Glass"—surfaces that are semi-transparent and frosted to reduce cognitive load while maintaining a sense of depth. The emotional response is one of clarity and calm, achieved through heavy background blurs and a "weightless" UI. Vibrant accents in electric blue and deep purple provide high-contrast focal points for actionable elements without breaking the ethereal mood.

## Colors

This design system utilizes a dark-mode-first approach to maximize the luminous effect of glass layers. 

- **Primary & Secondary:** A gradient of Electric Blue (#3B82F6) and Royal Violet (#8B5CF6) is used for active states and critical calls-to-action.
- **Glass Surfaces:** Surfaces are not solid colors but translucent layers with a 65% opacity of the neutral slate, allowing the user's background content to bleed through softly.
- **High-Contrast Text:** Primary text is pure white (#FFFFFF) for maximum legibility against dark glass, while secondary text uses a muted silver (#94A3B8).

## Typography

The typography system relies on **Inter** for its neutral, highly legible, and systematic qualities. 

- **Display:** Large headlines use tighter letter spacing and bold weights to ground the airy glass interface.
- **Readability:** Body text maintains a generous line height (1.5x) to ensure focus during long reading or configuration sessions.
- **Labels:** Small labels use a slight tracking increase and semi-bold weight to remain distinct on translucent backgrounds.

## Layout & Spacing

Because this is a browser extension, the layout is **contextual and compact**. 

- **The Popup Shell:** Fixed width of 360px to 400px with dynamic height.
- **Spacing Rhythm:** Uses a 4px base grid. Most components are separated by 12px (stack-gap) to maintain a sense of lightness without wasting vertical real estate.
- **Margins:** A consistent 20px internal padding ensures content doesn't feel cramped against the rounded glass edges.

## Elevation & Depth

Hierarchy is established through **Backdrop Blur** and **Tonal Stacking** rather than traditional shadows.

- **Level 1 (Base):** Background content of the browser.
- **Level 2 (Panels):** `backdrop-filter: blur(24px)` with a 1px solid border (`glass_border`). This creates the primary "frosted" effect.
- **Level 3 (Popovers/Tooltips):** `backdrop-filter: blur(40px)` with a slightly lighter background and a subtle outer glow (0px 4px 20px rgba(0,0,0,0.25)) to suggest it is floating closer to the user.
- **Inner Depth:** Inset elements like input fields should use a slightly darker translucent fill to create a "carved-in" look.

## Shapes

The shape language is sophisticated and modern, using **Medium Rounded** corners to complement the softness of the glass effect.

- **Panels:** Use `rounded-xl` (24px) for the main extension container.
- **Buttons & Inputs:** Use `rounded-lg` (12px) to provide a friendly yet professional touchpoint.
- **Chips:** Always pill-shaped to differentiate them from actionable buttons.

## Components

### Buttons
- **Primary:** Gradient fill (Primary to Secondary) with white text. Subtle 2px inner glow on the top edge.
- **Secondary (Translucent):** `rgba(255, 255, 255, 0.1)` background with `backdrop-filter: blur(8px)`. White text and a 1px border.

### Input Fields
- Background: `rgba(0, 0, 0, 0.2)`.
- Border: `glass_border` (transitions to `primary_color` on focus).
- Text: `body-md`.

### Cards & Lists
- List items should be separated by thin, 1px dividers with 10% opacity. 
- Hover states on list items should use a `glass_highlight` background to indicate interactivity without using solid colors.

### Icons
- Use **Linear/Stroke** icons with a 1.5px or 2px stroke width. 
- Icons should be monochromatic (White) or use the secondary accent color for specialized status indicators (e.g., a purple clock icon for a Pomodoro timer).

### Chips
- Small, pill-shaped containers with a background of `primary_color` at 15% opacity and a solid `primary_color` for the text.