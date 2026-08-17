import { BUDGET_LABELS, allProjects, fmtMoney, fmtNum, projectDef, reqGaps } from "../../engine";
import { useGame } from "../../game/store";
import { Bar } from "../widgets";

export function Projects() {
  const g = useGame();
  const s = g.state!;
  const cats = ["energy", "industry", "computing", "tech", "education", "infrastructure", "defense"] as const;
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>المشاريع الوطنية</h2>
          <p>حد أقصى خمسة مشاريع متزامنة. الإنشاء يستغرق سنوات، والتشغيل يبقى بعد الافتتاح.</p>
        </div>
        <span className="pill">نشط {s.activeProjects.length} / 5</span>
      </div>

      {s.activeProjects.length ? (
        <div className="grid grid-2" style={{ marginBottom: 14 }}>
          {s.activeProjects.map((p) => {
            const def = projectDef(p.id);
            if (!def) return null;
            const done = (p.yearsTotal - p.yearsLeft) / p.yearsTotal;
            return (
              <article className="card" key={p.id}>
                <div className="row">
                  <h3>{def.name}</h3>
                  {p.stalled ? <span className="pill danger">متعثر</span> : <span className="pill">متبقٍ {p.yearsLeft} س</span>}
                </div>
                <Bar value={done * 100} />
                <p className="tiny muted">{def.summary}</p>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="muted">لا مشاريع قيد الإنشاء.</p>
      )}

      {cats.map((cat) => (
        <section key={cat} style={{ marginTop: 18 }}>
          <h3>{cat === "computing" ? "الحوسبة" : cat === "tech" ? "التقنية" : BUDGET_LABELS[cat as keyof typeof BUDGET_LABELS] ?? cat}</h3>
          <div className="grid grid-2">
            {allProjects()
              .filter((p) => p.category === cat)
              .map((p) => {
                const done = s.completedProjects.includes(p.id);
                const active = s.activeProjects.some((a) => a.id === p.id);
                const check = g.canStart(p.id);
                const gaps = reqGaps(s, p.requires);
                return (
                  <article className="card stack" key={p.id}>
                    <div className="row">
                      <strong>{p.name}</strong>
                      {done ? <span className="pill ok">مكتمل</span> : active ? <span className="pill">جارٍ</span> : null}
                    </div>
                    <p className="tiny">{p.detail}</p>
                    <div className="tiny muted">
                      تكلفة {fmtMoney(p.cost)} · {p.duration} سنوات · تشغيل سنوي {fmtMoney(p.opCost)}
                      {p.energyUse ? ` · كهرباء ${fmtNum(p.energyUse)}` : ""}
                    </div>
                    {p.risk ? <div className="tiny">مخاطرة: {p.risk}</div> : null}
                    {!done && !active && gaps.length ? (
                      <div className="tiny muted">المتطلبات: {gaps.join(" · ")}</div>
                    ) : null}
                    <button className="btn" disabled={done || active || !check.ok || !!s.ending} onClick={() => g.start(p.id)}>
                      بدء المشروع
                    </button>
                  </article>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
