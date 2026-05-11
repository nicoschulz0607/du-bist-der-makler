'use client'

import { useState, useTransition } from 'react'
import WizardHeader from './WizardHeader'
import WizardProgressBar from './WizardProgressBar'
import WizardFooter from './WizardFooter'
import KlaraSlideOver from './KlaraSlideOver'
import Station1Grunddaten from './stations/Station1Grunddaten'
import Station2MarktwertLage from './stations/Station2MarktwertLage'
import Station3Energieausweis from './stations/Station3Energieausweis'
import Station4Fotos from './stations/Station4Fotos'
import Station5Grundriss from './stations/Station5Grundriss'
import Station6Ausstattung from './stations/Station6Ausstattung'
import Station7Texte from './stations/Station7Texte'
import Station8Kontakt from './stations/Station8Kontakt'
import Station9LiveGehen from './stations/Station9LiveGehen'
import WizardLayout from './WizardLayout'
import LiveInseratPreview from './LiveInseratPreview'
import ContextHelpSidebar from './ContextHelpSidebar'
import { advanceStation, markStationComplete, skipStation } from '@/lib/wizard/actions'
import { WIZARD_STATIONS } from '@/lib/wizard/config'
import type { StationStatusMap, WizardProfile } from '@/lib/wizard/types'
import type { MarktwertDaten, LageDaten } from '@/lib/wizard/market-data-provider'
import type { FotoItem } from '@/lib/foto'
import type { Tier } from '@/lib/tier'

interface ProfileData {
  vorname: string | null
  nachname: string | null
  telefon: string | null
  anschrift: string | null
}

interface InitialListingData {
  objekttyp: string | null
  adresse_strasse: string | null
  adresse_plz: string | null
  adresse_ort: string | null
  wohnflaeche_qm: number | null
  zimmer: number | null
  baujahr: number | null
  preis: number | null
}

interface WizardShellProps {
  initialStation: number
  stationStatus: StationStatusMap
  listingId: string | null
  wizardProfile: WizardProfile
  profileData: ProfileData
  userEmail: string
  userId: string
  userTier: Tier
  initialListingData: InitialListingData | null
  initialMarktwert: MarktwertDaten | null
  initialLage: LageDaten | null
  initialAdresseImExpose: boolean
  initialFotos: FotoItem[]
  initialEnergieStatus: string | null
  initialEnergieKlasse: string | null
  initialEnergieTyp: string | null
  initialEnergieVerbrauch: number | null
  initialEnergieDateiUrl: string | null
  initialGrundrissStatus: string | null
  initialGrundrissUrl: string | null
  initialAusstattungItems: string[]
  initialBeschreibung: string | null
  initialExposeHtml: string | null
  initialExposeEdits: Record<string, unknown> | null
  initialExposeTitle: string | null
  initialExposeKurz: string | null
}

