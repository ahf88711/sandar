import type { ReactNode, SVGProps } from "react";
import {
  SCREEN_LABELS,
  debtRatio,
  energyReserve,
  fmtMoney,
  fmtNum,
  fmtPct,
  fmtSignedPct,
} from "../engine";
import type { ScreenId } from "../engine";
import { useGame } from "../game/store";
import { Emblem } from "./widgets";

const PRIMARY: { id: ScreenId | "more"; label: string }[] = [
  { id: "home", label: "الرئيسية" },
  { id: "economy", label: "الاقتصاد" },
  { id: "projects", label: "المشاريع" },
  { id: "world", label: "العالم" },
  { id: "more", label: "المزيد" },
];

const MORE: ScreenId[] = [
  "decisions",
  "energy",
  "industry",
  "tech",
  "defense",
  "education",
  "infrastructure",
  "stats",
  "settings",
];

const GROUPS: { label: string; items: ScreenId[] }[] = [
  { label: "القيادة", items: ["home", "economy", "decisions"] },
  { label: "التنمية", items: ["energy", "industry", "tech", "education", "infrastructure"] },
  { label: "القوة", items: ["defense", "projects", "world"] },
  { label: "المتابعة", items: ["stats", "settings"] },
];

export function Layout({ children }: { children: ReactNode }) {
  const g = useGame();
  const s = g.state!;
  const reserve = energyReserve(s);
  const chips = [
    { label: "الناتج", value: fmtMoney(s.gdp) },
    { label: "النمو", value: fmtSignedPct(s.gdpGrowth) },
    { label: "الاستقرار", value: fmtNum(s.stability, 0) },
    { label: "الدين", value: fmtPct(debtRatio(s), 0) },
    { label: "الطاقة", value: fmtPct(reserve, 0) },
    { label: "الرضا", value: fmtNum(s.approval, 0) },
  ];

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
        <div className="brand-inline">
          <Emblem size={32} />
          <div>
            <strong>سندار</strong>
            <small>{s.year} · {s.leaderName}</small>
          </div>
        </div>
        <div className="status-strip" aria-label="مؤشرات سريعة">
          {chips.map((c) => (
            <div className="status-chip" key={c.label}>
              <span>{c.label}</span>
              <strong>{c.value}</strong>
            </div>
          ))}
        </div>
        <button className="end-year end-year-desktop" onClick={g.endTurn} disabled={!!s.ending}>
          إنهاء السنة
        </button>
      </header>

      <main className="main">{children}</main>

      <div className="end-year-bar">
        <button className="end-year" onClick={g.endTurn} disabled={!!s.ending}>
          إنهاء السنة
        </button>
      </div>

      <nav className="mobile-nav" aria-label="التنقل الرئيسي">
        {PRIMARY.map((item) => {
          const active = item.id === "more" ? g.moreOpen : g.screen === item.id && !g.moreOpen;
          return (
            <button
              key={item.id}
              className={active ? "active" : ""}
              onClick={() => {
                if (item.id === "more") g.setMoreOpen(!g.moreOpen);
                else g.setScreen(item.id);
              }}
            >
              <span className="nav-ico">
                <NavGlyph name={item.id} />
                {item.id === "more" && s.pendingDecisions.length ? (
                  <span className="badge">{s.pendingDecisions.length}</span>
                ) : null}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {g.moreOpen ? (
        <>
          <button className="sheet-backdrop" aria-label="إغلاق الخلفية" onClick={() => g.setMoreOpen(false)} />
          <div className="more-sheet" role="dialog" aria-label="المزيد من الأقسام">
            <div className="sheet-handle" />
            <button className="sheet-item" onClick={() => g.setMoreOpen(false)}>
              إغلاق القائمة
            </button>
            {MORE.map((id) => (
              <button
                key={id}
                className={`sheet-item ${g.screen === id ? "active" : ""}`}
                onClick={() => g.setScreen(id)}
              >
                <span>{SCREEN_LABELS[id]}</span>
                {id === "decisions" && s.pendingDecisions.length ? (
                  <span className="pill warn">{s.pendingDecisions.length}</span>
                ) : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function NavGlyph({ name }: { name: string }) {
  const p: SVGProps<SVGSVGElement> = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    "aria-hidden": true,
  };
  if (name === "home") {
    return (
      <svg {...p}>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }
  if (name === "economy") {
    return (
      <svg {...p}>
        <path d="M5 19V9M10 19V5M15 19v-7M20 19V8" />
      </svg>
    );
  }
  if (name === "projects") {
    return (
      <svg {...p}>
        <path d="M4 7h16M4 12h16M4 17h10" />
      </svg>
    );
  }
  if (name === "world") {
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="8" />
        <path d="M4 12h16M12 4c2.5 2.8 2.5 13.2 0 16M12 4c-2.5 2.8-2.5 13.2 0 16" />
      </svg>
    );
  }
  return (
    <svg {...p}>
      <path d="M6 8h12M6 12h12M6 16h8" />
    </svg>
  );
}
