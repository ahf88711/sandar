import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyDecision,
  canStartProject,
  clearSave,
  createInitialState,
  diplomaticAction,
  dismissReport,
  endYear,
  hasSave,
  loadMeta,
  loadState,
  saveState,
  setBudget,
  setSpend,
  setTax,
  startProject,
  type BudgetAlloc,
  type DiploAction,
  type GameState,
  type SaveMeta,
  type ScreenId,
} from "../engine";

export type Phase = "menu" | "playing";

interface GameApi {
  phase: Phase;
  screen: ScreenId;
  state: GameState | null;
  meta: SaveMeta | null;
  toast: string | null;
  moreOpen: boolean;
  tutorial: boolean;
  setScreen: (s: ScreenId) => void;
  setMoreOpen: (v: boolean) => void;
  newGame: (leaderName: string) => void;
  continueGame: () => void;
  save: () => void;
  endTurn: () => void;
  choose: (decisionId: string, choiceId: string) => void;
  closeReport: () => void;
  start: (projectId: string) => void;
  canStart: (projectId: string) => { ok: true } | { ok: false; reason: string };
  diplo: (nationId: string, action: DiploAction) => void;
  updateBudget: (budget: BudgetAlloc) => void;
  updateTax: (n: number) => void;
  updateSpend: (n: number) => void;
  reset: () => void;
  backToMenu: () => void;
  dismissToast: () => void;
  setTutorial: (v: boolean) => void;
}

const Ctx = createContext<GameApi | null>(null);

function persist(s: GameState) {
  saveState(s);
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("menu");
  const [screen, setScreen] = useState<ScreenId>("home");
  const [state, setState] = useState<GameState | null>(null);
  const [meta, setMeta] = useState<SaveMeta | null>(() => loadMeta());
  const [toast, setToast] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [tutorial, setTutorial] = useState(false);

  const apply = useCallback((next: GameState, note?: string) => {
    setState(next);
    persist(next);
    setMeta({
      year: next.year,
      leaderName: next.leaderName,
      savedAt: Date.now(),
      countryName: next.countryName,
    });
    if (note) setToast(note);
  }, []);

  const api = useMemo<GameApi>(
    () => ({
      phase,
      screen,
      state,
      meta,
      toast,
      moreOpen,
      tutorial,
      setScreen: (s) => {
        setScreen(s);
        setMoreOpen(false);
      },
      setMoreOpen,
      newGame: (leaderName) => {
        const s = createInitialState({ leaderName });
        apply(s);
        setPhase("playing");
        setScreen("home");
        setTutorial(true);
      },
      continueGame: () => {
        const loaded = loadState();
        if (!loaded) {
          setToast("تعذر تحميل الحفظ. ابدأ لعبة جديدة.");
          return;
        }
        setState(loaded);
        setPhase("playing");
        setScreen("home");
      },
      save: () => {
        if (!state) return;
        persist(state);
        setToast("حُفظت اللعبة على هذا الجهاز.");
      },
      endTurn: () => {
        if (!state) return;
        if (state.pendingDecisions.length) {
          setScreen("decisions");
          setToast("احسم القرارات المعروضة قبل إنهاء السنة.");
          return;
        }
        apply(endYear(state));
        setScreen("home");
      },
      choose: (decisionId, choiceId) => {
        if (!state) return;
        apply(applyDecision(state, decisionId, choiceId));
      },
      closeReport: () => {
        if (!state) return;
        apply(dismissReport(state));
      },
      start: (projectId) => {
        if (!state) return;
        const check = canStartProject(state, projectId);
        if (!check.ok) {
          setToast(check.reason);
          return;
        }
        apply(startProject(state, projectId), "بدأ تنفيذ المشروع.");
      },
      canStart: (projectId) => {
        if (!state) return { ok: false, reason: "لا توجد لعبة." };
        return canStartProject(state, projectId);
      },
      diplo: (nationId, action) => {
        if (!state) return;
        apply(diplomaticAction(state, nationId, action));
      },
      updateBudget: (budget) => {
        if (!state) return;
        apply(setBudget(state, budget));
      },
      updateTax: (n) => {
        if (!state) return;
        apply(setTax(state, n));
      },
      updateSpend: (n) => {
        if (!state) return;
        apply(setSpend(state, n));
      },
      reset: () => {
        clearSave();
        setState(null);
        setMeta(null);
        setPhase("menu");
      },
      backToMenu: () => {
        if (state) persist(state);
        setPhase("menu");
        setMeta(loadMeta());
      },
      dismissToast: () => setToast(null),
      setTutorial,
    }),
    [apply, meta, moreOpen, phase, screen, state, toast, tutorial],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useGame(): GameApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGame outside provider");
  return ctx;
}

export function savedExists(): boolean {
  return hasSave();
}
