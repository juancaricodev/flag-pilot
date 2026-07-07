export type FlagStatus = 'disabled' | 'partial' | 'enabled';

export interface Flag {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rolloutPct: number;
  whitelist: string[];
  status: FlagStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlagInput {
  name: string;
  description?: string;
  enabled?: boolean;
  rolloutPct?: number;
}

export interface UpdateFlagInput {
  name?: string;
  description?: string;
  enabled?: boolean;
  rolloutPct?: number;
  whitelist?: string[];
}
