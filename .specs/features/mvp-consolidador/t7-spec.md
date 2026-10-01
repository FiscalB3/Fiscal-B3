# T7 — Integração dos casos de uso

## Problem Statement

A API usa respostas fictícias. A T7 conecta o importador da T4, os repositórios da T5 e os motores T2/T3 às portas do núcleo. Este documento detalha MVP-12 e os critérios originais da T7 sem redefinir regras fiscais.

## Out of Scope

Alteração das regras dos motores de domínio, autenticação, PDF e publicação remota. A integração real da expansão T6.1–T6.18 é uma entrega posterior; o modo de demonstração mantém essas telas.

## Assumptions & Open Questions

| Assumption | Chosen default | Rationale |
| --- | --- | --- |
| Importação | Tudo ou nada, incluindo validação do replay antes de gravar | Import inválido não persiste |
| Ordem | Data e sequência global persistida nas três tabelas de eventos | Reconstrução precisa sobreviver a reinícios |
| Dados anteriores | Backfill por data, tabela e ID; ordem intradia anterior não é recuperável | T5 não armazenava sequência entre tabelas |
| Declaração | Replay somente até 31/12 do ano consultado | Posição anual não pode incluir eventos futuros |
| Histórico | Importações válidas acrescentam eventos; repetição não é deduplicada | Contrato append-only da T5 |
| Escopo da interface | Quatro seções originais no modo real, expansão apenas no modo demo explícito | Escopo original da T7; pergunta opcional de ampliação sem resposta até o momento |

Open questions: none — o escopo adicional segue a premissa explícita acima, sujeito à resposta do usuário.

## User Stories

Como investidor, quero importar eventos e consultar resultados reconstruídos do PostgreSQL.

**Acceptance Criteria**:
1. WHEN um CSV ou XLSX válido é enviado, the system SHALL persistir todos os eventos e responder HTTP 200 com `{ok:true}`.
2. WHEN qualquer linha é inválida, the system SHALL responder HTTP 400 com linha/mensagem e preservar todos os dados anteriores.
3. WHEN o replay do histórico acrescido dos novos eventos é inválido, the system SHALL rejeitar a importação sem persistir eventos nem ativos.
4. WHEN uma gravação falha no banco, the system SHALL reverter a importação inteira e propagar o erro.
5. WHEN a aplicação é recriada, the system SHALL reconstruir a mesma carteira e apuração a partir dos eventos persistidos, inclusive eventos de tipos distintos na mesma data.
6. WHEN eventos chegam fora de ordem ou em importações separadas, the system SHALL ordenar por data e sequência persistida antes do replay.
7. WHEN a declaração de um ano é consultada, the system SHALL considerar posições até 31/12 e rendimentos/ganhos somente daquele ano.
8. WHEN o banco está vazio, the system SHALL retornar carteira vazia e resultados monetários zero.
9. WHEN duas importações concorrem, the system SHALL validar e gravar cada lote sobre o histórico confirmado, sem permitir venda acima da posição.
10. WHEN há falha de leitura da persistência, the system SHALL propagar a falha sem retornar dados fictícios.
11. WHEN a aplicação inicia no modo real, the system SHALL oferecer Importar, Carteira, Apuração e Declaração, abrir a Carteira e não oferecer a ação de carregar demonstração.
12. WHEN uma rota da expansão ainda não integrada é chamada no modo real, the system SHALL retornar HTTP 503 com mensagem explícita de indisponibilidade, sem consultar mocks nem alterar os dados reais.

## Cenário de referência

Compra de 100 cotas de TEST11 (FII) a R$ 10 em 2024-01-02; venda de 20 a R$ 15 em 2024-02-02; rendimento de R$ 8 em fevereiro. Resultado esperado: quantidade 80, PM R$ 10, custo R$ 800, resultado mensal R$ 100 e DARF R$ 20 segundo o motor T3 existente. Compra posterior de 10 cotas a R$ 20 em 2025 não altera a declaração de 2024. Desdobramento fator 2 após compra na mesma data produz 200 cotas a R$ 5.

## Requirement Traceability

| ID | Critérios | Status |
| --- | --- | --- |
| MVP-12 | 1–10 | implementing |
| MVP-01 | 1–3 | implementing |
| MVP-15 | 4–6, 9–10 | implementing |
| MVP-10 | 7 | implementing |
| MVP-14 | 11–12 | implementing |
