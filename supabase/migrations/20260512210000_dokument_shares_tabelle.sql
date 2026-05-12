CREATE TABLE dokument_shares (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id        uuid REFERENCES listings(id) ON DELETE SET NULL,
  share_token       text UNIQUE NOT NULL,
  empfaenger_name   text NOT NULL,
  empfaenger_email  text,
  dokument_ids      uuid[] NOT NULL DEFAULT '{}',
  ablaufdatum       timestamptz NOT NULL,
  passwort_hash     text,
  abgerufen_am      timestamptz[] NOT NULL DEFAULT '{}',
  zurueckgezogen_am timestamptz,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE dokument_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shares_select_own" ON dokument_shares
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "shares_insert_own" ON dokument_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shares_update_own" ON dokument_shares
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "shares_delete_own" ON dokument_shares
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_dokument_shares_user_id ON dokument_shares(user_id);
CREATE INDEX idx_dokument_shares_token ON dokument_shares(share_token);
CREATE INDEX idx_dokument_shares_ablauf ON dokument_shares(ablaufdatum) WHERE zurueckgezogen_am IS NULL;
