# mvp-consolidador — T6 presentation expansion verify report

**Date**: 2026-09-25  
**Spec**: `.specs/features/mvp-consolidador/spec.md` — **missing**; ACs traced from `tasks.md` requirement catalog (`T6E-01`–`T6E-18`) and per-task **Done when** (T6.1–T6.18).  
**Diff range**: `c6767f4^..feat/task-6` (`627ae7b..a23f3c3`, 11 commits)  
**Verifier**: independent sub-agent (author ≠ verifier)  
**Implementation verified on**: git ref `feat/task-6` @ `a23f3c3` (scratch worktree `.scratch-sensor`; main worktree detached at `627ae7b` pre-expansion)

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T6.1 | ✅ Done | Theme in `DESIGN.md` / CSS; **no test citation** (see T6E-01) |
| T6.2 | ✅ Done | Demo seed + integration/UI tests |
| T6.3 | ✅ Done | Dashboard default + KPI tests |
| T6.4 | ✅ Done | Timeline tests |
| T6.5 | ✅ Done | DARF calendar + due-date domain tests |
| T6.6 | ✅ Done | Meter domain tests; **FII/day exclusion from meter input not tested** |
| T6.7 | ✅ Done | Modality breakdown tests |
| T6.8 | ✅ Done | Loss carryforward tests |
| T6.9 | ✅ Done | Asset detail UI test |
| T6.10 | ✅ Done | Year comparison tests |
| T6.11 | ✅ Done | CSV export integration test |
| T6.12 | ✅ Done | Print layout UI test |
| T6.13 | ✅ Done | Ticker filter UI test |
| T6.14 | ✅ Done | DARF breakdown HTTP + dashboard render |
| T6.15 | ✅ Done | Simulate-sale HTTP + UI |
| T6.16 | ✅ Done | Cost evolution HTTP + dashboard render |
| T6.17 | ⚠️ Partial | UI present; **no automated test** |
| T6.18 | ✅ Done | Insights HTTP + dashboard render |

---

## Spec-Anchored Acceptance Criteria (T6E expansion)

