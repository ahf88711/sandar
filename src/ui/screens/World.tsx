import { DIPLO_LABELS, MAX_DIPLO_ACTIONS, STANCE_LABELS, fmtMoney, fmtPoints, stanceFromRelation, type DiploAction } from "../../engine";
import { useGame } from "../../game/store";
import { Bar } from "../widgets";

const ACTIONS: DiploAction[] = ["improve", "trade", "tech", "defense", "energy", "cool"];

export function World() {
  const g = useGame();
  const s = g.state!;
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>العلاقات الدولية</h2>
          <p>الدول تتصرف وفق مصالحها. حركتان دبلوماسيتان كل سنة.</p>
        </div>
        <span className="pill">متبقٍ {MAX_DIPLO_ACTIONS - s.flags.diploActionsThisYear}</span>
      </div>
      <div className="cards-lg">
        {s.nations.map((n) => {
          const stance = stanceFromRelation(n.relation);
          return (
            <article className="card stack" key={n.id}>
              <div className="row">
                <h3>{n.name}</h3>
                <span className="pill">{STANCE_LABELS[stance]}</span>
              </div>
              <p className="tiny">{n.blurb}</p>
              <Bar value={n.relation} />
              <div className="tiny muted">
                ناتج {fmtMoney(n.gdp)} · تقنية {fmtPoints(n.tech)} · عسكري {fmtPoints(n.military)} · تجارة {fmtMoney(n.tradeVolume)}
              </div>
              <div className="tiny">
                {n.deals.trade ? "تجارة · " : ""}
                {n.deals.tech ? "تقنية · " : ""}
                {n.deals.defense ? "دفاع · " : ""}
                {n.deals.energy ? "طاقة · " : ""}
                {n.deals.sanctioned ? "عقوبات · " : ""}
                {n.deals.exportBan ? "حظر تصدير" : ""}
              </div>
              <p className="tiny muted">{n.lastAction}</p>
              <div className="action-list">
                {ACTIONS.map((a) => (
                  <button
                    key={a}
                    className="btn"
                    disabled={!!s.ending || s.flags.diploActionsThisYear >= MAX_DIPLO_ACTIONS}
                    onClick={() => g.diplo(n.id, a)}
                  >
                    {DIPLO_LABELS[a]}
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
