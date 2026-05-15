# Migration Baseline — Stand 15. Mai 2026

## Hintergrund

Bis Mai 2026 wurden Migrations teilweise direkt über Supabase Studio ausgeführt
(manueller Copy-Paste-Workflow). Dadurch entstand ein Migration-State-Drift zwischen
lokalen Files und Remote-Status:

- **9 lokale Files** wurden manuell ins Studio kopiert → CLI kannte sie nicht als applied
- **13 Remote-Migrations** wurden direkt im Studio ausgeführt → kein lokales File vorhanden

## Sync-Sprint (15. Mai 2026)

Mit `npx supabase migration repair --status applied` wurde für alle 9 lokalen Files
ein sauberer State hergestellt. Die 13 Remote-only Migrations werden als Baseline
akzeptiert — kein lokales File, keine Rekonstruktion.

---

## Remote-only Migrations (13)

Direkt im Supabase Studio ausgeführt. Kein lokales File vorhanden.
Werden als Baseline akzeptiert — Schema-Änderungen sind in der DB, aber nicht versioniert.

| Timestamp      | Zeit (UTC)          |
|----------------|---------------------|
| 20260503194510 | 2026-05-03 19:45:10 |
| 20260504083606 | 2026-05-04 08:36:06 |
| 20260504132906 | 2026-05-04 13:29:06 |
| 20260508174458 | 2026-05-08 17:44:58 |
| 20260508192953 | 2026-05-08 19:29:53 |
| 20260509141337 | 2026-05-09 14:13:37 |
| 20260509200717 | 2026-05-09 20:07:17 |
| 20260512181011 | 2026-05-12 18:10:11 |
| 20260512181022 | 2026-05-12 18:10:22 |
| 20260512181035 | 2026-05-12 18:10:35 |
| 20260512192844 | 2026-05-12 19:28:44 |
| 20260514091802 | 2026-05-14 09:18:02 |
| 20260514120045 | 2026-05-14 12:00:45 |

---

## Lokale Files — Local + Remote applied (9)

Lokal vorhanden und mit `migration repair --status applied` in der Remote-History
als applied markiert (Schema war bereits in der DB, CLI-State wurde nachgezogen).

| Timestamp      | Dateiname                                   |
|----------------|---------------------------------------------|
| 20260510000000 | 20260510000000_helios_tables.sql            |
| 20260511140000 | 20260511140000_fixed_costs.sql              |
| 20260511150000 | 20260511150000_affiliate_revenue.sql        |
| 20260511160000 | 20260511160000_fixed_costs_slots.sql        |
| 20260512200000 | 20260512200000_dokumente_tabelle.sql        |
| 20260512210000 | 20260512210000_dokument_shares_tabelle.sql  |
| 20260512220000 | 20260512220000_storage_bucket_dokumente.sql |
| 20260514120000 | 20260514120000_activity_log.sql             |
| 20260514130000 | 20260514130000_listing_portals.sql          |

---

## Ab jetzt — neue Arbeitsweise

Neue Migrations **ausschließlich** über CLI:

```bash
npx supabase migration new <name>   # Datei anlegen
npx supabase db push                # Gegen Remote anwenden
```

Supabase Studio ist nur noch für **read-only Operationen** (SELECT-Abfragen, Daten prüfen).
Direkte Schema-Änderungen im Studio sind verboten — sie erzeugen wieder Drift.

---

## ⚠️ Reset-Warnung

Die 13 Remote-only Migrations existieren lokal nur als **Placeholder-Files ohne echtes SQL**.

Bei `npx supabase db reset` oder beim Aufsetzen einer neuen Staging-Umgebung würden
diese 13 Migrations **nichts tun** — das tatsächliche Schema dieser Migrations fehlt lokal.

**Was dann fehlt:** Der komplette DB-Zustand vor dem 10. Mai 2026 (Helios-Tables, frühe
Fixed-Costs-Strukturen, etc.) wäre nicht reproduzierbar über die Migration-History allein.

### Wenn du db reset oder Staging brauchst

1. Öffne Supabase Studio → Database → Migrations
2. Für jeden der 13 Timestamps: echtes SQL aus Studio kopieren
3. In die entsprechende Placeholder-Datei in `supabase/migrations/` einfügen
4. Dann erst `db reset` oder `db push` auf neuer Umgebung

### Wishlist-TODO

> Bei nächstem Bedarf für `db reset` oder Staging: echtes SQL der 13 Baseline-Migrations
> aus Studio in die Placeholder-Files nachtragen, damit das Repo vollständig reproduzierbar ist.
