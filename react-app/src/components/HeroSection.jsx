export default function HeroSection({ onOpenModal }) {
  return (
    <section className="hero-section" id="home">
      {/* hero_clean.png: clean scanner/desk scene with no baked-in text or UI.
          React renders the title, buttons and labels as interactive overlays. */}
      <div className="hero-bg-container bg-clean" id="hero-background" />

      <div className="hero-overlay-content">

        {/* Title + [REQUEST A DEMO] — upper-left */}
        <div className="hero-left">
          <h1 className="hero-title">
            High-Speed Automated<br />Document Scanner
          </h1>
          <button
            className="btn btn-teal btn-bracket hero-demo-btn"
            id="btn-request-demo"
            onClick={onOpenModal}
          >
            [REQUEST A DEMO]
          </button>
        </div>

        {/* [VISIT STORE] — bottom-right corner */}
        <a
          href="#store"
          className="btn btn-gradient btn-visit-store"
          id="btn-visit-store"
        >
          [VISIT STORE]
        </a>

      </div>
    </section>
  )
}
