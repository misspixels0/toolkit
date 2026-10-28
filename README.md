# Toolkit Hub

Saathon tools ab **aik hi Next.js project** mein hain. Aik install, aik `.env.local`, aik Vercel deploy, aik live link.

| Page | Tool | Kya karta hai |
|---|---|---|
| `/` | Hub | Saaton tools ka dashboard + dikhata hai kaunsi keys set hain |
| `/website-review` | SiteScope | URL daalo, free basic Performance/SEO/Accessibility checks + optional AI fixes |
| `/inbox` | InboxHub | Kai Gmail accounts connect karo, inbox dekho, email bhejo |
| `/reelforge` | ReelForge | Script + voiceover + captions, phir YouTube upload |
| `/search-console` | PageControl | Search Console queries/pages + URL index check |
| `/chatbot` | Chat Assistant | Groq (ya Gemini fallback) ke saath sawal-jawab, conversation context ke saath |
| `/product-research` | Product & Market Research | Products, features, prices, and market alternatives with live sources |
| `/law-research` | Laws & Regulations Research | Current legal information with jurisdiction-aware official sources (not legal advice) |

Stack: Next.js 14 (App Router) + TypeScript + Tailwind. Website Review ke basic checks bina kisi API key ke chalte hain.

---

## 1. Local chalana

```bash
npm install
copy .env.example .env.local      # Mac/Linux:  cp .env.example .env.local
npm run dev
```

Phir http://localhost:3000 kholo. `.env.local` mein keys bharo (neeche dekho). Jo tool jaisi key maangta hai, wo hub page pe
hara/peela dot se nazar aata hai. Keys badalne ke baad `npm run dev` dobara chalao.

Groq use karne ke liye https://console.groq.com/keys se key banao aur `.env.local` mein
`GROQ_API_KEY=your-key` set karo. Key ko browser/client code ya public repo mein mat daalo. Is key se product/law research
browser search bhi use karta hai. Gemini key ki zaroorat nahi; agar dono keys set hon to Groq use hoga.

---

## 2. Free keys kahan se milengi

| Key | Kahan se | Kis tool ko chahiye |
|---|---|---|
| `GROQ_API_KEY` | https://console.groq.com/keys | Website Review (AI summary, optional), ReelForge (script), Chatbot, research tools; preferred provider |
| `GROQ_MODEL` | Optional. Default `openai/gpt-oss-20b` | Groq model. Research web search ke liye browser search support wala model use karo |
| `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey | Optional fallback if `GROQ_API_KEY` is not set |
| `VOICERSS_API_KEY` | https://www.voicerss.org (free, no credit card) | ReelForge (voiceover) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Neeche "Google login setup" | Inbox, ReelForge upload, Search Console |
| `GEMINI_MODEL` | Optional. Default `gemini-3.1-flash-lite` | Fallback Gemini model |

---

## 3. Google login setup (sirf aik baar, teeno tools ke liye)

1. https://console.cloud.google.com par naya project banao.
2. **APIs & Services > Library** mein ye enable karo: **Gmail API**, **YouTube Data API v3**, **Google Search Console API**
   (Google Cloud APIs baqi tools ke liye chahiye; Website Review ab bina PageSpeed API key ke basic checks karta hai).
3. **OAuth consent screen**: User type *External*, apna Gmail **Test users** mein add karo.
4. **Credentials > Create Credentials > OAuth client ID > Web application**.
5. **Authorized redirect URIs** mein sirf ye **aik hi URL** (har tool ke liye alag nahi chahiye ab):
   - `http://localhost:3000/api/auth/google/callback`
   - `https://YOUR-APP.vercel.app/api/auth/google/callback` (deploy ke baad)
6. Client ID aur Secret `.env.local` mein paste karo.

`GOOGLE_REDIRECT_URI` khali chhod sakte ho, app apna URL khud pehchan leti hai. Agar set karo to wo Google Console wale URL se
bilkul same hona chahiye.

**Zaroori baatein:**
- Testing mode mein Google refresh token lagbhag **7 din** baad expire kar deta hai. Phir tool mein dobara "Connect" dabana padega.
- Search Console tool sirf wahi sites dikhata hai jin ka aap us Google account se pehle se verified owner/user hain.
- Login ke waqt "Google hasn't verified this app" warning aaye to *Advanced > Go to app* karo. Testing mode mein ye normal hai.

---

## 4. Vercel pe deploy (sirf 1 project)

1. Is folder ko GitHub repo mein push karo.
2. Vercel > **New Project** > repo import karo (Framework: Next.js, apne aap detect hota hai).
3. **Environment Variables** mein `.env.example` wali keys daalo.
4. Deploy. Phir live URL ka `/api/auth/google/callback` Google Console ke redirect URIs mein add karo.

---

## 5. ReelForge: video assemble karna (local computer par)

Vercel par ffmpeg nahi hota, isliye final MP4 aap apne computer par banate ho:

```bash
node scripts/render-video.js --audio voiceover.mp3 --background background.mp4 --captions captions.srt --out final.mp4
```

ffmpeg install hona chahiye (https://ffmpeg.org/download.html). Phir MP4 ko `/reelforge` ke step 4 se upload kar do. Upload
hamesha **Private** hoti hai, YouTube Studio mein review kar ke Public karo.

---

## Known limitations (seedhi baat)

- **Vercel par bade video upload nahi honge.** Vercel ki serverless functions ki request body limit lagbhag 4.5 MB hai,
  is liye web app se bada MP4 upload Vercel par fail hoga. Local (`npm run dev`) par theek chalega. Vercel par ho to
  video seedha YouTube Studio se upload kar do.
- **Tokens cookie mein hain**, database mein nahi (MVP). Public launch se pehle inhe encrypted DB (jaise free Supabase) mein
  move karo. Cookie ki size limit ki wajah se Gmail ke lagbhag 6 accounts tak hi connect honge.
- **Is app mein koi user login nahi hai.** Jo bhi live URL khole, wo apne Google accounts connect karta hai aur cookies
  uske browser mein rehti hain. Lekin `GROQ_API_KEY` wagairah aap ki hain, to link public share karne se pehle
  soch lo (koi bhi aap ki free quota use kar sakta hai).
- Agar dono AI keys set hon, app Groq use karti hai; Gemini sirf Groq key na hone par fallback hota hai. Groq quota
  khatam/error ho to Gemini par automatic switch nahi hota.

---

## Folder structure

```
app/
  page.tsx                     hub dashboard
  website-review/ inbox/ reelforge/ search-console/ chatbot/
  product-research/ law-research/                    (7 tool pages)
  api/
    auth/google/               OAuth start + callback (teeno Google tools ke liye ek hi)
    auth/accounts/             connected accounts list / disconnect
    website-review/analyze/    Free HTML checks + optional AI summary
    gmail/list, gmail/send
    reelforge/script, reelforge/voiceover
    chatbot/                                      Groq/Gemini chat
    research/[type]/                              Groq browser search or Gemini Google Search grounding
    youtube/upload
    gsc/sites, gsc/analytics, gsc/inspect
components/   Nav, shared UI
lib/          google.ts (OAuth + cookies), ai.ts, gemini.ts, tools.ts
scripts/      render-video.js (local ffmpeg)
```
