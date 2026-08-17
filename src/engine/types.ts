export const SAVE_VERSION = 1;

export type BudgetKey =
  | "economy"
  | "energy"
  | "industry"
  | "tech"
  | "defense"
  | "education"
  | "infrastructure";

export type IndustryKey =
  | "basic"
  | "advanced"
  | "automotive"
  | "defense"
  | "electronics"
  | "semiconductor"
  | "robotics"
  | "aerospace";

export type DefenseKey =
  | "army"
  | "air"
  | "airDefense"
  | "navy"
  | "missiles"
  | "drones"
  | "cyber"
  | "space"
  | "domestic";

export type ProjectCategory = BudgetKey | "computing";

export type RelationStance =
  | "hostile"
  | "tense"
  | "cool"
  | "neutral"
  | "cordial"
  | "friendly"
  | "allied";

export type NationPersonality =
  | "trader"
  | "energy"
  | "technocrat"
  | "cautious"
  | "revisionist";

export type ScreenId =
  | "home"
  | "economy"
  | "energy"
  | "industry"
  | "tech"
  | "defense"
  | "education"
  | "infrastructure"
  | "projects"
  | "world"
  | "stats"
  | "decisions"
  | "settings";

export interface BudgetAlloc {
  economy: number;
  energy: number;
  industry: number;
  tech: number;
  defense: number;
  education: number;
  infrastructure: number;
}

export interface Industries {
  basic: number;
  advanced: number;
  automotive: number;
  defense: number;
  electronics: number;
  semiconductor: number;
  robotics: number;
  aerospace: number;
}

export interface DefenseCaps {
  army: number;
  air: number;
  airDefense: number;
  navy: number;
  missiles: number;
  drones: number;
  cyber: number;
  space: number;
  domestic: number;
}

export interface HistoryPoint {
  year: number;
  gdp: number;
  growth: number;
  debt: number;
  debtRatio: number;
  population: number;
  unemployment: number;
  inflation: number;
  stability: number;
  approval: number;
  energyCapacity: number;
  energyDemand: number;
  industrialCapacity: number;
  technology: number;
  aiCapability: number;
  computing: number;
  education: number;
  military: number;
  influence: number;
  revenue: number;
  expenditure: number;
}

export interface DelayedEffect {
  id: string;
  year: number;
  label: string;
  deltas: Partial<NumericPatch>;
}

export interface ActiveProject {
  id: string;
  yearsLeft: number;
  yearsTotal: number;
  spent: number;
  stalled: boolean;
}

export interface LogEntry {
  year: number;
  kind: "event" | "project" | "diplomacy" | "decision" | "system" | "warning";
  title: string;
  detail: string;
}

export interface YearReport {
  year: number;
  gdpBefore: number;
  gdpAfter: number;
  growth: number;
  revenue: number;
  expenditure: number;
  deficit: number;
  debt: number;
  debtRatio: number;
  populationBefore: number;
  populationAfter: number;
  unemployment: number;
  inflation: number;
  stability: number;
  approval: number;
  completedProjects: string[];
  events: string[];
  techDelta: number;
  aiDelta: number;
  energyReserve: number;
  industryDelta: number;
  worldNews: string[];
  warnings: string[];
  causes: string[];
}

export interface PendingDecision {
  id: string;
  title: string;
  body: string;
  urgency: "normal" | "high";
  choices: DecisionChoice[];
}

export interface DecisionChoice {
  id: string;
  label: string;
  hint: string;
}

export interface NationDeal {
  trade: boolean;
  tech: boolean;
  defense: boolean;
  energy: boolean;
  sanctioned: boolean;
  exportBan: boolean;
}

export interface NationState {
  id: string;
  name: string;
  adjective: string;
  blurb: string;
  personality: NationPersonality;
  gdp: number;
  tech: number;
  military: number;
  energy: number;
  relation: number;
  tradeVolume: number;
  deals: NationDeal;
  lastAction: string;
}

export interface GameFlags {
  yearsOfHighDebt: number;
  yearsOfInstability: number;
  yearsOfDecline: number;
  yearsOfEnergyCrisis: number;
  consecutiveGrowth: number;
  consecutiveDecline: number;
  lastGdpGrowth: number;
  tutorialDone: boolean;
  diploActionsThisYear: number;
  scholarshipsEver: boolean;
  austerityYears: number;
  stimulusYears: number;
  chipAccessShock: number;
  oilPrice: number;
  globalGrowth: number;
  tension: number;
}

