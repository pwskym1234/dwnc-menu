import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "오늘 뭐 먹지? — AI 메뉴 추천",
  description: "기분·예산·날씨를 반영해 Gemini가 메뉴 3개를 골라줍니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#fffaf5] text-neutral-900">{children}</body>
    </html>
  );
}