| Criterion (WHEN / THEN) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| T6E-01 WHEN UI loads THEN ocean theme (azul + verde-água), no purple brand | Tokens in design doc; `--brand` ocean blues in CSS | — (no test asserts theme tokens/colors) | ❌ GAP |
| T6E-02 WHEN demo reset THEN deterministic rich portfolio (≥5 tickers, FII, provento) | `tickers` = 6 names incl. FII; `hasFii`/`hasProvento` true | `src/interface/http/http.integration.test.ts:133` - `expect(res.body.tickers).toEqual(["PETR4", "VALE3", "ITUB4", "BBAS3", "HGLG11", "MXRF11"])` | ✅ Covered |
| T6E-03 WHEN home THEN dashboard KPIs from API | invested cost 773400 cents, 3 assets, DARF 22500, exemption 42.5% | `src/interface/http/http.integration.test.ts:204` - `expect(res.body).toEqual({ ... exemptionPercentUsed: 42.5, ... })` | ✅ Covered |
| T6E-03 UI default tab | Dashboard visible, Início current | `src/interface/web/App.test.tsx:100` - `expect(await screen.findByTestId("dashboard-kpis")).toBeInTheDocument()` | ✅ Covered |
| T6E-04 WHEN timeline THEN chronological events with type/ticker/date | Ordered events; fields on each row | `src/interface/http/http.integration.test.ts:245` - `expect(res.body[0].date).toBe("2024-01-10")` (ordered list) | ✅ Covered |
| T6E-05 WHEN DARF calendar THEN obligation + due date (last business day rule) | e.g. 2024-03 → due `2024-04-30`; weekend rollback | `src/domain/tax/darfDueDate.test.ts:7` - `expect(darfDueDate("2024-03")).toBe("2024-04-30")` | ✅ Covered |
| T6E-05 HTTP calendar payload | Months with DARF + dueDate | `src/interface/http/http.integration.test.ts:293` - `expect(res.body).toEqual([{ month: "2024-01", darf: { cents: 12000 }, dueDate: "2024-02-29" }, ...])` | ✅ Covered |
| T6E-06 WHEN exemption meter THEN 0–20k swing stocks, ok/warn/exceeded | limit 2_000_000 cents; status thresholds | `src/domain/tax/exemptionMeter.test.ts:6` - `expect(SWING_STOCK_EXEMPTION_LIMIT_CENTS).toBe(2_000_000)` | ✅ Covered |
| T6E-06 FII and day trade **outside** meter | Only swing equity sales volume counts | — (no test asserts meter `usedCents` excludes FII/day sales; mocks use constants) | ❌ GAP |
| T6E-07 WHEN modality breakdown THEN separate day/swing buckets | Two modalities, distinct results | `src/interface/http/http.integration.test.ts:323` - `expect(res.body.buckets.map((b) => b.modality)).toEqual(["SWING", "DAY_TRADE"])` | ✅ Covered |
| T6E-08 WHEN loss carryforward THEN day/swing series separate | Non-equal day vs swing cents in series | `src/interface/http/http.integration.test.ts:379` - `expect(res.body.points[0].dayTrade.cents).not.toBe(res.body.points[0].swing.cents)` | ✅ Covered |
| T6E-09 WHEN asset detail THEN PM from API, history snippet | Detail panel; PM R$ 28,50 from API | `src/interface/web/App.test.tsx:385` - `expect(await screen.findByTestId("asset-detail")).toBeInTheDocument()` | ✅ Covered |
| T6E-10 WHEN year comparison THEN side-by-side metrics | yearA/B and costs | `src/interface/http/http.integration.test.ts:424` - `expect(res.body.yearA).toBe(2023)` | ✅ Covered |
| T6E-11 WHEN CSV export THEN aligned with declaration JSON | CSV rows match JSON bens/rendimentos | `src/interface/http/http.integration.test.ts:389` - `expect(csv.text).toContain("bens,PETR4,100,285000")` | ✅ Covered |
| T6E-12 WHEN print layout THEN nav hidden for print | `.print-root`, `.topbar.no-print` | `src/interface/web/App.test.tsx:429` - `expect(container.querySelector(".topbar")).toHaveClass("no-print")` | ✅ Covered |
| T6E-13 WHEN ticker filter THEN table/chart filter | VALE visible, PETR hidden after filter | `src/interface/web/App.test.tsx:417` - `expect(screen.queryByText("PETR4")).not.toBeInTheDocument()` | ✅ Covered |
| T6E-14 WHEN DARF breakdown THEN structured API (rate, base, DARF) | rate 15%, darf 22500 | `src/interface/http/http.integration.test.ts:405` - `expect(res.body.ratePercent).toBe(15)` | ✅ Covered |
| T6E-15 WHEN simulate sale THEN read-only IR estimate | `persisted: false`; gain/tax formula | `src/interface/http/http.integration.test.ts:443` - `expect(res.body.persisted).toBe(false)` | ✅ Covered |
| T6E-16 WHEN cost evolution THEN monthly series from events | ≥2 points with month/costCents | `src/interface/http/http.integration.test.ts:433` - `expect(res.body.points.length).toBeGreaterThanOrEqual(2)` | ✅ Covered |
| T6E-17 WHEN declaration checklist THEN bens/rendimentos/DARF items + toggle | Three checklist rows tied to declaration | — (`data-testid="declaration-checklist"` in UI only) | ❌ GAP |
| T6E-18 WHEN insights THEN 2+ cards from port | ≥2 cards with id/title/body | `src/interface/http/http.integration.test.ts:414` - `expect(res.body.cards.length).toBeGreaterThanOrEqual(2)` | ✅ Covered |

**Status**: ❌ Gaps present (3 criteria without test evidence; 1 missing `spec.md`)

---

## Discrimination Sensor

Scratch: git worktree `.scratch-sensor` @ `feat/task-6`. Real worktree porcelain unchanged except pre-existing `M .gitignore` and transient `?? .scratch-sensor/` (removed after report).

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| 1 | `src/interface/http/mocks.ts:526` | Simulate tax `gain * 0.15` → `gain * 0.10` | ✅ Killed (`POST /simulate-sale estimates IR without persisting`) |
| 2 | `src/domain/tax/exemptionMeter.ts:27` | Warning threshold `percentUsed >= 80` → `>= 90` | ✅ Killed (`returns warning exactly at 80%`) |
| 3 | `src/interface/http/mocks.ts:45` | Demo seed ticker `PETR4` → `ZZZZ4` | ✅ Killed (`POST /demo/reset returns deterministic seed metadata`) |

