import { useState } from "react";
import { fmtMoney, fmtPct, fmtSignedPct } from "../../engine";
import { useGame } from "../../game/store";
import { Emblem } from "../widgets";

export function YearReportModal() {
  const g = useGame();
  const r = g.state?.lastReport;
  if (!g.state?.showReport || !r) return null;
  return (
    <div className="overlay" role="dialog" aria-labelledby="yr-title">
      <div className="modal">
        <h2 id="yr-title">تقرير سنة {r.year}</h2>
        <p className="muted">ملخص ما تغيّر ولماذا، قبل الانتقال إلى قرارات العام الجديد.</p>
        <div className="grid grid-3" style={{ margin: "14px 0" }}>
          <div className="card">
            <div className="metric-kicker">الناتج</div>
            <div className="metric-value">{fmtMoney(r.gdpAfter)}</div>
            <div className="tiny">{fmtSignedPct(r.growth)}</div>
          </div>
          <div className="card">
            <div className="metric-kicker">المالية</div>
            <div className="metric-value">{fmtMoney(r.deficit)}</div>
            <div className="tiny">عجز/فائض · دين {fmtPct(r.debtRatio)}</div>
          </div>
          <div className="card">
            <div className="metric-kicker">المجتمع</div>
            <div className="metric-value">{fmtPct(r.unemployment)}</div>
            <div className="tiny">بطالة · تضخم {fmtPct(r.inflation)}</div>
          </div>
        </div>
        <div className="stack">
          <Block title="أسباب بارزة" items={r.causes} />
          <Block title="مشاريع اكتملت" items={r.completedProjects} empty="لا مشاريع مكتملة هذه السنة." />
          <Block title="أحداث" items={r.events} empty="سنة هادئة نسبياً على صعيد الصدمات." />
          <Block title="العالم" items={r.worldNews} empty="لا تحولات دبلوماسية حادة." />
          <Block title="تحذيرات" items={r.warnings} />
          <p className="tiny muted">
            الطاقة: هامش {fmtPct(r.energyReserve)} · التقنية {r.techDelta >= 0 ? "+" : ""}
            {r.techDelta.toFixed(1)} · الذكاء الاصطناعي {r.aiDelta >= 0 ? "+" : ""}
            {r.aiDelta.toFixed(1)} · الصناعة {r.industryDelta >= 0 ? "+" : ""}
            {r.industryDelta.toFixed(1)}
          </p>
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <span className="muted tiny">السكان {r.populationBefore.toFixed(1)} → {r.populationAfter.toFixed(1)} مليون</span>
          <button className="btn primary" onClick={g.closeReport}>
            متابعة
          </button>
        </div>
      </div>
    </div>
  );
}

function Block({ title, items, empty }: { title: string; items: string[]; empty?: string }) {
  if (!items.length && !empty) return null;
  return (
    <section>
      <h3>{title}</h3>
      {items.length ? (
        <ul>
          {items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      ) : (
        <p className="muted tiny">{empty}</p>
      )}
    </section>
  );
}

export function GameOverModal() {
  const g = useGame();
  const e = g.state?.ending;
  if (!e) return null;
  return (
    <div className="overlay">
      <div className="modal">
        <Emblem />
        <p className="pill">{e.type === "victory" ? "نهاية العهد: نجاح" : "نهاية العهد: إخفاق"}</p>
        <h2>{e.title}</h2>
        <p>{e.body}</p>
        <div className="row" style={{ marginTop: 18 }}>
          <button className="btn" onClick={g.backToMenu}>
            القائمة
          </button>
          <button className="btn primary" onClick={g.reset}>
            إعادة البداية
          </button>
        </div>
      </div>
    </div>
  );
}

export function TutorialModal() {
  const g = useGame();
  const [step, setStep] = useState(0);
  if (!g.tutorial) return null;
  const pages = [
    {
      title: "أنت قائد سندار",
      body: "كل دورة سنة كاملة. راجع المؤشرات، وزّع الميزانية، أطلق مشاريع، ثم أنهِ السنة لترى العواقب.",
    },
    {
      title: "لا يوجد إنفاق بلا ثمن",
      body: "رفع الإنفاق يسرّع بعض القطاعات ويرفع العجز والتضخم وطلب الكهرباء. العوائد تتناقص كلما أنفقت أكثر في الباب نفسه.",
    },
    {
      title: "المشاريع تحتاج زمناً وشروطاً",
      body: "لا مصنع رقائق من السنة الأولى. التعليم والبحث والطاقة والبنية أبواب لبعضها. الأثر التعليمي خصوصاً يتأخر سنوات.",
    },
    {
      title: "العالم يرد",
      body: "خمس دول تتصرف وفق مصالحها: تجارة، طاقة، تقنية، حذر، وصراع نفوذ. العلاقات ليست قائمة ثابتة.",
    },
    {
      title: "عدة طرق للنهضة",
      body: "يمكن أن تنتهي قوة اقتصادية أو صناعية أو تقنية أو مجتمعية أو عسكرية أو دولة متوازنة. الانهيار يأتي من تراكم الأخطاء لا من عقاب عشوائي.",
    },
  ];
  const page = pages[step]!;
  return (
    <div className="overlay">
      <div className="modal">
        <p className="tiny muted">دليل {step + 1} / {pages.length}</p>
        <h2>{page.title}</h2>
        <p>{page.body}</p>
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn ghost" onClick={() => g.setTutorial(false)}>
            إغلاق
          </button>
          {step < pages.length - 1 ? (
            <button className="btn primary" onClick={() => setStep(step + 1)}>
              التالي
            </button>
          ) : (
            <button className="btn primary" onClick={() => g.setTutorial(false)}>
              ابدأ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
