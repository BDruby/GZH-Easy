/* 公众号爆款文章工坊 - 前端逻辑（零依赖） */
'use strict';

const $ = (id) => document.getElementById(id);

// ---------- 状态 ----------
const state = {
  topic: '',
  titles: null,
  selTitle: '',
  selAngle: '',
  angles: null,
  articleMd: '',
  layoutHtml: '',
  abort: null, // 流式写作的 AbortController
  oneShotRunning: false,
};

// ---------- 通用 ----------
function toast(msg, ms = 2600) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), ms);
}

async function api(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(state.apiKey ? { 'x-api-key': state.apiKey } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `请求失败 (${res.status})`);
  return data;
}

function getMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}
function getRoute() {
  const btn = document.querySelector('#routeSeg .seg-btn.active');
  return btn ? btn.dataset.route : 'breakthrough';
}
function getWords() {
  return Number($('words').value) || 2000;
}

// ---------- API Key / 模型 ----------
$('apiKey').value = localStorage.getItem('bs_apiKey') || '';
$('model').value = localStorage.getItem('bs_model') || 'deepseek-chat';
state.apiKey = $('apiKey').value;
$('saveKey').addEventListener('click', () => {
  state.apiKey = $('apiKey').value.trim();
  localStorage.setItem('bs_apiKey', state.apiKey);
  localStorage.setItem('bs_model', $('model').value);
  toast(state.apiKey ? 'API Key 已保存（仅存本浏览器）' : '已清空 API Key');
});
$('model').addEventListener('change', () => localStorage.setItem('bs_model', $('model').value));

function model() { return $('model').value; }
function topicText() {
  const t = $('topic').value.trim();
  if (!t) { toast('请先输入一句主题'); return null; }
  state.topic = t;
  return t;
}

