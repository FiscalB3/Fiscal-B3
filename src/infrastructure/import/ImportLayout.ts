export type ImportRow = {
  tipo: string;
  data: string;
  ticker: string;
  tipo_ativo: string;
  operacao?: string;
  quantidade?: string;
  preco_unitario?: string;
  corretagem?: string;
  taxas_b3?: string;
  tipo_evento_corporativo?: string;
  fator?: string;
  cnpj?: string;
  tipo_provento?: string;
  valor?: string;
};

export const REQUIRED_HEADERS = [
  "tipo",
  "data",
  "ticker",
  "tipo_ativo",
  "operacao",
  "quantidade",
  "preco_unitario",
  "corretagem",
  "taxas_b3",
  "tipo_evento_corporativo",
  "fator",
  "cnpj",
  "tipo_provento",
  "valor",
];

export type ImportError = {
  lineNumber: number;
  error: string;
};

export type ImportResult = {
  success: boolean;
  rows?: ImportRow[];
  errors?: ImportError[];
};
