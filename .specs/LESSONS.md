# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Cover declaration-checklist render and conferido toggles in App.test.tsx; Done when requires ≥4 tests.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `src/interface/web` · harmful: 0
- features: mvp-consolidador
- evidence: T6E-17 (src/interface/web)
- last seen: 2026-09-25T12:29:47Z

### L-002 - Add a Vitest assertion for ocean theme CSS tokens from DESIGN.md; visual-only theme changes currently have zero test evidence.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `src/interface/web` · harmful: 0
- features: mvp-consolidador
- evidence: T6E-01 (src/interface/web)
- last seen: 2026-09-25T12:29:49Z

### L-003 - Test swing-only sold volume feeding exemption meter; FII/day sales must not increment usedCents once wired beyond mocks.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `src/domain/tax` · harmful: 0
- features: mvp-consolidador
- evidence: T6E-06 (src/domain/tax)
- last seen: 2026-09-25T12:29:49Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
