import { DECISIONS } from "../data/decisions";
import { EVENTS } from "../data/events";
import { HISTORY_LIMIT, MIN_VICTORY_YEAR } from "./balance";
import { yearlyProjectCost, tickProjects } from "./projects";
import { yearRng } from "./rng";
import type { Ending, GameState, HistoryPoint, PendingDecision, YearReport } from "./types";
import {
  applyPatch,
  assertFinite,
  boundedState,
  budgetTotal,
  clamp,
  clamp100,
  debtRatio,
  dim,
  energyCapacity,
  energyReserve,
  gdpPerCapita,
  interestRate,
  mean,
  normalizeBudget,
  pushLog,
} from "./util";
import { tickWorld } from "./world";

export function snapshotPoint(s: GameState): HistoryPoint {
  return {
    year: s.year,
    gdp: s.gdp,
    growth: s.gdpGrowth,
    debt: s.debt,
    debtRatio: debtRatio(s),
    population: s.population,
    unemployment: s.unemployment,
    inflation: s.inflation,
    stability: s.stability,
    approval: s.approval,
    energyCapacity: energyCapacity(s),
    energyDemand: s.energyDemand,
    industrialCapacity: s.industrialCapacity,
    technology: s.technology,
    aiCapability: s.aiCapability,
    computing: s.computing,
    education: s.humanCapital,
    military: s.militaryPower,
    influence: s.influence,
    revenue: s.revenue,
    expenditure: s.expenditure,
  };
}

export function endYear(state: GameState): GameState {
  if (state.ending) return state;
  if (state.pendingDecisions.length > 0) {
    return pushLog(state, "warning", "قرارات معلّقة", "يجب حسم القرارات المعروضة قبل إنهاء السنة.");
  }

  const before = {
    gdp: state.gdp,
    population: state.population,
    tech: state.technology,
    ai: state.aiCapability,
    industry: state.industrialCapacity,
    logLen: state.log.length,
  };

  let s = boundedState({
    ...state,
    year: state.year + 1,
    turn: state.turn + 1,
    budget: normalizeBudget(state.budget),
    showReport: false,
  });

  s = applyDueEffects(s);
  s = tickEducation(s);
  s = tickInfrastructure(s);
  s = tickProjects(s);
  s = tickEnergy(s);
  s = tickIndustry(s);
  s = tickTechnology(s);
  s = tickDefense(s);
  s = tickEconomy(s);
  s = tickPopulation(s);
  s = tickStability(s);
  s = tickWorld(s, yearRng(s.seed, s.year, 2));
  s = rollEvents(s, yearRng(s.seed, s.year, 3));
  s = queueDecisions(s, yearRng(s.seed, s.year, 4));
  s = boundedState(s);
  s = checkEndings(s);

  const history = [...s.history, snapshotPoint(s)].slice(-HISTORY_LIMIT);
  const report = buildReport(s, before);
  s = { ...s, history, lastReport: report, showReport: true };

  const bad = assertFinite(s);
  if (bad.length) {
    s = pushLog(s, "warning", "تصحيح حسابي", "أُعيد ضبط قيم غير صالحة بعد المحاكاة.");
    s = boundedState(s);
  }
  return s;
}

function applyDueEffects(s: GameState): GameState {
  const due = s.delayedEffects.filter((e) => e.year <= s.year);
  const later = s.delayedEffects.filter((e) => e.year > s.year);
  let next = { ...s, delayedEffects: later };
  for (const effect of due) {
    next = applyPatch(next, effect.deltas);
    next = pushLog(next, "system", "أثر مؤجل", effect.label);
  }
  return next;
}

function spend(s: GameState, key: keyof GameState["budget"]): number {
  const disc = s.gdp * s.spendRate;
  return disc * (s.budget[key] / Math.max(0.01, budgetTotal(s.budget)));
}

