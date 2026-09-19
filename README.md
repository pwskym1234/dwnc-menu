# 오늘 뭐 먹지? 🍽️

DWNC 10기 2차 코딩데이 — Gemini API + 기상청 단기예보 API로 만든 AI 메뉴 추천.

- 기분·예산·동행·못 먹는 것 버튼 선택 → 현재 날씨(기상청 초단기실황) 자동 반영 → Gemini가 JSON으로 메뉴 3개
- 스택: Next.js 16 · Tailwind v4 · @google/genai · Vercel
- 기획: [PRD.md](./PRD.md)

```bash
cp .env.example .env.local   # GEMINI_API_KEY, WEATHER_API_KEY 입력
npm install && npm run dev
```
