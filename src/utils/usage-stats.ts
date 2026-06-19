import type { DailyUsage } from '../types/usage.ts';
import { getModelDetails, type ProviderKey } from './models.ts';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const pad2 = (n: number) => String(n).padStart(2, '0');
const sum = (nums: number[]) => nums.reduce((a, b) => a + b, 0);

export interface MonthlyStats {
  mtd: {
    cost: number;
    tokens: number;
    activeDays: number;
    dayOfMonth: number;
    daysInMonth: number;
    monthLabel: string;
  };
  projection: {
    cost: number;
    tokens: number;
  };
  topModel: {
    modelName: string;
    cost: number;
    share: number;
  } | null;
  vsLastMonth: {
    deltaPct: number;
    direction: 'up' | 'down' | 'flat';
    lastSamePointCost: number;
    lastMonthLabel: string;
  } | null;
}

export function computeMonthlyStats(daily: DailyUsage[], now: Date): MonthlyStats {
  const days = daily ?? [];
  const year = now.getFullYear();
  const month = now.getMonth();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentKey = `${year}-${pad2(month + 1)}`;

  const inMonth = days.filter(
    (d) => d.period.slice(0, 7) === currentKey && Number(d.period.slice(8, 10)) <= dayOfMonth,
  );

  const cost = sum(inMonth.map((d) => d.totalCost));
  const tokens = sum(inMonth.map((d) => d.totalTokens));
  const activeDays = inMonth.filter((d) => d.totalCost > 0).length;

  const projection = {
    cost: dayOfMonth > 0 ? (cost / dayOfMonth) * daysInMonth : 0,
    tokens: dayOfMonth > 0 ? Math.round((tokens / dayOfMonth) * daysInMonth) : 0,
  };

  const modelCost = new Map<string, number>();
  for (const d of inMonth) {
    for (const m of d.modelBreakdowns ?? []) {
      modelCost.set(m.modelName, (modelCost.get(m.modelName) ?? 0) + m.cost);
    }
  }

  let topModel: MonthlyStats['topModel'] = null;
  if (cost > 0) {
    let bestName = '';
    let bestCost = 0;
    for (const [name, c] of modelCost) {
      if (c > bestCost) {
        bestCost = c;
        bestName = name;
      }
    }
    if (bestCost > 0) {
      topModel = { modelName: bestName, cost: bestCost, share: bestCost / cost };
    }
  }

  const lastMonthDate = new Date(year, month - 1, 1);
  const lastYear = lastMonthDate.getFullYear();
  const lastMonth = lastMonthDate.getMonth();
  const lastKey = `${lastYear}-${pad2(lastMonth + 1)}`;
  const daysInLastMonth = new Date(lastYear, lastMonth + 1, 0).getDate();
  const samePoint = Math.min(dayOfMonth, daysInLastMonth);

  const lastDays = days.filter(
    (d) => d.period.slice(0, 7) === lastKey && Number(d.period.slice(8, 10)) <= samePoint,
  );

  let vsLastMonth: MonthlyStats['vsLastMonth'] = null;
  if (lastDays.length > 0) {
    const lastSamePointCost = sum(lastDays.map((d) => d.totalCost));
    if (lastSamePointCost > 0) {
      const deltaPct = ((cost - lastSamePointCost) / lastSamePointCost) * 100;
      const direction = deltaPct > 0 ? 'up' : deltaPct < 0 ? 'down' : 'flat';
      vsLastMonth = {
        deltaPct,
        direction,
        lastSamePointCost,
        lastMonthLabel: MONTH_NAMES[lastMonth]!,
      };
    }
  }

  return {
    mtd: { cost, tokens, activeDays, dayOfMonth, daysInMonth, monthLabel: MONTH_NAMES[month]! },
    projection,
    topModel,
    vsLastMonth,
  };
}

const PROVIDER_ORDER: ProviderKey[] = [
  'anthropic',
  'openai',
  'gemini',
  'glm',
  'kimi',
  'antigravity',
];

export interface ToolsTracked {
  providers: ProviderKey[];
  agents: string[];
}

export function deriveToolsTracked(daily: DailyUsage[]): ToolsTracked {
  const providers = new Set<ProviderKey>();
  const agents = new Set<string>();

  for (const d of daily ?? []) {
    for (const m of d.modelBreakdowns ?? []) {
      const { provider } = getModelDetails(m.modelName);
      if (provider) providers.add(provider);
    }

    const names = d.metadata?.agents?.length ? d.metadata.agents : d.agent ? [d.agent] : [];
    for (const name of names) {
      if (name && name !== 'none') agents.add(name);
    }
  }

  return {
    providers: PROVIDER_ORDER.filter((p) => providers.has(p)),
    agents: [...agents].sort(),
  };
}

export function formatAgentName(agent: string): string {
  return agent
    .split(/[-_]/)
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === 'cli') return 'CLI';
      if (lower === 'gpt') return 'GPT';
      if (lower === 'glm') return 'GLM';
      if (lower === 'ai') return 'AI';
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}
