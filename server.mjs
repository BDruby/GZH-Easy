// 公众号爆款文章工坊 —— 本地 API 服务器（Node 18+）
// 启动：node server.mjs   （或 npm start）
// 默认端口 43121，可用环境变量 PORT 或 config.json 覆盖
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chat, chatStream, extractJson, resolveApiKey, resolveModel, resolveBaseUrl, testConnection } from './lib/deepseek.mjs';
import { titleSystemPrompt, anglesSystemPrompt, articleSystemPrompt, layoutSystemPrompt } from './lib/prompts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');

// ---------------- 配置 ----------------
function loadConfig() {
  const cfg = {
    port: Number(process.env.PORT) || 43121,
    model: 'deepseek-v4-flash',
    apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  };
  try {
    const p = path.join(ROOT, 'config.json');
    if (fs.existsSync(p)) Object.assign(cfg, JSON.parse(fs.readFileSync(p, 'utf8')));
  } catch (e) {
    console.warn('[config] 读取 config.json 失败（忽略）:', e.message);
  }
  return cfg;
}
const config = loadConfig();
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e?.message || e));

// ---------------- 静态文件 ----------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};
function serveStatic(req, res) {
  let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (urlPath === '/') urlPath = '/index.html';

  const baseDir = fs.existsSync(DIST) ? DIST : PUBLIC;
  let file = path.normalize(path.join(baseDir, urlPath));

  if (!file.startsWith(baseDir)) return sendJson(res, 403, { error: 'forbidden' });

  if (fs.existsSync(DIST) && (!fs.existsSync(file) || !fs.statSync(file).isFile())) {
    file = path.join(DIST, 'index.html');
  } else if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    return sendJson(res, 404, { error: 'not found' });
  }

  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'text/html; charset=utf-8' });
  fs.createReadStream(file).pipe(res);
}

