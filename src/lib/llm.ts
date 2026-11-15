/**
 * On-device language model (llama.cpp through llama.rn).
 * The model file is downloaded once into the app's documents folder; after that everything runs offline.
 */
import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import { initLlama, type LlamaContext } from 'llama.rn';
import { toTaiwan } from './zh';

export { partialReply } from './prompts';

export type ModelId = 'qwen3.5-2b' | 'qwen3.5-4b';

export type ModelSpec = {
  id: ModelId;
  label: string;
  note: string;
  file: string;
  url: string;
  approxMB: number;
};

export const MODELS: ModelSpec[] = [
  {
    id: 'qwen3.5-2b',
    label: '標準（Qwen3.5 2B）',
    note: '約 1.2 GB，大部分手機都能跑，回覆比較快',
    file: 'Qwen3.5-2B-Q4_K_M.gguf',
    url: 'https://huggingface.co/unsloth/Qwen3.5-2B-GGUF/resolve/main/Qwen3.5-2B-Q4_K_M.gguf',
    approxMB: 1221,
  },
  {
    id: 'qwen3.5-4b',
    label: '高品質（Qwen3.5 4B）',
    note: '約 2.6 GB，修正和檢討比較準，需要 8 GB 記憶體以上的較新手機，回覆比較慢',
    file: 'Qwen3.5-4B-Q4_K_M.gguf',
    url: 'https://huggingface.co/unsloth/Qwen3.5-4B-GGUF/resolve/main/Qwen3.5-4B-Q4_K_M.gguf',
    approxMB: 2614,
  },
];

export const DEFAULT_MODEL: ModelId = 'qwen3.5-2b';

export function getSpec(id: ModelId): ModelSpec {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}

export class LlmError extends Error {}

function modelDir(): Directory {
  const d = new Directory(Paths.document, 'models');
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
}

function modelFile(id: ModelId): File {
  return new File(modelDir(), getSpec(id).file);
}

function partFile(id: ModelId): File {
  return new File(modelDir(), `${getSpec(id).file}.part`);
}

/** A downloaded model is at least 90% of the expected size (exact sizes vary slightly by build). */
export function isDownloaded(id: ModelId): boolean {
  try {
    const f = modelFile(id);
    return f.exists && (f.size ?? 0) > getSpec(id).approxMB * 1024 * 1024 * 0.9;
  } catch {
    return false;
  }
}

export function downloadedSizeMB(id: ModelId): number {
  try {
    const f = modelFile(id);
    return f.exists ? Math.round((f.size ?? 0) / 1024 / 1024) : 0;
  } catch {
    return 0;
  }
}

export function freeSpaceMB(): number {
  try {
    return Math.round(Paths.availableDiskSpace / 1024 / 1024);
  } catch {
    return -1;
  }
}

