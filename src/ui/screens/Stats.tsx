import { fmtMoney, fmtPct, fmtPoints } from "../../engine";
import { useGame } from "../../game/store";
import { LineChart } from "../widgets";

export function Stats() {
  const s = useGame().state!;
  const h = s.history;
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>الإحصائيات</h2>
          <p>سلاسل زمنية تساعد على قراءة الاتجاه لا الزينة.</p>
        </div>
      </div>
      <div className="grid grid-2">
        <article className="card">
          <h3>الناتج المحلي</h3>
          <LineChart values={h.map((x) => x.gdp)} tall />
        </article>
        <article className="card">
          <h3>الدين العام</h3>
          <LineChart values={h.map((x) => x.debt)} color="#e0b15a" tall />
        </article>
        <article className="card">
          <h3>السكان</h3>
          <LineChart values={h.map((x) => x.population)} color="#f0d7a0" />
        </article>
        <article className="card">
          <h3>الطاقة</h3>
          <LineChart values={h.map((x) => x.energyCapacity)} />
        </article>
        <article className="card">
          <h3>التقنية والذكاء الاصطناعي</h3>
          <LineChart values={h.map((x) => x.technology)} />
          <LineChart values={h.map((x) => x.aiCapability)} color="#d4b06a" />
        </article>
        <article className="card">
          <h3>الصناعة والقوة</h3>
          <LineChart values={h.map((x) => x.industrialCapacity)} />
          <LineChart values={h.map((x) => x.military)} color="#e07070" />
        </article>
      </div>
      <article className="card" style={{ marginTop: 14 }}>
        <h3>ملخص رقمي</h3>
        <p className="tiny muted">
          ناتج {fmtMoney(s.gdp)} · نمو {fmtPct(s.gdpGrowth)} · دين {fmtMoney(s.debt)} · تعليم {fmtPoints(s.humanCapital)} · نفوذ{" "}
          {fmtPoints(s.influence)}
        </p>
      </article>
    </div>
  );
}
