// Einmalig ausführen: node scripts/migrate.mjs
// Vorher SUPABASE_SERVICE_ROLE_KEY in .env.local eintragen

import { readFileSync } from 'fs'

// .env.local manuell parsen (kein dotenv nötig)
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('=').map(s => s.trim()))
    .map(([k, ...v]) => [k, v.join('=')])
)

const url = env['NEXT_PUBLIC_SUPABASE_URL']
const key = env['NEXT_PUBLIC_SUPABASE_SERVICE_KEY'] || env['SUPABASE_SERVICE_ROLE_KEY']

if (!url || !key) {
  console.error('❌  Service Key fehlt in .env.local')
  console.error('    Gehe zu: Supabase Dashboard → Project Settings → API → service_role key')
  process.exit(1)
}

const projectRef = url.replace('https://', '').replace('.supabase.co', '')

const SQL = `
-- Profiles-Tabelle
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  vorname TEXT,
  email TEXT,
  paket_tier TEXT CHECK (paket_tier IN ('starter', 'pro', 'premium')) DEFAULT NULL,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listings
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'aktiv', 'verkauft')) DEFAULT 'draft',
  objekttyp TEXT,
  adresse_strasse TEXT,
  adresse_plz TEXT,
  adresse_ort TEXT,
  wohnflaeche_qm INTEGER,
  zimmer NUMERIC(3,1),
  baujahr INTEGER,
  zustand TEXT,
  beschreibung TEXT,
  preis INTEGER,
  energieausweis_klasse TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checkliste Status
CREATE TABLE IF NOT EXISTS public.checkliste_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  aufgabe_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, aufgabe_id)
);

-- RLS aktivieren
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkliste_status ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_own') THEN
    CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='listings' AND policyname='listings_own') THEN
    CREATE POLICY "listings_own" ON public.listings FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='checkliste_status' AND policyname='checkliste_own') THEN
    CREATE POLICY "checkliste_own" ON public.checkliste_status FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger: automatisch Profile anlegen bei Registrierung
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, vorname)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'vorname');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Bestehenden User (nico.schulz0607@gmail.com) als Starter eintragen
INSERT INTO public.profiles (id, email, vorname, paket_tier)
SELECT id, email, raw_user_meta_data->>'vorname', 'starter'
FROM auth.users
WHERE email = 'nico.schulz0607@gmail.com'
ON CONFLICT (id) DO UPDATE SET paket_tier = EXCLUDED.paket_tier;
`

async function run() {
  console.log('🚀  Verbinde mit Supabase...')
  console.log('    Project:', projectRef)

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL }),
  })

  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = text }

  if (!res.ok) {
    console.error('❌  Fehler:', JSON.stringify(json, null, 2))
    console.error('\n    Tipp: Der service_role key funktioniert hier nicht — du brauchst einen')
    console.error('    Management API Token von: https://supabase.com/dashboard/account/tokens')
    console.error('    → Trage ihn als SUPABASE_SERVICE_ROLE_KEY in .env.local ein')
    process.exit(1)
  }

  console.log('✅  Tabellen angelegt!')
  console.log('✅  RLS-Policies gesetzt!')
  console.log('✅  Trigger eingerichtet!')
  console.log('✅  Profil für nico.schulz0607@gmail.com angelegt (paket_tier: starter)')
  console.log('\n    Du kannst jetzt /dashboard aufrufen.')
}

run().catch(err => {
  console.error('❌  Unerwarteter Fehler:', err.message)
  process.exit(1)
})
