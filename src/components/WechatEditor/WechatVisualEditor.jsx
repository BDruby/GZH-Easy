import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  Palette,
  Type,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Quote,
  List,
  ListOrdered,
  Code,
  Table as TableIcon,
  Minus,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Layers,
  FileCode,
  Download,
  ChevronDown,
} from 'lucide-react';
import { WECHAT_THEMES, formatToWechatHtml } from '../../lib/wechatFormatter.js';
import { ImagePickerModal } from '../ImagePickerModal.jsx';
import { ShimmerButton } from '../ui/ShimmerButton.jsx';

const FONT_SIZES = [
  { label: '小 (14px)', value: 14 },
  { label: '标准 (15px)', value: 15 },
  { label: '中大 (16px)', value: 16 },
  { label: '大号 (17px)', value: 17 },
];

const LINE_HEIGHTS = [
  { label: '紧凑 (1.6)', value: 1.6 },
  { label: '标准 (1.8)', value: 1.8 },
  { label: '舒适 (2.0)', value: 2.0 },
];

const PRESET_COLORS = [
  '#07c160', // 微信绿
  '#2563eb', // 科技蓝
  '#7c3aed', // 极光紫
  '#ea580c', // 活力橙
  '#e11d48', // 胭脂红
  '#0891b2', // 青蓝
  '#d97706', // 琥珀金
  '#18181b', // 极简黑
];

const WECHAT_COMPONENTS = [
  {
    id: 'lead',
    name: '导读引言卡',
    tag: ':::lead',
    desc: '提炼篇首核心要点与读者阅读指引',
    icon: '📌',
    template: '\n:::lead 本文核心要点：深度拆解最新趋势与实战落地方法论，为你带来一手深度干货。:::\n',
  },
  {
    id: 'quote',
    name: '精选居中金句',
    tag: ':::quote',
    desc: '大号居中显示核心认知爆点与主张',
    icon: '💡',
    template: '\n:::quote 真正的认知破局，不是掌握更多信息，而是升级底层思考框架。:::\n',
  },
  {
    id: 'step',
    name: '步骤流程徽章',
    tag: ':::step',
    desc: '防折行规范实操步骤标题 (STEP 01)',
    icon: '🔢',
    template: '\n:::step 01 | 核心落地流程与实操指南:::\n',
  },
  {
    id: 'author',
    name: '作者专属名片',
    tag: ':::author',
    desc: '文末品牌名片，头像/昵称/简介双栏永不错位',
    icon: '✍️',
    template: '\n:::author 爆款工坊主理人 | 专注深度思考、干货拆解与实战复盘。关注我们，一起向上破局。:::\n',
  },
  {
    id: 'tip',
    name: '核心要点提示',
    tag: ':::tip',
    desc: '温和绿底重点框，适合技巧与实用 Tips',
    icon: '🌿',
    template: '\n:::tip 实用技巧：在写作时善用对比与反差，能迅速抓住读者眼球并提高阅读完播率。:::\n',
  },
  {
    id: 'warning',
    name: '避坑警示注意',
    tag: ':::warning',
    desc: '醒目橙红边框，用于避坑指北与重点注意事项',
    icon: '⚠️',
    template: '\n:::warning 避坑提醒：注意段落排版留白，单段文字建议控制在3~4行以内，避免大段密实排版造成阅读压迫感。:::\n',
  },
  {
    id: 'metric',
    name: '核心指标大卡',
    tag: ':::metric',
    desc: '突出展示量化成果与震撼数据 (如 1000W+)',
    icon: '📊',
    template: '\n:::metric 1000万+ | 全网累计曝光与深度阅读量:::\n',
  },
  {
    id: 'card',
    name: '对比票据卡',
    tag: ':::card',
    desc: '带票据边框的案例剖析与深度拆解',
    icon: '🧾',
    template: '\n:::card 案例对照：传统思维就事论事 VS 爆款逻辑直击痛点并给出闭环方案:::\n',
  },
];

