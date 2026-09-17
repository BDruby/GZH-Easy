// 微信公众号专业排版引擎（融合 Doocs Markdown 与 gzh-design-skill 经典主题与排版组件）
// 核心机制：将 Markdown 与增强排版组件转化为 100% 纯内联样式 (Inlined CSS) HTML，避免样式被微信公众号过滤与破坏

export const WECHAT_THEMES = [
  {
    id: 'moyu-green',
    name: '🎣 摸鱼绿 (推荐)',
    primaryColor: '#059669',
    secondaryColor: '#f0fdf4',
    textColor: '#1f2937',
    desc: '出自 gzh-design-skill 官方推荐，适合教程、测评、清单与高密度干货',
  },
  {
    id: 'red-white',
    name: '🔴 红白经典',
    primaryColor: '#e11d48',
    secondaryColor: '#fff1f2',
    textColor: '#1e293b',
    desc: '出自 gzh-design-skill，观点鲜明、力量感强、经典编辑部风格',
  },
  {
    id: 'graphite-minimal',
    name: '✒️ 石墨极简',
    primaryColor: '#1e293b',
    secondaryColor: '#f8fafc',
    textColor: '#334155',
    desc: '出自 gzh-design-skill，现代黑白灰、科技评论、极简克制高级感',
  },
  {
    id: 'zen-whitespace',
    name: '🍃 留白禅意',
    primaryColor: '#475569',
    secondaryColor: '#fafaf9',
    textColor: '#44403c',
    desc: '出自 gzh-design-skill，呼吸感留白、深度随笔与生活哲学',
  },
  {
    id: 'moyu-ticket',
    name: '🧾 摸鱼票据',
    primaryColor: '#d97706',
    secondaryColor: '#fffbeb',
    textColor: '#451a03',
    desc: '出自 gzh-design-skill，票据隐喻、对比评测、复古视觉',
  },
  {
    id: 'olive-note',
    name: '🫒 橄榄手记',
    primaryColor: '#4d7c0f',
    secondaryColor: '#fefce8',
    textColor: '#365314',
    desc: '出自 gzh-design-skill，编辑部内刊、手记复盘、温暖知性',
  },
  {
    id: 'tech-blue',
    name: '⚡ 极客科技蓝',
    primaryColor: '#2563eb',
    secondaryColor: '#eff6ff',
    textColor: '#1e293b',
    desc: '科技互联网、AI研报、代码教程、数码前沿',
  },
  {
    id: 'aurora-purple',
    name: '🔮 优雅极光紫',
    primaryColor: '#7c3aed',
    secondaryColor: '#f5f3ff',
    textColor: '#334155',
    desc: '深度思考、美学品牌、认知升级、艺术人文',
  },
  {
    id: 'vibrant-orange',
    name: '🔥 热点爆款橙',
    primaryColor: '#ea580c',
    secondaryColor: '#fff7ed',
    textColor: '#292524',
    desc: '财经商业、热点突发、吸睛醒目、高转化率',
  },
];

/**
 * 将 Hex 颜色转化为 rgba 字符串，彻底解决微信不支持 8 位 Hex (#rrggbbaa) 的过滤问题
 */
