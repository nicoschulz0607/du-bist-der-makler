export type ObjektTyp = 'haus' | 'wohnung' | 'grundstueck'

export type DokumentDefinition = {
  typ: string
  name: string
  beschreibung: string
  bezugsquelle: string
  partner_link?: string
  partner_name?: string
  partner_preis_ab?: string
  relevant_fuer: ObjektTyp[]
  nur_bei_vermietung?: boolean
  icon: string
  reihenfolge: number
  pflicht: boolean
}

export const DOKUMENT_KATALOG: DokumentDefinition[] = [
  // ── Basis: alle Objekttypen ─────────────────────────────────────────────
  {
    typ: 'grundbuchauszug',
    name: 'Grundbuchauszug',
    beschreibung:
      'Der Grundbuchauszug ist das amtliche Dokument, das die Eigentumsverhältnisse, Belastungen (z. B. Hypotheken) und Rechte an einer Immobilie nachweist. Käufer und Notar benötigen ihn zwingend.',
    bezugsquelle:
      'Beim zuständigen Grundbuchamt (Amtsgericht) deines Wohnorts. Als Eigentümer hast du ein berechtigtes Interesse und kannst ihn direkt anfordern oder online beantragen.',
    partner_link: undefined,
    relevant_fuer: ['haus', 'wohnung', 'grundstueck'],
    icon: 'BookOpen',
    reihenfolge: 1,
    pflicht: true,
  },
  {
    typ: 'energieausweis',
    name: 'Energieausweis',
    beschreibung:
      'Der Energieausweis ist seit 2014 gesetzlich vorgeschrieben (GEG) und muss bei Verkauf unaufgefordert vorgelegt werden. Er zeigt die Energieeffizienzklasse und den Energiebedarf oder -verbrauch des Gebäudes.',
    bezugsquelle:
      'Energieberater, Schornsteinfeger, Architekt oder zertifizierte Online-Anbieter. Es gibt Verbrauchs- und Bedarfsausweis – welcher benötigt wird, hängt vom Baujahr und der Nutzungshistorie ab.',
    relevant_fuer: ['haus', 'wohnung'],
    icon: 'Zap',
    reihenfolge: 2,
    pflicht: true,
  },
  {
    typ: 'flurkarte',
    name: 'Flurkarte / Lageplan',
    beschreibung:
      'Die Flurkarte (auch Liegenschaftskarte oder amtliche Lagekarte) zeigt die genaue Lage und Form des Grundstücks im Kataster. Sie ist kein Pflichtdokument, wird aber von Käufern und Banken oft angefragt.',
    bezugsquelle:
      'Beim Katasteramt deines Landkreises oder deiner Gemeinde. In vielen Bundesländern ist die Anforderung online möglich.',
    relevant_fuer: ['haus', 'wohnung', 'grundstueck'],
    icon: 'Map',
    reihenfolge: 3,
    pflicht: false,
  },
  {
    typ: 'personalausweis',
    name: 'Personalausweis-Kopie',
    beschreibung:
      'Der Notar benötigt eine Kopie deines gültigen Personalausweises oder Reisepasses zur Identitätsprüfung. Sie wird erst kurz vor dem Notartermin angefragt, sollte aber bereitliegen.',
    bezugsquelle:
      'Dein eigener Personalausweis oder Reisepass. Einfach einscannen oder fotografieren.',
    relevant_fuer: ['haus', 'wohnung', 'grundstueck'],
    icon: 'CreditCard',
    reihenfolge: 4,
    pflicht: true,
  },

  // ── Zusatz: Haus ────────────────────────────────────────────────────────
  {
    typ: 'baugenehmigung',
    name: 'Baugenehmigung',
    beschreibung:
      'Die Baugenehmigung belegt, dass das Gebäude behördlich genehmigt wurde. Besonders wichtig bei An- oder Umbauten. Fehlt sie, können Käufer Probleme bei der Finanzierung bekommen.',
    bezugsquelle:
      'Beim zuständigen Bauordnungsamt. Falls du sie nicht findest, kann das Amt eine Kopie ausstellen.',
    relevant_fuer: ['haus'],
    icon: 'Stamp',
    reihenfolge: 10,
    pflicht: false,
  },
  {
    typ: 'bauplaeane',
    name: 'Baupläne / Grundrisse',
    beschreibung:
      'Originale Baupläne zeigen die genaue Raumaufteilung, Maße und Konstruktion. Käufer und Banken wünschen sie sich oft zur Bewertung. Ohne Pläne ist die Wohnflächenberechnung schwerer nachzuvollziehen.',
    bezugsquelle:
      'Bauunterlagen aus dem Archiv, oder beim zuständigen Bauordnungsamt beantragen.',
    relevant_fuer: ['haus'],
    icon: 'Ruler',
    reihenfolge: 11,
    pflicht: false,
  },
  {
    typ: 'wohnflaeche_berechnung',
    name: 'Wohnflächenberechnung',
    beschreibung:
      'Eine formelle Wohnflächenberechnung nach WoFlV bestätigt die angegebene Quadratmeterzahl. Weicht die tatsächliche Fläche von der im Exposé genannten ab, kann das zu Gewährleistungsansprüchen führen.',
    bezugsquelle:
      'Architekt, Vermesser oder aus den Bauunterlagen. Bei älteren Häusern oft nur aus den ursprünglichen Bauplänen ableitbar.',
    relevant_fuer: ['haus'],
    icon: 'SquareDashed',
    reihenfolge: 12,
    pflicht: false,
  },
  {
    typ: 'sanierungsbelege',
    name: 'Sanierungsbelege',
    beschreibung:
      'Nachweise über durchgeführte Modernisierungen (Heizung, Fenster, Dach, Elektrik) steigern den Wert und das Vertrauen beim Käufer. Außerdem kann die Finanzierungsbank bessere Konditionen anbieten.',
    bezugsquelle:
      'Handwerkerrechnungen, Abnahmeprotokolle oder Garantieurkunden aus deinen Unterlagen.',
    relevant_fuer: ['haus'],
    icon: 'Wrench',
    reihenfolge: 13,
    pflicht: false,
  },
  {
    typ: 'versicherungsnachweis',
    name: 'Versicherungsnachweis (Wohngebäude)',
    beschreibung:
      'Der Nachweis über eine bestehende Wohngebäudeversicherung beruhigt Käufer und Banken. Die Police geht beim Verkauf automatisch auf den neuen Eigentümer über.',
    bezugsquelle:
      'Deine Versicherungsgesellschaft. Einfach die aktuellste Police oder eine Versicherungsbestätigung anfordern.',
    relevant_fuer: ['haus'],
    icon: 'Shield',
    reihenfolge: 14,
    pflicht: false,
  },

  // ── Zusatz: Eigentumswohnung ─────────────────────────────────────────────
  {
    typ: 'teilungserklaerung',
    name: 'Teilungserklärung',
    beschreibung:
      'Die Teilungserklärung regelt, welche Teile des Gebäudes Sondereigentum und welche Gemeinschaftseigentum sind. Sie ist das zentrale Dokument jeder Eigentümergemeinschaft und für Käufer unverzichtbar.',
    bezugsquelle:
      'Beim Grundbuchamt (liegt meist als Anlage im Grundbuch) oder bei deiner Hausverwaltung.',
    relevant_fuer: ['wohnung'],
    icon: 'Layers',
    reihenfolge: 20,
    pflicht: true,
  },
  {
    typ: 'protokolle_ev',
    name: 'Protokolle der Eigentümerversammlungen (letzte 3 Jahre)',
    beschreibung:
      'Die Protokolle geben Aufschluss über beschlossene oder geplante Maßnahmen, Streitigkeiten und den Zustand des Gemeinschaftseigentums. Käufer prüfen damit, ob unerwartete Kosten drohen.',
    bezugsquelle:
      'Bei deiner Hausverwaltung anfordern. Eigentümer haben ein Recht auf die Protokolle.',
    relevant_fuer: ['wohnung'],
    icon: 'FileText',
    reihenfolge: 21,
    pflicht: false,
  },
  {
    typ: 'wohngeld_abrechnungen',
    name: 'Wohngeld-Abrechnungen (letzte 2 Jahre)',
    beschreibung:
      'Die Jahresabrechnungen zeigen die tatsächlichen Betriebskosten und eventuelle Nachzahlungen. Käufer können damit die monatliche Belastung realistisch einschätzen.',
    bezugsquelle:
      'Bei deiner Hausverwaltung anfordern.',
    relevant_fuer: ['wohnung'],
    icon: 'Receipt',
    reihenfolge: 22,
    pflicht: false,
  },
  {
    typ: 'hausgeld_aufstellung',
    name: 'Hausgeld-Aufstellung (aktuell)',
    beschreibung:
      'Eine aktuelle Aufstellung der monatlichen Hausgeldzahlungen inklusive Rücklagenanteil. Banken und Käufer verlangen dies regelmäßig bei der Finanzierungsanfrage.',
    bezugsquelle:
      'Bei deiner Hausverwaltung anfragen.',
    relevant_fuer: ['wohnung'],
    icon: 'Banknote',
    reihenfolge: 23,
    pflicht: false,
  },
  {
    typ: 'mietvertraege',
    name: 'Mietvertrag / Mieterliste',
    beschreibung:
      'Bei vermieteten Wohnungen ist der aktuelle Mietvertrag Pflicht für Käufer. Er zeigt Mietdauer, Miethöhe und eventuelle Sondervereinbarungen.',
    bezugsquelle:
      'Aus deinen eigenen Unterlagen.',
    relevant_fuer: ['wohnung'],
    nur_bei_vermietung: true,
    icon: 'Users',
    reihenfolge: 24,
    pflicht: false,
  },

  // ── Zusatz: Grundstück ───────────────────────────────────────────────────
  {
    typ: 'erschliessungsnachweis',
    name: 'Erschließungsnachweis',
    beschreibung:
      'Belegt, dass das Grundstück an das öffentliche Wasser-, Abwasser-, Strom- und ggf. Gasnetz angeschlossen ist. Unerschlossene Grundstücke haben erhebliche Abzüge im Wert.',
    bezugsquelle:
      'Bei der Gemeinde oder dem zuständigen Versorgungsunternehmen.',
    relevant_fuer: ['grundstueck'],
    icon: 'PlugZap',
    reihenfolge: 30,
    pflicht: false,
  },
  {
    typ: 'bodengutachten',
    name: 'Bodengutachten',
    beschreibung:
      'Ein Bodengutachten zeigt, ob das Grundstück bebaubar ist und ob besondere Anforderungen an das Fundament bestehen. Es ist nicht gesetzlich vorgeschrieben, erhöht aber das Vertrauen beim Käufer erheblich.',
    bezugsquelle:
      'Beim Geologen oder Ingenieurbüro in Auftrag geben. Kosten: ca. 1.000–3.000 € je nach Umfang.',
    relevant_fuer: ['grundstueck'],
    icon: 'Mountain',
    reihenfolge: 31,
    pflicht: false,
  },
  {
    typ: 'bebauungsplan',
    name: 'Bebauungsplan (B-Plan)',
    beschreibung:
      'Der Bebauungsplan legt fest, was auf dem Grundstück gebaut werden darf (Grundflächenzahl, Geschossanzahl, Dachform etc.). Käufer und Architekten benötigen ihn zur Planung.',
    bezugsquelle:
      'Beim Bauordnungsamt oder der Gemeinde erhältlich. Viele Gemeinden bieten ihn kostenlos als PDF zum Download an.',
    relevant_fuer: ['grundstueck'],
    icon: 'Building2',
    reihenfolge: 32,
    pflicht: false,
  },
]

export function getKatalogFuerObjekttyp(
  objekttyp: ObjektTyp | null | undefined,
  istVermietet = false,
): DokumentDefinition[] {
  return DOKUMENT_KATALOG.filter((d) => {
    if (objekttyp && !d.relevant_fuer.includes(objekttyp)) return false
    if (d.nur_bei_vermietung && !istVermietet) return false
    return true
  }).sort((a, b) => a.reihenfolge - b.reihenfolge)
}

export function getPflichtDokumente(
  objekttyp: ObjektTyp | null | undefined,
  istVermietet = false,
): DokumentDefinition[] {
  return getKatalogFuerObjekttyp(objekttyp, istVermietet).filter((d) => d.pflicht)
}