export function WechatVisualEditor({
  articleMd,
  articleTitle,
  onUpdateMd,
  onShowToast,
}) {
  const [themeId, setThemeId] = useState('moyu-green');
  const [customPrimaryColor, setCustomPrimaryColor] = useState('');
  const [fontSize, setFontSize] = useState(15);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [viewMode, setViewMode] = useState('dual'); // 'dual' | 'editor' | 'preview'
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isComponentsDropdownOpen, setIsComponentsDropdownOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  const textareaRef = useRef(null);
  const componentsDropdownRef = useRef(null);

  // 点击组件下拉菜单外部自动收起
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (componentsDropdownRef.current && !componentsDropdownRef.current.contains(e.target)) {
        setIsComponentsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeTheme = WECHAT_THEMES.find((t) => t.id === themeId) || WECHAT_THEMES[0];
  const primaryColor = customPrimaryColor || activeTheme.primaryColor;

  // 生成内联微信 HTML
  const wechatHtml = formatToWechatHtml(articleMd || '', {
    themeId,
    primaryColor,
    fontSize,
    lineHeight,
  });

  // 工具栏辅助插入
  const insertTextAtCursor = (prefix, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = articleMd || '';
    const selected = current.substring(start, end) || defaultText;

    const replacement = `${prefix}${selected}${suffix}`;
    const nextText = current.substring(0, start) + replacement + current.substring(end);

    onUpdateMd(nextText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  // 处理无版权图片插入
  const handleInsertImage = (img) => {
    if (!img?.url) return;
    let insertCode = '';
    if (img.mode === 'cover') {
      insertCode = `\n\n![${img.title || '封面图'}](${img.url})\n> 摄影/来源：${img.author || '无版权图库'}\n\n`;
    } else if (img.mode === 'card') {
      insertCode = `\n\n![${img.title}](${img.url})\n\n`;
    } else {
      insertCode = `\n\n![${img.title || '配图'}](${img.url})\n\n`;
    }
    insertTextAtCursor('', '', insertCode);
    onShowToast?.(`已成功插入商用无版权配图：${img.title || '高清配图'}`);
  };

  // 一键复制富文本到公众号
  const handleCopyWechatHtml = async () => {
    if (!wechatHtml) return onShowToast?.('暂无可复制的内容');

    try {
      // 写入富文本剪贴板
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([wechatHtml], { type: 'text/html' }),
          'text/plain': new Blob([extractPlainText(wechatHtml)], { type: 'text/plain' }),
        }),
      ]);
      setCopyStatus('✅ 已成功复制富文本！直接去微信公众号后台 Cmd/Ctrl + V 粘贴');
      onShowToast?.('🎉 微信富文本复制成功！直接去公众号粘贴即可');
    } catch {
      // 降级复制
      const ta = document.createElement('textarea');
      ta.value = wechatHtml;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      setCopyStatus('✅ 已复制 HTML 源码 (兼容模式)');
      onShowToast?.('HTML 已复制到剪贴板');
    }
  };

  const extractPlainText = (html) => {
    const el = document.createElement('div');
    el.innerHTML = html;
    return el.innerText || el.textContent || '';
  };

  // 导出 HTML 文件
  const handleExportHtml = () => {
    const blob = new Blob([wechatHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${articleTitle || '微信公众号爆款排版'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast?.('HTML 文件已导出');
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Themes, Color Picker, Font Size & View Mode */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        
        {/* Row 1: Themes & Custom Color */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">排版主题:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {WECHAT_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setThemeId(t.id);
                  setCustomPrimaryColor('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all border ${
                  themeId === t.id && !customPrimaryColor
                    ? 'bg-slate-800 text-white font-bold border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: t.primaryColor }}
                />
                <span>{t.name}</span>
              </button>
            ))}
          </div>

          {/* Color Palettes */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">主色:</span>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCustomPrimaryColor(c)}
                className={`w-5 h-5 rounded-full transition-transform border ${
                  primaryColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Row 2: Typography & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-4 flex-wrap">
            {/* Font Size */}
            <div className="flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">正文字号:</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
              >
                {FONT_SIZES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Line Height */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">行间距:</span>
              <select
                value={lineHeight}
                onChange={(e) => setLineHeight(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
              >
                {LINE_HEIGHTS.map((lh) => (
                  <option key={lh.value} value={lh.value}>{lh.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setViewMode('dual')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                viewMode === 'dual' ? 'bg-emerald-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              双栏对照
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                viewMode === 'editor' ? 'bg-emerald-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Markdown
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                viewMode === 'preview' ? 'bg-emerald-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              手机预览
            </button>
          </div>

        </div>

      </div>

      {/* Main Formatting Toolbar (Sticky below top navbar) */}
      <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/95 border border-slate-800/90 shadow-2xl backdrop-blur-xl text-xs transition-all">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Header 1, 2, 3 */}
          <button
            onClick={() => insertTextAtCursor('# ', '', '一级大标题')}
            title="一级大标题"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertTextAtCursor('## ', '', '二级章节标题')}
            title="二级章节标题"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertTextAtCursor('### ', '', '三级小标题')}
            title="三级小标题"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-800 mx-1" />

          {/* Bold, Italic, Quote */}
          <button
            onClick={() => insertTextAtCursor('**', '**', '重点文字')}
            title="加粗强调"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertTextAtCursor('*', '*', '斜体强调')}
            title="斜体强调"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertTextAtCursor('> ', '', '精选观点或引用卡片')}
            title="引用金句块"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Quote className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-800 mx-1" />

          {/* Lists, Code, Table, Divider */}
          <button
            onClick={() => insertTextAtCursor('- ', '', '清单列表项')}
            title="无序列表"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertTextAtCursor('1. ', '', '步骤列表项')}
            title="有序列表"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertTextAtCursor('```javascript\n// 请输入代码\n', '\n```')}
            title="代码块 (macOS终端风格)"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              insertTextAtCursor('\n| 核心指标 | 说明 | 效果 |\n|---|---|---|\n| 指标A | 重点内容 | 优秀 |\n| 指标B | 细节分析 | 良好 |\n')
            }
            title="插入表格"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertTextAtCursor('\n---\n')}
            title="分割线"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-800 mx-1" />

          {/* 排版组件库交互式下拉菜单 */}
          <div className="relative" ref={componentsDropdownRef}>
            <button
              type="button"
              onClick={() => setIsComponentsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all font-medium text-xs shadow-sm"
              title="微信公众号专业排版增强组件库"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>排版组件库</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isComponentsDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isComponentsDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    微信专用内联排版组件
                  </span>
                  <span className="text-[10px] text-slate-500">点击插入光标处</span>
                </div>

                <div className="max-h-80 overflow-y-auto py-1 space-y-1">
                  {WECHAT_COMPONENTS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        insertTextAtCursor(item.template);
                        setIsComponentsDropdownOpen(false);
                        onShowToast?.(`已插入「${item.name}」组件`);
                      }}
                      className="w-full text-left p-2 rounded-xl text-xs hover:bg-slate-800/80 transition-all group flex items-start gap-2.5"
                    >
                      <span className="text-base p-1 rounded-lg bg-slate-800/60 group-hover:scale-110 transition-transform shrink-0">
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-200 group-hover:text-emerald-300 flex items-center justify-between">
                          <span>{item.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">{item.tag}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-[1px] h-4 bg-slate-800 mx-1" />

          {/* Copyright-free image picker trigger */}
          <button
            onClick={() => setIsImagePickerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition-all font-medium"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>无版权图库</span>
          </button>
        </div>

        {/* Copy / Export Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportHtml}
            className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> 导出 HTML
          </button>

          <ShimmerButton onClick={handleCopyWechatHtml} size="small">
            <Copy className="w-3.5 h-3.5" />
            <span>一键复制到公众号</span>
          </ShimmerButton>
        </div>
      </div>

      {/* Copy Status Notification */}
      {copyStatus && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <span>{copyStatus}</span>
          <button
            onClick={() => setCopyStatus('')}
            className="text-emerald-400 hover:text-emerald-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Workspace: Dual View / Editor / Mobile Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left: Markdown Editor */}
        {(viewMode === 'dual' || viewMode === 'editor') && (
          <div className={`${viewMode === 'dual' ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col h-[700px] rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl`}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/60 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-mono text-slate-300">
                <FileCode className="w-3.5 h-3.5 text-emerald-400" /> Markdown 实时源码编辑
              </span>
              <span className="text-[11px] text-slate-500">
                {articleMd ? `已输入 ${articleMd.length} 字符` : '支持 Markdown 语法与实时排版'}
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={articleMd}
              onChange={(e) => onUpdateMd(e.target.value)}
              placeholder="在此输入或粘贴文章 Markdown 内容，右侧将自动转化为精美微信内联排版..."
              className="flex-1 w-full p-4 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-emerald-500 selection:text-white"
            />
          </div>
        )}

        {/* Right: WeChat Phone Mockup (677px standard) */}
        {(viewMode === 'dual' || viewMode === 'preview') && (
          <div className={`${viewMode === 'dual' ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col h-[700px] rounded-3xl border border-slate-800 bg-[#f7f7f7] overflow-hidden shadow-2xl`}>
            
            {/* iPhone Top Status Header */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 text-center text-xs font-mono text-slate-400 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-semibold">微信公众号标准预览 (677px)</span>
              </div>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                100% 微信内联格式
              </span>
            </div>

            {/* Simulated WeChat Article Header */}
            <div className="p-4 bg-white border-b border-slate-100 shrink-0">
              <h1 className="text-lg font-bold text-slate-900 leading-snug">
                {articleTitle || '爆款文章标题预览'}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                <span className="text-blue-600 font-medium cursor-pointer">公众号官方工坊</span>
                <span>•</span>
                <span>2026-09-01</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 text-[10px]">原创</span>
              </div>
            </div>

            {/* WeChat Formatted Article Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-white select-text">
              {articleMd ? (
                <div
                  className="wechat-preview-body"
                  dangerouslySetInnerHTML={{ __html: wechatHtml }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-3">
                  <Layers className="w-8 h-8 text-slate-300" />
                  <p>左侧输入 Markdown 或点击上方写作即可在此实时预览排版</p>
                </div>
              )}
            </div>

            {/* Bottom Footer Tip */}
            <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 text-[11px] text-slate-500 text-center flex items-center justify-center gap-2">
              <span>💡 排版已完全内联化，点击上方「一键复制到公众号」即可粘贴至微信编辑器</span>
            </div>

          </div>
        )}

      </div>

      {/* Free Copyright-Free Image Picker Modal */}
      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onInsertImage={handleInsertImage}
      />
    </div>
  );
}
