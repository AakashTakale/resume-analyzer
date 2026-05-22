# Resume Analyzer

A full-stack web app that analyzes your resume against a job description and returns:

- **ATS compatibility score** (0–100) with an honest verdict
- **Keyword gap analysis** — missing keywords grouped by importance
- **Section-by-section fit breakdown** with actionable feedback
- **Tailored rewrite suggestions** for your weakest bullet points

Built with React + TypeScript on the frontend and Node/Express on the backend, powered by the Claude API.

**Live:** https://ai-resume-analyzer-amt.vercel.app

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| LLM | Anthropic Claude API (`claude-sonnet-4-6`) |
| PDF parsing | `pdf-parse` |
| DOCX parsing | `mammoth` |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## Running Locally

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd resume-analyzer

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure environment variables

**Server** — create `server/.env`:
```
ANTHROPIC_API_KEY=your_key_here
PORT=3001
```

**Client** — create `client/.env.local`:
```
VITE_API_URL=http://localhost:3001
```

### 3. Start both servers

```bash
# Terminal 1 — backend (runs on :3001)
cd server && npm run dev

# Terminal 2 — frontend (runs on :5173)
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Input Modes

- **Upload a file** — PDF or DOCX (5MB max). Complex multi-column layouts may reduce accuracy; paste mode is more reliable for those.
- **Paste text** — plain text paste, minimum 200 characters.

---

## Deployment

### Backend → Railway

1. Push this repo to GitHub
2. Go to [Railway](https://railway.app) → New Project → Deploy from GitHub repo
3. Select the repo, set **Root Directory** to `server`
4. Add environment variable: `ANTHROPIC_API_KEY=your_key_here`
5. Railway auto-detects Node and deploys. Copy the generated public URL.

### Frontend → Vercel

1. Go to [Vercel](https://vercel.com) → New Project → Import from GitHub
2. Set **Root Directory** to `client`
3. Add environment variable: `VITE_API_URL=<your Railway URL>`
4. Vercel auto-detects Vite and deploys. Your live URL is ready.
