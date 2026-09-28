CREATE TABLE IF NOT EXISTS operacoes (
    id SERIAL PRIMARY KEY,
    ativo_id INTEGER NOT NULL REFERENCES ativos (id),
    data DATE NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('COMPRA', 'VENDA')),
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario_centavos BIGINT NOT NULL,
    corretagem_centavos BIGINT NOT NULL,
    taxas_b3_centavos BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operacoes_data ON operacoes (data, id);
CREATE INDEX IF NOT EXISTS idx_operacoes_ativo ON operacoes (ativo_id);