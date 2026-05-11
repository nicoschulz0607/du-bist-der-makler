-- Migration: add_pakete_and_profile_cache
-- Zweck: Pakete-Tabelle (Source of Truth für Käufe) +
--        Cache-Felder auf profiles für schnelle Tier-Checks ohne JOIN

-- ─────────────────────────────────────────────────
-- 0. updated_at Trigger-Funktion (idempotent)
-- ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────
-- I. profiles — Cache-Spalten + CHECK auf paket_tier
-- ─────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS paket_aktiv_bis        TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS paket_laufzeit_monate  SMALLINT    NULL,
  ADD COLUMN IF NOT EXISTS paket_aktiviert_am     TIMESTAMPTZ NULL;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_paket_tier_check
    CHECK (paket_tier IN ('basic', 'pro', 'premium') OR paket_tier IS NULL);

COMMENT ON COLUMN profiles.paket_aktiv_bis       IS 'Cache: Ende-Datum des aktuell aktiven Pakets. Wird vom Webhook synchron gehalten.';
COMMENT ON COLUMN profiles.paket_laufzeit_monate IS 'Cache: Laufzeit des aktuellen Pakets in Monaten (1, 3 oder 6).';
COMMENT ON COLUMN profiles.paket_aktiviert_am    IS 'Cache: Start-Datum des aktuellen Pakets. Nicht identisch mit profiles.created_at.';

-- ─────────────────────────────────────────────────
-- II. pakete — Source of Truth für alle Käufe
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pakete (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier                      TEXT        NOT NULL CHECK (tier IN ('basic', 'pro', 'premium')),
  typ                       TEXT        NOT NULL CHECK (typ IN ('paket', 'reaktivierung')),
  laufzeit_monate           SMALLINT    NOT NULL CHECK (laufzeit_monate IN (1, 3, 6)),
  start_datum               TIMESTAMPTZ NOT NULL,
  ende_datum                TIMESTAMPTZ NOT NULL,
  status                    TEXT        NOT NULL DEFAULT 'aktiv'
                                        CHECK (status IN ('aktiv', 'abgelaufen', 'storniert', 'refunded')),
  stripe_session_id         TEXT        NOT NULL UNIQUE,
  stripe_payment_intent_id  TEXT        NULL,
  betrag_cent               INTEGER     NOT NULL,
  waehrung                  TEXT        NOT NULL DEFAULT 'eur',
  rohdaten                  JSONB       NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN pakete.typ               IS 'paket = Erstkauf, reaktivierung = Verlängerung nach Ablauf';
COMMENT ON COLUMN pakete.status            IS 'aktiv = läuft, abgelaufen = Enddatum überschritten, storniert = vom Admin, refunded = Stripe-Rückerstattung';
COMMENT ON COLUMN pakete.stripe_session_id IS 'Stripe Checkout Session ID — UNIQUE für Webhook-Idempotenz (kein Double-Processing)';
COMMENT ON COLUMN pakete.rohdaten          IS 'Komplettes Stripe checkout.session.completed Event als Backup für spätere Analyse';

-- ─────────────────────────────────────────────────
-- III. Indexes
-- ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pakete_user_id
  ON pakete(user_id);

CREATE INDEX IF NOT EXISTS idx_pakete_user_id_status
  ON pakete(user_id, status);

CREATE INDEX IF NOT EXISTS idx_pakete_ende_datum_aktiv
  ON pakete(ende_datum) WHERE status = 'aktiv';

-- ─────────────────────────────────────────────────
-- IV. updated_at Trigger
-- ─────────────────────────────────────────────────
CREATE TRIGGER set_pakete_updated_at
  BEFORE UPDATE ON pakete
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────
-- V. Row Level Security
-- ─────────────────────────────────────────────────
ALTER TABLE pakete ENABLE ROW LEVEL SECURITY;

-- User kann nur eigene Pakete lesen
CREATE POLICY "pakete_select_own"
  ON pakete FOR SELECT
  USING (auth.uid() = user_id);

-- Kein direktes INSERT/UPDATE/DELETE durch User möglich
-- Webhook schreibt via Service-Role-Key, der RLS umgeht
