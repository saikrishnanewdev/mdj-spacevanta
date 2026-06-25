# MDJ SpaceVanta 🚀

Welcome to **MDJ SpaceVanta** — A modern, fully responsive school management and AI-powered exam evaluation portal built with a sleek, glassmorphic space theme!

## Features ✨

### Student Portal
- **Dashboard**: A stunning, immersive dashboard featuring customized stats (Average Score, Top Score).
- **Graded Answers**: View evaluated exam papers and AI-generated feedback in a responsive, interactive grid layout.
- **Answer Verification**: Direct links to scanned answer sheets and question papers.
- **Account Management**: Update credentials securely from a personalized profile dropdown.

### Admin Portal
- **Dashboard**: Complete administrative control with an intuitive user interface.
- **CSV Imports**: Quickly onboard students or other administrators via automated CSV batch uploading.
- **Grades Management**: AI-driven exam evaluation management utilizing Supabase Edge Functions to auto-grade scanned exam papers.

## Tech Stack 🛠️

- **Frontend**: [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Styling**: Vanilla CSS with modern Glassmorphism and responsive CSS grids
- **AI Processing**: Deno-based Supabase Edge Functions with Gemini integration

## Quick Start 🚀

### 1. Prerequisites
Make sure you have Node.js and npm installed.
- [Node.js](https://nodejs.org/en/) (v16+)

### 2. Setup the Project
Clone the repository and install the dependencies for the React app:
```bash
git clone https://github.com/saikrishnanewdev/mdj-spacevanta.git
cd mdj-spacevanta/react-app
npm install
```

### 3. Environment Variables
Create a `.env` file in the `react-app` directory and populate it with your Supabase credentials. Refer to the `.env.example` file if provided.
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run the Local Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:5173`.

## Deployment 🌐

This project is optimized for deployment on Vercel or Netlify.
1. Connect this repository to your Vercel account.
2. Select the **Vite** framework preset.
3. Set the **Root Directory** to `react-app`.
4. Add your `.env` variables into the platform's Environment Variables section.
5. Deploy!

## License 📄
This project is open-source and available for educational and non-commercial use.
