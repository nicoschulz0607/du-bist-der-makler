-- Idempotent: Funktion existiert möglicherweise schon (aus Dokumente-Migration)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- listing_portals: Portal-Status und Performance-Daten pro Listing
CREATE TABLE listing_portals (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id                  uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id                     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  portal_slug                 text NOT NULL
    CHECK (portal_slug IN ('immoscout', 'immowelt', 'ebay_kleinanzeigen')),

  status                      text NOT NULL DEFAULT 'nicht_aktiviert'
    CHECK (status IN (
      'nicht_aktiviert',
      'wird_synchronisiert',
      'aktiv',
      'pausiert',
      'sync_fehler',
      'inaktiv'
    )),

  portal_listing_url          text,
  portal_listing_id           text,

  aufrufe_gesamt              integer DEFAULT 0,
  aufrufe_7tage               integer DEFAULT 0,

  letzte_synchronisation_am   timestamptz,
  letzte_fehlermeldung        text,

  aktiviert_am                timestamptz,
  deaktiviert_am              timestamptz,
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now(),

  UNIQUE (listing_id, portal_slug)
);

CREATE INDEX idx_listing_portals_listing ON listing_portals(listing_id);
CREATE INDEX idx_listing_portals_user    ON listing_portals(user_id);
CREATE INDEX idx_listing_portals_status  ON listing_portals(status);

ALTER TABLE listing_portals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_portals_select_own" ON listing_portals
  FOR SELECT USING (auth.uid() = user_id);

CREATE TRIGGER listing_portals_updated_at_trigger
  BEFORE UPDATE ON listing_portals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Backfill: Demo-Daten für alle bestehenden aktiven Listings
INSERT INTO listing_portals (
  listing_id, user_id, portal_slug, status,
  aufrufe_7tage, aufrufe_gesamt,
  aktiviert_am, letzte_synchronisation_am
)
SELECT
  l.id,
  l.user_id,
  portal_slug,
  'aktiv'::text,
  CASE portal_slug
    WHEN 'immoscout'          THEN 47
    WHEN 'immowelt'           THEN 31
    WHEN 'ebay_kleinanzeigen' THEN 12
  END,
  CASE portal_slug
    WHEN 'immoscout'          THEN 234
    WHEN 'immowelt'           THEN 156
    WHEN 'ebay_kleinanzeigen' THEN 58
  END,
  now(),
  now()
FROM listings l
CROSS JOIN UNNEST(ARRAY['immoscout'::text, 'immowelt'::text, 'ebay_kleinanzeigen'::text]) AS portal_slug
WHERE l.status = 'aktiv'
ON CONFLICT (listing_id, portal_slug) DO NOTHING;
