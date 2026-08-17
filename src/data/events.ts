import type { EventDef, GameState } from "../engine/types";
import { applyPatch, energyReserve, pushLog } from "../engine/util";

function withLog(s: GameState, title: string, detail: string, extra?: Partial<GameState>): GameState {
  return { ...pushLog({ ...s, ...extra }, "event", title, detail) };
}

export const EVENTS: EventDef[] = [
  {
    id: "oil-shock",
    title: "صدمة أسعار الطاقة",
    body: "قفزت أسعار الوقود عالمياً. ارتفعت تكلفة التوليد الأحفوري وضغطت الميزانية والتضخم.",
    weight: (s) => (s.fossilCapacity / Math.max(1, s.fossilCapacity + s.renewableCapacity)) * 1.3 + 0.3,
    apply: (s) => {
      const fossilShare = s.fossilCapacity / Math.max(1, s.fossilCapacity + s.renewableCapacity);
      const hit = 0.035 + fossilShare * 0.04;
      return withLog(
        applyPatch(s, {
          inflation: hit,
          energyCost: 0.22 + fossilShare * 0.18,
          approval: -3,
          treasury: -1.2,
        }),
        "صدمة أسعار الطاقة",
        "ارتفعت التكاليف التشغيلية وتراجع الرضا الشعبي مع غلاء الوقود.",
        { flags: { ...s.flags, oilPrice: Math.min(2.2, s.flags.oilPrice + 0.35) } },
      );
    },
  },
  {
    id: "oil-drop",
    title: "هبوط أسعار النفط",
    body: "انخفضت أسعار الطاقة عالمياً. استفادت الموازنة إن كنت مستورداً صافياً، وتضرر شركاء الوقود.",
    weight: (s) => (s.flags.oilPrice > 1.1 ? 1.1 : 0.35),
    apply: (s) =>
      withLog(
        applyPatch(s, { inflation: -0.012, energyCost: -0.12, treasury: 0.8 }),
        "هبوط أسعار النفط",
        "انخفضت فاتورة الطاقة مؤقتاً وتحسن هامش المالية العامة.",
        { flags: { ...s.flags, oilPrice: Math.max(0.7, s.flags.oilPrice - 0.25) } },
      ),
  },
  {
    id: "recession",
    title: "ركود عالمي",
    body: "انكمش الطلب الخارجي. تراجعت الصادرات والاستثمار، وارتفعت البطالة قليلاً.",
    weight: (s) => (s.flags.globalGrowth < 0.02 ? 1.4 : 0.55),
    apply: (s) =>
      withLog(
        applyPatch(s, {
          exports: -Math.max(1.2, s.exports * 0.08),
          unemployment: 0.012,
          investment: -1.4,
          approval: -2,
          gdp: -s.gdp * 0.012,
        }),
        "ركود عالمي",
        "ضعف الطلب الخارجي ضغط النمو والتشغيل.",
        { flags: { ...s.flags, globalGrowth: Math.max(-0.01, s.flags.globalGrowth - 0.015) } },
      ),
  },
  {
    id: "boom",
    title: "انتعاش تجاري عالمي",
    body: "ارتفع الطلب على السلع والمواد. من يملك قدرة تصديرية وصناعة جاهزة يقطف الثمرة.",
    weight: (s) => (s.exports > 20 && s.industrialCapacity > 30 ? 1.1 : 0.45),
    apply: (s) =>
      withLog(
        applyPatch(s, {
          exports: 2.2 + s.industrialCapacity * 0.04,
          investment: 1.6,
          approval: 2,
          gdp: s.gdp * 0.01,
        }),
        "انتعاش تجاري عالمي",
        "استفادت الصادرات والاستثمار من دورة عالمية مواتية.",
        { flags: { ...s.flags, globalGrowth: Math.min(0.045, s.flags.globalGrowth + 0.01) } },
      ),
  },
  {
    id: "tech-break",
    title: "اختراق بحثي محلي",
    body: "فريق سنداري حقق تقدماً غير متوقع في خوارزميات أو مواد. العائد يعتمد على جاهزية الحوسبة.",
    weight: (s) => (s.research > 28 ? 0.9 : 0.25),
    apply: (s) =>
      withLog(
        applyPatch(s, {
          technology: 3 + (s.computing > 30 ? 2 : 0),
          aiCapability: s.computing > 25 ? 2 : 0.5,
          research: 2,
          influence: 1,
        }),
        "اختراق بحثي محلي",
        "تسارع التقدم التقني بفضل تراكم بحثي سابق.",
      ),
  },
  {
    id: "chip-shortage",
    title: "أزمة رقائق عالمية",
    body: "اضطراب في سلاسل أشباه الموصلات. تأثرت الصناعة المتقدمة وبرامج الذكاء الاصطناعي.",
    weight: (s) => (s.semiconductors < 40 ? 1.2 : 0.4) + (s.flags.chipAccessShock > 0 ? 0.6 : 0),
    apply: (s) =>
      withLog(
        applyPatch(s, {
          semiconductors: -8,
          industrialCapacity: -2,
          aiCapability: -1.2,
          supplyChain: -6,
        }),
        "أزمة رقائق عالمية",
        "تقلص الوصول إلى الرقائق وتباطأت المشاريع التقنية.",
        { flags: { ...s.flags, chipAccessShock: Math.max(s.flags.chipAccessShock, 2) } },
      ),
  },
  {
    id: "energy-crisis",
    title: "أزمة كهرباء وطنية",
    body: "تجاوز الطلب القدرة في ذروة الصيف. انقطعت خطوط صناعية وتراجع الرضا.",
    weight: (s) => (energyReserve(s) < 0.06 ? 2.4 : 0.15),
    apply: (s) =>
      withLog(
        applyPatch(s, {
          approval: -6,
          stability: -4,
          industrialCapacity: -3,
          gdp: -s.gdp * 0.016,
          energyCost: 0.18,
        }),
        "أزمة كهرباء وطنية",
        "الانقطاعات أضرت الصناعة والثقة العامة.",
        { flags: { ...s.flags, yearsOfEnergyCrisis: s.flags.yearsOfEnergyCrisis + 1 } },
      ),
  },
  {
    id: "regional-clash",
    title: "توتر إقليمي مسلح",
    body: "اشتباك محدود بين جيران. ارتفع التأمين على الشحن وزاد الطلب على الردع.",
    weight: (s) => 0.35 + s.flags.tension / 140,
    apply: (s) =>
      withLog(
        applyPatch(s, {
          imports: 0.8,
          exports: -1.1,
          approval: s.militaryPower > 35 ? 1 : -2,
          influence: s.deterrence > 40 ? 1 : -1,
        }),
        "توتر إقليمي مسلح",
        "اضطربت التجارة وارتفعت كلفة التأمين، فيما أعاد الداخل تقييم الأمن.",
        { flags: { ...s.flags, tension: Math.min(90, s.flags.tension + 12) } },
      ),
  },
  {
    id: "trade-dispute",
    title: "نزاع تجاري",
    body: "فرضت نورفان رسوماً مؤقتة بعد خلاف على المواصفات الصناعية.",
    weight: (s) => (s.nations.find((n) => n.id === "norvan")?.relation ?? 50) < 50 ? 1 : 0.35,
    apply: (s) => {
      const nations = s.nations.map((n) =>
        n.id === "norvan"
          ? { ...n, tradeVolume: Math.max(0.5, n.tradeVolume * 0.82), relation: n.relation - 4, lastAction: "فرضت رسوماً مؤقتة على سلع سندارية." }
          : n,
      );
      return withLog(applyPatch({ ...s, nations }, { exports: -1.6, approval: -1 }), "نزاع تجاري", "تضررت الصادرات نحو نورفان مؤقتاً.");
    },
  },
  {
    id: "sanctions-threat",
    title: "تهديدات بعقوبات",
    body: "تحركت فالين بخطاب عقوبات بعد تقارب سندار مع خصومها أو بعد تسلح سريع.",
    weight: (s) => {
      const valen = s.nations.find((n) => n.id === "valen");
      if (!valen) return 0.2;
      return valen.relation < 32 || s.militaryPower > 45 ? 1.1 : 0.2;
    },
    apply: (s) => {
      const nations = s.nations.map((n) =>
        n.id === "valen"
          ? { ...n, relation: n.relation - 6, lastAction: "لوحت بعقوبات وقيود على العبور." }
          : n,
      );
      return withLog(
        applyPatch({ ...s, nations }, { influence: -2, investment: -1.1, stability: -2 }),
        "تهديدات بعقوبات",
        "ارتبك المستثمرون وتراجع النفوذ الدبلوماسي مؤقتاً.",
        { flags: { ...s.flags, tension: Math.min(95, s.flags.tension + 8) } },
      );
    },
  },
  {
    id: "disaster",
    title: "كارثة طبيعية",
    body: "فيضانات في الأودية أضرت طرقاً ومحاصيل وأجبرت الحكومة على إنفاق طارئ.",
    weight: () => 0.55,
    apply: (s) =>
      withLog(
        applyPatch(s, {
          treasury: -2.4,
          infrastructure: -4,
          roads: -5,
          approval: s.spendRate > 0.2 ? 0 : -3,
          gdp: -s.gdp * 0.008,
        }),
        "كارثة طبيعية",
        "تضررت البنية وتطلبت استجابة مالية عاجلة.",
      ),
  },
  {
    id: "baby-wave",
    title: "موجة سكانية",
    body: "ارتفع معدل الولادات. يزيد السوق لاحقاً ويرفع ضغط التعليم والخدمات.",
    weight: (s) => (s.approval > 55 && s.humanCapital > 30 ? 0.5 : 0.25),
    apply: (s) =>
      withLog(
        applyPatch(s, { population: 0.35, unemployment: 0.004, approval: 1 }),
        "موجة سكانية",
        "النمو السكاني يوسع السوق ويرفع الطلب على المدارس والكهرباء.",
      ),
  },
  {
    id: "invest-boom",
    title: "موجة استثمار أجنبي",
    body: "دخلت صناديق إقليمية بعد تحسن الاستقرار أو البنية.",
    weight: (s) => (s.stability > 62 && s.infrastructure > 36 && s.inflation < 0.1 ? 1.1 : 0.2),
    apply: (s) =>
      withLog(
        applyPatch(s, { investment: 3.2, gdp: s.gdp * 0.008, supplyChain: 3, approval: 2 }),
        "موجة استثمار أجنبي",
        "تدفقات رأسمالية عززت الاستثمار والتشغيل.",
      ),
  },
  {
    id: "cyber-attack",
    title: "هجوم سيبراني واسع",
    body: "استُهدفت شبكات حكومية ومصرفية. الضرر يتناسب عكسياً مع الدفاع السيبراني.",
    weight: (s) => 0.4 + (s.computing + s.aiCapability) / 180,
    apply: (s) => {
      const shield = (s.cybersecurity + s.defense.cyber) / 200;
      const dmg = 1 - shield;
      return withLog(
        applyPatch(s, {
          treasury: -1.5 * dmg,
          stability: -5 * dmg,
          approval: -4 * dmg,
          digital: -6 * dmg,
          gdp: -s.gdp * 0.006 * dmg,
        }),
        "هجوم سيبراني واسع",
        shield > 0.5 ? "امتصت القيادة السيبرانية معظم الضرر." : "كشفت الثغرات ضعف الحماية الرقمية.",
      );
    },
  },
  {
    id: "supply-shock",
    title: "اضطراب سلاسل التوريد",
    body: "اختناق في الموانئ الإقليمية عطّل المدخلات الصناعية.",
    weight: (s) => (s.supplyChain < 45 ? 1 : 0.35),
    apply: (s) =>
      withLog(
        applyPatch(s, {
          supplyChain: -8,
          industrialCapacity: -2,
          inflation: 0.012,
          imports: 1.1,
        }),
        "اضطراب سلاسل التوريد",
        "ارتفعت كلفة المدخلات وتباطأ الإنتاج.",
      ),
  },
  {
    id: "brain-drain",
    title: "هجرة كفاءات",
    body: "غادر مهندسون وباحثون بسبب ضعف الأجور أو التشاؤم.",
    weight: (s) => (s.approval < 42 || s.humanCapital > 50 && s.gdp / s.population < 4 ? 1.1 : 0.25),
    apply: (s) =>
      withLog(
        applyPatch(s, { humanCapital: -3.5, research: -2, approval: -2 }),
        "هجرة كفاءات",
        "خسرت سندار جزءاً من رأس مالها البشري المتراكم.",
      ),
  },
  {
    id: "gas-find",
    title: "اكتشاف غاز جديد",
    body: "أعلنت هيئة المسح عن حقل غاز متوسط. يحتاج استثماراً ليتحول إلى قدرة.",
    weight: (s) => (s.completedProjects.includes("gas-plant") ? 0.35 : 0.55),
    apply: (s, rng) =>
      withLog(
        {
          ...applyPatch(s, { fossilCapacity: 1.4, influence: 1, approval: 3 }),
          delayedEffects: [
            ...s.delayedEffects,
            {
              id: `gas-follow-${s.year}`,
              year: s.year + 3,
              label: "دخول حقل الغاز الإنتاج",
              deltas: { fossilCapacity: 2.2 + rng() * 1.2, treasury: 1.4, energyCost: -0.05 },
            },
          ],
        },
        "اكتشاف غاز جديد",
        "ارتفع التفاؤل، والإنتاج الإضافي سيظهر بعد تجهيز الحقل.",
      ),
  },
  {
    id: "drought",
    title: "جفاف قاسٍ",
    body: "تراجع الإنتاج الزراعي وارتفعت أسعار الغذاء.",
    weight: () => 0.45,
    apply: (s) =>
      withLog(
        applyPatch(s, { inflation: 0.018, approval: -4, stability: -2, treasury: -0.8 }),
        "جفاف قاسٍ",
        "ضغط غذائي رفع التضخم وأضعف الرضا.",
      ),
  },
  {
    id: "aid-offer",
    title: "عرض تمويل تنموي",
    body: "مؤسسة دولية تعرض قرضاً ميسّراً لمشاريع بنية. يزيد القدرة الآن ويرفع الدين لاحقاً.",
    weight: (s) => (s.infrastructure < 45 && s.debt / s.gdp < 1.1 ? 0.7 : 0.15),
    apply: (s) =>
      withLog(
        applyPatch(s, { treasury: 4.5, debt: 4.5, infrastructure: 2, influence: 1 }),
        "عرض تمويل تنموي",
        "دخل تمويل خارجي الخزانة مقابل التزام دين جديد.",
      ),
  },
  {
    id: "factory-accident",
    title: "حادث صناعي كبير",
    body: "انفجار في مجمع صناعي أوقف خطوطاً وأثار غضباً عمالياً.",
    weight: (s) => (s.industrialCapacity > 35 && s.grid < 50 ? 0.7 : 0.2),
    apply: (s) =>
      withLog(
        applyPatch(s, {
          industrialCapacity: -3,
          approval: -3,
          stability: -2,
          unemployment: 0.006,
        }),
        "حادث صناعي كبير",
        "توقف الإنتاج وأعيد فتح ملف السلامة المهنية.",
      ),
  },
];
