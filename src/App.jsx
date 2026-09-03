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
  ChevronDown,
  BookOpen,
  Feather,
  AlertTriangle,
  Award,
  Sliders,
  CheckCircle2,
  Terminal,
  Image as ImageIcon,
  Plus,
  Cpu,
  Trash2,
  Save,
  Clock,
  Loader2,
} from 'lucide-react';

import { BackgroundGrid } from './components/ui/BackgroundGrid.jsx';
import { SpotlightCard } from './components/ui/SpotlightCard.jsx';
import { ShimmerButton } from './components/ui/ShimmerButton.jsx';
import { ApiSettingsModal } from './components/ApiSettingsModal.jsx';
import { ImagePickerModal } from './components/ImagePickerModal.jsx';
import { WechatVisualEditor } from './components/WechatEditor/WechatVisualEditor.jsx';
import { cn } from './lib/utils.js';

const DEFAULT_MODELS = ['deepseek-v4-flash', 'deepseek-v4-pro'];
const DRAFT_STORAGE_KEY = 'gzh_draft_v2';

export default function App() {
  // Config state
  const [config, setConfig] = useState(() => ({
    baseUrl: localStorage.getItem('bs_baseUrl') || 'https://api.deepseek.com',
    apiKey: localStorage.getItem('bs_apiKey') || '',
    model: localStorage.getItem('bs_model') || 'deepseek-v4-flash',
  }));

  // Dynamic models list state
  const [modelsList, setModelsList] = useState(() => {
    const saved = localStorage.getItem('bs_models_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { }
    }
    return DEFAULT_MODELS;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef(null);
  const [isWritingImagePickerOpen, setIsWritingImagePickerOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // 点击下拉菜单外部自动收起
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Workflow state (恢复草稿)
  const initialDraft = (() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const [topic, setTopic] = useState(initialDraft?.topic || '');
  const [extra, setExtra] = useState(initialDraft?.extra || '');
  const [mode, setMode] = useState(initialDraft?.mode || 'long');
  const [words, setWords] = useState(initialDraft?.words || 2000);
  const [route, setRoute] = useState(initialDraft?.route || 'breakthrough');

  // Step 1: Titles
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [titlesProgress, setTitlesProgress] = useState(0);
  const [titlesStage, setTitlesStage] = useState('');
  const [titlesData, setTitlesData] = useState(initialDraft?.titlesData || null);
  const [selectedTitle, setSelectedTitle] = useState(initialDraft?.selectedTitle || '');

  // Step 2: Angles & Article
  const [loadingAngles, setLoadingAngles] = useState(false);
  const [anglesProgress, setAnglesProgress] = useState(0);
  const [anglesStage, setAnglesStage] = useState('');
  const [anglesData, setAnglesData] = useState(initialDraft?.anglesData || null);
  const [selectedAngle, setSelectedAngle] = useState(initialDraft?.selectedAngle || '');

  const [isWriting, setIsWriting] = useState(false);
  const [articleMd, setArticleMd] = useState(initialDraft?.articleMd || '');
  const abortControllerRef = useRef(null);

  // Toast timer
  const toastTimerRef = useRef(null);
  const showToast = (msg, ms) => {
    const isErr = msg && (msg.includes('失败') || msg.includes('错误') || msg.includes('异常') || msg.includes('缺少'));
    const duration = ms || (isErr ? 8000 : 4500);
    setToastMsg({ text: msg, isError: isErr });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), duration);
  };

  // 1. 防误刷新 / 防离开页面监听 (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isWriting || topic.trim() || articleMd.trim()) {
        e.preventDefault();
        e.returnValue = '当前有正在创作的内容，确定要刷新或离开吗？';
        return '当前有正在创作的内容，确定要刷新或离开吗？';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isWriting, topic, articleMd]);

  // 2. 自动保存草稿到 LocalStorage
  useEffect(() => {
    const draft = {
      topic,
      extra,
      mode,
      words,
      route,
      titlesData,
      selectedTitle,
      anglesData,
      selectedAngle,
      articleMd,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch { }
  }, [topic, extra, mode, words, route, titlesData, selectedTitle, anglesData, selectedAngle, articleMd]);

  // 首次检测到恢复草稿提示
  useEffect(() => {
    if (initialDraft && (initialDraft.topic || initialDraft.articleMd)) {
      showToast('💡 已自动为您恢复上次未完成的创作草稿');
    }
  }, []);

  // 清空重置草稿
  const handleResetDraft = () => {
    if (window.confirm('确定要清空当前所有选题、标题和文章草稿并重新开始吗？')) {
      setTopic('');
      setExtra('');
      setTitlesData(null);
      setSelectedTitle('');
      setAnglesData(null);
      setSelectedAngle('');
      setArticleMd('');
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      showToast('草稿已清空重置');
    }
  };

  // Sync state to local storage
  const handleSaveConfig = (newCfg) => {
    setConfig(newCfg);
    localStorage.setItem('bs_baseUrl', newCfg.baseUrl);
    localStorage.setItem('bs_apiKey', newCfg.apiKey);
    localStorage.setItem('bs_model', newCfg.model);
    showToast('API 与模型设置已保存生效');
  };

  const handleUpdateModelsList = (newModels) => {
    setModelsList(newModels);
    localStorage.setItem('bs_models_list', JSON.stringify(newModels));
  };

  const handleSelectActiveModel = (targetModel) => {
    const newCfg = { ...config, model: targetModel };
    setConfig(newCfg);
    localStorage.setItem('bs_model', targetModel);
    showToast(`已切换当前模型为: ${targetModel}`);
  };

  // Helper API call 支持流式长连接 (SSE) 与标准 JSON 自动切换，彻底杜绝网关 504 超时
  const apiCall = async (endpoint, body, onProgress) => {
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

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('text/event-stream')) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buf = '';
      let resultData = null;

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
          if (msg.type === 'data') {
            resultData = msg.data;
          } else if (msg.type === 'chunk' && onProgress) {
            onProgress(msg.len);
          } else if (msg.type === 'error') {
            throw new Error(msg.message);
          }
        }
      }
      if (!resultData) throw new Error('未能从模型获取到有效数据，请重试');
      return resultData;
    }

    const text = await res.text().catch(() => '');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      if (res.status === 504) {
        data = { error: `网关响应超时 (HTTP 504)：大模型推理或网络传输耗时过长。` };
      } else if (res.status === 502 || res.status === 503) {
        data = { error: `服务暂时不可用 (HTTP ${res.status})。请确认后端服务 (node server.mjs) 正常运行。` };
      } else {
        data = { error: `服务未返回有效 JSON (HTTP ${res.status})。请确认后端服务正常运行。` };
      }
    }

    if (!res.ok) throw new Error(data.error || `请求失败 (${res.status})`);
    return data;
  };

  // Step 1: Generate Titles with Progressive Progress Simulation
  const handleGenTitles = async () => {
    if (!topic.trim()) return showToast('请先输入一句主题');
    setLoadingTitles(true);
    setTitlesProgress(10);
    setTitlesStage('🔍 正在解析核心主题、提炼受众画像与记忆爆点...');

    const pTimer = setInterval(() => {
      setTitlesProgress((prev) => {
        if (prev < 35) {
          setTitlesStage('🧠 匹配 16 种爆款标题方法论与心理钩子...');
          return prev + 8;
        } else if (prev < 70) {
          setTitlesStage('📊 评估点击率潜力与安全合规风险...');
          return prev + 5;
        } else if (prev < 92) {
          setTitlesStage('✨ 构建 Top 5 角色推荐卡与 A/B 矩阵...');
          return prev + 2;
        }
        return prev;
      });
    }, 400);

    try {
      const data = await apiCall('/api/titles', { topic: topic.trim(), count: 10 });
      clearInterval(pTimer);
      setTitlesProgress(100);
      setTitlesStage('🎉 标题矩阵生成成功！');
      setTitlesData(data);
      if (data.top5 && data.top5[0]) {
        setSelectedTitle(data.top5[0].title);
      }
      showToast('爆款标题候选矩阵生成成功！');
    } catch (e) {
      clearInterval(pTimer);
      showToast('标题生成失败: ' + e.message);
    } finally {
      setTimeout(() => setLoadingTitles(false), 500);
    }
  };

  // Step 2: Generate Angles with Progressive Progress Simulation
  const handleGenAngles = async () => {
    if (!topic.trim()) return showToast('请先输入一句主题');
    setLoadingAngles(true);
    setAnglesProgress(15);
    setAnglesStage('🧭 扫描行业全景视角...');

    const aTimer = setInterval(() => {
      setAnglesProgress((prev) => {
        if (prev < 50) {
          setAnglesStage('💡 提炼反直觉、切身、对比与溯源视角...');
          return prev + 12;
        } else if (prev < 90) {
          setAnglesStage('🎯 甄选 5~8 个高辨识度破题切入点...');
          return prev + 4;
        }
        return prev;
      });
    }, 300);

    try {
      const data = await apiCall('/api/angles', { topic: topic.trim() });
      clearInterval(aTimer);
      setAnglesProgress(100);
      setAnglesStage('✅ 破题角度生成完毕！');
      setAnglesData(data.angles || []);
      showToast('破题角度生成完毕，请选择写入视角');
    } catch (e) {
      clearInterval(aTimer);
      showToast('角度生成失败: ' + e.message);
    } finally {
      setTimeout(() => setLoadingAngles(false), 400);
    }
  };

  // Step 2: Stream Write Article with Progress Calculation
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
        try { errObj = JSON.parse(text); } catch { }
        if (res.status === 504) {
          throw new Error('网关响应超时 (HTTP 504)：大模型生成耗时过长，请重试或确认模型服务状态。');
        }
        throw new Error(errObj?.error || `请求失败 (${res.status})。请确认后端服务已启动。`);
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
          if (msg.type === 'ping' || msg.type === 'start') {
            continue;
          }
          if (msg.type === 'delta') {
            textAcc += msg.text;
            setArticleMd(textAcc);
          } else if (msg.type === 'error') {
            throw new Error(msg.message);
          } else if (msg.type === 'done') {
            showToast('🎉 正文生成完毕！已自动同步至下方排版器');
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

  // 写作区插入图片
  const handleInsertWritingImage = (img) => {
    if (!img?.url) return;
    const imgMd = `\n\n![${img.title || '配图'}](${img.url})\n\n`;
    setArticleMd((prev) => (prev ? prev + imgMd : imgMd));
    showToast(`已插入商用配图: ${img.title}`);
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
      if (line.startsWith('![')) {
        const m = line.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (m) {
          return (
            <div key={index} className="my-4 text-center">
              <img src={m[2]} alt={m[1]} className="max-w-full rounded-xl mx-auto shadow-md" />
              {m[1] && <p className="text-xs text-slate-500 mt-1">{m[1]}</p>}
            </div>
          );
        }
      }
      if (line.trim() === '---') return <hr key={index} className="border-slate-800 my-4" />;
      if (!line.trim()) return <br key={index} />;
      return <p key={index} className="my-2 leading-relaxed text-slate-300">{line}</p>;
    });
  };

  // 正文字数统计与进度估算
  const articleLength = articleMd.length;
  const targetWords = Number(words) || 2000;
  const writingPercent = Math.min(100, Math.round((articleLength / (targetWords * 0.9)) * 100));

  return (
    <div className="relative min-h-screen bg-[#0b0f17] text-slate-100 pb-24 selection:bg-emerald-500 selection:text-white">
      {/* Background Grid */}
      <BackgroundGrid />

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-extrabold text-white text-lg shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              爆
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                爆款工坊
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v2.5
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">一句话主题 → 爆款标题 → 智能写作 → 可视化微信排版</p>
            </div>
          </div>

          <div className="flex items-center gap-3">

            {/* Auto-Save Status Pill */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
              <Check className="w-3 h-3" />
              <span>草稿已自动本地保存</span>
            </div>

            {/* Quick Model Selector Dropdown */}
            <div className="relative" ref={modelDropdownRef}>
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-all shadow-sm focus:outline-none"
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono font-medium max-w-[140px] sm:max-w-[190px] truncate text-slate-100">
                  {config.model}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isModelDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800/80 flex items-center justify-between">
                    <span>切换当前模型</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModelDropdownOpen(false);
                        setIsSettingsOpen(true);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-bold"
                    >
                      <Plus className="w-3 h-3" /> 管理/新增
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
                    {modelsList.map((m) => {
                      const isCurrent = config.model === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            handleSelectActiveModel(m);
                            setIsModelDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${isCurrent
                            ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                            }`}
                        >
                          <span className="font-mono truncate">{m}</span>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-1.5 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModelDropdownOpen(false);
                        setIsSettingsOpen(true);
                      }}
                      className="w-full text-center py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Settings className="w-3 h-3" />
                      <span>更多 API 与模型配置</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* API Settings Modal Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
            >
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>设置</span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8 relative z-10">

        {/* Step 0: Topic Input Card */}
        <SpotlightCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                0 选题
              </span>
              <h2 className="text-lg font-bold text-white">输入文章核心主题</h2>
            </div>

            <div className="flex items-center gap-3">
              {(topic || articleMd || titlesData) && (
                <button
                  onClick={handleResetDraft}
                  className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
                >
                  <Trash2 className="w-3 h-3" /> 清空重置
                </button>
              )}
              <span className="text-xs text-slate-400 hidden sm:block">一句话表达需求与干货目标</span>
            </div>
          </div>

          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={2}
            placeholder="例如：DeepSeek 推出新一代模型架构，写一篇通俗易懂的公众号爆款深度推文..."
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

          {/* Titles Generation Progress Bar */}
          {loadingTitles && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 animate-in fade-in duration-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-semibold flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {titlesStage || '正在深度生成爆款标题矩阵...'}
                </span>
                <span className="font-mono text-emerald-300 font-bold">{titlesProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                  style={{ width: `${titlesProgress}%` }}
                />
              </div>
            </div>
          )}
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
                disabled={loadingTitles}
                className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTitles ? 'animate-spin' : ''}`} /> 换一批
              </button>
            </div>

            {titlesData.brief && (
              <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-emerald-400">内容简报: </span>
                {titlesData.brief}
              </div>
            )}

            {/* Selected Title Highlight Banner */}
            {selectedTitle && (
              <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border-2 border-emerald-500/60 flex items-center justify-between gap-4 shadow-[0_0_25px_rgba(16,185,129,0.2)] animate-in fade-in duration-200">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)] shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[11px] text-emerald-400 font-bold tracking-wider flex items-center gap-1.5">
                      <span>已选定爆款标题（将作为后续写作与排版的主标题）</span>
                    </div>
                    <div className="text-sm font-extrabold text-white mt-0.5 truncate">{selectedTitle}</div>
                  </div>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(selectedTitle); showToast('标题已复制到剪贴板！'); }}
                  className="px-3.5 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> 复制标题
                </button>
              </div>
            )}

            {/* Candidates Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 mb-6 shadow-inner">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 w-12 text-center">状态</th>
                    <th className="p-3.5">候选标题 (点击整行选用)</th>
                    <th className="p-3.5">方法</th>
                    <th className="p-3.5">心理钩子</th>
                    <th className="p-3.5">评分</th>
                    <th className="p-3.5">违规风险</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {titlesData.candidates?.map((c, idx) => {
                    const isSelected = selectedTitle === c.title;
                    return (
                      <tr
                        key={idx}
                        onClick={() => { setSelectedTitle(c.title); showToast(`已选用标题: ${c.title}`); }}
                        className={`cursor-pointer transition-all ${isSelected
                          ? 'bg-gradient-to-r from-emerald-500/25 via-emerald-500/10 to-transparent border-l-4 border-l-emerald-400 font-bold text-white shadow-[inset_0_1px_0_rgba(16,185,129,0.3),inset_0_-1px_0_rgba(16,185,129,0.3)]'
                          : 'hover:bg-slate-800/50 text-slate-300 border-l-4 border-l-transparent'
                          }`}
                      >
                        <td className="p-3.5 text-center">
                          {isSelected ? (
                            <div className="flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            </div>
                          ) : (
                            <span className="text-slate-500 font-mono">{idx + 1}</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className={isSelected ? 'text-emerald-200 text-sm font-extrabold' : 'text-slate-100 font-medium hover:text-emerald-400'}>
                              {c.title}
                            </span>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.6)] shrink-0">
                                当前选用
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-400">{c.method}</td>
                        <td className="p-3.5 text-slate-400">{c.hook}</td>
                        <td className="p-3.5 font-bold text-emerald-400">{c.score}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${c.risk === '高' ? 'bg-rose-500/20 text-rose-300' : c.risk === '中' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                            {c.risk || '低'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Top 5 Recommendations */}
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" /> Top 5 推荐角色卡
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
              {titlesData.top5?.map((t, i) => {
                const isSelected = selectedTitle === t.title;
                return (
                  <div
                    key={i}
                    onClick={() => { setSelectedTitle(t.title); showToast(`已选用推荐标题: ${t.title}`); }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.35)] ring-2 ring-emerald-400/50 scale-[1.02]'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-emerald-400">{t.role}</span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                          <Check className="w-3 h-3" /> 已选用
                        </span>
                      )}
                    </div>
                    <div className={`text-sm mb-1.5 ${isSelected ? 'font-extrabold text-white text-[15px]' : 'font-semibold text-slate-100'}`}>
                      {t.title}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">{t.reason}</div>
                  </div>
                );
              })}
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
                className={`px-3 py-1.5 rounded-lg transition-all ${route === 'breakthrough' ? 'bg-emerald-500 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
              >
                破题式 (先选视角)
              </button>
              <button
                onClick={() => setRoute('outline')}
                className={`px-3 py-1.5 rounded-lg transition-all ${route === 'outline' ? 'bg-emerald-500 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
              >
                大纲式 (观点/教程)
              </button>
              <button
                onClick={() => setRoute('short')}
                className={`px-3 py-1.5 rounded-lg transition-all ${route === 'short' ? 'bg-emerald-500 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
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
                  {loadingAngles ? '生成视角中...' : '生成破题视角'}
                </button>
              </div>

              {/* Angles Progress Bar */}
              {loadingAngles && (
                <div className="mb-3 p-3 rounded-xl bg-slate-950 border border-amber-500/30 animate-in fade-in space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-400 font-semibold flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {anglesStage || '正在深度提炼破题切入点...'}
                    </span>
                    <span className="font-mono text-amber-300 font-bold">{anglesProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300"
                      style={{ width: `${anglesProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {anglesData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {anglesData.map((a, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedAngle(`${a.title}：${a.desc}`)}
                      className={`p-3 rounded-xl border cursor-pointer text-xs transition-all ${selectedAngle.startsWith(a.title)
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
              {/* Insert Stock Image Trigger */}
              <button
                onClick={() => setIsWritingImagePickerOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>插入无版权配图</span>
              </button>

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

          {/* Article Streaming Writing Progress Bar */}
          {isWriting && (
            <div className="mb-4 p-4 rounded-xl bg-slate-950 border border-emerald-500/40 shadow-lg space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>正在流式生成爆款正文...</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-slate-400">已产出: <strong className="text-white">{articleLength}</strong> 字</span>
                  <span className="text-slate-500">/</span>
                  <span className="text-slate-400">目标: <strong className="text-slate-200">约 {targetWords}</strong> 字</span>
                  <span className="text-emerald-400 font-bold ml-1">({writingPercent}%)</span>
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-200 shadow-[0_0_15px_rgba(16,185,129,0.7)]"
                  style={{ width: `${writingPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Article Markdown Output Preview */}
          {articleMd && (
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-6 min-h-[250px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" /> 成稿 Markdown
                  <span className="text-slate-500 font-normal ml-2">({articleLength} 字)</span>
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsWritingImagePickerOpen(true)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> 搜索无版权图
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(articleMd); showToast('Markdown 已复制！'); }}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> 复制 Markdown
                  </button>
                </div>
              </div>

              <div className={`prose prose-invert max-w-none text-sm leading-relaxed ${isWriting ? 'typing-cursor' : ''}`}>
                {renderMarkdown(articleMd)}
              </div>
            </div>
          )}
        </SpotlightCard>

        {/* Step 3: Professional WeChat Visual Formatter & Editor */}
        <SpotlightCard className="p-6" overflowVisible={true}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                3 排版
              </span>
              <h2 className="text-lg font-bold text-white">微信公众号可视化排版编辑器</h2>
            </div>
            <span className="text-xs text-slate-400 hidden sm:block">
              基于开源 Doocs/mdnice 排版引擎 · 100% 微信富文本内联规范
            </span>
          </div>

          <WechatVisualEditor
            articleMd={articleMd}
            articleTitle={selectedTitle || topic}
            onUpdateMd={setArticleMd}
            onShowToast={showToast}
          />
        </SpotlightCard>

      </main>

      {/* Free Copyright-free Image Picker Modal for Writing Section */}
      <ImagePickerModal
        isOpen={isWritingImagePickerOpen}
        onClose={() => setIsWritingImagePickerOpen(false)}
        onInsertImage={handleInsertWritingImage}
      />

      {/* API & Dynamic Model Settings Modal */}
      <ApiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveConfig}
        currentConfig={config}
        modelsList={modelsList}
        onUpdateModelsList={handleUpdateModelsList}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl border text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-5 duration-200 flex items-center gap-3 max-w-lg ${toastMsg.isError
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            : 'bg-slate-900/95 border-emerald-500/50 text-emerald-300'
            }`}
        >
          <span>{toastMsg.text}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="p-1 rounded-md text-slate-400 hover:text-white transition-colors text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
