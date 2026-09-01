// 通用 OpenAI 兼容接口封装（支持 DeepSeek、OpenAI、硅基流动、通义千问、Ollama 等，零依赖，Node 18+）
// 支持：普通 JSON/Text 对话 + SSE 流式对话 + API 连通性测试

const DEFAULT_BASE = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-v4-flash';

// 从请求中解析 API Key：HTTP Header x-api-key > config.apiKey > 环境变量 OPENAI_API_KEY / DEEPSEEK_API_KEY
export function resolveApiKey(req, config) {
  if (req && req.headers) {
    const header = req.headers['x-api-key'];
    if (header && typeof header === 'string' && header.trim()) return header.trim();
  }
  if (config && config.apiKey && config.apiKey.trim()) return config.apiKey.trim();
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) return process.env.OPENAI_API_KEY.trim();
  if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.trim()) return process.env.DEEPSEEK_API_KEY.trim();
  return null;
}

// 从请求中解析 Model：HTTP Header x-model > bodyModel > config.model > 默认模型
export function resolveModel(config = {}, bodyModel, req) {
  if (req && req.headers) {
    const header = req.headers['x-model'];
    if (header && typeof header === 'string' && header.trim()) return header.trim();
  }
  if (bodyModel && typeof bodyModel === 'string' && bodyModel.trim()) return bodyModel.trim();
  if (config.model && config.model.trim()) return config.model.trim();
  return DEFAULT_MODEL;
}

// 从请求中解析 Base URL：HTTP Header x-base-url > config.baseUrl > 环境变量 OPENAI_BASE_URL / DEEPSEEK_BASE_URL > 默认地址
export function resolveBaseUrl(req, config = {}) {
  if (req && req.headers) {
    const header = req.headers['x-base-url'];
    if (header && typeof header === 'string' && header.trim()) return header.trim();
  }
  if (config.baseUrl && config.baseUrl.trim()) return config.baseUrl.trim();
  if (process.env.OPENAI_BASE_URL && process.env.OPENAI_BASE_URL.trim()) return process.env.OPENAI_BASE_URL.trim();
  if (process.env.DEEPSEEK_BASE_URL && process.env.DEEPSEEK_BASE_URL.trim()) return process.env.DEEPSEEK_BASE_URL.trim();
  return DEFAULT_BASE;
}

// 智能拼接 endpoint：处理 /chat/completions、/v1 等边界情况
export function buildEndpoint(baseUrl = DEFAULT_BASE) {
  let url = (baseUrl || DEFAULT_BASE).trim().replace(/\/+$/, '');
  if (url.endsWith('/chat/completions')) return url;
  if (url.endsWith('/chat')) return `${url}/completions`;
  if (url === 'https://api.openai.com') return 'https://api.openai.com/v1/chat/completions';
  return `${url}/chat/completions`;
}

// 连通性测试
export async function testConnection({ apiKey, model = DEFAULT_MODEL, baseUrl = DEFAULT_BASE, timeoutMs = 15000 }) {
  const endpoint = buildEndpoint(baseUrl);
  const start = Date.now();
  
  let res;
  try {
    res = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      }),
      timeoutMs,
    });
  } catch (e) {
    throw new Error(`无法连接至 API 服务端 (${endpoint}): ${e.message}`);
  }

  const latencyMs = Date.now() - start;
  const rawText = await res.text().catch(() => '');

  if (!res.ok) {
    let errDetail = rawText;
    try {
      const errObj = JSON.parse(rawText);
      errDetail = errObj.error?.message || errObj.message || rawText;
    } catch {}
    throw new Error(`API 返回 HTTP ${res.status}: ${errDetail.slice(0, 300) || res.statusText}`);
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`API 返回 HTTP 200，但非有效 JSON: ${rawText.slice(0, 200)}`);
  }

  const reply = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? '连接成功';
  return { ok: true, latencyMs, model, reply };
}

