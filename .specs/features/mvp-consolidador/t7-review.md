# T7 — revisão de adequação pelo autor

Escopo: `t7-spec.md`, AC1–AC12. Base da integração: `999df10`; implementação inicial: `b8cbae5`. Esta revisão não substitui o Verifier independente.

## Suficiência: critério → evidência

| AC | Resultado exigido | Evidência e assertion |
| --- | --- | --- |
| 1 | CSV/XLSX gravados; HTTP 200; posição e apuração reais | `src/infrastructure/t7.integration.test.ts:46` — `expect(await counts()).toEqual({ assets: 1, operations: 2, incomes: 1, actions: 0 })`; `:62` — `expect(response.status).toBe(200)`; `:65` — quantidade 80; `:66` — DARF 2000 centavos |
| 2 | Linha inválida: HTTP 400, linha/mensagem, histórico intacto | `src/infrastructure/t7.integration.test.ts:74` — `expect(response.body).toEqual({ errors: [{ line: 3, message: "Quantidade deve ser um número positivo" }] })`; `:75` — counts 1/1/0/0 |
| 3 | Histórico inválido: nenhum ativo/evento gravado | `src/infrastructure/t7.integration.test.ts:81` — erro `Insufficient position for TEST11`, linha 0; `:82` — counts 0/0/0/0 |
| 4 | Falha posterior no banco: rejeição e rollback integral | `src/infrastructure/t7.integration.test.ts:98` — `rejects.toThrow("T7 controlled write failure")`; `:100` — `expect(await counts()).toEqual({ assets: 0, operations: 0, incomes: 0, actions: 0 })` |
| 5 | Nova conexão reconstrói valores; tipos na mesma data mantêm ordem | `src/infrastructure/t7.integration.test.ts:111` — custo 80000; `:112` — DARF 2000; `:120` — quantidade 200; `:121` — PM 500; `:125` — sequência crescente |
| 6 | Arquivo fora de ordem e lotes separados ordenados por data | `src/infrastructure/t7.integration.test.ts:132` — datas `2024-01-02`, `2024-02-02`, `2024-02-10`; `:131` — quantidade 80 |
| 7 | Posição em 31/12; rendimentos apenas do ano | `src/infrastructure/t7.integration.test.ts:140` — quantidade 80; `:141` — custo 80000; `:142` — rendimentos `[0, 0, 800, 10000]` |
| 8 | Vazio não inventa carteira/rendimentos | `src/infrastructure/t7.integration.test.ts:146` — carteira `[]`; `:147` — resultado, isenção e DARF zero; `src/application/use-cases/createPortfolioUseCases.test.ts:70` — rendimentos `[0, 0, 0, 0]` |
| 9 | Vendas concorrentes não excedem estoque | `src/infrastructure/t7.integration.test.ts:155` — status `[200, 400]`; `:156` — quantidade restante 20; `:157` — somente duas operações |
| 10 | Falha de leitura propagada, sem fallback fictício | `src/application/use-cases/createPortfolioUseCases.test.ts:59` — carteira rejeita `database offline`; `:60` — apuração rejeita; `:61` — declaração rejeita |
| 11 | Interface real abre carteira e exibe só núcleo | `src/interface/web/App.test.tsx:101` — Carteira `aria-current=page`; `:103` — demonstração ausente; `:104` — Simular ausente; `:105`–`:107` — seções do núcleo presentes |
| 12 | Extras indisponíveis devolvem HTTP 503 e não alteram dados | `src/infrastructure/t7.integration.test.ts:163` — status 503; `:164` — mensagem explícita; `:166` — reset retorna 503; `:167` — counts 0/0/0/0 |

## Necessidade: teste → requisito

| Teste e assertion | AC | Manter |
| --- | --- | --- |
| `src/application/use-cases/createPortfolioUseCases.test.ts:30` — resultado de importação `{ok:true}`; `:32` — posição completa | 1 | Sim |
| `src/application/use-cases/createPortfolioUseCases.test.ts:38` — linha/mensagem; `:39` — histórico preservado | 2 | Sim |
| `src/application/use-cases/createPortfolioUseCases.test.ts:46` — rejeição de histórico; `:47` — vazio | 3 | Sim |
| `src/application/use-cases/createPortfolioUseCases.test.ts:53` — erro de persistência propagado | 4 | Sim |
| `src/application/use-cases/createPortfolioUseCases.test.ts:59` — rejeição de leitura, também linhas 60/61 | 10 | Sim |
| `src/application/use-cases/createPortfolioUseCases.test.ts:67` — valores zero; `:70` — rendimentos zero | 8 | Sim |
| `src/infrastructure/t7.integration.test.ts:49` — carteira completa; `:52` — apuração; `:55` — declaração | 1, 7 | Sim |
| `src/infrastructure/t7.integration.test.ts:62` — XLSX HTTP 200; `:66` — DARF 2000 | 1 | Sim |
| `src/infrastructure/t7.integration.test.ts:75` — histórico preservado | 2 | Sim |
| `src/infrastructure/t7.integration.test.ts:82` — nenhum ativo/evento inserido | 3 | Sim |
| `src/infrastructure/t7.integration.test.ts:100` — rollback após gravação parcial | 4 | Sim |
| `src/infrastructure/t7.integration.test.ts:111` — reconstrução com novo pool | 5 | Sim |
| `src/infrastructure/t7.integration.test.ts:124` — ordem dos tipos preservada | 5–6 | Sim |
| `src/infrastructure/t7.integration.test.ts:132` — ordem cronológica | 6 | Sim |
| `src/infrastructure/t7.integration.test.ts:142` — ano isolado | 7 | Sim |
| `src/infrastructure/t7.integration.test.ts:147` — resposta vazia real | 8 | Sim |
| `src/infrastructure/t7.integration.test.ts:155` — concorrência serializada | 9 | Sim |
| `src/infrastructure/t7.integration.test.ts:164` — indisponibilidade explícita | 12 | Sim |
| `src/interface/web/App.test.tsx:101` — entrada real na carteira | 11 | Sim |

## Integridade dos testes

O cenário anterior do teste de rollback usava quantidade fracionária e falhava antes de chegar ao banco. Após a autorização de continuidade do usuário, a fixture foi trocada por uma falha controlada em trigger no schema isolado da suíte. A assertion foi fortalecida para conferir a mensagem exata; a contagem zero de todas as tabelas permanece. Nenhum teste foi removido ou desabilitado.

Assertions verificam valores retornados e estado persistido, não apenas chamadas de mocks. Testes de aplicação usam portas; testes PostgreSQL comprovam transações reais e efeitos HTTP. Localização e tipos seguem `AGENTS.md`. O gate e a revisão independente determinam a conclusão final.
