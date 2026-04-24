import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AGB — Du bist der Makler",
  robots: { index: false },
};

export default function AGB() {
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
        Allgemeine Geschäfts&shy;bedingungen
      </h1>
      <p style={{ color: "rgba(34,34,34,0.3)", fontSize: "0.8rem", marginBottom: "3rem" }}>
        Stand: April 2026
      </p>

      <Section title="1. Geltungsbereich">
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Geschäftsbeziehungen zwischen Nico Schulz (nachfolgend „Anbieter") und den Nutzern der Plattform „Du bist der Makler" (nachfolgend „Plattform"). Maßgeblich ist die jeweils zum Zeitpunkt des Vertragsschlusses gültige Fassung.
        </p>
      </Section>

      <Section title="2. Leistungsbeschreibung">
        <p>
          Die Plattform stellt Werkzeuge und Informationen zur Unterstützung von Immobilienvermittlungsprozessen bereit. Der genaue Funktionsumfang ergibt sich aus der aktuellen Beschreibung auf der Website. Der Anbieter behält sich vor, Funktionen zu erweitern oder anzupassen, sofern dies dem technischen Fortschritt dient oder rechtlich erforderlich ist.
        </p>
      </Section>

      <Section title="3. Vertragsschluss">
        <p>
          Die Darstellung der Leistungen auf der Website stellt kein rechtlich bindendes Angebot, sondern eine Aufforderung zur Bestellung dar. Durch den Abschluss des Registrierungsvorgangs oder die Inanspruchnahme von kostenpflichtigen Leistungen gibt der Nutzer ein verbindliches Angebot zum Vertragsschluss ab.
        </p>
      </Section>

      <Section title="4. Pflichten des Nutzers">
        <p>
          Der Nutzer ist verpflichtet, bei der Registrierung wahrheitsgemäße Angaben zu machen. Zugangsdaten sind vor dem Zugriff Dritter zu schützen. Die Plattform darf nicht für rechtswidrige Zwecke oder zur Verbreitung von Schadsoftware genutzt werden.
        </p>
      </Section>

      <Section title="5. Zahlungsbedingungen">
        <p>
          Sofern Leistungen kostenpflichtig sind, richten sich die Preise nach der zum Zeitpunkt der Bestellung gültigen Preisliste. Die Zahlung erfolgt über die angebotenen Zahlungsmethoden. Bei Zahlungsverzug ist der Anbieter berechtigt, den Zugang zur Plattform vorübergehend zu sperren.
        </p>
      </Section>

      <Section title="6. Haftungsbeschränkung">
        <p>
          Der Anbieter haftet unbeschränkt bei Vorsatz oder grober Fahrlässigkeit. Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung einer wesentlichen Vertragspflicht (Kardinalpflicht). Die Haftung für mittelbare Schäden oder entgangenen Gewinn ist in diesem Fall ausgeschlossen.
        </p>
      </Section>

      <Section title="7. Datenschutz">
        <p>
          Informationen zur Verarbeitung personenbezogener Daten finden Sie in unserer separaten Datenschutzerklärung.
        </p>
      </Section>

      <Section title="8. Schlussbestimmungen">
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist, sofern gesetzlich zulässig, Balingen. Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
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
  color: "#1B6B45",
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
