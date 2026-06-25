# MDJ SpaceVanta - Complete Project Documentation

Welcome to the comprehensive developer documentation for the **MDJ SpaceVanta** project. This guide details the frontend architecture, styling framework, page components, batch import systems, AI evaluation API integrations, and the underlying database design.

---

## 1. Project Overview & Objective

**MDJ SpaceVanta** is a premium scanner management, student record tracking, and **AI Exam Evaluation Portal**.
* **For Administrators**:
  * Upload Student and Admin accounts in batch (CSV).
  * Configure Exams: Upload question papers and answer key references.
  * Upload student scanned answer sheets and trigger the AI evaluation engine.
  * Monitor AI grading logs and access the grades ledger.
* **For Students**:
  * A streamlined login interface requiring only School Name, Class Name, Roll Number, and Password.
  * A grades dashboard displaying score results, scanned sheets, question papers, and detailed AI feedback.

---

## 2. Design System & Theme

The interface adheres to modern, premium dark-mode web guidelines, focusing on visual depth, responsive layouts, and elegant animations.

### Style System Tokens (`index.css`)
* **Color Palette**:
  * Primary Dark background: `#0f172a` (Slate 900)
  * Secondary Surface: `#1e293b` (Slate 800)
  * Accent Neon: `#06b6d4` (Teal 500)
  * Success Pill: `#10b981` (Emerald 500)
  * Border Transparency: `rgba(255, 255, 255, 0.1)`
* **Glassmorphism**: Modals and cards utilize `backdrop-filter: blur(16px)` overlayed on semi-transparent dark backgrounds.
* **Typography**: Clean, sans-serif fonts using the Google Fonts **Outfit** and **Inter** families.

---

## 3. Directory Map & File Index

The workspace is organized into a Vite React frontend and a PostgreSQL schema file:

```text
c:/Users/sveer/Desktop/mdj spacevanta/
├── supabase_schema.sql         # Idempotent PostgreSQL database script
├── SUPABASE_INTEGRATION_GUIDE.md # Database integration reference
├── PROJECT_DOCUMENTATION.md    # [THIS FILE] Core project documentation
├── hero_clean.png              # Hero graphic asset
└── react-app/                  # Frontend source code
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx             # Main layout, session state, admin dashboard, AI evaluator
        ├── main.jsx            # React mounting wrapper
        ├── index.css           # Styling system & global styles
        ├── supabaseClient.js   # Supabase client initializer
        └── components/
            ├── Navbar.jsx      # Navigation header with Scroll-Spy & Auth states
            ├── HeroSection.jsx # Animated landing presentation
            ├── FeaturesBar.jsx # Visual grid displaying product highlights
            ├── DemoModal.jsx   # Demo request modal connected to database
            └── LoginPage.jsx   # Tabbed login portal with cascading dropdowns
```

---

## 4. Frontend Architecture & Components

The application is built using **React 19** and **Vite**. The main layout is composed of the following components:

### A. App Core (`App.jsx`)
* **State Management**: Listens to auth session updates (`onAuthStateChange`). If logged in, it queries the database profiles to fetch user roles (student vs admin) and associates.
* **Admin Dashboard Tabs**:
  * **CSV Users Import**: Registers student and admin accounts in bulk.
  * **Configure Exams**: Allows creating new exams with subject details, target class names, question paper files, and answer key references.
  * **AI Exam Evaluator**: Selects configured exams, uploads batches of student scanned sheets, and initiates the grading loops.
  * **Grades Dashboard**: Displays a comprehensive ledger of all student grades, matching scanned sheets, and feedback comments.
* **Student Dashboard**: Lists all publishing exam records, featuring color-coded score badges, detailed AI feedback summaries, and clickable paper reference links.

### B. Navbar (`components/Navbar.jsx`)
* **Scroll-Spy**: Highlights links in real-time as users scroll past sections (`#home`, `#services`, `#store`, `#about`).
* **Auth-State Headers**: Switches between showing a **Login** link and a **Logout (User Name)** button based on the active session.

### C. LoginPage (`components/LoginPage.jsx`)
* **Cascading Dropdowns (Students)**: Rather than typing Class and Roll Number, selects are query-cascaded:
  1. Selecting a School queries unique **Classes** using `get_school_classes` RPC.
  2. Selecting a Class queries unique **Roll Numbers** using `get_class_roll_numbers` RPC.
  3. Students simply type their Password.

---

## 5. AI Grading Engine Integration & Gradio Client Call

When clicking **Run AI Grading Engine** inside the admin portal, the system processes files as follows:

### 1. Storage Upload
Files are uploaded directly to the Supabase Storage Bucket `papers`.
* Question papers are saved under the `/question_papers/` folder.
* Answer keys are saved under the `/answer_keys/` folder.
* Student scanned answer sheets are saved under the `/student_papers/` folder.

### 2. Hugging Face Gradio Connection
The client connects to the Hugging Face Space repository defined in `VITE_AI_EVALUATION_URL` (e.g. `NBLVPrasad/Exam_Evaluation_System`) using the `@gradio/client` JS library. Connection authentication is validated using the token defined in `VITE_AI_EVALUATION_TOKEN`.

### 3. File Retrieval & Prediction Request
Because the Gradio client requires files to be passed as binary File objects:
1. The question paper and answer key are fetched as binary `Blob`s from their public Supabase Storage URLs.
2. A local prediction request is sent to the Gradio space's `/evaluate` endpoint with:
   - `q`: The Question Paper file object.
   - `t`: The reference Answer Key file object.
   - `s`: The student's scanned answer sheet file object.
   - `level`: The strictness evaluation mode (defaults to `"Moderate"`).

### 4. Output Parsing & Record Registration
The space returns a data array containing three text fields: `[teacher_ocr, student_ocr, evaluation_result]`.
* **Score Extraction**: The system parses the raw text in `evaluation_result` using regex matches to extract the numeric score (e.g. `Score: 85/100`).
* **Feedback Compilation**: The detailed evaluation report and both extracted OCR logs are combined into the student's `ai_feedback` comment block.
* **Saving Results**: The system resolves the student profile using their roll number (parsed from the file name, e.g. `Elena_1003.png` -> `1003`) and inserts a row into the `student_exams` table.

* **Failsafe Simulator**: If no Gradio space URL is configured, the system falls back to a realistic local simulation mapping mock student accounts and generating randomized scores for quick validation.

---

## 6. Backend Schema Reference

* **`exams`**: Tracks subject details, target classes, and reference question/answer documents.
* **`student_exams`**: Logs student scores, graded answer paper URLs, evaluation statuses, and AI feedback.
* **`get_school_classes(p_school_id)` / `get_class_roll_numbers(p_school_id, p_class_name)`**: Public database helper functions to query metadata lists without bypassing security.
* **`papers` Storage Bucket**: Public access bucket. The trigger security policy strictly limits write/insert permissions to authenticated administrators.

---

## 7. How to Run Locally

### 1. Apply Schema
Run the contents of [supabase_schema.sql](file:///c:/Users/sveer/Desktop/mdj%20spacevanta/supabase_schema.sql) in your **Supabase SQL Editor** to deploy all tables, storage rules, and triggers.

### 2. Configure Environment
Update your credentials in [react-app/.env](file:///c:/Users/sveer/Desktop/mdj%20spacevanta/react-app/.env):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

VITE_AI_EVALUATION_URL=https://your-ai-evaluation-api-url.com
VITE_AI_EVALUATION_TOKEN=your-ai-evaluation-project-token
```

### 3. Run Development Server
```bash
npm run dev
```
