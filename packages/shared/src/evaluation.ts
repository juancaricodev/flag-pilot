export interface Evaluation {
  id: string;
  flagId: string;
  userId: string | null;
  result: boolean;
  createdAt: string;
}

export interface EvaluationRequest {
  flag: string;
}

export interface EvaluationContextRequest {
  flag: string;
  userId: string;
}

export interface EvaluationResponse {
  enabled: boolean;
}

export interface FlagMetrics {
  flagId: string;
  flagName: string;
  total: number;
  enabled: number;
  disabled: number;
}

export interface MetricsSummary {
  totalEvaluations: number;
  flags: FlagMetrics[];
}
