import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'

import ServicesSection from './components/ServicesSection'
import StoreSection from './components/StoreSection'
import AboutSection from './components/AboutSection'
import DemoModal from './components/DemoModal'
import LoginPage from './components/LoginPage'
import ChangePasswordModal from './components/ChangePasswordModal'
import { supabase } from './supabaseClient'
import ReactMarkdown from 'react-markdown'
import { PDFDocument } from 'pdf-lib'

export default function App() {
  const [modalOpen, setModalOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [showChangePassword, setShowChangePassword] = useState(false)

  // CSV importer states
  const [importType, setImportType] = useState('student') // 'student' | 'admin'
  const [csvData, setCsvData] = useState([])
  const [csvError, setCsvError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importLogs, setImportLogs] = useState([])

  // Student Exams Dashboard states
  const [studentExams, setStudentExams] = useState([])

  // Admin AI Evaluator states
  const [adminExams, setAdminExams] = useState([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [examClassName, setExamClassName] = useState('')
  const [questionPaperFile, setQuestionPaperFile] = useState(null)
  const [answerKeyFile, setAnswerKeyFile] = useState(null)
  const [scannedSheets, setScannedSheets] = useState([])
  const [evaluating, setEvaluating] = useState(false)
  const [evaluationLogs, setEvaluationLogs] = useState([])
  const [gradesList, setGradesList] = useState([])
  const [adminDashboardTab, setAdminDashboardTab] = useState('csv-import') // 'csv-import' | 'create-exam' | 'evaluate' | 'grades'

  // Loading/Error states for forms
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [actionSuccess, setActionSuccess] = useState(null)
  const [feedbackModal, setFeedbackModal] = useState(null)

  const fetchProfile = async (userId) => {
    try {
      // Fetch base profile with school details
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*, schools(name)')
        .eq('id', userId)
        .single()

      if (profErr) throw profErr

      // Auto-correct old placeholder names
      if (prof.full_name === 'System Manual User') {
        const { error: updErr } = await supabase
          .from('profiles')
          .update({ full_name: 'Principal' })
          .eq('id', userId)
        if (!updErr) {
          prof.full_name = 'Principal'
        }
      }

      let roleDetails = {}
      if (prof.role === 'student') {
        const { data: stud, error: studErr } = await supabase
          .from('students')
          .select('*')
          .eq('id', userId)
          .single()
        if (!studErr) roleDetails = stud

        // Fetch Student Exam Results
        await fetchStudentExams(userId)
      } else if (prof.role === 'admin') {
        const { data: adm, error: admErr } = await supabase
          .from('admins')
          .select('*')
          .eq('id', userId)
          .single()
        if (!admErr) roleDetails = adm

        // Fetch Admin Exam and Grades lists
        await fetchAdminExams(prof.school_id)
        await fetchAllGrades(prof.school_id)
      }

      setProfile({ ...prof, ...roleDetails })
    } catch (err) {
      console.error('Error fetching full profile details:', err)
    }
  }

  // Fetch Student Results
  const fetchStudentExams = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('student_exams')
        .select(`
          id, score, scanned_paper_url, ai_feedback, status, created_at,
          exams ( id, subject_name, class_name, question_paper_url, answer_key_url )
        `)
        .eq('student_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setStudentExams(data)
    } catch (err) {
      console.error('Error fetching student exam results:', err)
    }
  }

  // Fetch Admin Exams
  const fetchAdminExams = async (schoolId) => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setAdminExams(data)
        if (data.length > 0) {
          setSelectedExamId(data[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching admin exams:', err)
    }
  }

  // Fetch All Grades for Admin School
  const fetchAllGrades = async (schoolId) => {
    try {
      const { data, error } = await supabase
        .from('student_exams')
        .select(`
          id, score, scanned_paper_url, ai_feedback, status, created_at,
          student:profiles ( full_name, school_id ),
          exams ( id, subject_name, class_name, school_id )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        // Filter grades locally to match admin school
        const filteredGrades = data.filter(g => g.exams?.school_id === schoolId)
        setGradesList(filteredGrades)
      }
    } catch (err) {
      console.error('Error fetching grades dashboard:', err)
    }
  }

  // Listen for authentication state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setStudentExams([])
        setAdminExams([])
        setGradesList([])
      }
    })

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setProfile(null)
      setCsvData([])
      setCsvError(null)
      setImportLogs([])
      setStudentExams([])
      setAdminExams([])
      setGradesList([])
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  // CSV Importer Logic
  const parseCSVRow = (line) => {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.replace(/^["']|["']$/g, ''))
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.replace(/^["']|["']$/g, ''))
    return result
  }

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
    if (lines.length === 0) return { error: 'CSV file is empty.' }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''))
    
    const requiredHeaders = importType === 'student'
      ? ['full_name', 'roll_number', 'class_name', 'password']
      : ['full_name', 'username', 'password']
    
    const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh))
    if (missingHeaders.length > 0) {
      return { error: `Missing required CSV headers: ${missingHeaders.join(', ')}` }
    }

    const recordsList = []
    const fullNameIdx = headers.indexOf('full_name')
    const rollNumberIdx = headers.indexOf('roll_number')
    const classNameIdx = headers.indexOf('class_name')
    const usernameIdx = headers.indexOf('username')
    const passwordIdx = headers.indexOf('password')

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i])
      if (row.length < requiredHeaders.length) continue

      const full_name = row[fullNameIdx]?.trim()
      const password = row[passwordIdx]?.trim()

      if (importType === 'student') {
        const roll_number = row[rollNumberIdx]?.trim()
        const class_name = row[classNameIdx]?.trim()
        if (full_name && roll_number && class_name && password) {
          recordsList.push({ full_name, roll_number, class_name, password })
        }
      } else {
        const username = row[usernameIdx]?.trim()
        if (full_name && username && password) {
          recordsList.push({ full_name, username, password })
        }
      }
    }

    return { records: recordsList }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setCsvError(null)
    setCsvData([])
    setImportLogs([])

    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      const result = parseCSV(text)
      if (result.error) {
        setCsvError(result.error)
      } else {
        setCsvData(result.records)
      }
    }
    reader.onerror = () => {
      setCsvError('Failed to read CSV file.')
    }
    reader.readAsText(file)
  }

  const handleImportRecords = async () => {
    if (csvData.length === 0 || !profile?.school_id) return

    setImporting(true)
    const logs = csvData.map(r => ({
      full_name: r.full_name,
      identifier: importType === 'student' ? r.roll_number : r.username,
      status: 'pending',
      error: null
    }))
    setImportLogs(logs)

    for (let i = 0; i < csvData.length; i++) {
      const record = csvData[i]
      setImportLogs(prev => prev.map((log, idx) => idx === i ? { ...log, status: 'processing' } : log))

      try {
        if (importType === 'student') {
          const { error: rpcErr } = await supabase.rpc('create_student_user', {
            p_school_id: profile.school_id,
            p_roll_number: record.roll_number,
            p_class_name: record.class_name,
            p_full_name: record.full_name,
            p_password: record.password
          })
          if (rpcErr) throw rpcErr
        } else {
          const { error: rpcErr } = await supabase.rpc('create_admin_user', {
            p_school_id: profile.school_id,
            p_username: record.username,
            p_full_name: record.full_name,
            p_password: record.password
          })
          if (rpcErr) throw rpcErr
        }

        setImportLogs(prev => prev.map((log, idx) => idx === i ? { ...log, status: 'success' } : log))
      } catch (err) {
        console.error(`Error importing ${importType} ${record.full_name}:`, err)
        setImportLogs(prev => prev.map((log, idx) => idx === i ? { ...log, status: 'error', error: err.message || 'Database error occurred.' } : log))
      }
    }

    setImporting(false)
  }

  // File Upload Helper to Supabase Storage Bucket 'papers'
  const uploadFileToStorage = async (file, folderPath) => {
    const fileExt = file.name.split('.').pop()
    const uniqueName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const fullPath = `${folderPath}/${uniqueName}`

    const { error: uploadErr } = await supabase.storage
      .from('papers')
      .upload(fullPath, file)

    if (uploadErr) throw uploadErr

    const { data } = supabase.storage
      .from('papers')
      .getPublicUrl(fullPath)

    return data.publicUrl
  }

  // Helper to fetch public Supabase storage files as local File objects for Gradio
  const fetchFileFromUrl = async (url, defaultName) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch file from storage URL: ${url}`)
    const blob = await res.blob()
    const filename = url.split('/').pop() || defaultName
    return new File([blob], filename, { type: blob.type })
  }

  // Create New Exam Handler
  const handleCreateExam = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    setActionError(null)
    setActionSuccess(null)

    try {
      let qpUrl = ''
      let akUrl = ''

      if (questionPaperFile) {
        qpUrl = await uploadFileToStorage(questionPaperFile, 'question_papers')
      }
      if (answerKeyFile) {
        akUrl = await uploadFileToStorage(answerKeyFile, 'answer_keys')
      }

      const { data, error: insErr } = await supabase
        .from('exams')
        .insert({
          school_id: profile.school_id,
          subject_name: subjectName.trim(),
          class_name: examClassName.trim(),
          question_paper_url: qpUrl,
          answer_key_url: akUrl
        })
        .select()
        .single()

      if (insErr) throw insErr

      setAdminExams(prev => [data, ...prev])
      if (!selectedExamId) {
        setSelectedExamId(data.id)
      }

      setSubjectName('')
      setExamClassName('')
      setQuestionPaperFile(null)
      setAnswerKeyFile(null)
      setActionSuccess('Exam configuration published successfully!')
    } catch (err) {
      console.error('Error creating exam:', err)
      setActionError(err.message || 'Failed to configure exam. Ensure database storage policies are set.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Answer Sheet Selection
  const handleScannedPapersChange = (e) => {
    const files = Array.from(e.target.files)
    setScannedSheets(files)
    setEvaluationLogs([])
  }

  // Trigger AI Evaluation API Call
  const handleAiEvaluation = async () => {
    if (scannedSheets.length === 0 || !selectedExamId || !profile?.school_id) return

    const selectedExam = adminExams.find(ex => ex.id === selectedExamId)
    if (!selectedExam) return

    setEvaluating(true)
    const logs = scannedSheets.map(file => ({
      fileName: file.name,
      status: 'pending',
      score: null,
      error: null
    }))
    setEvaluationLogs(logs)

    // Regex score parser helper
    const parseScoreFromResult = (text) => {
      // Find Percentage explicitly first (e.g. Percentage: 90%)
      let match = text.match(/Percentage:\s*(\d+)/i)
      if (match) {
        const val = parseInt(match[1], 10)
        if (!isNaN(val) && val >= 0 && val <= 100) return val
      }

      // Find Grand Total explicitly (e.g. Grand Total: 72/80)
      match = text.match(/Grand Total:\s*(\d+)\s*\/\s*(\d+)/i)
      if (match) {
        const num = parseInt(match[1], 10)
        const den = parseInt(match[2], 10)
        if (!isNaN(num) && !isNaN(den) && den > 0) {
          return Math.round((num / den) * 100)
        }
      }

      // Fallback regexes for general formats
      const scoreRegexes = [
        /(?:Final\s*)?(?:score|marks|grade|result)[:\s-]*(\d+)\s*\/\s*100/i,
        /(\d+)\s*\/\s*100/i,
        /(?:Final\s*)?(?:score|marks|grade|result)[:\s-]*(\d+)/i
      ]
      
      for (const regex of scoreRegexes) {
        match = text.match(regex)
        if (match) {
          const val = parseInt(match[1], 10)
          if (!isNaN(val) && val >= 0 && val <= 100) {
            return val
          }
        }
      }
      return null
    }

    for (let i = 0; i < scannedSheets.length; i++) {
      const file = scannedSheets[i]

      // Set log to processing
      setEvaluationLogs(prev => prev.map((l, idx) => idx === i ? { ...l, status: 'processing' } : l))

      try {
        // 1. Upload ORIGINAL scanned sheet to Supabase Storage
        const scannedUrl = await uploadFileToStorage(file, 'student_papers')

        // Parse student roll number from filename
        const cleanedName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
        const alphanumericMatch = cleanedName.match(/\b[a-zA-Z0-9]*\d[a-zA-Z0-9]*\b/)
        let roll = alphanumericMatch ? alphanumericMatch[0] : (1001 + i).toString()

        let evalResult = null

        // EVALUATE ANSWERS via Supabase Edge Function
        setEvaluationLogs(prev => prev.map((l, idx) => idx === i ? { ...l, status: 'processing', error: null } : l))

        // Invoke the Edge Function using standard fetch to bypass Supabase's generic 400 error swallowing
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token || ''

        const edgeRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-exam`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            q_url: selectedExam.question_paper_url,
            m_url: selectedExam.answer_key_url,
            s_url: scannedUrl,
            level: "Moderate"
          })
        })

        const edgeResult = await edgeRes.json()

        if (!edgeRes.ok) {
           throw new Error(edgeResult.error || "Edge function failed with status " + edgeRes.status)
        }
        
        if (edgeResult.error) {
           throw new Error(edgeResult.error)
        }

        const predictResult = edgeResult

        if (!predictResult || !predictResult.data) {
          throw new Error("Invalid output received from the AI evaluation space.")
        }

        const [teacherOcr, studentOcr, evaluationResult] = predictResult.data

        // Extract score
        let score = parseScoreFromResult(evaluationResult)
        if (score === null) {
          console.warn("Could not parse score from AI evaluation text. Defaulting to 80.")
          score = 80
        }

        // Format details into feedback
        const feedback = `=== AI EVALUATION REPORT ===\n${evaluationResult}\n\n=== EXTRACTED TEACHER KEY OCR ===\n${teacherOcr || 'N/A'}\n\n=== EXTRACTED STUDENT SHEET OCR ===\n${studentOcr || 'N/A'}`

        evalResult = {
          roll_number: roll,
          score: score,
          feedback: feedback
        }

        // 3. Resolve student profile matching roll number in the same school
        const { data: studentRecord, error: studErr } = await supabase
          .from('students')
          .select('id, profiles(full_name)')
          .eq('school_id', profile.school_id)
          .eq('roll_number', evalResult.roll_number.trim())
          .single()

        if (studErr || !studentRecord) {
          throw new Error(`Student Roll Number ${evalResult.roll_number} does not match any registered students in this school.`)
        }

        // 4. Save graded record to public.student_exams
        const { error: insErr } = await supabase
          .from('student_exams')
          .insert({
            student_id: studentRecord.id,
            exam_id: selectedExamId,
            scanned_paper_url: scannedUrl,
            score: evalResult.score,
            ai_feedback: evalResult.feedback || 'Evaluation completed successfully.',
            status: 'evaluated'
          })

        if (insErr) throw insErr

        // Update log to success
        setEvaluationLogs(prev => prev.map((l, idx) => idx === i ? { ...l, status: 'success', score: evalResult.score } : l))
      } catch (err) {
        console.error(`AI Evaluation error on sheet ${file.name}:`, err)
        setEvaluationLogs(prev => prev.map((l, idx) => idx === i ? { ...l, status: 'error', error: err.message || 'AI engine timeout.' } : l))
      }
    }

    setEvaluating(false)
    // Reload grades list
    await fetchAllGrades(profile.school_id)
  }

  return (
    <>
      <Navbar
        onOpenLogin={() => setLoginOpen(true)}
        profile={profile}
        onLogout={handleLogout}
        onChangePasswordClick={() => setShowChangePassword(true)}
      />
      <main className="main-layout">
        {/* Replace landing page with portals when authenticated */}
        {!profile ? (
          <>
            <HeroSection onOpenModal={() => setModalOpen(true)} />

            <ServicesSection />
            <StoreSection onOpenModal={() => setModalOpen(true)} />
            <AboutSection />
          </>
        ) : (
          profile.role === 'admin' ? (
            <section className="admin-dashboard" id="dashboard">
              {/* ADMIN DASHBOARD HEADER */}
              <div className="dash-user-header">
                <div className="dash-user-info">
                  <div className="dash-avatar">
                    {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="dash-welcome-text">
                    <h2>Welcome back, {profile.full_name || 'Administrator'}!</h2>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--dash-text-muted)' }}>
                      Manage academic metadata, sync batch student logs, and deploy AI grading.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.50rem' }}>
                  <span className="dash-role-badge">Admin Mode</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--dash-text-muted)' }}>
                    School: <strong style={{ color: 'var(--dash-text)' }}>{profile.schools?.name || 'N/A'}</strong>
                  </span>
                </div>
              </div>

              {/* STATS SUMMARY GRID */}
              <div className="dashboard-stats-grid">
                <div className="stat-card">
                  <div>
                    <span className="stat-label">Configured Exams</span>
                    <h4 className="stat-value">{adminExams.length}</h4>
                  </div>
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                </div>
                <div className="stat-card">
                  <div>
                    <span className="stat-label">Graded Papers</span>
                    <h4 className="stat-value">{gradesList.length}</h4>
                  </div>
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                </div>
                <div className="stat-card">
                  <div>
                    <span className="stat-label">Average Score</span>
                    <h4 className="stat-value">
                      {gradesList.length > 0 
                        ? `${Math.round(gradesList.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / gradesList.length)}%` 
                        : 'N/A'}
                    </h4>
                  </div>
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  </div>
                </div>
              </div>

              {/* ADMIN SUB-TABS NAVIGATION */}
              <div className="dashboard-tab-bar">
                <button
                  onClick={() => { setAdminDashboardTab('csv-import'); setActionError(null); }}
                  className={`dashboard-tab-btn ${adminDashboardTab === 'csv-import' ? 'active' : ''}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                  CSV Users Import
                </button>
                <button
                  onClick={() => { setAdminDashboardTab('create-exam'); setActionError(null); }}
                  className={`dashboard-tab-btn ${adminDashboardTab === 'create-exam' ? 'active' : ''}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  Configure Exams
                </button>
                <button
                  onClick={() => { setAdminDashboardTab('evaluate'); setActionError(null); }}
                  className={`dashboard-tab-btn ${adminDashboardTab === 'evaluate' ? 'active' : ''}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  AI Exam Evaluator
                </button>
                <button
                  onClick={() => { setAdminDashboardTab('grades'); setActionError(null); }}
                  className={`dashboard-tab-btn ${adminDashboardTab === 'grades' ? 'active' : ''}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
                  Grades Dashboard
                </button>
              </div>

              {/* 1. CSV ACCOUNT IMPORT PANEL */}
              {adminDashboardTab === 'csv-import' && (
                <div className="dashboard-panel">
                  <h3 className="panel-title">CSV Account Import Portal</h3>
                  <p className="panel-subtitle">Register student or administrator logins in bulk.</p>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--dash-border)', paddingBottom: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => { setImportType('student'); setCsvData([]); }}
                      style={{ background: 'none', border: 'none', color: importType === 'student' ? 'var(--dash-accent)' : 'var(--dash-text-muted)', fontWeight: '700', cursor: 'pointer', borderBottom: importType === 'student' ? '2px solid var(--dash-accent)' : 'none', paddingBottom: '0.5rem', fontSize: '0.95rem' }}
                      disabled={importing}
                    >
                      Import Students
                    </button>
                    <button
                      type="button"
                      onClick={() => { setImportType('admin'); setCsvData([]); }}
                      style={{ background: 'none', border: 'none', color: importType === 'admin' ? 'var(--dash-accent)' : 'var(--dash-text-muted)', fontWeight: '700', cursor: 'pointer', borderBottom: importType === 'admin' ? '2px solid var(--dash-accent)' : 'none', paddingBottom: '0.5rem', fontSize: '0.95rem' }}
                      disabled={importing}
                    >
                      Import Admins
                    </button>
                  </div>

                  <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Required CSV columns structure:
                    <code style={{ display: 'block', backgroundColor: '#090d16', padding: '0.65rem 1rem', borderRadius: '0.5rem', marginTop: '0.5rem', fontFamily: 'monospace', color: 'var(--dash-accent)', border: '1px solid var(--dash-border)' }}>
                      {importType === 'student' ? 'full_name, roll_number, class_name, password' : 'full_name, username, password'}
                    </code>
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* CUSTOM INTERACTIVE FILE ZONE */}
                    <div className="file-upload-zone">
                      <div className="upload-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      </div>
                      <p className="upload-zone-text">Click to choose or drop your CSV sheet</p>
                      <p className="upload-zone-sub">Supports only standard .csv files</p>
                      <input type="file" accept=".csv" onChange={handleFileChange} disabled={importing} />
                      {csvData.length > 0 && (
                        <span className="file-selected-pill">✓ CSV Selected: {csvData.length} records loaded</span>
                      )}
                    </div>

                    {csvError && (
                      <div style={{ color: 'var(--dash-error)', fontSize: '0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
                        Error: {csvError}
                      </div>
                    )}

                    {csvData.length > 0 && !importing && importLogs.length === 0 && (
                      <div className="table-wrapper">
                        <table className="premium-table">
                          <thead>
                            <tr>
                              <th>Full Name</th>
                              {importType === 'student' ? (
                                <>
                                  <th>Roll Number</th>
                                  <th>Class Name</th>
                                </>
                              ) : (
                                <th>Username</th>
                              )}
                              <th>Password Reference</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvData.map((r, idx) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: '600' }}>{r.full_name}</td>
                                {importType === 'student' ? (
                                  <>
                                    <td>{r.roll_number}</td>
                                    <td>{r.class_name}</td>
                                  </>
                                ) : (
                                  <td>{r.username}</td>
                                )}
                                <td style={{ fontFamily: 'monospace', color: 'var(--dash-text-muted)' }}>{r.password}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', background: 'rgba(30, 41, 59, 0.2)', borderTop: '1px solid var(--dash-border)' }}>
                          <button type="button" onClick={handleImportRecords} className="btn btn-teal">
                            Sync {csvData.length} Accounts
                          </button>
                        </div>
                      </div>
                    )}

                    {(importing || importLogs.length > 0) && (
                      <div className="progress-logger">
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Import Progress Logs</span>
                          {importing && <span style={{ color: 'var(--dash-accent)', animation: 'logPulse 1s infinite' }}>Importing...</span>}
                        </h4>
                        
                        {/* PROGRESS BAR */}
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '1.25rem', overflow: 'hidden' }}>
                          <div style={{
                            width: `${(importLogs.filter(l => l.status === 'success' || l.status === 'error').length / importLogs.length) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(to right, var(--dash-accent), var(--dash-purple))',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>

                        <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {importLogs.map((log, idx) => (
                            <div key={idx} className={`progress-log-row ${log.status}`}>
                              <div className="log-meta">
                                <div>
                                  <span className="log-title">{log.full_name}</span>
                                  <span className="log-subtitle">({log.identifier})</span>
                                </div>
                                <span className={`log-status ${log.status}`}>
                                  {log.status === 'pending' && 'Queued'}
                                  {log.status === 'processing' && 'Registering...'}
                                  {log.status === 'success' && '✓ Success'}
                                  {log.status === 'error' && '✗ Failed'}
                                </span>
                              </div>
                              {log.error && <div style={{ fontSize: '0.75rem', color: 'var(--dash-error)', marginTop: '0.25rem' }}>Error details: {log.error}</div>}
                            </div>
                          ))}
                        </div>
                        {!importing && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                            <button type="button" onClick={() => { setCsvData([]); setImportLogs([]); setCsvError(null); }} style={{ padding: '0.5rem 1.25rem', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--dash-text-muted)', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
                              Dismiss Logs
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. CONFIGURE EXAM METADATA & KEY PANEL */}
              {adminDashboardTab === 'create-exam' && (
                <div className="dashboard-panel">
                  <h3 className="panel-title">Configure Exam Metadata & Key</h3>
                  <p className="panel-subtitle">Publish examination details and upload evaluation key templates.</p>
                  
                  <form onSubmit={handleCreateExam} className="premium-form">
                    <div className="form-group">
                      <label htmlFor="subject-name">Subject Name</label>
                      <input type="text" id="subject-name" placeholder="e.g. Mathematics" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="class-name">Target Class Name</label>
                      <input type="text" id="class-name" placeholder="e.g. Class 10-A" value={examClassName} onChange={(e) => setExamClassName(e.target.value)} required />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div className="form-group">
                        <label>Reference Question Paper</label>
                        <div className="file-upload-zone">
                          <div className="upload-icon-wrapper">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          </div>
                          <p className="upload-zone-text">Upload Question Paper</p>
                          <p className="upload-zone-sub">PDF or image format</p>
                          <input type="file" accept=".pdf,image/*" onChange={(e) => setQuestionPaperFile(e.target.files[0])} />
                          {questionPaperFile && (
                            <span className="file-selected-pill">✓ {questionPaperFile.name.substring(0, 25)}</span>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Reference Answer Key</label>
                        <div className="file-upload-zone">
                          <div className="upload-icon-wrapper">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          </div>
                          <p className="upload-zone-text">Upload Answer Key</p>
                          <p className="upload-zone-sub">PDF, image or text format</p>
                          <input type="file" accept=".pdf,image/*,.txt" onChange={(e) => setAnswerKeyFile(e.target.files[0])} />
                          {answerKeyFile && (
                            <span className="file-selected-pill">✓ {answerKeyFile.name.substring(0, 25)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {actionError && (
                      <div style={{ color: 'var(--dash-error)', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                        {actionError}
                      </div>
                    )}

                    {actionSuccess && (
                      <div style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        {actionSuccess}
                      </div>
                    )}

                    <button type="submit" className="btn btn-teal" style={{ padding: '0.85rem 2.5rem' }} disabled={actionLoading}>
                      {actionLoading ? 'PUBLISHING...' : 'PUBLISH EXAM CONFIG'}
                    </button>
                  </form>
                </div>
              )}

              {/* 3. AI EXAM EVALUATOR PANEL */}
              {adminDashboardTab === 'evaluate' && (
                <div className="dashboard-panel">
                  <h3 className="panel-title">AI Exam Grader Portal</h3>
                  <p className="panel-subtitle">Select an exam, upload student answer papers, and trigger AI grading.</p>

                  <div className="premium-form">
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label htmlFor="exam-select">Select Target Exam</label>
                      <select
                        id="exam-select"
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        disabled={evaluating}
                      >
                        {adminExams.length === 0 ? (
                          <option value="">-- No exams configured yet --</option>
                        ) : (
                          adminExams.map(ex => (
                            <option key={ex.id} value={ex.id}>
                              {ex.subject_name} ({ex.class_name})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Upload Student Scanned Papers</label>
                      <div className="file-upload-zone" style={{ pointerEvents: (!selectedExamId || evaluating) ? 'none' : 'auto', opacity: (!selectedExamId) ? 0.5 : 1 }}>
                        <div className="upload-icon-wrapper">
                          {evaluating ? (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--dash-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px var(--dash-accent))' }}>
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="3" y1="12" x2="21" y2="12" className="scan-line-anim"></line>
                            </svg>
                          ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15l3-3 3 3"/></svg>
                          )}
                        </div>
                        <p className="upload-zone-text">
                          {evaluating ? <span className="ai-evaluating-text" style={{ fontSize: '1.1rem' }}>AI Grading Engine Active...</span> : 'Choose scanned answer sheets (Multiple allowed)'}
                        </p>
                        <p className="upload-zone-sub">
                          {evaluating ? 'Please wait while papers are processed' : 'PDFs or image files'}
                        </p>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          multiple
                          onChange={handleScannedPapersChange}
                          disabled={evaluating || !selectedExamId}
                        />
                        {scannedSheets.length > 0 && (
                          <span className="file-selected-pill">✓ {scannedSheets.length} student sheets loaded</span>
                        )}
                      </div>
                    </div>

                    {scannedSheets.length > 0 && !evaluating && evaluationLogs.length === 0 && (
                      <div style={{ marginTop: '1.5rem' }}>
                        <button
                          type="button"
                          onClick={handleAiEvaluation}
                          className="btn btn-teal"
                          style={{ padding: '0.85rem 2.5rem' }}
                        >
                          RUN AI GRADING ENGINE
                        </button>
                      </div>
                    )}

                    {(evaluating || evaluationLogs.length > 0) && (
                      <div className="progress-logger">
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>AI Grading Status Logs</span>
                          {evaluating && <span style={{ color: 'var(--dash-accent)', animation: 'logPulse 1s infinite' }}>Grading active...</span>}
                        </h4>
                        
                        {/* PROGRESS BAR */}
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '1.25rem', overflow: 'hidden' }}>
                          <div style={{
                            width: `${(evaluationLogs.filter(l => l.status === 'success' || l.status === 'error').length / evaluationLogs.length) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(to right, var(--dash-accent), var(--dash-purple))',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                          {evaluationLogs.map((log, idx) => (
                            <div key={idx} className={`progress-log-row ${log.status}`}>
                              <div className="log-meta">
                                <span className="log-title">{log.fileName}</span>
                                <span className={`log-status ${log.status}`}>
                                  {log.status === 'pending' && 'Queued'}
                                  {log.status === 'processing' && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--dash-accent)' }}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="3" y1="12" x2="21" y2="12" className="scan-line-anim"></line>
                                      </svg>
                                      <span className="ai-evaluating-text">Evaluating...</span>
                                    </span>
                                  )}
                                  {log.status === 'success' && `✓ Graded: ${log.score}/100`}
                                  {log.status === 'error' && '✗ Failed'}
                                </span>
                              </div>
                              {log.error && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--dash-error)', marginTop: '0.25rem', borderTop: '1px dashed rgba(239, 68, 68, 0.1)', paddingTop: '0.25rem' }}>
                                  Reason: {log.error}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {!evaluating && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setScannedSheets([])
                                setEvaluationLogs([])
                              }}
                              style={{ padding: '0.5rem 1.25rem', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--dash-text-muted)', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}
                            >
                              Reset Grader
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. GRADES LEDGER DASHBOARD PANEL */}
              {adminDashboardTab === 'grades' && (
                <div className="dashboard-panel">
                  <h3 className="panel-title">School Grades Ledger</h3>
                  <p className="panel-subtitle">Overview of all student exam records evaluated by the AI grading engine.</p>

                  {gradesList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--dash-text-muted)', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '1rem', border: '1px solid var(--dash-border)' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', opacity: 0.5 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      <p style={{ margin: 0 }}>No student exam scores recorded yet. Deploy evaluations to see grades.</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="premium-table">
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Subject</th>
                            <th>Class</th>
                            <th>AI Score</th>
                            <th>Scanned Sheet</th>
                            <th>Feedback Comments</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gradesList.map((g, idx) => {
                            const scoreVal = Number(g.score) || 0
                            const rating = scoreVal >= 85 ? 'high' : scoreVal >= 60 ? 'mid' : 'low'
                            return (
                              <tr key={idx}>
                                <td style={{ fontWeight: '600' }}>{g.student?.full_name || 'Generic Student'}</td>
                                <td>{g.exams?.subject_name}</td>
                                <td>{g.exams?.class_name}</td>
                                <td>
                                  <span className={`score-badge ${rating}`}>
                                    {g.score}/100
                                  </span>
                                </td>
                                <td>
                                  {g.scanned_paper_url ? (
                                    <a href={g.scanned_paper_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--dash-accent)', textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                      View Sheet
                                    </a>
                                  ) : 'N/A'}
                                </td>
                                <td style={{ color: 'var(--dash-text-muted)', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={g.ai_feedback}>
                                  {g.ai_feedback}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </section>
          ) : (
            <section className="dashboard-section" id="dashboard" style={{
              maxWidth: '1100px',
              margin: '4rem auto',
              padding: '3rem',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '1.5rem',
              color: '#f8fafc',
              boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              fontFamily: "'Outfit', sans-serif"
            }}>
              {(() => {
                const isStudent = profile.role === 'student';
                const totalExams = isStudent ? studentExams.length : 0;
                const averageScore = totalExams > 0 ? Math.round(studentExams.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / totalExams) : 0;
                const topScore = totalExams > 0 ? Math.max(...studentExams.map(se => Number(se.score) || 0)) : 0;

                return (
                  <>
                    {/* Enhanced Header Banner */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2rem',
                      marginBottom: '3rem',
                      paddingBottom: '2.5rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{
                          width: '5rem',
                          height: '5rem',
                          borderRadius: '1.25rem',
                          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2rem',
                          fontWeight: '800',
                          color: '#ffffff',
                          boxShadow: '0 10px 25px -5px rgba(6, 182, 212, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
                          transform: 'rotate(-5deg)'
                        }}>
                          <div style={{ transform: 'rotate(5deg)' }}>
                            {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : (isStudent ? 'S' : 'U')}
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <h2 style={{ fontSize: '2.25rem', margin: '0 0 0.5rem 0', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.025em', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                            Welcome back, <span style={{ color: '#06b6d4' }}>{profile.full_name || 'User'}</span>
                          </h2>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <span style={{ 
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem', 
                              backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', 
                              padding: '0.35rem 0.85rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: '700',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
                              Authenticated as {profile.role}
                            </span>
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                              {profile.schools?.name || 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        {isStudent && totalExams > 0 && (
                          <div style={{ display: 'flex', gap: '1.5rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '1rem 1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '0.25rem' }}>Avg Score</div>
                              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: averageScore >= 80 ? '#10b981' : averageScore >= 60 ? '#f59e0b' : '#ef4444' }}>{averageScore}%</div>
                            </div>
                            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '0.25rem' }}>Top Score</div>
                              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#06b6d4' }}>{topScore}%</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info Pills */}
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {isStudent ? (
                          <>
                            <div className="info-pill" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }}>
                              <div style={{ color: '#8b5cf6' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Class Name</div>
                                <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#e2e8f0' }}>{profile.class_name || 'N/A'}</div>
                              </div>
                            </div>
                            <div className="info-pill" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }}>
                              <div style={{ color: '#f59e0b' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Roll Number</div>
                                <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#e2e8f0' }}>{profile.roll_number || 'N/A'}</div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="info-pill" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }}>
                            <div style={{ color: '#06b6d4' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Username</div>
                              <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#e2e8f0' }}>{profile.username || 'N/A'}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dashboard Content */}
                    {isStudent && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                          <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                            My Graded Answers
                          </h3>
                          <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: '700' }}>{totalExams} Records</span>
                        </div>

                        {studentExams.length === 0 ? (
                          <div style={{ 
                            textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8', 
                            backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '1rem', 
                            border: '1px dashed rgba(255,255,255,0.1)' 
                          }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', opacity: 0.5 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <p style={{ margin: 0, fontSize: '1.05rem' }}>No graded exam papers have been published for your account yet.</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Check back later once your school administrator completes AI evaluations.</p>
                          </div>
                        ) : (
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                            gap: '1.5rem' 
                          }}>
                            {studentExams.map((se) => {
                              const scoreVal = Number(se.score) || 0;
                              let scoreColor = '#ef4444'; // Red
                              let scoreBg = 'rgba(239, 68, 68, 0.1)';
                              if (scoreVal >= 80) { scoreColor = '#10b981'; scoreBg = 'rgba(16, 185, 129, 0.1)'; }
                              else if (scoreVal >= 60) { scoreColor = '#f59e0b'; scoreBg = 'rgba(245, 158, 11, 0.1)'; }

                              return (
                                <div key={se.id} style={{
                                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                  border: '1px solid rgba(255, 255, 255, 0.05)',
                                  borderRadius: '1.25rem',
                                  padding: '1.5rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                  cursor: 'default'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-4px)';
                                  e.currentTarget.style.boxShadow = `0 12px 24px -10px ${scoreColor}40`;
                                  e.currentTarget.style.borderColor = `${scoreColor}40`;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                }}>
                                  {/* Top accent line */}
                                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: scoreColor }}></div>
                                  
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#f8fafc', fontWeight: '800', lineHeight: 1.2 }}>
                                        {se.exams?.subject_name}
                                      </h4>
                                      <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                        Evaluated {new Date(se.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    
                                    {/* Score Circle Badge */}
                                    <div 
                                      style={{
                                        width: '64px', height: '64px',
                                        borderRadius: '50%',
                                        backgroundColor: scoreBg,
                                        border: `2px solid ${scoreColor}80`,
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        color: scoreColor, boxShadow: `0 0 15px ${scoreBg}`,
                                        cursor: 'pointer', transition: 'transform 0.2s'
                                      }}
                                      onClick={() => setFeedbackModal({ subject: se.exams?.subject_name, score: se.score, feedback: se.ai_feedback })}
                                      title="View Detailed AI Report"
                                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                      <span style={{ fontSize: '1.25rem', fontWeight: '800', lineHeight: 1 }}>{scoreVal}</span>
                                      <span style={{ fontSize: '0.6rem', fontWeight: '700', opacity: 0.8 }}>/100</span>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    {se.scanned_paper_url && (
                                      <a
                                        href={se.scanned_paper_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ 
                                          flex: 1, textAlign: 'center', padding: '0.65rem 0', 
                                          backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', 
                                          borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: '700', 
                                          textDecoration: 'none', border: '1px solid rgba(6, 182, 212, 0.2)',
                                          transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(6, 182, 212, 0.2)'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(6, 182, 212, 0.1)'}
                                      >
                                        My Answers
                                      </a>
                                    )}
                                    {se.exams?.question_paper_url && (
                                      <a
                                        href={se.exams.question_paper_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          flex: 1, textAlign: 'center', padding: '0.65rem 0',
                                          backgroundColor: 'transparent', color: '#cbd5e1',
                                          borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: '600',
                                          textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)',
                                          transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                      >
                                        Question Paper
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </section>
        ))}
      </main>
      {feedbackModal && (
        <div className="modal-overlay active" onClick={() => setFeedbackModal(null)} style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', textAlign: 'left' }}>
            <button className="modal-close" onClick={() => setFeedbackModal(null)}>&times;</button>
            <div className="modal-header" style={{ textAlign: 'left', marginBottom: 0 }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#06b6d4' }}>AI Evaluation Report</h2>
              <p style={{ margin: 0, fontWeight: '600', color: '#f1f5f9' }}>{feedbackModal.subject}</p>
              <div style={{ marginTop: '1rem', display: 'inline-block', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.5rem 1rem', borderRadius: '2rem', color: '#10b981', fontWeight: '700', fontSize: '1.1rem' }}>
                Final Score: {feedbackModal.score}/100
              </div>
            </div>
            <div className="ai-markdown-container" style={{ padding: '1.5rem', backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '1rem', color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95rem', overflowWrap: 'break-word' }}>
              <ReactMarkdown>
                {feedbackModal.feedback || 'No detailed feedback provided.'}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
      <DemoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <LoginPage isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </>
  )
}
