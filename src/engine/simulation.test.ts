import { describe, expect, it } from "vitest";
import { DECISIONS } from "../data/decisions";
import { applyDecision, canStartProject, createInitialState, endYear, serialize, startProject, validateState } from "./index";
import { assertFinite, debtRatio, energyReserve } from "./util";

function resolveAll(state: ReturnType<typeof createInitialState>) {
  let s = state;
  let guard = 0;
  while (s.pendingDecisions.length && guard++ < 8) {
    const d = s.pendingDecisions[0]!;
    const def = DECISIONS.find((x) => x.id === d.id);
    const preferred =
      def?.choices.find((c) => ["balanced-start", "target", "soft", "governed", "balanced", "status", "retrain", "dialogue", "legal"].includes(c.id)) ??
      def?.choices[Math.min(1, (def.choices.length || 1) - 1)];
    const choice = preferred?.id ?? d.choices[0]!.id;
    s = applyDecision(s, d.id, choice);
  }
  return s;
}

function playYears(years: number, seed = 42) {
  let s = createInitialState({ leaderName: "مختبر", seed });
  const started: string[] = [];
  for (let i = 0; i < years; i++) {
    s = resolveAll(s);
    s = { ...s, taxRate: 0.18, spendRate: 0.185 };
    if (s.activeProjects.length < 2) {
      for (const id of candidateProjects()) {
        const check = canStartProject(s, id);
        if (check.ok) {
          s = startProject(s, id);
          started.push(id);
          break;
        }
      }
    }
    if (energyReserve(s) < 0.1) {
      s = { ...s, budget: { ...s.budget, energy: 0.22, defense: 0.12 } };
    }
    s = endYear(s);
    s = { ...s, showReport: false };
    if (s.ending) break;
  }
  return { s, started };
}

function candidateProjects(): string[] {
  return [
    "gas-plant",
    "schools",
    "tech-institutes",
    "highways",
    "grid-upgrade",
    "solar-complex",
    "basic-city",
    "digital-infra",
    "data-center",
    "regional-unis",
    "deep-port",
    "army-mod",
    "advanced-complex",
    "research-uni",
  ];
}

describe("new game", () => {
  it("initializes a valid Arabic nation", () => {
    const s = createInitialState({ leaderName: "ليلى", seed: 7 });
    expect(s.countryName).toBe("جمهورية سندار");
    expect(s.year).toBe(2026);
    expect(s.gdp).toBeGreaterThan(50);
    expect(s.nations).toHaveLength(5);
    expect(s.pendingDecisions.length).toBeGreaterThan(0);
    expect(assertFinite(s)).toEqual([]);
    expect(s.history.length).toBe(1);
  });
});

describe("turn loop", () => {
  it("advances multiple years and keeps state finite", () => {
    const { s } = playYears(8, 99);
    expect(s.year).toBeGreaterThanOrEqual(2033);
    expect(s.turn).toBeGreaterThanOrEqual(7);
    expect(s.gdp).toBeGreaterThan(8);
    expect(s.population).toBeGreaterThan(8);
    expect(assertFinite(s)).toEqual([]);
    expect(s.history.length).toBeGreaterThan(5);
    expect(s.lastReport).not.toBeNull();
  });

  it("starts, progresses, and can complete a short project", () => {
    let s = createInitialState({ seed: 3 });
    s = resolveAll(s);
    expect(canStartProject(s, "gas-plant").ok).toBe(true);
    s = startProject(s, "gas-plant");
    expect(s.activeProjects[0]?.id).toBe("gas-plant");
    const before = s.fossilCapacity;
    for (let i = 0; i < 4; i++) {
      s = resolveAll(s);
      s = endYear(s);
    }
    expect(s.completedProjects).toContain("gas-plant");
    expect(s.fossilCapacity).toBeGreaterThan(before);
  });
});