// ---------- 简易 Markdown 渲染（行级解析，零依赖） ----------
function renderMarkdown(md) {
  if (!md) return '';
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) => s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t) { i++; continue; }
    // 代码块（忽略语言标记）
    if (/^```/.test(t)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) { buf.push(lines[i]); i++; }
      i++;
      out.push(`<pre><code>${esc(buf.join('\n').trim())}</code></pre>`);
      continue;
    }
    // 标题
    const h = t.match(/^(#{1,3})\s+(.*)$/);
    if (h) { out.push(`<h${h[1].length}>${inline(esc(h[2]))}</h${h[1].length}>`); i++; continue; }
    // 分隔线
    if (/^-{3,}$/.test(t)) { out.push('<hr>'); i++; continue; }
    // 引用块（连续行合并）
    if (/^&gt;\s?/.test(esc(t))) {
      const buf = [];
      while (i < lines.length && /^&gt;\s?/.test(esc(lines[i].trim()))) {
        buf.push(esc(lines[i].trim()).replace(/^&gt;\s?/, ''));
        i++;
      }
      out.push(`<blockquote>${buf.map(inline).join('<br>')}</blockquote>`);
      continue;
    }
    // 列表（连续行合并）
    const listMatch = t.match(/^(?:[-*]\s+|\d+[.、]\s*)(.*)$/);
    if (listMatch) {
      const ordered = /^\d+[.、]\s*/.test(t);
      const items = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(/^(?:[-*]\s+|\d+[.、]\s*)(.*)$/);
        if (!m) break;
        items.push(`<li>${inline(esc(m[1]))}</li>`);
        i++;
      }
      out.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
      continue;
    }
    // 普通段落
    out.push(`<p>${inline(esc(t))}</p>`);
    i++;
  }
  return out.join('\n');
}

// ---------- 复制 ----------
async function copyText(text, tip) {
  try {
    await navigator.clipboard.writeText(text);
    toast(tip || '已复制');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast((tip || '已复制') + '（兼容模式）');
  }
}

// ================= 步骤 1：标题 =================
$('genTitles').addEventListener('click', genTitles);
$('retryTitles').addEventListener('click', genTitles);

async function genTitles() {
  const topic = topicText();
  if (!topic) return;
  $('titleLoading').classList.remove('hidden');
  $('titleResult').classList.add('hidden');
  $('retryTitles').classList.add('hidden');
  $('genTitles').disabled = true;
  try {
    const data = await api('/api/titles', { topic, model: model() });
    state.titles = data;
    renderTitles(data);
    $('titleResult').classList.remove('hidden');
    $('retryTitles').classList.remove('hidden');
    if (state.oneShotRunning && data.top5 && data.top5[0]) {
      state.selTitle = data.top5[0].title;
      $('selTitle').textContent = '已自动选用综合首选：' + state.selTitle;
      highlightTable();
      await stepArticle();
    }
  } catch (e) {
    toast('标题生成失败：' + e.message);
  } finally {
    $('genTitles').disabled = false;
    $('titleLoading').classList.add('hidden');
  }
}

function renderTitles(d) {
  $('titleBrief').textContent = '内容简报：' + (d.brief || '');
  const tb = $('candTable').querySelector('tbody');
  tb.innerHTML = '';
  (d.candidates || []).forEach((c, i) => {
    const tr = document.createElement('tr');
    const riskCls = c.risk === '高' ? 'risk-high' : c.risk === '中' ? 'risk-mid' : 'risk-low';
    tr.innerHTML = `<td>${i + 1}</td>
      <td class="t-title">${esc(c.title)}</td>
      <td>${esc(c.method || '')}</td>
      <td>${esc(c.hook || '')}</td>
      <td class="score">${c.score ?? '-'}</td>
      <td><span class="${riskCls}">${esc(c.risk || '')}</span>${c.riskNote ? `<br><small>${esc(c.riskNote)}</small>` : ''}</td>`;
    tr.addEventListener('click', () => pickTitle(c.title, tr));
    tb.appendChild(tr);
  });
  // Top5
  const t5 = $('top5');
  t5.innerHTML = '';
  (d.top5 || []).forEach((r) => {
    const div = document.createElement('div');
    div.className = 't5';
    div.innerHTML = `<div class="role">${esc(r.role)}</div><div class="tt">${esc(r.title)}</div><div class="why">${esc(r.reason || '')}</div>`;
    div.addEventListener('click', () => { state.selTitle = r.title; $('selTitle').textContent = '已选用：' + r.title; markSelected(); });
    t5.appendChild(div);
  });
  // A/B
  const ab = $('ab');
  ab.innerHTML = '';
  (d.ab || []).forEach((g) => {
    const div = document.createElement('div');
    div.className = 'ab-item';
    div.innerHTML = `<b>${esc(g.group)}</b>（假设：${esc(g.hypothesis || '')}）<br>A. ${esc(g.items?.[0] || '')}　|　B. ${esc(g.items?.[1] || '')}`;
    ab.appendChild(div);
  });
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function pickTitle(title, tr) {
  state.selTitle = title;
  $('selTitle').textContent = '已选用：' + title;
  markSelected();
}
function markSelected() {
  document.querySelectorAll('#candTable tr').forEach((tr) => tr.classList.remove('sel'));
  document.querySelectorAll('#candTable .t-title').forEach((td) => {
    if (td.textContent === state.selTitle) td.parentElement.classList.add('sel');
  });
  document.querySelectorAll('.t5').forEach((div) => div.classList.toggle('sel', div.querySelector('.tt')?.textContent === state.selTitle));
}
function highlightTable() { markSelected(); }

// ================= 步骤 2：角度 =================
$('routeSeg').addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  document.querySelectorAll('#routeSeg .seg-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  const isShort = btn.dataset.route === 'short';
  $('angleBlock').classList.toggle('hidden', isShort || btn.dataset.route === 'outline');
  if (btn.dataset.route === 'short') {
    document.querySelector('input[name="mode"][value="short"]').checked = true;
    $('words').value = '800';
  } else {
    document.querySelector('input[name="mode"][value="long"]').checked = true;
  }
});

// 顶部「长文/短文」单选与写法分段按钮联动
document.querySelectorAll('input[name="mode"]').forEach((r) => {
  r.addEventListener('change', () => {
    const target = r.value === 'short' ? 'short' : 'breakthrough';
    document.querySelectorAll('#routeSeg .seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.route === target));
    $('angleBlock').classList.toggle('hidden', r.value === 'short');
  });
});

$('genAngles').addEventListener('click', genAngles);
async function genAngles() {
  const topic = topicText();
  if (!topic) return;
  $('angleList').classList.add('hidden');
  try {
    const data = await api('/api/angles', { topic, model: model() });
    state.angles = data.angles || [];
    const box = $('angleList');
    box.innerHTML = '';
    state.angles.forEach((a, i) => {
      const div = document.createElement('div');
      div.className = 'a-card';
      div.innerHTML = `<div class="a-title">${i + 1}. ${esc(a.title)}</div><div class="a-desc">${esc(a.desc)}</div>`;
      div.addEventListener('click', () => {
        state.selAngle = a.title + '：' + a.desc;
        box.querySelectorAll('.a-card').forEach((c) => c.classList.remove('sel'));
        div.classList.add('sel');
        writeArticle();
      });
      box.appendChild(div);
    });
    box.classList.remove('hidden');
  } catch (e) {
    toast('角度生成失败：' + e.message);
  }
}

// ================= 步骤 2：写正文（SSE 流式） =================
$('writeBtn').addEventListener('click', writeArticle);
$('stopWrite').addEventListener('click', () => {
  if (state.abort) state.abort.abort();
  $('stopWrite').classList.add('hidden');
  toast('已停止写作');
});
$('copyMd').addEventListener('click', () => copyText(state.articleMd, 'Markdown 已复制'));

async function writeArticle() {
  const topic = topicText();
  if (!topic) return;
  const route = getRoute();
  if (route === 'breakthrough' && !state.selAngle) {
    toast('破题式建议先生成角度并选择（也可以直接写，将用默认角度）');
  }
  const body = {
    topic,
    mode: getMode(),
    route,
    title: state.selTitle || '',
    angle: state.selAngle || '',
    words: getWords(),
    extra: $('extra').value.trim(),
    model: model(),
  };
  const out = $('articleOut');
  out.classList.remove('hidden');
  out.innerHTML = '<span class="cursor"></span>';
  $('writeLoading').classList.remove('hidden');
  $('writeBtn').disabled = true;
  $('copyMd').classList.add('hidden');
  $('stopWrite').classList.remove('hidden');

  const ac = new AbortController();
  state.abort = ac;
  let md = '';
  try {
    const res = await fetch('/api/article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(state.apiKey ? { 'x-api-key': state.apiKey } : {}) },
      body: JSON.stringify(body),
      signal: ac.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `请求失败 (${res.status})`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith('data:')) continue;
        let msg;
        try { msg = JSON.parse(line.slice(5)); } catch { continue; }
        if (msg.type === 'delta') {
          md += msg.text;
          out.innerHTML = renderMarkdown(md) + '<span class="cursor"></span>';
          out.scrollTop = out.scrollHeight;
        } else if (msg.type === 'error') {
          throw new Error(msg.message);
        } else if (msg.type === 'done') {
          out.innerHTML = renderMarkdown(md);
          state.articleMd = md;
          $('copyMd').classList.remove('hidden');
          $('stopWrite').classList.add('hidden');
          if (state.oneShotRunning) await genLayout();
        }
      }
    }
  } catch (e) {
    if (e.name !== 'AbortError') toast('写作失败：' + e.message);
  } finally {
    $('writeLoading').classList.add('hidden');
    $('writeBtn').disabled = false;
    $('stopWrite').classList.add('hidden');
    state.abort = null;
  }
}

// ================= 步骤 3：排版 =================
$('genLayout').addEventListener('click', genLayout);
$('copyHtml').addEventListener('click', async () => {
  if (!state.layoutHtml) return toast('还没有生成排版');
  const html = state.layoutHtml;
  const text = extractText(html);
  try {
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' }),
    })]);
    $('copyStatus').textContent = '✅ 已复制 HTML，可直接粘贴到公众号正文区域';
  } catch {
    copyText(html, '已复制 HTML 源码（兼容模式）');
  }
});

function extractText(html) {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.innerText || el.textContent || '';
}

async function genLayout() {
  const md = state.articleMd.trim();
  if (!md) { toast('请先生成正文'); return; }
  $('layoutLoading').classList.remove('hidden');
  $('layoutResult').classList.add('hidden');
  $('genLayout').disabled = true;
  try {
    const data = await api('/api/layout', { article: md, title: state.selTitle, style: $('style').value, model: model() });
    state.layoutHtml = data.html || '';
    $('preview').innerHTML = data.html || '<p>（空）</p>';
    $('styleUsed').textContent = '风格：' + (data.styleUsed || 'auto');
    $('layoutTips').textContent = data.tips ? '提示：' + data.tips : '';
    $('copyStatus').textContent = '';
    $('layoutResult').classList.remove('hidden');
    if (state.oneShotRunning) finishOneShot();
  } catch (e) {
    toast('排版生成失败：' + e.message);
  } finally {
    $('layoutLoading').classList.add('hidden');
    $('genLayout').disabled = false;
  }
}

// ================= 一键生成 =================
$('oneShot').addEventListener('click', () => {
  if (state.oneShotRunning) return;
  const topic = topicText();
  if (!topic) return;
  state.oneShotRunning = true;
  $('oneShot').textContent = '⚡ 正在一键生成…';
  $('oneShot').disabled = true;
  $('genTitles').click();
});

async function stepArticle() {
  if (getRoute() === 'breakthrough') {
    // 自动选第一个角度
    try {
      if (!state.angles) await genAnglesQuiet();
      if (state.angles && state.angles[0]) {
        state.selAngle = state.angles[0].title + '：' + state.angles[0].desc;
        $('angleList').querySelector('.a-card')?.classList.add('sel');
      }
    } catch { /* 角度失败不影响直接写作 */ }
  }
  await writeArticle();
}

async function genAnglesQuiet() {
  const data = await api('/api/angles', { topic: state.topic, model: model() });
  state.angles = data.angles || [];
  const box = $('angleList');
  box.innerHTML = '';
  state.angles.forEach((a, i) => {
    const div = document.createElement('div');
    div.className = 'a-card';
    div.innerHTML = `<div class="a-title">${i + 1}. ${esc(a.title)}</div><div class="a-desc">${esc(a.desc)}</div>`;
    div.addEventListener('click', () => {
      state.selAngle = a.title + '：' + a.desc;
      box.querySelectorAll('.a-card').forEach((c) => c.classList.remove('sel'));
      div.classList.add('sel');
      writeArticle();
    });
    box.appendChild(div);
  });
  box.classList.remove('hidden');
}

function finishOneShot() {
  state.oneShotRunning = false;
  $('oneShot').textContent = '⚡ 一键生成全文';
  $('oneShot').disabled = false;
  toast('✅ 全流程完成：标题 → 正文 → 排版已就绪，复制 HTML 去公众号粘贴吧');
}

// ---------- 初始化 ----------
(async () => {
  try {
    const h = await fetch('/api/health').then((r) => r.json());
    if (!h.ok) console.warn('health:', h);
  } catch (e) { /* 忽略 */ }
})();
