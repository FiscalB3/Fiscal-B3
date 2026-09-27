CREATE TABLE IF NOT EXISTS proventos (
    id SERIAL PRIMARY KEY,
    ativo_id INTEGER NOT NULL REFERENCES ativos (id),
    data DATE NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('DIVIDENDO', 'JCP', 'RENDIMENTO_FII')),
    valor_centavos BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proventos_data ON proventos (data, id);
CREATE INDEX IF NOT EXISTS idx_proventos_ativo ON proventos (ativo_id);