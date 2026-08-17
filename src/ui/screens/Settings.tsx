import { useGame } from "../../game/store";

export function Settings() {
  const g = useGame();
  const s = g.state!;
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>الإعدادات</h2>
          <p>الحفظ محلي على هذا الجهاز. يُحفظ تلقائياً بعد كل قرار أو سنة.</p>
        </div>
      </div>
      <div className="grid grid-2">
        <article className="card stack">
          <h3>الحفظ</h3>
          <p className="tiny muted">
            {s.countryName} · {s.leaderName} · {s.year}
          </p>
          <button className="btn primary" onClick={g.save}>
            حفظ الآن
          </button>
          <button className="btn" onClick={g.backToMenu}>
            العودة إلى القائمة
          </button>
        </article>
        <article className="card stack">
          <h3>اللعبة</h3>
          <button className="btn" onClick={() => g.setTutorial(true)}>
            إعادة الدليل
          </button>
          <button
            className="btn danger"
            onClick={() => {
              if (window.confirm("إعادة البداية تحذف التقدم الحالي. هل تريد المتابعة؟")) g.reset();
            }}
          >
            إعادة البداية
          </button>
        </article>
        <article className="card">
          <h3>حول سندار</h3>
          <p className="tiny">
            لعبة قيادة وطنية عربية. المحاكاة متعمدة في بساطتها: أنظمة قليلة مترابطة أفضل من أرقام لا تغيّر القرار.
          </p>
        </article>
      </div>
    </div>
  );
}
