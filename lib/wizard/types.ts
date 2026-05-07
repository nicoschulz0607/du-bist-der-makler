export type WizardStation = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export type StationStatus = 'open' | 'completed' | 'skipped'

export interface StationStatusEntry {
  status: StationStatus
  skip_reason?: string
}

export type StationStatusMap = Partial<Record<number, StationStatusEntry>>

export interface WizardProfile {
  erste_immobilie?: boolean
  zeithorizont?: 'so_schnell' | 'drei_sechs_monate' | 'kein_druck'
  tempo?: 'gefuehrt' | 'selbstaendig'
}

export interface WizardProgress {
  id: string
  user_id: string
  aktuelle_station: WizardStation
  station_status: StationStatusMap
  wizard_profile: WizardProfile
  gestartet_am: string
  abgeschlossen_am: string | null
  zuletzt_aktiv_am: string
}
