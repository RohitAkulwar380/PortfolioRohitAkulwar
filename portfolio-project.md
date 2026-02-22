# AI Portfolio — Internship Assessment

> A personal portfolio website with integrated AI chat functionality, allowing visitors to interact with my resume and receive accurate, context-aware responses.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Backend | Python (FastAPI) |
| Database | SQLite (local dev) / Supabase (production) |
| Chat Engine | OpenRouter API (free model) |
| Hosting | Cloudflare Pages (frontend) + Cloudflare Tunnel (backend) |

---

## Project Structure

```
portfolio/
├── frontend/                   # React + TypeScript
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── SplitLayout.tsx       # Main split-panel layout
│   │   │   │   ├── LeftPanel.tsx         # Scrollable portfolio content
│   │   │   │   └── RightPanel.tsx        # Fixed chat sidebar
│   │   │   ├── portfolio/
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── About.tsx
│   │   │   │   ├── Skills.tsx
│   │   │   │   ├── Projects.tsx
│   │   │   │   ├── Experience.tsx
│   │   │   │   └── Contact.tsx
│   │   │   └── chat/
│   │   │       ├── ChatPanel.tsx         # Chat container (right sidebar)
│   │   │       ├── MessageThread.tsx     # Independently scrolling messages
│   │   │       ├── MessageBubble.tsx
│   │   │       └── ChatInput.tsx
│   │   ├── hooks/
│   │   │   └── useChat.ts               # Chat state & API calls
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                    # Python — FastAPI
│   ├── main.py                 # App entry point
│   ├── routes/
│   │   └── chat.py             # POST /api/chat
│   ├── services/
│   │   ├── openrouter.py       # OpenRouter API wrapper
│   │   └── resume.py           # Resume data loader
│   ├── models/
│   │   └── database.py         # SQLite/Supabase setup
│   ├── data/
│   │   └── resume.json         # Resume data (source of truth)
│   └── requirements.txt
│
└── README.md
```

---

## Design Direction

### Layout — Split Panel (inspired by Groth Studio)

The portfolio uses a **persistent split-panel layout** rather than a conventional single-column scroll:

- **Left panel (~62% width)** — Main portfolio content, scrolls independently
- **Right panel (~38% width)** — Chat interface, fixed to viewport height, message thread scrolls within it
- On **mobile**, panels stack vertically with a tab toggle between Portfolio and Chat views

This makes the chat feel like a designed-in feature, not an afterthought widget.

### Visual Aesthetic

