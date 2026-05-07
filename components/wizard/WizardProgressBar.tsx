'use client'

import { WIZARD_PHASES, WIZARD_STATIONS, getPhaseForStation } from '@/lib/wizard/config'
import type { StationStatusMap } from '@/lib/wizard/types'
import type { PhaseNumber } from '@/lib/wizard/config'

interface WizardProgressBarProps {
  currentStation: number
  stationStatus: StationStatusMap
  onStationClick: (stationNum: number) => void
}

export default function WizardProgressBar({ currentStation, stationStatus, onStationClick }: WizardProgressBarProps) {
  const currentPhase = getPhaseForStation(currentStation)

  return (
    <div className="bg-white border-b border-[#EEEEEE] px-6 pt-3 pb-2.5 flex-shrink-0">
      {/* Segments */}
      <div className="flex gap-1 mb-2">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
          const status = stationStatus[n]?.status
          const isCompleted = status === 'completed' || status === 'skipped' || n < currentStation
          const isCurrent = n === currentStation
          const stationTitle = WIZARD_STATIONS.find((s) => s.stationNum === n)?.title ?? `Station ${n}`

          return (
            <button
              key={n}
              type="button"
              title={`Station ${n}: ${stationTitle}`}
              onClick={() => onStationClick(n)}
              className={`flex-1 h-1.5 rounded-full transition-colors duration-200 cursor-pointer hover:opacity-75 ${
                isCompleted
                  ? 'bg-[#1B6B45]'
                  : isCurrent
                  ? 'bg-[#2D8B5A]'
                  : 'bg-[#EEEEEE]'
              }`}
            />
          )
        })}
      </div>

      {/* Phase labels */}
      <div className="flex text-[11px] font-medium">
        {(Object.entries(WIZARD_PHASES) as [string, { label: string; range: [number, number] }][]).map(
          ([num, { label, range }]) => {
            const phaseNum = parseInt(num) as PhaseNumber
            const isActive = currentPhase === phaseNum
            const segmentCount = range[1] - range[0] + 1

            return (
              <div
                key={num}
                style={{ flex: segmentCount }}
                className={`transition-colors duration-200 ${
                  isActive ? 'text-[#1B6B45] font-semibold' : 'text-text-secondary'
                } ${phaseNum !== currentPhase ? 'hidden md:block' : ''}`}
              >
                {label}
              </div>
            )
          }
        )}
      </div>
    </div>
  )
}
