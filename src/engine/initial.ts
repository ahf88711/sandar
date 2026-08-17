import { DECISIONS } from "../data/decisions";
import { DEFAULT_BUDGET, START_YEAR } from "./balance";
import { seedFrom } from "./rng";
import type { GameState, NationState } from "./types";
import { SAVE_VERSION } from "./types";
import { boundedState, energyCapacity } from "./util";

function openingDecision() {
  const d = DECISIONS.find((x) => x.id === "opening")!;
  return {
    id: d.id,
    title: d.title,
    body: d.body,
    urgency: d.urgency ?? "normal" as const,
    choices: d.choices.map((c) => ({ id: c.id, label: c.label, hint: c.hint })),
  };
}

export function defaultNations(): NationState[] {
  return [
    {
      id: "norvan",
      name: "جمهورية نورفان",
      adjective: "النورفانية",
      blurb: "قوة صناعية تصدّر الآلات والسلع الوسيطة، وتفضل الاستقرار والأسواق المفتوحة.",
      personality: "trader",
      gdp: 1820,
      tech: 64,
      military: 48,
      energy: 52,
      relation: 56,
      tradeVolume: 9.4,
      deals: { trade: true, tech: false, defense: false, energy: false, sanctioned: false, exportBan: false },
      lastAction: "تقترح توسيع التبادل التجاري مقابل انفتاح سوق سندار.",
    },
    {
      id: "kirmal",
      name: "اتحاد كيرمال",
      adjective: "الكيرمالي",
      blurb: "اتحاد غني بالمحروقات، يبيع الطاقة بعقود طويلة ويحوّل النفط إلى نفوذ.",
      personality: "energy",
      gdp: 940,
      tech: 41,
      military: 55,
      energy: 92,
      relation: 50,
      tradeVolume: 6.1,
      deals: { trade: true, tech: false, defense: false, energy: false, sanctioned: false, exportBan: false },
      lastAction: "يعرض إمدادات وقود مستقرة مقابل التزام سياسي هادئ.",
    },
    {
      id: "astoria",
      name: "فيدرالية أستوريا",
      adjective: "الأستورية",
      blurb: "قائدة التقنية والحوسبة. تشارك المعرفة بحذر وتقيّد تصدير الرقائق المتقدمة.",
      personality: "technocrat",
      gdp: 3480,
      tech: 88,
      military: 72,
      energy: 60,
      relation: 48,
      tradeVolume: 4.2,
      deals: { trade: false, tech: false, defense: false, energy: false, sanctioned: false, exportBan: false },
      lastAction: "تراقب برامج سندار التقنية دون التزام واضح.",
    },
    {
      id: "rimal",
      name: "سلطنة رمال",
      adjective: "الرمالية",
      blurb: "جار إقليمي حذر، يبحث عن أمن حدودي وشراكات دفاعية متزنة.",
      personality: "cautious",
      gdp: 148,
      tech: 33,
      military: 36,
      energy: 44,
      relation: 61,
      tradeVolume: 3.3,
      deals: { trade: true, tech: false, defense: false, energy: false, sanctioned: false, exportBan: false },
      lastAction: "تطلب تنسيقاً أمنياً هادئاً دون استفزاز فالين.",
    },
    {
      id: "valen",
      name: "جمهورية فالين",
      adjective: "الفالينية",
      blurb: "قوة إقليمية صاعدة تتنافس على النفوذ، وتضيق على من يقترب من خصومها.",
      personality: "revisionist",
      gdp: 415,
      tech: 47,
      military: 68,
      energy: 58,
      relation: 38,
      tradeVolume: 2.1,
      deals: { trade: false, tech: false, defense: false, energy: false, sanctioned: false, exportBan: false },
      lastAction: "تختبر حدود سندار بخطاب حاد ومناورات قرب الممرات.",
    },
  ];
}

