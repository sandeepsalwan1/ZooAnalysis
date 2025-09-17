# AnimalCare Web (Next.js on Vercel)

- Next.js 14 (App Router), Tailwind, Framer Motion, Edge API route
- Drag-and-drop upload, animated UI, behavior report via OpenAI

## Local dev

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push repo to GitHub
2. Import the `web/` directory in Vercel (Root Directory: `web`)
3. Add environment variable `OPENAI_API_KEY`
4. Deploy

One-click deploy link template:

```
https://vercel.com/new/clone?repository-url=<YOUR_REPO_URL>&root-directory=web&env=OPENAI_API_KEY
```