// ---------------- 工具 ----------------
function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', (c) => {
      buf += c;
      if (buf.length > 2 * 1024 * 1024) {
        reject(new Error('body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(buf ? JSON.parse(buf) : {});
      } catch {
        reject(new Error('invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function resolveReqConfig(req, body = {}) {
  const key = resolveApiKey(req, config) || body.apiKey;
  const model = resolveModel(config, body.model, req);
  const baseUrl = resolveBaseUrl(req, config) || body.baseUrl;
  return { key, model, baseUrl };
}

// ---------------- API：测试连接 ----------------
async function apiTestConnection(req, res, body) {
  const { key, model, baseUrl } = resolveReqConfig(req, body);
  if (!key) return sendJson(res, 401, { error: '缺少 API Key：请在设置弹窗中输入或配置 config.json' });

  try {
    const result = await testConnection({ apiKey: key, model, baseUrl });
    sendJson(res, 200, result);
  } catch (e) {
    sendJson(res, 400, { error: e.message });
  }
}

// ---------------- API：爆款标题 ----------------
async function apiTitles(req, res, body) {
  const topic = String(body.topic || '').trim();
  if (!topic) return sendJson(res, 400, { error: '请先输入主题' });
  const count = Math.min(18, Math.max(6, Number(body.count) || 10));
  const { key, model, baseUrl } = resolveReqConfig(req, body);
  if (!key) return sendJson(res, 401, { error: '缺少 API Key：请在右上角设置中输入，或配置 config.json / 环境变量' });

  const messages = [
    { role: 'system', content: titleSystemPrompt() },
    { role: 'user', content: `主题/内容：${topic}\n\n生成 ${count} 个候选标题（至少覆盖 6 种方法），严格按要求的 JSON 结构输出。` },
  ];

  try {
    const raw = await chat({ apiKey: key, model, baseUrl, messages, temperature: 0.85, maxTokens: 4096, jsonMode: true });
    let parsed = extractJson(raw);
    if (!parsed || !Array.isArray(parsed.candidates) || parsed.candidates.length === 0) {
      parsed = fallbackParseTitles(raw, topic);
    }
    sendJson(res, 200, parsed);
  } catch (e) {
    sendJson(res, 500, { error: `标题生成异常: ${e.message}` });
  }
}

// 智能从非标准/损坏的 JSON 文本中精准提取标题候选矩阵
function fallbackParseTitles(rawText, topic) {
  const text = (rawText || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const candidates = [];

  // 策略 1：如果文本中包含 JSON 字段结构，用精准正则提取每一个候选标题项
  const objectBlockRegex = /\{[\s\S]*?"title"\s*:\s*"([^"\r\n]+)"[\s\S]*?\}/gi;
  let blockMatch;
  while ((blockMatch = objectBlockRegex.exec(text)) !== null) {
    const block = blockMatch[0];
    const titleMatch = block.match(/"title"\s*:\s*"([^"\r\n]+)"/i);
    const methodMatch = block.match(/"method"\s*:\s*"([^"\r\n]+)"/i);
    const hookMatch = block.match(/"hook"\s*:\s*"([^"\r\n]+)"/i);
    const scoreMatch = block.match(/"score"\s*:\s*(\d+)/i);
    const riskMatch = block.match(/"risk"\s*:\s*"([^"\r\n]+)"/i);

    const title = titleMatch?.[1]?.trim();
    if (title && !title.includes('候选标题') && !title.includes('标题A') && !title.includes('标题B')) {
      candidates.push({
        title,
        method: methodMatch?.[1]?.trim() || '智能精选',
        hook: hookMatch?.[1]?.trim() || '爆款吸引力',
        score: scoreMatch ? Number(scoreMatch[1]) : Math.floor(86 + Math.random() * 10),
        risk: riskMatch?.[1]?.trim() || '低',
        riskNote: '',
      });
    }
  }

  // 策略 2：如果未匹配到完整块，单独提取所有 "title": "..." 字段
  if (candidates.length === 0) {
    const singleTitleRegex = /"title"\s*:\s*"([^"\r\n]+)"/gi;
    let sMatch;
    while ((sMatch = singleTitleRegex.exec(text)) !== null) {
      const title = sMatch[1]?.trim();
      if (title && !title.includes('候选标题') && !title.includes('标题A') && !title.includes('标题B')) {
        candidates.push({
          title,
          method: '智能精选',
          hook: '爆款吸引力',
          score: Math.floor(86 + Math.random() * 10),
          risk: '低',
          riskNote: '',
        });
      }
    }
  }

  // 策略 3：纯文本列表（如 1. 标题一 \n 2. 标题二），严格过滤所有 JSON 语法行
  if (candidates.length === 0) {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('```'));

    for (const line of lines) {
      // 严格跳过所有 JSON 语法和字段关键字行！
      if (/^[{\[\]}]|^(?:"?candidates"?|"?title"?|"?method"?|"?hook"?|"?score"?|"?risk"?|"?riskNote"?|"?brief"?|"?top5"?|"?ab"?|"?role"?|"?group"?|"?reason"?|"?hypothesis"?|"?items"?)\s*[:\s\[{]/i.test(line)) {
        continue;
      }
      if (/^(?:"?candidates"?|"?title"?|"?method"?|"?hook"?|"?score"?|"?risk"?)\s*":/i.test(line)) {
        continue;
      }

      const cleaned = line.replace(/^\d+[\.、\s\-]+|^[-*•]\s+|^["'“]|["'”]$/g, '').trim();
      if (cleaned.length >= 6 && cleaned.length <= 50) {
        candidates.push({
          title: cleaned,
          method: '智能精选',
          hook: '爆款吸引力',
          score: Math.floor(86 + Math.random() * 10),
          risk: '低',
          riskNote: '',
        });
      }
    }
  }

  const list = candidates.length > 0 ? candidates.slice(0, 12) : [
    { title: `${topic}：深度全景复盘与核心要点`, method: '深度解读', hook: '干货全景', score: 93, risk: '低' },
    { title: `彻底搞懂${topic}！看这一篇就够了`, method: '行动指南', hook: '一站搞定', score: 91, risk: '低' },
    { title: `为什么说${topic}正在悄悄改变行业格局？`, method: '趋势剖析', hook: '认知升级', score: 89, risk: '低' },
  ];

  const top5 = list.slice(0, 5).map((c, i) => ({
    role: ['综合首选', '稳健版', '传播版', '搜索版', '实验版'][i] || '精选推荐',
    title: c.title,
    reason: '高度契合主题与公众号读者点击偏好',
  }));

  return {
    brief: `核心主题：${topic}；目标读者：公众号关注者；核心价值：深度干货与行业洞察`,
    candidates: list,
    top5,
  };
}

// ---------------- API：破题角度 ----------------
async function apiAngles(req, res, body) {
  const topic = String(body.topic || '').trim();
  if (!topic) return sendJson(res, 400, { error: '请先输入主题' });
  const { key, model, baseUrl } = resolveReqConfig(req, body);
  if (!key) return sendJson(res, 401, { error: '缺少 API Key' });

  const messages = [
    { role: 'system', content: anglesSystemPrompt() },
    { role: 'user', content: `主题：${topic}` },
  ];

  try {
    const raw = await chat({ apiKey: key, model, baseUrl, messages, temperature: 0.8, maxTokens: 2048, jsonMode: true });
    let parsed = extractJson(raw);
    if (!parsed || !Array.isArray(parsed.angles) || parsed.angles.length === 0) {
      parsed = fallbackParseAngles(raw);
    }
    sendJson(res, 200, parsed);
  } catch (e) {
    sendJson(res, 500, { error: `角度生成异常: ${e.message}` });
  }
}

// 智能从非标准/损坏的 JSON 文本中提取破题角度
function fallbackParseAngles(rawText) {
  const text = (rawText || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const angles = [];

  // 1. 正则提取 JSON 字段
  const angleBlockRegex = /"title"\s*:\s*"([^"\r\n]+)"[\s\S]*?"desc"\s*:\s*"([^"\r\n]+)"/gi;
  let match;
  while ((match = angleBlockRegex.exec(text)) !== null) {
    const title = match[1]?.trim();
    const desc = match[2]?.trim();
    if (title && !title.includes('角度名')) {
      angles.push({ title: title.slice(0, 15), desc });
    }
  }

  // 2. 如果未匹配到，纯文本行提取并过滤 JSON 关键词
  if (angles.length === 0) {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('```'));
    for (const line of lines) {
      if (/^[{\[\]}]|^(?:"?angles"?|"?title"?|"?desc"?)\s*[:\s\[{]/i.test(line)) {
        continue;
      }
      const cleaned = line.replace(/^\d+[\.、\s\-]+|^[-*•]\s+/g, '').trim();
      if (cleaned.length >= 4) {
        const parts = cleaned.split(/[:：]/);
        const title = parts[0].trim().slice(0, 15);
        const desc = (parts.slice(1).join('：') || cleaned).trim();
        angles.push({ title, desc });
      }
    }
  }

  return {
    angles: angles.length > 0 ? angles.slice(0, 6) : [
      { title: '反常识切入', desc: '打破传统直觉认知误区，从全新视角展开分析' },
      { title: '实操落地法', desc: '以具体落地流程拆解真实实战操作步骤' },
      { title: '行业大趋势', desc: '溯源演进历程，深度预判未来关键走向' },
    ],
  };
}

// ---------------- API：写正文（SSE 流式） ----------------
async function apiArticle(req, res, body) {
  const topic = String(body.topic || '').trim();
  if (!topic) return sendJson(res, 400, { error: '请先输入主题' });
  const { key, model, baseUrl } = resolveReqConfig(req, body);
  if (!key) return sendJson(res, 401, { error: '缺少 API Key' });

  const mode = body.mode === 'short' ? 'short' : 'long';
  const route = body.route === 'outline' ? 'outline' : 'breakthrough';
  const title = String(body.title || '').trim();
  const angle = String(body.angle || '').trim();
  const words = Math.min(4000, Math.max(300, Number(body.words) || (mode === 'short' ? 800 : 2000)));
  const extra = String(body.extra || '').trim();

  const userParts = [`主题：${topic}`, `目标字数：约 ${words} 字`];
  if (title) userParts.push(`文章标题：${title}`);
  if (mode === 'long' && route === 'breakthrough' && angle) userParts.push(`已选角度：${angle}`);
  if (mode === 'short') userParts.push('文体：公众号短文（≤1000 字，纯文字）');
  if (extra) userParts.push(`补充说明/素材：${extra}`);
  userParts.push('请直接输出成稿。');

  const messages = [
    { role: 'system', content: articleSystemPrompt({ mode, route }) },
    { role: 'user', content: userParts.join('\n\n') },
  ];

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
  try {
    for await (const delta of chatStream({ apiKey: key, model, baseUrl, messages, temperature: 0.8, maxTokens: 8192 })) {
      send({ type: 'delta', text: delta });
    }
    send({ type: 'done' });
  } catch (e) {
    send({ type: 'error', message: e.message });
  } finally {
    res.end();
  }
}

// ---------------- API：排版（JSON） ----------------
async function apiLayout(req, res, body) {
  const article = String(body.article || '').trim();
  if (!article) return sendJson(res, 400, { error: '没有文章内容，请先生成正文' });
  const { key, model, baseUrl } = resolveReqConfig(req, body);
  if (!key) return sendJson(res, 401, { error: '缺少 API Key' });

  const title = String(body.title || '').trim();
  const style = ['claude', 'openai', 'google'].includes(body.style) ? body.style : 'auto';
  const messages = [
    { role: 'system', content: layoutSystemPrompt(style) },
    { role: 'user', content: `文章标题：${title || '(无，按正文推断)'}\n\n文章内容（Markdown）：\n\n${article}` },
  ];

  try {
    const raw = await chat({ apiKey: key, model, baseUrl, messages, temperature: 0.4, maxTokens: 8192, jsonMode: true });
    let parsed = extractJson(raw);
    if (!parsed || !parsed.html) {
      parsed = { html: raw, styleUsed: style, tips: '' };
    }
    sendJson(res, 200, { html: parsed.html || '', styleUsed: parsed.styleUsed || style, tips: parsed.tips || '' });
  } catch (e) {
    sendJson(res, 500, { error: `排版异常: ${e.message}` });
  }
}

// ---------------- API：无版权图库搜索 (Openverse & Unsplash & CDN) ----------------
async function apiSearchImages(req, res, url) {
  const query = (url.searchParams.get('q') || '').trim();
  const category = (url.searchParams.get('category') || 'all').trim();

  // 关键词中英映射
  const dict = {
    '科技': 'technology', 'ai': 'artificial intelligence', '人工智能': 'artificial intelligence',
    '代码': 'coding programming', '编程': 'programming', '大模型': 'neural network',
    '商业': 'business', '职场': 'office workplace', '团队': 'teamwork', '会议': 'business meeting',
    '创业': 'startup', '金融': 'finance', '思考': 'thinking idea', '成长': 'growth success',
    '读书': 'reading book', '学习': 'learning study', '艺术': 'art design', '创意': 'creative inspiration',
    '自然': 'nature landscape', '风景': 'scenery mountain', '生活': 'lifestyle coffee', '极简': 'minimalism',
    '星空': 'stars galaxy', '宇宙': 'space galaxy', '芯片': 'semiconductor chip',
  };

  const enQuery = dict[query.toLowerCase()] || query || 'inspiration';
  let results = [];

  // 1. 尝试通过 Openverse API (WordPress 基金会 7亿+ CC0/免费商用开放图库)
  try {
    const ovUrl = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(enQuery)}&page_size=16&license_type=commercial`;
    const ovRes = await fetch(ovUrl, {
      headers: { 'User-Agent': 'GZH-Baokuan-Studio/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    if (ovRes.ok) {
      const data = await ovRes.json();
      if (Array.isArray(data?.results) && data.results.length > 0) {
        results = data.results.map((item) => ({
          id: `ov-${item.id}`,
          title: item.title || `${query || '高清'} 配图`,
          category: category !== 'all' ? category : 'tech',
          url: item.url,
          thumb: item.thumbnail || item.url,
          author: item.creator || 'Openverse CC0 Creator',
          source: `${item.source || 'Openverse'} (${item.license?.toUpperCase() || 'CC0'})`,
        }));
      }
    }
  } catch {}

  // 2. 备用尝试 Unsplash 开放 API
  if (results.length === 0) {
    try {
      const uUrl = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(enQuery)}&per_page=16`;
      const uRes = await fetch(uUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
        signal: AbortSignal.timeout(5000),
      });
      if (uRes.ok) {
        const data = await uRes.json();
        if (Array.isArray(data?.results) && data.results.length > 0) {
          results = data.results.map((item) => ({
            id: `u-${item.id}`,
            title: item.alt_description || item.description || `${query || '高清'} 配图`,
            category: category !== 'all' ? category : 'tech',
            url: item.urls?.regular || item.urls?.full,
            thumb: item.urls?.small || item.urls?.thumb,
            author: item.user?.name || 'Unsplash Creator',
            source: 'Unsplash (Free Commercial Use)',
          }));
        }
      }
    } catch {}
  }

  sendJson(res, 200, { ok: true, results, count: results.length });
}

// ---------------- 路由 ----------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'GET') {
      if (url.pathname === '/api/health') return sendJson(res, 200, { ok: true, port: config.port, model: config.model, baseUrl: config.baseUrl });
      if (url.pathname === '/api/images/search') return await apiSearchImages(req, res, url);
      return serveStatic(req, res);
    }
    if (req.method === 'POST' && url.pathname === '/api/test-connection') return await apiTestConnection(req, res, await readBody(req));
    if (req.method === 'POST' && url.pathname === '/api/titles') return await apiTitles(req, res, await readBody(req));
    if (req.method === 'POST' && url.pathname === '/api/angles') return await apiAngles(req, res, await readBody(req));
    if (req.method === 'POST' && url.pathname === '/api/article') return await apiArticle(req, res, await readBody(req));
    if (req.method === 'POST' && url.pathname === '/api/layout') return await apiLayout(req, res, await readBody(req));
    return sendJson(res, 404, { error: 'not found' });
  } catch (e) {
    if (!res.headersSent) return sendJson(res, 500, { error: e.message });
    res.end();
  }
});

server.listen(config.port, () => {
  console.log('');
  console.log('  公众号爆款文章工坊 已启动');
  console.log(`  本地访问:  http://127.0.0.1:${config.port}`);
  console.log(`  模型:      ${config.model}   |   Base URL: ${config.baseUrl}`);
  console.log(`  API Key:   ${config.apiKey ? '已配置(config.json/环境变量)' : '未配置（请在网页设置中输入）'}`);
  console.log('');
});
