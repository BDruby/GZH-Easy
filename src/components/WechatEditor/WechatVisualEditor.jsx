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
  Trash2,
  Wand2,
  Upload,
  FolderHeart,
  X,
  Plus,
  Loader2,
} from 'lucide-react';
import { WECHAT_THEMES, formatToWechatHtml } from '../../lib/wechatFormatter.js';
import { ImagePickerModal } from '../ImagePickerModal.jsx';
import { ShimmerButton } from '../ui/ShimmerButton.jsx';

const SAMPLE_ARTICLE_MD = `# 深度复盘：打破自嗨认知，构建高转化爆款工作流

:::lead 本文核心要点：从底层逻辑解构爆款传播机制，深度拆解「选题预判、结构情绪流、内联交互赋能」三位一体实操框架。:::

## 一、为什么大多数人的努力只是「低水平重复」？

很多人在创作时常陷入误区：以为疯狂日更就能换来关注，却忽视了最关键的「价值交付密度」。

:::goldquote 认知是一切商业与个人成长的底层操作系统。环境不会因抱怨而改变，但认知能让你在迷雾中看清破局路径。:::

:::vs ❌ 常见踩坑：自嗨式输出，排版密密麻麻，读者3秒滑走 | ✔️ 高效破局：用黄金钩子抓住痛点，适度留白，打造视觉层次:::

---

## 二、爆款核心方法论：黑科技交互赋能

在当下信息爆炸时代，读者在屏幕前的注意力极其稀缺。善用微信公众号原生支持的交互 SVG 模版，能瞬间将读者从「被动阅读」转为「主动探索」：

:::svg-morph 👉 点击此处，揭秘关键底层认知！ | 🎉 恭喜揭秘：真正的认知跃迁，不是积累更多信息，而是升级底层思考模型！:::

:::svg-charge 按住蓄力 · 充能解开终极破局锦囊 | ⚡ 蓄力满格！核心底牌：打破固有认知路径，先完成再完美，以极速敏捷建立竞争优势！:::

:::svg-unfold 📜 点击展开完整长卷与详细实操大纲 | 这里是展开后展现的完整知识图谱：\n1. 核心定位：垂直打穿细分圈层\n2. 结构打磨：开头设钩子，中段造反差，结尾促分享\n3. 视觉赋能：善用内联交互组件建立专业审美认同。:::

:::svg-scroll 亮点一：底层逻辑::从第一性原理拆解核心变量 || 亮点二：敏捷落地::最小可行性模型快速验证 || 亮点三：持续复利::打造属于你的闭环资产:::

---

## 三、真实问答与发展演进

:::qa 读者提问：请问内容创作新手，最容易踩的坑是什么？ | 主理人回答：最容易踩的坑是「自嗨式写作」——沉迷于自己觉得很厉害的内容，却忽略了读者真正关心的痛点与情绪共鸣。:::

:::timeline 2024 · 探索破局 | 启动多平台内容试验，摸索爆款底层规律；2025 · 爆发增长 | 形成标准化创作工作流，产出多篇 10W+ 行业深度爆款；2026 · 体系闭环 | 打造专业排版与智作一体化工具矩阵:::

:::stats 1000W+ · 全网阅读曝光 | 98.5% · 深度完读认可率 | 300+ · 体系化实操干货拆解:::

:::highlight 记住：单篇爆款靠运气，持续高质量产出靠的是标准化排版与思考系统。:::

---

:::author 爆款工坊主理人 | 专注深度思考、技术前沿与实战认知复盘。关注我们，一起持续进化。:::

:::interact 如果本文对你有启发，欢迎点击下方「点赞、在看、转发」三连支持，你的每一次鼓励都是我们持续输出的最大动力！:::

:::follow 爆款内容工坊 | 每周为你深度拆解一手商业认知、AI前沿应用与爆款创作实战。关注我们，一起向上生长。:::
`;

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
    category: 'structure',
    name: '对比票据卡',
    tag: ':::card',
    desc: '带票据边框的案例剖析与深度拆解',
    icon: '🧾',
    template: '\n:::card 案例对照：传统思维就事论事 VS 爆款逻辑直击痛点并给出闭环方案:::\n',
  },
  // ================= 微信黑科技 SVG 交互模版 =================
  {
    id: 'svg-morph',
    category: 'svg',
    name: '点击变身卡片 (SVG)',
    tag: ':::svg-morph',
    desc: '轻触卡片瞬间淡出封面露出揭秘真相',
    icon: '🪄',
    template: '\n:::svg-morph 👉 点击此处，揭秘关键底层认知！ | 🎉 恭喜揭秘：真正的认知跃迁，不是积累更多信息，而是升级底层思考模型！:::\n',
  },
  {
    id: 'svg-charge',
    category: 'svg',
    name: '长按蓄力卡片 (SVG)',
    tag: ':::svg-charge',
    desc: '读者按住卡片动态蓄满能量条触发彩蛋',
    icon: '🔋',
    template: '\n:::svg-charge 按住蓄力 · 充能解开终极破局锦囊 | ⚡ 蓄力满格！核心底牌：打破固有认知路径，先完成再完美，以极速敏捷建立竞争优势！:::\n',
  },
  {
    id: 'svg-unfold',
    category: 'svg',
    name: '折叠画卷展开 (SVG)',
    tag: ':::svg-unfold',
    desc: '默认收起高度，点击向下平滑延伸长图文',
    icon: '📜',
    template: '\n:::svg-unfold 📜 点击展开完整长卷与详细实操大纲 | 这里是展开后展现的完整知识图谱：\n1. 核心定位：垂直打穿细分圈层\n2. 结构打磨：开头设钩子，中段造反差，结尾促分享\n3. 视觉赋能：善用内联交互组件建立专业审美认同。:::\n',
  },
  {
    id: 'svg-scroll',
    category: 'svg',
    name: '横向滑动相册 (SVG)',
    tag: ':::svg-scroll',
    desc: '手机端手指左右横向自由滑动手势走马灯',
    icon: '🎠',
    template: '\n:::svg-scroll 亮点一：底层逻辑::从第一性原理拆解核心变量 || 亮点二：敏捷落地::最小可行性模型快速验证 || 亮点三：持续复利::打造属于你的闭环资产:::\n',
  },
  // ================= 全网高好评排版组件 =================
  {
    id: 'goldquote',
    category: 'quote',
    name: '黑金极客金句卡',
    tag: ':::goldquote',
    desc: '深邃暗黑磨砂底色 + 发光金边与金色大引号',
    icon: '👑',
    template: '\n:::goldquote 认知是一切商业与个人成长的底层操作系统。环境不会因抱怨而改变，但认知能让你在迷雾中看清破局路径。:::\n',
  },
  {
    id: 'qa',
    category: 'structure',
    name: '微信真实对话气泡',
    tag: ':::qa',
    desc: '左侧提问气泡 + 右侧主理人解答气泡',
    icon: '💬',
    template: '\n:::qa 读者提问：请问内容创作新手，最容易踩的坑是什么？ | 主理人回答：最容易踩的坑是「自嗨式写作」——沉迷于自己觉得很厉害的内容，却忽略了读者真正关心的痛点与情绪共鸣。:::\n',
  },
  {
    id: 'timeline',
    category: 'structure',
    name: '发光时间线节点',
    tag: ':::timeline',
    desc: '竖向发光时间轴，适合历程演进与里程碑',
    icon: '⏳',
    template: '\n:::timeline 2024 · 探索破局 | 启动多平台内容试验，摸索爆款底层规律；2025 · 爆发增长 | 形成标准化创作工作流，产出多篇 10W+ 行业深度爆款；2026 · 体系闭环 | 打造专业排版与智作一体化工具矩阵:::\n',
  },
  {
    id: 'vs',
    category: 'structure',
    name: '红绿避坑VS对照卡',
    tag: ':::vs',
    desc: '左栏红底避坑踩雷 VS 右栏绿底破局高招',
    icon: '⚖️',
    template: '\n:::vs ❌ 常见避坑误区：盲目追逐热点日更，段落冗长密实，读者阅读压迫感强 | ✔️ 高效破局解法：聚焦垂直痛点深度打透，留白适度，善用组件抓眼球:::\n',
  },
  {
    id: 'follow',
    category: 'closing',
    name: '文末呼吸引流卡',
    tag: ':::follow',
    desc: '微动呼吸光晕、居中头像、品牌寄语与关注引导',
    icon: '🌟',
    template: '\n:::follow 爆款内容工坊 | 每周为你深度拆解一手商业认知、AI前沿应用与爆款创作实战。关注我们，一起向上生长。:::\n',
  },
  {
    id: 'interact',
    category: 'closing',
    name: '文末点赞三连卡',
    tag: ':::interact',
    desc: '引导点赞、在看、分享朋友圈的精致仪式感卡片',
    icon: '🎉',
    template: '\n:::interact 如果本文对你有启发，欢迎点击下方「点赞、在看、转发」三连支持，你的每一次鼓励都是我们持续输出的最大动力！:::\n',
  },
  {
    id: 'highlight',
    category: 'quote',
    name: '马克笔荧光划线',
    tag: ':::highlight',
    desc: '模拟手绘黄色荧光马克笔高亮涂抹重点',
    icon: '🖍️',
    template: '\n:::highlight 这一段是全文最核心的破局解法，请务必反复琢磨并落实在实操中。:::\n',
  },
  {
    id: 'stats',
    category: 'structure',
    name: '多维数据大屏卡',
    tag: ':::stats',
    desc: '多组大号数字与指标并列对比',
    icon: '📈',
    template: '\n:::stats 1000W+ · 全网阅读曝光 | 98.5% · 深度完读认可率 | 300+ · 体系化实操干货拆解:::\n',
  },
];

