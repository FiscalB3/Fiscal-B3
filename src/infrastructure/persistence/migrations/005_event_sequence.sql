CREATE SEQUENCE portfolio_event_sequence;
ALTER TABLE operacoes ADD COLUMN event_sequence BIGINT;
ALTER TABLE proventos ADD COLUMN event_sequence BIGINT;
ALTER TABLE eventos_corporativos ADD COLUMN event_sequence BIGINT;

-- Legacy T5 data has no cross-table intraday ordering. Backfill deterministically.
DO $$
DECLARE event_record RECORD;
BEGIN
  FOR event_record IN
    SELECT 'operacoes' AS source, id, data FROM operacoes
    UNION ALL SELECT 'proventos', id, data FROM proventos
    UNION ALL SELECT 'eventos_corporativos', id, data FROM eventos_corporativos
    ORDER BY data, source, id
  LOOP
    EXECUTE format('UPDATE %I SET event_sequence = nextval(''portfolio_event_sequence'') WHERE id = $1', event_record.source)
    USING event_record.id;
  END LOOP;
END $$;

ALTER TABLE operacoes ALTER COLUMN event_sequence SET DEFAULT nextval('portfolio_event_sequence'), ALTER COLUMN event_sequence SET NOT NULL;
ALTER TABLE proventos ALTER COLUMN event_sequence SET DEFAULT nextval('portfolio_event_sequence'), ALTER COLUMN event_sequence SET NOT NULL;
ALTER TABLE eventos_corporativos ALTER COLUMN event_sequence SET DEFAULT nextval('portfolio_event_sequence'), ALTER COLUMN event_sequence SET NOT NULL;
