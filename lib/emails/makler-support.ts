const ACCENT = '#1B6B45'

type Wunschtermin = { datum: string; tageszeit: string }

function tagszeit_label(tageszeit: string): string {
  switch (tageszeit) {
    case 'vormittags': return 'Vormittags (ca. 10 Uhr)'
    case 'nachmittags': return 'Nachmittags (ca. 14 Uhr)'
    case 'abends': return 'Abends (ca. 18 Uhr)'
    case 'wochenende-flexibel': return 'Wochenende – flexibel'
    default: return tageszeit
  }
}

function thema_label(thema: string): string {
  switch (thema) {
    case 'preisverhandlung': return 'Preisverhandlung'
    case 'vertragsfragen': return 'Vertragsfragen'
    case 'besichtigung': return 'Besichtigung'
    case 'sonstiges': return 'Sonstiges'
    default: return thema
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:'Inter',Arial,sans-serif;color:#111111;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">
        <tr><td style="background:${ACCENT};padding:24px 32px;">
          <p style="margin:0;font-size:18px;font-weight:700;color:#FFFFFF;letter-spacing:-0.2px;">du bist der makler</p>
        </td></tr>
        <tr><td style="padding:32px;">
          ${content}
          <hr style="border:none;border-top:1px solid #EEEEEE;margin:28px 0;">
          <p style="margin:0;font-size:12px;color:#999999;">du-bist-der-makler.de &nbsp;·&nbsp; Diese E-Mail wurde automatisch generiert.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function anfrageBestätigungKunde(params: {
  vorname: string
  thema: string
  wunschtermine: Wunschtermin[]
}): { subject: string; html: string } {
  const termineHtml = params.wunschtermine
    .map((t, i) => `<li style="margin-bottom:4px;">Wunschtermin ${i + 1}: <strong>${formatDate(t.datum)}</strong> – ${tagszeit_label(t.tageszeit)}</li>`)
    .join('')

  return {
    subject: 'Deine Anfrage ist bei uns angekommen',
    html: baseLayout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-0.2px;">Hallo ${params.vorname},</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#444444;">deine Beratungs-Anfrage ist bei uns angekommen. Wir melden uns <strong>innerhalb von 24 Stunden</strong> mit einer Bestätigung bei dir.</p>
      <div style="background:#F9F9F9;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#999999;">Deine Anfrage</p>
        <p style="margin:0 0 12px;font-size:15px;"><strong>Thema:</strong> ${thema_label(params.thema)}</p>
        <p style="margin:0 0 8px;font-size:15px;font-weight:600;">Deine Wunschtermine:</p>
        <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;color:#444444;">${termineHtml}</ul>
      </div>
      <p style="margin:0 0 20px;font-size:14px;color:#444444;">Sobald dein Termin bestätigt ist, erhältst du eine weitere E-Mail mit allen Details und einer Kalender-Datei zum Importieren.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/support" style="display:inline-block;background:${ACCENT};color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:100px;font-size:14px;font-weight:600;">Zur Anfrage im Dashboard</a>
    `),
  }
}

export function anfrageNotificationMakler(params: {
  vorname: string
  email: string
  telefon: string
  tier: string
  thema: string
  beschreibung: string
  wunschtermine: Wunschtermin[]
  adminLink: string
}): { subject: string; html: string } {
  const termineHtml = params.wunschtermine
    .map((t, i) => `<li style="margin-bottom:4px;">Wunschtermin ${i + 1}: <strong>${formatDate(t.datum)}</strong> – ${tagszeit_label(t.tageszeit)}</li>`)
    .join('')

  const inklusivHinweis = params.tier === 'premium'
    ? `<div style="background:#E8F5EE;border:1px solid ${ACCENT};border-radius:8px;padding:12px 16px;margin-top:16px;font-size:14px;color:${ACCENT};">🎁 <strong>Premium-Kunde</strong> — prüfe ob Inklusiv-Stunde noch verfügbar ist.</div>`
    : ''

  return {
    subject: `Neue Beratungs-Anfrage von ${params.vorname}`,
    html: baseLayout(`
      <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;">Neue Makler-Anfrage</h1>
      <div style="background:#F9F9F9;border-radius:8px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#999999;">Kunden-Info</p>
        <p style="margin:0 0 4px;font-size:15px;"><strong>Name:</strong> ${params.vorname}</p>
        <p style="margin:0 0 4px;font-size:15px;"><strong>E-Mail:</strong> <a href="mailto:${params.email}" style="color:${ACCENT};">${params.email}</a></p>
        <p style="margin:0 0 4px;font-size:15px;"><strong>Telefon:</strong> ${params.telefon}</p>
        <p style="margin:0;font-size:15px;"><strong>Paket:</strong> ${params.tier}</p>
        ${inklusivHinweis}
      </div>
      <div style="background:#F9F9F9;border-radius:8px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#999999;">Anfrage-Details</p>
        <p style="margin:0 0 8px;font-size:15px;"><strong>Thema:</strong> ${thema_label(params.thema)}</p>
        <p style="margin:0 0 12px;font-size:15px;white-space:pre-wrap;line-height:1.6;color:#444444;">${params.beschreibung}</p>
        <p style="margin:0 0 8px;font-size:15px;font-weight:600;">Wunschtermine:</p>
        <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;color:#444444;">${termineHtml}</ul>
      </div>
      <a href="${params.adminLink}" style="display:inline-block;background:${ACCENT};color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:100px;font-size:15px;font-weight:700;">In Admin-View öffnen →</a>
    `),
  }
}

export function terminBestätigung(params: {
  vorname: string
  bestätigterTermin: string
  dauer: number
  telefon: string
  thema: string
  beschreibung: string
  inklusiv: boolean
  paymentLink?: string
  icsContent: string
}): { subject: string; html: string; attachment: { filename: string; content: string } } {
  const terminStr = formatDateTime(params.bestätigterTermin)
  const zahlungsHinweis = params.inklusiv
    ? `<div style="background:#E8F5EE;border:1px solid ${ACCENT};border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:14px;color:${ACCENT};">🎁 Diese Beratung ist in deinem Premium-Paket <strong>inklusive</strong> — keine weitere Zahlung nötig.</div>`
    : `<div style="background:#FFF4E0;border:1px solid #C07000;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:14px;color:#7A4500;">💳 Bitte schließe vor dem Termin die Zahlung ab (50€):<br><a href="${params.paymentLink ?? ''}" style="color:${ACCENT};font-weight:600;">Jetzt zahlen →</a></div>`

  return {
    subject: `Termin bestätigt: ${terminStr}`,
    html: baseLayout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-0.2px;">Dein Termin steht, ${params.vorname}!</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#444444;">Deine Makler-Beratung ist bestätigt.</p>
      <div style="background:${ACCENT};border-radius:10px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.5px;">Dein Termin</p>
        <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#FFFFFF;">${terminStr}</p>
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.8);">Dauer: ${params.dauer} Minuten · Telefonisch</p>
      </div>
      ${zahlungsHinweis}
      <p style="margin:0 0 16px;font-size:15px;color:#444444;">Du bekommst einen Anruf unter <strong>${params.telefon}</strong>.</p>
      <p style="margin:0 0 24px;font-size:14px;color:#666666;">Im Anhang findest du eine Kalender-Datei (<strong>beratung.ics</strong>) zum Importieren in Apple Calendar, Google Calendar oder Outlook.</p>
      <p style="margin:0;font-size:13px;color:#999999;"><strong>Thema:</strong> ${thema_label(params.thema)}</p>
    `),
    attachment: {
      filename: 'beratung.ics',
      content: Buffer.from(params.icsContent).toString('base64'),
    },
  }
}

export function anfrageAblehnung(params: {
  vorname: string
  adminNotiz: string | null
}): { subject: string; html: string } {
  return {
    subject: 'Zu deiner Beratungs-Anfrage',
    html: baseLayout(`
      <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;">Hallo ${params.vorname},</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444444;">leider können wir deinen gewünschten Termin so nicht realisieren.</p>
      ${params.adminNotiz ? `<div style="background:#F9F9F9;border-radius:8px;padding:16px 20px;margin-bottom:20px;font-size:14px;line-height:1.6;color:#444444;"><strong>Hinweis vom Makler:</strong><br>${params.adminNotiz}</div>` : ''}
      <p style="margin:0 0 24px;font-size:15px;color:#444444;">Du kannst gerne eine neue Anfrage mit anderen Wunschterminen stellen.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/support" style="display:inline-block;background:${ACCENT};color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:100px;font-size:14px;font-weight:600;">Neue Anfrage stellen</a>
    `),
  }
}
