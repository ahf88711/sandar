import {
  debtRatio,
  energyCapacity,
  energyReserve,
  fmtMoney,
  fmtNum,
  fmtPct,
  fmtSignedPct,
  trendOf,
} from "../../engine";
import { useGame } from "../../game/store";
import { LineChart, MetricCard } from "../widgets";

export function Dashboard() {
  const { state, setScreen } = useGame();
  const s = state!;
  const prev = s.history.length > 1 ? s.history[s.history.length - 2] : s.history[0];
  const hist = s.history;
  const reserve = energyReserve(s);
  const warnings: string[] = [];
  if (s.pendingDecisions.length) warnings.push("توجد قرارات معلّقة يجب حسمها قبل إنهاء السنة.");
  if (reserve < 0.05) warnings.push("هامش الكهرباء حرج. الصناعة والذكاء الاصطناعي سيتضرران.");
  if (debtRatio(s) > 0.9) warnings.push("الدين العام يقترب من منطقة الخطر.");
  if (s.stability < 40) warnings.push("الاستقرار الاجتماعي هش.");
  if (s.inflation > 0.12) warnings.push("التضخم يأكل الدخل ويضغط الشرعية.");
  if (s.activeProjects.some((p) => p.stalled)) warnings.push("أحد المشاريع متعثر مالياً.");

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>رئاسة مجلس الوزراء</h2>
          <p>
            {s.countryName} · {s.capitalName} · السنة {s.year}
          </p>
        </div>
        <button className="btn primary" onClick={() => setScreen("decisions")}>
          القرارات ({s.pendingDecisions.length})
        </button>
      </div>

      {warnings.map((w) => (
        <div className="warn-banner" key={w}>
          {w}
        </div>
      ))}

      <div className="stack">
        <MetricCard label="الناتج المحلي الإجمالي" value={fmtMoney(s.gdp)} hint={`نمو ${fmtSignedPct(s.gdpGrowth)}`} trend={trendOf(s.gdp, prev?.gdp)} />
        <MetricCard label="الميزانية" value={fmtMoney(s.deficit)} hint={s.deficit > 0 ? "عجز" : "فائض"} trend={trendOf(s.deficit, prev ? prev.expenditure - prev.revenue : undefined, true)} />
        <MetricCard label="الدين العام" value={fmtMoney(s.debt)} hint={`نسبة الدين ${fmtPct(debtRatio(s))}`} trend={trendOf(debtRatio(s), prev?.debtRatio, true)} />
        <MetricCard label="الاستقرار" value={fmtNum(s.stability, 0)} hint={`رضا ${fmtNum(s.approval, 0)}`} trend={trendOf(s.stability, prev?.stability)} />
        <MetricCard label="السكان" value={`${fmtNum(s.population)} مليون`} hint={`بطالة ${fmtPct(s.unemployment)}`} trend={trendOf(s.unemployment, prev?.unemployment, true)} />
        <MetricCard label="التضخم" value={fmtPct(s.inflation)} trend={trendOf(s.inflation, prev?.inflation, true)} />
        <MetricCard label="الطاقة" value={`${fmtNum(energyCapacity(s))} غيغاواط`} hint={`طلب ${fmtNum(s.energyDemand)} · هامش ${fmtPct(reserve)}`} trend={trendOf(reserve, prev ? (prev.energyCapacity - prev.energyDemand) / Math.max(0.1, prev.energyDemand) : undefined)} />
        <MetricCard label="القدرة الصناعية" value={fmtNum(s.industrialCapacity)} trend={trendOf(s.industrialCapacity, prev?.industrialCapacity)} />
        <MetricCard label="التعليم" value={fmtNum(s.humanCapital)} hint={`جودة ${fmtNum(s.educationQuality)}`} trend={trendOf(s.humanCapital, prev?.education)} />
        <MetricCard label="التقنية" value={fmtNum(s.technology)} trend={trendOf(s.technology, prev?.technology)} />
        <MetricCard label="القدرة الحاسوبية" value={fmtNum(s.computing)} hint={`ذكاء اصطناعي ${fmtNum(s.aiCapability)}`} trend={trendOf(s.aiCapability, prev?.aiCapability)} />
        <MetricCard label="القوة العسكرية" value={fmtNum(s.militaryPower)} hint={`نفوذ ${fmtNum(s.influence)}`} trend={trendOf(s.militaryPower, prev?.military)} />
      </div>

      <div className="stack" style={{ marginTop: 14 }}>
        <article className="card">
          <h3>مسار الناتج</h3>
          <LineChart values={hist.map((h) => h.gdp)} labels={hist.map((h) => String(h.year))} tall />
        </article>
        <article className="card">
          <h3>سجل قريب</h3>
          <div className="list">
            {s.log.slice(-6).reverse().map((l, i) => (
              <div className="list-item" key={`${l.year}-${l.title}-${i}`}>
                <div className="tiny muted">{l.year} · {kindAr(l.kind)}</div>
                <strong>{l.title}</strong>
                <div className="tiny">{l.detail}</div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

function kindAr(k: string): string {
  const map: Record<string, string> = {
    event: "حدث",
    project: "مشروع",
    diplomacy: "دبلوماسية",
    decision: "قرار",
    system: "نظام",
    warning: "تنبيه",
  };
  return map[k] ?? k;
}
