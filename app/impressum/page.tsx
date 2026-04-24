import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum — Du bist der Makler",
  robots: { index: false },
};

export default function Impressum() {
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
      <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "3rem" }}>
        Impressum
      </h1>

      <Section title="Angaben gemäß § 5 TMG">
        <p>Nico Schulz</p>
        <p>Websight</p>
        <p style={{ color: "rgba(34,34,34,0.6)", marginTop: "0.25rem" }}>
          Hailanderstraße 14<br />
          72336 Balingen<br />
          Deutschland
        </p>
      </Section>

      <Section title="Kontakt">
        <p>E-Mail: <a href="mailto:nico@websight-design.de" style={linkStyle}>nico@websight-design.de</a></p>
        <p>Web: <a href="https://websight-design.de" style={linkStyle}>websight-design.de</a></p>
      </Section>

      <Section title="Umsatzsteuer">
        <p style={{ color: "rgba(34,34,34,0.7)", lineHeight: 1.8 }}>
          Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).<br />
          <span style={{ color: "rgba(34,34,34,0.4)", fontSize: "0.85rem" }}>
            (USt-IdNr.: entfällt)
          </span>
        </p>
      </Section>

      <Section title="Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV">
        <p>Nico Schulz<br />Hailanderstraße 14, 72336 Balingen</p>
      </Section>

      <Section title="Haftung für Inhalte">
        <p style={{ color: "rgba(34,34,34,0.7)", lineHeight: 1.8 }}>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
        </p>
        <p style={{ color: "rgba(34,34,34,0.7)", lineHeight: 1.8, marginTop: "1rem" }}>
          Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
        </p>
      </Section>

      <Section title="Haftung für Links">
        <p style={{ color: "rgba(34,34,34,0.7)", lineHeight: 1.8 }}>
          Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
        </p>
      </Section>

      <Section title="Urheberrecht">
        <p style={{ color: "rgba(34,34,34,0.7)", lineHeight: 1.8 }}>
          Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
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
