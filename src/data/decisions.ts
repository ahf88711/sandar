import type { DecisionDef, GameState } from "../engine/types";
import { applyPatch, pushLog, uid } from "../engine/util";

function logChoice(s: GameState, title: string, detail: string): GameState {
  return pushLog(s, "decision", title, detail);
}

function addDelay(s: GameState, yearOffset: number, label: string, deltas: GameState["delayedEffects"][number]["deltas"], rng: () => number): GameState {
  return {
    ...s,
    delayedEffects: [
      ...s.delayedEffects,
      { id: uid("d", rng), year: s.year + yearOffset, label, deltas },
    ],
  };
}

export const DECISIONS: DecisionDef[] = [
  {
    id: "opening",
    title: "أول أولوية للعهد",
    body: "الشعب ينتظر إشارة الاتجاه. لا يمكن تمويل كل شيء دفعة واحدة. بأي جبهة تبدأ النهضة؟",
    urgency: "high",
    weight: () => 0,
    choices: [
      {
        id: "energy-first",
        label: "أمن الطاقة أولاً",
        hint: "يؤسس للصناعة لاحقاً ويؤجل بعض المكاسب الاجتماعية.",
        apply: (s, rng) =>
          logChoice(
            addDelay(
              applyPatch({ ...s, budget: { ...s.budget, energy: s.budget.energy + 0.06, education: s.budget.education - 0.03, defense: s.budget.defense - 0.03 } }, { treasury: -0.8, approval: 1 }),
              2,
              "أثر التركيز على الطاقة",
              { fossilCapacity: 0.8, energyCost: -0.03 },
              rng,
            ),
            "أول أولوية",
            "وُجهت الإشارة الأولى نحو أمن الكهرباء.",
          ),
      },
      {
        id: "people-first",
        label: "التعليم والخدمات",
        hint: "شرعية أسرع وعائد إنتاجي متأخر.",
        apply: (s, rng) =>
          logChoice(
            addDelay(
              applyPatch({ ...s, budget: { ...s.budget, education: s.budget.education + 0.05, defense: s.budget.defense - 0.03, industry: s.budget.industry - 0.02 } }, { approval: 4, treasury: -1 }),
              4,
              "أثر الاستثمار البشري المبكر",
              { humanCapital: 3.5, research: 1.5 },
              rng,
            ),
            "أول أولوية",
            "افتُتح العهد بوعد تعليمي وخدمي.",
          ),
      },
      {
        id: "industry-first",
        label: "قاعدة صناعية سريعة",
        hint: "تشغيل أوضح وضغط على الشبكة الكهربائية.",
        apply: (s) =>
          logChoice(
            applyPatch(
              { ...s, budget: { ...s.budget, industry: s.budget.industry + 0.05, energy: s.budget.energy - 0.02, education: s.budget.education - 0.03 } },
              { industrialCapacity: 1.5, energyDemand: 0.4, unemployment: -0.004, approval: 2 },
            ),
            "أول أولوية",
            "أُطلقت إشارة تصنيع سريع على حساب بعض التوازنات.",
          ),
      },
      {
        id: "balanced-start",
        label: "توازن حذر",
        hint: "لا قفزة ولا صدمة.",
        apply: (s) => logChoice(applyPatch(s, { stability: 2 }), "أول أولوية", "اختير مسار متوازن في السنة الأولى."),
      },
    ],
  },
  {
    id: "tax-reform",
    title: "إصلاح ضريبي",
    body: "الخزانة تضغط من أجل إعادة تصميم الضرائب. كل مسار يلمس النمو والعدالة والرضا في آن.",
    weight: (s) => (s.debt / s.gdp > 0.55 || s.turn % 6 === 2 ? 1.2 : 0.25),
    choices: [
      {
        id: "broaden",
        label: "توسيع الوعاء برفق",
        hint: "إيراد أكثر استقراراً مع تذمر محدود في الأسواق.",
        apply: (s) =>
          logChoice(
            applyPatch(s, { taxRate: 0.012, approval: -2, investment: -0.4 }),
            "إصلاح ضريبي",
            "وُسّع الوعاء الضريبي تدريجياً.",
          ),
      },
      {
        id: "cut",
        label: "خفض الضرائب لتحفيز الاستثمار",
        hint: "ينعش القطاع الخاص ويضغط الإيراد إن لم يأت النمو.",
        apply: (s) =>
          logChoice(
            applyPatch(s, { taxRate: -0.018, approval: 3, investment: 1.4, treasury: -1 }),
            "إصلاح ضريبي",
            "خُفضت الضرائب على أمل تحفيز رأس المال.",
          ),
      },
      {
        id: "progressive",
        label: "ضريبة أكثر تصاعدية",
        hint: "يرضي الشارع ويقلق كبار المستثمرين.",
        apply: (s) =>
          logChoice(
            applyPatch(s, { taxRate: 0.008, approval: 4, stability: 2, investment: -1.1 }),
            "إصلاح ضريبي",
            "أُعيد توزيع العبء نحو الشرائح الأعلى.",
          ),
      },
    ],
  },
  {
    id: "energy-subsidy",
    title: "دعم الكهرباء",
    body: "الأسر تشكو الغلاء. الدعم يهدئ الشارع ويرفع الاستهلاك ويثقل الخزانة.",
    weight: (s) => (s.energyCost > 1.1 || s.approval < 48 ? 1.3 : 0.3),
    choices: [
      {
        id: "expand",
        label: "توسيع الدعم الشعبي",
        hint: "رضا فوري وطلب كهرباء أعلى.",
        apply: (s) =>
          logChoice(
            applyPatch(s, { approval: 6, treasury: -2.2, energyDemand: 0.9, energyCost: 0.04 }),
            "دعم الكهرباء",
            "وُسّع الدعم على حساب الخزانة وكفاءة الاستهلاك.",
          ),
      },
      {
        id: "target",
        label: "دعم موجه للأسر الأضعف فقط",
        hint: "توازن سياسي ومالي أدق.",
        apply: (s) =>
          logChoice(
            applyPatch(s, { approval: 2, treasury: -0.8, stability: 1 }),
            "دعم الكهرباء",
            "حُصر الدعم في الفئات الأكثر تضرراً.",
          ),
      },
      {
        id: "lift",
        label: "رفع الدعم وتحويل الوفر للطاقة",
        hint: "غضب شعبي وتمويل أوضح للمشاريع.",
        apply: (s, rng) =>
          logChoice(
            addDelay(applyPatch(s, { approval: -7, stability: -3, treasury: 1.6, energyDemand: -0.5 }), 2, "أثر ترشيد الدعم", { renewableCapacity: 0.8, energyCost: -0.05 }, rng),
            "دعم الكهرباء",
            "رُفع الدعم وسط احتجاجات، مع توجيه الوفر للاستثمار.",
          ),
      },
    ],
  },
  {
    id: "scholar-choice",
    title: "سياسة الكفاءات",
    body: "وزارة التعليم تعرض مساراً لتسريع رأس المال البشري. الثمن يتأجل أو يُدفع الآن.",
    weight: (s) => (s.humanCapital < 50 ? 1.1 : 0.3),
    urgency: "high",
    choices: [
      {
        id: "mass-scholar",
        label: "بعثة واسعة فورية",
        hint: "تكلفة سنوية ظاهرة، وعائد بعد سنوات.",
        apply: (s, rng) =>
          logChoice(
            {
              ...addDelay(
                applyPatch(s, { treasury: -2.6, approval: 2 }),
                4,
                "عودة مبتعثين",
                { humanCapital: 6, research: 3, productivity: 0.04 },
                rng,
              ),
              flags: { ...s.flags, scholarshipsEver: true },
            },
            "سياسة الكفاءات",
            "أُطلقت بعثات واسعة ستظهر أثرها بعد التخرج.",
          ),
      },
      {
        id: "local-train",
        label: "تدريب محلي مكثف",
        hint: "أثر أضيق وأسرع وأقل كلفة.",
        apply: (s, rng) =>
          logChoice(
            addDelay(applyPatch(s, { treasury: -1.1 }), 2, "تخرج معاهد مكثفة", { humanCapital: 3, industrialCapacity: 1.5 }, rng),
            "سياسة الكفاءات",
            "رُكّز على المعاهد المحلية بدلاً من الابتعاث الواسع.",
          ),
      },
      {
        id: "wait",
        label: "تأجيل القرار",
        hint: "يوفر المال ويؤخر اللحاق التقني.",
        apply: (s) =>
          logChoice(applyPatch(s, { approval: -1 }), "سياسة الكفاءات", "أُجّل الاستثمار البشري إلى دورة لاحقة."),
      },
    ],
  },
  {
    id: "austerity",
    title: "انضباط مالي",
    body: "الدين يثقل الخدمة. التقشف يحمي الجدارة الائتمانية ويؤذي الخدمات والنمو.",
    weight: (s) => (s.debt / s.gdp > 0.7 ? 1.6 : 0.2),
    urgency: "high",
    choices: [
      {
        id: "hard",
        label: "تقشف صارم لعامين",
        hint: "خفض عجز أوضح وغضب اجتماعي.",
        apply: (s) =>
          logChoice(
            applyPatch(
              { ...s, spendRate: Math.max(0.12, s.spendRate - 0.035), flags: { ...s.flags, austerityYears: s.flags.austerityYears + 2 } },
              { approval: -6, stability: -3, unemployment: 0.01 },
            ),
            "انضباط مالي",
            "فُرض تقشف حاد لوقف تفاقم الدين.",
          ),
      },
      {
        id: "soft",
        label: "ترشيد تدريجي",
        hint: "أثر أضعف على الدين والمجتمع.",
        apply: (s) =>
          logChoice(
            applyPatch({ ...s, spendRate: Math.max(0.14, s.spendRate - 0.015) }, { approval: -2 }),
            "انضباط مالي",
            "بُدئ بترشيد محدود للنفقات.",
          ),
      },
      {
        id: "grow-out",
        label: "النمو يخرجنا من الدين",
        hint: "مقامرة: إن لم يأت النمو يتفاقم الخطر.",
        apply: (s) =>
          logChoice(
            applyPatch({ ...s, spendRate: Math.min(0.34, s.spendRate + 0.015) }, { investment: 0.8, inflation: 0.006 }),
            "انضباط مالي",
            "رُفض التقشف لصالح تحفيز النمو.",
          ),
      },
    ],
  },
  {
    id: "stimulus",
    title: "حزمة تحفيز",
    body: "الركود يلوح. التحفيز ينعش التشغيل ويرفع العجز والتضخم.",
    weight: (s) => (s.gdpGrowth < 0.012 || s.unemployment > 0.14 ? 1.3 : 0.2),
    choices: [
      {
        id: "infra",
        label: "تحفيز عبر البنية",
        hint: "أثر أبطأ وأصل إنتاجي يبقى.",
        apply: (s, rng) =>
          logChoice(
            addDelay(applyPatch(s, { treasury: -2.8, unemployment: -0.008 }), 2, "نضج مشاريع التحفيز", { infrastructure: 4, productivity: 0.03 }, rng),
            "حزمة تحفيز",
            "وُجه التحفيز إلى أصول بنية تحتية.",
          ),
      },
      {
        id: "cash",
        label: "دعم نقدي مباشر",
        hint: "رضا وتشغيل سريع وتضخم أعلى.",
        apply: (s) =>
          logChoice(
            applyPatch(s, { treasury: -3.2, approval: 5, unemployment: -0.01, inflation: 0.014 }),
            "حزمة تحفيز",
            "ضُخت سيولة مباشرة في الأسواق.",
          ),
      },
      {
        id: "none",
        label: "عدم التدخل",
        hint: "يحمي المالية ويترك الألم الاجتماعي.",
        apply: (s) =>
          logChoice(applyPatch(s, { approval: -3, stability: -2 }), "حزمة تحفيز", "تُرك التعديل للسوق دون حزمة استثنائية."),
      },
    ],
  },
  {
    id: "ai-doctrine",
    title: "عقيدة الذكاء الاصطناعي",
    body: "الوزارات تختلف: تسريع بلا ضوابط، أو حوكمة أبطأ، أو اعتماد على شريك خارجي.",
    weight: (s) => (s.computing > 20 || s.aiCapability > 12 ? 1.2 : 0.25),
    choices: [
      {
        id: "sprint",
        label: "تسريع وطني مكثف",
        hint: "تقدم أسرع وتشغيل مضطرب ومخاطر أمنية.",
        apply: (s, rng) =>
          logChoice(
            addDelay(applyPatch(s, { aiCapability: 3, automation: 4, unemployment: 0.008, cybersecurity: -2 }), 2, "صدمة أتمتة", { unemployment: 0.01, productivity: 0.05 }, rng),
            "عقيدة الذكاء الاصطناعي",
            "اعتُمد مسار تسريع غير مقيد تقريباً.",
          ),
      },
      {
        id: "governed",
        label: "تطوير محكوم",
        hint: "أبطأ وأكثر استدامة.",
        apply: (s) =>
          logChoice(
            applyPatch(s, { aiCapability: 1.2, cybersecurity: 3, research: 1, approval: 1 }),
            "عقيدة الذكاء الاصطناعي",
            "رُبط التطوير بمعايير أمن وحوكمة.",
          ),
      },
      {
        id: "partner",
        label: "شراكة مع أستوريا",
        hint: "وصول أسرع مقابل تبعية وقيود.",
        apply: (s) => {
          const nations = s.nations.map((n) =>
            n.id === "astoria"
              ? { ...n, relation: n.relation + 6, deals: { ...n.deals, tech: true }, lastAction: "قبلت شراكة تقنية مشروطة." }
              : n,
          );
          return logChoice(
            applyPatch({ ...s, nations }, { semiconductors: 6, computing: 3, influence: -1, aiCapability: 1.5 }),
            "عقيدة الذكاء الاصطناعي",
            "فُتحت شراكة تقنية تسرّع الوصول وتقيّد الاستقلال.",
          );
        },
      },
    ],
  },
  {
    id: "trade-open",
    title: "سياسة التجارة",
    body: "الصناعيون يريدون حماية. المصدرون يريدون انفتاحاً. القرار يعيد رسم العلاقات.",
    weight: () => 0.7,
    choices: [
      {
        id: "open",
        label: "انفتاح أوسع",
        hint: "صادرات وواردات أعلى، وصناعة ناشئة تحت الضغط.",
        apply: (s) => {
          const nations = s.nations.map((n) =>
            n.personality === "trader" ? { ...n, relation: n.relation + 5, tradeVolume: n.tradeVolume + 1.2 } : n,
          );
          return logChoice(
            applyPatch({ ...s, nations }, { exports: 1.8, imports: 2.2, industrialCapacity: -1.2, inflation: -0.006 }),
            "سياسة التجارة",
            "فُتحت الأسواق على حساب بعض الخطوط المحلية.",
          );
        },
      },
      {
        id: "protect",
        label: "حماية انتقائية",
        hint: "تنفس للصناعة وغضب الشركاء التجاريين.",
        apply: (s) => {
          const nations = s.nations.map((n) =>
            n.personality === "trader" ? { ...n, relation: n.relation - 6, tradeVolume: Math.max(0.4, n.tradeVolume - 0.8) } : n,
          );
          return logChoice(
            applyPatch({ ...s, nations }, { industrialCapacity: 2, inflation: 0.01, exports: -0.8 }),
            "سياسة التجارة",
            "فُرضت حماية انتقائية لدعم التصنيع المحلي.",
          );
        },
      },
      {
        id: "balanced",
        label: "اتفاقيات متبادلة",
        hint: "حل وسط دبلوماسي.",
        apply: (s) =>
          logChoice(
            applyPatch(s, { exports: 0.6, supplyChain: 2, influence: 1 }),
            "سياسة التجارة",
            "أُبرمت تفاهمات متبادلة دون انغلاق أو انفتاح كامل.",
          ),
      },
    ],
  },
  {
    id: "conscription",
    title: "الخدمة العسكرية",
    body: "قيادة الجيش تطلب توسيع القوة البشرية. المجتمع يخشى كلفة الشباب والاقتصاد.",
    weight: (s) => (s.flags.tension > 40 || s.militaryPower < 25 ? 0.9 : 0.25),
    choices: [
      {
        id: "draft",
        label: "خدمة إلزامية محدودة",
        hint: "قوة أكبر ورضا أقل وتشغيل مشوّه.",
        apply: (s) =>
          logChoice(
            applyPatch(s, { militaryPower: 4, approval: -4, unemployment: -0.006, productivity: -0.02 }),
            "الخدمة العسكرية",
            "أُقرت خدمة إلزامية محدودة.",
          ),
      },
      {
        id: "pro",
        label: "جيش محترف أصغر",
        hint: "كلفة أعلى وجودة أفضل.",
        apply: (s) =>
          logChoice(
            applyPatch(s, { militaryPower: 2, treasury: -1.4, humanCapital: 0.5 }),
            "الخدمة العسكرية",
            "رُكّز على الاحتراف بدل التوسع العددي.",
          ),
      },
      {
        id: "status",
        label: "الإبقاء على الوضع",
        hint: "لا صدمة سياسية ولا قفزة ردع.",
        apply: (s) => logChoice(s, "الخدمة العسكرية", "أُبقي نظام التجنيد كما هو."),
      },
    ],
  },
  {
    id: "foreign-base",
    title: "عرض تسهيلات عسكرية",
    body: "أستوريا تعرض تدريباً ومظلة أمنية مقابل تسهيلات لوجستية. رمال تراقبه، وفالين ستغضب.",
    weight: (s) => (s.nations.find((n) => n.id === "astoria")?.relation ?? 0) > 45 ? 0.7 : 0.15,
    urgency: "high",
    choices: [
      {
        id: "accept",
        label: "قبول مشروط",
        hint: "أمن وتقنية مقابل سيادة منقوصة وغضب فالين.",
        apply: (s) => {
          const nations = s.nations.map((n) => {
            if (n.id === "astoria") return { ...n, relation: n.relation + 8, deals: { ...n.deals, defense: true }, lastAction: "نشرت بعثة تدريب مقابل تسهيلات." };
            if (n.id === "valen") return { ...n, relation: n.relation - 10, lastAction: "أدانت التسهيلات واعتبرتها تطويقاً." };
            if (n.id === "rimal") return { ...n, relation: n.relation + 2, lastAction: "راقبت الترتيب بحذر." };
            return n;
          });
          return logChoice(
            applyPatch({ ...s, nations }, { deterrence: 6, militaryPower: 3, influence: -2, cybersecurity: 2 }),
            "تسهيلات عسكرية",
            "قُبل العرض الأستوري بشروط، وارتفع التوتر مع فالين.",
          );
        },
      },
      {
        id: "reject",
        label: "رفض للمحافظة على الاستقلال",
        hint: "سيادة أوضح ودعم أمني أقل.",
        apply: (s) => {
          const nations = s.nations.map((n) =>
            n.id === "astoria" ? { ...n, relation: n.relation - 5, lastAction: "لم تستسغ رفض التسهيلات." } : n,
          );
          return logChoice(applyPatch({ ...s, nations }, { approval: 3, influence: 1 }), "تسهيلات عسكرية", "رُفض العرض دفاعاً عن الاستقلال الاستراتيجي.");
        },
      },
      {
        id: "delay",
        label: "مطاولة تفاوضية",
        hint: "يكسب وقتاً وقد يُفهم ضعفاً.",
        apply: (s) => logChoice(applyPatch(s, { influence: -1 }), "تسهيلات عسكرية", "أُجل الحسم وأُبقيت القنوات مفتوحة."),
      },
    ],
  },
  {
    id: "chip-deal",
    title: "صفقة رقائق",
    body: "كيرمال يتوسط لشحنة معدات. أستوريا قد تفسرها التفافاً على قيودها.",
    weight: (s) => (s.semiconductors < 35 && s.computing > 15 ? 1.1 : 0.2),
    choices: [
      {
        id: "take",
        label: "قبول الصفقة بهدوء",
        hint: "رقائق أسرع ومخاطرة دبلوماسية.",
        apply: (s, rng) => {
          const leak = rng() < 0.4;
          const nations = s.nations.map((n) => {
            if (n.id === "kirmal") return { ...n, relation: n.relation + 4, lastAction: "مرت صفقة معدات حساسة." };
            if (n.id === "astoria" && leak) return { ...n, relation: n.relation - 8, deals: { ...n.deals, exportBan: true }, lastAction: "اكتشفت الصفقة وشددت القيود." };
            return n;
          });
          return logChoice(
            applyPatch({ ...s, nations }, { semiconductors: leak ? 4 : 8, treasury: -2.1, computing: 2 }),
            "صفقة رقائق",
            leak ? "وصلت الشحنة لكن أستوريا اكتشفت الأمر وفرضت قيوداً." : "وصلت المعدات دون ضجيج دبلوماسي.",
          );
        },
      },
      {
        id: "legal",
        label: "طلب ترخيص رسمي من أستوريا",
        hint: "أبطأ وأنظف سياسياً.",
        apply: (s, rng) =>
          logChoice(
            addDelay(applyPatch(s, { influence: 1 }), 2, "تراخيص رقائق رسمية", { semiconductors: 5 + rng() * 3 }, rng),
            "صفقة رقائق",
            "سُلك المسار الرسمي بانتظار موافقات.",
          ),
      },
      {
        id: "refuse",
        label: "رفض الصفقة الرمادية",
        hint: "لا قفزة ولا أزمة.",
        apply: (s) => logChoice(s, "صفقة رقائق", "رُفضت القناة الرمادية."),
      },
    ],
  },
  {
    id: "labor",
    title: "سوق العمل والأتمتة",
    body: "النقابات تحذر من تسريح صامت. الشركات تريد حرية أتمتة.",
    weight: (s) => (s.automation > 20 || s.unemployment > 0.13 ? 1.15 : 0.25),
    choices: [
      {
        id: "protect-jobs",
        label: "قيود على التسريح",
        hint: "يحمي التشغيل ويبطئ الإنتاجية.",
        apply: (s) =>
          logChoice(applyPatch(s, { unemployment: -0.01, approval: 4, productivity: -0.04, automation: -2 }), "سوق العمل", "فُرضت قيود تحد من الأتمتة السريعة."),
      },
      {
        id: "retrain",
        label: "إعادة تأهيل ممولة",
        hint: "تكلفة الآن واستقرار لاحق.",
        apply: (s, rng) =>
          logChoice(
            addDelay(applyPatch(s, { treasury: -1.8, approval: 2 }), 3, "برامج إعادة التأهيل", { humanCapital: 3, unemployment: -0.012 }, rng),
            "سوق العمل",
            "رُبطت الأتمتة ببرامج إعادة تأهيل.",
          ),
      },
      {
        id: "free",
        label: "حرية الشركات",
        hint: "إنتاجية أعلى وغضب اجتماعي.",
        apply: (s) =>
          logChoice(applyPatch(s, { productivity: 0.06, unemployment: 0.014, approval: -5, stability: -3 }), "سوق العمل", "تُركت الأتمتة دون شبكة حماية كافية."),
      },
    ],
  },
  {
    id: "press",
    title: "إدارة الرأي العام",
    body: "الاحتجاجات تتسع في المدن. الخيار بين الحوار والضبط الأمني والإصلاح الرمزي.",
    weight: (s) => (s.approval < 40 || s.stability < 45 ? 1.4 : 0.15),
    urgency: "high",
    choices: [
      {
        id: "dialogue",
        label: "حوار اجتماعي ووعود إصلاح",
        hint: "يهدئ إن صُدّق، ويُقرأ ضعفاً إن تكرر بلا تنفيذ.",
        apply: (s) =>
          logChoice(applyPatch(s, { approval: 4, stability: 3, treasury: -0.6 }), "إدارة الرأي", "فُتحت قنوات حوار مع قوى اجتماعية."),
      },
      {
        id: "security",
        label: "قبضة أمنية",
        hint: "هدوء سطحي وتآكل ثقة.",
        apply: (s) =>
          logChoice(applyPatch(s, { stability: 5, approval: -6, influence: -2, humanCapital: -1 }), "إدارة الرأي", "اعتُمد الحل الأمني لضبط الساحات."),
      },
      {
        id: "reform",
        label: "إصلاح خدمات فوري",
        hint: "يكلف مالاً ويعيد بعض الشرعية.",
        apply: (s) =>
          logChoice(applyPatch(s, { treasury: -2.4, approval: 6, educationQuality: 2, infrastructure: 1 }), "إدارة الرأي", "ضُخت موارد سريعة في الخدمات العامة."),
      },
    ],
  },
  {
    id: "water",
    title: "أمن المياه",
    body: "الجفاف يضرب الريف. المشروع الكبير بطيء، والصهاريج أسرع وأغلى تشغيلياً.",
    weight: () => 0.55,
    choices: [
      {
        id: "desal",
        label: "محطات تحلية تدريجية",
        hint: "حل هيكلي يستهلك طاقة.",
        apply: (s, rng) =>
          logChoice(
            addDelay(applyPatch(s, { treasury: -2.2, energyDemand: 0.4 }), 3, "تشغيل التحلية", { approval: 3, stability: 2, energyDemand: 0.6 }, rng),
            "أمن المياه",
            "بُدئ برنامج تحلية طويل النفس.",
          ),
      },
      {
        id: "trucks",
        label: "إغاثة سريعة بالصهاريج",
        hint: "هدوء الآن بلا أصل دائم.",
        apply: (s) => logChoice(applyPatch(s, { treasury: -1.3, approval: 3 }), "أمن المياه", "أُرسلت إغاثة مائية سريعة للريف."),
      },
      {
        id: "ignore",
        label: "انتظار الموسم",
        hint: "توفير مالي وخطر اجتماعي.",
        apply: (s) => logChoice(applyPatch(s, { approval: -4, stability: -3, inflation: 0.008 }), "أمن المياه", "تُرك الملف للأمطار المقبلة."),
      },
    ],
  },
  {
    id: "central-bank",
    title: "استقلال البنك المركزي",
    body: "التضخم عنيد. استقلال أوضح قد يكبح الأسعار ويقيّد قدرتك على التمويل الرخيص.",
    weight: (s) => (s.inflation > 0.08 ? 1.2 : 0.3),
    choices: [
      {
        id: "independent",
        label: "تعزيز الاستقلال",
        hint: "تضخم أقل ونمو أهدأ.",
        apply: (s) =>
          logChoice(applyPatch(s, { inflation: -0.016, investment: 0.6, approval: -2 }), "البنك المركزي", "عُزز استقلال السياسة النقدية."),
      },
      {
        id: "finance",
        label: "الإبقاء على التمويل المرن",
        hint: "عجز أسهل وتضخم أعلى.",
        apply: (s) =>
          logChoice(applyPatch(s, { inflation: 0.01, treasury: 1.2, approval: 1 }), "البنك المركزي", "أُبقي الباب مفتوحاً لتمويل مرن."),
      },
    ],
  },
  {
    id: "valen-talks",
    title: "دعوة فالين للحوار",
    body: "فالين تعرض خفض التوتر مقابل تجميد بعض منظوماتك الهجومية. رمال تخشى الصفقة المنفردة.",
    weight: (s) => (s.flags.tension > 36 ? 1 : 0.2),
    choices: [
      {
        id: "talk",
        label: "حوار حذر مع ضمانات",
        hint: "تهدئة محتملة وتقييد ردع.",
        apply: (s) => {
          const nations = s.nations.map((n) => {
            if (n.id === "valen") return { ...n, relation: n.relation + 7, lastAction: "دخلت حوار تهدئة مشروط." };
            if (n.id === "rimal") return { ...n, relation: n.relation - 3, lastAction: "قلقت من تفاهم منفرد مع فالين." };
            return n;
          });
          return logChoice(
            applyPatch({ ...s, nations, flags: { ...s.flags, tension: Math.max(10, s.flags.tension - 10) } }, { deterrence: -3, influence: 2 }),
            "حوار فالين",
            "فُتحت قناة تهدئة مقابل تجميد رمزي لبعض المنظومات.",
          );
        },
      },
      {
        id: "bloc",
        label: "التنسيق مع رمال أولاً",
        hint: "جبهة أوضح وتصعيد محتمل.",
        apply: (s) => {
          const nations = s.nations.map((n) => {
            if (n.id === "rimal") return { ...n, relation: n.relation + 6, deals: { ...n.deals, defense: true }, lastAction: "رحبت بتنسيق أمني أوثق." };
            if (n.id === "valen") return { ...n, relation: n.relation - 5, lastAction: "رأت التنسيق تطويقاً." };
            return n;
          });
          return logChoice(
            applyPatch({ ...s, nations, flags: { ...s.flags, tension: Math.min(95, s.flags.tension + 6) } }, { deterrence: 3 }),
            "حوار فالين",
            "رُفض الحوار المنفرد وبُني تنسيق مع رمال.",
          );
        },
      },
      {
        id: "ignore-v",
        label: "تجاهل الدعوة",
        hint: "لا تنازل ولا تقدم.",
        apply: (s) => logChoice(s, "حوار فالين", "أُهملت الدعوة دون إشارة واضحة."),
      },
    ],
  },
];

export function visibleChoicesHintSafe(def: DecisionDef): { id: string; label: string; hint: string }[] {
  return def.choices.map((c) => ({ id: c.id, label: c.label, hint: c.hint }));
}