function tickEducation(s: GameState): GameState {
  const eduSpend = spend(s, "education") / Math.max(8, s.gdp * 0.03);
  const gain = dim(eduSpend, 1.6) * 2.4;
  const quality = s.educationQuality * 0.97 + gain + (s.research / 100) * 0.4;
  const hc =
    s.humanCapital * 0.975 +
    (quality - s.humanCapital) * 0.07 +
    gain * 0.35 +
    (s.aiCapability > 30 ? 0.2 : 0);
  const delayed =
    gain > 0.8
      ? [
          ...s.delayedEffects,
          {
            id: `edu-${s.year}`,
            year: s.year + 3,
            label: "نضج الاستثمار التعليمي",
            deltas: { humanCapital: Math.min(3.2, gain * 0.7), research: Math.min(1.6, gain * 0.35) },
          },
        ]
      : s.delayedEffects;
  return { ...s, educationQuality: quality, humanCapital: hc, delayedEffects: delayed };
}

function tickInfrastructure(s: GameState): GameState {
  const infSpend = spend(s, "infrastructure") / Math.max(8, s.gdp * 0.03);
  const g = dim(infSpend, 1.5) * 2.1;
  const decay = 0.55;
  const roads = s.roads + g * 0.9 - decay;
  const rail = s.rail + g * 0.35 - decay * 0.4;
  const ports = s.ports + g * 0.25 - decay * 0.35;
  const airports = s.airports + g * 0.2 - decay * 0.3;
  const logistics = s.logistics + g * 0.45 - decay * 0.4;
  const digital = s.digital + g * 0.3 + spend(s, "tech") / Math.max(20, s.gdp) * 4 - 0.35;
  const infrastructure =
    roads * 0.28 + rail * 0.14 + ports * 0.16 + airports * 0.1 + logistics * 0.18 + digital * 0.14;
  return { ...s, roads, rail, ports, airports, logistics, digital, infrastructure };
}

function tickEnergy(s: GameState): GameState {
  const costs = yearlyProjectCost(s);
  const industryLoad = s.industrialCapacity * 0.082;
  const computeLoad = s.computing * 0.05 + s.dataCenters * 0.085 + s.aiCapability * 0.048;
  const popLoad = s.population * 0.3;
  const digitalLoad = s.digital * 0.018;
  const raw = popLoad + industryLoad + computeLoad + digitalLoad + costs.energy + s.spendRate * 4;
  const gridFactor = 1.18 - (s.grid / 100) * 0.22;
  const demand = raw * gridFactor;
  const cap = energyCapacity(s);
  const reserve = (cap - demand) / Math.max(0.5, demand);
  const fossilShare = s.fossilCapacity / Math.max(1, cap);
  const energyCost =
    0.45 +
    fossilShare * 0.5 * s.flags.oilPrice +
    Math.max(0, -reserve) * 0.9 +
    Math.max(0, 0.08 - reserve) * 0.35 -
    (s.renewableCapacity / Math.max(1, cap)) * 0.12;

  let industrialCapacity = s.industrialCapacity;
  let approval = s.approval;
  let gdp = s.gdp;
  if (reserve < 0) {
    const miss = Math.min(0.35, -reserve);
    industrialCapacity -= miss * 6;
    approval -= miss * 14;
    gdp *= 1 - miss * 0.04;
  } else if (reserve < 0.08) {
    industrialCapacity -= 0.6;
    approval -= 1.4;
  }

  const flags =
    reserve < 0.04
      ? { ...s.flags, yearsOfEnergyCrisis: s.flags.yearsOfEnergyCrisis + 1 }
      : { ...s.flags, yearsOfEnergyCrisis: 0 };

  return { ...s, energyDemand: demand, energyCost, industrialCapacity, approval, gdp, flags };
}

