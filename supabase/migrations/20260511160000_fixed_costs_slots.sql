-- Sprint 4: optionale Slot-Kapazität für fixed_costs
-- Ermöglicht z.B. ImmoScout-Flatrate: slots = 10 statt Hardcode in operations.ts
-- Führe manuell über Supabase SQL-Editor aus

ALTER TABLE fixed_costs
  ADD COLUMN IF NOT EXISTS slots integer;

COMMENT ON COLUMN fixed_costs.slots IS
  'Optionale Slot-Kapazität (z.B. ImmoScout-Flatrate: 10 Slots/Monat)';
