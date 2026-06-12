# Tailgate

**Turn any source into a structured, AI-generated study scheme — in real time.**

Tailgate takes whatever raw material you have — spreadsheets, PDFs, images, audio, video, web links, or pasted notes — and turns it into a complete, navigable course. You describe what you want to learn and drop in your sources; Tailgate reads them and generates a grounded study scheme: modules with lessons, flashcards, objective quizzes, mnemonics, and a per-topic glossary, organized like a proper curriculum.

Inside the workspace, every document is interactive. A floating assistant answers questions about whatever's on screen, and you can highlight any passage and ask about it directly. Quizzes are scored with feedback on strengths and weak spots, sources can be expanded after a scheme exists (inserting new modules without disturbing existing ones), schemes are shareable, and study reminders can be scheduled by email, SMS, or push.

---

## Features

- **Any source → structured course.** 8 input types (spreadsheet, Word, PDF, image, text, HTML, audio, video) plus links and search — the AI reads actual file **contents**, not just filenames.
- **Real AI generation.** Google Gemini (multimodal) turns your prompt and uploaded files into modules, lessons, quizzes, mnemonics, and a glossary on the fly. A predefined fallback scheme keeps the experience working even if the API is unavailable.
- **Contextual chat.** Ask about the open document, or highlight a passage and click **Ask AI about this** for an in-context explanation.
- **Grounded learning assets.** Flashcards, objective quizzes with scored feedback, an interactive matching activity, mnemonics, and cheat-sheet glossaries.
- **Stable expansion & sharing.** Add sources later to insert only new modules; share schemes; track performance, library, schedules, and progress.

---

## How it works

```
Landing (/)                  Processing (/processing)         Workspace (/workspace)
─────────────                ───────────────────────          ──────────────────────
prompt + uploaded files  →   POST /api/generate (Gemini   →   renders the generated
read at submit               structured JSON, multimodal)     scheme; falls back to the
                             → scheme handed to workspace      predefined one on any error
```

- **File handling:** text/CSV/HTML/Markdown are read as text; PDF, images, audio, and video are sent to Gemini inline. Office binaries (`.xlsx`, `.docx`) are referenced by name only (Gemini can't parse them natively).
- **Generation:** `app/api/generate/route.ts` forces a JSON schema and retries transient `503/429` overloads.
- **Chat:** `app/api/chat/route.ts` answers questions grounded in the open module and any highlighted text.
- The Gemini API key is read **server-side only** — it is never shipped to the browser.

---

## Getting started

### 1. Prerequisites
- Node.js 20+ (developed on 22)
- A free Google Gemini API key — get one (no credit card) at <https://aistudio.google.com/app/apikey>

### 2. Configure the key
Add it to `.env.local` in the project root:

```bash
GEMINI_API_KEY=your_key_here
# Optional — defaults to gemini-2.5-flash:
# GEMINI_MODEL=gemini-2.5-flash
```

> Without a key, the AI chat and generation are disabled and the app uses the predefined demo scheme. Restart the dev server after changing `.env.local`.

### 3. Install & run

```bash
pnpm install      # or: npm install
pnpm dev          # or: npm run dev
```

Open <http://localhost:3000>.

### Try it
1. On the landing page, type a prompt (e.g. *"Build a study scheme on the basics of photosynthesis"*).
2. Optionally drop in a file (a `.pdf`, `.txt`, `.csv`, image, or audio clip) — its contents are read.
3. Click **Submit sources** and watch the workspace build from your input.
4. In the workspace: open a module, take the **Quiz**, review the **Glossary**, hit **Ask AI**, or highlight text and choose **Ask AI about this**.

---

## Project structure

```
app/
├── page.tsx                 # / — landing (thin wrapper)
├── processing/page.tsx      # /processing — build animation + generation call
├── workspace/page.tsx       # /workspace — the product
├── lib/scheme.tsx           # shared client module: data, UI, and all screens/views
├── components/
│   └── ProblemCardsSection.tsx   # pinned horizontal-scroll section
├── api/
│   ├── generate/route.ts    # prompt + files → study scheme (Gemini, JSON schema)
│   └── chat/route.ts        # contextual "Ask AI" chat (Gemini)
└── globals.css
```

The three routes are thin wrappers that render `LandingPage` / `ProcessingScreen` / `WorkspaceScreen` from `app/lib/scheme.tsx`.

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | Lint with ESLint |

---

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · Google Gemini API.

---

## Notes & limitations

- No authentication yet; reminders, sharing, and "search" are UI demonstrations.
- Office formats (`.xlsx`, `.docx`) are referenced by name, not parsed.
- Generation depends on the Gemini free tier; the app falls back to a predefined scheme if the API errors, so a live demo never lands on a broken screen.
