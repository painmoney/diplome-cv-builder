<div align="center">

# CV Builder

### Modern resume builder with AI-powered insights

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase)](https://supabase.com/)
[![MUI](https://img.shields.io/badge/MUI-5-007FFF?logo=mui)](https://mui.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## Features

**Resume Builder**
- Intuitive tab-based editor with real-time preview
- 5 built-in templates: Academic, Classic, GitHub, Minimalist, Modern
- Autosave with fingerprint-based change detection
- Onboarding checklist for quick start

**Smart Insights**
- Resume Health Check — completeness score across all sections
- AI-powered recommendations for improving your resume
- Job Match analysis — paste a job description and see how well your resume fits
- Cover letter generation with safety checks

**GitHub Integration**
- Import repositories directly from your GitHub profile
- Auto-fetch descriptions, languages, and topics
- Showcase up to 5 featured projects

**Export**
- PDF with pixel-perfect rendering
- DOCX for ATS-friendly submissions
- Markdown for quick sharing

**Auth & Dashboard**
- Email/password authentication via Supabase
- Multi-resume management from a single dashboard
- Password recovery and update flows

**Theme**
- Light and dark mode support

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, React Router 6 |
| UI | Material UI 5, Framer Motion |
| Backend | Supabase (Auth, Postgres, Storage, Edge Functions) |
| PDF | @react-pdf/renderer |
| DOCX | docx.js |
| Testing | Vitest, Testing Library |
| Linting | ESLint |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- A [Supabase](https://supabase.com/) project

### Installation

```bash
# Clone the repository
git clone https://github.com/painmoney/diplome-cv-builder.git
cd diplome-cv-builder

# Install dependencies
npm install
```

### Environment Setup

Create `.env.development.local` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
npm run dev        # Start dev server (primary)
npm run dev:staging  # Start with staging config
```

### Build

```bash
npm run build
npm run preview
```

### Testing

```bash
npm run test
npm run lint
```

---

## Project Structure

```
src/
├── api/              # Supabase client, GitHub API, resume service
├── components/
│   ├── ResumeBuilder/ # Editor, blocks, health check, job match
│   ├── export/        # PDF, DOCX, Markdown exporters
│   ├── templates/     # Visual template components
│   ├── profile/       # Profile form
│   └── layout/        # Header, footer, layout wrapper
├── context/          # Auth and theme contexts
├── hooks/            # Custom React hooks
├── pages/            # Route pages (Home, Dashboard, Login, etc.)
├── templates/        # Template config JSONs
├── utils/            # Helpers, validators, job match, recommendations
└── styles.css        # Global styles
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (primary) |
| `npm run dev:staging` | Dev server (staging) |
| `npm run build` | Production build |
| `npm run test` | Run tests |
| `npm run lint` | ESLint check |
| `npm run env:check` | Verify env for primary |
| `npm run safety:scan` | Scan for dangerous Supabase commands |
| `npm run backup:trigger-and-sync` | Trigger and sync DB backup |

---

<div align="center">

Built as a diploma project

</div>
