import type { ReactNode } from "react";
import { SCREEN_LABELS, fmtMoney, fmtNum, fmtPct } from "../engine";
import type { ScreenId } from "../engine";
import { useGame } from "../game/store";
import { Emblem } from "./widgets";

const PRIMARY: ScreenId[] = ["home", "economy", "projects", "world"];
const GROUPS: { label: string; items: ScreenId[] }[] = [
  { label: "القيادة", items: ["home", "economy", "decisions"] },
  { label: "التنمية", items: ["energy", "industry", "tech", "education", "infrastructure"] },
  { label: "القوة", items: ["defense", "projects", "world"] },
  { label: "المتابعة", items: ["stats", "settings"] },
];

export function Layout({ children }: { children: ReactNode }) {
  const g = useGame();
  const s = g.state!;
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <Emblem size={40} />
          <div>
            <h1>سندار</h1>
            <small>{s.leaderName} · {s.year}</small>
          </div>
        </div>
        {GROUPS.map((group) => (
          <div className="nav-group" key={group.label}>
            <div className="nav-label">{group.label}</div>
            {group.items.map((id) => (
              <button
                key={id}
                className={`nav-btn ${g.screen === id ? "active" : ""}`}
                onClick={() => g.setScreen(id)}
              >
                <span>{SCREEN_LABELS[id]}</span>
                {id === "decisions" && s.pendingDecisions.length ? (
                  <span className="badge">{s.pendingDecisions.length}</span>
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </aside>

      <header className="topbar">
        <div className="top-metrics">
          <div className="top-metric">
            <span>الناتج</span>
            <strong>{fmtMoney(s.gdp)}</strong>
          </div>
          <div className="top-metric">
            <span>النمو</span>
            <strong>{fmtPct(s.gdpGrowth)}</strong>
          </div>
          <div className="top-metric">
            <span>الاستقرار</span>
            <strong>{fmtNum(s.stability, 0)}</strong>
          </div>
          <div className="top-metric">
            <span>الخزانة</span>
            <strong>{fmtMoney(s.treasury)}</strong>
          </div>
        </div>
        <button className="end-year" onClick={g.endTurn} disabled={!!s.ending}>
          إنهاء السنة
        </button>
      </header>

      <main className="main">{children}</main>

      <nav className="mobile-nav">
        {PRIMARY.map((id) => (
          <button key={id} className={g.screen === id ? "active" : ""} onClick={() => g.setScreen(id)}>
            {id === "home" ? "الرئيسية" : SCREEN_LABELS[id]}
          </button>
        ))}
        <button className={g.moreOpen ? "active" : ""} onClick={() => g.setMoreOpen(!g.moreOpen)}>
          المزيد
        </button>
      </nav>

      {g.moreOpen ? (
        <div className="more-sheet">
          {(["energy", "industry", "tech", "defense", "education", "infrastructure", "stats", "decisions", "settings"] as ScreenId[]).map((id) => (
            <button key={id} className={`btn ${g.screen === id ? "primary" : ""}`} onClick={() => g.setScreen(id)}>
              {SCREEN_LABELS[id]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
