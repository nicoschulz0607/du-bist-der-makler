-- Sprint 3.4: Angebots-Tracking
-- Neue Tabelle angebots_historie + bankbestaetigung-Spalte auf interessenten

-- 1. Neue Spalte auf interessenten
ALTER TABLE interessenten
  ADD COLUMN IF NOT EXISTS bankbestaetigung boolean DEFAULT false;

COMMENT ON COLUMN interessenten.bankbestaetigung IS
  'Bankbestätigung liegt vor (manuell gesetzt)';

-- 2. Angebots-Historie-Tabelle
CREATE TABLE IF NOT EXISTS angebots_historie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interessent_id uuid NOT NULL REFERENCES interessenten(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  betrag numeric NOT NULL CHECK (betrag > 0),
  kommentar text,
  bonitaet_snapshot text CHECK (bonitaet_snapshot IS NULL OR bonitaet_snapshot IN ('bestaetigt', 'unklar', 'kritisch')),
  bonitaet_notiz_snapshot text,
  bankbestaetigung_snapshot boolean DEFAULT false,
  erstellt_am timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS angebots_historie_interessent_idx ON angebots_historie(interessent_id);
CREATE INDEX IF NOT EXISTS angebots_historie_listing_idx ON angebots_historie(listing_id);
CREATE INDEX IF NOT EXISTS angebots_historie_erstellt_idx ON angebots_historie(erstellt_am DESC);

COMMENT ON TABLE angebots_historie IS
  'Verhandlungs-Geschichte: jede Änderung an abgegebenes_angebot wird hier versioniert';
COMMENT ON COLUMN angebots_historie.bonitaet_snapshot IS
  'Snapshot der Bonität zum Zeitpunkt des Angebots (nicht der aktuelle Wert)';

-- 3. RLS aktivieren
ALTER TABLE angebots_historie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "angebote_owner_select" ON angebots_historie FOR SELECT
  USING (listing_id IN (SELECT id FROM listings WHERE user_id = auth.uid()));

CREATE POLICY "angebote_owner_insert" ON angebots_historie FOR INSERT
  WITH CHECK (listing_id IN (SELECT id FROM listings WHERE user_id = auth.uid()));

CREATE POLICY "angebote_owner_update" ON angebots_historie FOR UPDATE
  USING (listing_id IN (SELECT id FROM listings WHERE user_id = auth.uid()));

CREATE POLICY "angebote_owner_delete" ON angebots_historie FOR DELETE
  USING (listing_id IN (SELECT id FROM listings WHERE user_id = auth.uid()));
