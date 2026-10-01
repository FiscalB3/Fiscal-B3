# Project State

## Decisions

(see feature specs / prior commits)

## Handoff

- **Feature**: mvp-consolidador / T7, seguindo `.cursor/skills/tlc-spec-driven/SKILL.md`.
- **Branch**: `main`, base `999df10` (T5 integrada; snapshot anterior estava desatualizado).
- **Completed**: T1–T6 existentes; T7 ainda NÃO concluída.
- **In-progress**: `src/application/use-cases/createPortfolioUseCases.ts:22`, `src/infrastructure/persistence/PostgresPortfolioStore.ts:25`, `src/infrastructure/t7.integration.test.ts:85`.
- **Implemented**: portas reais do núcleo, importação transacional, sequência global persistida, corte anual, modo real/demo separado e instruções README.
- **Scope assumption**: quatro funções originais da T7; pergunta opcional ao usuário sobre integrar expansão T6 ainda sem resposta. Não confundir demonstração com dados reais.
- **Validation**: TLC validate_tasks e validate_spec passaram; build TypeScript e Vite passaram; 94 unitários passaram; integração 59/60 (11/12 T7 + 48 existentes).
- **Blocker**: aguardando confirmação solicitada ao usuário conforme implement.md para corrigir o cenário novo de rollback. Quantidade fracionária é rejeitada no domínio, antes do banco; substituir fixture por falha controlada no segundo INSERT (trigger temporário) e manter rejeição + contagem zero. Não enfraquecer assertions.
- **Next step**: após confirmação, corrigir cenário, reexecutar gate completo, mapear evidências, commit atômico e Verifier independente com sensor em cópia isolada. Preservar validation.md anterior da T6 como histórico.
- **Uncommitted files**: .gitignore, package.json/lock, README, tasks/t7-spec, portas/casos de uso/testes T7, adaptador de parsing, repositórios/store/migration 005, composição e server HTTP, seleção de modo UI e teste. Nenhum commit T7 criado.
- **Environment**: comandos Python via `py -3.12` e Vitest requereram execução fora do sandbox. PostgreSQL descartável `fiscal-b3-t7-tests`, porta 55437, sem volume; reiniciar para retomar testes. Suíte T5 limpa tabelas: nunca apontar para dados reais.
- **Domain limitations**: T3 não compensa meses anteriores; classificação T2 não separa quantidades parcialmente casadas em day trade. Reutilizados, não alterados pela T7.
