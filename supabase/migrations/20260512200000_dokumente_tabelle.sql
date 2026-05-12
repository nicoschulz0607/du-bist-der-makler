CREATE TABLE dokumente (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id        uuid REFERENCES listings(id) ON DELETE SET NULL,
  dokument_typ      text NOT NULL,
  status            text NOT NULL DEFAULT 'fehlt'
    CHECK (status IN ('fehlt', 'angefragt', 'vorhanden', 'nicht_relevant')),
  datei_url         text,
  datei_name        text,
  datei_groesse_kb  int,
  hochgeladen_am    timestamptz,
  notiz             text CHECK (char_length(notiz) <= 500),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE(user_id, dokument_typ)
);

ALTER TABLE dokumente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dokumente_select_own" ON dokumente
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "dokumente_insert_own" ON dokumente
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dokumente_update_own" ON dokumente
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "dokumente_delete_own" ON dokumente
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_dokumente_updated_at
  BEFORE UPDATE ON dokumente
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_dokumente_user_id ON dokumente(user_id);
CREATE INDEX idx_dokumente_user_typ ON dokumente(user_id, dokument_typ);
