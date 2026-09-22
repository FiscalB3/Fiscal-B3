# Consolidador B3 MVP Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Paralelismo (este plano):** depois de T1, T2–T6 são workstreams independentes. Pessoas diferentes podem executá-las ao mesmo tempo. Não esperar o motor de posição para começar importação, persistência, fiscal ou interface. T7 só começa quando T2–T6 terminaram.

---

**Fonte de produto**: PDF *Consolidador B3 - Projeto e MVP* + `AGENTS.md`
**Design**: ainda não há `design.md`; os caminhos seguem hexagonal + schema do PDF
**Spec**: ainda não há `spec.md` confirmada; IDs `MVP-NN` são o catálogo provisório
**Status**: T1–T4 concluídas; T5–T7 pendentes

---

## Workstreams

O contrato compartilhado (T1) é o único bloqueio. T2 e T3 não se esperam: o fiscal consome `SalePnL` e `PositionSnapshot` definidos em T1, com fixtures, até o motor de posição existir.

| Stream | Tarefa | Dono sugerido | Pode paralelo com |
| ------ | ------ | ------------- | ----------------- |
| Kernel | T1 | 1 pessoa | nada (vai primeiro) |
| Posição | T2 | 1 pessoa | T3, T4, T5, T6 |
| Fiscal | T3 | 1 pessoa | T2, T4, T5, T6 |
| Importação | T4 | 1 pessoa | T2, T3, T5, T6 |
| Persistência | T5 | 1 pessoa | T2, T3, T4, T6 |
| Interface | T6 | 1 pessoa | T2, T3, T4, T5 |
| Integração | T7 | o time | ninguém (junta tudo) |

Fora do MVP: parsing de PDF, ouro, auth multi-usuário, layout por corretora.

---

## Requirement Catalog

| ID | Requisito |
| -- | --------- |
| MVP-01 | Importar operações por CSV/XLSX em layout fixo |
| MVP-02 | Compra recalcula preço médio ponderado |
| MVP-03 | Venda usa preço médio vigente e não altera o preço médio unitário |
| MVP-04 | Expor posição atual (quantidade + preço médio) por ativo |
| MVP-05 | Classificar day trade vs swing trade |
| MVP-06 | Compensar prejuízo só na mesma modalidade |
| MVP-07 | Isenção de R$ 20.000/mês só para venda de ações à vista fora de day trade; FII sem isenção |
| MVP-08 | Sinalizar DARF do mês quando houver ganho tributável |
| MVP-09 | Desdobramento/grupamento ajusta quantidade e preço médio sem operação fictícia |
| MVP-10 | Relatório anual: Bens e Direitos (posição 31/12 e custo) |
| MVP-11 | Relatório anual: Rendimentos (proventos e ganhos de capital) |
| MVP-12 | Posição e apuração sempre derivadas de eventos; nunca digitadas |
| MVP-13 | Cálculo monetário sem `float` cego |
| MVP-14 | Domínio puro: sem Postgres, HTTP ou UI |
| MVP-15 | Persistir em PostgreSQL via migrations |
| MVP-16 | PDF fora do MVP |

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`. Sem runner no repositório: comandos abaixo nascem em T1.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Domain (`src/domain`) | unit | Ramos das regras `MVP-02`–`MVP-13`; casos de `AGENTS.md` | `src/domain/**/*.test.ts` | `npm test` |
| Application (`src/application`) | unit | Cada caso de uso: feliz + validação + falha de porta | `src/application/**/*.test.ts` | `npm test` |
| Import parsers (`src/infrastructure/import`) | unit | Layout válido, linha inválida, CSV e XLSX equivalentes | `src/infrastructure/import/**/*.test.ts` | `npm test` |
| Persistence (`src/infrastructure/persistence`) | integration | Insert/query; rebuild entra em T7 | `src/infrastructure/persistence/**/*.integration.test.ts` | `npm run test:integration` |
| HTTP (`src/interface/http`) | integration | Cada rota: feliz + validação + erro (T6 pode usar ports mockadas) | `src/interface/http/**/*.integration.test.ts` | `npm run test:integration` |
| Web UI (`src/interface/web`) | unit | Render + fluxo principal + vazio/erro | `src/interface/web/**/*.test.tsx` | `npm test` |
| Entity / config / schema / migrations | none | Gate de build | - | build gate only |

---

## Gate Check Commands

> Generated from intended Node/TS toolchain (T1 cria os scripts). Confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Workstream só com unit | `npm test` |
| Full | Persistência, HTTP ou integração | `npm test && npm run test:integration` |
| Build | Kernel e fim de fase | `npm run build && npm test` |

---

## Execution Plan

Fase 1 termina. Fase 2 os cinco workstreams rodam em paralelo. Fase 3 espera os cinco.

### Phase 1: Kernel compartilhado

```
T1
```

### Phase 2: Workstreams paralelos

Sem seta entre T2–T6. Ninguém desta fase depende de outro desta fase.

```
T2
T3
T4
T5
T6
```

### Phase 3: Integração

```
T7
```

---

## Task Breakdown

### Phase 1: Kernel compartilhado

### T1: Create shared kernel

**Status**: ✅ Concluída
**Validation**: `npm run build && npm test` → sucesso; 2 arquivos de teste, 10 testes aprovados.

**What**: Entregar a plataforma e o contrato que todos os workstreams importam: tooling Node/TS/Vitest/Postgres local, `Money`, tipos de evento, e ports de aplicação + DTOs `PositionSnapshot` e `SalePnL`.
**Where**: `src/domain/`
**Depends on**: None
**Reuses**: `AGENTS.md`, PDF do MVP
**Requirement**: MVP-13

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Contrato que T1 congela (não mudar sem acordo do time):**

- `Money` sem `float` cego
- `Asset`, `Operation`, `CorporateAction`, `Income`, união `PortfolioEvent` e ordenação determinística
- `PositionSnapshot` (quantidade, preço médio, custo)
- `SalePnL` (ativo, data, modalidade day/swing, resultado, valor vendido, tipo ação/FII)
- Ports: `ImportOperations`, `GetPortfolio`, `GetMonthlyApuration`, `GetAnnualDeclaration` (só interfaces)
- `PositionEngine` (interface): replay de eventos → snapshots; vendas → `SalePnL[]`

**Done when**:

- [x] `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `docker-compose.yml` existem
- [x] Scripts `build`, `test`, `test:integration` existem
- [x] Tipos e ports compilam; domínio não importa infra
- [x] Testes de `Money` e de ordenação de eventos passam
- [x] Gate check passes: `npm run build && npm test`
- [x] Test count: 10 tests pass (no silent deletions)

