CREATE TABLE activity_log (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id        uuid REFERENCES listings(id) ON DELETE CASCADE,

  event_type        text NOT NULL,

  interessent_id    uuid REFERENCES interessenten(id) ON DELETE SET NULL,
  termin_id         uuid REFERENCES termine(id) ON DELETE SET NULL,
  dokument_id       uuid REFERENCES dokumente(id) ON DELETE SET NULL,

  payload           jsonb DEFAULT '{}',

  source            text NOT NULL DEFAULT 'user'
    CHECK (source IN ('user', 'system', 'klara', 'admin', 'cron')),

  user_sichtbar     boolean DEFAULT true,

  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_activity_log_user_created ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_log_listing ON activity_log(listing_id, created_at DESC);
CREATE INDEX idx_activity_log_event_type ON activity_log(event_type);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_select_own" ON activity_log
  FOR SELECT USING (auth.uid() = user_id AND user_sichtbar = true);
