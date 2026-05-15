-- Bereich 3 Sub-Sprint 3.1: Schema-Erweiterung für CRM-Inbox
--
-- Fügt 4 neue Spalten zur interessenten-Tabelle hinzu:
-- - antwortet_am: wann User auf "Habe geantwortet" geklickt hat
-- - bonitaet: 3-stufige Bewertung (bestaetigt/unklar/kritisch)
-- - bonitaet_notiz: optionaler Freitext zur Bonität
-- - bonitaet_geprueft_am: Zeitpunkt der letzten Bonitäts-Eintragung
--
-- Hinweis: ai_score-Spalten entfallen — das existierende ki_score-System
-- (ki_score 1-10, ki_ampel, ki_begruendung etc.) übernimmt diese Rolle.

ALTER TABLE interessenten
  ADD COLUMN IF NOT EXISTS antwortet_am TIMESTAMPTZ;

ALTER TABLE interessenten
  ADD COLUMN IF NOT EXISTS bonitaet TEXT
  CHECK (bonitaet IS NULL OR bonitaet IN ('bestaetigt', 'unklar', 'kritisch'));

ALTER TABLE interessenten
  ADD COLUMN IF NOT EXISTS bonitaet_notiz TEXT;

ALTER TABLE interessenten
  ADD COLUMN IF NOT EXISTS bonitaet_geprueft_am TIMESTAMPTZ;

-- Index für Trigger-Performance (Anfragen-unbeantwortet-Query)
CREATE INDEX IF NOT EXISTS idx_interessenten_antwortet_am
  ON interessenten (listing_id, antwortet_am, created_at);

COMMENT ON COLUMN interessenten.antwortet_am IS
  'Zeitpunkt an dem User "Habe geantwortet"-Button geklickt hat';
COMMENT ON COLUMN interessenten.bonitaet IS
  'Manuelle Bonitäts-Einschätzung: bestaetigt | unklar | kritisch';
