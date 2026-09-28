CREATE TABLE IF NOT EXISTS ativos (
    id SERIAL PRIMARY KEY,
    ticker TEXT NOT NULL UNIQUE,
    kind TEXT NOT NULL CHECK (kind IN ('ACAO', 'FII')),
    cnpj TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);