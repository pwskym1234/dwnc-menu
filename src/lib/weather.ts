// 기상청 초단기실황 (getUltraSrtNcst) — 매시 정시 발표, 10분 후 제공
export const REGIONS = {
  서울: { nx: 60, ny: 127 },
  수원: { nx: 60, ny: 121 },
  인천: { nx: 55, ny: 124 },
  대전: { nx: 67, ny: 100 },
  대구: { nx: 89, ny: 90 },
  부산: { nx: 98, ny: 76 },
  광주: { nx: 58, ny: 74 },
  제주: { nx: 52, ny: 38 },
} as const;
export type Region = keyof typeof REGIONS;

export type Weather = { temp: number; humidity: number; rain: string; summary: string };

const PTY: Record<string, string> = {
  "0": "맑음/흐림",
  "1": "비",
  "2": "비/눈",
  "3": "눈",
  "5": "빗방울",
  "6": "빗방울눈날림",
  "7": "눈날림",
};

function kstNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000); // UTC+9 as if UTC
}

export async function fetchWeather(region: Region): Promise<Weather> {
  const key = process.env.WEATHER_API_KEY;
  if (!key) throw new Error("WEATHER_API_KEY 없음");
  const { nx, ny } = REGIONS[region];

  // 발표 10분 후부터 제공되므로, 정시+10분 이전이면 한 시간 전 자료 사용
  const now = kstNow();
  if (now.getUTCMinutes() < 10) now.setUTCHours(now.getUTCHours() - 1);
  const base_date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const base_time = String(now.getUTCHours()).padStart(2, "0") + "00";

  const url = new URL("https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst");
  url.search = new URLSearchParams({
    serviceKey: key,
    numOfRows: "10",
    pageNo: "1",
    dataType: "JSON",
    base_date,
    base_time,
    nx: String(nx),
    ny: String(ny),
  }).toString();

  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`기상청 API HTTP ${res.status}`);
  const json = await res.json();
  const items: { category: string; obsrValue: string }[] = json?.response?.body?.items?.item ?? [];
  if (!items.length) throw new Error(json?.response?.header?.resultMsg ?? "기상청 응답 없음");

  const get = (c: string) => items.find((i) => i.category === c)?.obsrValue ?? "";
  const temp = Number(get("T1H"));
  const humidity = Number(get("REH"));
  const rain = PTY[get("PTY")] ?? "정보 없음";
  const feel = temp >= 28 ? "더움" : temp >= 20 ? "선선함" : temp >= 10 ? "쌀쌀함" : "추움";
  return { temp, humidity, rain, summary: `${temp}°C ${feel}, ${rain}, 습도 ${humidity}%` };
}
