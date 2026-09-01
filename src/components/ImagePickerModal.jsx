import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Check,
  Layers,
  Maximize2,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { CURATED_CATEGORIES, PRESET_STOCK_IMAGES, searchStockImages } from '../lib/stockImages.js';
import { ShimmerButton } from './ui/ShimmerButton.jsx';

const HOT_KEYWORDS = ['AI科技', '职场商业', '团队协作', '深度思考', '创意灵感', '极简生活', '浩瀚宇宙', '代码编程'];

export function ImagePickerModal({ isOpen, onClose, onInsertImage }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState(PRESET_STOCK_IMAGES);
  const [loading, setLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [insertMode, setInsertMode] = useState('standard'); // 'standard' | 'card' | 'cover'
  const [customCaption, setCustomCaption] = useState('');

  // 加载与搜索
  useEffect(() => {
    if (!isOpen) return;
    let cancel = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchStockImages(searchQuery, activeCategory);
        if (!cancel) {
          setImages(results);
          if (results.length > 0 && !selectedImg) {
            setSelectedImg(results[0]);
            setCustomCaption(results[0].title);
          }
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }, 200);

    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [isOpen, searchQuery, activeCategory]);

  if (!isOpen) return null;

  const handleSelect = (img) => {
    setSelectedImg(img);
    setCustomCaption(img.title);
  };

  const handleConfirmInsert = () => {
    if (!selectedImg) return;
    onInsertImage({
      url: selectedImg.url,
      title: customCaption || selectedImg.title,
      author: selectedImg.author,
      source: selectedImg.source,
      mode: insertMode,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">免费无版权商用图库</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> CC0 / Unsplash 商用无忧
                </span>
              </div>
              <p className="text-xs text-slate-400">一键搜索并插入高质量配图到文章或公众号排版中</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Hot Tags */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 shrink-0 space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入中英文关键词搜索（如：科技、职场、AI、咖啡、星空、认知成长）..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  清空
                </button>
              )}
            </div>

            {/* Category Select Pills */}
            <div className="hidden md:flex items-center gap-1 overflow-x-auto py-1">
              {CURATED_CATEGORIES.slice(0, 5).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Hot Keyword Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-500 text-[11px] flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3 text-emerald-400" /> 推荐热词:
            </span>
            {HOT_KEYWORDS.map((kw) => (
              <button
                key={kw}
                onClick={() => setSearchQuery(kw)}
                className="px-2 py-0.5 rounded-md bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-700/50 transition-colors"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Left Gallery + Right Insert Config */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Gallery Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs gap-3">
                <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>正在检索高清无版权图库...</span>
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs gap-2">
                <ImageIcon className="w-10 h-10 text-slate-600" />
                <span>未找到相关配图，换个关键词试试？</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {images.map((img) => {
                  const isSelected = selectedImg?.id === img.id || selectedImg?.url === img.url;
                  return (
                    <div
                      key={img.id}
                      onClick={() => handleSelect(img)}
                      className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all bg-slate-950 ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="aspect-[16/10] overflow-hidden bg-slate-900">
                        <img
                          src={img.thumb || img.url}
                          alt={img.title}
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80';
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Selected Badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 p-1 rounded-full bg-emerald-500 text-white shadow-lg">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}

                      {/* Bottom Info Overlay */}
                      <div className="p-2 bg-slate-950/90 border-t border-slate-800/80">
                        <p className="text-xs font-medium text-slate-200 line-clamp-1 group-hover:text-emerald-300">
                          {img.title}
                        </p>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          摄影/作者: {img.author}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Preview & Insertion Settings */}
          {selectedImg && (
            <div className="w-80 border-l border-slate-800 bg-slate-950/60 p-5 flex flex-col justify-between overflow-y-auto shrink-0">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" /> 配图插入选项
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    可商用
                  </span>
                </div>

                {/* Big Preview */}
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img
                    src={selectedImg.url}
                    alt={selectedImg.title}
                    className="w-full aspect-[16/10] object-cover"
                  />
                  <div className="p-2.5 text-[11px] text-slate-400 space-y-0.5 bg-slate-900/60">
                    <div className="font-semibold text-slate-200 line-clamp-1">{selectedImg.title}</div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>来源: {selectedImg.source}</span>
                      <a
                        href={selectedImg.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-0.5"
                      >
                        原图 <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Insertion Mode */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">排版呈现样式</label>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setInsertMode('standard')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        insertMode === 'standard'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>🖼️ 标准正文配图</span>
                        {insertMode === 'standard' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">自适应居中，适合各段落之间配图</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInsertMode('card')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        insertMode === 'card'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>📇 微信带图注卡片</span>
                        {insertMode === 'card' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">底部居中显示文字注释与微小说明</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInsertMode('cover')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        insertMode === 'cover'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>🌟 全宽首图 / 封面卡</span>
                        {insertMode === 'cover' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">全宽圆角顶部横幅，极具视觉冲击</p>
                    </button>
                  </div>
                </div>

                {/* Caption Input */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">配图说明 / 标题</label>
                  <input
                    type="text"
                    value={customCaption}
                    onChange={(e) => setCustomCaption(e.target.value)}
                    placeholder="输入配图文字说明..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  取消
                </button>
                <ShimmerButton onClick={handleConfirmInsert} size="small" className="flex-1">
                  确认插入
                </ShimmerButton>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
