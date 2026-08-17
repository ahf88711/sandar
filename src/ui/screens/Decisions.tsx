import { useGame } from "../../game/store";

export function Decisions() {
  const g = useGame();
  const s = g.state!;
  const recent = s.log.filter((l) => l.kind === "event" || l.kind === "decision").slice(-10).reverse();
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>القرارات والأحداث</h2>
          <p>العواقب ليست كلها ظاهرة في النص. احكم بالسياق لا بالأرقام وحدها.</p>
        </div>
      </div>
      {s.pendingDecisions.length === 0 ? (
        <article className="card">
          <p>لا قرارات معلّقة. راقب الأحداث بعد إنهاء السنة.</p>
        </article>
      ) : (
        <div className="stack">
          {s.pendingDecisions.map((d) => (
            <article className="card stack" key={d.id}>
              <div className="row">
                <h3>{d.title}</h3>
                {d.urgency === "high" ? <span className="pill warn">ملحّ</span> : null}
              </div>
              <p>{d.body}</p>
              {d.choices.map((c) => (
                <button key={c.id} className="choice" onClick={() => g.choose(d.id, c.id)}>
                  <b>{c.label}</b>
                  <span>{c.hint}</span>
                </button>
              ))}
            </article>
          ))}
        </div>
      )}
      <section style={{ marginTop: 18 }}>
        <h3>سجل الأحداث والقرارات</h3>
        <div className="list">
          {recent.map((l, i) => (
            <div className="list-item" key={`${l.year}-${i}`}>
              <div className="tiny muted">{l.year}</div>
              <strong>{l.title}</strong>
              <div className="tiny">{l.detail}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
