'use client'

type TestCase = {
  label: string
  body: Record<string, unknown>
}

const TEST_CASES: TestCase[] = [
  { label: 'Test-Kauf: Pro 6 Monate', body: { kind: 'paket', tier: 'pro', laufzeit: 6 } },
  { label: 'Test-Kauf: Reaktivierung Pro', body: { kind: 'reaktivierung', tier: 'pro' } },
  { label: 'Test-Kauf: Tool-Paket', body: { kind: 'addon', addon_type: 'toolpaket' } },
  { label: 'Test-Kauf: Makler-Stunde', body: { kind: 'addon', addon_type: 'maklerstunde' } },
]

export default function StripeDevTest() {
  async function handleClick(body: Record<string, unknown>) {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`Fehler: ${data.error ?? res.status}`)
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e) {
      alert(`Netzwerkfehler: ${String(e)}`)
    }
  }

  return (
    <div style={{ border: '2px dashed #f59e0b', borderRadius: 12, padding: '16px 20px', background: '#fffbeb' }}>
      <p style={{ fontWeight: 700, fontSize: 13, color: '#92400e', marginBottom: 12 }}>
        ⚠ Stripe-Test (nur DEV)
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {TEST_CASES.map((tc) => (
          <button
            key={tc.label}
            onClick={() => handleClick(tc.body)}
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid #d97706',
              background: '#fff',
              color: '#92400e',
              cursor: 'pointer',
            }}
          >
            {tc.label}
          </button>
        ))}
      </div>
    </div>
  )
}
