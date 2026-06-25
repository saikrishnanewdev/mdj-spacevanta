# MDJ SpaceVanta - High-Speed Automated Document Scanner

MDJ SpaceVanta is a premium, high-speed automated document scanner web application. It features a modern, responsive single-page design built with React, styled using custom vanilla CSS, and integrated with smooth transitions, responsive visual overlays, and advanced features.

## 🚀 Key Features

- **Premium Responsive Design**: Vibrant color system (teal and slate), custom typography (Inter, Outfit, Lora), and interactive micro-animations.
- **Sticky Scroll-spy Navigation**: Automatically highlights active pages (Home, Services, Store, About) on scroll, with smooth header interaction.
- **Dynamic Visual Overlays**: Clean SVG neon arrows pulsing to represent high-speed data flow (Tablet ➔ Scanner ➔ Laptop).
- **Interactive Modals**:
  - **Request a Demo Modal**: Glassmorphic styling with client-side form submission.
  - **Student/Admin Login Modal**: A tabbed modal interface with dedicated authentication forms:
    - **Student Fields**: School Name, Roll Number, Class Name, Password.
    - **Admin Fields**: School Name, Username, Password.

---

## 🛠️ Technology Stack

- **Core**: React 18, Vite
- **Styling**: Vanilla CSS (Variables, Flexbox/Grid, Custom CSS Animations, Keyframes)
- **Icons & Graphics**: Embedded Inline SVGs (Logo, feature icons, neon visual flows)

---

## 💻 Project Structure

```
react-app/
├── public/                 # Static assets (images, logos)
├── src/
│   ├── assets/             # Sub-component assets
│   ├── components/         # Reusable UI components
│   │   ├── DemoModal.jsx    # "Request a Demo" form modal
│   │   ├── LoginPage.jsx    # Tabbed student/admin login modal
│   │   ├── FeaturesBar.jsx  # Feature cards grid
│   │   ├── HeroSection.jsx  # Main hero header with backgrounds & call-to-actions
│   │   └── Navbar.jsx       # Sticky top navigation
│   ├── App.jsx             # Main layout and state hub
│   ├── index.css           # Global custom CSS styles & design tokens
│   └── main.jsx            # React root mount entrypoint
├── index.html              # Main HTML entry template
└── vite.config.js          # Vite configuration
```

---

## ⚙️ Setup and Installation

Follow these steps to run the application locally:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The application will be running locally at `http://localhost:5173/`.

3. **Build for Production**:
   ```bash
   npm run build
   ```
