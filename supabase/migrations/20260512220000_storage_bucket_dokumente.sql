-- Create private storage bucket for Dokumente
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dokumente',
  'dokumente',
  false,
  10485760,  -- 10 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can upload to own folder
CREATE POLICY "dokumente_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'dokumente'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: authenticated users can read own files
CREATE POLICY "dokumente_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'dokumente'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: authenticated users can delete own files
CREATE POLICY "dokumente_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'dokumente'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