function tickIndustry(s: GameState): GameState {
  const power = energyReserve(s);
  const powerMul = power < 0 ? 0.25 : power < 0.08 ? 0.62 : 1;
  const spendN = spend(s, "industry") / Math.max(9, s.gdp * 0.03);
  const baseGain = dim(spendN, 1.4) * 2.2 * powerMul * (0.7 + s.infrastructure / 250) * (0.75 + s.humanCapital / 280);
  const ind = { ...s.industries };

  ind.basic += baseGain * 1.1 - 0.35;
  if (ind.basic > 22 && s.humanCapital > 28 && s.technology > 18) ind.advanced += baseGain * 0.7 - 0.3;
  else ind.advanced -= 0.15;
  if (ind.basic > 24 && s.infrastructure > 30) ind.automotive += baseGain * 0.55 - 0.25;
  if (ind.advanced > 18 && s.technology > 24) {
    ind.defense += baseGain * 0.45 + spend(s, "defense") / Math.max(40, s.gdp) * 3 - 0.2;
    ind.electronics += baseGain * 0.5 + (s.computing / 80) * 0.4 - 0.2;
  }
  if (ind.electronics > 22 && s.research > 32 && s.humanCapital > 48 && s.semiconductors > 22 && power > 0.05) {
    ind.semiconductor += baseGain * 0.35 + s.research / 90 - 0.15;
  } else {
    ind.semiconductor -= 0.08;
  }
  if (ind.electronics > 20 && s.aiCapability > 18 && s.humanCapital > 45) {
    ind.robotics += baseGain * 0.3 + s.automation / 80 - 0.12;
  }
  if (ind.advanced > 28 && s.technology > 42 && s.spaceTech > 8) {
    ind.aerospace += baseGain * 0.25 - 0.1;
  }

  const industrialCapacity =
    ind.basic * 0.18 +
    ind.advanced * 0.16 +
    ind.automotive * 0.1 +
    ind.defense * 0.1 +
    ind.electronics * 0.12 +
    ind.semiconductor * 0.14 +
    ind.robotics * 0.1 +
    ind.aerospace * 0.1;

  const supplyChain =
    s.supplyChain * 0.9 +
    s.logistics * 0.08 +
    s.ports * 0.04 +
    (s.nations.filter((n) => n.deals.trade).length) * 0.7 -
    (s.flags.chipAccessShock > 0 ? 3 : 0) -
    0.4;

  return { ...s, industries: ind, industrialCapacity, supplyChain };
}

function tickTechnology(s: GameState): GameState {
  const techSpend = spend(s, "tech") / Math.max(8, s.gdp * 0.025);
  const power = energyReserve(s);
  const energyOk = power < 0 ? 0.35 : power < 0.06 ? 0.7 : 1;
  const chip = (s.semiconductors / 100) * (s.flags.chipAccessShock > 0 ? 0.55 : 1);
  const astoria = s.nations.find((n) => n.id === "astoria");
  const chipAccess = chip * (astoria?.deals.exportBan ? 0.6 : 1) * (astoria?.deals.tech ? 1.15 : 1);

  const research =
    s.research * 0.96 +
    dim(techSpend, 1.3) * 1.8 +
    s.humanCapital * 0.03 +
    s.aiCapability * 0.02;

  const computing =
    s.computing * 0.97 +
    s.dataCenters * 0.08 +
    dim(techSpend, 1.2) * 1.4 * energyOk +
    (s.digital / 80) * 0.8;

  const technology =
    s.technology * 0.97 +
    research * 0.045 +
    computing * 0.03 +
    dim(techSpend, 1.4) * 1.2;

  const aiRaw =
    (computing / 90) *
    energyOk *
    (0.35 + chipAccess) *
    (0.4 + s.humanCapital / 140) *
    (0.45 + research / 140);
  const aiCapability = s.aiCapability * 0.96 + aiRaw * 7 + dim(techSpend, 1.1) * 0.8 * energyOk;

  const autoTarget = aiCapability * 0.72 + s.roboticsTech * 0.2;
  const automation = s.automation + (autoTarget - s.automation) * 0.16;
  const roboticsTech = s.roboticsTech * 0.98 + s.industries.robotics * 0.04 + aiCapability * 0.02;
  const cybersecurity = s.cybersecurity * 0.97 + spend(s, "defense") / Math.max(50, s.gdp) * 2 + s.digital * 0.02 + (s.defense.cyber / 40);
  const spaceTech = s.spaceTech * 0.985 + s.industries.aerospace * 0.03 + technology * 0.01;
  const semiconductors = s.semiconductors * 0.975 + s.industries.semiconductor * 0.08 + (astoria?.deals.tech ? 0.6 : 0) - (astoria?.deals.exportBan ? 1.4 : 0);

  let unemployment = s.unemployment;
  const autoJump = automation - s.automation;
  if (autoJump > 3.2) unemployment += 0.008;
  if (autoJump > 5) unemployment += 0.01;

  const productivity =
    s.productivity * 0.9 +
    0.1 *
      (0.75 +
        s.humanCapital / 180 +
        s.infrastructure / 220 +
        automation / 160 +
        s.industrialCapacity / 200 +
        aiCapability / 250);

  return {
    ...s,
    research,
    computing,
    technology,
    aiCapability,
    automation,
    roboticsTech,
    cybersecurity,
    spaceTech,
    semiconductors,
    unemployment,
    productivity,
  };
}

