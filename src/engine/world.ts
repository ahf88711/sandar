import { MAX_DIPLO_ACTIONS } from "./balance";
import type { GameState, NationState } from "./types";
import { clamp100, pushLog } from "./util";

export type DiploAction = "improve" | "trade" | "tech" | "defense" | "energy" | "cool";

export const DIPLO_LABELS: Record<DiploAction, string> = {
  improve: "بادرة حسن نية",
  trade: "اتفاق تجاري",
  tech: "شراكة تقنية",
  defense: "تفاهم دفاعي",
  energy: "عقد موارد وطاقة",
  cool: "تبريد العلاقة",
};

export function canDiplo(s: GameState): { ok: true } | { ok: false; reason: string } {
  if (s.ending) return { ok: false, reason: "انتهت اللعبة." };
  if (s.flags.diploActionsThisYear >= MAX_DIPLO_ACTIONS) {
    return { ok: false, reason: "استُنفدت التحركات الدبلوماسية لهذه السنة." };
  }
  return { ok: true };
}

export function diplomaticAction(s: GameState, nationId: string, action: DiploAction): GameState {
  const gate = canDiplo(s);
  if (!gate.ok) return pushLog(s, "warning", "لا يمكن التحرك دبلوماسياً", gate.reason);
  const nation = s.nations.find((n) => n.id === nationId);
  if (!nation) return s;

  let nextNation = { ...nation, deals: { ...nation.deals } };
  let next = { ...s, treasury: s.treasury, influence: s.influence };
  let title = DIPLO_LABELS[action];
  let detail = "";

  switch (action) {
    case "improve": {
      next.treasury -= 0.45;
      nextNation.relation += 5;
      nextNation.lastAction = "تلقّت بادرة حسن نية من سندار.";
      detail = `تحسنت العلاقة مع ${nation.name} مقابل تكلفة دبلوماسية محدودة.`;
      break;
    }
    case "trade": {
      if (nextNation.relation < 40 || nextNation.deals.sanctioned) {
        return pushLog(s, "warning", "رُفض الاتفاق التجاري", "العلاقة أو العقوبات لا تسمح بذلك الآن.");
      }
      nextNation.deals.trade = true;
      nextNation.tradeVolume += 1.6;
      nextNation.relation += 3;
      next.exports += 1.1;
      next.imports += 0.9;
      nextNation.lastAction = "أبرمت اتفاق تبادل تجاري مع سندار.";
      detail = `اتسع التبادل مع ${nation.name}.`;
      break;
    }
    case "tech": {
      if (nation.personality === "technocrat" && nextNation.relation < 58) {
        return pushLog(s, "warning", "رُفضت الشراكة التقنية", "أستوريا لا تشارك تقنيتها دون ثقة أعلى.");
      }
      if (nextNation.relation < 50) {
        return pushLog(s, "warning", "رُفضت الشراكة التقنية", "الثقة غير كافية.");
      }
      nextNation.deals.tech = true;
      nextNation.relation += 4;
      next.semiconductors += nation.personality === "technocrat" ? 6 : 2;
      next.technology += 1.5;
      next.treasury -= 0.8;
      nextNation.lastAction = "وافقت على قناة تعاون تقني مشروطة.";
      detail = `فُتحت قناة تقنية مع ${nation.name} مقابل بعض الاعتماد المتبادل.`;
      break;
    }
    case "defense": {
      if (nextNation.relation < 62) {
        return pushLog(s, "warning", "رُفض التفاهم الدفاعي", "لا يُعقد تفاهم أمني دون علاقة وثيقة.");
      }
      nextNation.deals.defense = true;
      nextNation.relation += 4;
      next.deterrence += 3;
      next.influence += nation.personality === "revisionist" ? -2 : 1;
      next.flags = { ...next.flags, tension: Math.min(95, next.flags.tension + (nation.personality === "revisionist" ? -4 : 4)) };
      nextNation.lastAction = "أبرمت تفاهماً دفاعياً محدوداً.";
      detail = `وُقع تفاهم دفاعي مع ${nation.name}.`;
      if (nationId !== "valen") {
        next.nations = next.nations.map((n) =>
          n.id === "valen" ? { ...n, relation: n.relation - 4, lastAction: "استنكرت التفاهم الأمني." } : n,
        );
      }
      break;
    }
    case "energy": {
      if (nation.personality !== "energy" && nextNation.relation < 48) {
        return pushLog(s, "warning", "رُفض عقد الطاقة", "لا مصلحة واضحة للطرف الآخر.");
      }
      nextNation.deals.energy = true;
      nextNation.relation += 3;
      next.energyCost -= nation.personality === "energy" ? 0.1 : 0.03;
      next.treasury -= 0.6;
      next.fossilCapacity += nation.personality === "energy" ? 0.8 : 0;
      nextNation.lastAction = "ثبّتت عقد إمداد طاقي.";
      detail = `أُبرم ترتيب طاقة مع ${nation.name}.`;
      break;
    }
    case "cool": {
      nextNation.relation -= 6;
      nextNation.deals = {
        ...nextNation.deals,
        trade: false,
        tech: false,
        defense: false,
        energy: false,
      };
      nextNation.tradeVolume = Math.max(0.2, nextNation.tradeVolume * 0.7);
      nextNation.lastAction = "لمست تبريدًا متعمدًا من سندار.";
      detail = `بُرّدت العلاقة مع ${nation.name} وأُلغيت التفاهمات القائمة.`;
      break;
    }
  }

  const nations = (next.nations ?? s.nations).map((n) => (n.id === nationId ? nextNation : n));
  next = {
    ...s,
    ...next,
    nations,
    flags: { ...(next.flags ?? s.flags), diploActionsThisYear: s.flags.diploActionsThisYear + 1 },
  };
  return pushLog(next, "diplomacy", title, detail);
}

