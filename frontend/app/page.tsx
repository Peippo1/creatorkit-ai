import { AnalysisWorkspace } from "@/components/analysis-workspace"

export default function Home() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Creator draft scorecard</span>
          <h1>CreatorKit AI</h1>
          <p className="hero-text">
            Score a post idea or draft before you publish. Get a performance score, critique,
            and direct improvement suggestions in one pass.
          </p>
          <div className="hero-pills" aria-label="Product highlights">
            <span>Hook quality</span>
            <span>Clarity review</span>
            <span>Platform fit</span>
          </div>
        </div>

        <aside className="hero-aside">
          <div className="stat-card">
            <span>Inputs</span>
            <strong>Platform, hook, caption, transcript, duration, niche, CTA</strong>
          </div>
          <div className="stat-card">
            <span>Output</span>
            <strong>Score, critique, strengths, risks, and suggestions</strong>
          </div>
          <div className="stat-card">
            <span>Status</span>
            <strong>Notebook prototype preserved, app scaffold ready</strong>
          </div>
        </aside>
      </section>

      <section className="workspace-panel">
        <AnalysisWorkspace />
      </section>
    </main>
  )
}