function tickDefense(s: GameState): GameState {
  const dSpend = spend(s, "defense") / Math.max(9, s.gdp * 0.03);
  const g = dim(dSpend, 1.35) * 2.0 * (0.7 + s.technology / 200) * (0.75 + s.humanCapital / 250);
  const d = { ...s.defense };
  d.army += g * 0.7 - 0.45;
  d.air += g * 0.45 + s.industries.aerospace * 0.02 - 0.35;
  d.airDefense += g * 0.4 + s.technology * 0.01 - 0.3;
  d.navy += g * 0.3 + s.ports * 0.015 - 0.25;
  d.missiles += g * 0.28 + s.technology * 0.012 - 0.22;
  d.drones += g * 0.35 + s.industries.electronics * 0.02 - 0.22;
  d.cyber += g * 0.3 + s.cybersecurity * 0.04 - 0.2;
  d.space += g * 0.15 + s.spaceTech * 0.04 - 0.12;
  d.domestic += s.industries.defense * 0.06 + g * 0.2 - 0.2;

  const militaryPower =
    d.army * 0.16 +
    d.air * 0.12 +
    d.airDefense * 0.1 +
    d.navy * 0.1 +
    d.missiles * 0.12 +
    d.drones * 0.1 +
    d.cyber * 0.1 +
    d.space * 0.08 +
    d.domestic * 0.12;

  const deterrence =
    militaryPower * 0.62 +
    d.missiles * 0.12 +
    d.cyber * 0.08 +
    s.influence * 0.08 +
    (s.nations.some((n) => n.deals.defense) ? 4 : 0);

  const importDepend = Math.max(0, 1 - d.domestic / 80);
  const extraOpex = militaryPower * 0.012 * (0.6 + importDepend);

  return { ...s, defense: d, militaryPower, deterrence, expenditure: s.expenditure + extraOpex };
}

