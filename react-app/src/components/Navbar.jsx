import { useState, useEffect } from 'react'

export default function Navbar({ onOpenLogin, profile, onLogout, onChangePasswordClick }) {
  const [activeSection, setActiveSection] = useState('home')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Scroll spy — highlight active nav link based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200
      const sections = document.querySelectorAll('section[id]')
      let current = 'home'
      sections.forEach(section => {
        if (
          scrollPosition >= section.offsetTop &&
          scrollPosition < section.offsetTop + section.offsetHeight
        ) {
          current = section.id
        }
      })
      setActiveSection(current)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (e, href, id) => {
    setMobileMenuOpen(false)
    if (id === 'nav-login') {
      e.preventDefault()
      onOpenLogin()
      return
    }
    if (id === 'nav-logout') {
      e.preventDefault()
      onLogout()
      return
    }
    if (href.startsWith('#')) {
      e.preventDefault()
      setActiveSection(href.slice(1))
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  let navItems = []
  if (!profile) {
    navItems = [
      { label: 'Home',         href: '#home',     id: 'nav-home'     },
      { label: 'Our Services', href: '#services', id: 'nav-services' },
      { label: 'Store',        href: '#store',    id: 'nav-store'    },
      { label: 'About',        href: '#about',    id: 'nav-about'    },
      { label: 'Login',        href: '#login',    id: 'nav-login', extra: 'nav-login' }
    ]
  }

  return (
    <header className="navbar" id="main-header">
      <div className="navbar-container">

        {/* Logo */}
        <a 
          href="#home" 
          className="logo-link" 
          id="logo-anchor"
          onClick={(e) => {
            e.preventDefault()
            if (profile) {
              onLogout()
            }
            const element = document.querySelector('#home')
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' })
            }
          }}
        >
          <div className="logo-icon-box">
            <svg viewBox="0 0 100 100" className="logo-svg-box" xmlns="http://www.w3.org/2000/svg">
              <ellipse
                cx="50" cy="50"
                rx="38" ry="22"
                fill="none"
                stroke="#008891"
                strokeWidth="4"
                strokeDasharray="18 7"
                strokeLinecap="round"
                className="logo-orbit"
              />
              <polygon points="83,34 90,30 88,40" fill="#008891" />
              <text
                x="50" y="56"
                fontFamily="'Outfit', sans-serif"
                fontWeight="800"
                fontSize="28"
                fill="#0f172a"
                textAnchor="middle"
                dominantBaseline="middle"
              >SV</text>
            </svg>
          </div>
          <span className="logo-text">MDJ SpaceVanta</span>
        </a>

        {/* Mobile Toggle Button */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
        </button>

        {/* Navigation links */}
        <nav className={`nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`} id="navigation-menu">
          {navItems.map(({ label, href, id, extra }) => (
            <a
              key={id}
              href={href}
              id={id}
              className={[
                'nav-link',
                extra ?? '',
                activeSection === href.slice(1) ? 'active' : '',
              ].filter(Boolean).join(' ')}
              onClick={(e) => handleNavClick(e, href, id)}
            >
              {label}
            </a>
          ))}

          {profile && (
            <div className="profile-dropdown-container" style={{ position: 'relative' }}>
              <button 
                className="nav-link nav-login" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ 
                  cursor: 'pointer', border: 'none', background: 'transparent',
                  display: 'flex', alignItems: 'center', gap: '0.25rem' 
                }}
              >
                {profile.full_name || profile.role} 
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              
              {dropdownOpen && (
                <div className="profile-dropdown-menu" style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: '0.5rem',
                  backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.5rem',
                  padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem',
                  minWidth: '180px', zIndex: 100, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}>
                  <button 
                    onClick={() => { setDropdownOpen(false); onChangePasswordClick(); }} 
                    style={{ 
                      textAlign: 'left', padding: '0.65rem 1rem', background: 'transparent', 
                      border: 'none', color: '#f8fafc', cursor: 'pointer', borderRadius: '0.25rem',
                      fontSize: '0.9rem', fontWeight: '500', transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    Change Password
                  </button>
                  <button 
                    onClick={(e) => { setDropdownOpen(false); handleNavClick(e, '#logout', 'nav-logout'); }} 
                    style={{ 
                      textAlign: 'left', padding: '0.65rem 1rem', background: 'transparent', 
                      border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '0.25rem',
                      fontSize: '0.9rem', fontWeight: '500', transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

      </div>
    </header>
  )
}
