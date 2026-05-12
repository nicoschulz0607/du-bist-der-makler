'use client'

import { useState, useTransition } from 'react'
import { Download, FileText, Image as ImageIcon, File } from 'lucide-react'
import { getSignedUrlForDokument } from './actions'

interface DokumentInfo {
  id: string
  typ: string
  name: string
  datei_name: string | null
  datei_groesse_kb: number | null
}

interface MappeContentProps {
  token: string
  empfaengerName: string
  ablaufdatum: string
  dokumente: DokumentInfo[]
}

function FiletypeIcon({ name }: { name: string | null }) {
  const ext = name?.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return <FileText size={18} strokeWidth={1.5} className="text-red-500" />
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return <ImageIcon size={18} strokeWidth={1.5} className="text-blue-500" />
  return <File size={18} strokeWidth={1.5} className="text-gray-400" />
}

export default function MappeContent({ token, empfaengerName, ablaufdatum, dokumente }: MappeContentProps) {
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  function formatSize(kb: number | null) {
    if (!kb) return ''
    if (kb < 1024) return `${kb} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  async function handleDownload(dok: DokumentInfo) {
    setLoadingId(dok.id)
    startTransition(async () => {
      const result = await getSignedUrlForDokument(token, dok.id)
      if ('url' in result) {
        const a = document.createElement('a')
        a.href = result.url
        a.download = dok.datei_name ?? dok.name
        a.target = '_blank'
        a.click()
      } else {
        alert(result.fehler)
      }
      setLoadingId(null)
    })
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-12 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden">
          <div className="bg-[#1B6B45] px-6 py-5">
            <p className="text-white/70 text-[12px] font-medium uppercase tracking-wide">du bist der makler</p>
            <h1 className="text-white text-[20px] font-bold mt-1" style={{ letterSpacing: '-0.2px' }}>
              Dokumente-Mappe
            </h1>
          </div>
          <div className="px-6 py-4">
            <p className="text-[14px] text-gray-700">
              Für <strong>{empfaengerName}</strong>
            </p>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Gültig bis {formatDate(ablaufdatum)}
            </p>
          </div>
        </div>

        {/* Dokumente */}
        <div className="bg-white rounded-2xl border border-[#EEEEEE] divide-y divide-[#EEEEEE] overflow-hidden">
          {dokumente.length === 0 ? (
            <p className="px-6 py-8 text-center text-[13px] text-gray-400">
              Diese Mappe enthält keine Dokumente.
            </p>
          ) : (
            dokumente.map((dok) => (
              <div key={dok.id} className="flex items-center gap-4 px-5 py-4">
                <FiletypeIcon name={dok.datei_name} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900">{dok.name}</p>
                  {dok.datei_name && (
                    <p className="text-[11px] text-gray-400 truncate">
                      {dok.datei_name}{dok.datei_groesse_kb ? ` · ${formatSize(dok.datei_groesse_kb)}` : ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDownload(dok)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-[#1B6B45] hover:text-[#1B6B45]/80 disabled:opacity-50 flex-shrink-0"
                >
                  {loadingId === dok.id ? (
                    <span className="w-4 h-4 border-2 border-[#1B6B45] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download size={14} strokeWidth={1.75} />
                  )}
                  Download
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400">
          Erstellt mit{' '}
          <a href="https://du-bist-der-makler.de" className="text-[#1B6B45] hover:underline">
            du-bist-der-makler.de
          </a>
          {' '}· Immobilie selbst verkaufen
        </p>
      </div>
    </div>
  )
}
