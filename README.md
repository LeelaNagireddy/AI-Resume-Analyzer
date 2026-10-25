# CareerPilot — Complete Frontend

A responsive React + Vite frontend for the **AI-Based Resume Analyzer with Adaptive Mock Interview System**.

## Included modules

- Login / sign-up UI with Candidate and Admin workspace selection
- Candidate dashboard with performance metrics, charts, readiness, and quick actions
- Resume Analyzer with PDF, DOCX, and TXT text extraction in the browser
- Job-description skill extraction, keyword match estimate, skill gaps, report export
- Adaptive interview practice with role context, question selection, answer feedback, difficulty changes, and downloadable session report
- Leaderboard and candidate management screens
- Profile settings, local persistence, and reset controls
- Responsive desktop, tablet, and mobile layouts

## Run locally

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

Production build:

```bash
npm run build
npm run preview
```

## Important architecture note

This is a **complete interactive frontend application**, but it is not a production full-stack system yet. In the absence of backend endpoints, the following operate locally in the browser:

- Login and role selection are a UI flow, not secure authentication.
- Candidate profiles, analyses, and interview sessions are stored in `localStorage`.
- Resume file parsing happens in the browser. Scanned PDFs need OCR, which is not included.
- ATS-style scores use known-skill keyword matching and are estimates, not validated ATS scores.
- Interview questions are generated from a small skill/template set; answer scoring is heuristic rather than LLM-based.
- The leaderboard shows local browser data, not a shared multi-user ranking.

Do not use local role selection or localStorage for sensitive production data. For real deployment, connect a backend and use server-side authorization.

## Suggested backend integration

The project report's proposed stack maps naturally to these endpoints:

| Frontend feature | Suggested API |
|---|---|
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Resume parsing + analysis | `POST /api/resume/analyze` (multipart resume + job description) |
| Analysis history | `GET /api/resume/analyses` |
| Start interview | `POST /api/interviews` |
| Next question / evaluate answer | `POST /api/interviews/{session_id}/answers` |
| Interview report | `GET /api/interviews/{session_id}/report` |
| Candidate dashboard | `GET /api/dashboard` |
| Leaderboard | `GET /api/leaderboard` |
| Admin candidates | `GET /api/admin/candidates` |

Recommended stack from the project report: React + Vite, FastAPI, PyMuPDF/python-docx, spaCy, Sentence-BERT + cosine similarity, Gemini API, and PostgreSQL. Keep API keys on the backend; never ship a Gemini API key inside frontend code.

## Project structure

```text
careerpilot-complete-frontend/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    └── styles.css
```
