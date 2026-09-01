import React, { useState, useEffect } from 'react';
import { X, Check, Key, Server, Cpu, Zap, Eye, EyeOff, Activity, AlertCircle } from 'lucide-react';
import { ShimmerButton } from './ui/ShimmerButton.jsx';

const PRESETS = [
  {
    name: 'DeepSeek 官方',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    desc: '性价比极高，推荐主模型',
    icon: '⚡',
  },
  {
    name: '硅基流动 SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    models: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1'],
    desc: '国内优质托管中转',
    icon: '🚀',
  },
  {
    name: '通义千问 DashScope',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-max',
    models: ['qwen-max', 'qwen-plus', 'qwen-turbo'],
    desc: '阿里云兼容接口',
    icon: '🌐',
  },
  {
    name: 'OpenAI 官方',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-mini'],
    desc: '全球顶尖旗舰模型',
    icon: '🧠',
  },
  {
    name: 'Ollama 本地部署',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'qwen2.5:7b',
    models: ['qwen2.5:7b', 'deepseek-r1:8b'],
    desc: '完全离线私有化',
    icon: '💻',
  },
];

export function ApiSettingsModal({ isOpen, onClose, onSave, currentConfig }) {
  const [baseUrl, setBaseUrl] = useState(currentConfig.baseUrl || 'https://api.deepseek.com');
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [model, setModel] = useState(currentConfig.model || 'deepseek-chat');
  const [showKey, setShowKey] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setBaseUrl(currentConfig.baseUrl || 'https://api.deepseek.com');
      setApiKey(currentConfig.apiKey || '');
      setModel(currentConfig.model || 'deepseek-chat');
      setTestResult(null);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleSelectPreset = (p) => {
    setBaseUrl(p.baseUrl);
    setModel(p.defaultModel);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ ok: false, message: '请先输入 API Key 再进行测试' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'x-base-url': baseUrl.trim(),
          'x-model': model.trim(),
        },
        body: JSON.stringify({ apiKey: apiKey.trim(), baseUrl: baseUrl.trim(), model: model.trim() }),
      });

      const text = await res.text().catch(() => '');
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: `网络或代理响应异常 (HTTP ${res.status})。请确认后端 Node 服务 (node server.mjs) 已在 43121 端口启动。` };
      }

      if (res.ok && data.ok) {
        setTestResult({ ok: true, latency: data.latencyMs, reply: data.reply });
      } else {
        setTestResult({ ok: false, message: data.error || '连接测试失败' });
      }
    } catch (e) {
      setTestResult({ ok: false, message: e.message || '网络连接异常' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave({
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">模型与 API 接入配置</h3>
              <p className="text-xs text-slate-400">支持任意 OpenAI API 规范模型（DeepSeek、OpenAI、硅基流动、Ollama 等）</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-emerald-400" /> 厂商快捷预设 (一键充填)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    baseUrl === p.baseUrl
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{p.icon} {p.name}</span>
                    {baseUrl === p.baseUrl && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            
            {/* Base URL */}
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-emerald-400" /> Base URL (API 服务入口)</span>
                <span className="text-[11px] text-slate-500">须包含协议头 (http/https)</span>
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.deepseek.com"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            {/* API Key */}
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-emerald-400" /> API Key (令牌秘钥)</span>
                <span className="text-[11px] text-slate-500">仅保存在你本机的浏览器 localStorage 中</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Model Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-emerald-400" /> 模型名称 (Model Name)</span>
                <span className="text-[11px] text-slate-500">支持任意模型标识或自定义填入</span>
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="deepseek-chat"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              
              {/* Common Model Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['deepseek-chat', 'deepseek-reasoner', 'deepseek-ai/DeepSeek-V3', 'qwen-max', 'gpt-4o', 'gpt-4o-mini'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModel(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                      model === m
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Test Status Notice */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.ok
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              {testResult.ok ? (
                <Activity className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              )}
              <div>
                <p className="font-semibold">
                  {testResult.ok ? `连接成功！响应延迟: ${testResult.latency} ms` : '连接测试失败'}
                </p>
                <p className="opacity-90 mt-0.5">{testResult.ok ? `测试回复: "${testResult.reply}"` : testResult.message}</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:border-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Activity className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? '正在测试...' : '测试 API 连接'}
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              取消
            </button>
            <ShimmerButton onClick={handleSave} size="small">
              保存配置
            </ShimmerButton>
          </div>
        </div>

      </div>
    </div>
  );
}