function tickEconomy(s: GameState): GameState {
  const costs = yearlyProjectCost(s);
  const collect =
    0.86 +
    s.technology / 500 +
    s.stability / 700 +
    s.aiCapability / 800 -
    Math.max(0, s.inflation - 0.1) * 0.45;
  const revenue = s.gdp * s.taxRate * clamp(collect, 0.72, 0.97);
  const service = s.debt * interestRate(s);
  const discretionary = s.gdp * s.spendRate;
  const expenditure = discretionary + service + costs.capex + costs.opex;
  const deficit = expenditure - revenue;

  let treasury = s.treasury;
  let debt = s.debt;
  if (deficit > 0) {
    const fromCash = Math.min(treasury, deficit);
    treasury -= fromCash;
    debt += deficit - fromCash;
  } else {
    const surplus = -deficit;
    const pay = Math.min(debt, surplus * 0.7);
    debt -= pay;
    treasury += surplus - pay;
  }

  const reserve = energyReserve(s);
  const energyDrag = reserve < 0 ? 0.028 + Math.min(0.05, -reserve * 0.1) : reserve < 0.08 ? 0.01 : 0;
  const debtDrag = Math.max(0, debt / s.gdp - 0.75) * 0.016;
  const inflDrag = Math.max(0, s.inflation - 0.055) * 0.14;
  const conv = Math.max(0, gdpPerCapita(s) - 2800) / 14000 * 0.028;
  const trade = (s.exports - s.imports) / Math.max(20, s.gdp);
  const econSpend = spend(s, "economy") / Math.max(10, s.gdp * 0.03);

  let growth =
    0.014 +
    s.flags.globalGrowth * 0.28 +
    dim(econSpend, 1.2) * 0.012 +
    (s.productivity - 0.9) * 0.018 +
    (s.industrialCapacity - 24) / 100 * 0.016 +
    (s.infrastructure - 30) / 100 * 0.012 +
    (s.aiCapability / 100) * 0.01 * (s.humanCapital / 100) +
    trade * 0.03 +
    (s.stability - 50) / 100 * 0.01 -
    debtDrag -
    energyDrag -
    inflDrag -
    conv -
    Math.max(0, s.unemployment - 0.09) * 0.05;

  if (s.flags.austerityYears > 0) growth -= 0.006;
  if (s.flags.stimulusYears > 0) growth += 0.005;

  growth = clamp(growth, -0.085, 0.105);
  const gdp = s.gdp * (1 + growth);

  const demandPull = Math.max(0, s.spendRate - 0.21) * 0.07 + Math.max(0, growth - 0.035) * 0.12;
  const costPush = (s.energyCost - 1) * 0.018 + Math.max(0, -reserve) * 0.045;
  const slack = (0.075 - s.unemployment) * 0.07;
  const inflation = clamp(s.inflation * 0.64 + (0.028 + demandPull + costPush + slack) * 0.36, -0.015, 0.4);

  const exportBase =
    4 +
    s.industrialCapacity * 0.28 +
    s.ports * 0.08 +
    s.logistics * 0.06 +
    s.nations.reduce((a, n) => a + (n.deals.trade ? n.tradeVolume * 0.35 : n.tradeVolume * 0.08), 0);
  const importBase =
    6 +
    s.population * 0.35 +
    s.industrialCapacity * 0.16 +
    (1 - s.defense.domestic / 100) * 3 +
    s.energyCost * 2.2 * (s.fossilCapacity / Math.max(1, energyCapacity(s)));

  const investment =
    s.gdp * 0.16 * (0.7 + s.stability / 200) * (0.8 + (1 - Math.min(1, debt / s.gdp)) * 0.25) +
    dim(econSpend, 1) * 3;

  return {
    ...s,
    gdp,
    gdpGrowth: growth,
    revenue,
    expenditure,
    deficit,
    treasury,
    debt,
    inflation,
    exports: exportBase * (1 + growth),
    imports: importBase * (1 + Math.max(0, s.spendRate - 0.15)),
    investment,
    flags: {
      ...s.flags,
      austerityYears: Math.max(0, s.flags.austerityYears - 1),
      stimulusYears: Math.max(0, s.flags.stimulusYears - 1),
      lastGdpGrowth: growth,
      consecutiveGrowth: growth > 0.008 ? s.flags.consecutiveGrowth + 1 : 0,
      consecutiveDecline: growth < -0.01 ? s.flags.consecutiveDecline + 1 : 0,
    },
  };
}

function tickPopulation(s: GameState): GameState {
  const birth = 0.018 - s.humanCapital * 0.00004 + Math.max(0, 50 - s.approval) * 0.00002;
  const pop = s.population * (1 + clamp(birth, 0.006, 0.028));
  const jobs =
    0.078 -
    s.industrialCapacity / 900 -
    s.infrastructure / 1400 +
    s.automation / 900 -
    spend(s, "economy") / Math.max(80, s.gdp) +
    Math.max(0, 0.04 - energyReserve(s)) * 0.08;
  const unemployment = s.unemployment * 0.72 + jobs * 0.28;
  return { ...s, population: pop, unemployment };
}

