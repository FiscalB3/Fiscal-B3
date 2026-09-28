/** Short glossary for inline help tips (MVP tax UX). */
export const HELP = {
  custoInvestido:
    "Soma do custo de aquisição das posições abertas (quantidade × preço médio).",
  darf: "Documento de Arrecadação de Receitas Federais — guia usada para pagar o IR sobre ganhos em bolsa.",
  isencao:
    "Vendas de ações em swing trade até R$ 20.000 no mês ficam isentas de IR. Day trade e FIIs não entram nesse limite.",
  dayTrade: "Compra e venda do mesmo ativo no mesmo dia. Tem alíquota e compensação de prejuízo separadas do swing.",
  swingTrade:
    "Operações em que a posição fica aberta por mais de um dia. Pode aproveitar a isenção mensal de R$ 20.000 em ações.",
  prejuizoCompensar:
    "Perdas acumuladas que podem abater lucros futuros — só dentro da mesma modalidade (day com day, swing com swing).",
  apuracao:
    "Cálculo mensal do resultado das vendas, aplicação da isenção e estimativa do imposto (DARF).",
  baseTributavel: "Valor do lucro após descontar isenção e prejuízos — é sobre ele que a alíquota incide.",
  precoMedio:
    "Custo médio ponderado das compras. Novas compras recalculam; vendas usam o preço médio atual sem alterá-lo.",
  bensDireitos: "Posições em aberto no fim do ano, declaradas em Bens e Direitos da DIRPF pelo custo de aquisição.",
  vencimentoDarf:
    "Em geral, o DARF do mês vence no último dia útil do mês seguinte ao da operação.",
  simularVenda:
    "Estima ganho e IR como se a venda ocorresse no mês escolhido, sem gravar a operação na carteira.",
} as const;
