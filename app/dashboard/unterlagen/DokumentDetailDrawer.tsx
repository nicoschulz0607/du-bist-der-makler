'use client'

import { useState, useTransition } from 'react'
import { X, ExternalLink, Trash2, Eye } from 'lucide-react'
import DokumentUpload from '@/components/dokumente/DokumentUpload'
import DokumentStatusBadge from '@/components/dokumente/DokumentStatusBadge'
import { DokumentMitStatus } from './DokumentKarte'
import { uploadDokument, saveDokumentStatus, deleteDokument } from './actions'

type Status = 'fehlt' | 'angefragt' | 'vorhanden' | 'nicht_relevant'

interface DokumentDetailDrawerProps {
  dokument: DokumentMitStatus | null
  onClose: () => void
}

export default function DokumentDetailDrawer({ dokument, onClose }: DokumentDetailDrawerProps) {
  const [isPending, startTransition] = useTransition()
  const [notiz, setNotiz] = useState(dokument?.notiz ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  if (!dokument) return null

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as Status
    startTransition(async () => {
      await saveDokumentStatus(dokument!.typ, newStatus)
      showToast('Status gespeichert.')
    })
  }

  function handleNotizBlur() {
    startTransition(async () => {
      await saveDokumentStatus(dokument!.typ, dokument!.status, notiz)
    })
  }

  async function handleUpload(file: File) {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('file', file)
      await uploadDokument(dokument!.typ, fd)
      showToast('Datei erfolgreich hochgeladen.')
    })
  }

  function handleDelete() {
    if (!dokument?.db_id) return
    startTransition(async () => {
      await deleteDokument(dokument!.db_id!)
      setConfirmDelete(false)
      showToast('Datei gelöscht.')
    })
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40 md:block"
        onClick={onClose}
      />

      {/* Drawer — Desktop: Slide-over rechts, Mobile: Bottom-Sheet */}
      <div className="fixed z-50 bg-white shadow-2xl
        inset-x-0 bottom-0 rounded-t-2xl max-h-[92dvh] overflow-y-auto
        md:inset-auto md:right-0 md:top-0 md:bottom-0 md:w-[440px] md:rounded-none md:rounded-l-2xl
        transition-transform duration-300">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#EEEEEE] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-semibold text-text-primary">{dokument.name}</h2>
            <DokumentStatusBadge status={dokument.status} />
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-text-secondary">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Was ist das? */}
          <section>
            <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Was ist das?</h3>
            <p className="text-[13px] text-text-primary leading-relaxed">{dokument.beschreibung}</p>
          </section>

          {/* Wo bekomme ich das? */}
          <section>
            <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Wo bekomme ich das?</h3>
            <p className="text-[13px] text-text-primary leading-relaxed">{dokument.bezugsquelle}</p>
            {dokument.partner_link && dokument.partner_name && (
              <a
                href={dokument.partner_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 text-[13px] font-medium text-accent hover:underline"
              >
                <ExternalLink size={13} strokeWidth={1.75} />
                {dokument.partner_name}
                {dokument.partner_preis_ab && (
                  <span className="text-text-secondary font-normal">{dokument.partner_preis_ab}</span>
                )}
              </a>
            )}
          </section>

          {/* Upload */}
          <section>
            <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Datei hochladen</h3>
            {dokument.status === 'vorhanden' && dokument.datei_url ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-green-800 truncate">{dokument.datei_name}</p>
                    <p className="text-[11px] text-green-600">Hochgeladen</p>
                  </div>
                  <a
                    href={dokument.datei_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-green-100 text-green-700"
                    title="Ansehen"
                  >
                    <Eye size={15} strokeWidth={1.75} />
                  </a>
                </div>

                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 text-[12px] text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={13} strokeWidth={1.75} />
                    Datei löschen
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-[12px] text-red-600">Wirklich löschen?</p>
                    <button
                      onClick={handleDelete}
                      disabled={isPending}
                      className="text-[12px] font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Ja, löschen
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-[12px] text-text-secondary hover:text-text-primary"
                    >
                      Abbrechen
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <DokumentUpload onUpload={handleUpload} isPending={isPending} />
            )}
          </section>

          {/* Status */}
          <section>
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Status manuell setzen
            </label>
            <select
              defaultValue={dokument.status}
              onChange={handleStatusChange}
              disabled={isPending}
              className="w-full h-11 px-3 rounded-xl border border-[#DDDDDD] text-[13px] text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
            >
              <option value="fehlt">Fehlt</option>
              <option value="angefragt">Angefragt (z. B. beim Amt)</option>
              <option value="vorhanden">Vorhanden (ohne Datei)</option>
              <option value="nicht_relevant">Nicht relevant für mich</option>
            </select>
          </section>

          {/* Notiz */}
          <section>
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Notiz (optional)
            </label>
            <textarea
              value={notiz}
              onChange={(e) => setNotiz(e.target.value.slice(0, 500))}
              onBlur={handleNotizBlur}
              disabled={isPending}
              rows={3}
              placeholder="z. B. beantragt am 12. Mai beim Grundbuchamt…"
              className="w-full px-3 py-2.5 rounded-xl border border-[#DDDDDD] text-[13px] text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
            />
            <p className="text-[11px] text-text-secondary mt-1">{notiz.length}/500</p>
          </section>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white text-[13px] px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </>
  )
}
