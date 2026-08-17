import { useState } from "react";
import { useGame } from "../../game/store";
import { Emblem } from "../widgets";

export function Menu() {
  const g = useGame();
  const [name, setName] = useState("القائد");
  const [fresh, setFresh] = useState(false);

  return (
    <div className="menu">
      <div className="menu-card">
        <Emblem size={64} />
        <h1>سندار</h1>
        <p className="muted">عهد القيادة — حوّل دولة نامية إلى أمة وازنة عبر قرارات لها أثمان مترابطة.</p>
        {!fresh ? (
          <div className="stack" style={{ marginTop: 20 }}>
            <button className="btn primary" onClick={() => setFresh(true)}>
              لعبة جديدة
            </button>
            <button className="btn" disabled={!g.meta} onClick={g.continueGame}>
              متابعة اللعبة
              {g.meta ? ` · ${g.meta.year}` : ""}
            </button>
            <button className="btn ghost" onClick={() => g.setTutorial(true)}>
              دليل مختصر
            </button>
          </div>
        ) : (
          <div className="stack" style={{ marginTop: 20 }}>
            <label className="muted tiny">اسم القائد</label>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={28} />
            <button className="btn primary" onClick={() => g.newGame(name)}>
              ابدأ القيادة
            </button>
            <button className="btn ghost" onClick={() => setFresh(false)}>
              رجوع
            </button>
          </div>
        )}
        <p className="tiny muted" style={{ marginTop: 18 }}>
          كل سنة قرار. لا يوجد مسار واحد للانتصار، ولا إنفاق بلا ثمن.
        </p>
      </div>
    </div>
  );
}
