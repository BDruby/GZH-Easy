// 全网实时爆款热点聚合与公众号逆向拆解引擎
// 支持知乎深度热榜、今日头条社会榜、B站潮流科技榜、百度热搜等全网热点聚合与 5 分钟高可用缓存
import { chat, extractJson } from './deepseek.mjs';

// 内存缓存（TTL: 5 分钟）
const CACHE_TTL_MS = 5 * 60 * 1000;
const memoryCache = {
  all: { data: [], timestamp: 0 },
  zhihu: { data: [], timestamp: 0 },
  toutiao: { data: [], timestamp: 0 },
  bilibili: { data: [], timestamp: 0 },
  baidu: { data: [], timestamp: 0 },
};

// 常青兜底热点库（容灾保底，确保任何网络环境零空白）
const FALLBACK_TRENDS = [
  {
    id: 'fb-1',
    title: '为什么很多越努力、越自律的人，反而越来越穷？',
    desc: '深度探讨“低水平勤奋陷阱”与认知断层，剖析大多数职场人为何陷入无效忙碌与自嗨式努力。',
    hotText: '986 万热度',
    hotValue: 9860000,
    source: 'zhihu',
    sourceName: '知乎热榜',
    category: 'cognitive',
    categoryName: '认知与职场',
    url: 'https://www.zhihu.com'
  },
  {
    id: 'fb-2',
    title: '大厂全员降本增效背景下，普通人如何构建个人最小可行副业？',
    desc: '拆解一人公司与超级个体商业闭环：从选题、公域引流到私域转化的实操方法论。',
    hotText: '872 万热度',
    hotValue: 8720000,
    source: 'zhihu',
    sourceName: '知乎热榜',
    category: 'cognitive',
    categoryName: '认知与职场',
    url: 'https://www.zhihu.com'
  },
  {
    id: 'fb-3',
    title: 'AI 时代正在重塑知识服务：深度解读开源新生态下的个人机遇',
    desc: '前沿大模型推理能力提升，普通知识工作者该如何从“内容搬运工”转型为“思考指挥官”？',
    hotText: '754 万热度',
    hotValue: 7540000,
    source: 'bilibili',
    sourceName: 'B站热门',
    category: 'tech',
    categoryName: '科技与AI',
    url: 'https://www.bilibili.com'
  },
  {
    id: 'fb-4',
    title: '35岁职场危机真的是因为年龄吗？打破信息茧房与中年焦虑',
    desc: '剖析企业用人成本背后的真实商业逻辑，提供核心不可替代性护城河构建指南。',
    hotText: '689 万热度',
    hotValue: 6890000,
    source: 'toutiao',
    sourceName: '今日头条',
    category: 'society',
    categoryName: '社会民生',
    url: 'https://www.toutiao.com'
  },
  {
    id: 'fb-5',
    title: '深度解析情绪价值：当代年轻人为什么愿意为“精神松弛感”买单？',
    desc: '从消费心理学与当代年轻人的生存压力切入，分析情绪消费赛道的爆火逻辑。',
    hotText: '620 万热度',
    hotValue: 6200000,
    source: 'baidu',
    sourceName: '百度热搜',
    category: 'society',
    categoryName: '社会民生',
    url: 'https://top.baidu.com'
  }
];

/**
 * 1. 抓取知乎热榜（深度思考、认知提升、职场成长爆款源泉）
 */
