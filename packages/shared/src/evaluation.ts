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