export async function downloadModel(
  id: ModelId,
  onProgress: (fraction: number, mbDone: number, mbTotal: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  const spec = getSpec(id);
  const free = freeSpaceMB();
  if (free >= 0 && free < spec.approxMB + 300) {
    throw new LlmError(`手機空間不夠：需要約 ${spec.approxMB + 300} MB，目前剩 ${free} MB。`);
  }
  const part = partFile(id);
  if (part.exists) part.delete();
  try {
    await File.downloadFileAsync(spec.url, part, {
      idempotent: true,
      signal,
      onProgress: ({ bytesWritten, totalBytes }) => {
        const total = totalBytes > 0 ? totalBytes : spec.approxMB * 1024 * 1024;
        onProgress(Math.min(1, bytesWritten / total), Math.round(bytesWritten / 1048576), Math.round(total / 1048576));
      },
    });
  } catch (e) {
    try {
      if (part.exists) part.delete();
    } catch {
      // ignore cleanup errors
    }
    if ((e as Error).name === 'AbortError' || signal?.aborted) throw new LlmError('已取消下載。');
    throw new LlmError(`下載失敗，請確認網路後再試（${(e as Error).message}）。`);
  }
  const size = part.size ?? 0;
  if (size < spec.approxMB * 1024 * 1024 * 0.9) {
    part.delete();
    throw new LlmError('下載的檔案不完整，請再試一次。');
  }
  const dest = modelFile(id);
  if (dest.exists) dest.delete();
  await part.move(dest);
}

export async function deleteModel(id: ModelId): Promise<void> {
  if (loadedId === id) await unloadModel();
  for (const f of [modelFile(id), partFile(id)]) {
    try {
      if (f.exists) f.delete();
    } catch {
      // ignore
    }
  }
}

// ───────────────────────── context ─────────────────────────

let ctx: LlamaContext | null = null;
let loadedId: ModelId | null = null;
let loading: Promise<LlamaContext> | null = null;
let busy = false;

async function getContext(id: ModelId, onLoadProgress?: (p: number) => void): Promise<LlamaContext> {
  if (ctx && loadedId === id) return ctx;
  if (loading) return loading;
  if (!isDownloaded(id)) throw new LlmError('還沒下載離線模型，請先到「設定」下載。');
  loading = (async () => {
    if (ctx) await unloadModel();
    try {
      const c = await initLlama(
        {
          model: modelFile(id).uri,
          n_ctx: 4096,
          n_batch: 512,
          // Metal on iPhone; CPU on Android (the Android GPU path only supports some phones and formats)
          n_gpu_layers: Platform.OS === 'ios' ? 99 : 0,
          use_mlock: false,
        },
        (p) => onLoadProgress?.(p / 100),
      );
      ctx = c;
      loadedId = id;
      return c;
    } catch (e) {
      throw new LlmError(`模型載入失敗（${(e as Error).message}）。手機記憶體不夠時，可以改用輕量模型。`);
    } finally {
      loading = null;
    }
  })();
  return loading;
}

export async function unloadModel(): Promise<void> {
  const c = ctx;
  ctx = null;
  loadedId = null;
  if (c) {
    try {
      await c.release();
    } catch {
      // ignore
    }
  }
}

export function isModelLoaded(id: ModelId): boolean {
  return !!ctx && loadedId === id;
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export type GenerateOptions = {
  modelId: ModelId;
  system: string;
  messages: ChatMessage[];
  schema?: object;
  maxTokens?: number;
  temperature?: number;
  /** Called with the raw text generated so far (before Traditional-Chinese conversion). */
  onText?: (text: string) => void;
  onLoadProgress?: (p: number) => void;
};

export type GenerateResult = { text: string; tokensPerSecond: number; ms: number };

/** Runs one completion. Output Chinese is converted to Taiwan Traditional. */
export async function generate(opts: GenerateOptions): Promise<GenerateResult> {
  if (busy) throw new LlmError('模型還在處理上一個請求，請稍等。');
  busy = true;
  const t0 = Date.now();
  try {
    const c = await getContext(opts.modelId, opts.onLoadProgress);
    let acc = '';
    const res = await c.completion(
      {
        messages: [{ role: 'system', content: opts.system }, ...opts.messages],
        response_format: opts.schema ? { type: 'json_schema', json_schema: { strict: true, schema: opts.schema } } : undefined,
        // Qwen3.5 thinks out loud by default; turn it off both ways the template understands,
        // and split off any reasoning that still slips through so it never reaches the screen.
        enable_thinking: false,
        chat_template_kwargs: { enable_thinking: false },
        reasoning_format: 'auto',
        n_predict: opts.maxTokens ?? 400,
        temperature: opts.temperature ?? 0.6,
        top_p: 0.9,
        top_k: 40,
        penalty_repeat: 1.05,
      },
      (data) => {
        if (!opts.onText) return;
        acc += data.token ?? '';
        opts.onText(acc);
      },
    );
    const text = toTaiwan(res.content || res.text || acc);
    const tps = res.timings?.predicted_per_second ?? 0;
    if (!text.trim()) throw new LlmError('模型沒有產生內容，請再試一次。');
    return { text, tokensPerSecond: Math.round(tps * 10) / 10, ms: Date.now() - t0 };
  } catch (e) {
    if (e instanceof LlmError) throw e;
    throw new LlmError(`模型執行失敗（${(e as Error).message}）。`);
  } finally {
    busy = false;
  }
}

export async function stopGenerating(): Promise<void> {
  try {
    await ctx?.stopCompletion();
  } catch {
    // ignore
  }
}