export function createInitialState(opts?: {
  leaderName?: string;
  seed?: number;
}): GameState {
  const seed = opts?.seed ?? seedFrom(`${Date.now()}-${Math.random()}`);
  const energyDemand = 16.4;
  const state: GameState = {
    version: SAVE_VERSION,
    seed,
    year: START_YEAR,
    turn: 0,
    startedAt: Date.now(),
    countryName: "جمهورية سندار",
    capitalName: "الوادي الأخضر",
    leaderName: (opts?.leaderName ?? "القائد").trim() || "القائد",

    gdp: 86.4,
    gdpGrowth: 0.021,
    treasury: 4.8,
    revenue: 14.2,
    expenditure: 17.6,
    deficit: 3.4,
    debt: 54.1,
    inflation: 0.074,
    investment: 16.8,
    productivity: 0.92,
    exports: 18.6,
    imports: 22.4,

    taxRate: 0.164,
    spendRate: 0.204,
    budget: { ...DEFAULT_BUDGET },

    population: 28.2,
    unemployment: 0.138,
    stability: 58,
    approval: 52,
    humanCapital: 33,
    educationQuality: 31,

    fossilCapacity: 15.2,
    renewableCapacity: 3.1,
    energyDemand,
    energyCost: 1.18,
    grid: 34,

    industries: {
      basic: 29,
      advanced: 11,
      automotive: 8,
      defense: 10,
      electronics: 9,
      semiconductor: 3,
      robotics: 4,
      aerospace: 2,
    },
    industrialCapacity: 24,
    supplyChain: 28,

    technology: 19,
    research: 16,
    computing: 11,
    dataCenters: 8,
    semiconductors: 18,
    aiCapability: 6,
    automation: 7,
    roboticsTech: 8,
    cybersecurity: 14,
    spaceTech: 5,

    defense: {
      army: 28,
      air: 16,
      airDefense: 14,
      navy: 11,
      missiles: 12,
      drones: 9,
      cyber: 13,
      space: 4,
      domestic: 10,
    },
    militaryPower: 18,
    deterrence: 21,

    roads: 32,
    rail: 14,
    ports: 22,
    airports: 19,
    logistics: 24,
    digital: 21,
    infrastructure: 29,

    influence: 13,
    nations: defaultNations(),

    activeProjects: [],
    completedProjects: [],

    delayedEffects: [],
    pendingDecisions: [openingDecision()],
    resolvedDecisionIds: [],

    history: [],
    log: [
      {
        year: START_YEAR,
        kind: "system",
        title: "تولي القيادة",
        detail: "تسلمت قيادة جمهورية سندار وسط نمو بطيء، ودين مرتفع، وطموح شعبي للنهضة.",
      },
    ],
    lastReport: null,
    showReport: false,

    flags: {
      yearsOfHighDebt: 0,
      yearsOfInstability: 0,
      yearsOfDecline: 0,
      yearsOfEnergyCrisis: 0,
      consecutiveGrowth: 0,
      consecutiveDecline: 0,
      lastGdpGrowth: 0.021,
      tutorialDone: false,
      diploActionsThisYear: 0,
      scholarshipsEver: false,
      austerityYears: 0,
      stimulusYears: 0,
      chipAccessShock: 0,
      oilPrice: 1,
      globalGrowth: 0.026,
      tension: 28,
    },
    ending: null,
  };

  const capped = boundedState(state);
  capped.energyDemand = energyDemand;
  const reserve = (energyCapacity(capped) - energyDemand) / energyDemand;
  capped.history = [
    {
      year: START_YEAR,
      gdp: capped.gdp,
      growth: capped.gdpGrowth,
      debt: capped.debt,
      debtRatio: capped.debt / capped.gdp,
      population: capped.population,
      unemployment: capped.unemployment,
      inflation: capped.inflation,
      stability: capped.stability,
      approval: capped.approval,
      energyCapacity: energyCapacity(capped),
      energyDemand: capped.energyDemand,
      industrialCapacity: capped.industrialCapacity,
      technology: capped.technology,
      aiCapability: capped.aiCapability,
      computing: capped.computing,
      education: capped.humanCapital,
      military: capped.militaryPower,
      influence: capped.influence,
      revenue: capped.revenue,
      expenditure: capped.expenditure,
    },
  ];
  void reserve;
  return capped;
}
