import { PROJECT_BY_ID, PROJECTS } from "../data/projects";
import { MAX_ACTIVE_PROJECTS } from "./balance";
import type { GameState, ProjectDef, ProjectReq } from "./types";
import {
  applyPatch,
  boundedState,
  energyReserve,
  pushLog,
} from "./util";

export function projectDef(id: string): ProjectDef | undefined {
  return PROJECT_BY_ID[id];
}

export function allProjects(): ProjectDef[] {
  return PROJECTS;
}

export function reqGaps(s: GameState, req: ProjectReq): string[] {
  const gaps: string[] = [];
  if (req.education !== undefined && s.humanCapital < req.education) {
    gaps.push(`رأس المال البشري ${Math.round(s.humanCapital)} / ${req.education}`);
  }
  if (req.technology !== undefined && s.technology < req.technology) {
    gaps.push(`التقنية ${Math.round(s.technology)} / ${req.technology}`);
  }
  if (req.infrastructure !== undefined && s.infrastructure < req.infrastructure) {
    gaps.push(`البنية ${Math.round(s.infrastructure)} / ${req.infrastructure}`);
  }
  if (req.industry !== undefined && s.industrialCapacity < req.industry) {
    gaps.push(`الصناعة ${Math.round(s.industrialCapacity)} / ${req.industry}`);
  }
  if (req.computing !== undefined && s.computing < req.computing) {
    gaps.push(`الحوسبة ${Math.round(s.computing)} / ${req.computing}`);
  }
  if (req.semiconductors !== undefined && s.semiconductors < req.semiconductors) {
    gaps.push(`الرقائق ${Math.round(s.semiconductors)} / ${req.semiconductors}`);
  }
  if (req.research !== undefined && s.research < req.research) {
    gaps.push(`البحث ${Math.round(s.research)} / ${req.research}`);
  }
  if (req.digital !== undefined && s.digital < req.digital) {
    gaps.push(`الرقمنة ${Math.round(s.digital)} / ${req.digital}`);
  }
  if (req.spaceTech !== undefined && s.spaceTech < req.spaceTech) {
    gaps.push(`الفضاء ${Math.round(s.spaceTech)} / ${req.spaceTech}`);
  }
  if (req.energyReserve !== undefined && energyReserve(s) < req.energyReserve) {
    gaps.push("هامش الطاقة غير كافٍ");
  }
  if (req.industryKey && s.industries[req.industryKey.key] < req.industryKey.min) {
    gaps.push("فرع صناعي غير ناضج بعد");
  }
  for (const pid of req.projects ?? []) {
    if (!s.completedProjects.includes(pid)) {
      const name = PROJECT_BY_ID[pid]?.name ?? pid;
      gaps.push(`يتطلب إكمال: ${name}`);
    }
  }
  return gaps;
}

export function canStartProject(s: GameState, id: string): { ok: true } | { ok: false; reason: string } {
  if (s.ending) return { ok: false, reason: "انتهت اللعبة." };
  const def = PROJECT_BY_ID[id];
  if (!def) return { ok: false, reason: "مشروع غير معروف." };
  if (s.completedProjects.includes(id) || s.activeProjects.some((p) => p.id === id)) {
    return { ok: false, reason: "المشروع قائم أو مكتمل مسبقاً." };
  }
  if (s.activeProjects.length >= MAX_ACTIVE_PROJECTS) {
    return { ok: false, reason: `لا يمكن إدارة أكثر من ${MAX_ACTIVE_PROJECTS} مشاريع في آن.` };
  }
  if (s.humanCapital < def.skilledNeed - 8) {
    return { ok: false, reason: "الكفاءات المتاحة لا تكفي لبدء هذا المشروع بثقة." };
  }
  const gaps = reqGaps(s, def.requires);
  if (gaps.length) return { ok: false, reason: gaps[0]! };
  return { ok: true };
}

export function startProject(s: GameState, id: string): GameState {
  const check = canStartProject(s, id);
  if (!check.ok) return pushLog(s, "warning", "تعذر بدء المشروع", check.reason);
  const def = PROJECT_BY_ID[id]!;
  const delay = s.humanCapital < def.skilledNeed ? 1 : 0;
  const next = pushLog(
    {
      ...s,
      activeProjects: [
        ...s.activeProjects,
        {
          id,
          yearsLeft: def.duration + delay,
          yearsTotal: def.duration + delay,
          spent: 0,
          stalled: false,
        },
      ],
    },
    "project",
    `بدء: ${def.name}`,
    delay
      ? "بدأ الإنشاء مع تمديد سنة لنقص الكفاءات."
      : `مدة متوقعة ${def.duration} سنوات، بتكلفة إجمالية تُصرف على مدى الإنشاء.`,
  );
  return next;
}

