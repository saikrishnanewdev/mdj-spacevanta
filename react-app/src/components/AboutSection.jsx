export default function AboutSection() {
  return (
    <section className="about-section" id="about">
      <div className="about-container">
        
        {/* SECTION HEADER */}
        <div className="about-header">
          <span className="about-tag">PROJECT MISSION</span>
          <h2 className="about-title">About The Project</h2>
          <p className="about-subtitle">
            Bridging the gap between physical exams and digital grading via high-speed hardware and advanced Gemini AI.
          </p>
        </div>

        {/* CONTENT GRID */}
        <div className="about-grid">
          
          {/* Left Column: Vision & Narrative */}
          <div className="about-vision-box">
            <h3 className="vision-heading">The MDJ SpaceVanta Vision</h3>
            <p className="vision-paragraph">
              Traditional examination workflows in schools are bottlenecked by manual grading, subjective grading variances, and tedious transcription of scores into school systems. 
              <strong> MDJ SpaceVanta</strong> solves this by integrating physical hardware with advanced AI services.
            </p>
            <p className="vision-paragraph">
              School administrators load stack bundles of physical student answer sheets into a calibrated, high-speed scanner printer. 
              The scanner feeds pages dynamically and uploads clean document images to a secure cloud storage bucket.
            </p>
            <p className="vision-paragraph">
              Once uploaded, our grading engine invokes Google Gemini's multimodal LLM. The AI reads handwritten cursives, compares answers to configured rubrics, assigns scores, and logs detailed diagnostic comments. 
              Students and teachers can access their respective portals instantly, seeing their scores and annotated sheet files without a single manual keyboard entry.
            </p>
          </div>

          {/* Right Column: Statistics Grid */}
          <div className="about-stats-grid">
            
            <div className="about-stat-card">
              <div className="stat-card-glow" />
              <h4 className="about-stat-number">99%</h4>
              <h5 className="about-stat-title">Grading Accuracy</h5>
              <p className="about-stat-desc">
                Multimodal AI reads cursive handwriting, marks, and drawings with high-fidelity precision.
              </p>
            </div>

            <div className="about-stat-card">
              <div className="stat-card-glow" />
              <h4 className="about-stat-number">&lt;2s</h4>
              <h5 className="about-stat-title">Evaluation Speed</h5>
              <p className="about-stat-desc">
                Each multi-page exam sheet is fully graded, annotated, and synchronized in less than two seconds.
              </p>
            </div>

            <div className="about-stat-card">
              <div className="stat-card-glow" />
              <h4 className="about-stat-number">100%</h4>
              <h5 className="about-stat-title">Secure & Transparent</h5>
              <p className="about-stat-desc">
                Supabase Row-Level Security (RLS) protects scores, letting students view only their own records.
              </p>
            </div>

            <div className="about-stat-card">
              <div className="about-stat-card-accent" />
              <h4 className="about-stat-number">Zero</h4>
              <h5 className="about-stat-title">Transcription Errors</h5>
              <p className="about-stat-desc">
                Scores go directly from the AI grading engine to the database ledger, preventing manual entry mistakes.
              </p>
            </div>

          </div>

        </div>

        {/* TEAM SECTION */}
        <div style={{ marginTop: '5rem' }}>
          <h3 className="vision-heading" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>Meet The Team</h3>
          <div className="about-team-grid">
            
            <div className="team-card">
              <img src="/prasad.jpg" alt="N.B.L.V. Prasad" className="team-image" />
              <h4 className="team-name">N.B.L.V. Prasad (Ph.D.)</h4>
              <span className="team-role">Founder</span>
              <p className="team-desc">
                Technical Expert in Artificial Intelligence, Robotics, Internet of Things (IoT), Drone Systems, Computer Vision, Embedded Systems, and 3D Printing Technologies.
              </p>
              <p className="team-desc" style={{ marginTop: '0.8rem' }}>
                Committed to designing intelligent automation solutions that improve efficiency, accuracy, and productivity across education and industry.
              </p>
            </div>

            <div className="team-card">
              <img src="/sai_krishna.jpg" alt="Sai Krishna" className="team-image" />
              <h4 className="team-name">Sai Krishna</h4>
              <span className="team-role">B.Tech, Technical Engineer</span>
              <p className="team-desc">
                Expert in Python Development, GIS Mapping, Web Development, Data Visualization, and Automation Solutions.
              </p>
              <p className="team-desc" style={{ marginTop: '0.8rem' }}>
                Passionate about building scalable software applications and location-based intelligent systems.
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