function tickStability(s: GameState): GameState {
  let approval =
    s.approval +
    s.gdpGrowth * 28 +
    (s.educationQuality - 35) * 0.03 +
    (s.infrastructure - 30) * 0.02 -
    s.inflation * 22 -
    (s.unemployment - 0.08) * 28 -
    Math.max(0, s.taxRate - 0.22) * 16 -
    (energyReserve(s) < 0 ? 3 : 0) -
    Math.max(0, debtRatio(s) - 1.1) * 3 +
    (s.spendRate > 0.24 ? 0.8 : 0);

  if (s.flags.austerityYears > 0) approval -= 1.2;

  const security = s.deterrence / 40 + (s.flags.tension > 55 ? -2 : 0);
  const stability =
    s.stability * 0.78 +
    approval * 0.16 +
    security * 2 +
    (s.unemployment < 0.1 ? 1 : -1.4) +
    (s.inflation < 0.08 ? 0.6 : -2);

  return { ...s, approval: clamp100(approval), stability: clamp100(stability) };
}

function rollEvents(s: GameState, rng: () => number): GameState {
  const weighted = EVENTS.map((e) => ({ e, w: Math.max(0, e.weight(s)) })).filter((x) => x.w > 0);
  const total = weighted.reduce((a, x) => a + x.w, 0);
  if (total <= 0) return s;
  const count = rng() < 0.22 ? 2 : rng() < 0.78 ? 1 : 0;
  let next = s;
  const used = new Set<string>();
  for (let i = 0; i < count; i++) {
    const pickAt = rng() * weighted.reduce((a, x) => (used.has(x.e.id) ? a : a + x.w), 0);
    let acc = 0;
    let chosen = weighted.find((x) => !used.has(x.e.id))?.e;
    for (const x of weighted) {
      if (used.has(x.e.id)) continue;
      acc += x.w;
      if (acc >= pickAt) {
        chosen = x.e;
        break;
      }
    }
    if (!chosen) break;
    used.add(chosen.id);
    next = chosen.apply(next, rng);
  }
  return next;
}

export function queueDecisions(s: GameState, rng: () => number): GameState {
  if (s.pendingDecisions.length > 0) return s;
  const pool = DECISIONS.filter((d) => !s.resolvedDecisionIds.slice(-8).includes(d.id));
  const weighted = pool.map((d) => ({ d, w: Math.max(0, d.weight(s)) })).filter((x) => x.w > 0.05);
  if (!weighted.length) return s;
  const want = rng() < 0.18 ? 2 : rng() < 0.82 ? 1 : 0;
  const pending: PendingDecision[] = [];
  const used = new Set<string>();
  for (let i = 0; i < want; i++) {
    const live = weighted.filter((x) => !used.has(x.d.id));
    const tot = live.reduce((a, x) => a + x.w, 0);
    if (tot <= 0) break;
    let acc = 0;
    const pickAt = rng() * tot;
    let chosen = live[0]!.d;
    for (const x of live) {
      acc += x.w;
      if (acc >= pickAt) {
        chosen = x.d;
        break;
      }
    }
    used.add(chosen.id);
    pending.push({
      id: chosen.id,
      title: chosen.title,
      body: chosen.body,
      urgency: chosen.urgency ?? "normal",
      choices: chosen.choices.map((c) => ({ id: c.id, label: c.label, hint: c.hint })),
    });
  }
  return { ...s, pendingDecisions: pending };
}

export function applyDecision(s: GameState, decisionId: string, choiceId: string): GameState {
  const def = DECISIONS.find((d) => d.id === decisionId);
  if (!def) return s;
  const choice = def.choices.find((c) => c.id === choiceId);
  if (!choice) return s;
  const rng = yearRng(s.seed, s.year, 9 + s.resolvedDecisionIds.length);
  let next = choice.apply(s, rng);
  next = {
    ...next,
    budget: normalizeBudget(next.budget),
    pendingDecisions: next.pendingDecisions.filter((d) => d.id !== decisionId),
    resolvedDecisionIds: [...next.resolvedDecisionIds, decisionId].slice(-40),
  };
  return boundedState(next);
}

function recentAvg(s: GameState, key: keyof HistoryPoint, n: number): number {
  const slice = s.history.slice(-n);
  if (!slice.length) return 0;
  return mean(slice.map((h) => Number(h[key])));
}

