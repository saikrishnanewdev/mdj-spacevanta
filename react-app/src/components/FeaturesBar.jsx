const features = [
  {
    id: 'feature-scanning',
    title: 'High-Speed Scanning',
    description: 'High-speed scanning on rulees scanning',
    icon: (
      // Stopwatch icon matching screenshot
      <svg viewBox="0 0 24 24" className="feature-icon-svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Stopwatch body */}
        <circle cx="12" cy="13" r="8" />
        {/* Crown / top */}
        <path d="M12 5V3" />
        <path d="M10 3h4" />
        {/* Start button sides */}
        <path d="M6.3 6.3 5 5" />
        <path d="M17.7 6.3 19 5" />
        {/* Clock hand */}
        <polyline points="12 9 12 13 15 15" />
      </svg>
    ),
  },
  {
    id: 'feature-db-sync',
    title: 'Database Sync',
    description: 'Databaste solution to data unnaccess database',
    icon: (
      // Cloud + database icon matching screenshot
      <svg viewBox="0 0 24 24" className="feature-icon-svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Cloud */}
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" />
        {/* Small cylinder/DB hint */}
        <ellipse cx="12" cy="15.5" rx="3" ry="1.5" />
        <path d="M9 15.5v3c0 .83 1.34 1.5 3 1.5s3-.67 3-1.5v-3" />
      </svg>
    ),
  },
  {
    id: 'feature-gemini',
    title: 'Automated Gemini Evaluation',
    description: 'Automated gemini evaluation from scelence.',
    icon: (
      // Brain / AI icon matching screenshot
      <svg viewBox="0 0 24 24" className="feature-icon-svg gemini-brain-svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-7.88A2.5 2.5 0 0 1 9.5 2z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-7.88A2.5 2.5 0 0 0 14.5 2z" />
      </svg>
    ),
    badge: true,
  },
]

export default function FeaturesBar() {
  return (
    <section className="features-bar">
      <div className="features-container">
        {features.map(({ id, title, description, icon, badge }) => (
          <div className="feature-card" id={id} key={id}>
            <div className="feature-icon-wrapper">
              {icon}
              {badge && <div className="g-brand-badge">G</div>}
            </div>
            <div className="feature-details">
              <h3 className="feature-title">{title}</h3>
              <p className="feature-description">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
