export type ModelId = 'claude-haiku-5-5' | 'claude-sonnet-5-5';

export const MODELS: { id: ModelId; label: string; note: string }[] = [
  { id: 'claude-haiku-5-5', label: 'Haiku', note: '回應快、費用低（建議）' },
  { id: 'claude-sonnet-5-5', label: 'Sonnet', note: '回覆更自然，費用較高' },
];

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export class ClaudeError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function friendlyError(status: number, body: string): string {
  if (status === 401) return 'API 金鑰無效，請到「設定」重新貼上。';
  if (status === 403) return '這把金鑰沒有權限使用這個模型。';
  if (status === 404) return '找不到這個模型，請到「設定」換一個模型。';
  if (status === 429) return '請求太頻繁或額度不足，請稍後再試。';
  if (status === 529 || status === 503) return 'AI 伺服器忙碌中，請稍後再試。';
  if (status >= 500) return `AI 服務暫時有問題（${status}），請稍後再試。`;
  const m = body.match(/"message"\s*:\s*"([^"]+)"/);
  return m ? `請求失敗：${m[1]}` : `請求失敗（${status}）`;
}

export async function callClaude(opts: {
  apiKey: string;
  model: ModelId;
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  if (!opts.apiKey) throw new ClaudeError('還沒設定 API 金鑰，請先到「設定」貼上。');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 45_000);
  let res: Response;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': opts.apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: opts.maxTokens ?? 600,
        system: opts.system,
        messages: opts.messages,
      }),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if ((e as Error).name === 'AbortError') throw new ClaudeError('AI 回應逾時，請再試一次。');
    throw new ClaudeError('網路連線失敗，請檢查網路後再試。');
  }
  clearTimeout(timer);
  const body = await res.text();
  if (!res.ok) throw new ClaudeError(friendlyError(res.status, body), res.status);
  let data: { content?: { type: string; text?: string }[] };
  try {
    data = JSON.parse(body);
  } catch {
    throw new ClaudeError('AI 回傳的資料無法解析。');
  }
  const text = (data.content ?? [])
    .filter((c) => c.type === 'text' && c.text)
    .map((c) => c.text)
    .join('');
  if (!text) throw new ClaudeError('AI 沒有回傳內容，請再試一次。');
  return text;
}

export async function testKey(apiKey: string, model: ModelId): Promise<void> {
  await callClaude({
    apiKey,
    model,
    system: 'Reply with the single word OK.',
    messages: [{ role: 'user', content: 'ping' }],
    maxTokens: 5,
    timeoutMs: 20_000,
  });
}
