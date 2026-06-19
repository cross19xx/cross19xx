export type ProviderKey = 'antigravity' | 'anthropic' | 'gemini' | 'glm' | 'kimi' | 'openai';

interface ModelDetail {
  name: string;
  provider: ProviderKey;
}

export const PROVIDER_LABELS: Record<ProviderKey, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  gemini: 'Gemini',
  glm: 'GLM',
  kimi: 'Kimi',
  antigravity: 'Antigravity',
};

export const MODEL_DETAILS: Record<string, ModelDetail> = {
  'claude-opus-4-8': { name: 'Opus 4.8', provider: 'anthropic' },
  'claude-opus-4-7': { name: 'Opus 4.7', provider: 'anthropic' },
  'claude-opus-4-6': { name: 'Opus 4.6', provider: 'anthropic' },
  'claude-opus-4-5': { name: 'Opus 4.5', provider: 'anthropic' },
  'claude-sonnet-4-6': { name: 'Sonnet 4.6', provider: 'anthropic' },
  'claude-sonnet-4-5': { name: 'Sonnet 4.5', provider: 'anthropic' },
  'claude-haiku-4-5': { name: 'Haiku 4.5', provider: 'anthropic' },
  'claude-haiku-4-5-20251001': { name: 'Haiku 4.5', provider: 'anthropic' },
  'claude-3.5-haiku': { name: 'Haiku 3.5', provider: 'anthropic' },
  'gpt-5.5': { name: 'GPT-5.5', provider: 'openai' },
  'gpt-5.4': { name: 'GPT-5.4', provider: 'openai' },
  'gpt-5.3-codex': { name: 'GPT-5.3 Codex', provider: 'openai' },
  'gpt-5.3-codex-spark': { name: 'GPT-5.3 Codex Spark', provider: 'openai' },
  'gpt-5.2': { name: 'GPT-5.2', provider: 'openai' },
  'gpt-5.2-codex': { name: 'GPT-5.2 Codex', provider: 'openai' },
  'gpt-5.1-codex': { name: 'GPT-5.1 Codex', provider: 'openai' },
  'gpt-5.1-codex-max': { name: 'GPT-5.1 Codex Max', provider: 'openai' },
  'gpt-5-codex': { name: 'GPT-5 Codex', provider: 'openai' },
  'gemini-3-flash-preview': { name: 'Gemini 3 Flash', provider: 'gemini' },
  'gemini-3-pro-preview': { name: 'Gemini 3 Pro', provider: 'gemini' },
  'gemini-3.1-pro-preview-customtools': { name: 'Gemini 3.1 Pro', provider: 'gemini' },
  'antigravity-gemini-3.1-pro': { name: 'Antigravity Gemini 3.1 Pro', provider: 'antigravity' },
  'claude-fable-5': { name: 'Claude Fable 5', provider: 'anthropic' },
  'glm-4.7': { name: 'GLM 4.7', provider: 'glm' },
  'glm-4.7-free': { name: 'GLM 4.7', provider: 'glm' },
  'kimi-k2.5-free': { name: 'Kimi K2.5', provider: 'kimi' },
};

export function formatFallbackModelName(modelName: string): string {
  return modelName
    .replace(/(\d)-(\d)/g, '$1.$2')
    .replace(/-\d{8}$/, '')
    .split('-')
    .map((part) => {
      if (part === 'gpt' || part === 'glm') return part.toUpperCase();
      if (part === 'claude') return 'Claude';
      if (part === 'gemini') return 'Gemini';
      if (part === 'kimi') return 'Kimi';
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

export function getModelDetails(name: string): { name: string; provider: ProviderKey | null } {
  return MODEL_DETAILS[name] ?? { name: formatFallbackModelName(name), provider: null };
}
