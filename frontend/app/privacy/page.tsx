import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | CreatorKit AI",
  description: "Privacy policy for CreatorKit AI.",
}

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <article className="legal-card">
          <header className="legal-header">
            <span className="eyebrow">Legal</span>
            <h1>Privacy Policy</h1>
            <p className="legal-updated">Last updated: April 2026</p>
            <p className="legal-intro">
              CreatorKit AI is built to help creators improve their content - not to harvest
              their data.
            </p>
          </header>

          <div className="legal-sections">
            <section className="legal-section" aria-labelledby="privacy-what-we-collect">
              <h2 id="privacy-what-we-collect">What we collect</h2>
              <p>We collect only what&apos;s needed to run the product:</p>
              <ul className="legal-list">
                <li>Draft content you submit (hooks, captions, transcripts)</li>
                <li>Basic usage data (interactions, page views)</li>
                <li>Technical data (browser type, IP address)</li>
              </ul>
              <p>We do not intentionally collect sensitive personal data.</p>
            </section>

            <section className="legal-section" aria-labelledby="privacy-how-use-data">
              <h2 id="privacy-how-use-data">How we use your data</h2>
              <p>We use your data to:</p>
              <ul className="legal-list">
                <li>Generate analysis and feedback</li>
                <li>Improve product performance and reliability</li>
                <li>Understand how the product is used</li>
              </ul>
              <p>We do not use your content to train machine learning models.</p>
            </section>

            <section className="legal-section" aria-labelledby="privacy-storage">
              <h2 id="privacy-storage">Storage &amp; retention</h2>
              <ul className="legal-list">
                <li>Data may be stored temporarily to support features like draft history</li>
                <li>We aim to minimise retention wherever possible</li>
              </ul>
            </section>

            <section className="legal-section" aria-labelledby="privacy-analytics">
              <h2 id="privacy-analytics">Analytics</h2>
              <p>
                We use Vercel Analytics for lightweight, anonymised usage insights. This does not
                identify you personally.
              </p>
            </section>

            <section className="legal-section" aria-labelledby="privacy-gdpr">
              <h2 id="privacy-gdpr">Legal basis (GDPR)</h2>
              <p>We process data under:</p>
              <ul className="legal-list">
                <li>Legitimate interest (running and improving the product)</li>
                <li>Consent (where applicable)</li>
              </ul>
            </section>

            <section className="legal-section" aria-labelledby="privacy-rights">
              <h2 id="privacy-rights">Your rights</h2>
              <p>You have the right to:</p>
              <ul className="legal-list">
                <li>Access your data</li>
                <li>Request deletion</li>
                <li>Object to processing</li>
              </ul>
              <p className="legal-contact">
                Contact: <a href="mailto:example@email.com">example@email.com</a>
              </p>
            </section>

            <section className="legal-section" aria-labelledby="privacy-security">
              <h2 id="privacy-security">Security</h2>
              <p>
                We take reasonable measures to protect your data, but no system is completely
                secure.
              </p>
            </section>

            <section className="legal-section" aria-labelledby="privacy-updates">
              <h2 id="privacy-updates">Updates</h2>
              <p>We may update this policy as the product evolves.</p>
            </section>

            <section className="legal-section" aria-labelledby="privacy-contact">
              <h2 id="privacy-contact">Contact</h2>
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
