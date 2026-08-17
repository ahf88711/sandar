import { useEffect } from "react";
import { useGame } from "./game/store";
import { Layout } from "./ui/Layout";
import { Dashboard } from "./ui/screens/Dashboard";
import { Decisions } from "./ui/screens/Decisions";
import { Economy } from "./ui/screens/Economy";
import { Menu } from "./ui/screens/Menu";
import { GameOverModal, TutorialModal, YearReportModal } from "./ui/screens/Overlays";
import { Projects } from "./ui/screens/Projects";
import { Settings } from "./ui/screens/Settings";
import { Stats } from "./ui/screens/Stats";
import { Defense, Education, Energy, Industry, Infrastructure, Tech } from "./ui/screens/Systems";
import { World } from "./ui/screens/World";

export function App() {
  const g = useGame();

  const dismissToast = g.dismissToast;
  useEffect(() => {
    if (!g.toast) return;
    const t = window.setTimeout(() => dismissToast(), 2800);
    return () => window.clearTimeout(t);
  }, [dismissToast, g.toast]);

  if (g.phase === "menu" && !g.tutorial) {
    return (
      <>
        <Menu />
        {g.toast ? <div className="toast">{g.toast}</div> : null}
      </>
    );
  }
  if (g.phase === "menu" && g.tutorial) {
    return (
      <>
        <Menu />
        <TutorialModal />
      </>
    );
  }
  if (!g.state) return <Menu />;

  return (
    <div className="app">
      <Layout>
        {g.screen === "home" && <Dashboard />}
        {g.screen === "economy" && <Economy />}
        {g.screen === "energy" && <Energy />}
        {g.screen === "industry" && <Industry />}
        {g.screen === "tech" && <Tech />}
        {g.screen === "defense" && <Defense />}
        {g.screen === "education" && <Education />}
        {g.screen === "infrastructure" && <Infrastructure />}
        {g.screen === "projects" && <Projects />}
        {g.screen === "world" && <World />}
        {g.screen === "stats" && <Stats />}
        {g.screen === "decisions" && <Decisions />}
        {g.screen === "settings" && <Settings />}
      </Layout>
      <YearReportModal />
      <GameOverModal />
      <TutorialModal />
      {g.toast ? <div className="toast">{g.toast}</div> : null}
    </div>
  );
}
