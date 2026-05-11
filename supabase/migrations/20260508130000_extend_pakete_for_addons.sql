-- Migration: extend_pakete_for_addons
-- Bereits direkt in der DB angewendet. Diese Datei dient nur der Git-Historie.
ALTER TABLE pakete ALTER COLUMN tier DROP NOT NULL;
ALTER TABLE pakete ALTER COLUMN laufzeit_monate DROP NOT NULL;

ALTER TABLE pakete DROP CONSTRAINT IF EXISTS pakete_typ_check;
ALTER TABLE pakete
  ADD CONSTRAINT pakete_typ_check
    CHECK (typ IN ('paket', 'reaktivierung', 'addon'));

ALTER TABLE pakete
  ADD COLUMN IF NOT EXISTS addon_type TEXT NULL
    CHECK (addon_type IS NULL OR addon_type IN ('toolpaket', 'maklerstunde'));

ALTER TABLE pakete DROP CONSTRAINT IF EXISTS pakete_typ_consistency_check;
ALTER TABLE pakete
  ADD CONSTRAINT pakete_typ_consistency_check
    CHECK (
      (typ = 'addon' AND tier IS NULL AND laufzeit_monate IS NULL AND addon_type IS NOT NULL)
      OR
      (typ IN ('paket', 'reaktivierung') AND tier IS NOT NULL AND laufzeit_monate IS NOT NULL AND addon_type IS NULL)
    );

COMMENT ON COLUMN pakete.tier IS 'NULL bei typ=addon, sonst basic/pro/premium';
COMMENT ON COLUMN pakete.laufzeit_monate IS 'NULL bei typ=addon, sonst 1/3/6';
COMMENT ON COLUMN pakete.addon_type IS 'Nur gesetzt wenn typ=addon: toolpaket oder maklerstunde';
