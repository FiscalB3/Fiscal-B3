---
version: alpha
name: Fiscal-B3-ocean
description: >
  Visual neobank claro com âncora teal/verde-água.
  Tipografia amigável (Nunito), cards brancos, CTAs em teal profundo,
  dinheiro/positivo em verde-água. Sem estética crypto, sem glow, sem grid.

colors:
  brand: "#0F766E"
  brand-deep: "#0D5C56"
  brand-soft: "#E6F7F5"
  brand-wash: "#F0FAF8"
  money: "#0D9488"
  money-soft: "#E6FAF7"
  accent: "#14B8A6"
  danger: "#E74C3C"
  danger-soft: "#FDECEA"
  ink: "#0F172A"
  body: "#334155"
  muted: "#64748B"
  hairline: "#C5E8E3"
  canvas: "#F0FAF8"
  surface: "#FFFFFF"
  on-brand: "#FFFFFF"

typography:
  display:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontWeight: 800
  body:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontWeight: 500
  numbers:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontWeight: 700

rounded:
  sm: 12px
  md: 16px
  lg: 24px
  pill: 999px

motion:
  enter: "fade + 8px rise, 400ms ease"
  press: "scale 0.98 on active"
  nav: "background color 200ms"

do-not:
  - purple brand tokens
  - crypto neon yellow
  - presentation guided tour mode
  - dark trading terminal default
