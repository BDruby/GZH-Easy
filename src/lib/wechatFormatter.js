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
 * 微信公众号专用增强排版组件渲染器
 * 核心原则：不使用脆弱的 flex/gap，优先采用 table 与纯内联行内块，保证微信后台粘贴 100% 还原
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
          ${formatInline(content, primary)}
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
          ${formatInline(content, primary)}
        </p>
        <div style="font-size: 26px; color: ${primary}; line-height: 1; margin-top: 6px; font-family: Georgia, serif;">”</div>
      </section>
    `;
  }

  // 3. 步骤徽章 :::step
  if (lowerType === 'step') {
    const parts = content.split(/[|｜]/);
    let stepTag = 'STEP';
    let stepText = content;
    if (parts.length >= 2) {
      stepTag = parts[0].trim();
      stepText = parts.slice(1).join('｜').trim();
    }
    return `
      <section style="margin: 28px 0 14px 0; box-sizing: border-box;">
        <table style="border-collapse: collapse; border: none; margin: 0; padding: 0; background: transparent;">
          <tbody>
            <tr>
              <td style="vertical-align: middle; padding: 0 10px 0 0; border: none;">
                <span style="display: inline-block; padding: 3px 10px; background-color: ${primary}; color: #ffffff; border-radius: 6px; font-size: 12px; font-weight: bold; letter-spacing: 1px; font-family: Menlo, Monaco, Consolas, monospace; line-height: 1.4; text-align: center; white-space: nowrap;">
                  ${stepTag}
                </span>
              </td>
              <td style="vertical-align: middle; padding: 0; border: none;">
                <span style="font-size: ${fontSize + 2}px; font-weight: 800; color: ${textColor}; line-height: 1.4; letter-spacing: 0.3px;">
                  ${formatInline(stepText, primary)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    `;
  }

  // 4. 作者签名栏 :::author（采用 table 双栏布局与经典行高居中，100% 微信富文本兼容）
  if (lowerType === 'author') {
    const parts = content.split(/[|｜]/);
    const authorName = parts[0]?.trim() || '本文作者';
    const authorBio = parts[1]?.trim() || '专注于深度思考、优质干货与实战复盘。关注我们，持续获得认知进化。';
    const initialChar = authorName.slice(0, 1);

    return `
      <section style="margin: 36px 0 24px 0; padding: 18px 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; box-sizing: border-box;">
        <table style="width: 100%; border-collapse: collapse; border: none; margin: 0; padding: 0; background: transparent;">
          <tbody>
            <tr>
              <td style="width: 50px; vertical-align: middle; padding: 0; border: none; text-align: center;">
                <span style="display: block; width: 44px; height: 44px; line-height: 44px; border-radius: 50%; background-color: ${primary}; color: #ffffff; font-size: 18px; font-weight: bold; text-align: center; margin: 0 auto; box-sizing: border-box; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);">
                  ${initialChar}
                </span>
              </td>
              <td style="vertical-align: middle; padding: 0 0 0 14px; border: none;">
                <section style="margin: 0; padding: 0;">
                  <div style="font-size: 15px; font-weight: bold; color: ${textColor}; line-height: 1.4; margin-bottom: 4px;">
                    ${formatInline(authorName, primary)}
                  </div>
                  <div style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
                    ${formatInline(authorBio, primary)}
                  </div>
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
        <div style="font-size: 13px; font-weight: bold; color: #15803d; margin-bottom: 5px;">
          💡 核心要点 / TIP
        </div>
        <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; color: #166534;">
          ${formatInline(content, '#15803d')}
        </p>
      </section>
    `;
  }

  // 6. 避坑警示注意 :::warning
  if (lowerType === 'warning') {
    return `
      <section style="margin: 24px 0; padding: 14px 18px; background-color: #fff7ed; border: 1px solid #fed7aa; border-left: 4px solid #ea580c; border-radius: 8px; box-sizing: border-box;">
        <div style="font-size: 13px; font-weight: bold; color: #c2410c; margin-bottom: 5px;">
          ⚠️ 避坑提醒 / WARNING
        </div>
        <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; color: #9a3412;">
          ${formatInline(content, '#c2410c')}
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
        <div style="font-size: 32px; font-weight: 900; color: ${primary}; line-height: 1.2; letter-spacing: 1px; font-family: Menlo, Monaco, Consolas, sans-serif;">
          ${formatInline(val, primary)}
        </div>
        <div style="font-size: 13px; font-weight: 500; color: #64748b; margin-top: 6px; letter-spacing: 0.5px;">
          ${formatInline(label, primary)}
        </div>
      </section>
    `;
  }

  // 8. 票据对比卡 :::card
  if (lowerType === 'card') {
    return `
      <section style="margin: 24px 0; padding: 16px 20px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 10px; box-sizing: border-box; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
        <div style="font-size: 12px; font-weight: bold; color: #854d0e; letter-spacing: 1px; margin-bottom: 6px;">
          🧾 深度拆解 · NOTE
        </div>
        <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; color: #713f12;">
          ${formatInline(content, '#854d0e')}
        </p>
      </section>
    `;
  }

  // 9. 黑金极客悬浮金句卡 :::goldquote
  if (lowerType === 'goldquote') {
    return `
      <section style="margin: 28px 0; padding: 22px 24px; background: linear-gradient(135deg, #18181b 0%, #09090b 100%); border: 1px solid #d97706; border-radius: 14px; box-sizing: border-box; box-shadow: 0 8px 24px rgba(0,0,0,0.25); text-align: center; position: relative;">
        <div style="font-size: 32px; color: #f59e0b; line-height: 1; margin-bottom: 4px; font-family: Georgia, serif; font-weight: bold; opacity: 0.9;">“</div>
        <p style="margin: 0; font-size: ${fontSize + 1}px; font-weight: 700; color: #fef3c7; line-height: 1.7; letter-spacing: 0.6px;">
          ${formatInline(content, '#fbbf24')}
        </p>
        <div style="font-size: 32px; color: #f59e0b; line-height: 1; margin-top: 4px; font-family: Georgia, serif; font-weight: bold; opacity: 0.9;">”</div>
        <div style="margin-top: 10px; font-size: 11px; color: #b45309; letter-spacing: 1.5px; text-transform: uppercase; font-family: Menlo, monospace;">
          ★ GOLDEN INSIGHT ★
        </div>
      </section>
    `;
  }

  // 10. 微信真实对话问答气泡 :::qa
  if (lowerType === 'qa') {
    const parts = content.split(/[|｜]/);
    const qText = parts[0]?.trim() || '读者提问：请问如何抓住当下的核心破局红利？';
    const aText = parts[1]?.trim() || '主理人回答：核心不是盲目追风，而是用底层逻辑重构你的交付流程。';
    return `
      <section style="margin: 26px 0; box-sizing: border-box;">
        <!-- 读者提问行 (左侧) -->
        <table style="width: 100%; border-collapse: collapse; border: none; margin: 0 0 14px 0; padding: 0;">
          <tbody>
            <tr>
              <td style="width: 38px; vertical-align: top; padding: 0 10px 0 0; border: none;">
                <span style="display: block; width: 34px; height: 34px; line-height: 34px; border-radius: 50%; background: #94a3b8; color: #ffffff; font-size: 13px; font-weight: bold; text-align: center;">
                  问
                </span>
              </td>
              <td style="vertical-align: top; border: none;">
                <div style="display: inline-block; background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; border-top-left-radius: 2px; padding: 10px 14px; font-size: ${fontSize - 1}px; line-height: 1.6; color: #334155; text-align: justify; max-width: 90%;">
                  ${formatInline(qText, '#2563eb')}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- 主理人回答行 (右侧) -->
        <table style="width: 100%; border-collapse: collapse; border: none; margin: 0; padding: 0;">
          <tbody>
            <tr>
              <td style="vertical-align: top; text-align: right; border: none;">
                <div style="display: inline-block; background-color: ${hexToRgba(primary, 0.12)}; border: 1px solid ${hexToRgba(primary, 0.3)}; border-radius: 12px; border-top-right-radius: 2px; padding: 10px 14px; font-size: ${fontSize - 1}px; line-height: 1.6; color: ${textColor}; text-align: justify; max-width: 90%;">
                  ${formatInline(aText, primary)}
                </div>
              </td>
              <td style="width: 38px; vertical-align: top; padding: 0 0 0 10px; border: none; text-align: right;">
                <span style="display: block; width: 34px; height: 34px; line-height: 34px; border-radius: 50%; background-color: ${primary}; color: #ffffff; font-size: 13px; font-weight: bold; text-align: center; margin-left: auto;">
                  答
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    `;
  }

  // 11. 发光时间线节点 :::timeline
  if (lowerType === 'timeline') {
    const items = content.split(/[;；]/).map(s => s.trim()).filter(Boolean);
    const nodesHtml = items.map((item, idx) => {
      const parts = item.split(/[|｜]/);
      const timeNode = parts[0]?.trim() || `阶段 0${idx + 1}`;
      const textNode = parts.slice(1).join('｜').trim() || item;
      return `
        <tr>
          <td style="width: 22px; vertical-align: top; padding: 0 8px 18px 0; border: none; position: relative;">
            <span style="display: block; width: 12px; height: 12px; border-radius: 50%; background-color: ${primary}; border: 2px solid #ffffff; box-shadow: 0 0 0 2px ${primary}; margin: 3px auto 0 auto;"></span>
          </td>
          <td style="vertical-align: top; padding: 0 0 18px 0; border: none; border-left: 2px solid ${hexToRgba(primary, 0.3)}; padding-left: 12px;">
            <div style="font-size: 13px; font-weight: bold; color: ${primary}; font-family: Menlo, monospace; margin-bottom: 2px;">
              ${formatInline(timeNode, primary)}
            </div>
            <div style="font-size: ${fontSize - 1}px; line-height: 1.6; color: ${textColor};">
              ${formatInline(textNode, primary)}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <section style="margin: 26px 0; padding: 4px 8px; box-sizing: border-box;">
        <table style="width: 100%; border-collapse: collapse; border: none; margin: 0; padding: 0;">
          <tbody>
            ${nodesHtml}
          </tbody>
        </table>
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
                <div style="font-size: 13px; font-weight: bold; color: #e11d48; margin-bottom: 6px; display: flex; align-items: center;">
                  ❌ 常见避坑误区
                </div>
                <div style="font-size: ${fontSize - 2}px; line-height: 1.6; color: #9f1239; text-align: justify;">
                  ${formatInline(wrongText, '#e11d48')}
                </div>
              </td>
              <!-- 右侧破局 -->
              <td style="width: 50%; vertical-align: top; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px; border: none;">
                <div style="font-size: 13px; font-weight: bold; color: #16a34a; margin-bottom: 6px; display: flex; align-items: center;">
                  ✔️ 高效破局解法
                </div>
                <div style="font-size: ${fontSize - 2}px; line-height: 1.6; color: #166534; text-align: justify;">
                  ${formatInline(rightText, '#16a34a')}
                </div>
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
      <section style="margin: 36px 0 20px 0; padding: 22px 18px; background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 1px dashed #cbd5e1; border-radius: 16px; text-align: center; box-sizing: border-box;">
        <span style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background-color: ${primary}; color: #ffffff; font-size: 22px; font-weight: bold; margin-bottom: 10px; box-shadow: 0 4px 12px ${hexToRgba(primary, 0.4)};">
          ★
        </span>
        <div style="font-size: 16px; font-weight: 800; color: ${textColor}; letter-spacing: 0.5px; margin-bottom: 6px;">
          ${formatInline(brandName, primary)}
        </div>
        <p style="margin: 0 auto 14px auto; font-size: 13px; line-height: 1.6; color: #64748b; max-width: 90%;">
          ${formatInline(slogan, primary)}
        </p>
        <div style="display: inline-block; padding: 6px 18px; border-radius: 20px; background-color: ${primary}; color: #ffffff; font-size: 12px; font-weight: bold; letter-spacing: 1px;">
          长按上方公众号名片 · 关注我们
        </div>
      </section>
    `;
  }

  // 14. 文末点赞三连仪式感卡 :::interact
  if (lowerType === 'interact') {
    return `
      <section style="margin: 30px 0; padding: 18px 20px; background-color: #fafafa; border-radius: 12px; text-align: center; box-sizing: border-box; border: 1px solid #eaeaea;">
        <div style="font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 12px; letter-spacing: 0.5px;">
          ${formatInline(content || '如果觉得本文有启发，欢迎点击下方互动支持我们：', primary)}
        </div>
        <table style="margin: 0 auto; border-collapse: collapse; border: none;">
          <tbody>
            <tr>
              <td style="padding: 0 10px; border: none; text-align: center;">
                <span style="display: inline-block; padding: 6px 14px; border-radius: 20px; background-color: #ffffff; border: 1px solid #e2e8f0; font-size: 12px; color: #334155; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
                  👍 点赞
                </span>
              </td>
              <td style="padding: 0 10px; border: none; text-align: center;">
                <span style="display: inline-block; padding: 6px 14px; border-radius: 20px; background-color: #ffffff; border: 1px solid #e2e8f0; font-size: 12px; color: #334155; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
                  🌟 在看
                </span>
              </td>
              <td style="padding: 0 10px; border: none; text-align: center;">
                <span style="display: inline-block; padding: 6px 14px; border-radius: 20px; background-color: #ffffff; border: 1px solid #e2e8f0; font-size: 12px; color: #334155; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
                  ✈️ 分享朋友圈
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    `;
  }

  // 15. 马克笔荧光划线高光 :::highlight
  if (lowerType === 'highlight') {
    return `
      <section style="margin: 20px 0; padding: 8px 12px; box-sizing: border-box;">
        <span style="font-size: ${fontSize}px; line-height: 1.8; color: ${textColor}; background: linear-gradient(180deg, transparent 60%, #fef08a 60%); padding: 2px 4px; font-weight: bold; border-radius: 2px;">
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
          <div style="font-size: 24px; font-weight: 900; color: ${primary}; line-height: 1.2; font-family: Menlo, monospace;">
            ${formatInline(val, primary)}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
            ${formatInline(label, primary)}
          </div>
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

  // ==================== 微信黑科技 SVG 交互组件系列 ====================

  // 17. 微信黑科技：点击变身卡片 :::svg-morph
  // 利用微信原生 SVG 的 animate 触发机制，读者轻触上层封面，上层瞬间隐去露出下层真相
  if (lowerType === 'svg-morph') {
    const parts = content.split(/[|｜]/);
    const coverText = parts[0]?.trim() || '👉 点击此处，揭秘关键底层认知！';
    const revealText = parts[1]?.trim() || '🎉 恭喜揭秘：认知升级不是掌握更多信息，而是升级判断框架！';

    return `
      <section style="margin: 28px 0; text-align: center; box-sizing: border-box;">
        <svg viewBox="0 0 600 220" style="width: 100%; max-width: 600px; height: auto; display: block; margin: 0 auto; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); background: #0f172a;" xmlns="http://www.w3.org/2000/svg">
          <!-- 下层底板：揭示后的精彩内容 -->
          <g>
            <rect width="600" height="220" fill="#f8fafc" />
            <rect x="15" y="15" width="570" height="190" rx="10" fill="#ffffff" stroke="${primary}" stroke-width="2" stroke-dasharray="6,4" />
            <text x="300" y="60" text-anchor="middle" font-size="14" font-weight="bold" fill="${primary}" letter-spacing="2">★ 揭秘成功 · INSIGHT UNLOCKED ★</text>
            <foreignObject x="40" y="75" width="520" height="120">
              <div xmlns="http://www.w3.org/1999/xhtml" style="font-size: 15px; font-weight: bold; color: #1e293b; line-height: 1.6; text-align: center; padding: 10px; display: flex; align-items: center; justify-content: center; height: 100%; box-sizing: border-box;">
                ${escapeHtml(revealText)}
              </div>
            </foreignObject>
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

            <!-- 微信原生黑科技动画：点击淡出并隐藏上层 -->
            <animate attributeName="opacity" begin="click" from="1" to="0" dur="0.25s" fill="freeze" restart="never" />
            <animate attributeName="transform" begin="click" type="scale" from="1" to="0.95" dur="0.25s" fill="freeze" restart="never" />
            <animate attributeName="display" begin="click" from="inline" to="none" dur="0.26s" fill="freeze" restart="never" />
          </g>
        </svg>
      </section>
    `;
  }

  // 18. 微信黑科技：长按蓄力卡片 :::svg-charge
  if (lowerType === 'svg-charge') {
    const parts = content.split(/[|｜]/);
    const holdPrompt = parts[0]?.trim() || '按住蓄力 · 充能解开终极锦囊';
    const eggText = parts[1]?.trim() || '⚡ 蓄力满格！真正的红利永远属于提前深耕长期价值的行动者！';

    return `
      <section style="margin: 28px 0; text-align: center; box-sizing: border-box;">
        <svg viewBox="0 0 600 230" style="width: 100%; max-width: 600px; height: auto; display: block; margin: 0 auto; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.1); background: #1e1b4b;" xmlns="http://www.w3.org/2000/svg">
          <!-- 背景底色 -->
          <rect width="600" height="230" fill="#18181b" />
          <rect x="12" y="12" width="576" height="206" rx="10" fill="#1e1e24" stroke="#4338ca" stroke-width="1.5" />

          <!-- 底层揭示彩蛋 -->
          <g>
            <text x="300" y="65" text-anchor="middle" font-size="13" font-weight="bold" fill="#818cf8" letter-spacing="2">🔋 蓄力释放 · POWER RELEASED</text>
            <foreignObject x="30" y="80" width="540" height="120">
              <div xmlns="http://www.w3.org/1999/xhtml" style="font-size: 15px; font-weight: bold; color: #e0e7ff; line-height: 1.6; text-align: center; padding: 10px; display: flex; align-items: center; justify-content: center; height: 100%; box-sizing: border-box;">
                ${escapeHtml(eggText)}
              </div>
            </foreignObject>
          </g>

          <!-- 顶层遮罩与长按蓄力能量环 -->
          <g style="cursor: pointer;">
            <rect width="600" height="230" fill="#09090b" opacity="0.96" />
            <!-- 蓄力能量条轨道 -->
            <rect x="150" y="110" width="300" height="12" rx="6" fill="#27272a" />
            <!-- 蓄力充能进度条动画 -->
            <rect x="150" y="110" width="0" height="12" rx="6" fill="#6366f1">
              <animate attributeName="width" begin="click" from="0" to="300" dur="0.8s" fill="freeze" restart="never" />
              <animate attributeName="fill" begin="click" from="#6366f1" to="#a855f7" dur="0.8s" fill="freeze" restart="never" />
            </rect>

            <!-- 蓄力图标 -->
            <circle cx="300" cy="65" r="22" fill="#18181b" stroke="#6366f1" stroke-width="2" />
            <text x="300" y="72" text-anchor="middle" font-size="18" fill="#a5b4fc">⚡</text>

            <text x="300" y="155" text-anchor="middle" font-size="15" font-weight="bold" fill="#ffffff" letter-spacing="1">
              ${escapeHtml(holdPrompt)}
            </text>
            <text x="300" y="185" text-anchor="middle" font-size="11" fill="#71717a" letter-spacing="0.5">
              👇 点击/按住卡片蓄力充满能量条
            </text>

            <!-- 蓄满后淡出顶层盖板 -->
            <animate attributeName="opacity" begin="click+0.85s" from="0.96" to="0" dur="0.3s" fill="freeze" restart="never" />
            <animate attributeName="display" begin="click+1.1s" from="inline" to="none" dur="0.01s" fill="freeze" restart="never" />
          </g>
        </svg>
      </section>
    `;
  }

  // 19. 微信黑科技：折叠画卷展开 :::svg-unfold
  // 默认优雅收起，读者轻触“点击展开长卷”，画卷向下延伸呈现完整详尽图文
  if (lowerType === 'svg-unfold') {
    const parts = content.split(/[|｜]/);
    const unfoldTitle = parts[0]?.trim() || '📜 点击展开完整长卷与详细实操大纲';
    const detailContent = parts.slice(1).join('｜').trim() || '这里是展开后展现的完整知识图谱、详细方法论与关键实操指引，长篇干货一览无余。';

    return `
      <section style="margin: 28px 0; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); background: #ffffff; box-sizing: border-box;">
        <!-- 卷轴顶部标头 -->
        <div style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 14px; font-weight: bold; color: ${textColor}; display: flex; align-items: center; gap: 6px;">
            📜 ${formatInline(unfoldTitle, primary)}
          </span>
          <span style="font-size: 11px; color: #94a3b8; font-family: monospace;">点击下方手柄展开</span>
        </div>

        <!-- 可展开的内容区域 (利用微信原生 SVG height 延伸机制) -->
        <svg viewBox="0 0 600 320" style="width: 100%; max-width: 600px; height: 110px; display: block; margin: 0 auto; overflow: hidden; transition: all 0.3s ease;" xmlns="http://www.w3.org/2000/svg">
          <animate attributeName="height" begin="click" from="110px" to="320px" dur="0.35s" fill="freeze" restart="never" />

          <!-- 内容主体 -->
          <foreignObject x="20" y="10" width="560" height="250">
            <div xmlns="http://www.w3.org/1999/xhtml" style="font-size: ${fontSize - 1}px; line-height: 1.8; color: ${textColor}; padding: 12px; text-align: justify;">
              ${escapeHtml(detailContent)}
            </div>
          </foreignObject>

          <!-- 底部渐变遮罩与“点击展开”按钮提示 (展开后淡出) -->
          <g style="cursor: pointer;">
            <rect x="0" y="30" width="600" height="80" fill="url(#unfoldFadeGrad)" opacity="0.95" />
            <rect x="220" y="65" width="160" height="32" rx="16" fill="${primary}" />
            <text x="300" y="86" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">▼ 点击展开长卷</text>

            <animate attributeName="opacity" begin="click" from="0.95" to="0" dur="0.25s" fill="freeze" restart="never" />
            <animate attributeName="display" begin="click+0.25s" from="inline" to="none" dur="0.01s" fill="freeze" restart="never" />
          </g>

          <defs>
            <linearGradient id="unfoldFadeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.1" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="1" />
            </linearGradient>
          </defs>
        </svg>
      </section>
    `;
  }

  // 20. 微信横向滑动相册卡片走马灯 :::svg-scroll
  if (lowerType === 'svg-scroll') {
    const rawCards = content.split('||').map(s => s.trim()).filter(Boolean);
    const cardsHtml = rawCards.map((c, i) => {
      const parts = c.split(/[::：]/);
      const title = parts[0]?.trim() || `核心亮点 0${i + 1}`;
      const desc = parts.slice(1).join('：').trim() || c;
      return `
        <div style="display: inline-block; vertical-align: top; width: 220px; white-space: normal; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin-right: 12px; box-sizing: border-box; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
          <div style="font-size: 13px; font-weight: bold; color: ${primary}; margin-bottom: 6px;">
            ${formatInline(title, primary)}
          </div>
          <div style="font-size: 12px; line-height: 1.6; color: #475569; text-align: justify;">
            ${formatInline(desc, primary)}
          </div>
        </div>
      `;
    }).join('');

    return `
      <section style="margin: 26px 0; box-sizing: border-box;">
        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px; text-align: right; padding-right: 4px;">
          👉 左右滑动查看卡片 ⇄
        </div>
        <div style="overflow-x: auto; -webkit-overflow-scrolling: touch; white-space: nowrap; padding: 4px 0 10px 0;">
          ${cardsHtml}
        </div>
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
          <section style="margin:20px 0;border-radius:10px;overflow:hidden;background:#1e1e1e;box-shadow:0 4px 16px rgba(0,0,0,0.15);box-sizing:border-box;">
            <table style="width:100%;background:#2d2d2d;border-bottom:1px solid #3d3d3d;border-collapse:collapse;border:none;padding:0;margin:0;">
              <tbody>
                <tr>
                  <td style="padding:8px 14px;vertical-align:middle;border:none;">
                    <span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:#ff5f56;margin-right:6px;vertical-align:middle;"></span>
                    <span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:#ffbd2e;margin-right:6px;vertical-align:middle;"></span>
                    <span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:#27c93f;vertical-align:middle;"></span>
                  </td>
                  <td style="padding:8px 14px;text-align:right;vertical-align:middle;border:none;">
                    <span style="font-size:11px;color:#9ca3af;font-family:Menlo,Monaco,Consolas,monospace;text-transform:uppercase;">${codeLang || 'code'}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <pre style="margin:0;padding:14px 16px;overflow-x:auto;color:#d4d4d4;font-family:Menlo,Monaco,Consolas,monospace;font-size:13px;line-height:1.6;letter-spacing:0.3px;white-space:pre-wrap;word-break:break-all;"><code>${codeContent}</code></pre>
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

    // 11. 普通段落
    htmlParts.push(`
      <p style="margin:16px 0;font-size:${fontSize}px;line-height:${lineHeight};letter-spacing:0.5px;color:${textColor};text-align:justify;word-break:break-word;box-sizing:border-box;">
        ${formatInline(trimmed, primary)}
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

  // 组装总微信容器 (宽度 100% / 最大 677px 微信标准)
  return `
    <div class="wechat-format-container" style="max-width:677px;margin:0 auto;padding:16px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:${fontSize}px;color:${textColor};background:#ffffff;box-sizing:border-box;-webkit-font-smoothing:antialiased;">
      ${htmlParts.join('\n')}
    </div>
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
