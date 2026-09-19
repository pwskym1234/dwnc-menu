"use client";

import { useEffect, useState } from "react";
import { OPTIONS, type MenuResult } from "@/lib/menu";
import { REGIONS, type Region, type Weather } from "@/lib/weather";

type Step = "form" | "loading" | "result";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-orange-500 bg-orange-500 text-white shadow-sm"
          : "border-neutral-200 bg-white text-neutral-700 hover:border-orange-300"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-neutral-800">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function MenuApp() {
  const [region, setRegion] = useState<Region>("서울");
  const [mood, setMood] = useState<string>(OPTIONS.mood[0]);
  const [budget, setBudget] = useState<string>(OPTIONS.budget[1]);
  const [company, setCompany] = useState<string>(OPTIONS.company[0]);
  const [avoid, setAvoid] = useState<string[]>(["없음"]);
  const [weather, setWeather] = useState<Weather | null | "error">(null);
  const [step, setStep] = useState<Step>("form");
  const [result, setResult] = useState<MenuResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWeather(null);
    fetch(`/api/weather?region=${encodeURIComponent(region)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((w: Weather) => setWeather(w))
      .catch(() => setWeather("error"));
  }, [region]);

  function toggleAvoid(v: string) {
    setAvoid((prev) => {
      if (v === "없음") return ["없음"];
      const next = prev.filter((x) => x !== "없음");
      return next.includes(v) ? (next.length === 1 ? ["없음"] : next.filter((x) => x !== v)) : [...next, v];
    });
  }

  async function recommend() {
    setStep("loading");
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region,
          mood,
          budget,
          company,
          avoid,
          weather: weather && weather !== "error" ? weather.summary : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "실패");
      setResult(data);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "추천에 실패했어요.");
      setStep("form");
    }
  }

  const weatherText =
    weather === null ? "날씨 확인 중…" : weather === "error" ? "날씨 확인 불가 (추천은 가능)" : `지금 ${region} ${weather.summary}`;

  return (
    <div className="w-full max-w-lg">
      <header className="mb-8">
        <p className="text-sm font-medium text-orange-600">DWNC 10기 · 2차 코딩데이</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-neutral-900">오늘 뭐 먹지? 🍽️</h1>
        <p className="mt-2 text-neutral-500">버튼 몇 개만 누르면 날씨까지 반영해서 3개 골라드려요.</p>
      </header>

      {step !== "result" && (
        <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <Field label="어디서 먹어요?">
            {(Object.keys(REGIONS) as Region[]).map((r) => (
              <Chip key={r} active={region === r} onClick={() => setRegion(r)}>{r}</Chip>
            ))}
          </Field>
          <p className="rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-800">🌤 {weatherText}</p>

          <Field label="오늘 기분은?">
            {OPTIONS.mood.map((m) => <Chip key={m} active={mood === m} onClick={() => setMood(m)}>{m}</Chip>)}
          </Field>
          <Field label="예산 (1인)">
            {OPTIONS.budget.map((b) => <Chip key={b} active={budget === b} onClick={() => setBudget(b)}>{b}</Chip>)}
          </Field>
          <Field label="누구랑?">
            {OPTIONS.company.map((c) => <Chip key={c} active={company === c} onClick={() => setCompany(c)}>{c}</Chip>)}
          </Field>
          <Field label="못 먹는 것 (복수 선택)">
            {OPTIONS.avoid.map((a) => <Chip key={a} active={avoid.includes(a)} onClick={() => toggleAvoid(a)}>{a}</Chip>)}
          </Field>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={recommend}
            disabled={step === "loading"}
            className="w-full rounded-2xl bg-orange-500 py-4 text-lg font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
          >
            {step === "loading" ? "AI가 고르는 중… 🤔" : "추천받기"}
          </button>
        </div>
      )}

      {step === "loading" && (
        <ul className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => <li key={i} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />)}
        </ul>
      )}

      {step === "result" && result && (
        <div>
          <p className="mb-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-800">
            {result.comment || "오늘의 추천이에요!"} <span className="text-orange-500">· {weatherText}</span>
          </p>
          <ul className="space-y-3">
            {result.menus.map((m, i) => (
              <li key={i} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{m.emoji}</span>
                  <h2 className="text-xl font-bold text-neutral-900">{m.name}</h2>
                </div>
                <p className="mt-2 text-neutral-700">{m.reason}</p>
                <p className="mt-2 text-sm text-neutral-500">🥤 함께: {m.side}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={recommend}
              className="flex-1 rounded-2xl bg-orange-500 py-3 font-semibold text-white transition hover:bg-orange-600"
            >
              다시 추천 🔄
            </button>
            <button
              type="button"
              onClick={() => setStep("form")}
              className="flex-1 rounded-2xl border border-neutral-300 py-3 font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              조건 바꾸기
            </button>
          </div>
        </div>
      )}

      <p className="mt-10 text-center text-xs text-neutral-400">Gemini API + 기상청 단기예보 API · Next.js</p>
    </div>
  );
}