function checkEndings(s: GameState): GameState {
  const ratio = debtRatio(s);
  const flags = { ...s.flags };
  flags.yearsOfHighDebt = ratio > 1.9 ? flags.yearsOfHighDebt + 1 : 0;
  flags.yearsOfInstability = s.stability < 16 ? flags.yearsOfInstability + 1 : 0;
  flags.yearsOfDecline = s.gdpGrowth < -0.04 ? flags.yearsOfDecline + 1 : 0;

  let ending: Ending | null = null;
  if (flags.yearsOfHighDebt >= 4) {
    ending = {
      type: "defeat",
      path: "debt",
      title: "انهيار الجدارة السيادية",
      body: "تجاوز الدين قدرة الدولة على الخدمة ثلاث سنوات متتالية. توقفت الأسواق عن التمويل وتفككت أدوات السياسة.",
    };
  } else if (flags.yearsOfInstability >= 2) {
    ending = {
      type: "defeat",
      path: "stability",
      title: "انهيار الاستقرار",
      body: "لم تعد مؤسسات الدولة قادرة على حفظ الحد الأدنى من النظام. انتهى العهد وسط اضطراب شامل.",
    };
  } else if (flags.yearsOfDecline >= 3) {
    ending = {
      type: "defeat",
      path: "collapse",
      title: "انهيار اقتصادي متتابع",
      body: "ثلاث سنوات من الانكماش الحاد أكلت النسيج الإنتاجي وثقة المجتمع.",
    };
  } else if (flags.yearsOfEnergyCrisis >= 4 && s.infrastructure < 18) {
    ending = {
      type: "defeat",
      path: "infra",
      title: "عجز البنية والطاقة",
      body: "تراكمت أعطال الشبكة والبنية حتى توقفت الدورة الاقتصادية عن العمل بحدّها الأدنى.",
    };
  } else if (s.approval < 12 && s.stability < 22) {
    ending = {
      type: "defeat",
      path: "legitimacy",
      title: "فقدان الشرعية",
      body: "اجتمع السخط الشعبي مع هشاشة الدولة. لم يعد ممكناً الاستمرار في الحكم بهذا المسار.",
    };
  }

  if (!ending && s.year >= MIN_VICTORY_YEAR) {
    const avgGrowth = recentAvg(s, "growth", 5);
    const economic =
      s.gdp >= 320 && avgGrowth >= 0.018 && ratio <= 0.65 && s.exports >= 55 && s.inflation < 0.07;
    const industrial =
      s.industrialCapacity >= 68 &&
      Object.values(s.industries).filter((v) => v >= 45).length >= 4 &&
      (s.industries.semiconductor >= 48 || s.industries.advanced >= 55);
    const tech =
      s.aiCapability >= 60 && s.computing >= 58 && s.technology >= 64 && s.semiconductors >= 48;
    const social =
      s.humanCapital >= 70 && s.approval >= 66 && s.unemployment <= 0.068 && s.stability >= 70;
    const military = s.militaryPower >= 64 && s.deterrence >= 58 && s.defense.domestic >= 44;
    const balanced =
      s.gdp >= 220 &&
      s.industrialCapacity >= 52 &&
      s.technology >= 52 &&
      s.humanCapital >= 56 &&
      s.militaryPower >= 46 &&
      s.stability >= 64 &&
      ratio <= 0.85 &&
      s.aiCapability >= 28;

    if (economic) {
      ending = {
        type: "victory",
        path: "economy",
        title: "قوة اقتصادية عالمية",
        body: "تحولت سندار إلى اقتصاد وازن: ناتج كبير، دين منضبط، وصادرات تفرض حضورها في الأسواق.",
      };
    } else if (industrial) {
      ending = {
        type: "victory",
        path: "industry",
        title: "قوة صناعية",
        body: "بُنيت قاعدة صناعية متنوعة قادرة على إنتاج قيمة مضافة حقيقية لا مجرد تجميع.",
      };
    } else if (tech) {
      ending = {
        type: "victory",
        path: "tech",
        title: "قوة تقنية وذكاء اصطناعي",
        body: "امتلكت سندار حوسبة وذكاءً اصطناعياً ورقائق تجعلها طرفاً في سباق التقنية لا متفرجاً عليه.",
      };
    } else if (social) {
      ending = {
        type: "victory",
        path: "society",
        title: "مجتمع عالي التنمية",
        body: "التعليم والعمل والاستقرار صنعت عقداً اجتماعياً متيناً قبل الأبهة الصناعية.",
      };
    } else if (military) {
      ending = {
        type: "victory",
        path: "military",
        title: "قوة عسكرية مؤثرة",
        body: "الردع المحلي والصناعة الدفاعية منحا سندار صوتاً لا يُتجاهل في معادلات الإقليم.",
      };
    } else if (balanced) {
      ending = {
        type: "victory",
        path: "balanced",
        title: "دولة متوازنة ومتقدمة",
        body: "لم تتفوق سندار في باب واحد فقط، بل بنت تقدماً متماسكاً عبر الاقتصاد والمجتمع والأمن والتقنية.",
      };
    }
  }

  return { ...s, flags, ending };
}

