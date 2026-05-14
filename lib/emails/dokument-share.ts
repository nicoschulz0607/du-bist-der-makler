const ACCENT = '#1B6B45'

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

type DokumentShareEmailParams = {
  empfaenger_name: string
  share_url: string
  ablaufdatum: string
  passwortgeschuetzt: boolean
}

export function dokumentShareEmail(params: DokumentShareEmailParams): {
  subject: string
  html: string
} {
  const { empfaenger_name, share_url, ablaufdatum, passwortgeschuetzt } = params

  const subject = 'Ihre Dokumente-Mappe für Ihre Immobilie'

  const passwortHinweis = passwortgeschuetzt
    ? `<p style="margin:16px 0 0;padding:12px 16px;background:#FFF8E7;border-radius:8px;font-size:14px;color:#92400E;">
        🔒 Diese Mappe ist passwortgeschützt. Das Passwort erhalten Sie separat vom Verkäufer.
      </p>`
    : ''

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
      Dokumente-Mappe bereit
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.6;">
      Hallo ${empfaenger_name},
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.6;">
      eine Immobilien-Dokumente-Mappe wurde für Sie zusammengestellt. Sie enthält alle relevanten Unterlagen für Ihre Anfrage.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td style="background:#F8FAF9;border:1px solid #D1E7DC;border-radius:10px;padding:20px 24px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#1B6B45;text-transform:uppercase;letter-spacing:0.5px;">Ihre Zugangs-Mappe</p>
        <p style="margin:0 0 16px;font-size:13px;color:#666666;">Gültig bis: ${ablaufdatum}</p>
        <a href="${share_url}"
           style="display:inline-block;background:${ACCENT};color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;">
          Dokumente ansehen →
        </a>
      </td></tr>
    </table>

    ${passwortHinweis}

    <p style="margin:24px 0 0;font-size:13px;color:#888888;line-height:1.6;">
      Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>
      <a href="${share_url}" style="color:${ACCENT};word-break:break-all;">${share_url}</a>
    </p>

    <p style="margin:20px 0 0;font-size:13px;color:#AAAAAA;">
      Diese Mappe wurde vom Verkäufer über <em>du bist der makler</em> geteilt und läuft am ${ablaufdatum} ab.
    </p>
  `

  return {
    subject,
    html: baseLayout(content),
  }
}
