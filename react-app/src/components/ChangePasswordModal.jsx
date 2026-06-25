import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const overlayRef = useRef(null)

  // Prevent background scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setStatus(null)
        setLoading(false)
      }, 300)
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match.' })
      return
    }
    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'New password must be at least 6 characters.' })
      return
    }

    setLoading(true)
    setStatus(null)
    try {
      // 1. Get the current user email
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) throw new Error('Could not identify authenticated user.')

      // 2. Re-authenticate with the old password to verify it matches
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword
      })

      if (signInErr) throw new Error('Old password is incorrect.')

      // 3. Update to the new password
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateErr) throw updateErr

      setStatus({ type: 'success', message: 'Password updated successfully!' })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // Auto close after success
      setTimeout(() => onClose(), 1500)
    } catch (err) {
      console.error('Error changing password:', err)
      setStatus({ type: 'error', message: err.message || 'Failed to update password.' })
    } finally {
      setLoading(false)
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  if (!isOpen && status === null) return null;

  return (
    <div
      className={`modal-overlay${isOpen ? ' active' : ''}`}
      style={{ zIndex: 2000, display: isOpen ? 'flex' : 'none' }}
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="modal-box" style={{ maxWidth: '500px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="modal-header text-center">
          <h2>Account Settings</h2>
          <p>Update your password</p>
        </div>
        
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="old-password">Old Password</label>
            <input
              type="password"
              id="old-password"
              placeholder="Enter current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-password">New Password</label>
            <input
              type="password"
              id="new-password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm New Password</label>
            <input
              type="password"
              id="confirm-password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {status && (
            <div style={{
              color: status.type === 'error' ? '#ef4444' : '#10b981',
              backgroundColor: status.type === 'error' ? '#fef2f2' : 'rgba(16, 185, 129, 0.08)',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              border: `1px solid ${status.type === 'error' ? '#fee2e2' : 'rgba(16, 185, 129, 0.2)'}`,
              textAlign: 'center'
            }}>
              {status.message}
            </div>
          )}

          <button type="submit" className="btn btn-teal full-width" disabled={loading}>
            {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
          </button>
        </form>
      </div>
    </div>
  )
}
