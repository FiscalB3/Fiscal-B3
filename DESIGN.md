---
version: alpha
name: Fiscal-B3-neobank
description: >
  Visual inspirado em neobancos brasileiros (Nubank, PicPay): canvas claro,
  roxo de marca como âncora, verde para dinheiro positivo, tipografia amigável,
  cards brancos arredondados e zero estética de trading/crypto. Prioriza
  clareza, respiração e confiança — sem glow, grid ou gradientes de texto.

colors:
  brand: "#820AD1"
  brand-deep: "#6B08AD"
  brand-soft: "#F3E8FF"
  brand-wash: "#F7F0FF"
  money: "#1DB954"
  money-soft: "#E8F8EF"
  danger: "#E74C3C"
  danger-soft: "#FDECEA"
  ink: "#111111"
  body: "#3D3D3D"
  muted: "#8B8B8B"
  hairline: "#EDE4F5"
  canvas: "#F7F0FF"
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
  - dark crypto terminal
  - neon yellow CTAs
  - grid overlays / radial glow blobs
  - gradient text headlines
  - "AI dashboard" metric walls
  - trading jargon (desk, ao vivo, wealth)
