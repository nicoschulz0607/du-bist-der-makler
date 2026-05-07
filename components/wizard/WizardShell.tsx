'use client'

import { useState, useTransition } from 'react'
import WizardHeader from './WizardHeader'
import WizardProgressBar from './WizardProgressBar'
import WizardFooter from './WizardFooter'
import KlaraSlideOver from './KlaraSlideOver'
import Station1Quiz from './stations/Station1Quiz'
import Station2Eckdaten from './stations/Station2Eckdaten'
import Station3Grunddaten from './stations/Station3Grunddaten'
import { advanceStation, markStationComplete, skipStation } from '@/lib/wizard/actions'
import { WIZARD_STATIONS } from '@/lib/wizard/config'
import type { StationStatusMap, WizardProfile } from '@/lib/wizard/types'

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
}

interface WizardShellProps {
  initialStation: number
  stationStatus: StationStatusMap
  listingId: string | null
  wizardProfile: WizardProfile
  profileData: ProfileData
  userEmail: string
  initialListingData: InitialListingData | null
}

export default function WizardShell({
  initialStation,
  stationStatus: initialStatusMap,
  listingId,
  wizardProfile,
  profileData,
  userEmail,
  initialListingData,
}: WizardShellProps) {
  const [currentStation, setCurrentStation] = useState(Math.max(1, Math.min(12, initialStation)))
  const [statusMap, setStatusMap] = useState<StationStatusMap>(initialStatusMap)
  const [isPending, startTransition] = useTransition()
  const [returnToStation, setReturnToStation] = useState<number | null>(null)
  const [canAdvanceOverride, setCanAdvanceOverride] = useState(true)
  const [localListingId, setLocalListingId] = useState(listingId)

  const stationConfig = WIZARD_STATIONS.find((s) => s.stationNum === currentStation)!

  function goToStation(n: number) {
    const clamped = Math.max(1, Math.min(12, n))
    setCanAdvanceOverride(true)
    setCurrentStation(clamped)
    startTransition(async () => {
      await advanceStation(clamped)
    })
  }

  function handleNext() {
    const nextStation = returnToStation ?? Math.min(currentStation + 1, 12)
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
    const nextStation = returnToStation ?? Math.min(currentStation + 1, 12)
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

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col overflow-hidden">
      <WizardHeader currentStation={currentStation} totalStations={12} />
      <WizardProgressBar
        currentStation={currentStation}
        stationStatus={statusMap}
        onStationClick={goToStation}
      />

      {/* Station content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[580px] mx-auto px-6 py-8">
          <p className="text-[11px] font-semibold text-[#1B6B45] uppercase tracking-wider mb-2">
            Station {currentStation} · {stationConfig?.phase}
          </p>
          <h1
            className="text-[22px] font-bold text-text-primary mb-2"
            style={{ letterSpacing: '-0.18px' }}
          >
            {stationConfig?.title}
          </h1>
          <p className="text-[14px] text-text-secondary mb-8">{stationConfig?.subtitle}</p>

          {currentStation === 1 && (
            <Station1Quiz initialProfile={wizardProfile} />
          )}

          {currentStation === 2 && (
            <Station2Eckdaten initialData={profileData} userEmail={userEmail} />
          )}

          {currentStation === 3 && (
            <Station3Grunddaten
              initialListing={initialListingData}
              listingId={localListingId}
              onCanAdvanceChange={setCanAdvanceOverride}
              onListingCreated={setLocalListingId}
            />
          )}

          {currentStation > 3 && (
            <div className="rounded-[12px] border border-[#EEEEEE] bg-[#F9F9F9] p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[#E8F5EE] flex items-center justify-center mx-auto mb-3">
                <span className="text-[20px] font-bold text-[#1B6B45]">{currentStation}</span>
              </div>
              <p className="text-[14px] font-medium text-text-primary mb-1">{stationConfig?.title}</p>
              <p className="text-[13px] text-text-secondary">
                Diese Station wird in Kürze implementiert.
              </p>
            </div>
          )}
        </div>
      </main>

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

      <KlaraSlideOver />
    </div>
  )
}