async function fetchZhihuHot() {
  try {
    const res = await fetch('https://api.zhihu.com/topstory/hot-lists/total?limit=40', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const list = json.data || [];

    return list.map((item, idx) => {
      const target = item.target || {};
      const detailText = item.detail_text || '';
      let hotValue = 0;
      const matchNum = detailText.match(/(\d+(?:\.\d+)?)\s*万/);
      if (matchNum) {
        hotValue = parseFloat(matchNum[1]) * 10000;
      } else {
        hotValue = 5000000 - idx * 100000;
      }

      return {
        id: `zhihu-${target.id || idx}`,
        rank: idx + 1,
        title: target.title || '知乎热门话题',
        desc: target.excerpt || '',
        hotText: detailText || `${Math.round(hotValue / 10000)} 万热度`,
        hotValue,
        source: 'zhihu',
        sourceName: '知乎热榜',
        category: 'cognitive',
        categoryName: '深度认知',
        url: target.id ? `https://www.zhihu.com/question/${target.id}` : 'https://www.zhihu.com'
      };
    }).filter(it => it.title);
  } catch (err) {
    console.warn('[trends] 抓取知乎热榜失败:', err.message);
    return [];
  }
}

/**
 * 2. 抓取今日头条热榜（全民关注的社会、民生与全民事件）
 */
async function fetchToutiaoHot() {
  try {
    const res = await fetch('https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const list = json.data || [];

    return list.map((item, idx) => {
      const hotValue = Number(item.HotValue) || (4000000 - idx * 80000);
      const hotText = hotValue >= 10000 ? `${(hotValue / 10000).toFixed(1)} 万热度` : `${hotValue} 热度`;

      return {
        id: `toutiao-${item.ClusterId || idx}`,
        rank: idx + 1,
        title: item.Title || '',
        desc: item.QueryWord || item.Title || '',
        hotText,
        hotValue,
        source: 'toutiao',
        sourceName: '今日头条',
        category: 'society',
        categoryName: '社会民生',
        url: item.Url || 'https://www.toutiao.com'
      };
    }).filter(it => it.title);
  } catch (err) {
    console.warn('[trends] 抓取今日头条热榜失败:', err.message);
    return [];
  }
}

/**
 * 3. 抓取 Bilibili 热门榜（青年文化、前沿科技硬件、AI测评、热门现象）
 */
async function fetchBilibiliHot() {
  try {
    const res = await fetch('https://api.bilibili.com/x/web-interface/popular?ps=30&pn=1', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const list = json.data?.list || [];

    return list.map((item, idx) => {
      const viewCount = item.stat?.view || 0;
      const hotValue = viewCount > 0 ? viewCount : (3000000 - idx * 60000);
      const hotText = hotValue >= 10000 ? `${(hotValue / 10000).toFixed(1)} 万播放` : `${hotValue} 播放`;

      return {
        id: `bilibili-${item.bvid || idx}`,
        rank: idx + 1,
        title: item.title || '',
        desc: item.desc || (item.rcmd_reason?.content || ''),
        hotText,
        hotValue,
        source: 'bilibili',
        sourceName: 'B站热门',
        category: 'tech',
        categoryName: '潮流科技',
        url: item.short_link_v2 || (item.bvid ? `https://www.bilibili.com/video/${item.bvid}` : 'https://www.bilibili.com')
      };
    }).filter(it => it.title);
  } catch (err) {
    console.warn('[trends] 抓取B站热门榜失败:', err.message);
    return [];
  }
}

/**
 * 4. 抓取百度实时热搜（大众热搜与焦点大事件）
 */
async function fetchBaiduHot() {
  try {
    const res = await fetch('https://top.baidu.com/board?tab=realtime', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const titles = [...html.matchAll(/class="c-single-text-ellipsis"[^>]*>\s*([^<]+)\s*<\/div>/g)].map(m => m[1].trim());
    const descs = [...html.matchAll(/class="hot-desc_1m_jR[^"]*"[^>]*>\s*([^<]+)\s*<\/div>/g)].map(m => m[1].trim());
    const hotScores = [...html.matchAll(/class="hot-index_1Bl1a"[^>]*>\s*(\d+)\s*<\/div>/g)].map(m => Number(m[1].trim()));

    const items = [];
    const count = Math.min(titles.length, 30);
    for (let i = 0; i < count; i++) {
      const title = titles[i];
      if (!title) continue;
      const hotScore = hotScores[i] || (3500000 - i * 70000);
      const hotText = `${(hotScore / 10000).toFixed(1)} 万指数`;

      items.push({
        id: `baidu-${i + 1}`,
        rank: i + 1,
        title,
        desc: descs[i] || '',
        hotText,
        hotValue: hotScore,
        source: 'baidu',
        sourceName: '百度热搜',
        category: 'society',
        categoryName: '社会民生',
        url: `https://www.baidu.com/s?wd=${encodeURIComponent(title)}`
      });
    }

    return items;
  } catch (err) {
    console.warn('[trends] 抓取百度热搜失败:', err.message);
    return [];
  }
}

/**
 * 获取全网聚合热点（带 5 分钟内存缓存与故障自动容灾）
 */
export async function getAggregatedTrends({ source = 'all', category = 'all', refresh = false } = {}) {
  const now = Date.now();
  const cacheKey = source === 'all' ? 'all' : (memoryCache[source] ? source : 'all');

  // 若存在有效缓存且未要求强制刷新，直接秒级返回
  if (!refresh && memoryCache[cacheKey]?.data?.length > 0 && (now - memoryCache[cacheKey].timestamp < CACHE_TTL_MS)) {
    return filterTrends(memoryCache[cacheKey].data, category);
  }

  let results = [];

  if (source === 'zhihu') {
    results = await fetchZhihuHot();
  } else if (source === 'toutiao') {
    results = await fetchToutiaoHot();
  } else if (source === 'bilibili') {
    results = await fetchBilibiliHot();
  } else if (source === 'baidu') {
    results = await fetchBaiduHot();
  } else {
    // source === 'all'：并发拉取全网热点
    const [zhihuList, toutiaoList, bilibiliList, baiduList] = await Promise.all([
      fetchZhihuHot(),
      fetchToutiaoHot(),
      fetchBilibiliHot(),
      fetchBaiduHot(),
    ]);

    // 交叉轮流混编，保证各平台高质量平衡呈现
    const maxLen = Math.max(zhihuList.length, toutiaoList.length, bilibiliList.length, baiduList.length);
    const combined = [];
    for (let i = 0; i < maxLen; i++) {
      if (zhihuList[i]) combined.push(zhihuList[i]);
      if (toutiaoList[i]) combined.push(toutiaoList[i]);
      if (bilibiliList[i]) combined.push(bilibiliList[i]);
      if (baiduList[i]) combined.push(baiduList[i]);
    }
    results = combined;
  }

  // 容灾检查：如果全部拉取失败，启用兜底优质爆款库
  if (!results || results.length === 0) {
    console.warn('[trends] 外部热榜全部拉取超时，无缝回退至内置精选爆款库');
    results = FALLBACK_TRENDS;
  }

  // 写入缓存
  memoryCache[cacheKey] = {
    data: results,
    timestamp: now,
  };

  return filterTrends(results, category);
}

function filterTrends(list, category) {
  if (!category || category === 'all') return list;
  return list.filter(item => item.category === category);
}

/**
 * 智能逆向拆解爆款切入角（让用户能够以“结构升华复刻”的方式高效二创）
 */
export async function deconstructTrend({ trend, apiKey, model, baseUrl }) {
  if (!trend || !trend.title) {
    throw new Error('缺少热点内容');
  }

  const systemPrompt = `你是一位深谙微信公众号 10w+ 爆款传播密码的资深主编与自媒体增长架构师。
你的任务是针对给定的【全网热点/爆款话题】，进行深度的「爆款逆向工程拆解（Deconstruction）」。

【拆解原则与核心规范】：
1. 严禁死板抄袭或同义词机械替换！必须遵循“复刻爆款情绪骨架，重构原创全新论点案例”的合规原则。
2. 提取大众情绪痛点：直击读者内心最在意的软肋（焦虑、反直觉、猎奇、共鸣、获得感）。
3. 提供 3 个不同维度的公众号爆款切入视角（破局反差角、底层逻辑复盘角、犀利痛点锐评角）。
4. 每个视角都必须包含：
   - angleName: 视角名称（如：反认知破局、硬核底层复盘、犀利人间清醒）
   - hook: 抓人眼球的情绪痛点钩子
   - recommendedTitle: 极具公众号爆款点击欲的候选标题（25字以内）
   - outlineBrief: 3个小标题串联的核心骨架论点
   - summary: 50字以内的创作切入指导

请严格输出合法的纯 JSON 格式，不得包含任何 Markdown 代码块标签外多余解释：
{
  "originalTopic": "热点原标题",
  "emotionTrigger": "读者情绪密码分析（一句话阐明为何能引发自发转发与讨论）",
  "audience": "目标核心受众画像（如：一二线城市职场人、中年家长、新青年创业者）",
  "angles": [
    {
      "angleName": "反认知破局角",
      "hook": "打破固有认知的悬念",
      "recommendedTitle": "建议爆款标题",
      "outlineBrief": ["1. 现象引入", "2. 认知误区", "3. 破局之道"],
      "summary": "简短切入建议"
    }
  ]
}`;

  const userPrompt = `【待拆解热点】：
标题：${trend.title}
背景说明：${trend.desc || '全网高度关注的热门讨论事件'}
来源平台：${trend.sourceName || '全网热榜'}

请按照规范，深度拆解其爆款密码并输出 3 大切入视角。`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  if (apiKey) {
    try {
      const raw = await chat({
        apiKey,
        model,
        baseUrl,
        messages,
        temperature: 0.7,
        maxTokens: 1500
      });

      const parsed = extractJson(raw);
      if (parsed && Array.isArray(parsed.angles) && parsed.angles.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn('[trends] AI 拆解调用异常，切换为专家策略库智能生成:', err.message);
    }
  }

  // 智能容错兜底解析（基于专业公众号主编破局策略库）
  const cleanTitle = trend.title.replace(/[\r\n\t]+/g, ' ').trim();
  const shortTitle = cleanTitle.length > 18 ? cleanTitle.slice(0, 18) + '...' : cleanTitle;

  return {
    originalTopic: cleanTitle,
    emotionTrigger: '直击当代读者的身份焦虑、认知反差与破局渴望，极易引发朋友圈观点站队与收藏。',
    audience: '关注个人成长、职场破局与时代趋势的高粘性高净值公众号读者',
    angles: [
      {
        angleName: '反直觉认知角',
        hook: '为什么大多数人深信不疑的常理，反而是阻碍突破的隐形枷锁？',
        recommendedTitle: `深度思考：关于「${shortTitle}」，很多人从一开始就想错了`,
        outlineBrief: ['大多数人普遍陷入的直觉误区', '表象背后鲜为人知的运转底层逻辑', '普通人该如何建立反脆弱应对策略'],
        summary: '以打破常识为切入点，制造强烈认知收益与悬念感。'
      },
      {
        angleName: '底层复盘复刻角',
        hook: '拨开情绪迷雾，看清事件背后的系统性规律与动力机制。',
        recommendedTitle: `全面复盘：为什么「${shortTitle}」必然会发生？`,
        outlineBrief: ['事件爆发的导火索与全景切片', '推动走向的核心利益链与系统动力', '给普通人最有价值的 3 条行动启示'],
        summary: '用硬核结构替代纯情绪宣泄，提供极高信息密度的干货。'
      },
      {
        angleName: '犀利锐评共鸣角',
        hook: '替读者说出那些想说却未能表达的心酸、委屈与人间清醒。',
        recommendedTitle: `戳破遮羞布：从「${shortTitle}」，看见当代人的隐秘生存困境`,
        outlineBrief: ['那些不愿被提及的刺痛细节', '情绪爆发背后的群体社会心理投射', '在喧嚣不确定的时代，守住体面与核心护城河'],
        summary: '强化情绪共鸣与金句密度，极大刺激公众号朋友圈转发率。'
      }
    ]
  };
}
