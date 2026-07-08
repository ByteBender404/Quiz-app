---
name: Cyber-Athletic Premium
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#d0c2d5'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#303032'
  outline: '#998d9e'
  outline-variant: '#4d4353'
  surface-tint: '#e0b6ff'
  primary: '#e0b6ff'
  on-primary: '#4c007d'
  primary-container: '#9d4edd'
  on-primary-container: '#fffdff'
  inverse-primary: '#8433c4'
  secondary: '#a2e7ff'
  on-secondary: '#003642'
  secondary-container: '#00d2fd'
  on-secondary-container: '#005669'
  tertiary: '#ffb2bf'
  on-tertiary: '#660028'
  tertiary-container: '#e70063'
  on-tertiary-container: '#fffdff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#f2daff'
  primary-fixed-dim: '#e0b6ff'
  on-primary-fixed: '#2e004e'
  on-primary-fixed-variant: '#6a0baa'
  secondary-fixed: '#b4ebff'
  secondary-fixed-dim: '#3cd7ff'
  on-secondary-fixed: '#001f27'
  on-secondary-fixed-variant: '#004e5f'
  tertiary-fixed: '#ffd9de'
  tertiary-fixed-dim: '#ffb2bf'
  on-tertiary-fixed: '#3f0016'
  on-tertiary-fixed-variant: '#90003b'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is engineered for high-performance competitive gaming, prioritizing a sleek, immersive atmosphere that minimizes cognitive load while maximizing visual impact. The personality is professional and authoritative, reflecting the intensity of esports. 

The visual style blends **Modern Minimalism** with **Glassmorphism**. It utilizes deep charcoal surfaces as a canvas for high-energy neon accents. Depth is created not through traditional shadows, but through atmospheric mesh gradients and luminous "light-leaks" that simulate a high-end hardware aesthetic. The UI should feel like a premium cockpit—utilitarian yet undeniably sophisticated.

## Colors

The palette is built on a foundation of "Void Neutrals." The background uses a true midnight black to maximize OLED contrast. 

- **Primary (Electric Purple):** Used for core actions, leveling systems, and premium status indicators.
- **Secondary (Cyber Blue):** Used for informational accents, active states, and competitive rankings.
- **Tertiary (Neon Pink):** Reserved for alerts, critical warnings, or live "Match Start" indicators.
- **Surface Tiers:** Backgrounds transition from `#0a0a0c` (Base) to `#121214` (Layer 1) and `#1e1e22` (Layer 2) to establish hierarchy.
- **Gradients:** Use radial gradients of `#9d4edd` at 10% opacity in the screen corners to provide a subtle "glow" from beneath the UI.

## Typography

This design system utilizes **Inter** for all primary communication to ensure maximum legibility during fast-paced interactions. Headlines use heavy weights and tighter letter-spacing to feel impactful and "compressed."

**JetBrains Mono** is introduced as a secondary label font for technical data, player stats, and timestamps. This monospaced contrast reinforces the "high-performance/developer" aesthetic of the platform. All labels should be set in Uppercase to enhance the UI's industrial feel.

## Layout & Spacing

The design system employs a **Fluid Grid** model with a base unit of 4px. 

- **Desktop:** 12-column grid with a 1440px max-width. Gutters are fixed at 20px to maintain a tight, compact feel.
- **Mobile:** 4-column grid with 16px side margins. 
- **Containers:** Content should be grouped in glassmorphic cards with consistent padding (`md: 24px`). Use negative space aggressively to separate tournament brackets and player lists.
- **Alignment:** Use rigid, left-aligned typography to maintain a structured, professional look.

## Elevation & Depth

Depth is achieved through **Glassmorphism** and **Luminous Outlines** rather than traditional drop shadows.

1.  **Surfaces:** Use a backdrop-blur of `12px` on containers with a background of `rgba(18, 18, 20, 0.7)`.
2.  **Borders:** Apply a 1px "Inner Stroke" to cards using `rgba(255, 255, 255, 0.08)`. For active states, the border should transition to a linear gradient of Primary to Secondary colors.
3.  **Glow:** High-priority elements (like active "Play" buttons) feature a 15px outer Gaussian blur matching the element's accent color at 30% opacity. 
4.  **Z-Axis:** Higher elevation elements receive a lighter background tint and a more pronounced backdrop blur.

## Shapes

The design system uses **Soft (0.25rem)** roundedness as the standard for all interactive elements to maintain a precise, technical look. 

- **Standard Buttons/Inputs:** 4px (Soft).
- **Cards/Modals:** 8px (Rounded-lg) to distinguish large containers.
- **Avatars:** Strictly circular (Pill-shaped) to provide a soft counterpoint to the rigid, rectangular layout.
- **Icons:** Use 2px stroke width with sharp corners or very minimal rounding to match the typography.

## Components

- **Buttons:** Primary buttons use a solid gradient (Primary to Secondary) with white text. Social login buttons use a `rgba(255, 255, 255, 0.05)` background with a 1px white border at 10% opacity.
- **Inputs:** Minimalist bottom-border only or fully enclosed with `rgba(255, 255, 255, 0.03)` fill. On focus, the border glows with the Primary color and a 2px outer ring.
- **Chips:** Used for "Game Mode" or "Region." These should be JetBrains Mono, all-caps, with a subtle background and no border.
- **Lists:** Player lists should have a subtle hover state that lightens the background to `rgba(255, 255, 255, 0.05)` and reveals a Primary color vertical accent bar on the left edge.
- **Cards:** Glassmorphic with a `1px` top-down gradient border to simulate light hitting the edge of a glass pane.
- **Progress Bars:** Thin (4px) with a glowing "head" on the progress indicator to signify energy and movement.