export function tickWorld(s: GameState, rng: () => number): GameState {
  let influenceDrift = 0;
  const news: string[] = [];
  const nations = s.nations.map((n) => tickNation(s, n, rng, news));
  for (const n of nations) {
    influenceDrift += (n.relation - 50) * 0.02 + (n.deals.trade ? 0.15 : 0) + (n.deals.defense ? 0.2 : 0);
  }
  const techGap = Math.max(0, ...nations.map((n) => n.tech)) - s.technology;
  const milGap = s.militaryPower - meanMilitary(nations);
  influenceDrift += Math.min(4, s.exports / 40) + (s.aiCapability > 40 ? 1 : 0) - Math.max(0, techGap) * 0.01;
  if (milGap > 15) influenceDrift += 0.4;
  if (s.stability < 35) influenceDrift -= 1.2;

  let next: GameState = {
    ...s,
    nations,
    influence: clamp100(s.influence * 0.92 + 8 + influenceDrift),
    flags: {
      ...s.flags,
      tension: clamp100(s.flags.tension * 0.94 + (nations.find((n) => n.id === "valen")!.relation < 35 ? 4 : 0)),
      globalGrowth: clamp(s.flags.globalGrowth * 0.7 + 0.026 * 0.3 + (rng() - 0.5) * 0.01, -0.02, 0.045),
      oilPrice: clamp(s.flags.oilPrice * 0.85 + 1 * 0.15 + (rng() - 0.5) * 0.12, 0.65, 2.1),
      chipAccessShock: Math.max(0, s.flags.chipAccessShock - 1),
      diploActionsThisYear: 0,
    },
  };
  for (const line of news) {
    next = pushLog(next, "diplomacy", "تحول دولي", line);
  }
  return next;
}

function meanMilitary(nations: NationState[]): number {
  return nations.reduce((a, n) => a + n.military, 0) / Math.max(1, nations.length);
}

function tickNation(s: GameState, n: NationState, rng: () => number, news: string[]): NationState {
  let rel = n.relation;
  let deals = { ...n.deals };
  let tradeVolume = n.tradeVolume * (0.92 + s.gdpGrowth);
  let lastAction = n.lastAction;
  const gdp = n.gdp * (1 + 0.012 + rng() * 0.016);
  const tech = clamp100(n.tech + 0.15 + rng() * 0.25);
  const military = clamp100(n.military + (n.personality === "revisionist" ? 0.35 : 0.12));

  if (deals.trade) rel += 0.6;
  if (deals.sanctioned) {
    rel -= 1.2;
    tradeVolume *= 0.5;
  }

  if (n.personality === "trader") {
    rel += s.exports > 30 ? 0.4 : -0.1;
    if (s.spendRate < 0.16) rel += 0.2;
  }
  if (n.personality === "energy") {
    if (deals.energy) rel += 0.5;
    if (s.renewableCapacity > s.fossilCapacity + 4) rel -= 0.3;
  }
  if (n.personality === "technocrat") {
    if (s.aiCapability > 42 && !deals.tech && rng() < 0.35) {
      deals.exportBan = true;
      deals.tech = false;
      rel -= 5;
      lastAction = "قيّدت تصدير الرقائق المتقدمة إلى سندار.";
      news.push("أستوريا شددت قيود التصدير التقني.");
    }
    if (deals.tech && s.cybersecurity < 20 && rng() < 0.25) {
      deals.tech = false;
      lastAction = "علّقت التعاون التقني بسبب ثغرات أمنية.";
      news.push("عُلق تعاون تقني بعد تقييم أمني.");
    }
    if (s.aiCapability < 25 && rel > 60 && !deals.tech && rng() < 0.2) {
      lastAction = "لمحت إلى استعداد لشراكة تقنية مشروطة.";
      news.push("إشارات إيجابية من أستوريا بشأن التعاون التقني.");
    }
  }
  if (n.personality === "cautious") {
    if (s.stability > 65) rel += 0.4;
    if (s.militaryPower > 55) rel -= 0.3;
    if (s.militaryPower < 15 && s.flags.tension > 40) rel -= 0.5;
    if (deals.defense) rel += 0.4;
  }
  if (n.personality === "revisionist") {
    const rimal = s.nations.find((x) => x.id === "rimal");
    if (rimal?.deals.defense) rel -= 0.8;
    if (s.militaryPower > 40) rel -= 0.5;
    if (s.influence > 45) rel -= 0.4;
    if (rel < 22 && rng() < 0.28 && !deals.sanctioned) {
      deals.sanctioned = true;
      deals.trade = false;
      lastAction = "فرضت قيوداً انتقائية على العبور والتجارة.";
      news.push("فالين فرضت قيوداً انتقائية على سندار.");
    }
    if (rel > 55 && deals.sanctioned && rng() < 0.4) {
      deals.sanctioned = false;
      lastAction = "خففت بعض القيود بعد تهدئة.";
      news.push("فالين خففت قيوداً بعد تغير النبرة.");
    }
  }

  if (rel < 18 && deals.trade) {
    deals.trade = false;
    lastAction = "جمّدت التبادل التجاري.";
  }

  return {
    ...n,
    gdp,
    tech,
    military,
    relation: clamp100(rel),
    tradeVolume: Math.max(0, tradeVolume),
    deals,
    lastAction,
  };
}

function clamp(n: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, n));
}