export function yearlyProjectCost(s: GameState): { capex: number; opex: number; energy: number } {
  let capex = 0;
  let opex = 0;
  let energy = 0;
  for (const ap of s.activeProjects) {
    const def = PROJECT_BY_ID[ap.id];
    if (!def) continue;
    capex += def.cost / Math.max(1, ap.yearsTotal);
  }
  for (const id of s.completedProjects) {
    const def = PROJECT_BY_ID[id];
    if (!def) continue;
    opex += def.opCost;
    energy += def.energyUse;
  }
  return { capex, opex, energy };
}

export function tickProjects(s: GameState): GameState {
  let next = s;
  const still: GameState["activeProjects"] = [];
  const finished: string[] = [];

  for (const ap of s.activeProjects) {
    const def = PROJECT_BY_ID[ap.id];
    if (!def) continue;
    const slice = def.cost / Math.max(1, ap.yearsTotal);
    const remaining = next.treasury + Math.max(0, next.revenue * 0.15);
    const stall = remaining < slice * 0.25 && next.debt / Math.max(1, next.gdp) > 1.6;
    if (stall) {
      still.push({ ...ap, stalled: true });
      next = pushLog(next, "warning", `تعثر: ${def.name}`, "الضغط المالي أجّل التقدم هذه السنة.");
      continue;
    }
    const yearsLeft = ap.yearsLeft - 1;
    const spent = ap.spent + slice;
    if (yearsLeft <= 0) {
      finished.push(def.name);
      next = completeProject(next, def);
    } else {
      still.push({ ...ap, yearsLeft, spent, stalled: false });
    }
  }

  next = { ...next, activeProjects: still };
  if (finished.length) {
    next = pushLog(next, "project", "اكتمال مشاريع", finished.join("، "));
  }
  return next;
}

function completeProject(s: GameState, def: ProjectDef): GameState {
  let next: GameState = {
    ...s,
    completedProjects: [...s.completedProjects, def.id],
  };
  const patch = { ...def.onComplete };
  delete (patch as { industries?: unknown }).industries;
  delete (patch as { defense?: unknown }).defense;
  next = applyPatch(next, patch);
  if (def.onComplete.industries) {
    next = {
      ...next,
      industries: { ...next.industries },
    };
    for (const [k, v] of Object.entries(def.onComplete.industries)) {
      const key = k as keyof GameState["industries"];
      next.industries[key] = (next.industries[key] ?? 0) + (v ?? 0);
    }
  }
  if (def.onComplete.defense) {
    next = { ...next, defense: { ...next.defense } };
    for (const [k, v] of Object.entries(def.onComplete.defense)) {
      const key = k as keyof GameState["defense"];
      next.defense[key] = (next.defense[key] ?? 0) + (v ?? 0);
    }
  }

  if (def.id === "scholarships") {
    next = {
      ...next,
      flags: { ...next.flags, scholarshipsEver: true },
      delayedEffects: [
        ...next.delayedEffects,
        {
          id: `scholars-${s.year}`,
          year: s.year + 4,
          label: "عودة دفعات الابتعاث",
          deltas: { humanCapital: 7, research: 4, productivity: 0.05 },
        },
        {
          id: `scholars-leak-${s.year}`,
          year: s.year + 4,
          label: "تسرب بعض المبتعثين",
          deltas: s.approval < 40 ? { humanCapital: -2 } : { humanCapital: -0.4 },
        },
      ],
    };
  }
  if (def.id === "schools") {
    next = {
      ...next,
      delayedEffects: [
        ...next.delayedEffects,
        {
          id: `schools-${s.year}`,
          year: s.year + 3,
          label: "أثر المدارس في رأس المال البشري",
          deltas: { humanCapital: 5, productivity: 0.02 },
        },
      ],
    };
  }
  if (def.id === "missile-program") {
    next = {
      ...next,
      nations: next.nations.map((n) => {
        if (n.id === "valen") return { ...n, relation: n.relation - 5, lastAction: "استنكرت برنامج الصواريخ." };
        if (n.id === "astoria") return { ...n, relation: n.relation - 3, lastAction: "راجعت تراخيص التقنية الحساسة." };
        if (n.id === "rimal") return { ...n, relation: n.relation + 2, lastAction: "رأت في الصواريخ مظلة إقليمية محتملة." };
        return n;
      }),
      flags: { ...next.flags, tension: Math.min(95, next.flags.tension + 6) },
    };
  }
  return boundedState(next);
}
