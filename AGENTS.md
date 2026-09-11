# Project Instructions

## Project

Consolidador de Investimentos B3 para ações e FIIs.

Objetivos do MVP:

* Importar operações via CSV/XLSX.
* Calcular posição e preço médio.
* Apurar resultados mensais.
* Identificar obrigações de IR/DARF.
* Gerar informações para declaração anual.

Priorize correção, rastreabilidade e testabilidade.

## Stack

* Node.js
* TypeScript
* PostgreSQL
* Frontend e backend no mesmo projeto
* SQL migrations

Use TypeScript para código novo.

## Architecture

Siga princípios de Hexagonal Architecture / Ports and Adapters.

* `domain`: regras de negócio puras.
* `application`: casos de uso e portas.
* `infrastructure`: banco, importadores e integrações.
* `interface`: API e frontend.

O domínio não deve depender de banco de dados, HTTP, framework ou UI.

Regras de negócio não devem ficar em controllers, routes ou componentes.

## Domain Rules

* Compras recalculam o preço médio.
* Vendas usam o preço médio atual e não alteram o preço médio unitário.
* Day trade e swing trade são modalidades distintas.
* Prejuízos só podem ser compensados dentro da mesma modalidade.
* Regras de isenção devem ser aplicadas conforme o tipo de ativo e operação.
* Desdobramentos e grupamentos ajustam quantidade e preço médio proporcionalmente, sem criar operações fictícias.
* Cálculos monetários devem usar precisão adequada; não dependa cegamente de `float`.

Regras tributárias detalhadas devem ser definidas nas specs e cobertas por testes, não duplicadas neste arquivo.

## Data

* PostgreSQL é a fonte de persistência.
* Alterações de schema devem usar migrations.
* Resultados derivados devem ser reconstruíveis a partir dos eventos/operações.
* MVP: CSV/XLSX.
* Parsing de PDF fica fora do MVP.

## Tests

Regras de domínio devem possuir testes unitários.

Cubra especialmente:

* múltiplas compras;
* vendas parciais e totais;
* day trade;
* swing trade;
* prejuízos e compensações;
* desdobramentos e grupamentos;
* limites de isenção;
* múltiplos ativos;
* entradas fora de ordem.

Uma feature não está concluída enquanto seus critérios de aceitação e testes não estiverem passando.

## Git & Security

* Use Conventional Commits.
* Prefira commits pequenos e atômicos.
* Não versione `.env`, secrets, credenciais ou arquivos gerados.
* Não faça refatorações não relacionadas à tarefa.
* Alterações relevantes de API ou banco devem estar respaldadas por uma spec.

## Spec-Driven Development

Use `tlc-spec-driven` como fonte de verdade para o processo de Spec-Driven Development.

Use `.specs/` para:

* specifications;
* decisões;
* tasks;
* estado do projeto;
* validações.

Não replique neste arquivo as regras ou o workflow definidos pela skill.