describe("systems", () => {
  it("energy shortage is possible and bounded", () => {
    let s = createInitialState({ seed: 11 });
    s = { ...s, energyDemand: 40, fossilCapacity: 8, renewableCapacity: 1 };
    s = resolveAll(s);
    s = endYear(s);
    expect(energyReserve(s)).toBeLessThan(0.2);
    expect(s.approval).toBeGreaterThanOrEqual(0);
    expect(assertFinite(s)).toEqual([]);
  });

  it("chip factory is locked behind dependencies", () => {
    const s = createInitialState({ seed: 1 });
    const check = canStartProject(s, "chip-fab");
    expect(check.ok).toBe(false);
  });

  it("delayed effects fire", () => {
    let s = createInitialState({ seed: 21 });
    s = {
      ...s,
      pendingDecisions: [],
      delayedEffects: [
        {
          id: "t1",
          year: 2027,
          label: "اختبار أثر",
          deltas: { humanCapital: 5 },
        },
      ],
    };
    const hc = s.humanCapital;
    s = endYear(s);
    expect(s.humanCapital).toBeGreaterThan(hc + 2);
    expect(s.log.some((l) => l.title === "أثر مؤجل")).toBe(true);
  });

  it("decisions change state", () => {
    let s = createInitialState({ seed: 8 });
    const beforeTax = s.taxRate;
    s = applyDecision(s, "opening", "balanced-start");
    expect(s.pendingDecisions.find((d) => d.id === "opening")).toBeUndefined();
    s = {
      ...s,
      pendingDecisions: [
        {
          id: "tax-reform",
          title: "x",
          body: "x",
          urgency: "normal",
          choices: DECISIONS.find((d) => d.id === "tax-reform")!.choices.map((c) => ({
            id: c.id,
            label: c.label,
            hint: c.hint,
          })),
        },
      ],
    };
    s = applyDecision(s, "tax-reform", "broaden");
    expect(s.taxRate).not.toBe(beforeTax);
  });

  it("nations update over time", () => {
    const { s } = playYears(6, 77);
    expect(s.nations.every((n) => n.lastAction.length > 0)).toBe(true);
    expect(s.nations.every((n) => n.gdp > 20)).toBe(true);
  });
});

describe("save/load", () => {
  it("round-trips important fields", () => {
    let s = createInitialState({ leaderName: "نادر", seed: 55 });
    s = resolveAll(s);
    s = startProject(s, "schools");
    s = endYear(s);
    const loaded = validateState(JSON.parse(serialize(s)));
    expect(loaded).not.toBeNull();
    expect(loaded!.year).toBe(s.year);
    expect(loaded!.leaderName).toBe("نادر");
    expect(loaded!.activeProjects.map((p) => p.id)).toEqual(s.activeProjects.map((p) => p.id));
    expect(loaded!.gdp).toBeCloseTo(s.gdp, 5);
  });

  it("rejects garbage", () => {
    expect(validateState(null)).toBeNull();
    expect(validateState({ version: 99 })).toBeNull();
  });
});

describe("long playthrough", () => {
  it("survives 30 years without exploding or going NaN", () => {
    const { s, started } = playYears(30, 1234);
    expect(assertFinite(s)).toEqual([]);
    expect(s.gdp).toBeLessThan(2500);
    expect(s.gdp).toBeGreaterThan(20);
    expect(debtRatio(s)).toBeLessThan(8);
    expect(s.year - 2026).toBeGreaterThanOrEqual(10);
    expect(started.length).toBeGreaterThan(0);
    expect(s.history.length).toBeGreaterThan(10);
    const growths = s.history.slice(1).map((h) => h.growth);
    expect(Math.max(...growths)).toBeLessThan(0.2);
  });

  it("events occur across a long run", () => {
    const { s } = playYears(25, 2026);
    const events = s.log.filter((l) => l.kind === "event");
    expect(events.length).toBeGreaterThan(0);
  });
});
