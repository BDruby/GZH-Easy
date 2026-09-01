import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Key,
  Server,
  Cpu,
  Zap,
  Eye,
  EyeOff,
  Activity,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Save,
} from 'lucide-react';
import { ShimmerButton } from './ui/ShimmerButton.jsx';

const PRESETS = [
  {
    name: 'DeepSeek 官方',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-v4-flash',
    desc: '性价比极高，推荐主模型',
    icon: '⚡',
  },
  {
    name: '硅基流动 SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    desc: '国内优质托管中转',
    icon: '🚀',
  },
  {
    name: '通义千问 DashScope',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-max',
    desc: '阿里云兼容接口',
    icon: '🌐',
  },
  {
    name: 'OpenAI 官方',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    desc: '全球顶尖旗舰模型',
    icon: '🧠',
  },
  {
    name: 'Ollama 本地部署',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'qwen2.5:7b',
    desc: '完全离线私有化',
    icon: '💻',
  },
];

export function ApiSettingsModal({
  isOpen,
  onClose,
  onSave,
  currentConfig,
  modelsList = ['deepseek-v4-flash', 'deepseek-v4-pro'],
  onUpdateModelsList,
}) {
  const [baseUrl, setBaseUrl] = useState(currentConfig.baseUrl || 'https://api.deepseek.com');
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [model, setModel] = useState(currentConfig.model || 'deepseek-v4-flash');
  const [showKey, setShowKey] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // 模型管理编辑状态
  const [models, setModels] = useState(modelsList);
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBaseUrl(currentConfig.baseUrl || 'https://api.deepseek.com');
      setApiKey(currentConfig.apiKey || '');
      setModel(currentConfig.model || 'deepseek-v4-flash');
      setModels(modelsList && modelsList.length > 0 ? modelsList : ['deepseek-v4-flash', 'deepseek-v4-pro']);
      setTestResult(null);
      setIsAddingModel(false);
      setEditingIndex(null);
    }
  }, [isOpen, currentConfig, modelsList]);

  if (!isOpen) return null;

  const handleSelectPreset = (p) => {
    setBaseUrl(p.baseUrl);
    setModel(p.defaultModel);
    // 如果选择的预设模型不在列表里，可顺便加入
    if (!models.includes(p.defaultModel)) {
      const next = [...models, p.defaultModel];
      setModels(next);
      onUpdateModelsList?.(next);
    }
    setTestResult(null);
  };

  // 添加模型
  const handleAddModel = () => {
    const val = newModelName.trim();
    if (!val) return;
    if (models.includes(val)) {
      setModel(val);
      setIsAddingModel(false);
      setNewModelName('');
      return;
    }
    const next = [...models, val];
    setModels(next);
    setModel(val);
    onUpdateModelsList?.(next);
    setIsAddingModel(false);
    setNewModelName('');
  };

  // 开始编辑模型
  const handleStartEdit = (idx, currentVal, e) => {
    e.stopPropagation();
    setEditingIndex(idx);
    setEditingValue(currentVal);
  };

  // 保存编辑模型
  const handleSaveEdit = (idx, e) => {
    e?.stopPropagation();
    const val = editingValue.trim();
    if (!val) return;
    const oldVal = models[idx];
    const next = [...models];
    next[idx] = val;
    setModels(next);
    if (model === oldVal) {
      setModel(val);
    }
    onUpdateModelsList?.(next);
    setEditingIndex(null);
  };

  // 删除模型
  const handleDeleteModel = (idx, targetModel, e) => {
    e.stopPropagation();
    if (models.length <= 1) {
      alert('请至少保留一个可用模型');
      return;
    }
    const next = models.filter((_, i) => i !== idx);
    setModels(next);
    if (model === targetModel) {
      setModel(next[0]);
    }
    onUpdateModelsList?.(next);
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
    onUpdateModelsList?.(models);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">模型与 API 接入配置</h3>
              <p className="text-xs text-slate-400">支持任意兼容 OpenAI API 规范的大模型（DeepSeek、OpenAI、Ollama等）</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-emerald-400" /> 厂商快捷预设 (一键填入)
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
                    <span className="text-xs font-semibold text-white">{p.icon} {p.name}</span>
                    {baseUrl === p.baseUrl && <Check className="w-3.5 h-3.5 text-emerald-400" />}
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
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            {/* API Key */}
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-emerald-400" /> API Key (令牌秘钥)</span>
                <span className="text-[11px] text-slate-500">仅保存在本机浏览器 localStorage 中</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full pl-4 pr-11 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
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

            {/* Model Name Input & Editable Model Button List */}
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-emerald-400" /> 当前工作模型 (Active Model)</span>
                <span className="text-[11px] text-slate-500">直接输入或点击下方模型标签</span>
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="deepseek-v4-flash"
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              
              {/* Dynamic Model Button List (Add / Edit / Delete) */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <span>快捷模型列表（支持增/删/改）:</span>
                  </span>
                  {!isAddingModel && (
                    <button
                      type="button"
                      onClick={() => setIsAddingModel(true)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                    >
                      <Plus className="w-3 h-3" /> 添加模型
                    </button>
                  )}
                </div>

                {/* Add Input Drawer */}
                {isAddingModel && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-emerald-500/40 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddModel()}
                      placeholder="输入模型标识（如 deepseek-v4-pro, gpt-4o 等）..."
                      autoFocus
                      className="flex-1 px-3 py-1.5 bg-slate-900 rounded-lg text-xs font-mono text-slate-100 focus:outline-none border border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={handleAddModel}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold"
                    >
                      添加
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsAddingModel(false); setNewModelName(''); }}
                      className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
                    >
                      取消
                    </button>
                  </div>
                )}

                {/* Model Chips List */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {models.map((m, idx) => {
                    const isSelected = model === m;
                    const isEditing = editingIndex === idx;

                    if (isEditing) {
                      return (
                        <div key={idx} className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-amber-500/50">
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(idx, e)}
                            autoFocus
                            className="px-2 py-0.5 bg-slate-900 rounded text-xs font-mono text-white focus:outline-none w-36"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleSaveEdit(idx, e)}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingIndex(null)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        onClick={() => setModel(m)}
                        className={`group flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)] font-semibold'
                            : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-700/60'
                        }`}
                      >
                        <span>{m}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />}

                        {/* Inline Actions (Edit & Delete) */}
                        <div className="flex items-center gap-0.5 ml-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => handleStartEdit(idx, m, e)}
                            title="重命名模型"
                            className="p-0.5 rounded hover:text-amber-400 hover:bg-slate-700/50"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {models.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteModel(idx, m, e)}
                              title="删除模型"
                              className="p-0.5 rounded hover:text-rose-400 hover:bg-slate-700/50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

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
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90 shrink-0">
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