**Sensor depth**: lightweight (3 behavior-level mutations)  
**Result**: 3/3 killed — sensor OK

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / surgical T6 expansion | ✅ |
| Hexagonal: UI does not compute PM/DARF/tax | ✅ (dashboard/simulator/breakdown from API mocks) |
| Spec-anchored outcome check | ❌ (gaps above) |
| Per-layer coverage (tasks matrix): application unit for expansion | ❌ (no `src/application/**/*.test.ts`; logic in `mocks.ts`) |
| Documented guidelines | ✅ `AGENTS.md` |
| Tests map to Done when (spot-check T6.17) | ❌ checklist untested |

---

## Edge Cases

- [x] Dashboard/portfolio empty and error states — `App.test.tsx:117`, `:136`
- [x] DARF calendar excludes zero months — `http.integration.test.ts:316`
- [x] HTTP validation errors (400) on missing query params — multiple routes
- [ ] Theme regression (purple residual) — not automated

---

## Gate Check

- **Gate command**: `npm test && npm run test:integration` (on `feat/task-6` @ `a23f3c3`)
- **Result**: 82 passed, 0 failed (unit); 42 passed, 0 failed (integration); 0 skipped
- **Test count before expansion** (`627ae7b`): 51 unit + 11 integration = **62**
- **Test count after expansion** (`a23f3c3`): 82 unit + 42 integration = **124**
- **Delta**: +62 tests
- **Skipped tests**: none
- **Failures**: none

---

## Fix Plans

### Fix 1: Ocean theme regression guard (T6E-01 / T6.1)

- **Root cause**: Theme is manual/CSS-only; no assertion in Vitest or CSS token test.
- **Fix task**: Add a small UI or CSS unit test asserting `--brand` (and accent) match `DESIGN.md` tokens and no legacy purple hex in `styles.css`.
- **Priority**: Major

### Fix 2: Declaration checklist coverage (T6E-17 / T6.17)

- **Root cause**: `declaration-checklist` rendered in `App.tsx` but absent from `App.test.tsx` (Done when requires ≥4 tests).
- **Fix task**: Render declaration tab with mock declaration; assert three checklist labels and toggle `conferido` state.
- **Priority**: Major

### Fix 3: Exemption meter input scope (T6E-06)

- **Root cause**: `buildExemptionMeter` tested in isolation; demo uses hard-coded `DEMO_EXEMPTION_USED_CENTS`; no test that FII/day sales do not increment meter.
- **Fix task**: When wiring real apuration (T7), add domain/application test deriving `usedCents` from swing-stock sold volume only; until then, document mock limitation or add unit test on the aggregator once extracted from mocks.
- **Priority**: Major

### Fix 4: Application-layer tests (coverage matrix)

- **Root cause**: Expansion behavior lives in `src/interface/http/mocks.ts` without `src/application` use-case tests.
- **Fix task**: Extract simulate/insights/year-comparison/cost-evolution into testable application services with unit tests per matrix.
- **Priority**: Minor (acceptable for demo mocks until T7)

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| T6E-01 | Implementing | ❌ Needs Fix (no test evidence) |
| T6E-06 (meter scope) | Implementing | ❌ Needs Fix (partial) |
| T6E-17 | Implementing | ❌ Needs Fix (no tests) |
| T6E-02–05, 07–16, 18 | Implementing | ✅ Verified (automated evidence) |

---

## Summary

**Overall**: ❌ Not Ready

**Result**: FAIL — T6 expansion not ready for sign-off (see ranked gaps)

**Spec-anchored check**: 15/18 T6E criteria with matching test evidence; 3 gaps; `spec.md` absent  
**Sensor**: 3 mutations injected, 3 killed, 0 survived  
**Gate**: 124 passed, 0 failed (on `feat/task-6`)

**What works**: Full HTTP surface for presentation features; dashboard, timeline, fiscal views, simulator, CSV/print, and discrimination sensor all green on `feat/task-6`.

**Issues found**: Missing automated proof for ocean theme, declaration checklist, and FII/day-trade exclusion from exemption meter input; application layer untested per matrix.

**Next steps**: Add fix tasks above, merge/checkout `feat/task-6` for a consistent tree, re-run Verifier after fixes.
