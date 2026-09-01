import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Settings,
  Zap,
  FileText,
  Copy,
  Check,
  StopCircle,
  RefreshCw,
  Layers,
  Smartphone,
  ChevronRight,
  BookOpen,
  Feather,
  AlertTriangle,
  Award,
  Sliders,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

import { BackgroundGrid } from './components/ui/BackgroundGrid.jsx';
import { SpotlightCard } from './components/ui/SpotlightCard.jsx';
import { ShimmerButton } from './components/ui/ShimmerButton.jsx';
import { ApiSettingsModal } from './components/ApiSettingsModal.jsx';
import { cn } from './lib/utils.js';

export default function App() {
  // Config state
  const [config, setConfig] = useState(() => ({
    baseUrl: localStorage.getItem('bs_baseUrl') || 'https://api.deepseek.com',
    apiKey: localStorage.getItem('bs_apiKey') || '',
    model: localStorage.getItem('bs_model') || 'deepseek-chat',
  }));

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Workflow state
  const [topic, setTopic] = useState('');
  const [extra, setExtra] = useState('');
  const [mode, setMode] = useState('long');
  const [words, setWords] = useState(2000);
  const [route, setRoute] = useState('breakthrough');

  // Step 1: Titles
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [titlesData, setTitlesData] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState('');

  // Step 2: Angles & Article
  const [loadingAngles, setLoadingAngles] = useState(false);
  const [anglesData, setAnglesData] = useState(null);
  const [selectedAngle, setSelectedAngle] = useState('');

  const [isWriting, setIsWriting] = useState(false);
  const [articleMd, setArticleMd] = useState('');
  const abortControllerRef = useRef(null);

  // Step 3: Layout
  const [layoutStyle, setLayoutStyle] = useState('auto');
  const [loadingLayout, setLoadingLayout] = useState(false);
  const [layoutData, setLayoutData] = useState(null);
  const [copyStatus, setCopyStatus] = useState('');

  // Toast timer
  const toastTimerRef = useRef(null);
  const showToast = (msg, ms = 3000) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), ms);
  };

  // Sync state to local storage
  const handleSaveConfig = (newCfg) => {
    setConfig(newCfg);
    localStorage.setItem('bs_baseUrl', newCfg.baseUrl);
    localStorage.setItem('bs_apiKey', newCfg.apiKey);
    localStorage.setItem('bs_model', newCfg.model);
    showToast('API 设置已在本地生效');
  };

  // Helper API call with safe JSON parsing
  const apiCall = async (endpoint, body) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'x-api-key': config.apiKey } : {}),
        ...(config.baseUrl ? { 'x-base-url': config.baseUrl } : {}),
        ...(config.model ? { 'x-model': config.model } : {}),
      },
      body: JSON.stringify({ ...body, baseUrl: config.baseUrl, model: config.model }),
    });

    const text = await res.text().catch(() => '');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: `服务未返回有效 JSON (HTTP ${res.status})。请确认后端 Node 服务 (node server.mjs) 已启动。` };
    }

    if (!res.ok) throw new Error(data.error || `请求失败 (${res.status})`);
    return data;
  };

  // Step 1: Generate Titles
  const handleGenTitles = async () => {
    if (!topic.trim()) return showToast('请先输入一句主题');
    setLoadingTitles(true);
    setTitlesData(null);
    try {
      const data = await apiCall('/api/titles', { topic: topic.trim(), count: 10 });
      setTitlesData(data);
      if (data.top5 && data.top5[0]) {
        setSelectedTitle(data.top5[0].title);
      }
      showToast('爆款标题矩阵生成成功！');
    } catch (e) {
      showToast('标题生成失败: ' + e.message);
    } fontally: {
      setLoadingTitles(false);
    }
  };

  // Step 2: Generate Angles
  const handleGenAngles = async () => {
    if (!topic.trim()) return showToast('请先输入一句主题');
    setLoadingAngles(true);
    setAnglesData(null);
    try {
      const data = await apiCall('/api/angles', { topic: topic.trim() });
      setAnglesData(data.angles || []);
      showToast('破题角度生成完毕，请选择写入角度');
    } catch (e) {
      showToast('角度生成失败: ' + e.message);
    } finally {
      setLoadingAngles(false);
    }
  };

  // Step 2: Stream Write Article
  const handleWriteArticle = async () => {
    if (!topic.trim()) return showToast('请先输入一句主题');
    setIsWriting(true);
    setArticleMd('');
    const ac = new AbortController();
    abortControllerRef.current = ac;

    const payload = {
      topic: topic.trim(),
      mode,
      route,
      title: selectedTitle || '',
      angle: selectedAngle || '',
      words: Number(words) || 2000,
      extra: extra.trim(),
    };

    try {
      const res = await fetch('/api/article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { 'x-api-key': config.apiKey } : {}),
          ...(config.baseUrl ? { 'x-base-url': config.baseUrl } : {}),
          ...(config.model ? { 'x-model': config.model } : {}),
        },
        body: JSON.stringify({ ...payload, baseUrl: config.baseUrl, model: config.model }),
        signal: ac.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let errObj;
        try { errObj = JSON.parse(text); } catch {}
        throw new Error(errObj?.error || `请求失败 (${res.status})。请确认后端 Node 服务已启动。`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buf = '';
      let textAcc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith('data:')) continue;
          let msg;
          try { msg = JSON.parse(line.slice(5)); } catch { continue; }
          if (msg.type === 'delta') {
            textAcc += msg.text;
            setArticleMd(textAcc);
          } else if (msg.type === 'error') {
            throw new Error(msg.message);
          } else if (msg.type === 'done') {
            showToast('正文生成完毕！');
          }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') showToast('写作失败: ' + e.message);
    } finally {
      setIsWriting(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopWriting = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      showToast('已中断生成');
    }
  };

  // Step 3: Layout
  const handleGenLayout = async () => {
    if (!articleMd.trim()) return showToast('请先生成文章正文');
    setLoadingLayout(true);
    setLayoutData(null);
    try {
      const data = await apiCall('/api/layout', {
        article: articleMd.trim(),
        title: selectedTitle,
        style: layoutStyle,
      });
      setLayoutData(data);
      showToast('公众号 HTML 排版生成成功！');
    } catch (e) {
      showToast('排版失败: ' + e.message);
    } finally {
      setLoadingLayout(false);
    }
  };

  // Copy HTML
  const handleCopyHtml = async () => {
    if (!layoutData?.html) return;
    const html = layoutData.html;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([extractText(html)], { type: 'text/plain' }),
        }),
      ]);
      setCopyStatus('✅ 已成功复制富文本 HTML！去公众号直接粘贴即可');
      showToast('HTML 已复制到剪贴板！');
    } catch {
      // Fallback text copy
      const ta = document.createElement('textarea');
      ta.value = html;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      setCopyStatus('✅ 已复制 HTML 源码 (兼容模式)');
      showToast('HTML 源码已复制！');
    }
  };

  const extractText = (html) => {
    const el = document.createElement('div');
    el.innerHTML = html;
    return el.innerText || el.textContent || '';
  };

  // Simple Markdown renderer
  const renderMarkdown = (md) => {
    if (!md) return '';
    const lines = md.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) return <h1 key={index} className="text-xl font-bold text-white mt-4 mb-2">{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={index} className="text-lg font-bold text-emerald-400 border-l-4 border-emerald-500 pl-3 my-3">{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={index} className="text-base font-semibold text-slate-200 my-2">{line.slice(4)}</h3>;
      if (line.startsWith('> ')) return <blockquote key={index} className="border-l-4 border-emerald-500/60 bg-emerald-950/20 px-4 py-2 my-2 text-slate-300 rounded-r-lg">{line.slice(2)}</blockquote>;
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={index} className="ml-4 text-slate-300 list-disc">{line.slice(2)}</li>;
      if (line.trim() === '---') return <hr key={index} className="border-slate-800 my-4" />;
      if (!line.trim()) return <br key={index} />;
      return <p key={index} className="my-2 leading-relaxed text-slate-300">{line}</p>;
    });
  };

  return (
    <div className="relative min-h-screen bg-[#0b0f17] text-slate-100 pb-20 selection:bg-emerald-500 selection:text-white">
      {/* Aceternity Background Grid */}
      <BackgroundGrid />

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-extrabold text-white text-lg shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              爆
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                公众号爆款文章工坊
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  creator-buddy v2.0
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">一句话主题 → 爆款标题 → 智能写作 → 微信排版</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Active Model Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">模型:</span>
              <span className="font-mono text-emerald-300">{config.model}</span>
            </div>

            {/* API Settings Modal Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
            >
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>API 设置</span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8 relative z-10">

        {/* Step 0: Topic Input Card (Spotlight) */}
        <SpotlightCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                0 选题
              </span>
              <h2 className="text-lg font-bold text-white">输入文章核心主题</h2>
            </div>
            <span className="text-xs text-slate-400">一句话表达需求与干货目标</span>
          </div>

          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={2}
            placeholder="例如：DeepSeek 发布新版本，写一篇通俗易懂的公众号科技爆款推文..."
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
          />

          <textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            rows={2}
            placeholder="补充说明 / 素材（可选）：读者画像、账号定位、强调亮点、已有案例或数据..."
            className="w-full mt-3 px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-700 transition-all resize-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-800/60">
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'long'}
                  onChange={() => { setMode('long'); setWords(2000); setRoute('breakthrough'); }}
                  className="accent-emerald-500"
                />
                <span>深度长文 (1500~4000字)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'short'}
                  onChange={() => { setMode('short'); setWords(800); setRoute('short'); }}
                  className="accent-emerald-500"
                />
                <span>公众号短文 (≤1000字)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">字数:</span>
                <select
                  value={words}
                  onChange={(e) => setWords(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                >
                  <option value={2000}>约 2000 字</option>
                  <option value={1500}>约 1500 字</option>
                  <option value={3000}>约 3000 字</option>
                  <option value={4000}>约 4000 字</option>
                  <option value={800}>约 800 字 (短篇)</option>
                  <option value={500}>约 500 字 (快讯)</option>
                </select>
              </div>
            </div>

            <ShimmerButton onClick={handleGenTitles} disabled={loadingTitles} size="medium">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              {loadingTitles ? '正在生成爆款标题...' : '生成候选标题'}
            </ShimmerButton>
          </div>
        </SpotlightCard>

        {/* Step 1: Titles Result */}
        {titlesData && (
          <SpotlightCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                  1 标题
                </span>
                <h2 className="text-lg font-bold text-white">爆款标题候选矩阵</h2>
              </div>
              <button
                onClick={handleGenTitles}
                className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> 换一批
              </button>
            </div>

            {titlesData.brief && (
              <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-emerald-400">内容简报: </span>
                {titlesData.brief}
              </div>
            )}

            {/* Candidates Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50 mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-10">#</th>
                    <th className="p-3">候选标题 (点击选择)</th>
                    <th className="p-3">方法</th>
                    <th className="p-3">心理钩子</th>
                    <th className="p-3">评分</th>
                    <th className="p-3">违规风险</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {titlesData.candidates?.map((c, idx) => (
                    <tr
                      key={idx}
                      onClick={() => { setSelectedTitle(c.title); showToast(`已选择标题: ${c.title}`); }}
                      className={`cursor-pointer transition-colors ${
                        selectedTitle === c.title
                          ? 'bg-emerald-950/30 text-emerald-200 font-medium'
                          : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <td className="p-3 text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-medium text-slate-100 hover:text-emerald-400">{c.title}</td>
                      <td className="p-3 text-slate-400">{c.method}</td>
                      <td className="p-3 text-slate-400">{c.hook}</td>
                      <td className="p-3 font-bold text-emerald-400">{c.score}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          c.risk === '高' ? 'bg-rose-500/20 text-rose-300' : c.risk === '中' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {c.risk || '低'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top 5 Recommendations */}
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" /> Top 5 推荐角色卡
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {titlesData.top5?.map((t, i) => (
                <div
                  key={i}
                  onClick={() => { setSelectedTitle(t.title); showToast(`已选用推荐标题: ${t.title}`); }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedTitle === t.title
                      ? 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-bold text-emerald-400 mb-1">{t.role}</div>
                  <div className="text-sm font-semibold text-white mb-1">{t.title}</div>
                  <div className="text-[11px] text-slate-400">{t.reason}</div>
                </div>
              ))}
            </div>

          </SpotlightCard>
        )}

        {/* Step 2: Article Generation */}
        <SpotlightCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                2 写作
              </span>
              <h2 className="text-lg font-bold text-white">生成爆款正文</h2>
            </div>

            {/* Route Selector Tabs */}
            <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <button
                onClick={() => setRoute('breakthrough')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  route === 'breakthrough' ? 'bg-emerald-500 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                破题式 (先选角度)
              </button>
              <button
                onClick={() => setRoute('outline')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  route === 'outline' ? 'bg-emerald-500 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                大纲式 (教程/观点)
              </button>
              <button
                onClick={() => setRoute('short')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  route === 'short' ? 'bg-emerald-500 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                短文
              </button>
            </div>
          </div>

          {/* Angles Selection Block */}
          {route === 'breakthrough' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">选择破题切入视角 (可点击生成 5~8 个推荐视角):</span>
                <button
                  onClick={handleGenAngles}
                  disabled={loadingAngles}
                  className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingAngles ? 'animate-spin' : ''}`} />
                  {loadingAngles ? '生成角度中...' : '生成破题角度'}
                </button>
              </div>

              {anglesData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {anglesData.map((a, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedAngle(`${a.title}：${a.desc}`)}
                      className={`p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                        selectedAngle.startsWith(a.title)
                          ? 'border-amber-500 bg-amber-950/20 text-amber-200'
                          : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-amber-400">{i + 1}. {a.title}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{a.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Writer Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 mb-4">
            <div className="flex items-center gap-2 overflow-hidden mr-4">
              <span className="text-xs text-slate-400 shrink-0">当前标题:</span>
              <span className="text-xs font-semibold text-emerald-400 truncate">
                {selectedTitle || '(未选择标题，写作时将自动推断)'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isWriting ? (
                <button
                  onClick={handleStopWriting}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 transition-colors flex items-center gap-1.5"
                >
                  <StopCircle className="w-4 h-4" /> 停止写作
                </button>
              ) : (
                <ShimmerButton onClick={handleWriteArticle} size="medium">
                  <Feather className="w-4 h-4 text-emerald-300" /> 开始流式写作
                </ShimmerButton>
              )}
            </div>
          </div>

          {/* Article Markdown Output */}
          {articleMd && (
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-6 min-h-[300px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" /> 成稿 Markdown
                </span>
                <button
                  onClick={() => { navigator.clipboard.writeText(articleMd); showToast('Markdown 已复制！'); }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> 复制 Markdown
                </button>
              </div>

              <div className={`prose prose-invert max-w-none text-sm leading-relaxed ${isWriting ? 'typing-cursor' : ''}`}>
                {renderMarkdown(articleMd)}
              </div>
            </div>
          )}
        </SpotlightCard>

        {/* Step 3: Layout */}
        <SpotlightCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                3 排版
              </span>
              <h2 className="text-lg font-bold text-white">公众号排版转换器</h2>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={layoutStyle}
                onChange={(e) => setLayoutStyle(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="auto">智能样式匹配</option>
                <option value="claude">Claude · 暖白克制编辑感</option>
                <option value="openai">OpenAI · 黑白灰实用主义</option>
                <option value="google">Google · 亮白模块卡片</option>
              </select>

              <ShimmerButton onClick={handleGenLayout} disabled={loadingLayout} size="medium">
                <Layers className="w-4 h-4 text-emerald-300" />
                {loadingLayout ? '排版转换中...' : '生成公众号排版'}
              </ShimmerButton>
            </div>
          </div>

          {/* Layout Preview */}
          {layoutData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <div className="text-xs text-emerald-300 font-medium">
                  {copyStatus || '已为文章适配专属微信排版 CSS 样式，点击右侧按钮复制：'}
                </div>
                <button
                  onClick={handleCopyHtml}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg transition-all flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" /> 复制 HTML 到公众号
                </button>
              </div>

              {/* Phone Container Mockup */}
              <div className="mx-auto max-w-[677px] rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" /> 微信标准文章卡片 (677px)
                </div>
                <div
                  className="p-6 bg-white text-slate-900 overflow-x-auto min-h-[400px]"
                  dangerouslySetInnerHTML={{ __html: layoutData.html }}
                />
              </div>
            </div>
          )}
        </SpotlightCard>

      </main>

      {/* API Settings Modal */}
      <ApiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveConfig}
        currentConfig={config}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