export default function WizardShell({
  initialStation,
  stationStatus: initialStatusMap,
  listingId,
  wizardProfile: _wizardProfile,
  profileData,
  userEmail,
  userId,
  userTier,
  initialListingData,
  initialMarktwert,
  initialLage,
  initialAdresseImExpose,
  initialFotos,
  initialEnergieStatus,
  initialEnergieKlasse,
  initialEnergieTyp,
  initialEnergieVerbrauch,
  initialEnergieDateiUrl,
  initialGrundrissStatus,
  initialGrundrissUrl,
  initialAusstattungItems,
  initialBeschreibung,
  initialExposeHtml,
  initialExposeEdits,
  initialExposeTitle,
  initialExposeKurz,
}: WizardShellProps) {
  const [currentStation, setCurrentStation] = useState(Math.max(1, Math.min(9, initialStation)))
  const [statusMap, setStatusMap] = useState<StationStatusMap>(initialStatusMap)
  const [isPending, startTransition] = useTransition()
  const [returnToStation, setReturnToStation] = useState<number | null>(null)
  const [canAdvanceOverride, setCanAdvanceOverride] = useState(true)
  const [localListingId, setLocalListingId] = useState(listingId)

  const stationConfig = WIZARD_STATIONS.find((s) => s.stationNum === currentStation)!

  function goToStation(n: number) {
    const clamped = Math.max(1, Math.min(9, n))
    setCanAdvanceOverride(true)
    setCurrentStation(clamped)
    startTransition(async () => {
      await advanceStation(clamped)
    })
  }

  function handleNext() {
    const nextStation = returnToStation ?? Math.min(currentStation + 1, 9)
    setReturnToStation(null)
    setCanAdvanceOverride(true)
    setStatusMap((prev) => ({ ...prev, [currentStation]: { status: 'completed' } }))
    setCurrentStation(nextStation)
    startTransition(async () => {
      await markStationComplete(currentStation)
      await advanceStation(nextStation)
    })
  }

  function handleBack() {
    const prevStation = Math.max(currentStation - 1, 1)
    setCanAdvanceOverride(true)
    setCurrentStation(prevStation)
    startTransition(async () => {
      await advanceStation(prevStation)
    })
  }

  function handleSkip() {
    const nextStation = returnToStation ?? Math.min(currentStation + 1, 9)
    setReturnToStation(null)
    setCanAdvanceOverride(true)
    setStatusMap((prev) => ({ ...prev, [currentStation]: { status: 'skipped' } }))
    setCurrentStation(nextStation)
    startTransition(async () => {
      await skipStation(currentStation)
    })
  }

  function handleJumpToStation(n: number) {
    setReturnToStation(currentStation)
    goToStation(n)
  }

  function handleKlara() {
    window.dispatchEvent(
      new CustomEvent('wizard:openKlara', {
        detail: { context: stationConfig?.klaraContext ?? 'wizard:allgemein' },
      })
    )
  }

  const isKnownStation = [1, 2, 3, 4, 5, 6, 7, 8, 9].includes(currentStation)

  function buildSidebar() {
    if (!stationConfig || stationConfig.sidebarKind === 'none') return undefined
    if (stationConfig.sidebarKind === 'context-help') {
      return <ContextHelpSidebar stationNumber={currentStation} />
    }
    return (
      <LiveInseratPreview
        fotos={initialFotos}
        objekttyp={initialListingData?.objekttyp ?? null}
        adresse_strasse={initialListingData?.adresse_strasse ?? null}
        adresse_plz={initialListingData?.adresse_plz ?? null}
        adresse_ort={initialListingData?.adresse_ort ?? null}
        adresse_im_expose={initialAdresseImExpose}
        wohnflaeche_qm={initialListingData?.wohnflaeche_qm ?? null}
        zimmer={initialListingData?.zimmer ?? null}
        baujahr={initialListingData?.baujahr ?? null}
        preis={initialListingData?.preis ?? null}
        titel={initialExposeTitle}
        beschreibung_kurz={initialExposeKurz}
        vorname={profileData.vorname}
        telefon={profileData.telefon}
        showContact={currentStation === 8}
      />
    )
  }

  const sidebar = buildSidebar()

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col overflow-hidden">
      <WizardHeader currentStation={currentStation} totalStations={9} />
      <WizardProgressBar
        currentStation={currentStation}
        stationStatus={statusMap}
        onStationClick={goToStation}
      />

      {/* Station content */}
      <main className="flex-1 overflow-y-auto">
        <WizardLayout layout={stationConfig?.layout ?? 'focus'} sidebar={sidebar}>
          {/* Station header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold text-[#1B6B45] uppercase tracking-wider">
                Schritt {currentStation} von 9
              </span>
              <span className="text-[11px] text-text-tertiary">·</span>
              <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                {stationConfig?.phase}
              </span>
            </div>
            <h1
              className="text-[28px] md:text-[32px] font-bold text-text-primary leading-tight"
              style={{ letterSpacing: '-0.4px' }}
            >
              {stationConfig?.title}
            </h1>
            <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">
              {stationConfig?.subtitle}
            </p>
          </div>

          {/* Station 1 — Grunddaten */}
          {currentStation === 1 && (
            <Station1Grunddaten
              initialListing={initialListingData}
              listingId={localListingId}
              onCanAdvanceChange={setCanAdvanceOverride}
              onListingCreated={setLocalListingId}
            />
          )}

          {/* Station 2 — Marktwert & Lage */}
          {currentStation === 2 && (
            <Station2MarktwertLage
              listingId={localListingId}
              initialMarktwert={initialMarktwert}
              initialLage={initialLage}
              initialAdresseImExpose={initialAdresseImExpose}
              onCanAdvanceChange={setCanAdvanceOverride}
            />
          )}

          {/* Station 3 — Energieausweis */}
          {currentStation === 3 && (
            <Station3Energieausweis
              listingId={localListingId}
              userId={userId}
              initialStatus={initialEnergieStatus}
              initialKlasse={initialEnergieKlasse}
              initialTyp={initialEnergieTyp}
              initialVerbrauch={initialEnergieVerbrauch}
              initialDateiUrl={initialEnergieDateiUrl}
              onCanAdvanceChange={setCanAdvanceOverride}
            />
          )}

          {/* Station 4 — Fotos */}
          {currentStation === 4 && (
            <Station4Fotos
              userId={userId}
              listingId={localListingId}
              initialFotos={initialFotos}
              userTier={userTier}
              onCanAdvanceChange={setCanAdvanceOverride}
            />
          )}

          {/* Station 5 — Grundriss */}
          {currentStation === 5 && (
            <Station5Grundriss
              listingId={localListingId}
              userId={userId}
              initialStatus={initialGrundrissStatus}
              initialUrl={initialGrundrissUrl}
              onCanAdvanceChange={setCanAdvanceOverride}
            />
          )}

          {/* Station 6 — Ausstattung */}
          {currentStation === 6 && (
            <Station6Ausstattung
              listingId={localListingId}
              initialItems={initialAusstattungItems}
              initialBeschreibung={initialBeschreibung}
              onCanAdvanceChange={setCanAdvanceOverride}
            />
          )}

          {/* Station 7 — Inserat-Texte */}
          {currentStation === 7 && (
            <Station7Texte
              listingId={localListingId}
              initialExposeHtml={initialExposeHtml}
              initialExposeEdits={initialExposeEdits}
              onCanAdvanceChange={setCanAdvanceOverride}
            />
          )}

          {/* Station 8 — Kontaktdaten */}
          {currentStation === 8 && (
            <Station8Kontakt
              initialData={profileData}
              userEmail={userEmail}
              onCanAdvanceChange={setCanAdvanceOverride}
            />
          )}

          {/* Station 9 — Vorschau & Veröffentlichen */}
          {currentStation === 9 && (
            <Station9LiveGehen
              listingId={localListingId}
              objekttyp={initialListingData?.objekttyp ?? null}
              adresse_strasse={initialListingData?.adresse_strasse ?? null}
              adresse_plz={initialListingData?.adresse_plz ?? null}
              adresse_ort={initialListingData?.adresse_ort ?? null}
              adresse_im_expose={initialAdresseImExpose}
              wohnflaeche_qm={initialListingData?.wohnflaeche_qm ?? null}
              zimmer={initialListingData?.zimmer ?? null}
              baujahr={initialListingData?.baujahr ?? null}
              marktwert_daten={initialMarktwert}
              energieausweis_klasse={initialEnergieKlasse}
              energieausweis_status={initialEnergieStatus}
              fotos={initialFotos}
              expose_html={initialExposeHtml}
              expose_edits={initialExposeEdits}
              ausstattung_items={initialAusstattungItems}
              vorname={profileData.vorname}
              telefon={profileData.telefon}
              onCanAdvanceChange={setCanAdvanceOverride}
            />
          )}

          {/* Placeholder für Station 9 */}
          {!isKnownStation && (
            <div className="rounded-2xl border border-[#EEEEEE] bg-gradient-to-br from-[#FAFAFA] to-white p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#E8F5EE] flex items-center justify-center mx-auto mb-5">
                <span className="text-[24px] font-bold text-[#1B6B45]">{currentStation}</span>
              </div>
              <h3 className="text-[17px] font-bold text-text-primary mb-2">{stationConfig?.title}</h3>
              <p className="text-[14px] text-text-secondary max-w-[400px] mx-auto leading-relaxed">
                {stationConfig?.subtitle}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-[12px] font-medium text-text-tertiary bg-surface px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B6B45] animate-pulse" />
                Wird in Kürze freigeschaltet
              </div>
            </div>
          )}
        </WizardLayout>
      </main>

      {currentStation !== 9 && (
        <WizardFooter
          currentStation={currentStation}
          canAdvance={canAdvanceOverride}
          canSkip={stationConfig?.skipable}
          onBack={handleBack}
          onNext={handleNext}
          onSkip={handleSkip}
          onKlara={handleKlara}
          loading={isPending}
        />
      )}

      <KlaraSlideOver />
    </div>
  )
}
