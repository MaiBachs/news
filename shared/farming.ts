export const farmAreas = [
  { id: 'vuon', label: 'Vườn' },
  { id: 'ao', label: 'Ao' },
  { id: 'ruong', label: 'Ruộng' },
] as const;

export type FarmAreaId = (typeof farmAreas)[number]['id'];
export interface FarmSource { label: string; url: string }

export interface FarmModel {
  id: string;
  area: FarmAreaId;
  title: string;
  fit: string;
  care: string;
  pilot: string;
  costs: string;
  outlet: string;
  decision: string;
  sources: readonly FarmSource[];
}

export interface FarmEvidence {
  id: string;
  area: FarmAreaId;
  title: string;
  observed: string;
  application: string;
  source: FarmSource;
}

export interface FarmPlan {
  strategy: Record<FarmAreaId, { title: string; summary: string; decision: string }>;
  rollout: { period: string; action: string }[];
  gardenArea: number;
  gardenPlans: { id: string; label: string; leafArea: number; herbArea: number }[];
}

export interface FarmCatalog {
  models: FarmModel[];
  evidence: FarmEvidence[];
  plan: FarmPlan;
}
