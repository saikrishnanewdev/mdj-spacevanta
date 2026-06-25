import { useState } from 'react'

export default function ServicesSection() {
  const [activeTab, setActiveTab] = useState('scanning') // 'scanning' | 'database' | 'ai_evaluation'

  const serviceDetails = {
    scanning: {
      title: 'High-Speed Scanner & Image Processing',
      subtitle: 'Capturing examination sheets with hardware-calibrated precision',
      description: 'Our scanning solution works in lockstep with the hardware store components to preprocess and upload exams instantly. The pipeline is designed to eliminate common errors caused by bad lighting, rotation, or folding.',
      features: [
        {
          title: 'Auto-Skew & Rotation Adjustment',
          desc: 'Corrects pages scanned slightly crookedly up to 45 degrees automatically.'
        },
        {
          title: 'Contrast Enhancement & Binarization',
          desc: 'Boosts handwriting strokes while removing background page shadows for perfect AI legibility.'
        },
        {
          title: 'Secure Cloud Upload Stream',
          desc: 'Direct, segmented streaming to the Supabase "papers" storage bucket with unique transactional tokens.'
        }
      ],
      steps: [
        { num: '01', title: 'ADF Feeder Load', text: 'Stack up to 150 student sheets in the paper tray.' },
        { num: '02', title: 'Sensors Scan', text: 'Double-feed ultrasonic sensors scan pages at 95 PPM.' },
        { num: '03', title: 'Image Cleaning', text: 'Edge detection, cropping, and shadow removal filters apply.' },
        { num: '04', title: 'Bucket Upload', text: 'Sheets are pushed directly to secure cloud storage.' }
      ]
    },
    database: {
      title: 'Real-Time Database Sync & Security',
      subtitle: 'Robust Postgres infrastructure powered by Supabase services',
      description: 'Your school and student catalogs are locked behind production-grade Row Level Security (RLS). We synchronize rosters, exams, and grades dynamically across all interfaces.',
      features: [
        {
          title: 'Bulk CSV User Sync',
          desc: 'Instantly register hundreds of students and administrators with hashed passwords.'
        },
        {
          title: 'Row Level Security (RLS)',
          desc: 'Strict database policies ensure students can only view their own score card while admins manage full rosters.'
        },
        {
          title: 'Cascading Selectors Hook',
          desc: 'RPC metadata fetchers feed the frontend selectors to guarantee zero typos during student sign-in.'
        }
      ],
      steps: [
        { num: '01', title: 'Roster Import', text: 'Admin uploads student roster CSV sheet in the dashboard.' },
        { num: '02', title: 'RPC Execution', text: 'Database handles account creation and cryptographically hashes keys.' },
        { num: '03', title: 'Metadata Build', text: 'School, Class, and Roll Numbers link dynamically.' },
        { num: '04', title: 'Secure Login', text: 'Students select their class and details to authenticate securely.' }
      ]
    },
    ai_evaluation: {
      title: 'Automated Gemini AI Evaluation',
      subtitle: 'Multimodal grading matching answers to key rubrics',
      description: 'Harness the power of Google Gemini. Our evaluation engine reads scanned student handwriting, cross-references it against your configured exam answer keys, and provides objective scores and feedback.',
      features: [
        {
          title: 'Handwritten Script Recognition',
          desc: 'Advanced OCR parses handwritten answers, formulas, and structural layouts.'
        },
        {
          title: 'Contextual Scoring Logic',
          desc: 'Compares responses against configured grading criteria to calculate marks dynamically.'
        },
        {
          title: 'Diagnostic AI Comments',
          desc: 'Generates specific feedback comments highlighting mistakes and recommending corrective learning paths.'
        }
      ],
      steps: [
        { num: '01', title: 'Publish Keys', text: 'Admins upload reference question sheets and answer guidelines.' },
        { num: '02', title: 'Feed Sheets', text: 'Scanned student scripts are queued for multimodal analysis.' },
        { num: '03', title: 'Cognitive Grading', desc: 'Gemini grades pages, extracts student info, and logs details.' },
        { num: '04', title: 'Sync Ledger', text: 'Grades, feedback texts, and score metrics populate in portals.' }
      ]
    }
  }

  const activeData = serviceDetails[activeTab]

  return (
    <section className="services-section" id="services">
      <div className="services-container">
        
        {/* SECTION HEADER */}
        <div className="services-main-header">
          <h2 className="services-section-title">Our Services</h2>
          <p className="services-section-subtitle">
            An integrated software ecosystem providing rapid digitizing, secure database sync, and AI analysis.
          </p>
        </div>

        {/* TAB CARDS SELECTOR */}
        <div className="services-tabs-grid">
          
          {/* TAB 1: SCANNING */}
          <button 
            type="button"
            className={`service-tab-card ${activeTab === 'scanning' ? 'active' : ''}`}
            onClick={() => setActiveTab('scanning')}
          >
            <div className="service-tab-icon">
              <svg viewBox="0 0 24 24" className="tab-svg-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="13" r="8" />
                <path d="M12 5V3" />
                <path d="M10 3h4" />
                <polyline points="12 9 12 13 15 15" />
              </svg>
            </div>
            <div className="service-tab-meta">
              <h3>High-Speed Scanning</h3>
              <p>Calibrated image digitizing</p>
            </div>
            <div className="tab-active-glow" />
          </button>

          {/* TAB 2: DATABASE SYNC */}
          <button 
            type="button"
            className={`service-tab-card ${activeTab === 'database' ? 'active' : ''}`}
            onClick={() => setActiveTab('database')}
          >
            <div className="service-tab-icon">
              <svg viewBox="0 0 24 24" className="tab-svg-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" />
                <ellipse cx="12" cy="15.5" rx="3" ry="1.5" />
                <path d="M9 15.5v3c0 .83 1.34 1.5 3 1.5s3-.67 3-1.5v-3" />
              </svg>
            </div>
            <div className="service-tab-meta">
              <h3>Database Sync</h3>
              <p>Secure Postgres schemas</p>
            </div>
            <div className="tab-active-glow" />
          </button>

          {/* TAB 3: AI EVALUATION */}
          <button 
            type="button"
            className={`service-tab-card ${activeTab === 'ai_evaluation' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai_evaluation')}
          >
            <div className="service-tab-icon">
              <svg viewBox="0 0 24 24" className="tab-svg-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-7.88A2.5 2.5 0 0 1 9.5 2z" />
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-7.88A2.5 2.5 0 0 0 14.5 2z" />
              </svg>
              <div className="g-tab-badge">G</div>
            </div>
            <div className="service-tab-meta">
              <h3>Gemini Evaluation</h3>
              <p>Multimodal AI grading</p>
            </div>
            <div className="tab-active-glow" />
          </button>

        </div>

        {/* ACTIVE DETAIL PANEL */}
        <div className="service-detail-panel" key={activeTab}>
          
          <div className="detail-panel-info">
            <span className="panel-category-tag">SERVICE PROFILE</span>
            <h3 className="detail-panel-title">{activeData.title}</h3>
            <p className="detail-panel-subtitle">{activeData.subtitle}</p>
            <p className="detail-panel-description">{activeData.description}</p>

            {/* FEATURE PILLS */}
            <div className="detail-features-list">
              {activeData.features.map((feature, index) => (
                <div key={index} className="detail-feature-item">
                  <div className="feature-check-bullet">✓</div>
                  <div>
                    <h4 className="detail-feature-title">{feature.title}</h4>
                    <p className="detail-feature-desc">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WORKFLOW ROADMAP */}
          <div className="detail-panel-workflow">
            <h4 className="workflow-title">Workflow Architecture</h4>
            
            <div className="workflow-steps-vertical">
              {activeData.steps.map((step, index) => (
                <div key={index} className="workflow-step-card">
                  <div className="step-number-badge">{step.num}</div>
                  <div className="step-card-text">
                    <h5>{step.title}</h5>
                    <p>{step.text}</p>
                  </div>
                  {index < activeData.steps.length - 1 && (
                    <div className="step-connector-line" />
                  )}
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}
