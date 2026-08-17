import type { BudgetAlloc, GameState, NumericPatch } from "./types";

export function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function clamp01(n: number): number {
  return clamp(n, 0, 1);
}

export function clamp100(n: number): number {
  return clamp(n, 0, 100);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function dim(spend: number, scale: number): number {
  if (spend <= 0 || scale <= 0) return 0;
  return scale * (1 - Math.exp(-spend / scale));
}

export function soft(n: number, mid: number): number {
  return n / (n + mid);
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function uid(prefix: string, rng: () => number): string {
  return `${prefix}-${Math.floor(rng() * 1e9).toString(36)}`;
}

export function pick<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)]!;
}

export function clone<T>(value: T): T {
  return structuredClone(value);
}

export function energyCapacity(s: GameState): number {
  return s.fossilCapacity + s.renewableCapacity;
}

export function energyReserve(s: GameState): number {
  const cap = energyCapacity(s);
  if (s.energyDemand <= 0.1) return 1;
  return (cap - s.energyDemand) / s.energyDemand;
}

export function debtRatio(s: GameState): number {
  return s.gdp > 0.1 ? s.debt / s.gdp : 0;
}

export function gdpPerCapita(s: GameState): number {
  return s.population > 0 ? (s.gdp * 1000) / s.population : 0;
}

export function budgetTotal(b: BudgetAlloc): number {
  return (
    b.economy +
    b.energy +
    b.industry +
    b.tech +
    b.defense +
    b.education +
    b.infrastructure
  );
}

export function normalizeBudget(b: BudgetAlloc): BudgetAlloc {
  const t = budgetTotal(b);
  if (t <= 0) {
    return {
      economy: 1 / 7,
      energy: 1 / 7,
      industry: 1 / 7,
      tech: 1 / 7,
      defense: 1 / 7,
      education: 1 / 7,
      infrastructure: 1 / 7,
    };
  }
  return {
    economy: b.economy / t,
    energy: b.energy / t,
    industry: b.industry / t,
    tech: b.tech / t,
    defense: b.defense / t,
    education: b.education / t,
    infrastructure: b.infrastructure / t,
  };
}

export function interestRate(s: GameState): number {
  const ratio = debtRatio(s);
  return clamp(0.02 + Math.max(0, ratio - 0.55) * 0.028 + s.inflation * 0.12, 0.016, 0.12);
}

export function stanceFromRelation(rel: number): import("./types").RelationStance {
  if (rel < 15) return "hostile";
  if (rel < 30) return "tense";
  if (rel < 42) return "cool";
  if (rel < 58) return "neutral";
  if (rel < 72) return "cordial";
  if (rel < 86) return "friendly";
  return "allied";
}

export function applyPatch(s: GameState, patch: Partial<NumericPatch>): GameState {
  const next = { ...s };
  const keys = Object.keys(patch) as (keyof NumericPatch)[];
  for (const key of keys) {
    const delta = patch[key];
    if (delta === undefined) continue;
    (next as unknown as Record<string, number>)[key] =
      ((s as unknown as Record<string, number>)[key] ?? 0) + delta;
  }
  return next;
}

export function pushLog(
  s: GameState,
  kind: GameState["log"][number]["kind"],
  title: string,
  detail: string,
): GameState {
  return {
    ...s,
    log: [...s.log, { year: s.year, kind, title, detail }].slice(-200),
  };
}

export function boundedState(s: GameState): GameState {
  const industries = { ...s.industries };
  (Object.keys(industries) as (keyof typeof industries)[]).forEach((k) => {
    industries[k] = clamp100(industries[k]);
  });
  const defense = { ...s.defense };
  (Object.keys(defense) as (keyof typeof defense)[]).forEach((k) => {
    defense[k] = clamp100(defense[k]);
  });
  return {
    ...s,
    gdp: clamp(s.gdp, 8, 8000),
    treasury: clamp(s.treasury, 0, 2000),
    debt: clamp(s.debt, 0, 12000),
    inflation: clamp(s.inflation, -0.02, 0.45),
    unemployment: clamp(s.unemployment, 0.015, 0.42),
    stability: clamp100(s.stability),
    approval: clamp100(s.approval),
    humanCapital: clamp100(s.humanCapital),
    educationQuality: clamp100(s.educationQuality),
    research: clamp100(s.research),
    technology: clamp100(s.technology),
    computing: clamp100(s.computing),
    dataCenters: clamp100(s.dataCenters),
    semiconductors: clamp100(s.semiconductors),
    aiCapability: clamp100(s.aiCapability),
    automation: clamp100(s.automation),
    roboticsTech: clamp100(s.roboticsTech),
    cybersecurity: clamp100(s.cybersecurity),
    spaceTech: clamp100(s.spaceTech),
    fossilCapacity: clamp(s.fossilCapacity, 1, 400),
    renewableCapacity: clamp(s.renewableCapacity, 0, 400),
    energyDemand: clamp(s.energyDemand, 1, 500),
    energyCost: clamp(s.energyCost, 0.2, 4),
    grid: clamp100(s.grid),
    industrialCapacity: clamp100(s.industrialCapacity),
    supplyChain: clamp100(s.supplyChain),
    productivity: clamp(s.productivity, 0.4, 4),
    exports: clamp(s.exports, 1, 4000),
    imports: clamp(s.imports, 1, 4000),
    roads: clamp100(s.roads),
    rail: clamp100(s.rail),
    ports: clamp100(s.ports),
    airports: clamp100(s.airports),
    logistics: clamp100(s.logistics),
    digital: clamp100(s.digital),
    infrastructure: clamp100(s.infrastructure),
    militaryPower: clamp100(s.militaryPower),
    deterrence: clamp100(s.deterrence),
    influence: clamp100(s.influence),
    population: clamp(s.population, 8, 120),
    taxRate: clamp(s.taxRate, 0.08, 0.42),
    spendRate: clamp(s.spendRate, 0.1, 0.4),
    industries,
    defense,
    nations: s.nations.map((n) => ({
      ...n,
      relation: clamp100(n.relation),
      gdp: clamp(n.gdp, 20, 20000),
      tech: clamp100(n.tech),
      military: clamp100(n.military),
      energy: clamp100(n.energy),
      tradeVolume: clamp(n.tradeVolume, 0, 400),
    })),
  };
}

export function assertFinite(s: GameState): string[] {
  const errors: string[] = [];
  const scan = (obj: unknown, path: string) => {
    if (typeof obj === "number") {
      if (!Number.isFinite(obj)) errors.push(path);
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach((v, i) => scan(v, `${path}[${i}]`));
      return;
    }
    if (obj && typeof obj === "object") {
      for (const [k, v] of Object.entries(obj)) scan(v, path ? `${path}.${k}` : k);
    }
  };
  scan(s, "state");
  return errors;
}