function buildReport(s: GameState, before: { gdp: number; population: number; tech: number; ai: number; industry: number; logLen: number }): YearReport {
  const newLogs = s.log.slice(before.logLen);
  const events = newLogs.filter((l) => l.kind === "event").map((l) => l.title);
  const completedProjects = newLogs.filter((l) => l.title.startsWith("اكتمال") || l.title.startsWith("بدء") === false && l.kind === "project" && l.title.startsWith("اكتمال")).map((l) => l.detail);
  const completed = newLogs.filter((l) => l.kind === "project" && l.title.startsWith("اكتمال")).flatMap((l) => l.detail.split("، "));
  const worldNews = newLogs.filter((l) => l.kind === "diplomacy").map((l) => l.detail || l.title);
  const warnings = newLogs.filter((l) => l.kind === "warning").map((l) => l.detail || l.title);
  const causes: string[] = [];
  if (s.gdpGrowth < 0) causes.push("النمو سالب بفعل طاقة أو دين أو صدمة خارجية.");
  if (energyReserve(s) < 0.05) causes.push("هامش الكهرباء ضعيف ويكبح الصناعة.");
  if (debtRatio(s) > 0.85) causes.push("خدمة الدين تقتطع من الاستثمار المنتج.");
  if (s.inflation > 0.1) causes.push("التضخم المرتفع يضعف القدرة الشرائية والاستقرار.");
  if (s.aiCapability - before.ai > 3) causes.push("قفزة في قدرات الذكاء الاصطناعي.");
  if (s.gdpGrowth > 0.04) causes.push("دورة نمو قوية مدعومة بالاستثمار أو التجارة.");
  if (!causes.length) causes.push("التغيرات هذه السنة كانت تدريجية عبر السياسات القائمة.");

  return {
    year: s.year,
    gdpBefore: before.gdp,
    gdpAfter: s.gdp,
    growth: s.gdpGrowth,
    revenue: s.revenue,
    expenditure: s.expenditure,
    deficit: s.deficit,
    debt: s.debt,
    debtRatio: debtRatio(s),
    populationBefore: before.population,
    populationAfter: s.population,
    unemployment: s.unemployment,
    inflation: s.inflation,
    stability: s.stability,
    approval: s.approval,
    completedProjects: completed.length ? completed : completedProjects,
    events,
    techDelta: s.technology - before.tech,
    aiDelta: s.aiCapability - before.ai,
    energyReserve: energyReserve(s),
    industryDelta: s.industrialCapacity - before.industry,
    worldNews,
    warnings,
    causes,
  };
}

export function setBudget(s: GameState, budget: GameState["budget"]): GameState {
  return { ...s, budget: normalizeBudget(budget) };
}

export function setTax(s: GameState, taxRate: number): GameState {
  return { ...s, taxRate: clamp(taxRate, 0.08, 0.42) };
}

export function setSpend(s: GameState, spendRate: number): GameState {
  return { ...s, spendRate: clamp(spendRate, 0.1, 0.4) };
}

export function setLeader(s: GameState, name: string): GameState {
  return { ...s, leaderName: name.trim() || s.leaderName };
}

export function dismissReport(s: GameState): GameState {
  return { ...s, showReport: false };
}
