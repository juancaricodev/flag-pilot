export interface Flag {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rolloutPct: number;
  whitelist: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlagInput {
  name: string;
  description?: string;
  enabled?: boolean;
}

export interface UpdateFlagInput {
  name?: string;
  description?: string;
  enabled?: boolean;
  rolloutPct?: number;
  whitelist?: string[];
}
