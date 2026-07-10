# Resume Analyzer

A full-stack web app that analyzes your resume against a job description and returns:

- **ATS compatibility score** (0–100) with an honest verdict
- **Keyword gap analysis** — missing keywords grouped by importance
- **Section-by-section fit breakdown** with actionable feedback
- **Tailored rewrite suggestions** for your weakest bullet points

Built with React + TypeScript on the frontend and Vercel Serverless Functions on the backend, powered by the Claude API.

**Live:** https://ai-resume-analyzer-amt.vercel.app

---

## Application Flow

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'primaryColor':       '#1E1E2E',
    'primaryTextColor':   '#CDD6F4',
    'primaryBorderColor': '#45475A',
    'lineColor':          '#585B70',
    'background':         '#11111B',
    'secondaryColor':     '#181825',
    'tertiaryColor':      '#313244',
    'edgeLabelBackground':'#1E1E2E',
    'clusterBkg':         '#16161E',
    'clusterBorder':      '#45475A',
    'titleColor':         '#CDD6F4'
  }
}}%%

flowchart TD
    classDef trigger  fill:#2E2640,stroke:#CBA6F7,stroke-width:2px,color:#CDD6F4,font-weight:bold
    classDef ui       fill:#1A2035,stroke:#89B4FA,stroke-width:2px,color:#89B4FA,font-weight:bold
    classDef step     fill:#181825,stroke:#45475A,stroke-width:1px,color:#A6ADC8
    classDef decision fill:#2A2520,stroke:#F9E2AF,stroke-width:2px,color:#F9E2AF,font-weight:bold
    classDef service  fill:#182418,stroke:#A6E3A1,stroke-width:2px,color:#A6E3A1,font-weight:bold
    classDef model    fill:#1E1428,stroke:#CBA6F7,stroke-width:2.5px,color:#CBA6F7,font-weight:bold
    classDef result   fill:#132028,stroke:#89DCEB,stroke-width:2px,color:#89DCEB,font-weight:bold
    classDef err      fill:#2D1520,stroke:#F38BA8,stroke-width:2px,color:#F38BA8,font-weight:bold

    subgraph client["  💻  Browser — React  "]
        A(["🚀 Open App"]):::trigger         --> B["📋 InputPanel<br/>resume · job description"]:::ui

        B --> C{{"Input Mode"}}:::decision
        C -- "📄 File upload" --> D["PDF / DOCX"]:::step
        C -- "📝 Paste"       --> E["Plain text"]:::step

        D & E --> F(["⚡ Click Analyze"]):::trigger

        F --> G["🔍 GET /api/health"]:::step
        G -. "no response > 3 s" .-> H["⏳ Warm-up banner"]:::step
        G -- "200 OK"            --> I["📤 POST /api/analyze"]:::step
        H                        --> I

        I --> J["📊 Results View"]:::ui
        J --> K["🎯 ScoreCard"]:::step
        J --> L["🔑 KeywordGaps"]:::step
        J --> M["🧩 FitBreakdown"]:::step
        J --> N["✍️ RewriteSuggestions"]:::step

        J --> O(["🔄 Re-analyze"]):::trigger
        O --> P["🪟 Split View<br/>new input · old results"]:::ui
        P -- "Submit" --> F
    end

    subgraph api["  ⚡  Vercel Serverless — api/  "]
        I --> Q{{"Content-Type"}}:::decision
        Q -- "multipart/form-data" --> R[["⚙️ pdf-parse / mammoth<br/>→ plain text"]]:::service
        Q -- "application/json"    --> S[["📄 resumeText field"]]:::service

        R & S --> T{{"Validate"}}:::decision
        T -- "Invalid" --> U["❌ 400 / 422"]:::err
        T -- "Valid"   --> V[["🧠 claudeService"]]:::service

        V --> W[("🤖 Claude API<br/>claude-sonnet-4-6")]:::model
        W --> X["📦 AnalysisResult JSON"]:::result
        X --> J
    end

    linkStyle default stroke:#585B70,stroke-width:1.5px
```
---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Vercel Serverless Functions (Node.js, TypeScript) |
| LLM | Anthropic Claude API (`claude-sonnet-4-6`) |
| PDF parsing | `pdf-parse` |
| DOCX parsing | `mammoth` |
| Deployment | Vercel (frontend + API, single project) |

---

## Features

- **ATS score + verdict** — scored 0–100 with a plain-English summary
- **Keyword gap analysis** — missing keywords ranked by critical / important / nice-to-have
- **Section fit breakdown** — per-section score and targeted feedback
- **Rewrite suggestions** — specific before/after rewrites for your weakest bullets
- **Re-analyze split-view** — edit and re-submit without losing your previous results; Claude avoids repeating previous suggestions
- **File or paste input** — upload PDF/DOCX or paste plain text
- **Dark / light theme** — persisted to localStorage
- **Mobile responsive** — works on phone and desktop
- **Rate limiting** — 2 analyses per IP per 30 minutes
- **Input quality detection** — warns when resume text is too short or garbled to be reliable

---

## Running Locally

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd resume-analyzer
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies (used for local dev only)
cd server && npm install && cd ..
```

### 2. Configure environment variables

**Root** — create `.env` (picked up by the local server):
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

- **Upload a file** — PDF or DOCX (5 MB max). Complex multi-column layouts may reduce accuracy; paste mode is more reliable for those.
- **Paste text** — plain text, minimum 200 characters.

---

## Deployment

The project is a single Vercel deployment. The `client/` builds to a static site; the `api/` directory is served as Vercel Serverless Functions.

### Steps

1. Push this repo to GitHub.
2. Go to [Vercel](https://vercel.com) → New Project → Import from GitHub.
3. Leave the root directory as `/` (the `vercel.json` at the root configures everything).
4. Add one environment variable: `ANTHROPIC_API_KEY=your_key_here`.
5. Deploy. Vercel builds the frontend and wires up the API functions automatically.

### What `vercel.json` configures

| Setting | Value |
|---|---|
| Build command | `cd client && npm install && npm run build` |
| Output directory | `client/dist` |
| `/api/analyze` max duration | 60 s |
| `/api/health` max duration | 10 s |
