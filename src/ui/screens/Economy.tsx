import { BUDGET_KEYS, BUDGET_LABELS, debtRatio, fmtMoney, fmtPct, interestRate, normalizeBudget, trendOf } from "../../engine";
import type { BudgetAlloc, BudgetKey } from "../../engine";
import { useGame } from "../../game/store";
import { LineChart, MetricCard, Slider, StatRow } from "../widgets";

export function Economy() {
  const g = useGame();
  const s = g.state!;
  const prev = s.history[s.history.length - 2];

  const setShare = (key: BudgetKey, value: number) => {
    const rest = BUDGET_KEYS.filter((k) => k !== key);
    const others = Math.max(0.02, 1 - value);
    const currentRest = rest.reduce((a, k) => a + s.budget[k], 0) || 1;
    const next: BudgetAlloc = { ...s.budget, [key]: value };
    for (const k of rest) next[k] = (s.budget[k] / currentRest) * others;
    g.updateBudget(normalizeBudget(next));
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>الاقتصاد والمالية</h2>
          <p>الضريبة والإنفاق يحددان هامش المناورة. العجز اليوم دين وخدمة غداً.</p>
        </div>
      </div>
      <div className="grid grid-4">
        <MetricCard label="الإيرادات" value={fmtMoney(s.revenue)} trend={trendOf(s.revenue, prev?.revenue)} />
        <MetricCard label="المصروفات" value={fmtMoney(s.expenditure)} trend={trendOf(s.expenditure, prev?.expenditure, true)} />
        <MetricCard label={s.deficit >= 0 ? "العجز" : "الفائض"} value={fmtMoney(Math.abs(s.deficit))} />
        <MetricCard label="نسبة الدين إلى الناتج" value={fmtPct(debtRatio(s))} trend={trendOf(debtRatio(s), prev?.debtRatio, true)} />
      </div>

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <article className="card stack">
          <h3>أدوات السياسة</h3>
          <Slider label="معدل الضريبة" min={0.08} max={0.4} step={0.002} value={s.taxRate} display={fmtPct(s.taxRate)} onChange={g.updateTax} />
          <Slider label="الإنفاق العام من الناتج" min={0.12} max={0.36} step={0.002} value={s.spendRate} display={fmtPct(s.spendRate)} onChange={g.updateSpend} />
          <StatRow label="خدمة الدين التقديرية" value={fmtMoney(s.debt * interestRate(s))} />
          <StatRow label="الخزانة" value={fmtMoney(s.treasury)} />
          <StatRow label="الاستثمار" value={fmtMoney(s.investment)} />
          <StatRow label="الصادرات / الواردات" value={`${fmtMoney(s.exports)} / ${fmtMoney(s.imports)}`} />
          <p className="tiny muted">الزيادات الكبيرة في الإنفاق لا تعطي عائداً خطياً. خدمة الدين تبتلع أبواب التنمية إن تُرك العجز يتراكم.</p>
        </article>
        <article className="card stack">
          <h3>توزيع الإنفاق</h3>
          {BUDGET_KEYS.map((k) => (
            <Slider
              key={k}
              label={BUDGET_LABELS[k]}
              min={0.04}
              max={0.4}
              step={0.005}
              value={s.budget[k]}
              display={fmtPct(s.budget[k], 0)}
              onChange={(n) => setShare(k, n)}
            />
          ))}
        </article>
      </div>
      <article className="card" style={{ marginTop: 14 }}>
        <h3>الدين والناتج</h3>
        <LineChart values={s.history.map((h) => h.debt)} color="#e0b15a" />
      </article>
    </div>
  );
}