// 非流式对话，返回 content 字符串
export async function chat({ apiKey, model = DEFAULT_MODEL, messages, temperature = 0.7, maxTokens = 8192, baseUrl = DEFAULT_BASE, timeoutMs = 180000, jsonMode = false }) {
  const endpoint = buildEndpoint(baseUrl);

  const makeBody = (withJsonFormat) => {
    const b = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };
    if (withJsonFormat && model !== 'deepseek-reasoner') {
      b.response_format = { type: 'json_object' };
    }
    return b;
  };

  let res = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(makeBody(jsonMode)),
    timeoutMs,
  });

  // 如果遇到 400（可能某些厂商/模型不支持 response_format），且开启了 jsonMode，尝试降级不传 response_format
  if (!res.ok && jsonMode && res.status === 400) {
    res = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(makeBody(false)),
      timeoutMs,
    });
  }

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    let errDetail = text;
    try {
      const errObj = JSON.parse(text);
      errDetail = errObj.error?.message || errObj.message || text;
    } catch {}
    throw new Error(`API 响应错误 ${res.status}: ${errDetail.slice(0, 500) || res.statusText}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`API 响应内容无法解析为 JSON: ${text.slice(0, 200)}`);
  }

  return data?.choices?.[0]?.message?.content ?? '';
}

// 流式对话：返回一个 async 迭代器，逐段产出 content delta 字符串
export async function* chatStream({ apiKey, model = DEFAULT_MODEL, messages, temperature = 0.7, maxTokens = 8192, baseUrl = DEFAULT_BASE, timeoutMs = 300000 }) {
  const endpoint = buildEndpoint(baseUrl);
  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  };

  const res = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    timeoutMs,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let errDetail = text;
    try {
      const errObj = JSON.parse(text);
      errDetail = errObj.error?.message || errObj.message || text;
    } catch {}
    throw new Error(`API 响应错误 ${res.status}: ${errDetail.slice(0, 500) || res.statusText}`);
  }

  // 逐行解析 SSE：data: {...}  / data: [DONE]
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      if (payload === '[DONE]') return;
      let parsed;
      try {
        parsed = JSON.parse(payload);
      } catch {
        continue;
      }
      const delta = parsed?.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta.length > 0) yield delta;
    }
  }
}

// 尝试清洗并解析 JSON 字符串
function tryParseCleanJson(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const str = raw.trim();
  if (!str) return null;

  // 1. 直接解析
  try {
    return JSON.parse(str);
  } catch {}

  // 2. 清洗常见非标准 JSON 字符：末尾逗号、单行/多行注释、智能中文引号
  try {
    let cleaned = str
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除 /* ... */
      .replace(/\/\/.*$/gm, '') // 移除 // ...
      .replace(/,\s*([}\]])/g, '$1') // 移除多余末尾逗号 ,} -> }
      .replace(/[\u201C\u201D]/g, '"') // 中文双引号替换
      .replace(/[\u2018\u2019]/g, "'"); // 中文单引号替换
    return JSON.parse(cleaned);
  } catch {}

  return null;
}

// 把模型输出里的 JSON（可能带 <think> 思考链、```json 代码围栏或前后闲聊文字）深度解析出来
export function extractJson(text) {
  if (!text || typeof text !== 'string') return null;

  // 1. 过滤思考模型常见的 <think>...</think> 标签
  let t = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // 移除可能未闭合的 <think> 开头
  t = t.replace(/<think>[\s\S]*/gi, '').trim();

  if (!t) return null;

  // 2. 尝试直接解析
  const direct = tryParseCleanJson(t);
  if (direct) return direct;

  // 3. 提取 ```json ... ``` 或 ``` ... ``` 围栏中的内容
  const fenceMatches = [...t.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  for (const match of fenceMatches) {
    const candidate = match[1]?.trim();
    if (candidate) {
      const parsed = tryParseCleanJson(candidate);
      if (parsed) return parsed;
    }
  }

  // 4. 寻找外层配对的 { ... } (对象)
  const firstBrace = t.indexOf('{');
  const lastBrace = t.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = t.slice(firstBrace, lastBrace + 1);
    const parsed = tryParseCleanJson(candidate);
    if (parsed) return parsed;
  }

  // 5. 寻找外层配对的 [ ... ] (数组)
  const firstBracket = t.indexOf('[');
  const lastBracket = t.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    const candidate = t.slice(firstBracket, lastBracket + 1);
    const parsed = tryParseCleanJson(candidate);
    if (parsed) return parsed;
  }

  // 6. 深度括号计数匹配
  if (firstBrace >= 0) {
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = firstBrace; i < t.length; i++) {
      const c = t[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          const candidate = t.slice(firstBrace, i + 1);
          const parsed = tryParseCleanJson(candidate);
          if (parsed) return parsed;
        }
      }
    }
  }

  return null;
}

async function fetchWithTimeout(url, opts) {
  const { timeoutMs, ...rest } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