Inspired by the reference sites (Diana's Seafood, Bouquet Infusions, Hurry Up & Have Fun, Shed):

- **Palette** — Warm cream/off-white background, deep near-black anchor color, single muted accent (terracotta or sage)
- **Typography** — Serif for headings (editorial feel), clean sans-serif for body text
- **Character touches** — Scrolling marquee strip, subtle SVG illustration details, intentional whitespace
- **No dark-mode SaaS aesthetic** — warm, human, crafted

### Chat Panel Design

- Header with a small label: *"Ask my resume anything"*
- Message thread with distinct user / AI bubble styles
- Minimal input bar at the bottom, always visible
- Typing indicator animation while AI responds
- Suggested starter questions on load (e.g. *"What projects has he worked on?"*, *"What's his tech stack?"*)

---

## Backend Architecture

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Send message, receive AI response |
| `GET` | `/api/resume` | Fetch resume data |
| `GET` | `/api/health` | Health check |

### Chat Flow

```
User message
    → POST /api/chat
        → Load resume from DB
        → Build system prompt with resume context
        → Call OpenRouter API
        → Return AI response
    → Display in MessageThread
```

### System Prompt Strategy

The resume is injected into every request as a system prompt so the model only answers based on real data:

```
You are an AI assistant for [Name]'s portfolio website.
Answer questions ONLY based on the resume context below.
Be concise, friendly, and professional.
If a question is outside the resume context, say so honestly.

--- RESUME CONTEXT ---
{resume_text}
```

### OpenRouter Model

Using a free model: `mistralai/mistral-7b-instruct` or `google/gemma-3-12b-it`

---

## Database Schema

### `resume` table

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | Primary key |
| `section` | TEXT | e.g. `experience`, `skills`, `projects` |
| `content` | JSON | Section data |
| `updated_at` | TIMESTAMP | Last updated |

### `chat_logs` table (optional)

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | Primary key |
| `session_id` | TEXT | Anonymous session identifier |
| `message` | TEXT | User message |
| `response` | TEXT | AI response |
| `created_at` | TIMESTAMP | Timestamp |

---

## Development Phases

### Phase 1 — Backend Foundation
- [ ] Set up FastAPI project structure
- [ ] Create `/api/chat` endpoint
- [ ] Integrate OpenRouter API
- [ ] Load resume from JSON → inject into system prompt
- [ ] Test with Postman/Insomnia
- [ ] Set up SQLite database

### Phase 2 — Frontend Scaffold
- [ ] Initialize React + TypeScript project
- [ ] Build split-panel layout (`SplitLayout`, `LeftPanel`, `RightPanel`)
- [ ] Build static portfolio sections (Hero, About, Skills, Projects, Experience)
- [ ] Set up global styles and design tokens (colors, fonts, spacing)

### Phase 3 — Chat Integration
- [ ] Build `ChatPanel`, `MessageThread`, `MessageBubble`, `ChatInput` components
- [ ] Implement `useChat` hook (state management + API calls)
- [ ] Wire frontend to backend `/api/chat`
- [ ] Add typing indicator and loading states
- [ ] Add suggested starter questions

### Phase 4 — Polish & UX
- [ ] Refine typography, spacing, and color palette
- [ ] Add scroll animations (Framer Motion)
- [ ] Implement marquee strip component
- [ ] Mobile responsive layout (tab toggle for chat/portfolio)
- [ ] Accessibility pass (keyboard nav, ARIA labels)

### Phase 5 — Deployment
- [ ] Push to public GitHub repository
- [ ] Write thorough README
- [ ] Deploy frontend to Cloudflare Pages
- [ ] Set up Cloudflare Tunnel for backend (`cloudflared tunnel`)
- [ ] Point frontend API calls to tunnel URL
- [ ] End-to-end test on live URL

---

## Hosting Setup

### Frontend — Cloudflare Pages
1. Push repo to GitHub
2. Connect repo to Cloudflare Pages
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Auto-deploys on every push to `main`

### Backend — Cloudflare Tunnel
```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create portfolio-backend

# Run (points to local FastAPI on port 8000)
cloudflared tunnel --url http://localhost:8000
```

---

## Key Libraries

### Frontend
| Package | Purpose |
|---|---|
| `react` + `typescript` | Core framework |
| `tailwindcss` | Utility-first styling |
| `framer-motion` | Animations and transitions |
| `axios` | API calls |

### Backend
| Package | Purpose |
|---|---|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `httpx` | Async HTTP client for OpenRouter |
| `sqlalchemy` | ORM for SQLite |
| `python-dotenv` | Environment variable management |

---

## Environment Variables

### Frontend (`.env`)
```
VITE_API_URL=https://your-tunnel-url.trycloudflare.com
```

### Backend (`.env`)
```
OPENROUTER_API_KEY=your_key_here
DATABASE_URL=sqlite:///./portfolio.db
```

---

## Notes & Decisions

- **Why FastAPI?** Async-first, automatic OpenAPI docs, minimal boilerplate — ideal for a small focused API
- **Why SQLite for dev?** Zero setup, file-based, easy to swap for Supabase Postgres in production
- **Why split-panel layout?** Makes the chat a first-class citizen of the UX rather than a tacked-on widget — signals intentional design thinking to reviewers
- **Why inject resume into system prompt vs fine-tuning?** Simpler, free, accurate, and updatable without retraining
