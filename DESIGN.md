---
version: alpha
name: Fiscal-B3-ocean
description: >
  Visual neobank claro com âncora azul oceano e acentos verde-água.
  Tipografia amigável (Nunito), cards brancos, CTAs em azul profundo,
  dinheiro/positivo em teal. Sem estética crypto, sem glow, sem grid.

colors:
  brand: "#0B4F6C"
  brand-deep: "#083A50"
  brand-soft: "#E6F4F8"
  brand-wash: "#F0F9FB"
  money: "#14B8A6"
  money-soft: "#E6FAF7"
  accent: "#2DD4BF"
  danger: "#E74C3C"
  danger-soft: "#FDECEA"
  ink: "#0F172A"
  body: "#334155"
  muted: "#64748B"
  hairline: "#D0E8EF"
  canvas: "#F0F9FB"
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