**Tests**: unit
**Gate**: build

---

### Phase 2: Workstreams paralelos

### T2: Build position engine

**Status**: ✅ Concluída
**Validation**: `npm run build && npm test` → sucesso; 3 arquivos de teste, 18 testes aprovados. Sensor de discriminação matou o mutante de desdobramento.

**What**: Implementar o motor de posição: compra ponderada, venda sem alterar preço médio, desdobramento/grupamento, replay multi-ativo e entrada fora de ordem.
**Where**: `src/domain/position/`
**Depends on**: T1
**Reuses**: contrato T1 (`PortfolioEvent`, `PositionEngine`)
**Requirement**: MVP-02

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Não faz:** alíquota, isenção, DARF, CSV, HTTP, SQL.

**Done when**:

- [x] Implementa `PositionEngine` do kernel
- [x] Múltiplas compras, venda parcial/total, split, dois tickers, lista embaralhada cobertos
- [x] Venda acima da posição rejeitada; provento não mexe quantidade/preço médio
- [x] Gate check passes: `npm test`
- [x] Test count: 18 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

---

### T3: Build tax engine

**Status**: ✅ Concluída
**Validation**: `npm test` → sucesso; 4 arquivos de teste, 27 testes aprovados.

**What**: Implementar apuração: day vs swing, compensação só na mesma modalidade, isenção R$ 20.000, DARF mensal, declaração anual (Bens e Direitos + Rendimentos).
**Where**: `src/domain/tax/`
**Depends on**: T1
**Reuses**: contrato T1 (`SalePnL`, `PositionSnapshot`, `Income`)
**Requirement**: MVP-05

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Não faz:** recalcular preço médio. Usa fixtures de `SalePnL` / snapshots, não espera T2.

**Done when**:

- [x] Day trade e swing em buckets separados
- [x] Prejuízo day não reduz lucro swing
- [x] Isenção só ação swing à vista com vendas ≤ 20000; FII e day trade sem isenção
- [x] Alíquotas: swing ações 15%, day trade 20%, FII 20% (assumidas)
- [x] Declaração anual: posição 31/12 + proventos + ganhos do ano
- [x] Gate check passes: `npm test`
- [x] Test count: 27 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

---

### T4: Build spreadsheet import

**Status**: ✅ Concluída
**Validation**: `npm run build && npm test` → sucesso; 5 arquivos de teste, 46 testes aprovados (19 novos para T4).

**What**: Definir layout fixo e importar CSV/XLSX para `PortfolioEvent[]`, com erros por linha.
**Where**: `src/infrastructure/import/`
**Depends on**: T1
**Reuses**: tipos de evento de T1
**Requirement**: MVP-01

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Não faz:** persistir, calcular IR, UI. Não gera operação fictícia para desdobramento.

**Done when**:

