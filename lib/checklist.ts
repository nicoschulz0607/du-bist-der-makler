export interface ChecklistItem {
  id: string
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  requiredTier?: 'starter' | 'pro' | 'premium'
}

export interface ChecklistPhase {
  id: string
  title: string
  items: ChecklistItem[]
}

export const CHECKLIST: ChecklistPhase[] = [
  {
    id: 'vorbereitung',
    title: 'Phase 1 — Vorbereitung',
    items: [
      {
        id: 'konto_erstellt',
        title: 'Konto erstellt & Paket gebucht',
        description: 'Einmalzahlung abgeschlossen, E-Mail bestätigt',
      },
      {
        id: 'objekt_erfasst',
        title: 'Objekt-Grunddaten eingetragen',
        description: 'Adresse, Größe, Zimmer, Baujahr',
        actionLabel: 'Jetzt ausfüllen',
        actionHref: '/dashboard/objekt',
      },
      {
        id: 'preis_ermittelt',
        title: 'Marktwert eingeschätzt',
        description: 'KI-Preisrechner genutzt oder eigene Recherche',
        actionLabel: 'Preisrechner öffnen',
        actionHref: '/dashboard/preisrechner',
        requiredTier: 'pro',
      },
      {
        id: 'energieausweis',
        title: 'Energieausweis bestellt',
        description: 'Pflicht beim Verkauf — ab ca. 79 € über Partner',
        actionLabel: 'Partner öffnen',
        actionHref: '/dashboard/partner',
      },
    ],
  },
  {
    id: 'vermarktung',
    title: 'Phase 2 — Vermarktung',
    items: [
      {
        id: 'fotos_hochgeladen',
        title: 'Mindestens 5 Fotos hochgeladen',
        description: 'Mehr Fotos = mehr Klicks',
        actionLabel: 'Fotos verwalten',
        actionHref: '/dashboard/objekt',
      },
      {
        id: 'expose_erstellt',
        title: 'KI-Exposé generiert',
        description: 'Professionelles PDF in 20 Sekunden',
        actionLabel: 'Exposé erstellen',
        actionHref: '/dashboard/expose',
        requiredTier: 'pro',
      },
      {
        id: 'inserat_live',
        title: 'Inserat veröffentlicht',
        description: 'Auf du-bist-der-makler.de + Portalen',
        actionLabel: 'Inserat aktivieren',
        actionHref: '/dashboard/objekt',
      },
    ],
  },
  {
    id: 'besichtigungen',
    title: 'Phase 3 — Besichtigungen & Verhandlung',
    items: [
      {
        id: 'interessenten_verwaltet',
        title: 'Interessenten im CRM erfasst',
        description: 'Status, Notizen, Qualifizierung',
        actionLabel: 'CRM öffnen',
        actionHref: '/dashboard/interessenten',
        requiredTier: 'pro',
      },
      {
        id: 'besichtigungen_geplant',
        title: 'Besichtigungstermine geplant',
        description: 'Termine mit Bestätigung per E-Mail',
        actionLabel: 'Kalender öffnen',
        actionHref: '/dashboard/termine',
        requiredTier: 'pro',
      },
      {
        id: 'kaufangebot_erhalten',
        title: 'Schriftliches Kaufangebot erhalten',
        description: 'Finanzierungsbestätigung des Käufers vorliegt',
      },
    ],
  },
  {
    id: 'abschluss',
    title: 'Phase 4 — Kaufabschluss',
    items: [
      {
        id: 'notar_gewaehlt',
        title: 'Notar ausgewählt & Termin vereinbart',
        description: 'Regionaler Notar über Partnerliste',
        actionLabel: 'Notarempfehlung',
        actionHref: '/dashboard/partner',
      },
      {
        id: 'kaufvertrag_geprueft',
        title: 'Kaufvertragsentwurf erhalten & geprüft',
        description: 'Min. 2 Wochen vor Termin lesen',
      },
      {
        id: 'schluessel_uebergeben',
        title: 'Schlüsselübergabe & Übergabeprotokoll',
        description: 'Verkauf abgeschlossen 🎉',
      },
    ],
  },
]