export interface NumericPatch {
  gdp: number;
  treasury: number;
  debt: number;
  inflation: number;
  unemployment: number;
  stability: number;
  approval: number;
  humanCapital: number;
  educationQuality: number;
  research: number;
  technology: number;
  computing: number;
  dataCenters: number;
  semiconductors: number;
  aiCapability: number;
  automation: number;
  roboticsTech: number;
  cybersecurity: number;
  spaceTech: number;
  fossilCapacity: number;
  renewableCapacity: number;
  grid: number;
  energyCost: number;
  energyDemand: number;
  industrialCapacity: number;
  supplyChain: number;
  productivity: number;
  investment: number;
  exports: number;
  imports: number;
  roads: number;
  rail: number;
  ports: number;
  airports: number;
  logistics: number;
  digital: number;
  infrastructure: number;
  militaryPower: number;
  deterrence: number;
  influence: number;
  population: number;
  taxRate: number;
  spendRate: number;
}

export interface GameState {
  version: number;
  seed: number;
  year: number;
  turn: number;
  startedAt: number;
  countryName: string;
  capitalName: string;
  leaderName: string;

  gdp: number;
  gdpGrowth: number;
  treasury: number;
  revenue: number;
  expenditure: number;
  deficit: number;
  debt: number;
  inflation: number;
  investment: number;
  productivity: number;
  exports: number;
  imports: number;

  taxRate: number;
  spendRate: number;
  budget: BudgetAlloc;

  population: number;
  unemployment: number;
  stability: number;
  approval: number;
  humanCapital: number;
  educationQuality: number;

  fossilCapacity: number;
  renewableCapacity: number;
  energyDemand: number;
  energyCost: number;
  grid: number;

  industries: Industries;
  industrialCapacity: number;
  supplyChain: number;

  technology: number;
  research: number;
  computing: number;
  dataCenters: number;
  semiconductors: number;
  aiCapability: number;
  automation: number;
  roboticsTech: number;
  cybersecurity: number;
  spaceTech: number;

  defense: DefenseCaps;
  militaryPower: number;
  deterrence: number;

  roads: number;
  rail: number;
  ports: number;
  airports: number;
  logistics: number;
  digital: number;
  infrastructure: number;

  influence: number;
  nations: NationState[];

  activeProjects: ActiveProject[];
  completedProjects: string[];

  delayedEffects: DelayedEffect[];
  pendingDecisions: PendingDecision[];
  resolvedDecisionIds: string[];

  history: HistoryPoint[];
  log: LogEntry[];
  lastReport: YearReport | null;
  showReport: boolean;

  flags: GameFlags;
  ending: Ending | null;
}

export interface Ending {
  type: "victory" | "defeat";
  path: string;
  title: string;
  body: string;
}

export interface ProjectDef {
  id: string;
  name: string;
  summary: string;
  detail: string;
  category: ProjectCategory;
  cost: number;
  duration: number;
  opCost: number;
  energyUse: number;
  skilledNeed: number;
  requires: ProjectReq;
  onComplete: Partial<NumericPatch> & {
    industries?: Partial<Industries>;
    defense?: Partial<DefenseCaps>;
  };
  risk?: string;
}

export interface ProjectReq {
  education?: number;
  technology?: number;
  infrastructure?: number;
  energyReserve?: number;
  industry?: number;
  computing?: number;
  semiconductors?: number;
  research?: number;
  digital?: number;
  spaceTech?: number;
  projects?: string[];
  industryKey?: { key: IndustryKey; min: number };
}

export interface EventDef {
  id: string;
  title: string;
  body: string;
  weight: (s: GameState) => number;
  apply: (s: GameState, rng: () => number) => GameState;
}

export interface DecisionDef {
  id: string;
  title: string;
  body: string;
  urgency?: "normal" | "high";
  weight: (s: GameState) => number;
  choices: {
    id: string;
    label: string;
    hint: string;
    apply: (s: GameState, rng: () => number) => GameState;
  }[];
}

export type AppView = "menu" | "playing" | "tutorial";
