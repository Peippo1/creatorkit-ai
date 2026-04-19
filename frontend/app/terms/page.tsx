import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | CreatorKit AI",
  description: "Terms of service for CreatorKit AI.",
}

export default function TermsPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <article className="legal-card">
          <header className="legal-header">
            <span className="eyebrow">Legal</span>
            <h1>Terms of Service</h1>
            <p className="legal-updated">Last updated: April 2026</p>
            <p className="legal-intro">
              CreatorKit AI provides content analysis tools for creators.
            </p>
          </header>

          <div className="legal-sections">
            <section className="legal-section" aria-labelledby="terms-use">
              <h2 id="terms-use">Use of the service</h2>
              <p>You may use CreatorKit AI to analyse and improve your content.</p>
              <p>You agree not to misuse the service or use it for unlawful purposes.</p>
            </section>

            <section className="legal-section" aria-labelledby="terms-no-guarantees">
              <h2 id="terms-no-guarantees">No guarantees</h2>
              <p>The product provides guidance, not guarantees.</p>
              <p>We do not promise performance outcomes or accuracy.</p>
            </section>

            <section className="legal-section" aria-labelledby="terms-content">
              <h2 id="terms-content">Your content</h2>
              <p>You retain ownership of anything you submit.</p>
              <p>You are responsible for ensuring you have the right to use that content.</p>
            </section>

            <section className="legal-section" aria-labelledby="terms-acceptable-use">
              <h2 id="terms-acceptable-use">Acceptable use</h2>
              <p>You agree not to:</p>
              <ul className="legal-list">
                <li>Submit illegal or harmful content</li>
                <li>Abuse, overload, or disrupt the service</li>
                <li>Attempt to reverse engineer the system</li>
              </ul>
            </section>

            <section className="legal-section" aria-labelledby="terms-liability">
              <h2 id="terms-liability">Limitation of liability</h2>
              <p>The service is provided &ldquo;as is&rdquo;.</p>
              <p>We are not liable for any damages resulting from its use.</p>
            </section>

            <section className="legal-section" aria-labelledby="terms-changes">
              <h2 id="terms-changes">Changes</h2>
              <p>We may update or modify the product at any time.</p>
            </section>

            <section className="legal-section" aria-labelledby="terms-law">
              <h2 id="terms-law">Governing law</h2>
              <p>England and Wales.</p>
            </section>

            <section className="legal-section" aria-labelledby="terms-contact">
              <h2 id="terms-contact">Contact</h2>
              <p className="legal-contact">
                <a href="mailto:example@email.com">example@email.com</a>
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  )
}
