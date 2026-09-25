# Product Feedback Analyzer

Paste customer reviews and get AI-powered product feedback insights: sentiment, themes, complaints, feature requests, and suggested improvements.

## Features

- **Sentiment analysis** — positive / neutral / negative breakdown across your reviews
- **Key themes** — the topics customers talk about most, with representative quotes
- **Complaints & feature requests** — grouped, prioritized issues and asks
- **Suggested improvements** — actionable recommendations derived from the feedback
- **Demo mode** — runs fully offline with a local fallback analyzer when no API key is set

## Getting started

### Prerequisites

- Node.js 18.18 or later (Node 20+ recommended)
- npm

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional — see Demo mode below)
copy .env.example .env      # Windows
cp .env.example .env        # macOS / Linux

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### AI provider (optional)

The app uses Google Gemini for AI analysis. Create a free API key at [Google AI Studio](https://aistudio.google.com/apikey) and put it in `.env`:

```
GEMINI_API_KEY=your-key-here
```

The key is read **only** by server-side code (the `/api/analyze` route) and is never sent to the browser.

### Demo mode

Leave `GEMINI_API_KEY` empty to run without AI. A local fallback analyzer powers the whole app, so you can demo every feature with no key and no internet AI calls.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + React
- Plain CSS (see `src/app/globals.css`)
- Google Gemini API (optional — demo mode needs no key)

## Security notes

- `.env` is git-ignored; never commit real keys.
- `.env.example` is the only env file in the repo and contains no secrets.