export function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string') return `rgba(5, 150, 105, ${alpha})`;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length >= 6) {
    const r = parseInt(clean.substring(0, 2), 16) || 0;
    const g = parseInt(clean.substring(2, 4), 16) || 0;
    const b = parseInt(clean.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

/**
 * SVG 矢量多行文字渲染器（替代微信不支持的 foreignObject，彻底杜绝文字消失与顺色）
 */
function renderSvgMultilineText(text, x, startY, lineHeight, maxCharsPerLine = 20, fill = '#1e293b', fontSize = 14, fontWeight = 'bold') {
  if (!text) return '';
  const lines = [];
  let remaining = text.trim();
  while (remaining.length > 0) {
    if (remaining.length <= maxCharsPerLine) {
      lines.push(remaining);
      break;
    }
    lines.push(remaining.slice(0, maxCharsPerLine));
    remaining = remaining.slice(maxCharsPerLine);
  }
  return lines
    .map(
      (line, idx) =>
        `<text x="${x}" y="${startY + idx * lineHeight}" text-anchor="middle" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" letter-spacing="0.5">${escapeHtml(line)}</text>`
    )
    .join('\n');
}

/**
 * 微信公众号专用增强排版组件渲染器
 * 核心原则：
 * 1. 杜绝 CSS 继承与渐变丢失导致的“文字背景顺色”，所有背景必须有纯色 background-color 兜底！
 * 2. 所有文本叶子节点显式注入 color，杜绝微信后台清洗覆盖默认黑字！
 * 3. 避免脆弱的 flex/gap，优先采用 table 与纯内联行内块，保证微信后台粘贴 100% 还原！
 */
function renderCustomComponent(type, rawContent, { primary, secondary, textColor, fontSize, lineHeight }) {
  const content = (rawContent || '').trim();
  const lowerType = (type || '').toLowerCase();

  // 1. 导读卡 :::lead
  if (lowerType === 'lead') {
    const bg = hexToRgba(primary, 0.08);
    const border = hexToRgba(primary, 0.25);
    return `
      <section style="margin: 24px 0; padding: 16px 18px; background-color: ${bg}; border: 1px solid ${border}; border-left: 5px solid ${primary}; border-radius: 8px; box-sizing: border-box;">
        <div style="font-size: 12px; font-weight: bold; color: ${primary}; letter-spacing: 1px; margin-bottom: 6px;">
          📌 导读 · LEAD IN
        </div>
        <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; color: ${textColor}; font-weight: 500; text-align: justify;">
          <span style="color: ${textColor}; font-size: ${fontSize}px;">${formatInline(content, primary)}</span>
        </p>
      </section>
    `;
  }

  // 2. 居中金句 :::quote
  if (lowerType === 'quote') {
    const bg = hexToRgba(primary, 0.06);
    const border = hexToRgba(primary, 0.35);
    return `
      <section style="margin: 28px 0; padding: 20px 22px; background-color: ${bg}; border: 1px dashed ${border}; border-radius: 12px; text-align: center; box-sizing: border-box;">
        <div style="font-size: 26px; color: ${primary}; line-height: 1; margin-bottom: 6px; font-family: Georgia, serif;">“</div>
        <p style="margin: 0; font-size: ${fontSize + 1}px; font-weight: bold; color: ${primary}; line-height: 1.6; letter-spacing: 0.5px;">
          <span style="color: ${primary}; font-weight: bold;">${formatInline(content, primary)}</span>
        </p>
        <div style="font-size: 26px; color: ${primary}; line-height: 1; margin-top: 6px; font-family: Georgia, serif;">”</div>
      </section>
    `;
  }

  // 3. 步骤徽章 :::step（彻底抛弃 table，使用纯行内块 section，防止微信全局 table 劫持导致左侧序号异常拉宽）
  if (lowerType === 'step') {
    const parts = content.split(/[|｜]/);
    let stepTag = 'STEP 01';
    let stepText = content;
    if (parts.length >= 2) {
      stepTag = parts[0].trim();
      stepText = parts.slice(1).join('｜').trim();
    }
    return `
      <section style="margin: 28px 0 16px 0; box-sizing: border-box; line-height: 1.5;">
        <section style="display: inline-block; vertical-align: middle; padding: 4px 10px; background-color: ${primary}; border-radius: 6px; margin-right: 10px; box-sizing: border-box;">
          <span style="color: #ffffff; font-size: 12px; font-weight: bold; letter-spacing: 1px; font-family: Menlo, Monaco, Consolas, monospace; line-height: 1; text-align: center; white-space: nowrap; display: inline-block;">${stepTag}</span>
        </section>
        <span style="display: inline-block; vertical-align: middle; font-size: ${fontSize + 2}px; font-weight: 800; color: ${textColor}; line-height: 1.4; letter-spacing: 0.3px;">
          ${formatInline(stepText, primary)}
        </span>
      </section>
    `;
  }

  // 4. 作者签名栏 :::author（彻底解决头像塌陷与文字顺色：使用 fixed table 锁死左列，头像使用纯 section 盒模型，文字显式 span 包裹）
  if (lowerType === 'author') {
    const parts = content.split(/[|｜]/);
    const authorName = parts[0]?.trim() || '本文作者';
    const authorBio = parts[1]?.trim() || '专注于深度思考、优质干货与实战复盘。关注我们，持续获得认知进化。';
    const initialChar = authorName.slice(0, 1);

    return `
      <section style="margin: 36px 0 24px 0; padding: 18px 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; box-sizing: border-box;">
        <table style="width: 100%; table-layout: fixed; border-collapse: collapse; border: none; margin: 0; padding: 0; background: transparent;">
          <tbody>
            <tr>
              <td style="width: 52px; vertical-align: middle; padding: 0; border: none; text-align: center;">
                <section style="width: 44px; height: 44px; line-height: 44px; border-radius: 22px; background-color: ${primary}; text-align: center; margin: 0 auto; box-sizing: border-box; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);">
                  <span style="color: #ffffff; font-size: 18px; font-weight: bold; line-height: 44px; display: inline-block; text-align: center;">${initialChar}</span>
                </section>
              </td>
              <td style="vertical-align: middle; padding: 0 0 0 14px; border: none;">
                <section style="margin: 0; padding: 0;">
                  <section style="font-size: 15px; font-weight: bold; line-height: 1.4; margin-bottom: 4px;">
                    <span style="color: ${textColor}; font-size: 15px; font-weight: bold;">${formatInline(authorName, primary)}</span>
                  </section>
                  <section style="font-size: 13px; line-height: 1.5; margin: 0;">
                    <span style="color: #64748b; font-size: 13px;">${formatInline(authorBio, primary)}</span>
                  </section>
                </section>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    `;
  }

  // 5. 核心要点提示 :::tip
  if (lowerType === 'tip') {
    return `
      <section style="margin: 24px 0; padding: 14px 18px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 8px; box-sizing: border-box;">
        <section style="font-size: 13px; font-weight: bold; margin-bottom: 5px;">
          <span style="color: #15803d; font-size: 13px; font-weight: bold;">💡 核心要点 / TIP</span>
        </section>
        <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; text-align: justify;">
          <span style="color: #166534; font-size: ${fontSize}px;">${formatInline(content, '#15803d')}</span>
        </p>
      </section>
    `;
  }

  // 6. 避坑警示注意 :::warning
  if (lowerType === 'warning') {
    return `
      <section style="margin: 24px 0; padding: 14px 18px; background-color: #fff7ed; border: 1px solid #fed7aa; border-left: 4px solid #ea580c; border-radius: 8px; box-sizing: border-box;">
        <section style="font-size: 13px; font-weight: bold; margin-bottom: 5px;">
          <span style="color: #c2410c; font-size: 13px; font-weight: bold;">⚠️ 避坑提醒 / WARNING</span>
        </section>
        <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; text-align: justify;">
          <span style="color: #9a3412; font-size: ${fontSize}px;">${formatInline(content, '#c2410c')}</span>
        </p>
      </section>
    `;
  }

  // 7. 核心指标大卡 :::metric
  if (lowerType === 'metric') {
    const parts = content.split(/[|｜]/);
    const val = parts[0]?.trim() || '1000W+';
    const label = parts[1]?.trim() || '核心统计指标数据';
    const bg = hexToRgba(primary, 0.06);
    const border = hexToRgba(primary, 0.2);
    return `
      <section style="margin: 28px 0; padding: 22px 20px; background-color: ${bg}; border: 1px solid ${border}; border-radius: 12px; text-align: center; box-sizing: border-box;">
        <section style="font-size: 32px; font-weight: 900; line-height: 1.2; letter-spacing: 1px; font-family: Menlo, Monaco, Consolas, sans-serif; text-align: center;">
          <span style="color: ${primary}; font-size: 32px; font-weight: 900;">${formatInline(val, primary)}</span>
        </section>
        <section style="font-size: 13px; font-weight: 500; margin-top: 6px; letter-spacing: 0.5px; text-align: center;">
          <span style="color: #64748b; font-size: 13px;">${formatInline(label, primary)}</span>
        </section>
      </section>
    `;
  }

  // 8. 票据对比卡 :::card
  if (lowerType === 'card') {
    return `
      <section style="margin: 24px 0; padding: 16px 20px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 10px; box-sizing: border-box; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
        <section style="font-size: 12px; font-weight: bold; letter-spacing: 1px; margin-bottom: 6px;">
          <span style="color: #854d0e; font-size: 12px; font-weight: bold;">🧾 深度拆解 · NOTE</span>
        </section>
        <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; text-align: justify;">
          <span style="color: #713f12; font-size: ${fontSize}px;">${formatInline(content, '#854d0e')}</span>
        </p>
      </section>
    `;
  }

  // 9. 黑金极客悬浮金句卡 :::goldquote（防顺色防文字变黑：纯深色 background-color + section 标签 + 叶子 span 显式金色）
  if (lowerType === 'goldquote') {
    return `
      <section style="margin: 28px 0; padding: 22px 24px; background-color: #18181b; border: 1px solid #d97706; border-radius: 14px; box-sizing: border-box; box-shadow: 0 8px 24px rgba(0,0,0,0.25); text-align: center;">
        <section style="font-size: 32px; line-height: 1; margin-bottom: 6px; font-family: Georgia, serif; font-weight: bold; text-align: center;">
          <span style="color: #f59e0b; font-size: 32px; font-family: Georgia, serif; font-weight: bold; line-height: 1;">“</span>
        </section>
        <section style="margin: 0; font-size: ${fontSize + 1}px; font-weight: 700; line-height: 1.7; letter-spacing: 0.6px; text-align: center;">
          <span style="color: #fef3c7; font-size: ${fontSize + 1}px; font-weight: 700; line-height: 1.7;">${formatInline(content, '#fbbf24')}</span>
        </section>
        <section style="font-size: 32px; line-height: 1; margin-top: 6px; font-family: Georgia, serif; font-weight: bold; text-align: center;">
          <span style="color: #f59e0b; font-size: 32px; font-family: Georgia, serif; font-weight: bold; line-height: 1;">”</span>
        </section>
        <section style="margin-top: 10px; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; font-family: Menlo, monospace; font-weight: bold; text-align: center;">
          <span style="color: #fbbf24; font-size: 11px; font-family: Menlo, monospace; font-weight: bold; letter-spacing: 1.5px;">★ GOLDEN INSIGHT ★</span>
        </section>
      </section>
    `;
  }

  // 10. 微信真实对话问答气泡 :::qa（免 table 纯 section 工业级排版：杜绝微信全局 table 劫持，100% 正圆头像 + 原生微导角气泡）
  if (lowerType === 'qa') {
    const parts = content.split(/[|｜]/);
    const qText = parts[0]?.trim() || '读者提问：请问如何抓住当下的核心破局红利？';
    const aText = parts[1]?.trim() || '主理人回答：核心不是盲目追风，而是用底层逻辑重构你的交付流程。';
    return `
      <section style="margin: 28px 0; box-sizing: border-box; clear: both;">
        <!-- 读者提问行 (左侧：头像 float:left + 气泡 margin-left) -->
        <section style="margin-bottom: 18px; box-sizing: border-box; overflow: hidden;">
          <section style="float: left; width: 36px; height: 36px; line-height: 36px; border-radius: 18px; background-color: #64748b; text-align: center; box-sizing: border-box; box-shadow: 0 2px 6px rgba(100, 116, 139, 0.25);">
            <span style="color: #ffffff; font-size: 13px; font-weight: bold; line-height: 36px; display: block; text-align: center;">问</span>
          </section>
          <section style="margin-left: 48px; max-width: 82%; box-sizing: border-box;">
            <section style="display: inline-block; background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 14px; border-top-left-radius: 3px; padding: 11px 16px; font-size: ${fontSize - 1}px; line-height: 1.65; text-align: justify; box-sizing: border-box; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
              <span style="color: #1e293b; font-size: ${fontSize - 1}px;">${formatInline(qText, '#2563eb')}</span>
            </section>
          </section>
        </section>

        <!-- 主理人回答行 (右侧：头像 float:right + 气泡 float:right + clear:both) -->
        <section style="margin-bottom: 8px; box-sizing: border-box; overflow: hidden;">
          <section style="float: right; width: 36px; height: 36px; line-height: 36px; border-radius: 18px; background-color: ${primary}; text-align: center; box-sizing: border-box; box-shadow: 0 2px 6px ${hexToRgba(primary, 0.35)};">
            <span style="color: #ffffff; font-size: 13px; font-weight: bold; line-height: 36px; display: block; text-align: center;">答</span>
          </section>
          <section style="float: right; margin-right: 12px; max-width: 82%; box-sizing: border-box; text-align: right;">
            <section style="display: inline-block; background-color: ${hexToRgba(primary, 0.1)}; border: 1px solid ${hexToRgba(primary, 0.28)}; border-radius: 14px; border-top-right-radius: 3px; padding: 11px 16px; font-size: ${fontSize - 1}px; line-height: 1.65; text-align: justify; box-sizing: border-box; box-shadow: 0 2px 8px ${hexToRgba(primary, 0.08)};">
              <span style="color: ${textColor}; font-size: ${fontSize - 1}px;">${formatInline(aText, primary)}</span>
            </section>
          </section>
        </section>
        <section style="clear: both; height: 0; line-height: 0; font-size: 0;"></section>
      </section>
    `;
  }

  // 11. 发光时间线节点 :::timeline（免 table 纯 section 工业级排版：连续平滑轴线 + 负外边距同轴发光微节点，100% 连贯不突断）
  if (lowerType === 'timeline') {
    const items = content.split(/[;；]/).map(s => s.trim()).filter(Boolean);
    const nodesHtml = items.map((item, idx) => {
      const parts = item.split(/[|｜]/);
      const timeNode = parts[0]?.trim() || `阶段 0${idx + 1}`;
      const textNode = parts.slice(1).join('｜').trim() || item;
      const isLast = idx === items.length - 1;
      return `
        <section style="position: relative; padding-left: 26px; padding-bottom: ${isLast ? '6px' : '22px'}; border-left: 2px solid ${isLast ? 'transparent' : hexToRgba(primary, 0.35)}; box-sizing: border-box;">
          <!-- 发光节点正圆徽章 (精准同轴负边距覆盖) -->
          <section style="position: absolute; left: -8px; top: 2px; width: 14px; height: 14px; border-radius: 7px; background-color: ${primary}; border: 2.5px solid #ffffff; box-shadow: 0 0 0 2px ${hexToRgba(primary, 0.45)}, 0 2px 6px ${hexToRgba(primary, 0.35)}; box-sizing: border-box;"></section>
          <!-- 时间与节点标题 -->
          <section style="margin-bottom: 4px; line-height: 1.4;">
            <span style="display: inline-block; background-color: ${hexToRgba(primary, 0.1)}; color: ${primary}; font-size: 12px; font-weight: bold; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2px 8px; border-radius: 4px; border: 1px solid ${hexToRgba(primary, 0.2)}; letter-spacing: 0.5px;">
              ${formatInline(timeNode, primary)}
            </span>
          </section>
          <!-- 节点详细内容 -->
          <section style="font-size: ${fontSize - 1}px; line-height: 1.65; color: ${textColor}; padding-top: 2px;">
            <span style="color: ${textColor}; font-size: ${fontSize - 1}px;">${formatInline(textNode, primary)}</span>
          </section>
        </section>
      `;
    }).join('');

    return `
      <section style="margin: 28px 0 28px 12px; padding: 4px 6px; box-sizing: border-box;">
        ${nodesHtml}
      </section>
    `;
  }

  // 12. 红绿避坑 VS 破局对照卡 :::vs
  if (lowerType === 'vs') {
    const parts = content.split(/[|｜]/);
    const wrongText = parts[0]?.trim() || '常见踩坑：盲目跟风日更，缺乏结构性深度';
    const rightText = parts[1]?.trim() || '爆款破局：单篇打透痛点，精细化排版与情绪共鸣';
    return `
      <section style="margin: 26px 0; box-sizing: border-box;">
        <table style="width: 100%; border-collapse: separate; border-spacing: 10px 0; border: none; margin: 0; padding: 0;">
          <tbody>
            <tr>
              <!-- 左侧避坑 -->
              <td style="width: 50%; vertical-align: top; background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 14px 16px; border: none;">
                <section style="font-size: 13px; font-weight: bold; margin-bottom: 6px;">
                  <span style="color: #e11d48; font-size: 13px; font-weight: bold;">❌ 常见避坑误区</span>
                </section>
                <section style="font-size: ${fontSize - 2}px; line-height: 1.6; text-align: justify;">
                  <span style="color: #9f1239; font-size: ${fontSize - 2}px;">${formatInline(wrongText, '#e11d48')}</span>
                </section>
              </td>
              <!-- 右侧破局 -->
              <td style="width: 50%; vertical-align: top; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px; border: none;">
                <section style="font-size: 13px; font-weight: bold; margin-bottom: 6px;">
                  <span style="color: #16a34a; font-size: 13px; font-weight: bold;">✔️ 高效破局解法</span>
                </section>
                <section style="font-size: ${fontSize - 2}px; line-height: 1.6; text-align: justify;">
                  <span style="color: #166534; font-size: ${fontSize - 2}px;">${formatInline(rightText, '#16a34a')}</span>
                </section>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    `;
  }

  // 13. 文末呼吸引流关注卡 :::follow
  if (lowerType === 'follow') {
    const parts = content.split(/[|｜]/);
    const brandName = parts[0]?.trim() || '爆款内容工坊';
    const slogan = parts[1]?.trim() || '专注于深度思考、技术前沿与实战认知复盘。关注我们，一起持续进化。';
    return `
      <section style="margin: 36px 0 20px 0; padding: 22px 18px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 16px; text-align: center; box-sizing: border-box;">
        <section style="width: 48px; height: 48px; line-height: 48px; border-radius: 24px; background-color: ${primary}; color: #ffffff; font-size: 22px; font-weight: bold; margin: 0 auto 10px auto; box-shadow: 0 4px 12px ${hexToRgba(primary, 0.4)}; text-align: center; box-sizing: border-box;">
          <span style="color: #ffffff; font-size: 22px; line-height: 48px;">★</span>
        </section>
        <section style="font-size: 16px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 6px; text-align: center;">
          <span style="color: ${textColor}; font-size: 16px; font-weight: 800;">${formatInline(brandName, primary)}</span>
        </section>
        <p style="margin: 0 auto 14px auto; font-size: 13px; line-height: 1.6; max-width: 90%; text-align: center;">
          <span style="color: #64748b; font-size: 13px;">${formatInline(slogan, primary)}</span>
        </p>
        <section style="display: inline-block; padding: 7px 20px; border-radius: 20px; background-color: ${primary}; text-align: center;">
          <span style="color: #ffffff; font-size: 12px; font-weight: bold; letter-spacing: 1px;">长按上方公众号名片 · 关注我们</span>
        </section>
      </section>
    `;
  }

  // 14. 文末点赞三连仪式感卡 :::interact（彻底杜绝 table，使用 inline-block 药丸标签，保证居中永不错位）
  if (lowerType === 'interact') {
    return `
      <section style="margin: 30px 0; padding: 18px 20px; background-color: #fafafa; border-radius: 12px; text-align: center; box-sizing: border-box; border: 1px solid #eaeaea;">
        <section style="font-size: 13px; font-weight: 600; margin-bottom: 12px; letter-spacing: 0.5px; text-align: center;">
          <span style="color: #475569; font-size: 13px; font-weight: 600;">${formatInline(content || '如果觉得本文有启发，欢迎点击下方互动支持我们：', primary)}</span>
        </section>
        <section style="text-align: center; line-height: 1.8;">
          <section style="display: inline-block; margin: 4px 6px; padding: 7px 16px; border-radius: 20px; background-color: #ffffff; border: 1px solid #e2e8f0; vertical-align: middle; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
            <span style="font-size: 13px; color: #334155; font-weight: bold; line-height: 1.4;">👍 点赞</span>
          </section>
          <section style="display: inline-block; margin: 4px 6px; padding: 7px 16px; border-radius: 20px; background-color: #ffffff; border: 1px solid #e2e8f0; vertical-align: middle; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
            <span style="font-size: 13px; color: #334155; font-weight: bold; line-height: 1.4;">🌟 在看</span>
          </section>
          <section style="display: inline-block; margin: 4px 6px; padding: 7px 16px; border-radius: 20px; background-color: #ffffff; border: 1px solid #e2e8f0; vertical-align: middle; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
            <span style="font-size: 13px; color: #334155; font-weight: bold; line-height: 1.4;">✈️ 分享朋友圈</span>
          </section>
        </section>
      </section>
    `;
  }

  // 15. 马克笔荧光划线高光 :::highlight
  if (lowerType === 'highlight') {
    return `
      <section style="margin: 20px 0; padding: 8px 12px; box-sizing: border-box;">
        <span style="font-size: ${fontSize}px; line-height: 1.8; color: ${textColor}; background-color: #fef08a; padding: 2px 6px; font-weight: bold; border-radius: 3px;">
          ${formatInline(content, primary)}
        </span>
      </section>
    `;
  }

  // 16. 多维数据大屏大卡 :::stats
  if (lowerType === 'stats') {
    const items = content.split(/[|｜]/).map(s => s.trim()).filter(Boolean);
    const cols = items.map(item => {
      const parts = item.split(/[·•]/);
      const val = parts[0]?.trim() || item;
      const label = parts[1]?.trim() || '核心指标';
      return `
        <td style="width: ${Math.floor(100 / (items.length || 1))}%; text-align: center; vertical-align: middle; padding: 10px; border: none;">
          <section style="font-size: 24px; font-weight: 900; line-height: 1.2; font-family: Menlo, monospace; text-align: center;">
            <span style="color: ${primary}; font-weight: 900; font-size: 24px;">${formatInline(val, primary)}</span>
          </section>
          <section style="font-size: 11px; margin-top: 4px; text-align: center;">
            <span style="color: #64748b; font-size: 11px;">${formatInline(label, primary)}</span>
          </section>
        </td>
      `;
    }).join('');

    return `
      <section style="margin: 24px 0; padding: 14px 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; box-sizing: border-box;">
        <table style="width: 100%; border-collapse: collapse; border: none; margin: 0; padding: 0;">
          <tbody>
            <tr>${cols}</tr>
          </tbody>
        </table>
      </section>
    `;
  }

  // ==================== 全新四大微信流行图册排版组件 ====================

  // 17. 微信原生横滑焦点相册 (Banner滑动 / 轮播组图) :::gallery-scroll
  // 注意：微信官方规定，PC 端公众号编辑后台处于打字录入状态，锁定了触摸滚动；必须在公众号后台点击右上角「预览」发送到手机端体验手势横滑！
  if (lowerType === 'gallery-scroll' || lowerType === 'scroll-gallery') {
    const lines = content.split('\n').map(s => s.trim()).filter(Boolean);
    const rawCards = lines.length > 0 && lines[0].includes('||') 
      ? content.split('||').map(s => s.trim()).filter(Boolean)
      : lines;

    const cardsHtml = rawCards.map((card, i) => {
      const parts = card.split(/[|｜]/);
      const imgUrl = parts[0]?.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80';
      const cardTitle = parts[1]?.trim() || `精彩图册 0${i + 1}`;
      const cardDesc = parts[2]?.trim() || '左右滑动探索更多高画质视觉呈现与细节解析。';

      return `
        <section style="display: inline-block; width: 80%; max-width: 300px; vertical-align: top; margin-right: 14px; border-radius: 12px; overflow: hidden; background-color: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(0,0,0,0.06); box-sizing: border-box; white-space: normal;">
          <section style="width: 100%; height: 180px; max-height: 180px; overflow: hidden; background-color: #f1f5f9; position: relative;">
            <img src="${imgUrl}" alt="${escapeHtml(cardTitle)}" style="display: block; width: 100% !important; height: 180px !important; min-height: 180px !important; max-height: 180px !important; object-fit: cover !important; border: none; margin: 0; padding: 0;" />
          </section>
          <section style="padding: 12px 14px; background-color: #ffffff; box-sizing: border-box;">
            <section style="font-size: 14px; font-weight: bold; line-height: 1.4; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              <span style="color: #1e293b; font-size: 14px; font-weight: bold;">${formatInline(cardTitle, primary)}</span>
            </section>
            <section style="font-size: 12px; line-height: 1.5; height: 36px; overflow: hidden;">
              <span style="color: #64748b; font-size: 12px;">${formatInline(cardDesc, primary)}</span>
            </section>
          </section>
        </section>
      `;
    }).join('');

    return `
      <section style="margin: 28px 0; box-sizing: border-box;">
        <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 8px;">
          <tbody>
            <tr>
              <td style="text-align: left; vertical-align: middle; border: none; padding: 0;">
                <span style="font-size: 13px; font-weight: bold; color: ${primary}; letter-spacing: 0.5px;">
                  🖼️ 精选图集 · SCROLL GALLERY
                </span>
              </td>
              <td style="text-align: right; vertical-align: middle; border: none; padding: 0;">
                <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">
                  👉 手机端左右横滑 ⇄
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <section style="width: 100%; overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; padding: 4px 2px 14px 2px; box-sizing: border-box;">
          ${cardsHtml}
        </section>
      </section>
    `;
  }

  // 18. 多宫格矩阵杂志拼图 (严格统一图片比例与尺寸，table-layout fixed 杜绝大小不一与变形) :::gallery-grid
  if (lowerType === 'gallery-grid' || lowerType === 'grid-gallery') {
    const lines = content.split('\n').map(s => s.trim()).filter(Boolean);
    const rawItems = lines.length > 0 && lines[0].includes('||') 
      ? content.split('||').map(s => s.trim()).filter(Boolean)
      : lines;

    const items = rawItems.map((item, idx) => {
      const parts = item.split(/[|｜]/);
      return {
        url: parts[0]?.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
        title: parts[1]?.trim() || `图集切片 0${idx + 1}`,
      };
    });

    // 统一卡片高度配置：高 140px，保持 100% 裁切与严格对齐
    const CARD_IMG_HEIGHT = 140;

    let gridHtml = '';

    // 1 张图：单图精选大卡呈现
    if (items.length === 1) {
      const it = items[0];
      gridHtml = `
        <section style="border-radius: 10px; overflow: hidden; background-color: #f1f5f9; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); box-sizing: border-box; max-width: 500px; margin: 0 auto;">
          <section style="width: 100%; height: 220px; max-height: 220px; overflow: hidden; background-color: #f1f5f9; position: relative;">
            <img src="${it.url}" alt="${escapeHtml(it.title)}" style="display: block; width: 100% !important; height: 220px !important; min-height: 220px !important; max-height: 220px !important; object-fit: cover !important; border: none; margin: 0; padding: 0;" />
          </section>
          <section style="padding: 8px 12px; background-color: #f8fafc; font-size: 12px; font-weight: 600; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            <span style="color: #334155; font-size: 12px;">${formatInline(it.title, primary)}</span>
          </section>
        </section>
      `;
    } else {
      // 2张及以上：严格 2 列矩阵，开启 table-layout: fixed，杜绝任意列挤压或单张图突变成大图
      const rows = [];
      for (let i = 0; i < items.length; i += 2) {
        rows.push(items.slice(i, i + 2));
      }

      const rowsHtml = rows.map(pair => `
        <tr>
          ${pair.map(it => `
            <td style="width: 50%; vertical-align: top; padding: 0; border: none;">
              <section style="border-radius: 8px; overflow: hidden; background-color: #f1f5f9; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.03); box-sizing: border-box;">
                <section style="width: 100%; height: ${CARD_IMG_HEIGHT}px; max-height: ${CARD_IMG_HEIGHT}px; overflow: hidden; background-color: #f1f5f9; position: relative;">
                  <img src="${it.url}" alt="${escapeHtml(it.title)}" style="display: block; width: 100% !important; height: ${CARD_IMG_HEIGHT}px !important; min-height: ${CARD_IMG_HEIGHT}px !important; max-height: ${CARD_IMG_HEIGHT}px !important; object-fit: cover !important; border: none; margin: 0; padding: 0;" />
                </section>
                <section style="padding: 7px 8px; background-color: #f8fafc; font-size: 11px; font-weight: 600; text-align: center; height: 28px; line-height: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-sizing: border-box;">
                  <span style="color: #334155; font-size: 11px;">${formatInline(it.title, primary)}</span>
                </section>
              </section>
            </td>
          `).join('')}
          ${pair.length === 1 ? '<td style="width: 50%; vertical-align: top; padding: 0; border: none;"></td>' : ''}
        </tr>
      `).join('');

      gridHtml = `
        <table style="width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 8px 8px; border: none; margin: 0; padding: 0; background: transparent;">
          <tbody>${rowsHtml}</tbody>
        </table>
      `;
    }

    return `
      <section style="margin: 26px 0; box-sizing: border-box;">
        <section style="font-size: 12px; font-weight: bold; margin-bottom: 8px; letter-spacing: 0.5px;">
          <span style="color: ${primary}; font-size: 12px; font-weight: bold;">📸 杂志矩阵画廊 · GRID ALBUM</span>
        </section>
        ${gridHtml}
      </section>
    `;
  }

  // 19. 双图对照避坑 VS 标杆卡片 :::gallery-compare
  if (lowerType === 'gallery-compare' || lowerType === 'compare-gallery') {
    const lines = content.split('\n').map(s => s.trim()).filter(Boolean);
    const item1 = lines[0] ? lines[0].split(/[|｜]/) : [];
    const item2 = lines[1] ? lines[1].split(/[|｜]/) : [];

    const label1 = item1[0]?.trim() || '❌ 避坑反面示范';
    const url1 = item1[1]?.trim() || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80';
    const desc1 = item1[2]?.trim() || '排版密密麻麻，缺乏视觉重心与结构留白';

    const label2 = item2[0]?.trim() || '✔️ 标杆破局解法';
    const url2 = item2[1]?.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80';
    const desc2 = item2[2]?.trim() || '层次分明，利用组件与呼吸感引导完读率';

    return `
      <section style="margin: 28px 0; box-sizing: border-box;">
        <table style="width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 8px 0; border: none; margin: 0; padding: 0; background: transparent;">
          <tbody>
            <tr>
              <!-- 左侧避坑 -->
              <td style="width: 50%; vertical-align: top; border: 1px solid #fecdd3; background-color: #fff1f2; border-radius: 12px; padding: 10px; box-sizing: border-box;">
                <section style="font-size: 12px; font-weight: bold; color: #e11d48; margin-bottom: 6px; text-align: center;">
                  <span style="color: #e11d48; font-size: 12px; font-weight: bold;">${formatInline(label1, '#e11d48')}</span>
                </section>
                <section style="border-radius: 8px; overflow: hidden; margin-bottom: 8px; height: 120px; max-height: 120px; background-color: #ffe4e6; position: relative;">
                  <img src="${url1}" alt="${escapeHtml(label1)}" style="display: block; width: 100% !important; height: 120px !important; min-height: 120px !important; max-height: 120px !important; object-fit: cover !important; border: none; margin: 0; padding: 0;" />
                </section>
                <section style="font-size: 11px; line-height: 1.5; color: #9f1239; text-align: justify;">
                  <span style="color: #9f1239; font-size: 11px;">${formatInline(desc1, '#e11d48')}</span>
                </section>
              </td>
              <!-- 右侧标杆 -->
              <td style="width: 50%; vertical-align: top; border: 1px solid #bbf7d0; background-color: #f0fdf4; border-radius: 12px; padding: 10px; box-sizing: border-box;">
                <section style="font-size: 12px; font-weight: bold; color: #16a34a; margin-bottom: 6px; text-align: center;">
                  <span style="color: #16a34a; font-size: 12px; font-weight: bold;">${formatInline(label2, '#16a34a')}</span>
                </section>
                <section style="border-radius: 8px; overflow: hidden; margin-bottom: 8px; height: 120px; max-height: 120px; background-color: #dcfce7; position: relative;">
                  <img src="${url2}" alt="${escapeHtml(label2)}" style="display: block; width: 100% !important; height: 120px !important; min-height: 120px !important; max-height: 120px !important; object-fit: cover !important; border: none; margin: 0; padding: 0;" />
                </section>
                <section style="font-size: 11px; line-height: 1.5; color: #166534; text-align: justify;">
                  <span style="color: #166534; font-size: 11px;">${formatInline(desc2, '#16a34a')}</span>
                </section>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    `;
  }

  // 20. 拍立得复古宝丽来文艺影集 :::gallery-polaroid
  if (lowerType === 'gallery-polaroid' || lowerType === 'polaroid') {
    const parts = content.split(/[|｜]/);
    const imgUrl = parts[0]?.trim() || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80';
    const caption = parts[1]?.trim() || '漫步在初秋微风的落日余晖里';
    const timeLocation = parts[2]?.trim() || '2026.09 · SHANGHAI MEMORY';

    return `
      <section style="margin: 32px auto; max-width: 460px; padding: 14px 14px 20px 14px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); box-sizing: border-box; text-align: center;">
        <section style="width: 100%; height: 260px; overflow: hidden; background-color: #f1f5f9; border-radius: 2px;">
          <img src="${imgUrl}" alt="${escapeHtml(caption)}" style="display: block; width: 100%; height: 100%; object-fit: cover;" />
        </section>
        <section style="margin-top: 14px; font-size: 14px; font-weight: bold; letter-spacing: 0.5px; font-family: -apple-system, sans-serif; text-align: center;">
          <span style="color: #1e293b; font-size: 14px; font-weight: bold;">${formatInline(caption, primary)}</span>
        </section>
        <section style="margin-top: 6px; font-size: 10px; letter-spacing: 1.5px; font-family: Menlo, Monaco, monospace; text-transform: uppercase; text-align: center;">
          <span style="color: #94a3b8; font-size: 10px;">${formatInline(timeLocation, primary)}</span>
        </section>
      </section>
    `;
  }

  // ==================== 微信黑科技 SVG 交互组件系列 (彻底杜绝 foreignObject) ====================

  // 21. 微信黑科技：点击变身卡片 :::svg-morph
  // 利用微信原生 SVG 的 animate 触发机制，读者轻触上层封面，上层瞬间隐去露出下层真相
  if (lowerType === 'svg-morph') {
    const parts = content.split(/[|｜]/);
    const coverText = parts[0]?.trim() || '👉 点击此处，揭秘关键底层认知！';
    const revealText = parts[1]?.trim() || '🎉 恭喜揭秘：认知升级不是掌握更多信息，而是升级判断框架！';

    return `
      <section style="margin: 28px 0; text-align: center; box-sizing: border-box;">
        <svg viewBox="0 0 600 220" style="width: 100%; max-width: 600px; height: auto; display: block; margin: 0 auto; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); background-color: #0f172a;" xmlns="http://www.w3.org/2000/svg">
          <!-- 下层底板：揭示后的精彩内容 (采用 100% 兼容的 SVG text/tspan 绝不丢失) -->
          <g>
            <rect width="600" height="220" fill="#f8fafc" />
            <rect x="15" y="15" width="570" height="190" rx="10" fill="#ffffff" stroke="${primary}" stroke-width="2" stroke-dasharray="6,4" />
            <text x="300" y="60" text-anchor="middle" font-size="14" font-weight="bold" fill="${primary}" letter-spacing="2">★ 揭秘成功 · INSIGHT UNLOCKED ★</text>
            ${renderSvgMultilineText(revealText, 300, 110, 26, 22, '#1e293b', 15, 'bold')}
          </g>

          <!-- 上层盖板：点击前悬念封面 (点击即变身消失) -->
          <g style="cursor: pointer;">
            <rect width="600" height="220" fill="#0f172a" />
            <!-- 装饰纹理与边框 -->
            <rect x="15" y="15" width="570" height="190" rx="10" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.6" />
            <circle cx="300" cy="85" r="28" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
            <polygon points="295,73 313,85 295,97" fill="#38bdf8" />
            <text x="300" y="145" text-anchor="middle" font-size="16" font-weight="bold" fill="#ffffff" letter-spacing="1">${escapeHtml(coverText)}</text>
            <text x="300" y="175" text-anchor="middle" font-size="12" fill="#94a3b8" letter-spacing="1">⚡ 轻触卡片触发点击变身</text>

            <!-- 微信原生黑科技动画：点击/轻触淡出并隐藏上层 -->
            <animate attributeName="opacity" begin="click; touchstart" from="1" to="0" dur="0.25s" fill="freeze" restart="never" />
            <animate attributeName="transform" begin="click; touchstart" type="scale" from="1" to="0.95" dur="0.25s" fill="freeze" restart="never" />
            <animate attributeName="display" begin="click; touchstart" from="inline" to="none" dur="0.26s" fill="freeze" restart="never" />
          </g>
        </svg>
      </section>
    `;
  }

  // 22. 微信黑科技：长按蓄力卡片 :::svg-charge
  if (lowerType === 'svg-charge') {
    const parts = content.split(/[|｜]/);
    const holdPrompt = parts[0]?.trim() || '按住蓄力 · 充能解开终极锦囊';
    const eggText = parts[1]?.trim() || '⚡ 蓄力满格！真正的红利永远属于提前深耕长期价值的行动者！';

    return `
      <section style="margin: 28px 0; text-align: center; box-sizing: border-box;">
        <svg viewBox="0 0 600 240" style="width: 100%; max-width: 600px; height: auto; display: block; margin: 0 auto; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.18); background-color: #090d16;" xmlns="http://www.w3.org/2000/svg">
          <!-- 底层：终极破局彩蛋（蓄力满格后露出，采用原生矢量 text 绝不顺色丢失） -->
          <g>
            <rect width="600" height="240" fill="#0d1117" />
            <!-- 金光流转双边框 -->
            <rect x="14" y="14" width="572" height="212" rx="12" fill="#161b22" stroke="#f59e0b" stroke-width="1.8" />
            <rect x="18" y="18" width="564" height="204" rx="10" fill="none" stroke="#fbbf24" stroke-width="0.8" opacity="0.4" stroke-dasharray="6,4" />

            <!-- 顶部荣誉标识 -->
            <g>
              <rect x="210" y="24" width="180" height="26" rx="13" fill="#78350f" stroke="#f59e0b" stroke-width="1" />
              <text x="300" y="41" text-anchor="middle" font-size="12" font-weight="bold" fill="#fef3c7" letter-spacing="1">✨ 蓄力满格 · 终极认知</text>
            </g>

            <!-- 核心破局干货文本 -->
            ${renderSvgMultilineText(eggText, 300, 105, 26, 22, '#f8fafc', 15, 'bold')}

            <!-- 底部小字引导 -->
            <text x="300" y="210" text-anchor="middle" font-size="11" fill="#94a3b8" letter-spacing="0.5">
              💡 深度思维已为你解锁 · 建议星标置顶复习
            </text>
          </g>

          <!-- 顶层交互遮罩与长按高能充能电浆系统 -->
          <g style="cursor: pointer;">
            <rect width="600" height="240" fill="#090d16" />
            <rect x="14" y="14" width="572" height="212" rx="12" fill="#111827" stroke="#4f46e5" stroke-width="1.6" />

            <!-- 核心能量徽标图标与动态蓄能光环 -->
            <circle cx="300" cy="56" r="24" fill="#1e1b4b" stroke="#6366f1" stroke-width="2">
              <animate attributeName="stroke" begin="mousedown; touchstart; click" values="#6366f1; #a855f7; #ec4899; #fbbf24" keyTimes="0; 0.35; 0.7; 1" dur="1.3s" fill="freeze" restart="never" />
            </circle>
            <text x="300" y="64" text-anchor="middle" font-size="20" fill="#c7d2fe">⚡</text>

            <!-- 提示文案 -->
            <text x="300" y="104" text-anchor="middle" font-size="16" font-weight="bold" fill="#ffffff" letter-spacing="1">
              ${escapeHtml(holdPrompt)}
            </text>
            <text x="300" y="126" text-anchor="middle" font-size="12" fill="#94a3b8" letter-spacing="0.5">
              👇 手指长按 / 按住卡片启动高能蓄力
            </text>

            <!-- 蓄力能量轨道背景槽 -->
            <rect x="110" y="144" width="380" height="18" rx="9" fill="#0f172a" stroke="#334155" stroke-width="1.2" />
            <!-- 刻度线细节 -->
            <line x1="205" y1="145" x2="205" y2="161" stroke="#1e293b" stroke-width="1" />
            <line x1="300" y1="145" x2="300" y2="161" stroke="#1e293b" stroke-width="1" />
            <line x1="395" y1="145" x2="395" y2="161" stroke="#1e293b" stroke-width="1" />

            <!-- 蓄力充能电浆流 -->
            <rect x="110" y="144" width="0" height="18" rx="9" fill="#3b82f6">
              <animate attributeName="width" begin="mousedown; touchstart; click" from="0" to="380" dur="1.3s" fill="freeze" restart="never" calcMode="spline" keySplines="0.25 0.1 0.25 1" />
              <animate attributeName="fill" begin="mousedown; touchstart; click" values="#3b82f6; #8b5cf6; #ec4899; #fbbf24" keyTimes="0; 0.35; 0.7; 1" dur="1.3s" fill="freeze" restart="never" />
            </rect>

            <!-- 能量前端喷射流星高光球 -->
            <circle cx="110" cy="153" r="10" fill="#ffffff" opacity="0">
              <animate attributeName="opacity" begin="mousedown; touchstart; click" values="0; 0.95; 0.95; 1" keyTimes="0; 0.05; 0.95; 1" dur="1.3s" fill="freeze" restart="never" />
              <animate attributeName="cx" begin="mousedown; touchstart; click" from="110" to="490" dur="1.3s" fill="freeze" restart="never" calcMode="spline" keySplines="0.25 0.1 0.25 1" />
              <animate attributeName="r" begin="mousedown; touchstart; click" values="9; 12; 9; 13; 10" dur="0.32s" repeatCount="4" />
            </circle>

            <!-- 实时充能状态动态反馈提示 -->
            <g>
              <text x="300" y="188" text-anchor="middle" font-size="11" font-weight="bold" fill="#64748b" letter-spacing="1">
                ENERGY: 0% [READY TO CHARGE]
                <animate attributeName="opacity" begin="mousedown; touchstart; click" to="0" dur="0.05s" fill="freeze" restart="never" />
              </text>
              <text x="300" y="188" text-anchor="middle" font-size="11" font-weight="bold" fill="#818cf8" letter-spacing="1" opacity="0">
                ⚡ CHARGING: 35% · 正在聚合能量...
                <animate attributeName="opacity" begin="mousedown; touchstart; click" values="0; 1; 1; 0" keyTimes="0; 0.05; 0.95; 1" dur="0.45s" fill="freeze" restart="never" />
              </text>
              <text x="300" y="188" text-anchor="middle" font-size="11" font-weight="bold" fill="#c084fc" letter-spacing="1" opacity="0">
                ⚡ CHARGING: 75% · 即将突破壁垒!
                <animate attributeName="opacity" begin="mousedown+0.45s; touchstart+0.45s; click+0.45s" values="0; 1; 1; 0" keyTimes="0; 0.05; 0.95; 1" dur="0.5s" fill="freeze" restart="never" />
              </text>
              <text x="300" y="188" text-anchor="middle" font-size="12" font-weight="bold" fill="#fbbf24" letter-spacing="1.5" opacity="0">
                🔥 100% MAXIMUM OVERDRIVE!
                <animate attributeName="opacity" begin="mousedown+0.95s; touchstart+0.95s; click+0.95s" values="0; 1; 1" keyTimes="0; 0.1; 1" dur="0.35s" fill="freeze" restart="never" />
              </text>
            </g>

            <!-- 蓄满终极大招：白光冲击波爆炸光晕 -->
            <rect width="600" height="240" fill="#ffffff" opacity="0">
              <animate attributeName="opacity" begin="mousedown+1.3s; touchstart+1.3s; click+1.3s" values="0; 0.88; 0" keyTimes="0; 0.25; 1" dur="0.25s" fill="freeze" restart="never" />
            </rect>

            <animate attributeName="opacity" begin="mousedown+1.4s; touchstart+1.4s; click+1.4s" from="1" to="0" dur="0.3s" fill="freeze" restart="never" />
            <animate attributeName="display" begin="mousedown+1.7s; touchstart+1.7s; click+1.7s" from="inline" to="none" dur="0.01s" fill="freeze" restart="never" />
          </g>
        </svg>
      </section>
    `;
  }

  // 23. 微信黑科技：折叠画卷展开 :::svg-unfold
  if (lowerType === 'svg-unfold') {
    const parts = content.split(/[|｜]/);
    const unfoldTitle = parts[0]?.trim() || '📜 点击展开完整长卷与详细实操大纲';
    const detailContent = parts.slice(1).join('｜').trim() || '这里是展开后展现的完整知识图谱、详细方法论与关键实操指引，长篇干货一览无余。';

    return `
      <section style="margin: 28px 0; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); background-color: #ffffff; box-sizing: border-box;">
        <div style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 14px; font-weight: bold; color: ${textColor}; display: flex; align-items: center; gap: 6px;">
            📜 ${formatInline(unfoldTitle, primary)}
          </span>
          <span style="font-size: 11px; color: ${primary}; font-weight: bold; font-family: -apple-system, sans-serif;">轻触展开 ▼</span>
        </div>

        <svg viewBox="0 0 600 280" style="width: 100%; max-width: 600px; height: 110px; display: block; margin: 0 auto; overflow: hidden; transition: all 0.35s ease; background-color: #ffffff;" xmlns="http://www.w3.org/2000/svg">
          <animate attributeName="height" begin="click; touchstart" from="110px" to="280px" dur="0.35s" fill="freeze" restart="never" />

          <!-- 内容矢量文字 -->
          <g>
            ${renderSvgMultilineText(detailContent, 300, 36, 26, 24, textColor, 14, 'normal')}
          </g>

          <!-- 底部渐变遮罩与超大醒目“点击展开”按钮提示 -->
          <g style="cursor: pointer;">
            <!-- 渐变毛玻璃白底遮罩 -->
            <rect x="0" y="20" width="600" height="90" fill="#ffffff" opacity="0.96" />
            <!-- 按钮投影外发光层 -->
            <rect x="170" y="48" width="260" height="46" rx="23" fill="${hexToRgba(primary, 0.25)}" />
            <!-- 按钮主体实色层 -->
            <rect x="170" y="46" width="260" height="46" rx="23" fill="${primary}" />
            <!-- 按钮醒目文字与指引图标 -->
            <text x="300" y="75" text-anchor="middle" font-size="15" font-weight="bold" fill="#ffffff" letter-spacing="1">👇 点击展开完整画卷</text>

            <animate attributeName="opacity" begin="click; touchstart" from="1" to="0" dur="0.25s" fill="freeze" restart="never" />
            <animate attributeName="display" begin="click+0.25s; touchstart+0.25s" from="inline" to="none" dur="0.01s" fill="freeze" restart="never" />
          </g>
        </svg>
      </section>
    `;
  }

  // 24. 微信横向滑动相册卡片走马灯 :::svg-scroll (全网最优质解法：外层与卡片全用 section，-webkit-overflow-scrolling 保证移动端原生平滑横滑)
  if (lowerType === 'svg-scroll') {
    const rawCards = content.split('||').map(s => s.trim()).filter(Boolean);
    const cardsHtml = rawCards.map((c, i) => {
      const parts = c.split(/[::：]/);
      const title = parts[0]?.trim() || `核心亮点 0${i + 1}`;
      const desc = parts.slice(1).join('：').trim() || c;
      return `
        <section style="display: inline-block; vertical-align: top; width: 230px; white-space: normal; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin-right: 12px; box-sizing: border-box; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
          <section style="font-size: 13px; font-weight: bold; margin-bottom: 6px;">
            <span style="color: ${primary}; font-weight: bold; font-size: 13px;">${formatInline(title, primary)}</span>
          </section>
          <section style="font-size: 12px; line-height: 1.6; text-align: justify;">
            <span style="color: #475569; font-size: 12px;">${formatInline(desc, primary)}</span>
          </section>
        </section>
      `;
    }).join('');

    return `
      <section style="margin: 26px 0; box-sizing: border-box;">
        <section style="font-size: 11px; color: #94a3b8; margin-bottom: 6px; text-align: right; padding-right: 4px;">
          <span style="color: #94a3b8; font-size: 11px;">👉 手机端左右滑动查看卡片 ⇄</span>
        </section>
        <section style="width: 100%; overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; padding: 6px 2px 14px 2px; box-sizing: border-box;">
          ${cardsHtml}
        </section>
      </section>
    `;
  }

  return '';
}

/**
 * 将 Markdown 字符串转为纯内联微信排版 HTML
 * @param {string} markdown 
 * @param {object} options { themeId, primaryColor, fontSize, lineHeight }
 */
export function formatToWechatHtml(markdown = '', options = {}) {
  if (!markdown) return '';

  const theme = WECHAT_THEMES.find((t) => t.id === options.themeId) || WECHAT_THEMES[0];
  const primary = options.primaryColor || theme.primaryColor;
  const secondary = theme.secondaryColor;
  const fontSize = options.fontSize || 15;
  const lineHeight = options.lineHeight || 1.8;
  const textColor = options.textColor || theme.textColor;

  const lines = markdown.split('\n');
  const htmlParts = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let codeLang = '';
  let inList = false;
  let listType = 'ul';
  let listBuffer = [];
  let inTable = false;
  let tableRows = [];

  // 自定义块（支持多行 :::lead ... :::）
  let inCustomBlock = false;
  let customBlockType = '';
  let customBlockBuffer = [];

  const flushList = () => {
    if (!inList) return;
    const tag = listType === 'ol' ? 'ol' : 'ul';
    const listHtml = listBuffer
      .map((item, idx) => {
        const marker =
          listType === 'ol'
            ? `<span style="display:inline-block;min-width:20px;font-weight:bold;color:${primary};margin-right:6px;font-family:Menlo,Monaco,monospace;vertical-align:baseline;">${String(idx + 1).padStart(2, '0')}.</span>`
            : `<span style="display:inline-block;width:6px;height:6px;background-color:${primary};border-radius:50%;margin-right:8px;vertical-align:middle;margin-top:-2px;"></span>`;
        return `<li style="margin-bottom:8px;list-style:none;line-height:${lineHeight};color:${textColor};padding-left:0;">${marker}<span style="vertical-align:middle;">${formatInline(item, primary)}</span></li>`;
      })
      .join('');
    htmlParts.push(
      `<${tag} style="padding-left:4px;margin:16px 0;box-sizing:border-box;list-style:none;">${listHtml}</${tag}>`
    );
    inList = false;
    listBuffer = [];
  };

  const flushTable = () => {
    if (!inTable || tableRows.length === 0) return;
    const header = tableRows[0];
    const body = tableRows.slice(1);

    const headerHtml = `<tr>${header
      .map(
        (th) =>
          `<th style="padding:10px 14px;background-color:${secondary};color:${primary};font-weight:bold;border:1px solid #e2e8f0;font-size:${fontSize - 1}px;text-align:left;">${formatInline(th, primary)}</th>`
      )
      .join('')}</tr>`;

    const bodyHtml = body
      .map(
        (row, rIdx) =>
          `<tr style="background-color:${rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${row
            .map(
              (td) =>
                `<td style="padding:9px 14px;border:1px solid #e2e8f0;font-size:${fontSize - 1}px;color:${textColor};line-height:1.6;">${formatInline(td, primary)}</td>`
            )
            .join('')}</tr>`
      )
      .join('');

    htmlParts.push(
      `<div style="overflow-x:auto;margin:20px 0;border-radius:10px;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,0.03);"><table style="width:100%;border-collapse:collapse;text-align:left;font-size:${fontSize - 1}px;margin:0;background-color:#ffffff;"><thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody></table></div>`
    );
    inTable = false;
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. 代码块处理 (macOS 终端卡片风格，table 布局保证红黄绿灯与语言并排)
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        flushList();
        flushTable();
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
        codeBuffer = [];
      } else {
        inCodeBlock = false;
        const codeContent = escapeHtml(codeBuffer.join('\n'));
        htmlParts.push(`
          <section style="margin:20px 0;border-radius:10px;overflow:hidden;background-color:#1e1e1e;box-shadow:0 4px 16px rgba(0,0,0,0.15);box-sizing:border-box;">
            <table style="width:100%;background-color:#2d2d2d;border-bottom:1px solid #3d3d3d;border-collapse:collapse;border:none;padding:0;margin:0;">
              <tbody>
                <tr>
                  <td style="padding:8px 14px;vertical-align:middle;border:none;background-color:#2d2d2d;">
                    <span style="display:inline-block;width:11px;height:11px;border-radius:50%;background-color:#ff5f56;margin-right:6px;vertical-align:middle;"></span>
                    <span style="display:inline-block;width:11px;height:11px;border-radius:50%;background-color:#ffbd2e;margin-right:6px;vertical-align:middle;"></span>
                    <span style="display:inline-block;width:11px;height:11px;border-radius:50%;background-color:#27c93f;vertical-align:middle;"></span>
                  </td>
                  <td style="padding:8px 14px;text-align:right;vertical-align:middle;border:none;background-color:#2d2d2d;">
                    <span style="font-size:11px;color:#9ca3af;font-family:Menlo,Monaco,Consolas,monospace;text-transform:uppercase;font-weight:600;">${codeLang || 'code'}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <pre style="margin:0;padding:14px 16px;overflow-x:auto;background-color:#1e1e1e;color:#e2e8f0;font-family:Menlo,Monaco,Consolas,monospace;font-size:13px;line-height:1.65;letter-spacing:0.3px;white-space:pre-wrap;word-break:break-all;"><code style="background-color:#1e1e1e;color:#e2e8f0;font-family:inherit;">${codeContent}</code></pre>
          </section>
        `);
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // 2. 自定义增强组件多行块解析
    if (inCustomBlock) {
      if (trimmed === ':::' || (trimmed.endsWith(':::') && !trimmed.startsWith(':::'))) {
        if (trimmed !== ':::') {
          customBlockBuffer.push(trimmed.replace(/:::\s*$/, ''));
        }
        const rendered = renderCustomComponent(customBlockType, customBlockBuffer.join('\n'), {
          primary,
          secondary,
          textColor,
          fontSize,
          lineHeight,
        });
        if (rendered) htmlParts.push(rendered);
        inCustomBlock = false;
        customBlockType = '';
        customBlockBuffer = [];
      } else {
        customBlockBuffer.push(rawLine);
      }
      continue;
    }

    // 检查是否开启自定义增强组件 (:::lead, :::quote, :::step, :::author, :::tip, :::warning, :::metric, :::card)
    const customMatch = trimmed.match(/^:::([a-zA-Z0-9_-]+)(?:\s+(.*))?$/);
    if (customMatch) {
      flushList();
      flushTable();
      const compType = customMatch[1].toLowerCase();
      const rest = customMatch[2] || '';

      if (rest.endsWith(':::')) {
        // 单行格式：:::lead 本文核心要点...:::
        const singleContent = rest.replace(/:::\s*$/, '').trim();
        const rendered = renderCustomComponent(compType, singleContent, {
          primary,
          secondary,
          textColor,
          fontSize,
          lineHeight,
        });
        if (rendered) htmlParts.push(rendered);
      } else {
        // 多行格式开始
        inCustomBlock = true;
        customBlockType = compType;
        customBlockBuffer = rest ? [rest] : [];
      }
      continue;
    }

    // 3. 表格处理
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      const cells = trimmed
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));
      if (!isSeparator) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    // 4. 列表处理
    if (/^[-*+]\s+/.test(trimmed)) {
      flushTable();
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
      }
      listBuffer.push(trimmed.replace(/^[-*+]\s+/, ''));
      continue;
    } else if (/^\d+\.\s+/.test(trimmed)) {
      flushTable();
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
      }
      listBuffer.push(trimmed.replace(/^\d+\.\s+/, ''));
      continue;
    } else if (inList && trimmed) {
      listBuffer[listBuffer.length - 1] += ' ' + trimmed;
      continue;
    } else if (inList && !trimmed) {
      flushList();
    }

    // 空行
    if (!trimmed) {
      continue;
    }

    // 5. 一级标题 (H1) - 微信大头条风格
    if (trimmed.startsWith('# ')) {
      flushList();
      flushTable();
      const text = trimmed.slice(2);
      htmlParts.push(`
        <section style="margin:28px 0 18px 0;text-align:center;box-sizing:border-box;">
          <h1 style="display:inline-block;margin:0;padding:6px 16px;font-size:${fontSize + 6}px;font-weight:900;color:${primary};letter-spacing:1px;line-height:1.4;border-bottom:3px solid ${primary};">
            ${formatInline(text, primary)}
          </h1>
        </section>
      `);
      continue;
    }

    // 6. 二级标题 (H2) - 稳定边框左竖条风格（100% 微信兼容，绝不因 flex 丢失而断行）
    if (trimmed.startsWith('## ')) {
      flushList();
      flushTable();
      const text = trimmed.slice(3);
      htmlParts.push(`
        <section style="margin:30px 0 16px 0;border-left:5px solid ${primary};padding-left:12px;box-sizing:border-box;">
          <h2 style="margin:0;font-size:${fontSize + 3}px;font-weight:800;color:${textColor};letter-spacing:0.5px;line-height:1.35;">
            ${formatInline(text, primary)}
          </h2>
        </section>
      `);
      continue;
    }

    // 7. 三级标题 (H3)
    if (trimmed.startsWith('### ')) {
      flushList();
      flushTable();
      const text = trimmed.slice(4);
      htmlParts.push(`
        <section style="margin:22px 0 10px 0;box-sizing:border-box;">
          <h3 style="margin:0;font-size:${fontSize + 1}px;font-weight:700;color:${primary};line-height:1.4;">
            ${formatInline(text, primary)}
          </h3>
        </section>
      `);
      continue;
    }

    // 8. 引用块 (Blockquote) - 优雅质感卡片
    if (trimmed.startsWith('>')) {
      flushList();
      flushTable();
      const text = trimmed.replace(/^>\s?/, '');
      htmlParts.push(`
        <section style="margin:18px 0;padding:14px 18px;background-color:${secondary};border-left:4px solid ${primary};border-radius:0 8px 8px 0;color:${textColor};font-size:${fontSize}px;line-height:${lineHeight};box-sizing:border-box;">
          <p style="margin:0;opacity:0.95;">${formatInline(text, primary)}</p>
        </section>
      `);
      continue;
    }

    // 9. 分割线（采用 inline-block 居中三段式，微信端 100% 居中永不折行）
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList();
      flushTable();
      htmlParts.push(`
        <section style="margin:28px auto;text-align:center;box-sizing:border-box;">
          <span style="display:inline-block;width:35px;height:1px;background-color:#cbd5e1;vertical-align:middle;"></span>
          <span style="display:inline-block;width:6px;height:6px;background-color:${primary};border-radius:50%;vertical-align:middle;margin:0 8px;"></span>
          <span style="display:inline-block;width:35px;height:1px;background-color:#cbd5e1;vertical-align:middle;"></span>
        </section>
      `);
      continue;
    }

    // 10. 图片处理
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      flushList();
      flushTable();
      const alt = imgMatch[1] || '';
      const src = imgMatch[2] || '';
      htmlParts.push(`
        <figure style="margin:22px 0;text-align:center;box-sizing:border-box;">
          <img src="${src}" alt="${alt}" style="max-width:100%;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,0.08);display:inline-block;vertical-align:middle;" />
          ${alt ? `<figcaption style="margin-top:8px;font-size:${fontSize - 3}px;color:#64748b;letter-spacing:0.3px;">${alt}</figcaption>` : ''}
        </figure>
      `);
      continue;
    }

    // 11. 普通段落（双保险：内层包裹显式 span，彻底避免微信插入全局默认深灰黑）
    htmlParts.push(`
      <p style="margin:16px 0;font-size:${fontSize}px;line-height:${lineHeight};letter-spacing:0.5px;color:${textColor};text-align:justify;word-break:break-word;box-sizing:border-box;">
        <span style="color:${textColor};font-size:${fontSize}px;line-height:${lineHeight};">${formatInline(trimmed, primary)}</span>
      </p>
    `);
  }

  // 清理可能未闭合的自定义块
  if (inCustomBlock) {
    const rendered = renderCustomComponent(customBlockType, customBlockBuffer.join('\n'), {
      primary,
      secondary,
      textColor,
      fontSize,
      lineHeight,
    });
    if (rendered) htmlParts.push(rendered);
  }

  flushList();
  flushTable();

  // 组装总微信容器 (微信富文本一等公民：使用 section 替代 div，保证微信 UEditor 零清洗)
  return `
    <section class="wechat-format-container" style="max-width:677px;margin:0 auto;padding:16px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:${fontSize}px;color:${textColor};background:#ffffff;box-sizing:border-box;-webkit-font-smoothing:antialiased;">
      ${htmlParts.join('\n')}
    </section>
  `.trim();
}

/**
 * 格式化内联样式：加粗、划重点、代码、链接、斜体
 */
function formatInline(text, primary) {
  if (!text) return '';

  let out = escapeHtml(text);

  // 1. 加粗 **text** -> 带有主题强调色或深色加粗
  out = out.replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight:700;color:${primary};">$1</strong>`);

  // 2. 斜体 *text*
  out = out.replace(/\*(.+?)\*/g, `<em style="font-style:italic;opacity:0.9;">$1</em>`);

  // 3. 行内代码 `code`
  out = out.replace(
    /`(.+?)`/g,
    `<code style="padding:2px 6px;margin:0 2px;background:#f1f5f9;color:#0f172a;font-family:Menlo,Monaco,Consolas,monospace;font-size:88%;border-radius:4px;border:1px solid #e2e8f0;">$1</code>`
  );

  // 4. 超链接 [title](url)
  out = out.replace(
    /\[(.*?)\]\((.*?)\)/g,
    `<a href="$2" target="_blank" style="color:${primary};text-decoration:underline;font-weight:500;">$1</a>`
  );

  return out;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
