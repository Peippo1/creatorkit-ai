import { AnalysisWorkspace } from "@/components/analysis-workspace"

export default function Home() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="CreatorKit AI home">
          <span className="brand-mark">CK</span>
          <span className="brand-copy">
            <strong>CreatorKit AI</strong>
            <span>Draft scoring for creators</span>
          </span>
        </a>

        <nav className="topnav" aria-label="Primary">
          <a href="#analyse">Analyse</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Early-stage SaaS for creators</span>
          <h1>Score drafts before you publish.</h1>
          <p className="hero-text">
            CreatorKit AI gives creators a fast read on whether a post idea, caption, or script
            is ready to ship.
          </p>
          <p className="hero-support">
            Paste a draft, get a performance score, and see what to fix first. Built for quick
            pre-publish decisions, not dashboards you have to babysit.
          </p>

          <div className="hero-actions">
            <a className="button" href="#analyse">
              Analyse draft
            </a>
            <span className="hero-note">History and saved drafts stay in your browser session</span>
          </div>

          <div className="hero-points" aria-label="Product highlights">
            <span>Hook quality</span>
            <span>Clarity review</span>
            <span>Platform fit</span>
          </div>
        </div>

        <aside className="hero-panel" aria-label="Product summary">
          <div className="panel-label">What the analysis checks</div>
          <ul className="bullet-list">
            <li>
              <strong>Hook strength</strong>
              <span>Does the opening earn attention quickly?</span>
            </li>
            <li>
              <strong>Clarity</strong>
              <span>Is the idea easy to follow without extra context?</span>
            </li>
            <li>
              <strong>Platform fit</strong>
              <span>Does the format suit where the post will live?</span>
            </li>
          </ul>

          <div className="hero-stat">
            <span>Output</span>
            <strong>Score, critique, strengths, risks, and suggestions</strong>
          </div>
        </aside>
      </section>

      <section className="workspace" id="analyse">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Analyse</span>
            <h2>Run a draft through the scoring flow.</h2>
          </div>
          <p>
            Fill in the core inputs and get a structured answer back from the local backend in a
            single request.
          </p>
        </div>

        <AnalysisWorkspace />
      </section>
    </main>
  )
}
