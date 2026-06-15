export interface ModelBreakdown {
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cost: number;
  inputTokens: number;
  modelName: string;
  outputTokens: number;
}

export interface DailyUsage {
  agent: string;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  inputTokens: number;
  metadata?: {
    agents?: string[];
  };
  modelBreakdowns: ModelBreakdown[];
  modelsUsed: string[];
  outputTokens: number;
  period: string;
  totalCost: number;
  totalTokens: number;
}

export interface UsageData {
  daily: DailyUsage[];
  totals?: {
    cacheCreationTokens: number;
    cacheReadTokens: number;
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
    totalTokens: number;
    lastRead: string;
  };
}
