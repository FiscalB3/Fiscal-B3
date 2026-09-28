CREATE TABLE IF NOT EXISTS eventos_corporativos (
    id SERIAL PRIMARY KEY,
    ativo_id INTEGER NOT NULL REFERENCES ativos (id),
    data DATE NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('DESDOBRAMENTO', 'GRUPAMENTO')),
    fator NUMERIC(14, 6) NOT NULL CHECK (fator > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_corporativos_data ON eventos_corporativos (data, id);
CREATE INDEX IF NOT EXISTS idx_eventos_corporativos_ativo ON eventos_corporativos (ativo_id);