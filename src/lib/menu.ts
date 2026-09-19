export const OPTIONS = {
  mood: ["든든하게", "가볍게", "매콤하게", "스트레스 풀리게", "건강하게", "아무거나"],
  budget: ["1만원 이하", "1~2만원", "2만원 이상"],
  company: ["혼밥", "친구", "연인", "가족", "회식"],
  avoid: ["없음", "해산물", "고수", "매운 음식", "밀가루", "육류"],
} as const;

export type MenuInput = {
  region: string;
  mood: string;
  budget: string;
  company: string;
  avoid: string[];
  weather: string | null;
};

export type MenuItem = { name: string; reason: string; side: string; emoji: string };
export type MenuResult = { menus: MenuItem[]; comment: string };
