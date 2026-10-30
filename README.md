# Toolkit Hub

Toolkit Hub is a Next.js app with website checks, AI chat, and focused research assistants.

| Page | Tool | What it does |
|---|---|---|
| `/` | Hub | Dashboard for all tools and their configured API keys |
| `/website-review` | SiteScope | Lightweight performance, SEO, accessibility, and best-practice checks |
| `/chatbot` | Chat Assistant | General conversation with the configured AI provider |
| `/product-research` | Product Research | Product comparisons, prices, and market alternatives with web sources |
| `/law-research` | Law Research | Current legal information with jurisdiction-aware sources; not legal advice |
| `/science-research` | Science Research | Research-based scientific explanations with current sources |
| `/medical-research` | Medical Research | Evidence-focused medical information with sources; not diagnosis or treatment advice |

Stack: Next.js 14 (App Router), TypeScript, and Tailwind CSS.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open http://localhost:3000. Set API keys in `.env.local`; never commit that file or expose keys in browser code.

## AI keys

Create Groq API keys at https://console.groq.com/keys. Science and Medical use separate keys, and Business Research and Language Tutor share one separate key. The keys can be generated from the same Groq account; its email does not need to match your GitHub account.

Add `SCIENCE_GROQ_API_KEY`, `MEDICAL_GROQ_API_KEY`, and `SPECIALIST_GROQ_API_KEY` to `.env.local` for local use, and configure each in Vercel under **Project Settings → Environment Variables**. Business Research uses browser search; all research tools use a Groq model that supports browser search. The default is `openai/gpt-oss-20b`, configurable with `GROQ_MODEL`. Language Tutor uses the shared specialist key but does not need web search.

`GEMINI_API_KEY` is an optional fallback for the general chatbot and existing product/law research tools when `GROQ_API_KEY` is not set. When both are set, Groq is preferred.

| Variable | Required for |
|---|---|
| `GROQ_API_KEY` | General AI chatbot, Website Review AI summary, and product/law research |
| `SCIENCE_GROQ_API_KEY` | Science Research |
| `MEDICAL_GROQ_API_KEY` | Medical Research |
| `SPECIALIST_GROQ_API_KEY` | Business Research and Language Tutor |
| `GROQ_MODEL` | Optional Groq model override; default `openai/gpt-oss-20b` |
| `GEMINI_API_KEY` | Optional fallback for general chat and product/law research |
| `GEMINI_MODEL` | Optional Gemini model override |
| `PAGESPEED_API_KEY` | Optional Website Review rate-limit improvement |

## Deploy to Vercel

1. Push this project to GitHub and import the repository in Vercel as a Next.js project.
2. Add `SCIENCE_GROQ_API_KEY`, `MEDICAL_GROQ_API_KEY`, and `SPECIALIST_GROQ_API_KEY` under **Project Settings → Environment Variables**. Add `GROQ_API_KEY` if you also want the general chatbot, Website Review AI summary, or product/law research.
3. Deploy or redeploy after changing environment variables.

Medical Research provides general information only, not a medical diagnosis or personal treatment instructions. Verify important claims using the linked sources and consult a qualified healthcare professional about personal medical decisions.
