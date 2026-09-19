import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { MenuInput, MenuResult } from "@/lib/menu";

const SYSTEM = `너는 한국 대학생 눈높이의 메뉴 추천 전문가다.
사용자 조건과 현재 날씨를 반영해 오늘 먹을 메뉴를 정확히 3개 추천한다.
- 서로 다른 종류(예: 한식/양식/분식)로 겹치지 않게
- 못 먹는 음식은 절대 포함하지 않는다
- 예산 범위 안에서 현실적인 메뉴
- 날씨가 있으면 이유에 자연스럽게 녹인다 (예: 더운 날엔 시원한 것)
반드시 아래 JSON만 출력한다. 마크다운, 설명, 코드블록 금지.
{"menus":[{"name":"메뉴명","emoji":"이모지 1개","reason":"추천 이유 한두 문장","side":"어울리는 사이드/음료"}],"comment":"전체 한 줄 코멘트"}`;

function extractJson(text: string): MenuResult {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("JSON 없음");
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as MenuResult;
  if (!Array.isArray(parsed.menus) || parsed.menus.length === 0) throw new Error("menus 비어 있음");
  return { menus: parsed.menus.slice(0, 3), comment: parsed.comment ?? "" };
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });

  const input = (await req.json()) as MenuInput;
  const avoid = input.avoid.filter((a) => a !== "없음");
  const userPrompt = [
    `지역: ${input.region}`,
    `현재 날씨: ${input.weather ?? "확인 불가"}`,
    `기분/취향: ${input.mood}`,
    `예산(1인): ${input.budget}`,
    `함께 먹는 사람: ${input.company}`,
    `못 먹는 음식: ${avoid.length ? avoid.join(", ") : "없음"}`,
  ].join("\n");

  const ai = new GoogleGenAI({ apiKey: key });
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: { systemInstruction: SYSTEM, responseMimeType: "application/json", temperature: 0.9 },
      });
      try {
        return NextResponse.json(extractJson(res.text ?? ""));
      } catch (e) {
        console.warn(`parse attempt ${attempt + 1} failed:`, e);
      }
    }
    return NextResponse.json({ error: "AI 응답을 읽지 못했어요. 다시 시도해주세요." }, { status: 502 });
  } catch (e) {
    console.error("gemini failed:", e);
    return NextResponse.json({ error: "AI 호출에 실패했어요. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }
}
