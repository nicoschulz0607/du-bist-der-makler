-- Anrechnungs-Buchhaltung für Paket-Upgrades
-- Speichert wieviel vom alten Paket bei einem Upgrade
-- als Restwert auf das neue Paket angerechnet wurde.

ALTER TABLE pakete
  ADD COLUMN angerechneter_betrag NUMERIC(8,2) NULL;

COMMENT ON COLUMN pakete.angerechneter_betrag IS
  'Bei Upgrade-Wechseln: Restwert in EUR der vom alten
   Paket auf das neue Paket angerechnet wurde. NULL bei
   Erstkäufen ohne Anrechnung.';
