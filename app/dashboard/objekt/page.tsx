export const metadata = { title: 'Mein Objekt — Dashboard' }

const inputBase =
  'w-full rounded-[8px] border border-[#DDDDDD] px-4 min-h-[52px] text-[15px] font-medium text-text-primary bg-white outline-none transition-all duration-200 placeholder:text-text-tertiary focus:ring-2 focus:ring-accent focus:border-transparent'

const labelBase = 'block text-[13px] font-semibold text-text-primary mb-1.5'

export default function ObjektPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-1" style={{ letterSpacing: '-0.18px' }}>
          Mein Objekt
        </h1>
        <p className="text-[14px] text-text-secondary">
          Trage deine Immobiliendaten ein. Foto-Upload und Speichern werden in Kürze freigeschaltet.
        </p>
      </div>

      <div className="bg-[#FFF4E0] border border-[#C07000] rounded-xl px-5 py-3">
        <p className="text-[13px] font-medium text-[#C07000]">
          Dieses Formular ist noch nicht aktiv — Speichern wird in Kürze verfügbar sein.
        </p>
      </div>

      <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-5">
        <h2 className="text-[16px] font-bold text-text-primary" style={{ letterSpacing: '-0.18px' }}>
          Objekt-Grunddaten
        </h2>

        {/* Objekttyp */}
        <div>
          <label className={labelBase}>Objekttyp</label>
          <select className={inputBase} disabled>
            <option value="">Bitte wählen</option>
            <option>Einfamilienhaus</option>
            <option>Wohnung</option>
            <option>Mehrfamilienhaus</option>
            <option>Grundstück</option>
            <option>Gewerbe</option>
          </select>
        </div>

        {/* Adresse */}
        <div>
          <label className={labelBase}>Straße & Hausnummer</label>
          <input type="text" className={inputBase} placeholder="Musterstraße 1" disabled />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>PLZ</label>
            <input type="text" className={inputBase} placeholder="12345" disabled />
          </div>
          <div>
            <label className={labelBase}>Ort</label>
            <input type="text" className={inputBase} placeholder="München" disabled />
          </div>
        </div>

        {/* Eckdaten */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>Wohnfläche (m²)</label>
            <input type="number" className={inputBase} placeholder="120" disabled />
          </div>
          <div>
            <label className={labelBase}>Zimmer</label>
            <input type="number" className={inputBase} placeholder="4" step="0.5" disabled />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>Baujahr</label>
            <input type="number" className={inputBase} placeholder="1990" disabled />
          </div>
          <div>
            <label className={labelBase}>Zustand</label>
            <select className={inputBase} disabled>
              <option value="">Bitte wählen</option>
              <option>Neubau</option>
              <option>Modernisiert</option>
              <option>Gepflegt</option>
              <option>Renovierungsbedürftig</option>
            </select>
          </div>
        </div>

        {/* Preis */}
        <div>
          <label className={labelBase}>Verkaufspreis (€)</label>
          <input type="number" className={inputBase} placeholder="450000" disabled />
        </div>

        {/* Energieausweis */}
        <div>
          <label className={labelBase}>Energieausweis-Klasse</label>
          <select className={inputBase} disabled>
            <option value="">Bitte wählen</option>
            {['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </div>

        {/* Beschreibung */}
        <div>
          <label className={labelBase}>Beschreibung</label>
          <textarea
            className="w-full rounded-[8px] border border-[#DDDDDD] px-4 py-3 text-[15px] font-medium text-text-primary bg-white outline-none transition-all duration-200 placeholder:text-text-tertiary focus:ring-2 focus:ring-accent focus:border-transparent min-h-[120px] resize-vertical"
            placeholder="Beschreibe deine Immobilie in 2–3 Sätzen..."
            maxLength={2000}
            disabled
          />
        </div>

        {/* Foto-Upload Platzhalter */}
        <div>
          <label className={labelBase}>Fotos (min. 5, max. 30)</label>
          <div className="border-2 border-dashed border-[#DDDDDD] rounded-[8px] p-8 flex flex-col items-center text-center">
            <p className="text-[14px] font-medium text-text-secondary">Foto-Upload kommt in Kürze</p>
            <p className="text-[12px] text-text-tertiary mt-1">JPEG / PNG, max. 10 MB pro Foto</p>
          </div>
        </div>

        <button
          type="button"
          disabled
          className="w-full inline-flex items-center justify-center rounded-pill bg-accent text-white text-[15px] font-semibold px-6 min-h-[52px] opacity-40 cursor-not-allowed"
        >
          Speichern (kommt in Kürze)
        </button>
      </div>
    </div>
  )
}
