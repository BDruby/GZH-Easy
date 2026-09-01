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
    model: 'deepseek-chat',
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
  const raw = await chat({ apiKey: key, model, baseUrl, messages, temperature: 0.9, maxTokens: 4096, jsonMode: true });
  const parsed = extractJson(raw);
  if (!parsed) return sendJson(res, 502, { error: '模型输出无法解析为 JSON，请重试', raw: raw.slice(0, 300) });
  sendJson(res, 200, parsed);
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
  const raw = await chat({ apiKey: key, model, baseUrl, messages, temperature: 0.8, maxTokens: 2048, jsonMode: true });
  const parsed = extractJson(raw);
  if (!parsed) return sendJson(res, 502, { error: '模型输出无法解析为 JSON，请重试', raw: raw.slice(0, 300) });
  sendJson(res, 200, parsed);
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
  const raw = await chat({ apiKey: key, model, baseUrl, messages, temperature: 0.4, maxTokens: 8192, jsonMode: true });
  const parsed = extractJson(raw);
  if (!parsed) return sendJson(res, 502, { error: '模型输出无法解析为 JSON，请重试', raw: raw.slice(0, 300) });
  sendJson(res, 200, { html: parsed.html || '', styleUsed: parsed.styleUsed || style, tips: parsed.tips || '' });
}

// ---------------- 路由 ----------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'GET') {
      if (url.pathname === '/api/health') return sendJson(res, 200, { ok: true, port: config.port, model: config.model, baseUrl: config.baseUrl });
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
