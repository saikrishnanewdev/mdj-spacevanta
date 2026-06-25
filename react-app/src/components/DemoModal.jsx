import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

export default function DemoModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', schoolName: '', mobileNumber: '' })
  const overlayRef = useRef(null)

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
        setLoading(false)
        setError(null)
        setForm({ name: '', email: '', schoolName: '', mobileNumber: '' })
      }, 300)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('demo_requests')
        .insert({
          full_name: form.name,
          email: form.email,
          school_name: form.schoolName,
          mobile_number: form.mobileNumber,
          status: 'pending'
        })

      if (insertError) throw insertError

      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting demo request:', err)
      setError(err.message || 'Failed to submit demo request. Please check your connection and configuration.')
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
      id="demo-modal"
      ref={overlayRef}
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-label="Request a Demo"
    >
      <div className="modal-box">
        <button className="modal-close" id="btn-close-modal" aria-label="Close modal" onClick={onClose}>
          &times;
        </button>

        {!submitted ? (
          <>
            <div className="modal-header">
              <h2>Request a Demo</h2>
              <p>Experience the MDJ SpaceVanta scanner system in action.</p>
            </div>

            <form className="modal-form" id="demo-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="form-name">Full Name</label>
                <input
                  type="text"
                  id="form-name"
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="form-email">Email Address</label>
                <input
                  type="email"
                  id="form-email"
                  name="email"
                  placeholder="john@company.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="form-school">School Name</label>
                <input
                  type="text"
                  id="form-school"
                  name="schoolName"
                  placeholder="SpaceVanta High"
                  value={form.schoolName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="form-mobile">Mobile Number</label>
                <input
                  type="text"
                  id="form-mobile"
                  name="mobileNumber"
                  placeholder="+1 (555) 000-0000"
                  value={form.mobileNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              {error && (
                <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem', marginBottom: '1rem', border: '1px solid #fee2e2', textAlign: 'center' }}>
                  {error}
                </div>
              )}
              <button type="submit" className="btn btn-teal full-width" disabled={loading}>
                {loading ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
              </button>
            </form>
          </>
        ) : (
          <div className="form-success-msg" id="form-success">
            <div className="success-icon">&#10004;</div>
            <h3>Request Submitted!</h3>
            <p>Our team will contact you within 24 hours to schedule your demo.</p>
          </div>
        )}
      </div>
    </div>
  )
}
