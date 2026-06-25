import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

export default function LoginPage({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('student') // 'student' | 'admin'
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // School management
  const [schools, setSchools] = useState([])
  const [selectedSchoolId, setSelectedSchoolId] = useState('')

  // Student dropdown cascade lists
  const [classList, setClassList] = useState([])
  const [rollList, setRollList] = useState([])

  // Form fields
  const [rollNumber, setRollNumber] = useState('')
  const [className, setClassName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const overlayRef = useRef(null)

  // Fetch schools on open
  useEffect(() => {
    async function fetchSchools() {
      try {
        const { data, error: schoolsErr } = await supabase
          .from('schools')
          .select('*')
          .order('name', { ascending: true })
        if (schoolsErr) throw schoolsErr
        if (data) {
          setSchools(data)
          if (data.length > 0) {
            setSelectedSchoolId(data[0].id)
          }
        }
      } catch (err) {
        console.error('Error fetching schools:', err)
      }
    }

    if (isOpen) {
      fetchSchools()
    }
  }, [isOpen])

  // Fetch classes when school changes
  useEffect(() => {
    async function fetchClasses() {
      if (!selectedSchoolId || activeTab !== 'student') return
      try {
        const { data, error: err } = await supabase.rpc('get_school_classes', { p_school_id: selectedSchoolId })
        if (err) throw err
        if (data) {
          const classes = data.map(c => c.class_name)
          setClassList(classes)
          if (classes.length > 0) {
            setClassName(classes[0])
          } else {
            setClassName('')
            setClassList([])
            setRollList([])
            setRollNumber('')
          }
        }
      } catch (err) {
        console.error('Error fetching classes:', err)
      }
    }
    fetchClasses()
  }, [selectedSchoolId, activeTab])

  // Fetch roll numbers when class changes
  useEffect(() => {
    async function fetchRollNumbers() {
      if (!selectedSchoolId || !className || activeTab !== 'student') return
      try {
        const { data, error: err } = await supabase.rpc('get_class_roll_numbers', {
          p_school_id: selectedSchoolId,
          p_class_name: className
        })
        if (err) throw err
        if (data) {
          const rolls = data.map(r => r.roll_number)
          setRollList(rolls)
          if (rolls.length > 0) {
            setRollNumber(rolls[0])
          } else {
            setRollNumber('')
          }
        }
      } catch (err) {
        console.error('Error fetching roll numbers:', err)
      }
    }
    fetchRollNumbers()
  }, [selectedSchoolId, className, activeTab])

  // Prevent background scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Reset state after close animation
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setSubmitted(false)
        setActiveTab('student')
        setSchools([])
        setSelectedSchoolId('')
        setClassList([])
        setRollList([])
        setRollNumber('')
        setClassName('')
        setUsername('')
        setPassword('')
        setError(null)
        setLoading(false)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const schoolId = selectedSchoolId

    if (!schoolId) {
      setError('Please select a school. If no schools are available, please seed them in the database.')
      setLoading(false)
      return
    }

    try {
      // Sign In Flow
      let email = ''
      if (activeTab === 'student') {
        if (!rollNumber.trim()) throw new Error('Roll Number is required. Please ensure student records exist.')
        if (!className.trim()) throw new Error('Class Name is required. Please ensure student records exist.')
        email = `student_${schoolId}_${rollNumber.trim().toLowerCase()}@spacevanta.local`
      } else {
        if (!username.trim()) throw new Error('Username is required.')
        email = `admin_${schoolId}_${username.trim().toLowerCase()}@spacevanta.local`
      }

      const { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInErr) throw signInErr

      // Post-authentication authorization check for student class
      if (activeTab === 'student') {
        const { data: stud, error: studErr } = await supabase
          .from('students')
          .select('class_name')
          .eq('id', authData.user.id)
          .single()

        if (studErr || !stud) {
          await supabase.auth.signOut()
          throw new Error('Failed to verify student record details. Access denied.')
        }

        if (stud.class_name.trim().toLowerCase() !== className.trim().toLowerCase()) {
          await supabase.auth.signOut()
          throw new Error('Invalid Class Name for this Roll Number.')
        }
      }

      setSubmitted(true)
      setTimeout(() => onClose(), 1500)
    } catch (err) {
      console.error('Authentication error:', err)
      setError(err.message || 'Authentication failed. Please check details and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      className={`modal-overlay${isOpen ? ' active' : ''}`}
      id="login-modal"
      ref={overlayRef}
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-label="Login Portal"
    >
      <div className="modal-box">
        <button className="modal-close" id="btn-close-login" aria-label="Close modal" onClick={onClose}>
          &times;
        </button>

        {!submitted ? (
          <>
            <div className="modal-header text-center">
              <h2>Login Portal</h2>
              <p>Sign in as a student or administrator to manage your space.</p>
            </div>

            {/* Role selection tabs: Student vs Admin */}
            <div className="login-tabs-container">
              <button
                type="button"
                className={`login-tab-btn ${activeTab === 'student' ? 'active' : ''}`}
                onClick={() => { setActiveTab('student'); setError(null); }}
              >
                Student
              </button>
              <button
                type="button"
                className={`login-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => { setActiveTab('admin'); setError(null); }}
              >
                Admin
              </button>
            </div>

            <form className="modal-form" id="auth-form" onSubmit={handleSubmit}>
              {/* School Selector */}
              <div className="form-group">
                <label htmlFor="school-select">School Name</label>
                <select
                  id="school-select"
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.375rem',
                    color: '#f8fafc',
                    outline: 'none'
                  }}
                  required
                >
                  {schools.length === 0 ? (
                    <option value="">-- No schools found --</option>
                  ) : (
                    schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Student specific fields (Select Dropdowns) */}
              {activeTab === 'student' && (
                <>
                  <div className="form-group">
                    <label htmlFor="student-class-select">Class Name</label>
                    <select
                      id="student-class-select"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '0.375rem',
                        color: '#f8fafc',
                        outline: 'none'
                      }}
                      required
                    >
                      {classList.length === 0 ? (
                        <option value="">-- No classes found --</option>
                      ) : (
                        classList.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="student-roll-select">Roll Number</label>
                    <select
                      id="student-roll-select"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '0.375rem',
                        color: '#f8fafc',
                        outline: 'none'
                      }}
                      required
                    >
                      {rollList.length === 0 ? (
                        <option value="">-- No roll numbers found --</option>
                      ) : (
                        rollList.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </>
              )}

              {/* Admin specific fields */}
              {activeTab === 'admin' && (
                <div className="form-group">
                  <label htmlFor="admin-user">Username</label>
                  <input
                    type="text"
                    id="admin-user"
                    placeholder="Enter admin username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Password field */}
              <div className="form-group">
                <label htmlFor="auth-password">Password</label>
                <input
                  type="password"
                  id="auth-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem', marginBottom: '1rem', border: '1px solid #fee2e2', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-teal full-width" disabled={loading}>
                {loading ? 'PROCESSING...' : 'SIGN IN'}
              </button>
            </form>
          </>
        ) : (
          <div className="form-success-msg" id="login-success">
            <div className="success-icon">&#10004;</div>
            <h3>Logged In Successfully!</h3>
            <p>Welcome back! Redirecting you to your MDJ SpaceVanta dashboard...</p>
          </div>
        )}
      </div>
    </div>
  )
}
