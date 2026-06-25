const IconLightning = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IconTarget = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IconBrain = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/></svg>;
const IconChart = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 17v-4"/><path d="M12 17V9"/><path d="M17 17v-6"/></svg>;
const IconShield = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 2.89 0 4.7 1 6.88 2a1 1 0 0 1 1 1v7z"/></svg>;
const IconCloud = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>;
const IconNodes = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>;
const IconBook = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>;
const IconChecklist = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>;
const IconFile = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>;

const IconFire = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;

const LeftFeature = ({ icon, title, desc, delay }) => (
  <div className="hero-left-feature" style={{ animationDelay: `${delay}s` }}>
    <div className="hlf-icon">{icon}</div>
    <div className="hlf-text">
      <div className="hlf-title">{title}</div>
      <div className="hlf-desc">{desc}</div>
    </div>
  </div>
);

const RightFeature = ({ icon, title, desc, delay }) => (
  <div className="hero-glass-card" style={{ animationDelay: `${delay}s` }}>
    <div className="hgc-icon">{icon}</div>
    <div className="hgc-text">
      <div className="hgc-title">{title}</div>
      {desc && <div className="hgc-desc">{desc}</div>}
    </div>
  </div>
);

export default function HeroSection({ onOpenModal }) {
  return (
    <section className="hero-section" id="home">
      <div className="hero-container">
        
        {/* LEFT COLUMN */}
        <div className="hero-left-col">
          <h1 className="hero-main-title">
            High-Speed<br/>Exam Evaluator
          </h1>
          <div className="hero-subtitle">
            <span className="text-teal">95% Consistency</span> | Accurate. Fast. Reliable.
          </div>
          
          <div className="hero-left-feature-list">
            <LeftFeature delay={0.1} icon={<IconLightning />} title="High-Speed Scanning" desc="Up to 100 pages per minute" />
            <LeftFeature delay={0.15} icon={<IconTarget />} title="95% Consistency" desc="AI-powered accuracy & uniform evaluation" />
            <LeftFeature delay={0.2} icon={<IconBrain />} title="AI-Powered Evaluation" desc="Smart answer detection & scoring" />
            <LeftFeature delay={0.25} icon={<IconChart />} title="Detailed Analytics" desc="Performance insights & reports" />
            <LeftFeature delay={0.3} icon={<IconShield />} title="Secure & Reliable" desc="Data encryption & secure storage" />
            <LeftFeature delay={0.35} icon={<IconCloud />} title="Cloud Integration" desc="Access results anytime, anywhere" />
            <LeftFeature delay={0.4} icon={<IconNodes />} title="Easy Integrations" desc="LMS, ERP & other platforms" />
            <LeftFeature delay={0.45} icon={<IconBook />} title="Multi-Subject Support" desc="Evaluate multiple subjects seamlessly" />
            <LeftFeature delay={0.5} icon={<IconChecklist />} title="Custom Evaluation Rules" desc="Flexible rules for different exam patterns" />
            <LeftFeature delay={0.55} icon={<IconFile />} title="Audit Trail & Reports" desc="Complete tracking & transparency" />
          </div>

          <button
            className="btn btn-teal btn-bracket hero-btn-demo"
            onClick={onOpenModal}
          >
            [REQUEST A DEMO]
          </button>
        </div>

        {/* RIGHT COLUMN */}
        <div className="hero-right-col">
          <div className="hero-glass-grid">
            <RightFeature delay={0.6} icon={<IconBook />} title="Multi-Subject" desc="Support" />
            <RightFeature delay={0.7} icon={<IconChecklist />} title="Custom Evaluation" desc="Rules" />
            <RightFeature delay={0.8} icon={<IconFire />} title="Real-time" desc="Results" />
            <RightFeature delay={0.9} icon={<IconFile />} title="Audit Trail &" desc="Reports" />
            <RightFeature delay={1.0} icon={<IconCloud />} title="Cloud Access" desc="Anywhere" />
            <RightFeature delay={1.1} icon={<IconNodes />} title="Easy" desc="Integrations" />
          </div>

          <a 
            href="#store" 
            className="btn btn-gradient btn-bracket hero-btn-store"
            onClick={(e) => {
              e.preventDefault();
              const element = document.querySelector('#store');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            [VISIT STORE]
          </a>
        </div>

      </div>
    </section>
  )
}
