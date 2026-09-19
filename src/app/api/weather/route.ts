import { NextResponse } from "next/server";
import { fetchWeather, REGIONS, type Region } from "@/lib/weather";

export async function GET(req: Request) {
  const region = new URL(req.url).searchParams.get("region") ?? "서울";
  if (!(region in REGIONS)) return NextResponse.json({ error: "지원하지 않는 지역" }, { status: 400 });
  try {
    return NextResponse.json(await fetchWeather(region as Region));
  } catch (e) {
    console.error("weather failed:", e);
    return NextResponse.json({ error: "날씨 확인 불가" }, { status: 502 });
  }
}