const COMPONENT_CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'svg', label: '🚀 黑科技SVG' },
  { id: 'quote', label: '📐 金句高光' },
  { id: 'structure', label: '📱 结构对话' },
  { id: 'closing', label: '🎯 文末引流' },
];

export function WechatVisualEditor({
  articleMd,
  articleTitle,
  onUpdateMd,
  onShowToast,
  isStandaloneMode = false,
}) {
  const [themeId, setThemeId] = useState('moyu-green');
  const [customPrimaryColor, setCustomPrimaryColor] = useState('');
  const [fontSize, setFontSize] = useState(15);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [viewMode, setViewMode] = useState('dual'); // 'dual' | 'editor' | 'preview'
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isComponentsDropdownOpen, setIsComponentsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copyStatus, setCopyStatus] = useState('');

  // 图片暂存池状态
  const [stagedImages, setStagedImages] = useState(() => {
    try {
      const saved = localStorage.getItem('gzh_staged_images');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isStagedDrawerOpen, setIsStagedDrawerOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const textareaRef = useRef(null);
  const componentsDropdownRef = useRef(null);
  const stagedDrawerRef = useRef(null);
  const fileInputRef = useRef(null);

  // 本地持久化图片暂存记录
  useEffect(() => {
    try {
      localStorage.setItem('gzh_staged_images', JSON.stringify(stagedImages));
    } catch {}
  }, [stagedImages]);

  // 点击组件下拉菜单或暂存抽屉外部自动收起
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (componentsDropdownRef.current && !componentsDropdownRef.current.contains(e.target)) {
        setIsComponentsDropdownOpen(false);
      }
      if (stagedDrawerRef.current && !stagedDrawerRef.current.contains(e.target)) {
        setIsStagedDrawerOpen(false);
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

  // 通用图片上传与暂存处理（支持剪贴板图片和本地选择文件）
  const processUploadImageFile = async (file, customName) => {
    if (!file) return;
    setIsUploadingImage(true);
    onShowToast?.('⏳ 正在暂存图片并上传至免防盗链公网图床...', 8000);

    // 在光标处插入占位标记
    const placeholder = `\n\n![⏳ 正在暂存图片...](${Date.now()})\n\n`;
    insertTextAtCursor('', '', placeholder);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: base64,
          filename: customName || file.name || `paste_${Date.now()}.png`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `上传服务响应错误 (${res.status})`);
      }

      const result = await res.json();
      const finalUrl = result.url || result.localUrl;
      const imgTitle = (customName || file.name || '配图').replace(/\.[^/.]+$/, '');
      const finalMd = `\n\n![${imgTitle}](${finalUrl})\n\n`;

      // 平滑替换占位符
      const currentVal = textareaRef.current?.value || articleMd || '';
      const updatedVal = currentVal.replace(placeholder.trim(), finalMd.trim());
      onUpdateMd(updatedVal);

      // 加入图片暂存池
      const newStaged = {
        id: `staged_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        url: finalUrl,
        localUrl: result.localUrl,
        filename: imgTitle,
        size: file.size || result.size,
        uploadedAt: Date.now(),
      };
      setStagedImages((prev) => [newStaged, ...prev]);

      onShowToast?.('🎉 剪贴板图片暂存成功！已转为免防盗链公网图，复制到公众号后台绝不裂开！');
    } catch (err) {
      const currentVal = textareaRef.current?.value || articleMd || '';
      const failMd = `\n\n> ⚠️ 图片暂存失败: ${err.message}\n\n`;
      onUpdateMd(currentVal.replace(placeholder.trim(), failMd.trim()));
      onShowToast?.(`图片上传失败: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 监听剪贴板粘贴事件（截屏直接 Cmd/Ctrl + V）
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await processUploadImageFile(file, `截图_${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`);
          return;
        }
      }
    }
  };

  // 批量选择本地图片上传暂存
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      await processUploadImageFile(file);
    }
    e.target.value = '';
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
      setCopyStatus('✅ 已成功复制富文本！配图支持微信云端自动转存，去微信公众号后台 Cmd/Ctrl + V 粘贴即可');
      onShowToast?.('🎉 微信富文本复制成功！配图支持微信云端自动转存，直接在公众号后台粘贴生效！');
    } catch {
      // 降级复制
      const ta = document.createElement('textarea');
      ta.value = wechatHtml;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
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
              title="微信公众号专业排版增强组件库与黑科技 SVG"
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
              <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl p-2.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 border-b border-slate-800/80 flex items-center justify-between pb-2">
                  <span className="flex items-center gap-1.5 text-slate-200">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    微信专用内联排版组件库
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    共 {WECHAT_COMPONENTS.length} 套精选模版
                  </span>
                </div>

                {/* 分类切换 Pills */}
                <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-xl my-2 border border-slate-800/60 overflow-x-auto">
                  {COMPONENT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] whitespace-nowrap transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-emerald-500 text-white font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* 组件列表 */}
                <div className="max-h-80 overflow-y-auto py-1 space-y-1 pr-1 custom-scrollbar">
                  {WECHAT_COMPONENTS.filter(
                    (item) => selectedCategory === 'all' || item.category === selectedCategory
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        insertTextAtCursor(item.template);
                        setIsComponentsDropdownOpen(false);
                        onShowToast?.(`已插入「${item.name}」组件`);
                      }}
                      className="w-full text-left p-2 rounded-xl text-xs hover:bg-slate-800/80 transition-all group flex items-start gap-2.5 border border-transparent hover:border-slate-700/60"
                    >
                      <span className="text-base p-1.5 rounded-lg bg-slate-800/60 group-hover:scale-110 transition-transform shrink-0">
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

          {/* 隐藏的本地图片选择器 */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            multiple
            className="hidden"
          />

          {/* 图片暂存池抽屉触发器 */}
          <div className="relative" ref={stagedDrawerRef}>
            <button
              type="button"
              onClick={() => setIsStagedDrawerOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-sm ${
                stagedImages.length > 0
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
              title="查看与管理剪贴板粘贴或本地上传的暂存配图"
            >
              <FolderHeart className="w-3.5 h-3.5 text-emerald-400" />
              <span>图片暂存池</span>
              {stagedImages.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                  {stagedImages.length}
                </span>
              )}
            </button>

            {/* 图片暂存池下拉抽屉 */}
            {isStagedDrawerOpen && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl p-3 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <FolderHeart className="w-4 h-4 text-emerald-400" />
                    <span>剪贴板图片暂存池</span>
                    <span className="text-[10px] text-slate-400 font-normal">({stagedImages.length} 张)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                      title="从电脑挑选本地图片上传存入暂存池"
                    >
                      <Plus className="w-3 h-3" /> 本地配图
                    </button>
                    {stagedImages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('确定要清空图片暂存池记录吗？')) {
                            setStagedImages([]);
                            onShowToast?.('图片暂存池已清空');
                          }
                        }}
                        className="text-[11px] text-slate-500 hover:text-rose-400"
                        title="清空暂存记录"
                      >
                        清空
                      </button>
                    )}
                  </div>
                </div>

                {/* 图片列表 */}
                <div className="max-h-72 overflow-y-auto py-2 space-y-2 pr-1 custom-scrollbar">
                  {stagedImages.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                      <ImageIcon className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
                      <p>暂无暂存配图</p>
                      <p className="text-[11px] text-slate-600">
                        💡 在编辑区按 <strong className="text-slate-400">Cmd/Ctrl + V</strong> 可直接粘贴截图，或点击右上角「+ 本地配图」
                      </p>
                    </div>
                  ) : (
                    stagedImages.map((img) => (
                      <div
                        key={img.id}
                        className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex items-center gap-3 group"
                      >
                        <img
                          src={img.url}
                          alt={img.filename}
                          className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                          onError={(e) => {
                            if (img.localUrl && e.target.src !== img.localUrl) {
                              e.target.src = img.localUrl;
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{img.filename}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {img.size ? `${(img.size / 1024).toFixed(1)} KB · ` : ''}
                            {new Date(img.uploadedAt).toLocaleTimeString('zh-CN', { hour12: false })}
                          </p>
                          <div className="flex items-center gap-2.5 mt-1.5 text-[11px]">
                            <button
                              type="button"
                              onClick={() => {
                                insertTextAtCursor(`\n\n![${img.filename}](${img.url})\n\n`);
                                onShowToast?.(`已将「${img.filename}」插入文章`);
                                setIsStagedDrawerOpen(false);
                              }}
                              className="text-emerald-400 hover:text-emerald-300 font-medium"
                            >
                              + 插入文章
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(img.url);
                                onShowToast?.('图片公网直链已复制到剪贴板！');
                              }}
                              className="text-slate-400 hover:text-slate-200"
                            >
                              复制直链
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setStagedImages((prev) => prev.filter((item) => item.id !== img.id));
                                onShowToast?.('已移除该暂存图片');
                              }}
                              className="text-slate-500 hover:text-rose-400 ml-auto"
                              title="移除记录"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>支持一键粘贴到微信公众号，图片自动转存不裂开</span>
                </div>
              </div>
            )}
          </div>

          <div className="w-[1px] h-4 bg-slate-800 mx-1" />

          {/* Copyright-free image picker trigger */}
          <button
            onClick={() => setIsImagePickerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition-all font-medium"
            title="挑选免费可商用无版权高清图"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>无版权图库</span>
          </button>

          {/* 载入爆款示例排版范文 */}
          <button
            type="button"
            onClick={() => {
              if (articleMd && !window.confirm('载入范文将替换当前编辑区的内容，确定继续吗？')) return;
              onUpdateMd(SAMPLE_ARTICLE_MD);
              onShowToast?.('✨ 已成功载入爆款交互排版范文！可在右侧预览完整黑科技效果');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-800 transition-all font-medium"
            title="一键加载包含 SVG 变身、蓄力、折叠与金句组件的排版范文"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">排版范文</span>
          </button>

          {/* 清空编辑器 */}
          {articleMd && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('确定要清空编辑区内容吗？')) {
                  onUpdateMd('');
                  onShowToast?.('编辑器内容已清空');
                }
              }}
              className="p-1.5 rounded-lg hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-900/40 transition-colors"
              title="清空编辑器"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
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
          <div className={`${viewMode === 'dual' ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col ${isStandaloneMode ? 'h-[780px]' : 'h-[700px]'} rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl transition-all relative`}>
            
            {/* 上传进度浮层提示 */}
            {isUploadingImage && (
              <div className="absolute top-10 inset-x-0 z-20 px-4 py-2 bg-emerald-950/90 border-y border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between backdrop-blur-md animate-in fade-in duration-200">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  正在暂存剪贴板图片并上传至免防盗链公网图床...
                </span>
                <span className="text-[10px] text-emerald-400">微信免裂通道已接入</span>
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/60 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-mono text-slate-300">
                <FileCode className="w-3.5 h-3.5 text-emerald-400" /> Markdown 实时源码编辑
                <span className="text-[10px] text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded ml-1 border border-emerald-500/20">
                  支持 Cmd+V 粘贴截图
                </span>
              </span>
              <span className="text-[11px] text-slate-500">
                {articleMd ? `已输入 ${articleMd.length} 字符` : '支持 Markdown 语法与实时排版'}
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={articleMd}
              onChange={(e) => onUpdateMd(e.target.value)}
              onPaste={handlePaste}
              placeholder="在此输入或粘贴文章 Markdown 内容，支持截屏直接 Cmd/Ctrl + V 粘贴图片，右侧将自动转化为精美微信内联排版..."
              className="flex-1 w-full p-4 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-emerald-500 selection:text-white"
            />
          </div>
        )}

        {/* Right: WeChat Phone Mockup (677px standard) */}
        {(viewMode === 'dual' || viewMode === 'preview') && (
          <div className={`${viewMode === 'dual' ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col ${isStandaloneMode ? 'h-[780px]' : 'h-[700px]'} rounded-3xl border border-slate-800 bg-[#f7f7f7] overflow-hidden shadow-2xl transition-all`}>
            
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
