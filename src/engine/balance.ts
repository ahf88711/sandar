import type { BudgetAlloc, BudgetKey, IndustryKey } from "./types";

export const START_YEAR = 2026;
export const MAX_ACTIVE_PROJECTS = 5;
export const MAX_DIPLO_ACTIONS = 2;
export const MIN_VICTORY_YEAR = 2044;
export const HISTORY_LIMIT = 80;

export const BUDGET_KEYS: BudgetKey[] = [
  "economy",
  "energy",
  "industry",
  "tech",
  "defense",
  "education",
  "infrastructure",
];

export const INDUSTRY_KEYS: IndustryKey[] = [
  "basic",
  "advanced",
  "automotive",
  "defense",
  "electronics",
  "semiconductor",
  "robotics",
  "aerospace",
];

export const DEFAULT_BUDGET: BudgetAlloc = {
  economy: 0.18,
  energy: 0.14,
  industry: 0.14,
  tech: 0.1,
  defense: 0.16,
  education: 0.14,
  infrastructure: 0.14,
};

export const BUDGET_LABELS: Record<BudgetKey, string> = {
  economy: "الاقتصاد والمالية",
  energy: "الطاقة",
  industry: "الصناعة",
  tech: "التقنية والذكاء الاصطناعي",
  defense: "الدفاع",
  education: "التعليم",
  infrastructure: "البنية التحتية",
};

export const INDUSTRY_LABELS: Record<IndustryKey, string> = {
  basic: "التصنيع الأساسي",
  advanced: "التصنيع المتقدم",
  automotive: "السيارات",
  defense: "التصنيع الدفاعي",
  electronics: "الإلكترونيات",
  semiconductor: "أشباه الموصلات",
  robotics: "الروبوتات",
  aerospace: "الطيران والفضاء",
};

export const DEFENSE_LABELS = {
  army: "القوات البرية",
  air: "القوات الجوية",
  airDefense: "الدفاع الجوي",
  navy: "القوات البحرية",
  missiles: "الصواريخ",
  drones: "الطائرات المسيّرة",
  cyber: "الدفاع السيبراني",
  space: "القدرات الفضائية",
  domestic: "التصنيع الدفاعي المحلي",
} as const;

export const SCREEN_LABELS = {
  home: "الصفحة الرئيسية",
  economy: "الاقتصاد",
  energy: "الطاقة",
  industry: "الصناعة",
  tech: "التقنية والذكاء الاصطناعي",
  defense: "الدفاع",
  education: "التعليم",
  infrastructure: "البنية التحتية",
  projects: "المشاريع",
  world: "العلاقات الدولية",
  stats: "الإحصائيات",
  decisions: "القرارات والأحداث",
  settings: "الإعدادات",
} as const;

export const STANCE_LABELS = {
  hostile: "عدائية",
  tense: "متوترة",
  cool: "باردة",
  neutral: "محايدة",
  cordial: "ودية",
  friendly: "وثيقة",
  allied: "تحالف",
} as const;