- [x] Layout único para operação, evento corporativo e provento
- [x] CSV e XLSX equivalentes no mesmo conteúdo
- [x] Cabeçalho errado e linha inválida devolvem erro explícito por linha
- [x] Gate check passes: `npm test`
- [x] Test count: 19 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

---

### T5: Build Postgres persistence

**What**: Migrations e repositórios de ativos, operações, proventos e eventos corporativos.
**Where**: `src/infrastructure/persistence/`
**Depends on**: T1
**Reuses**: tipos de T1; schema do PDF + tabela `eventos_corporativos`
**Requirement**: MVP-15

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Não faz:** regra de preço médio ou IR. Rebuild derivado fica em T7.

**Done when**:

- [ ] Migrations `ativos`, `operacoes`, `proventos`, `eventos_corporativos`
- [ ] Repositórios inserem e listam em ordem cronológica
- [ ] Nenhum campo derivado é editável na mão
- [ ] Gate check passes: `npm test && npm run test:integration`
- [ ] Test count: 6 integration tests pass (no silent deletions)

**Tests**: integration
**Gate**: full

---

### T6: Build HTTP API and web UI

**What**: Adapter HTTP e telas (upload, posição, mensal, declaração) contra as ports do kernel, com implementação mockada.
**Where**: `src/interface/`
**Depends on**: T1
**Reuses**: ports de T1
**Requirement**: MVP-14

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Não faz:** lógica de média, IR ou SQL. Mock das ports é suficiente até T7.

**Done when**:

- [ ] `POST /imports`, `GET /portfolio`, `GET /apuration?month=`, `GET /declaration?year=`, `GET /health`
- [ ] 400/415 nos erros de input; UI mostra vazio, sucesso e erro
- [ ] Componentes não calculam preço médio nem DARF
- [ ] Gate check passes: `npm test && npm run test:integration`
- [ ] Test count: 16 tests pass (no silent deletions)

**Tests**: integration
**Gate**: full

---

### Phase 3: Integração

### T7: Wire use cases and derived rebuild

**What**: Ligar import → persistência → `PositionEngine` + motor fiscal → API real; reconstruir posição e apuração só a partir dos eventos.
**Where**: `src/application/`
**Depends on**: T2, T3, T4, T5, T6
**Reuses**: T2–T6
**Requirement**: MVP-12

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [ ] Casos de uso reais substituem mocks de T6
- [ ] Import inválido não persiste; válido persiste e rebuild bate com o domínio
- [ ] Um fluxo ponta a ponta: planilha → posição → mês com DARF → declaração anual
- [ ] Gate check passes: `npm test && npm run test:integration`
- [ ] Test count: 12 tests pass (no silent deletions)

**Tests**: integration
**Gate**: full

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
```

T1 sozinho. T2–T6 em paralelo. T7 espera T2, T3, T4, T5 e T6.

No Execute com um agente só: T1, depois T2…T6 em qualquer ordem, depois T7. Com o time: T2–T6 ao mesmo tempo.

---

## Assumptions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Linguagem | TypeScript (`AGENTS.md`) | Stack do repo, não Python do PDF | n |
| HTTP | Express | Adapter fino | n |
| UI | Vite + React | Frontend no mesmo repo | n |
| Testes | Vitest | Unit no domínio; integration em Postgres/HTTP | n |
| Alíquotas | Swing 15%, day 20%, FII 20% | PDF não cita percentual | n |
| Ouro / auth / PDF | Fora | Escopo do MVP | n |
| Tabela extra | `eventos_corporativos` | Split não pode virar `operacoes` | n |

---

## Task Granularity Check

Granularidade pedida: **módulo / workstream**, não uma função por tarefa.

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | Kernel (tooling + tipos + ports) | ✅ Concluída |
| T2 | Motor de posição | ✅ Concluída |
| T3 | Motor fiscal | ✅ Concluída |
| T4 | Importação | ✅ Concluída |
| T5 | Persistência | Pendente |
| T6 | API + UI | Pendente |
| T7 | Wiring | Pendente |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | (start) | Match |
| T2 | T1 | T1 -> T2 | Match |
| T3 | T1 | T1 -> T3 | Match |
| T4 | T1 | T1 -> T4 | Match |
| T5 | T1 | T1 -> T5 | Match |
| T6 | T1 | T1 -> T6 | Match |
| T7 | T2, T3, T4, T5, T6 | T2–T6 -> T7 | Match |

T2–T6 não têm `Depends on` entre si. Sem seta T2 -> T3 (nem equivalentes) no diagrama da Fase 2.

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | domain + config | unit (domínio) | unit | OK |
| T2 | domain | unit | unit | OK |
| T3 | domain | unit | unit | OK |
| T4 | import parsers | unit | unit | OK |
| T5 | persistence + migrations | integration | integration | OK |
| T6 | HTTP + UI | integration (maior) | integration | OK |
| T7 | application + wiring | unit + integration | integration | OK |
