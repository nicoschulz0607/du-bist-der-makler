import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutzerklärung — Du bist der Makler",
  robots: { index: false },
};

export default function Datenschutz() {
  return (
    <div style={{
      maxWidth: "720px",
      margin: "0 auto",
      padding: "clamp(8rem, 14vw, 12rem) clamp(2rem, 6vw, 4rem) 6rem",
      color: "#222222",
    }}>
      <p style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(34,34,34,0.4)", marginBottom: "1rem", fontFamily: "monospace" }}>
        Rechtliches
      </p>
      <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>
        Datenschutz&shy;erklärung
      </h1>
      <p style={{ color: "rgba(34,34,34,0.3)", fontSize: "0.8rem", marginBottom: "3rem" }}>
        Stand: April 2026
      </p>

      <Section title="1. Verantwortlicher">
        <p>
          Nico Schulz / Websight<br />
          Hailanderstraße 14<br />
          72336 Balingen<br />
          E-Mail: <a href="mailto:nico@websight-design.de" style={linkStyle}>nico@websight-design.de</a>
        </p>
      </Section>

      <Section title="2. Grundsätze der Datenverarbeitung">
        <p style={{ color: "rgba(34,34,34,0.7)", lineHeight: 1.8 }}>
          Wir erheben und verarbeiten personenbezogene Daten nur, soweit dies für die Bereitstellung unserer Website und unserer Leistungen erforderlich ist. Die Verarbeitung erfolgt auf Grundlage der einschlägigen Rechtsvorschriften, insbesondere der Datenschutz-Grundverordnung (DSGVO) und des Bundesdatenschutzgesetzes (BDSG).
        </p>
      </Section>

      <Section title="3. Hosting — Vercel">
        <p>
          Diese Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA gehostet. Beim Aufruf unserer Website werden automatisch Verbindungsdaten (IP-Adresse, Datum und Uhrzeit des Abrufs, übertragene Datenmenge, Browsertyp) in Server-Logfiles erfasst. Diese Daten sind technisch notwendig und werden nicht mit anderen Datenquellen zusammengeführt.
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am sicheren Betrieb der Website).
          Datenübermittlung in die USA: Vercel ist unter dem EU-US Data Privacy Framework zertifiziert.
        </p>
      </Section>

      <Section title="4. Kontaktformular">
        <p>
          Wenn Sie uns über das Kontaktformular eine Anfrage senden, werden Ihre Angaben (Name, E-Mail-Adresse, Nachricht) zum Zweck der Bearbeitung Ihrer Anfrage erhoben und gespeichert. Diese Daten werden nicht ohne Ihre Einwilligung weitergegeben.
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnungsmaßnahmen) sowie Art. 6 Abs. 1 lit. f DSGVO.
        </p>
      </Section>

      <Section title="5. Cookies & Tracking">
        <p>
          Diese Website setzt keine Tracking-Cookies und verwendet keine Analyse- oder Werbe-Tools (z. B. Google Analytics). Es werden ausschließlich technisch notwendige Cookies verwendet, die für den Betrieb der Website erforderlich sind und keiner Einwilligung bedürfen.
        </p>
      </Section>

      <Section title="6. Externe Schriften">
        <p>
          Diese Website verwendet Schriftarten, die über die Next.js Font-Optimierung lokal eingebunden werden. Es findet keine externe Anfrage an Drittserver statt.
        </p>
      </Section>

      <Section title="7. Ihre Rechte">
        <p>Sie haben gegenüber uns folgende Rechte hinsichtlich Ihrer personenbezogenen Daten:</p>
        <ul style={{ marginTop: "0.75rem", paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {[
            "Recht auf Auskunft (Art. 15 DSGVO)",
            "Recht auf Berichtigung (Art. 16 DSGVO)",
            "Recht auf Löschung (Art. 17 DSGVO)",
            "Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)",
            "Recht auf Datenübertragbarkeit (Art. 20 DSGVO)",
            "Recht auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)",
          ].map((right) => (
            <li key={right}>{right}</li>
          ))}
        </ul>
        <p style={{ marginTop: "0.75rem" }}>
          Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: <a href="mailto:nico@websight-design.de" style={linkStyle}>nico@websight-design.de</a>
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          Sie haben zudem das Recht, sich bei der zuständigen Datenschutz-Aufsichtsbehörde zu beschweren.
        </p>
      </Section>

      <Section title="8. Datensicherheit">
        <p>
          Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten gegen zufällige oder vorsätzliche Manipulationen, Verlust, Zerstörung oder den Zugriff unberechtigter Personen zu schützen. Die Verbindung zu unserer Website ist stets SSL/TLS-verschlüsselt (erkennbar am „https" in der Adresszeile).
        </p>
      </Section>

      <Section title="9. Aktualität dieser Datenschutzerklärung">
        <p>
          Diese Datenschutzerklärung ist aktuell gültig und hat den Stand April 2026. Durch die Weiterentwicklung unserer Website oder aufgrund geänderter gesetzlicher Vorgaben kann es notwendig werden, diese Datenschutzerklärung zu ändern.
        </p>
      </Section>

      <div style={{ marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid rgba(34,34,34,0.08)" }}>
        <Link href="/" style={{ color: "rgba(34,34,34,0.4)", fontSize: "0.875rem", textDecoration: "none" }}>
          ← Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  color: "#8b6ff7",
  textDecoration: "none",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <h2 style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "rgba(34,34,34,0.4)",
        marginBottom: "0.75rem",
      }}>
        {title}
      </h2>
      <div style={{ fontSize: "0.95rem", lineHeight: 1.8, color: "rgba(34,34,34,0.8)" }}>
        {children}
      </div>
    </div>
  );
}
