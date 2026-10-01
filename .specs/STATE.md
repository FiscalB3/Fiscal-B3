# Project State

## Decisions

(see feature specs / prior commits)

## Handoff
- **Feature**: mvp-consolidador / T7, processo tlc-spec-driven.
- **Branch**: `feat/t7-integracao-mvp`; implementação inicial no commit `b8cbae5`.
- **Completed**: implementação do núcleo T7; cenário de rollback corrigido com falha PostgreSQL controlada após autorização de continuidade.
- **Validation**: validate_tasks, validate_spec e build passaram; 94 unitários e 60 testes de integração passaram (12 da T7); nenhum teste removido/pulado.
- **Next step**: T7 concluída; próxima ação pode iniciar outra tarefa do MVP.
- **Blockers**: nenhum.
- **Evidence**: `.specs/features/mvp-consolidador/t7-review.md`.
- **Environment**: PostgreSQL temporário `fiscal-b3-t7-tests`, localhost:55437, usuário fiscal, banco fiscal_b3, sem volume e sem senha; somente teste. Python e Vitest exigem execução fora do sandbox neste ambiente.
- **Scope**: quatro funções originais integradas; expansão T6 permanece no modo demo. Motores T2/T3 reutilizados com limitações documentadas em README.
