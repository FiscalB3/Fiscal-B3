# Consolidador B3 — Tasks (MVP + T6 expandida para apresentação)

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow.

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Paralelismo:** T1 primeiro. T2–T6 base em paralelo. T7 junta o núcleo. A **expansão da T6** (T6.1–T6.14) roda na interface com ports mockadas se T7 ainda não existir; depois do T7 os mesmos endpoints passam a dados reais.

---

**Fonte de produto**: PDF *Consolidador B3* + `AGENTS.md` + escopo de apresentação
**Design**: tema **oceano** (azul + verde-água) em `DESIGN.md`
**Spec**: IDs `MVP-NN` + `T6E-NN` (expansão da interface)
**Status**: T1–T4 e T6 base concluídas; T5 e T7 pendentes; **T6.1–T6.14 planejadas** (sem modo Apresentar)

---

## Workstreams

| Stream | Tarefas | Objetivo |
| ------ | ------- | -------- |
| Kernel | T1 | Contrato compartilhado |
| Posição | T2 | Preço médio |
| Fiscal | T3 | Apuração |
| Importação | T4 | CSV/XLSX |
| Persistência | T5 | Postgres |
| Interface base | T6 | API + UI núcleo |
| Interface apresentação | T6.1–T6.14 | Demo rica na T6 |
| Integração | T7 | Wiring real |

Fora: auth multi-usuário, cotações ao vivo, PDF de corretora, **modo Apresentar**.

---

## Requirement Catalog

### Núcleo (MVP)

| ID | Requisito |
| -- | --------- |
| MVP-01 | Importar CSV/XLSX layout fixo |
| MVP-02 | Compra recalcula preço médio |
| MVP-03 | Venda não altera preço médio unitário |
| MVP-04 | Expor posição atual |
| MVP-05 | Day trade vs swing |
| MVP-06 | Compensação só na mesma modalidade |
| MVP-07 | Isenção R$ 20.000 (ações swing) |
| MVP-08 | Sinalizar DARF do mês |
| MVP-09 | Desdobramento/grupamento sem operação fictícia |
| MVP-10 | Declaração: Bens e Direitos |
| MVP-11 | Declaração: Rendimentos |
| MVP-12 | Derivados só de eventos |
| MVP-13 | Money sem float cego |
| MVP-14 | Domínio puro |
| MVP-15 | Postgres via migrations |
| MVP-16 | PDF corretora fora |

### Expansão T6 (apresentação)

| ID | Requisito |
| -- | --------- |
| T6E-01 | Tema visual azul + verde-água |
| T6E-02 | Seed/demo com carteira rica (1 clique) |
| T6E-03 | Dashboard com KPIs |
| T6E-04 | Timeline de operações/eventos |
| T6E-05 | Calendário/lista de DARF com vencimento |
| T6E-06 | Medidor de isenção R$ 20.000 |
| T6E-07 | Breakdown day vs swing |
| T6E-08 | Prejuízo a compensar por modalidade |
| T6E-09 | Detalhe por ativo |
| T6E-10 | Comparativo ano a ano |
| T6E-11 | Export CSV da declaração |
| T6E-12 | Página print-ready da declaração |
| T6E-13 | Busca/filtro + gráficos multiativo |
| T6E-14 | Explicar DARF (breakdown) |
| T6E-15 | Simulador “e se eu vender?” |
| T6E-16 | Evolução do custo da carteira no tempo |
| T6E-17 | Checklist da declaração |
| T6E-18 | Cards de insight automático |

---

## Test Coverage Matrix

