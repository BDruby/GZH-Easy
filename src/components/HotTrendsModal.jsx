import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Flame,
  Search,
  Sparkles,
  RefreshCw,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Loader2,
  CheckCircle2,
  BrainCircuit,
  Compass,
  Lightbulb,
  Target,
  ArrowRight,
} from 'lucide-react';
import { ShimmerButton } from './ui/ShimmerButton.jsx';
import { cn } from '../lib/utils.js';

const SOURCES = [
  { id: 'all', name: '🌟 全网综合', badgeColor: 'from-amber-500/20 to-rose-500/20 text-amber-300 border-amber-500/30' },
  { id: 'zhihu', name: '💡 知乎深度', badgeColor: 'from-blue-500/20 to-sky-500/20 text-blue-300 border-blue-500/30' },
  { id: 'toutiao', name: '🔥 今日头条', badgeColor: 'from-red-500/20 to-orange-500/20 text-red-300 border-red-500/30' },
  { id: 'bilibili', name: '⚡ B站潮流', badgeColor: 'from-pink-500/20 to-rose-500/20 text-pink-300 border-pink-500/30' },
  { id: 'baidu', name: '🔍 百度热搜', badgeColor: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30' },
];

export function HotTrendsModal({ isOpen, onClose, onSelectTopic, apiConfig = {} }) {
  const [activeSource, setActiveSource] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // 拆解状态：{ [trendId]: { loading: boolean, data: object, error: string } }
  const [deconstructMap, setDeconstructMap] = useState({});
  // 展开状态：Set<trendId>
  const [expandedIds, setExpandedIds] = useState(new Set());

  // 拉取热榜数据
  const fetchTrends = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const url = `/api/trends?source=${activeSource}${isRefresh ? '&refresh=true' : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.ok && Array.isArray(json.list)) {
        setTrends(json.list);
      } else {
        setError(json.error || '获取热点数据失败');
      }
    } catch (err) {
      setError(`请求失败: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTrends(false);
    }
  }, [isOpen, activeSource]);

  // 本地过滤搜索
  const filteredTrends = useMemo(() => {
    if (!searchKeyword.trim()) return trends;
    const q = searchKeyword.trim().toLowerCase();
    return trends.filter(
      item => (item.title && item.title.toLowerCase().includes(q)) ||
              (item.desc && item.desc.toLowerCase().includes(q))
    );
  }, [trends, searchKeyword]);

  // 切换折叠
  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 智能逆向拆解
  const handleDeconstruct = async (e, trend) => {
    e.stopPropagation();
    const trendId = trend.id;

    // 如果已经拆解成功过，直接展开/收起
    if (deconstructMap[trendId]?.data) {
      toggleExpand(trendId);
      return;
    }

    setExpandedIds(prev => new Set(prev).add(trendId));
    setDeconstructMap(prev => ({
      ...prev,
      [trendId]: { loading: true, data: null, error: null }
    }));

    try {
      const res = await fetch('/api/trends/deconstruct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trend,
          apiKey: apiConfig.apiKey,
          model: apiConfig.model,
          baseUrl: apiConfig.baseUrl
        })
      });
      const json = await res.json();
      if (json.ok && json.result) {
        setDeconstructMap(prev => ({
          ...prev,
          [trendId]: { loading: false, data: json.result, error: null }
        }));
      } else {
        setDeconstructMap(prev => ({
          ...prev,
          [trendId]: { loading: false, data: null, error: json.error || '拆解失败' }
        }));
      }
    } catch (err) {
      setDeconstructMap(prev => ({
        ...prev,
        [trendId]: { loading: false, data: null, error: err.message }
      }));
    }
  };

  // 一键直接选用热点原标题
  const handleDirectSelect = (trend) => {
    const extraMaterial = `【全网热点背景】：\n来源：${trend.sourceName}（${trend.hotText}）\n核心摘要：${trend.desc || trend.title}\n原始话题：${trend.title}`;
    onSelectTopic(trend.title, extraMaterial);
    onClose();
  };

  // 选用 AI 拆解出的精选爆款视角
  const handleSelectAngle = (trend, angle) => {
    const refinedTitle = angle.recommendedTitle || trend.title;
    const extraMaterial = `【爆款切入视角】：${angle.angleName}\n【痛点情绪钩子】：${angle.hook}\n【推荐思考骨架】：\n${(angle.outlineBrief || []).map((b, i) => `${i + 1}. ${b}`).join('\n')}\n\n【原始热点背景】：\n${trend.title}\n${trend.desc || ''}`;

    onSelectTopic(refinedTitle, extraMaterial);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl h-[88vh] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-amber-500/40 flex items-center justify-center shadow-inner">
              <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">全网爆款热点雷达 · 选题复刻库</h3>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-full">
                  实时聚合
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                实时追踪知乎、头条、B站、百度全民爆款话题，一键智能拆解情绪密码与高维切入视角
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTrends(true)}
              disabled={loading || refreshing}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition-all disabled:opacity-50"
              title="强制刷新热点"
            >
              <RefreshCw className={cn('w-4 h-4', (loading || refreshing) && 'animate-spin text-amber-400')} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 分类标签与搜索过滤栏 */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          {/* 来源切换 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {SOURCES.map(source => {
              const isActive = activeSource === source.id;
              return (
                <button
                  key={source.id}
                  onClick={() => setActiveSource(source.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border',
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm font-semibold'
                      : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
                  )}
                >
                  <span>{source.name}</span>
                </button>
              );
            })}
          </div>

          {/* 搜索框 */}
          <div className="relative min-w-[220px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              placeholder="搜索热门话题或关键词..."
              className="w-full pl-8 pr-8 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-colors"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 内容列表区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-xs font-medium text-slate-400">正在实时抓取各平台全网热榜...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl my-8">
              <p className="text-sm">{error}</p>
              <button
                onClick={() => fetchTrends(true)}
                className="mt-3 px-4 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs rounded-lg transition-colors"
              >
                重试加载
              </button>
            </div>
          ) : filteredTrends.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <TrendingUp className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <p className="text-sm">暂未找到与 "{searchKeyword}" 相关的热门话题</p>
            </div>
          ) : (
            filteredTrends.map((trend, index) => {
              const isExpanded = expandedIds.has(trend.id);
              const deconstructState = deconstructMap[trend.id];
              const rank = index + 1;

              // 排名颜色与图标
              let rankBadge = (
                <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center">
                  {rank}
                </span>
              );
              if (rank === 1) {
                rankBadge = (
                  <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold text-xs flex items-center justify-center shadow-sm">
                    1
                  </span>
                );
              } else if (rank === 2) {
                rankBadge = (
                  <span className="w-6 h-6 rounded-md bg-slate-300/20 text-slate-300 border border-slate-300/40 font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                );
              } else if (rank === 3) {
                rankBadge = (
                  <span className="w-6 h-6 rounded-md bg-amber-700/20 text-amber-500 border border-amber-700/40 font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                );
              }

              return (
                <div
                  key={trend.id}
                  className={cn(
                    'group bg-slate-800/40 hover:bg-slate-800/80 border rounded-xl p-4 transition-all duration-200',
                    isExpanded ? 'border-blue-500/40 bg-slate-800/70 shadow-lg' : 'border-slate-800 hover:border-slate-700'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* 左侧主要信息 */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="pt-0.5 shrink-0">{rankBadge}</div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[11px] font-semibold border',
                              trend.source === 'zhihu' && 'bg-blue-500/15 border-blue-500/30 text-blue-300',
                              trend.source === 'toutiao' && 'bg-red-500/15 border-red-500/30 text-red-300',
                              trend.source === 'bilibili' && 'bg-pink-500/15 border-pink-500/30 text-pink-300',
                              trend.source === 'baidu' && 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                            )}
                          >
                            {trend.sourceName}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                            <Flame className="w-3 h-3" />
                            {trend.hotText}
                          </span>
                          {trend.url && (
                            <a
                              href={trend.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-0.5 text-[11px]"
                              title="查看原讨论网页"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        <h4 className="text-sm font-semibold text-slate-100 group-hover:text-white leading-snug">
                          {trend.title}
                        </h4>

                        {trend.desc && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {trend.desc}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 右侧动作按钮 */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0 pt-0.5">
                      <button
                        onClick={(e) => handleDeconstruct(e, trend)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all',
                          isExpanded
                            ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                            : 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                        )}
                      >
                        <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                        <span>{isExpanded ? '收起拆解' : '🧠 智能拆解'}</span>
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={() => handleDirectSelect(trend)}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Compass className="w-3.5 h-3.5 text-blue-400" />
                        <span>一键复刻</span>
                      </button>
                    </div>
                  </div>

                  {/* 展开的 AI 爆款拆解结果 */}
                  {isExpanded && (
                    <div className="mt-4 pt-3.5 border-t border-slate-700/60 space-y-3 animate-in fade-in duration-200">
                      {deconstructState?.loading ? (
                        <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                          <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                          <span>AI 正在深入剖析大众情绪密码并提炼公众号破局视角...</span>
                        </div>
                      ) : deconstructState?.error ? (
                        <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                          拆解出错: {deconstructState.error}
                        </div>
                      ) : deconstructState?.data ? (
                        <div className="space-y-3">
                          {/* 情绪密码与受众 */}
                          <div className="p-3 bg-purple-950/20 border border-purple-800/30 rounded-lg space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                              <span>爆款情绪密码分析：</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {deconstructState.data.emotionTrigger}
                            </p>
                            {deconstructState.data.audience && (
                              <p className="text-[11px] text-slate-400 pt-0.5">
                                <span className="text-slate-500">目标受众：</span>{deconstructState.data.audience}
                              </p>
                            )}
                          </div>

                          {/* 3 大破局切入视角 */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                              <span>推荐 3 大公众号爆款切入视角（点击选用）：</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                              {deconstructState.data.angles?.map((angle, aIdx) => (
                                <div
                                  key={aIdx}
                                  className="p-3 bg-slate-900/90 border border-slate-700/70 hover:border-blue-500/50 rounded-xl flex flex-col justify-between transition-all group/angle"
                                >
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 border border-blue-500/30 text-blue-300">
                                        {angle.angleName}
                                      </span>
                                    </div>

                                    <h5 className="text-xs font-bold text-slate-200 leading-snug group-hover/angle:text-blue-300 transition-colors">
                                      {angle.recommendedTitle}
                                    </h5>

                                    <p className="text-[11px] text-slate-400 leading-normal">
                                      <span className="text-slate-500">痛点切入：</span>{angle.hook}
                                    </p>

                                    {angle.outlineBrief && angle.outlineBrief.length > 0 && (
                                      <div className="pt-1 text-[11px] text-slate-400 space-y-0.5">
                                        {angle.outlineBrief.map((item, bIdx) => (
                                          <div key={bIdx} className="line-clamp-1 text-slate-400">
                                            • {item}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => handleSelectAngle(trend, angle)}
                                    className="mt-3 w-full py-1.5 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/50 hover:to-indigo-600/50 border border-blue-500/40 text-blue-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-sm"
                                  >
                                    <span>用此视角创作</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 底部状态提示 */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>实时热榜已就绪 · 支持知乎/头条/B站/百度毫秒级多源检索</span>
          </div>
          <span>点击「一键复刻」或「选用视角」即可启动公众号爆款创作流</span>
        </div>
      </div>
    </div>
  );
}
