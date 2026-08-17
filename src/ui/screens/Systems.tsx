import type { ReactNode } from "react";
import {
  DEFENSE_LABELS,
  INDUSTRY_LABELS,
  INDUSTRY_KEYS,
  energyCapacity,
  energyReserve,
  fmtNum,
  fmtPct,
  fmtPoints,
} from "../../engine";
import { useGame } from "../../game/store";
import { Bar, LineChart, MetricCard, StatRow } from "../widgets";

export function Energy() {
  const s = useGame().state!;
  const cap = energyCapacity(s);
  const reserve = energyReserve(s);
  const tone = reserve < 0 ? "danger" : reserve < 0.08 ? "warn" : undefined;
  return (
    <Page title="الطاقة" lead="بلا كهرباء كافية تتوقف المصانع وتختنق الحوسبة ويتآكل الرضا.">
      <div className="grid grid-3">
        <MetricCard label="قدرة التوليد" value={`${fmtNum(cap)} غيغاواط`} hint={`أحفوري ${fmtNum(s.fossilCapacity)} · متجدد ${fmtNum(s.renewableCapacity)}`} />
        <MetricCard label="الاستهلاك" value={`${fmtNum(s.energyDemand)} غيغاواط`} />
        <MetricCard label="هامش الاحتياطي" value={fmtPct(reserve)} />
      </div>
      <article className="card" style={{ marginTop: 14 }}>
        <h3>ميزان الشبكة</h3>
        <Bar value={Math.min(cap, s.energyDemand)} max={Math.max(cap, s.energyDemand)} tone={tone} />
        <div className="stack" style={{ marginTop: 10 }}>
          <StatRow label="تكلفة الطاقة" value={fmtNum(s.energyCost, 2)} />
          <StatRow label="جودة الشبكة" value={fmtPoints(s.grid)} />
          <StatRow label="سعر الوقود العالمي" value={fmtNum(s.flags.oilPrice, 2)} />
        </div>
        <p className="tiny muted">التوسع الصناعي ومراكز البيانات يرفعان الطلب فوراً. المحطات تحتاج سنوات.</p>
      </article>
      <article className="card" style={{ marginTop: 14 }}>
        <h3>القدرة والطلب</h3>
        <LineChart values={s.history.map((h) => h.energyCapacity)} />
      </article>
    </Page>
  );
}

export function Industry() {
  const s = useGame().state!;
  return (
    <Page title="الصناعة" lead="كل فرع صناعي يشترط طاقة وبنية وتعليماً وتقنية. القفز للرقائق دون أساس يهدر المال.">
      <MetricCard label="القدرة الصناعية" value={fmtPoints(s.industrialCapacity)} hint={`سلاسل التوريد ${fmtPoints(s.supplyChain)}`} />
      <div className="grid grid-2" style={{ marginTop: 14 }}>
        {INDUSTRY_KEYS.map((k) => (
          <article className="card" key={k}>
            <div className="row">
              <strong>{INDUSTRY_LABELS[k]}</strong>
              <span>{fmtPoints(s.industries[k])}</span>
            </div>
            <Bar value={s.industries[k]} />
          </article>
        ))}
      </div>
    </Page>
  );
}

export function Tech() {
  const s = useGame().state!;
  return (
    <Page title="التقنية والذكاء الاصطناعي" lead="الذكاء الاصطناعي يحتاج كهرباء وحوسبة ورقائق وكفاءات وبحثاً معاً. الأتمتة السريعة تربك سوق العمل.">
      <div className="grid grid-3">
        <MetricCard label="مستوى التقنية" value={fmtPoints(s.technology)} />
        <MetricCard label="البحث" value={fmtPoints(s.research)} />
        <MetricCard label="القدرة الحاسوبية" value={fmtPoints(s.computing)} />
        <MetricCard label="مراكز البيانات" value={fmtPoints(s.dataCenters)} />
        <MetricCard label="الوصول إلى الرقائق" value={fmtPoints(s.semiconductors)} />
        <MetricCard label="قوة الذكاء الاصطناعي" value={fmtPoints(s.aiCapability)} />
        <MetricCard label="الأتمتة" value={fmtPoints(s.automation)} />
        <MetricCard label="الروبوتات" value={fmtPoints(s.roboticsTech)} />
        <MetricCard label="الأمن السيبراني" value={fmtPoints(s.cybersecurity)} />
        <MetricCard label="تقنية الفضاء" value={fmtPoints(s.spaceTech)} />
      </div>
    </Page>
  );
}

export function Defense() {
  const s = useGame().state!;
  return (
    <Page title="الدفاع" lead="ردع واستقلال تصنيع، لا محاكاة معارك. كل مليار هنا لا يذهب إلى مدرسة أو محطة.">
      <div className="grid grid-3">
        <MetricCard label="القوة العسكرية" value={fmtPoints(s.militaryPower)} />
        <MetricCard label="الردع" value={fmtPoints(s.deterrence)} />
        <MetricCard label="التوتر الإقليمي" value={fmtPoints(s.flags.tension)} />
      </div>
      <div className="grid grid-2" style={{ marginTop: 14 }}>
        {(Object.keys(DEFENSE_LABELS) as (keyof typeof DEFENSE_LABELS)[]).map((k) => (
          <article className="card" key={k}>
            <div className="row">
              <strong>{DEFENSE_LABELS[k]}</strong>
              <span>{fmtPoints(s.defense[k])}</span>
            </div>
            <Bar value={s.defense[k]} />
          </article>
        ))}
      </div>
    </Page>
  );
}

export function Education() {
  const s = useGame().state!;
  const delayed = s.delayedEffects.filter((e) => e.deltas.humanCapital || e.deltas.research);
  return (
    <Page title="التعليم ورأس المال البشري" lead="الاستثمار التعليمي غالٍ اليوم ومثمر بعد سنوات. بدونه تتعطل الرقائق والذكاء الاصطناعي والصناعة المتقدمة.">
      <div className="grid grid-3">
        <MetricCard label="رأس المال البشري" value={fmtPoints(s.humanCapital)} />
        <MetricCard label="جودة التعليم" value={fmtPoints(s.educationQuality)} />
        <MetricCard label="البحث" value={fmtPoints(s.research)} />
      </div>
      <article className="card" style={{ marginTop: 14 }}>
        <h3>آثار مؤجلة</h3>
        {delayed.length ? (
          <ul>
            {delayed.map((e) => (
              <li key={e.id}>
                {e.year}: {e.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted tiny">لا موجات تعليمية مؤجلة حالياً.</p>
        )}
      </article>
    </Page>
  );
}

export function Infrastructure() {
  const s = useGame().state!;
  const rows = [
    ["الطرق", s.roads],
    ["السكك", s.rail],
    ["الموانئ", s.ports],
    ["المطارات", s.airports],
    ["اللوجستيات", s.logistics],
    ["البنية الرقمية", s.digital],
    ["الشبكة الكهربائية", s.grid],
  ] as const;
  return (
    <Page title="البنية التحتية" lead="الطرق والموانئ والشبكة الرقمية تخفض كلفة كل شيء آخر.">
      <MetricCard label="مؤشر البنية" value={fmtPoints(s.infrastructure)} />
      <div className="grid grid-2" style={{ marginTop: 14 }}>
        {rows.map(([label, v]) => (
          <article className="card" key={label}>
            <div className="row">
              <strong>{label}</strong>
              <span>{fmtPoints(v)}</span>
            </div>
            <Bar value={v} />
          </article>
        ))}
      </div>
    </Page>
  );
}

function Page({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>{title}</h2>
          <p>{lead}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