> Guidelines: `AGENTS.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Domain | unit | MVP + regras usadas pelos T6E | `src/domain/**/*.test.ts` | `npm test` |
| Application | unit | Casos de uso novos da expansão | `src/application/**/*.test.ts` | `npm test` |
| Import | unit | Já coberto em T4 | `src/infrastructure/import/**/*.test.ts` | `npm test` |
| Persistence | integration | T5 | `**/*.integration.test.ts` | `npm run test:integration` |
| HTTP | integration | Cada rota T6/T6.x: feliz + validação + erro | `src/interface/http/**/*.integration.test.ts` | `npm run test:integration` |
| Web UI | unit | Render + fluxo + vazio/erro | `src/interface/web/**/*.test.tsx` | `npm test` |
| Entity/config | none | build gate | - | build |

---

## Gate Check Commands

| Gate Level | Command |
| ---------- | ------- |
| Quick | `npm test` |
| Full | `npm test && npm run test:integration` |
| Build | `npm run build && npm test` |

---

## Execution Plan

### Phase 1–2–3 (núcleo)

```
T1
T2 T3 T4 T5 T6
T7
```

### Phase 4: Expansão T6 (apresentação) — subtarefas da interface

Ordem sugerida (pode paralelizar após T6.1 + T6.2):

```
T6.1 -> T6.2 -> T6.3
T6.2 -> T6.13
T6.3 -> T6.6
T6.3 -> T6.14
T6.3 -> T6.16
T6.3 -> T6.18
T6 -> T6.4
T6 -> T6.5
T6 -> T6.7
T6 -> T6.8
T6 -> T6.9
T6 -> T6.10
T6 -> T6.11
T6 -> T6.12
T6 -> T6.15
T6 -> T6.17
```

T6.1–T6.14(+15–18) **Dependem de T6** (base). Preferem T7 quando existir; até lá usam mocks/seed.

---

## Task Breakdown

### T1–T5, T7

*(inalterados em escopo; ver histórico do arquivo / commits. Resumo:)*

| Task | Status |
| ---- | ------ |
| T1 Create shared kernel | ✅ |
| T2 Position engine | ✅ |
| T3 Tax engine | ✅ |
| T4 Spreadsheet import | ✅ |
| T5 Postgres persistence | Pendente |
| T7 Wire use cases | Pendente |

Detalhes de Done when de T1–T5 e T7 permanecem os do plano anterior.

---

### T6: Build HTTP API and web UI (base)

**Status**: ✅ Concluída (núcleo)
**Validation**: 5 unit UI + 11 integration HTTP; neobank inicial.

**What**: Rotas e telas base (import, carteira, mensal, declaração) com ports mockadas.
**Where**: `src/interface/`
**Depends on**: T1
**Requirement**: MVP-14

**Done when**:

- [x] `POST /imports`, `GET /portfolio`, `GET /apuration?month=`, `GET /declaration?year=`, `GET /health`
- [x] 400/415; UI vazio/sucesso/erro
- [x] UI não calcula PM/DARF
- [x] Gate: `npm test && npm run test:integration`

**Tests**: integration  
**Gate**: full

**Nota:** a apresentação **não encerra** na T6 base. Continua em T6.1–T6.18 abaixo.

---

### T6.1: Apply ocean visual theme

**What**: Trocar o tema roxo por **azul + verde-água** em `DESIGN.md` e CSS da UI (topbar, CTAs, money, canvas).
**Where**: `DESIGN.md`, `src/interface/web/styles.css`, cores dos charts
**Depends on**: T6
**Requirement**: T6E-01

**Tools**: Skill tlc-spec-driven

**Done when**:

- [x] Tokens de marca azul/verde-água documentados em `DESIGN.md`
- [x] UI usa o novo tema (sem roxo residual de marca)
- [x] Gate: `npm test`
- [x] Test count: suite UI existente continua passando

**Status**: ✅ Concluída (tema oceano aplicado com o plano)

**Tests**: unit  
**Gate**: quick

---

### T6.2: Build demo seed portfolio

**What**: Seed rica (≥5 tickers, day+swing, FII, provento) + ação “Carregar demonstração” / `POST /demo/reset`.
**Where**: `src/interface/http`, mocks/seed, UI
**Depends on**: T6
**Requirement**: T6E-02

**Done when**:

- [x] Reset demo recria carteira determinística
- [x] Portfolio/apuração/declaração refletem a seed
- [x] Gate: `npm test && npm run test:integration`
- [x] Test count: ≥6 novos

**Status**: ✅ Concluída (6 integration + 1 UI)

**Tests**: integration  
**Gate**: full

---

### T6.3: Build investor dashboard

**What**: Home com KPIs: custo investido, nº de ativos, DARF do mês, % isenção usada.
**Where**: `src/interface/web` (+ agregação HTTP se preciso)
**Depends on**: T6, T6.2
**Requirement**: T6E-03

**Done when**:

- [x] Dashboard é entrada padrão
- [x] KPIs vêm da API/ports (sem regra fiscal no React)
- [x] Vazio/loading/erro
- [x] Gate: full
- [x] Test count: ≥8

**Status**: ✅ Concluída (4 HTTP + 4 UI dashboard)

**Tests**: unit + integration  
**Gate**: full

---

### T6.4: Build operations timeline

**What**: Timeline cronológica de operações e eventos.
**Where**: `src/interface/`
**Depends on**: T6
**Requirement**: T6E-04

**Done when**:

- [ ] Listagem ordenada (API ou mock)
- [ ] UI timeline com tipo, ticker, data
- [ ] Gate: full
- [ ] Test count: ≥8

**Tests**: unit + integration  
**Gate**: full

---

### T6.5: Build DARF calendar

**What**: Meses com DARF > 0 e vencimento (regra assumida documentada: último dia útil do mês seguinte).
**Where**: domain tax helpers + UI
**Depends on**: T6
**Requirement**: T6E-05

**Done when**:

- [ ] Port/UI lista obrigações + vencimento
- [ ] Teste da regra de vencimento
- [ ] Gate: full
- [ ] Test count: ≥8

**Tests**: unit + integration  
**Gate**: full

---

### T6.6: Build exemption progress meter

**What**: Barra 0–20.000 da isenção mensal (só ações swing) com estados ok/atenção/excedido.
**Where**: domain + UI
**Depends on**: T6, T6.3
**Requirement**: T6E-06

**Done when**:

- [ ] Domínio expõe consumo/saldo
- [ ] FII e day trade fora do medidor
- [ ] Gate: quick
- [ ] Test count: ≥8

**Tests**: unit  
**Gate**: quick

---

### T6.7: Build day vs swing breakdown

**What**: Cards/gráfico day vs swing (resultado, imposto, prejuízo).
**Where**: `src/interface/`
**Depends on**: T6
**Requirement**: T6E-07

**Done when**:

- [ ] Buckets lado a lado sem misturar modalidades
- [ ] Gate: full
- [ ] Test count: ≥8

**Tests**: unit + integration  
**Gate**: full

---

### T6.8: Build loss carryforward tracker

**What**: Evolução do prejuízo a compensar por modalidade.
**Where**: domain + UI
**Depends on**: T6
**Requirement**: T6E-08

**Done when**:

- [ ] Saldos day/swing separados
- [ ] UI lista evolução
- [ ] Gate: quick
- [ ] Test count: ≥8

**Tests**: unit  
**Gate**: quick

---

### T6.9: Build asset detail view

**What**: Detalhe do ticker: posição, PM, custo, trecho do histórico.
**Where**: `src/interface/web`
**Depends on**: T6
**Requirement**: T6E-09

**Done when**:

- [ ] Abre a partir da carteira/gráfico
- [ ] Sem recalcular PM na UI
- [ ] Gate: quick
- [ ] Test count: ≥6

**Tests**: unit  
**Gate**: quick

---

### T6.10: Build year-over-year comparison

**What**: Comparar dois anos (custo 31/12, rendimentos, DARF).
**Where**: application/interface
**Depends on**: T6
**Requirement**: T6E-10

**Done when**:

- [ ] Endpoint/port de comparação
- [ ] UI lado a lado
- [ ] Gate: full
- [ ] Test count: ≥8

**Tests**: unit + integration  
**Gate**: full

---

### T6.11: Export annual declaration CSV

**What**: Download CSV de Bens e Rendimentos.
**Where**: HTTP + UI
**Depends on**: T6
**Requirement**: T6E-11

**Done when**:

- [ ] Rota CSV + botão na UI
- [ ] Conteúdo alinhado à declaração JSON
- [ ] Gate: full
- [ ] Test count: ≥6

**Tests**: unit + integration  
**Gate**: full

---

### T6.12: Build print-ready IR summary

**What**: Visão limpa com CSS `@media print`.
**Where**: `src/interface/web`
**Depends on**: T6
**Requirement**: T6E-12

**Done when**:

- [ ] Layout print esconde nav/CTAs
- [ ] Gate: quick
- [ ] Test count: ≥4

**Tests**: unit  
**Gate**: quick

---

### T6.13: Polish search and multi-asset charts

**What**: Filtro por ticker + gráficos estáveis com muitos ativos.
**Where**: `src/interface/web`
**Depends on**: T6, T6.2
**Requirement**: T6E-13

**Done when**:

- [ ] Filtro afeta tabela e destaque do gráfico
- [ ] Gate: quick
- [ ] Test count: ≥6

**Tests**: unit  
**Gate**: quick

---

### T6.14: Explain DARF breakdown

**What**: Painel “Por que este DARF?” com lucro, isenção aplicada, base e alíquota.
**Where**: domain tax + UI
**Depends on**: T6, T6.3
**Requirement**: T6E-14

**Done when**:

- [ ] Breakdown estruturado na API/port
- [ ] UI só exibe (não calcula alíquota)
- [ ] Gate: quick
- [ ] Test count: ≥6

**Tests**: unit  
**Gate**: quick

---

### T6.15: Build sell-what-if simulator

**What**: Simular venda (ticker, qtd, preço) e estimar impacto no IR do mês **sem persistir**.
**Where**: application + UI
**Depends on**: T6
**Requirement**: T6E-15

**Done when**:

- [ ] Simulação read-only
- [ ] Resultado mostra ganho/perda e IR estimado
- [ ] Gate: full
- [ ] Test count: ≥8

**Tests**: unit + integration  
**Gate**: full

---

### T6.16: Build portfolio cost evolution chart

**What**: Série temporal do custo da carteira (mês a mês) a partir dos eventos.
**Where**: application + UI charts
**Depends on**: T6, T6.3
**Requirement**: T6E-16

**Done when**:

- [ ] Série derivada de eventos
- [ ] Gráfico de linha na UI
- [ ] Gate: full
- [ ] Test count: ≥6

**Tests**: unit + integration  
**Gate**: full

---

### T6.17: Build declaration checklist

**What**: Checklist (Bens, Rendimentos, DARF do ano) com estados pendente/ok para revisão.
**Where**: `src/interface/web`
**Depends on**: T6
**Requirement**: T6E-17

**Done when**:

- [ ] Itens ligados aos dados da declaração/apuração
- [ ] Toggle “conferido” (estado de UI ok no MVP)
- [ ] Gate: quick
- [ ] Test count: ≥4

**Tests**: unit  
**Gate**: quick

---

### T6.18: Build automatic insight cards

**What**: 2–4 cards de insight (“X% do custo em FIIs”, “mês com maior DARF”) a partir dos dados.
**Where**: application leve + UI
**Depends on**: T6, T6.3
**Requirement**: T6E-18

**Done when**:

- [ ] Insights calculados fora do React (port/helper)
- [ ] Cards no dashboard
- [ ] Gate: quick
- [ ] Test count: ≥6

**Tests**: unit  
**Gate**: quick

---

## Phase Execution Map

```
T1 -> T2
T1 -> T3
T1 -> T4
T1 -> T5
T1 -> T6
T2 -> T7
T3 -> T7
T4 -> T7
T5 -> T7
T6 -> T7
T6 -> T6.1
T6 -> T6.2
T6.1 -> T6.2
T6.2 -> T6.3
T6.2 -> T6.13
T6 -> T6.4
T6 -> T6.5
T6 -> T6.7
T6 -> T6.8
T6 -> T6.9
T6 -> T6.10
T6 -> T6.11
T6 -> T6.12
T6 -> T6.15
T6 -> T6.17
T6.3 -> T6.6
T6.3 -> T6.14
T6.3 -> T6.16
T6.3 -> T6.18
```

**Execute sugerido da expansão T6:**  
T6.1 → T6.2 → T6.3 → T6.6 → T6.14 → T6.18 → T6.16 → T6.7 → T6.8 → T6.5 → T6.4 → T6.9 → T6.13 → T6.15 → T6.10 → T6.17 → T6.11 → T6.12  
(T5/T7 podem seguir em paralelo quando o time for ao wiring.)

---

## Assumptions

| Assumption | Default | Confirmed? |
| ---------- | ------- | ---------- |
| Tema | Azul + verde-água (oceano) | y |
| Modo Apresentar | Fora | y |
| Seed demo | Dentro da T6 (T6.2) | y |
| Expansão com mocks | Sim, até T7 | y |
| Cotação ao vivo | Fora | y |
| Auth | Fora | y |
| Vencimento DARF | Último dia útil do mês seguinte | n |

---

## Task Granularity Check

| Task | Status |
| ---- | ------ |
| T1–T4, T6 | ✅ |
| T5, T7 | Pendente |
| T6.1 | ✅ Tema oceano |
| T6.2 | ✅ Seed demo |
| T6.3 | ✅ Dashboard KPIs |
| T6.4–T6.18 | Planejada (expansão apresentação) |

---

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram | Status |
| ---- | ---------- | ------- | ------ |
| T6.1 | T6 | T6 -> T6.1 | Match |
| T6.2 | T6 | T6 -> T6.2 | Match |
| T6.3 | T6, T6.2 | T6.2 -> T6.3 | Match |
| T6.4–T6.5, T6.7–T6.12, T6.15, T6.17 | T6 | T6 -> … | Match |
| T6.6, T6.14, T6.16, T6.18 | T6.3 | T6.3 -> … | Match |
| T6.13 | T6, T6.2 | T6.2 -> T6.13 | Match |

---

## Roteiro sugerido da apresentação (produto)

1. Tema oceano + **Carregar demonstração** (T6.1–T6.2)  
2. **Dashboard** + insights (T6.3, T6.18)  
3. Importar planilha (fluxo base T6)  
4. Carteira, filtro, gráficos, detalhe (T6.13, T6.9)  
5. Evolução do custo (T6.16)  
6. Isenção + explicar DARF (T6.6, T6.14)  
7. Day vs swing + prejuízo (T6.7, T6.8)  
8. Calendário DARF (T6.5)  
9. Timeline (T6.4)  
10. Simulador de venda (T6.15)  
11. Declaração, checklist, YoY (T6.17, T6.10)  
12. Export CSV + impressão (T6.11, T6.12)

---

## Próximo passo de Execute

1. **T6.1** (tema oceano) — pode começar já  
2. **T6.2** (seed)  
3. **T6.3** (dashboard)  
4. Demais T6.x na ordem sugerida  
5. Em paralelo de infraestrutura: **T5** → **T7**
