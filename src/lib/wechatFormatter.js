// 微信公众号专业排版引擎（融合 Doocs Markdown 与 gzh-design-skill 经典主题与排版组件）
// 核心机制：将 Markdown 与增强排版组件转化为 100% 纯内联样式 (Inlined CSS) HTML，避免样式被微信公众号过滤与破坏

export const WECHAT_THEMES = [
  {
    id: 'macos27-glass',
    name: '🫧 macOS 27 液态玻璃 (最新)',
    primaryColor: '#0071e3',
    secondaryColor: '#f0f6ff',
    textColor: '#1d1d1f',
    desc: 'Apple 概念液态微晶玻璃设计语言，晶莹通透、高光折射、红黄绿窗口质感，100% 微信公众号排版认证',
  },
  {
    id: 'claude-anthropic',
    name: '✦ Claude · 智性思辨 (Anthropic)',
    primaryColor: '#d97757',
    secondaryColor: '#faf9f5',
    textColor: '#262320',
    desc: 'Anthropic / Claude.ai 人文设计语言：暖陶土色、温润燕麦米色纸质感、优雅八角星芒徽章、人文衬线深度阅读，100% 微信公众号排版认证',
  },
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
 * 智能检测图片的真实类型，用于微信规范 data-type
 */
function detectImgDataType(url) {
  if (!url) return 'jpeg';
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.png') || clean.startsWith('data:image/png')) return 'png';
  if (clean.endsWith('.gif') || clean.startsWith('data:image/gif')) return 'gif';
  if (clean.endsWith('.webp') || clean.startsWith('data:image/webp')) return 'webp';
  return 'jpeg';
}

/**
 * 规范化图片地址：强制 Unsplash 等外链输出 JPEG 格式，杜绝微信后台因不支持 WebP 导致下载失败
 */
export function cleanImageUrl(url) {
  if (!url) return '';
  return url.replace(/auto=format/g, 'fm=jpg');
}

/**
 * 微信公众号专用：苹果 macOS 红黄绿三色窗口小圆点 + 标题头部
 * 采用原生无边框 Table + 原生内联 SVG 架构：
 * 1. 彻底根除微信后台 UEditor 强力清洗“空 span 标签”导致三色圆点消失的顽疾！
 * 2. 彻底杜绝文字折行或与圆点错位
 */
function renderMacosTrafficLights(title = '', titleColor = '#0071e3', align = 'left') {
  const marginStyle = align === 'center' ? 'margin: 0 auto 14px auto;' : 'margin: 0 0 14px 0;';
  const trafficLightsSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="39" height="11" viewBox="0 0 39 11" style="display: block; width: 39px; height: 11px;">
      <circle cx="5.5" cy="5.5" r="4.5" fill="#ff5f56" stroke="#e0443e" stroke-width="0.5" />
      <circle cx="19.5" cy="5.5" r="4.5" fill="#ffbd2e" stroke="#dea123" stroke-width="0.5" />
      <circle cx="33.5" cy="5.5" r="4.5" fill="#27c93f" stroke="#1aab29" stroke-width="0.5" />
    </svg>
  `.trim();

  if (!title) {
    return `
      <section style="${align === 'center' ? 'text-align: center; margin: 0 auto 14px auto;' : 'text-align: left; margin: 0 0 14px 0;'} line-height: 1; box-sizing: border-box;">
        <section style="display: inline-block; vertical-align: middle;">
          ${trafficLightsSvg}
        </section>
      </section>
    `.trim();
  }

  return `
    <table style="border-collapse: collapse; border: none; ${marginStyle} padding: 0; background: transparent !important; width: auto !important; table-layout: auto;">
      <tbody>
        <tr style="border: none; background: transparent !important;">
          <td style="border: none; padding: 0 8px 0 0; vertical-align: middle; line-height: 1; width: 39px;">
            ${trafficLightsSvg}
          </td>
          <td style="border: none; padding: 0; vertical-align: middle; line-height: 1; white-space: nowrap !important;">
            <span style="display: inline-block; font-size: 11px; font-weight: 700; color: ${titleColor}; letter-spacing: 0.8px; text-transform: uppercase; white-space: nowrap !important; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif;">${title}</span>
          </td>
        </tr>
      </tbody>
    </table>
  `.trim();
}

/**
 * 微信公众号专用：macOS 单色状态圆点徽章头部（内联 SVG + Table 锁死，绝不分散或被微信过滤）
 */
function renderMacosSingleDotHeader(dotColor, title, titleColor) {
  const dotSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 9 9" style="display: block; width: 9px; height: 9px;">
      <circle cx="4.5" cy="4.5" r="4" fill="${dotColor}" />
    </svg>
  `.trim();
  return `
    <table style="border-collapse: collapse; border: none; margin: 0 0 10px 0; padding: 0; background: transparent !important; width: auto !important; table-layout: auto;">
      <tbody>
        <tr style="border: none; background: transparent !important;">
          <td style="border: none; padding: 0 6px 0 0; vertical-align: middle; line-height: 1; width: 10px;">
            ${dotSvg}
          </td>
          <td style="border: none; padding: 0; vertical-align: middle; line-height: 1; white-space: nowrap !important;">
            <span style="display: inline-block; color: ${titleColor}; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; font-family: Menlo, Monaco, monospace; text-transform: uppercase; white-space: nowrap !important;">${title}</span>
          </td>
        </tr>
      </tbody>
    </table>
  `.trim();
}

/**
 * 渲染 Claude / Anthropic 专属八角星芒 (Sparkle SVG)
 * 纯内联矢量，绝不被微信过滤，色值可动态定制
 */
function renderClaudeSparkleSvg(color = '#d97757', size = 14) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="display:inline-block;vertical-align:middle;width:${size}px;height:${size}px;line-height:1;">
      <path d="M12 2C12.3 7.5 16.5 11.7 22 12C16.5 12.3 12.3 16.5 12 22C11.7 16.5 7.5 12.3 2 12C7.5 11.7 11.7 7.5 12 2Z" fill="${color}" />
      <circle cx="12" cy="12" r="2.2" fill="#faf9f5" />
    </svg>
  `.trim();
}

/**
 * 渲染 Claude.ai 卡片顶栏徽标（八角星芒 + 人文大写标签 + 雅致分割细线）
 */
function renderClaudeCardHeader(label, color = '#d97757') {
  return `
    <table data-ignore-width="true" style="width:100% !important;border-collapse:collapse;border:none;margin:0 0 12px 0;padding:0;background:transparent !important;table-layout:auto;">
      <tbody>
        <tr style="border:none;background:transparent !important;">
          <td style="padding:0;border:none;vertical-align:middle;line-height:1;text-align:left;">
            <section style="display:inline-block;vertical-align:middle;line-height:1;">
              ${renderClaudeSparkleSvg(color, 14)}
              <span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:1px;color:${color};text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;vertical-align:middle;margin-left:6px;">
                ${label}
              </span>
            </section>
          </td>
          <td style="padding:0;border:none;vertical-align:middle;line-height:1;text-align:right;">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="2" viewBox="0 0 36 2" style="display:inline-block;vertical-align:middle;width:36px;height:2px;">
              <line x1="0" y1="1" x2="36" y2="1" stroke="${color}" stroke-width="1" stroke-opacity="0.35" stroke-linecap="round" />
            </svg>
          </td>
        </tr>
      </tbody>
    </table>
  `.trim();
}

/**
 * 智能预处理微信 HTML 中的图片：
/**
 * 智能预处理微信 HTML 中的图片：
 * 1. 微信公众号核心铁律：绝对不可在公众号复制内容中使用 Base64 Data URL！微信后台 catchremoteimage 必报“来源信息无法识别，系统错误，重试”！
 * 2. 本地图片 (/uploads/ 等) 自动补齐当前站点的绝对 HTTP/HTTPS 公网地址，让腾讯微信爬虫服务器能正常抓取并转存到微信 CDN (mmbiz.qpic.cn)
 * 3. 如有行内临时 Base64/blob 图片，自动调用 /api/upload 转存为持久公网图片，彻底杜绝失效
 * 4. 外部图片强制去掉 auto=format 转为 fm=jpg，规避微信后台对 WebP/AVIF 的格式拦截
 * 5. 智能检测并填充 data-type（严格匹配 jpeg/png/gif）与 referrerpolicy="no-referrer"，解决防盗链与格式冲突
 */
export async function prepareWechatImages(html, options = {}) {
  if (!html) return '';
  const { forExport = false } = options;

  const imgRegex = /<img\b([^>]*?)>/gi;
  const matches = [...html.matchAll(imgRegex)];
  if (matches.length === 0) return html;

  let resultHtml = html;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  for (const match of matches) {
    const fullTag = match[0];
    const attrs = match[1];

    const srcMatch = attrs.match(/\bsrc=["']([^"']+)["']/i);
    if (!srcMatch) continue;

    let src = srcMatch[1];

    if (forExport) {
      // 单文件离线导出归档：嵌入 Base64 保证单文件可离线查看
      const isLocal =
        src.startsWith('/uploads/') ||
        src.startsWith('/api/') ||
        /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(src) ||
        src.startsWith('blob:');

      if (isLocal) {
        try {
          const response = await fetch(src);
          if (response.ok) {
            const blob = await response.blob();
            const base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            if (base64 && base64.startsWith('data:image/')) {
              src = base64;
            }
          }
        } catch (e) {
          console.warn('Failed to convert local image to Base64 for export:', src, e);
        }
      }
    } else {
      // 微信公众号复制模式：必须是合法 HTTP/HTTPS 链接，坚决杜绝 Base64
      // 1. 如果已是 Base64 或 blob:（例如用户未上传直接粘贴在文章里的内容），自动转存为服务器公网文件
      if ((src.startsWith('data:image/') || src.startsWith('blob:')) && typeof window !== 'undefined') {
        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: src, filename: 'wechat_pasted_img.png' }),
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.ok && uploadData.url) {
              src = uploadData.url.startsWith('/') && origin ? `${origin}${uploadData.url}` : uploadData.url;
            }
          }
        } catch (e) {
          console.warn('Auto upload of Base64 image failed:', e);
        }
      }

      // 2. 如果是相对路径（如 /uploads/paste_xxx.png），自动转换为当前服务器的绝对公网 URL
      if (src.startsWith('/') && origin) {
        src = `${origin}${src}`;
      }
    }

    // 3. 规范化外链（例如强制 Unsplash 转 fm=jpg）
    src = cleanImageUrl(src);

    const dataType = detectImgDataType(src);

    let newAttrs = attrs
      .replace(/\/+$/, '')
      .replace(/\bsrc=["'][^"']+["']/i, `src="${src}"`)
      .replace(/\bdata-src=["'][^"']*["']/i, '')
      .replace(/\bdata-type=["'][^"']*["']/i, '')
      .replace(/\breferrerpolicy=["'][^"']*["']/i, '')
      .trim();

    newAttrs += ` data-src="${src}" data-type="${dataType}" referrerpolicy="no-referrer"`;

    resultHtml = resultHtml.replace(fullTag, `<img ${newAttrs.trim()} />`);
  }

  return resultHtml;
}

/**
 * 微信公众号专用增强排版组件渲染器
 * 核心原则：
 * 1. 杜绝 CSS 继承与渐变丢失导致的“文字背景顺色”，所有背景必须有纯色 background-color 兜底！
 * 2. 所有文本叶子节点显式注入 color 与 font-family，杜绝微信后台清洗覆盖默认黑字！
 * 3. 避免脆弱的 flex/gap，优先采用 table 与纯内联行内块，保证微信后台粘贴 100% 还原！
 */
function renderCustomComponent(type, rawContent, { primary, secondary, textColor, fontSize, lineHeight, isMacosGlass, isClaude }) {
  const content = (rawContent || '').trim();
  const lowerType = (type || '').toLowerCase();

  // 1. 导读卡 :::lead
  if (lowerType === 'lead') {
    if (isClaude) {
      return `
        <section data-ignore-width="true" style="margin: 26px 0; padding: 20px 22px; background-color: #faf9f5; border: 1px solid rgba(217, 119, 87, 0.28); border-radius: 12px; box-sizing: border-box;">
          ${renderClaudeCardHeader('LEAD IN · 导读', '#d97757')}
          <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; color: #262320; letter-spacing: 0.5px; text-align: justify; word-break: break-all; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <span style="color: #262320; font-size: ${fontSize}px; line-height: ${lineHeight};">${formatInline(content, primary)}</span>
          </p>
        </section>
      `;
    }
    if (isMacosGlass) {
      return `
        <section data-ignore-width="true" style="margin: 24px 0; padding: 18px 20px; background-color: #f4f8ff; border: 1px solid rgba(0, 113, 227, 0.18); border-radius: 16px; box-sizing: border-box; -webkit-font-smoothing: antialiased;">
          ${renderMacosTrafficLights('LEAD IN', '#0071e3')}
          <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; color: #1d1d1f; font-weight: 400; letter-spacing: 0.5px; text-align: justify; word-break: break-all; -webkit-font-smoothing: antialiased; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;">
            <span style="color: #1d1d1f; font-size: ${fontSize}px; line-height: ${lineHeight}; letter-spacing: 0.5px; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;">${formatInline(content, primary)}</span>
          </p>
        </section>
      `;
    }
    const bg = hexToRgba(primary, 0.08);
    const border = hexToRgba(primary, 0.25);
    return `
      <section data-ignore-width="true" style="margin: 24px 0; padding: 16px 18px; background-color: ${bg}; border: 1px solid ${border}; border-left: 5px solid ${primary}; border-radius: 8px; box-sizing: border-box;">
        <div style="font-size: 12px; font-weight: bold; color: ${primary}; letter-spacing: 1px; margin-bottom: 6px;">
          📌 导读 · LEAD IN
        </div>
        <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; color: ${textColor}; font-weight: normal; letter-spacing: 0.5px; text-align: justify; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;">
          <span style="color: ${textColor}; font-size: ${fontSize}px;">${formatInline(content, primary)}</span>
        </p>
      </section>
    `;
  }

  // 2. 居中金句 :::quote
  if (lowerType === 'quote') {
    if (isClaude) {
      return `
        <section data-ignore-width="true" style="margin: 28px 0; padding: 22px 24px; background-color: #faf9f5; border-radius: 14px; border: 1px solid rgba(217, 119, 87, 0.25); text-align: center; box-sizing: border-box;">
          <section style="text-align: center; margin-bottom: 10px; line-height: 1;">
            ${renderClaudeSparkleSvg('#d97757', 18)}
          </section>
          <p style="margin: 0; font-size: ${fontSize + 1}px; font-weight: 600; color: #262320; line-height: 1.75; letter-spacing: 0.6px; font-family: 'Newsreader', Georgia, 'Songti SC', 'Source Han Serif SC', serif;">
            <span style="color: #262320; font-weight: 600; font-family: 'Newsreader', Georgia, 'Songti SC', 'Source Han Serif SC', serif;">“${formatInline(content, primary)}”</span>
          </p>
        </section>
      `;
    }
    if (isMacosGlass) {
      return `
        <section data-ignore-width="true" style="margin: 26px 0; padding: 22px 24px; background-color: #f4f8ff; border-radius: 18px; border: 1px solid rgba(0,113,227,0.18); text-align: center; box-sizing: border-box; -webkit-font-smoothing: antialiased;">
          ${renderMacosTrafficLights('', '#0071e3', 'center')}
          <p style="margin: 0; font-size: ${fontSize + 1}px; font-weight: 600; color: #0071e3; line-height: 1.65; letter-spacing: 0.5px; -webkit-font-smoothing: antialiased; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;">
            <span style="color: #0071e3; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;">“${formatInline(content, primary)}”</span>
          </p>
        </section>
      `;
    }
    const bg = hexToRgba(primary, 0.06);
    const border = hexToRgba(primary, 0.35);
    return `
      <section data-ignore-width="true" style="margin: 28px 0; padding: 20px 22px; background-color: ${bg}; border: 1px dashed ${border}; border-radius: 12px; text-align: center; box-sizing: border-box;">
        <div style="font-size: 26px; color: ${primary}; line-height: 1; margin-bottom: 6px; font-family: Georgia, serif;">“</div>
        <p style="margin: 0; font-size: ${fontSize + 1}px; font-weight: bold; color: ${primary}; line-height: 1.6; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;">
          <span style="color: ${primary}; font-weight: bold;">${formatInline(content, primary)}</span>
        </p>
        <div style="font-size: 26px; color: ${primary}; line-height: 1; margin-top: 6px; font-family: Georgia, serif;">”</div>
      </section>
    `;
  }

  // 3. 步骤徽章 :::step（使用纯行内块 section，防止微信全局 table 劫持导致左侧序号异常拉宽）
  if (lowerType === 'step') {
    const parts = content.split(/[|｜]/);
    let stepTag = 'STEP 01';
    let stepText = content;
    if (parts.length >= 2) {
      stepTag = parts[0].trim();
      stepText = parts.slice(1).join('｜').trim();
    }
    if (isClaude) {
      return `
        <section data-ignore-width="true" style="margin: 28px 0 16px 0; box-sizing: border-box; line-height: 1.5;">
          <section style="display: inline-block; vertical-align: middle; padding: 4px 12px; background-color: #f5ebe6; border-radius: 6px; border: 1px solid rgba(217, 119, 87, 0.35); margin-right: 10px; box-sizing: border-box;">
            <span style="color: #d97757; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; font-family: -apple-system, BlinkMacSystemFont, monospace; line-height: 1; text-align: center; white-space: nowrap; display: inline-block;">${stepTag}</span>
          </section>
          <span style="display: inline-block; vertical-align: middle; font-size: ${fontSize + 2}px; font-weight: 700; color: #262320; line-height: 1.4; letter-spacing: 0.4px; font-family: 'Newsreader', Georgia, 'Songti SC', serif;">
            ${formatInline(stepText, primary)}
          </span>
        </section>
      `;
    }
    if (isMacosGlass) {
      return `
        <section data-ignore-width="true" style="margin: 28px 0 16px 0; box-sizing: border-box; line-height: 1.5;">
          <section style="display: inline-block; vertical-align: middle; padding: 4px 12px; background-color: #e0f2fe; border-radius: 8px; border: 1px solid rgba(0,113,227,0.25); margin-right: 10px; box-sizing: border-box;">
            <span style="color: #0071e3; font-size: 11px; font-weight: 800; letter-spacing: 1px; font-family: Menlo, Monaco, Consolas, monospace; line-height: 1; text-align: center; white-space: nowrap; display: inline-block;">${stepTag}</span>
          </section>
          <span style="display: inline-block; vertical-align: middle; font-size: ${fontSize + 2}px; font-weight: 800; color: #1d1d1f; line-height: 1.4; letter-spacing: 0.3px;">
            ${formatInline(stepText, primary)}
          </span>
        </section>
      `;
    }
    return `
      <section data-ignore-width="true" style="margin: 28px 0 16px 0; box-sizing: border-box; line-height: 1.5;">
        <section style="display: inline-block; vertical-align: middle; padding: 4px 10px; background-color: ${primary}; border-radius: 6px; margin-right: 10px; box-sizing: border-box;">
          <span style="color: #ffffff; font-size: 12px; font-weight: bold; letter-spacing: 1px; font-family: Menlo, Monaco, Consolas, monospace; line-height: 1; text-align: center; white-space: nowrap; display: inline-block;">${stepTag}</span>
        </section>
        <span style="display: inline-block; vertical-align: middle; font-size: ${fontSize + 2}px; font-weight: 800; color: ${textColor}; line-height: 1.4; letter-spacing: 0.3px;">
          ${formatInline(stepText, primary)}
        </span>
      </section>
    `;
  }

  // 4. 作者签名栏 :::author（使用 fixed table 锁死左列，头像使用纯 section 盒模型，文字显式 span 包裹）
  if (lowerType === 'author') {
    const parts = content.split(/[|｜]/);
    const authorName = parts[0]?.trim() || '本文作者';
    const authorBio = parts[1]?.trim() || '专注于深度思考、优质干货与实战复盘。关注我们，持续获得认知进化。';
    const initialChar = authorName.slice(0, 1);

    if (isClaude) {
      return `
        <section data-ignore-width="true" style="margin: 36px 0 24px 0; padding: 18px 22px; background-color: #faf9f5; border: 1px solid rgba(217, 119, 87, 0.28); border-radius: 12px; box-sizing: border-box;">
          <table style="width: 100%; table-layout: fixed; border-collapse: collapse; border: none; margin: 0; padding: 0; background: transparent;">
            <tbody>
              <tr>
                <td style="width: 52px; vertical-align: middle; padding: 0; border: none; text-align: center;">
                  <section style="width: 44px; height: 44px; line-height: 44px; border-radius: 22px; background-color: #d97757; text-align: center; margin: 0 auto; box-sizing: border-box;">
                    <span style="color: #faf9f5; font-size: 18px; font-weight: bold; line-height: 44px; display: inline-block; text-align: center; font-family: 'Newsreader', Georgia, serif;">${initialChar}</span>
                  </section>
                </td>
                <td style="vertical-align: middle; padding: 0 0 0 14px; border: none;">
                  <section style="margin: 0; padding: 0;">
                    <section style="font-size: 15px; font-weight: bold; line-height: 1.4; margin-bottom: 4px;">
                      <span style="color: #262320; font-size: 15px; font-weight: bold; font-family: 'Newsreader', Georgia, serif;">${formatInline(authorName, primary)}</span>
                    </section>
                    <section style="font-size: 13px; line-height: 1.5; margin: 0;">
                      <span style="color: #6b635b; font-size: 13px;">${formatInline(authorBio, primary)}</span>
                    </section>
                  </section>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      `;
    }

    if (isMacosGlass) {
      return `
        <section data-ignore-width="true" style="margin: 36px 0 24px 0; padding: 18px 22px; background-color: #f8fafc; border: 1px solid rgba(0,113,227,0.18); border-radius: 16px; box-sizing: border-box;">
          <table style="width: 100%; table-layout: fixed; border-collapse: collapse; border: none; margin: 0; padding: 0; background: transparent;">
            <tbody>
              <tr>
                <td style="width: 52px; vertical-align: middle; padding: 0; border: none; text-align: center;">
                  <section style="width: 44px; height: 44px; line-height: 44px; border-radius: 22px; background-color: #0071e3; text-align: center; margin: 0 auto; box-sizing: border-box;">
                    <span style="color: #ffffff; font-size: 18px; font-weight: bold; line-height: 44px; display: inline-block; text-align: center;">${initialChar}</span>
                  </section>
                </td>
                <td style="vertical-align: middle; padding: 0 0 0 14px; border: none;">
                  <section style="margin: 0; padding: 0;">
                    <section style="font-size: 15px; font-weight: bold; line-height: 1.4; margin-bottom: 4px;">
                      <span style="color: #1d1d1f; font-size: 15px; font-weight: bold;">${formatInline(authorName, primary)}</span>
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

    return `
      <section data-ignore-width="true" style="margin: 36px 0 24px 0; padding: 18px 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; box-sizing: border-box;">
        <table style="width: 100%; table-layout: fixed; border-collapse: collapse; border: none; margin: 0; padding: 0; background: transparent;">
          <tbody>
            <tr>
              <td style="width: 52px; vertical-align: middle; padding: 0; border: none; text-align: center;">
                <section style="width: 44px; height: 44px; line-height: 44px; border-radius: 22px; background-color: ${primary}; text-align: center; margin: 0 auto; box-sizing: border-box;">
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
    if (isClaude) {
      return `
        <section data-ignore-width="true" style="margin: 24px 0; padding: 18px 20px; background-color: #faf9f5; border: 1px solid rgba(217, 119, 87, 0.25); border-left: 4px solid #d97757; border-radius: 8px; box-sizing: border-box;">
          ${renderClaudeCardHeader('KEY TAKEAWAY · 核心要点', '#d97757')}
          <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; text-align: justify; word-break: break-all; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <span style="color: #262320; font-size: ${fontSize}px; line-height: ${lineHeight};">${formatInline(content, '#d97757')}</span>
          </p>
        </section>
      `;
    }
    if (isMacosGlass) {
      return `
        <section data-ignore-width="true" style="margin: 24px 0; padding: 16px 20px; background-color: #f0fdf4; border: 1px solid rgba(22, 163, 74, 0.2); border-radius: 16px; box-sizing: border-box; -webkit-font-smoothing: antialiased;">
          ${renderMacosSingleDotHeader('#16a34a', '核心要点 · TIP', '#15803d')}
          <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; text-align: justify; word-break: break-all; -webkit-font-smoothing: antialiased; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;">
            <span style="color: #166534; font-size: ${fontSize}px; line-height: ${lineHeight}; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;">${formatInline(content, '#15803d')}</span>
          </p>
        </section>
      `;
    }
    return `
      <section data-ignore-width="true" style="margin: 24px 0; padding: 14px 18px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 8px; box-sizing: border-box;">
        <section style="font-size: 13px; font-weight: bold; margin-bottom: 5px;">
          <span style="color: #15803d; font-size: 13px; font-weight: bold;">💡 核心要点 / TIP</span>
        </section>
        <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; text-align: justify; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;">
          <span style="color: #166534; font-size: ${fontSize}px;">${formatInline(content, '#15803d')}</span>
        </p>
      </section>
    `;
  }

  // 6. 避坑警示注意 :::warning
  if (lowerType === 'warning') {
    if (isClaude) {
      return `
        <section data-ignore-width="true" style="margin: 24px 0; padding: 18px 20px; background-color: #fdf6f0; border: 1px solid rgba(194, 65, 12, 0.25); border-left: 4px solid #c2410c; border-radius: 8px; box-sizing: border-box;">
          ${renderClaudeCardHeader('WARNING · 避坑警示', '#c2410c')}
          <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; text-align: justify; word-break: break-all; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <span style="color: #7c2d12; font-size: ${fontSize}px; line-height: ${lineHeight};">${formatInline(content, '#c2410c')}</span>
          </p>
        </section>
      `;
    }
    if (isMacosGlass) {
      return `
        <section data-ignore-width="true" style="margin: 24px 0; padding: 16px 20px; background-color: #fff7ed; border: 1px solid rgba(234, 88, 12, 0.2); border-radius: 16px; box-sizing: border-box; -webkit-font-smoothing: antialiased;">
          ${renderMacosSingleDotHeader('#ea580c', '避坑警示 · WARNING', '#c2410c')}
          <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; text-align: justify; word-break: break-all; -webkit-font-smoothing: antialiased; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;">
            <span style="color: #9a3412; font-size: ${fontSize}px; line-height: ${lineHeight}; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;">${formatInline(content, '#c2410c')}</span>
          </p>
        </section>
      `;
    }
    return `
      <section data-ignore-width="true" style="margin: 24px 0; padding: 14px 18px; background-color: #fff7ed; border: 1px solid #fed7aa; border-left: 4px solid #ea580c; border-radius: 8px; box-sizing: border-box;">
        <section style="font-size: 13px; font-weight: bold; margin-bottom: 5px;">
          <span style="color: #c2410c; font-size: 13px; font-weight: bold;">⚠️ 避坑提醒 / WARNING</span>
        </section>
        <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; text-align: justify; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;">
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
    if (isClaude) {
      return `
        <section data-ignore-width="true" style="margin: 28px 0; padding: 24px 20px; background-color: #faf9f5; border: 1px solid rgba(217, 119, 87, 0.25); border-radius: 12px; text-align: center; box-sizing: border-box;">
          <section style="font-size: 36px; font-weight: 800; line-height: 1.2; letter-spacing: 0.5px; font-family: 'Newsreader', Georgia, serif; text-align: center;">
            <span style="color: #d97757; font-size: 36px; font-weight: 800; font-family: 'Newsreader', Georgia, serif;">${formatInline(val, primary)}</span>
          </section>
          <section style="font-size: 13px; font-weight: 600; margin-top: 8px; letter-spacing: 0.8px; text-align: center;">
            <span style="color: #6b635b; font-size: 13px;">${formatInline(label, primary)}</span>
          </section>
        </section>
      `;
    }
    if (isMacosGlass) {
      return `
        <section data-ignore-width="true" style="margin: 28px 0; padding: 24px 20px; background-color: #f4f8ff; border: 1px solid rgba(0, 113, 227, 0.18); border-radius: 18px; text-align: center; box-sizing: border-box; -webkit-font-smoothing: antialiased;">
          <section style="font-size: 34px; font-weight: 900; line-height: 1.2; letter-spacing: 1px; font-family: -apple-system, BlinkMacSystemFont, Menlo, Monaco, sans-serif; text-align: center;">
            <span style="color: #0071e3; font-size: 34px; font-weight: 900;">${formatInline(val, primary)}</span>
          </section>
          <section style="font-size: 13px; font-weight: 600; margin-top: 6px; letter-spacing: 0.5px; text-align: center;">
            <span style="color: #64748b; font-size: 13px;">${formatInline(label, primary)}</span>
          </section>
        </section>
      `;
    }
    const bg = hexToRgba(primary, 0.06);
    const border = hexToRgba(primary, 0.2);
    return `
      <section data-ignore-width="true" style="margin: 28px 0; padding: 22px 20px; background-color: ${bg}; border: 1px solid ${border}; border-radius: 12px; text-align: center; box-sizing: border-box;">
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
    if (isClaude) {
      return `
        <section data-ignore-width="true" style="margin: 24px 0; padding: 18px 22px; background-color: #faf9f5; border: 1px solid rgba(217, 119, 87, 0.25); border-radius: 12px; box-sizing: border-box;">
          ${renderClaudeCardHeader('INSIGHT NOTE · 深度拆解', '#d97757')}
          <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; text-align: justify; word-break: break-all; color: #262320; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <span style="color: #262320; font-size: ${fontSize}px; line-height: ${lineHeight};">${formatInline(content, primary)}</span>
          </p>
        </section>
      `;
    }
    if (isMacosGlass) {
      return `
        <section data-ignore-width="true" style="margin: 24px 0; padding: 18px 22px; background-color: #f4f8ff; border: 1px solid rgba(0, 113, 227, 0.18); border-radius: 16px; box-sizing: border-box; -webkit-font-smoothing: antialiased;">
          ${renderMacosSingleDotHeader('#0071e3', 'CARD NOTE', '#0071e3')}
          <p style="margin: 0; font-size: ${fontSize}px; line-height: ${lineHeight}; text-align: justify; word-break: break-all; color: #1d1d1f; -webkit-font-smoothing: antialiased; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;">
            <span style="color: #1d1d1f; font-size: ${fontSize}px; line-height: ${lineHeight}; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;">${formatInline(content, primary)}</span>
          </p>
        </section>
      `;
    }
    return `
      <section data-ignore-width="true" style="margin: 24px 0; padding: 16px 20px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 10px; box-sizing: border-box;">
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
          <!-- 发光节点正圆徽章 (内联 SVG 矢量图标，彻底杜绝被微信作为空标签清除) -->
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" style="position: absolute; left: -8px; top: 2px; width: 14px; height: 14px; display: block;">
            <circle cx="7" cy="7" r="5.5" fill="${primary}" stroke="#ffffff" stroke-width="2.5" />
          </svg>
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
    if (isClaude) {
      return `
        <section data-ignore-width="true" style="margin: 32px 0; padding: 20px 22px; background-color: #faf9f5; border-radius: 12px; text-align: center; box-sizing: border-box; border: 1px solid rgba(217, 119, 87, 0.25);">
          <section style="text-align: center; margin-bottom: 8px; line-height: 1;">
            ${renderClaudeSparkleSvg('#d97757', 16)}
          </section>
          <section style="font-size: 13px; font-weight: 600; margin-bottom: 14px; letter-spacing: 0.5px; text-align: center;">
            <span style="color: #5c534b; font-size: 13px; font-weight: 600;">${formatInline(content || '如果觉得本文有启发，欢迎互动支持：', primary)}</span>
          </section>
          <section style="text-align: center; line-height: 1.8;">
            <section style="display: inline-block; margin: 4px 6px; padding: 7px 18px; border-radius: 20px; background-color: #ffffff; border: 1px solid rgba(217, 119, 87, 0.3); vertical-align: middle;">
              <span style="font-size: 13px; color: #262320; font-weight: 600; line-height: 1.4;">👍 点赞</span>
            </section>
            <section style="display: inline-block; margin: 4px 6px; padding: 7px 18px; border-radius: 20px; background-color: #ffffff; border: 1px solid rgba(217, 119, 87, 0.3); vertical-align: middle;">
              <span style="font-size: 13px; color: #262320; font-weight: 600; line-height: 1.4;">🌟 在看</span>
            </section>
            <section style="display: inline-block; margin: 4px 6px; padding: 7px 18px; border-radius: 20px; background-color: #ffffff; border: 1px solid rgba(217, 119, 87, 0.3); vertical-align: middle;">
              <span style="font-size: 13px; color: #262320; font-weight: 600; line-height: 1.4;">✈️ 分享好友</span>
            </section>
          </section>
        </section>
      `;
    }
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
            <img src="${imgUrl}" data-src="${imgUrl}" alt="${escapeHtml(cardTitle)}" data-type="png" style="display: block; width: 100% !important; height: 180px !important; min-height: 180px !important; max-height: 180px !important; object-fit: cover !important; border: none; margin: 0; padding: 0;" />
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
            <img src="${it.url}" data-src="${it.url}" alt="${escapeHtml(it.title)}" data-type="png" style="display: block; width: 100% !important; height: 220px !important; min-height: 220px !important; max-height: 220px !important; object-fit: cover !important; border: none; margin: 0; padding: 0;" />
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
                  <img src="${it.url}" data-src="${it.url}" alt="${escapeHtml(it.title)}" data-type="png" style="display: block; width: 100% !important; height: ${CARD_IMG_HEIGHT}px !important; min-height: ${CARD_IMG_HEIGHT}px !important; max-height: ${CARD_IMG_HEIGHT}px !important; object-fit: cover !important; border: none; margin: 0; padding: 0;" />
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
                  <img src="${url1}" data-src="${url1}" alt="${escapeHtml(label1)}" data-type="png" style="display: block; width: 100% !important; height: 120px !important; min-height: 120px !important; max-height: 120px !important; object-fit: cover !important; border: none; margin: 0; padding: 0;" />
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
                  <img src="${url2}" data-src="${url2}" alt="${escapeHtml(label2)}" data-type="png" style="display: block; width: 100% !important; height: 120px !important; min-height: 120px !important; max-height: 120px !important; object-fit: cover !important; border: none; margin: 0; padding: 0;" />
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
          <img src="${imgUrl}" data-src="${imgUrl}" alt="${escapeHtml(caption)}" data-type="png" style="display: block; width: 100%; height: 100%; object-fit: cover;" />
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
        <table style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border: none; margin: 0; padding: 0;">
          <tbody>
            <tr>
              <td style="padding: 14px 18px; vertical-align: middle; border: none; text-align: left;">
                <span style="font-size: 14px; font-weight: bold; color: ${textColor};">📜 ${formatInline(unfoldTitle, primary)}</span>
              </td>
              <td style="padding: 14px 18px; vertical-align: middle; border: none; text-align: right; white-space: nowrap;">
                <span style="font-size: 11px; color: ${primary}; font-weight: bold; font-family: -apple-system, sans-serif;">轻触展开 ▼</span>
              </td>
            </tr>
          </tbody>
        </table>

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
  const isMacosGlass = theme.id === 'macos27-glass';
  const isClaude = theme.id === 'claude-anthropic';

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
        let marker = '';
        if (isClaude) {
          marker =
            listType === 'ol'
              ? `<span style="display:inline-block;min-width:22px;height:18px;line-height:18px;background-color:#f5ebe6;border:1px solid rgba(217,119,87,0.3);border-radius:4px;font-size:11px;font-weight:700;color:#d97757;text-align:center;margin-right:8px;font-family:'Newsreader',Georgia,serif;vertical-align:middle;">${String(idx + 1).padStart(2, '0')}</span>`
              : `<span style="display:inline-block;margin-right:8px;vertical-align:middle;line-height:1;">${renderClaudeSparkleSvg('#d97757', 11)}</span>`;
        } else if (isMacosGlass) {
          marker =
            listType === 'ol'
              ? `<span style="display:inline-block;min-width:20px;height:18px;line-height:18px;background-color:#e0f2fe;border:1px solid rgba(0,113,227,0.22);border-radius:6px;font-size:11px;font-weight:800;color:#0071e3;text-align:center;margin-right:8px;box-shadow:inset 0 1px 1px #fff;font-family:Menlo,Monaco,monospace;vertical-align:middle;">${String(idx + 1).padStart(2, '0')}</span>`
              : `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background-color:#0071e3;box-shadow:0 0 6px rgba(0,113,227,0.45);margin-right:9px;vertical-align:middle;margin-top:-2px;"></span>`;
        } else {
          marker =
            listType === 'ol'
              ? `<span style="display:inline-block;min-width:20px;font-weight:bold;color:${primary};margin-right:6px;font-family:Menlo,Monaco,monospace;vertical-align:baseline;">${String(idx + 1).padStart(2, '0')}.</span>`
              : `<span style="display:inline-block;width:6px;height:6px;background-color:${primary};border-radius:50%;margin-right:8px;vertical-align:middle;margin-top:-2px;"></span>`;
        }
        return `<li style="margin-bottom:8px;list-style:none;line-height:${lineHeight};color:${textColor};padding-left:0;">${marker}<span style="vertical-align:middle;color:${textColor};">${formatInline(item, primary)}</span></li>`;
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

    const headerThBg = isClaude ? '#f5ebe6' : (isMacosGlass ? '#f0f6ff' : secondary);
    const headerThColor = isClaude ? '#d97757' : (isMacosGlass ? '#0071e3' : primary);

    const headerHtml = `<tr>${header
      .map(
        (th) =>
          `<th style="padding:10px 14px;background-color:${headerThBg};color:${headerThColor};font-weight:bold;border:1px solid #e2e8f0;font-size:${fontSize - 1}px;text-align:left;"><span style="color:${headerThColor};font-size:${fontSize - 1}px;font-weight:bold;">${formatInline(th, primary)}</span></th>`
      )
      .join('')}</tr>`;

    const bodyHtml = body
      .map(
        (row, rIdx) =>
          `<tr style="background-color:${rIdx % 2 === 0 ? '#ffffff' : (isClaude ? '#faf9f5' : '#f8fafc')};">${row
            .map(
              (td) =>
                `<td style="padding:9px 14px;border:1px solid #e2e8f0;font-size:${fontSize - 1}px;color:${textColor};line-height:1.6;"><span style="color:${textColor};">${formatInline(td, primary)}</span></td>`
            )
            .join('')}</tr>`
      )
      .join('');

    const tableWrapperStyle = isClaude
      ? `overflow-x:auto;margin:22px 0;border-radius:10px;border:1px solid rgba(217,119,87,0.25);box-shadow:0 2px 8px rgba(0,0,0,0.03);background-color:#ffffff;`
      : isMacosGlass
      ? `overflow-x:auto;margin:22px 0;border-radius:14px;border:1px solid rgba(0,113,227,0.18);box-shadow:inset 0 1px 1px #fff,0 4px 16px rgba(0,113,227,0.06);background-color:#ffffff;`
      : `overflow-x:auto;margin:20px 0;border-radius:10px;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,0.03);background-color:#ffffff;`;

    htmlParts.push(
      `<div data-ignore-width="true" style="${tableWrapperStyle}"><table style="width:100%;border-collapse:collapse;text-align:left;font-size:${fontSize - 1}px;margin:0;background-color:#ffffff;"><thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody></table></div>`
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
        if (isClaude) {
          htmlParts.push(`
            <section data-ignore-width="true" style="margin:22px 0;border-radius:10px;overflow:hidden;background-color:#262320;border:1px solid rgba(217,119,87,0.3);box-sizing:border-box;">
              <table style="width:100%;background-color:#1e1b18;border-bottom:1px solid rgba(217,119,87,0.2);border-collapse:collapse;border:none;padding:0;margin:0;">
                <tbody>
                  <tr>
                    <td style="padding:10px 14px;vertical-align:middle;border:none;background-color:#1e1b18;">
                      ${renderClaudeSparkleSvg('#d97757', 12)}
                      <span style="font-size:11px;color:#d97757;font-family:Menlo,Monaco,monospace;letter-spacing:1px;font-weight:700;margin-left:6px;vertical-align:middle;">ANTHROPIC CONSOLE</span>
                    </td>
                    <td style="padding:10px 14px;text-align:right;vertical-align:middle;border:none;background-color:#1e1b18;">
                      <span style="font-size:11px;color:#a8a29e;font-family:Menlo,Monaco,Consolas,monospace;text-transform:uppercase;font-weight:600;">${codeLang || 'CODE'}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <pre style="margin:0;padding:16px 18px;overflow-x:auto;background-color:#262320;color:#faf9f5;font-family:Menlo,Monaco,Consolas,monospace;font-size:13px;line-height:1.65;letter-spacing:0.3px;white-space:pre-wrap;word-break:break-all;"><code style="background-color:#262320;color:#faf9f5;font-family:inherit;">${codeContent}</code></pre>
            </section>
          `);
        } else if (isMacosGlass) {
          htmlParts.push(`
            <section data-ignore-width="true" style="margin:22px 0;border-radius:16px;overflow:hidden;background-color:#16171d;border:1px solid rgba(255,255,255,0.12);box-sizing:border-box;">
              <table style="width:100%;background-color:#202129;border-bottom:1px solid rgba(255,255,255,0.08);border-collapse:collapse;border:none;padding:0;margin:0;">
                <tbody>
                  <tr>
                    <td style="padding:10px 14px;vertical-align:middle;border:none;background-color:#202129;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="45" height="11" viewBox="0 0 45 11" style="display:inline-block;vertical-align:middle;width:45px;height:11px;">
                        <circle cx="5.5" cy="5.5" r="5" fill="#ff5f56" stroke="#e0443e" stroke-width="0.5" />
                        <circle cx="20.5" cy="5.5" r="5" fill="#ffbd2e" stroke="#dea123" stroke-width="0.5" />
                        <circle cx="35.5" cy="5.5" r="4.5" fill="#27c93f" stroke="#1aab29" stroke-width="0.5" />
                      </svg>
                    </td>
                    <td style="padding:10px 14px;text-align:right;vertical-align:middle;border:none;background-color:#202129;">
                      <span style="font-size:11px;color:#38bdf8;font-family:Menlo,Monaco,Consolas,monospace;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">${codeLang || 'TERMINAL'}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <pre style="margin:0;padding:16px 18px;overflow-x:auto;background-color:#16171d;color:#e2e8f0;font-family:Menlo,Monaco,Consolas,monospace;font-size:13px;line-height:1.65;letter-spacing:0.3px;white-space:pre-wrap;word-break:break-all;"><code style="background-color:#16171d;color:#e2e8f0;font-family:inherit;">${codeContent}</code></pre>
            </section>
          `);
        } else {
          htmlParts.push(`
            <section data-ignore-width="true" style="margin:20px 0;border-radius:10px;overflow:hidden;background-color:#1e1e1e;box-sizing:border-box;">
              <table style="width:100%;background-color:#2d2d2d;border-bottom:1px solid #3d3d3d;border-collapse:collapse;border:none;padding:0;margin:0;">
                <tbody>
                  <tr>
                    <td style="padding:8px 14px;vertical-align:middle;border:none;background-color:#2d2d2d;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="45" height="11" viewBox="0 0 45 11" style="display:inline-block;vertical-align:middle;width:45px;height:11px;">
                        <circle cx="5.5" cy="5.5" r="5" fill="#ff5f56" />
                        <circle cx="20.5" cy="5.5" r="5" fill="#ffbd2e" />
                        <circle cx="35.5" cy="5.5" r="4.5" fill="#27c93f" />
                      </svg>
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
        }
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
          isMacosGlass,
          isClaude,
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
          isMacosGlass,
          isClaude,
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
      if (isClaude) {
        htmlParts.push(`
          <section data-ignore-width="true" style="margin:36px auto 24px auto;text-align:center;box-sizing:border-box;max-width:100%;">
            <section style="display:inline-block;padding:14px 26px;background-color:#faf9f5;border:1px solid rgba(217,119,87,0.25);border-radius:16px;box-sizing:border-box;">
              <section style="text-align:center;margin-bottom:8px;line-height:1;">
                ${renderClaudeSparkleSvg('#d97757', 16)}
              </section>
              <h1 style="margin:0;font-size:${fontSize + 6}px;font-weight:800;color:#262320;letter-spacing:0.8px;line-height:1.4;font-family:'Newsreader',Georgia,'Songti SC','Source Han Serif SC',serif;">
                <span style="color:#262320;font-size:${fontSize + 6}px;font-weight:800;font-family:'Newsreader',Georgia,'Songti SC','Source Han Serif SC',serif;">${formatInline(text, primary)}</span>
              </h1>
            </section>
          </section>
        `);
      } else if (isMacosGlass) {
        htmlParts.push(`
          <section data-ignore-width="true" style="margin:36px auto 24px auto;text-align:center;box-sizing:border-box;max-width:100%;">
            <section style="display:inline-block;padding:12px 24px;background-color:#f4f8ff;border:1px solid rgba(0,113,227,0.18);border-radius:24px;box-sizing:border-box; -webkit-font-smoothing: antialiased;">
              ${renderMacosTrafficLights('', '#0071e3', 'center')}
              <h1 style="margin:0;font-size:${fontSize + 6}px;font-weight:900;color:#0071e3;letter-spacing:0.5px;line-height:1.4;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','PingFang SC',sans-serif;">
                <span style="color:#0071e3;font-size:${fontSize + 6}px;font-weight:900;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','PingFang SC',sans-serif;">${formatInline(text, primary)}</span>
              </h1>
            </section>
          </section>
        `);
      } else {
        htmlParts.push(`
          <section data-ignore-width="true" style="margin:28px 0 18px 0;text-align:center;box-sizing:border-box;">
            <h1 style="display:inline-block;margin:0;padding:6px 16px;font-size:${fontSize + 6}px;font-weight:900;color:${primary};letter-spacing:1px;line-height:1.4;border-bottom:3px solid ${primary};">
              ${formatInline(text, primary)}
            </h1>
          </section>
        `);
      }
      continue;
    }

    // 6. 二级标题 (H2) - 稳定微晶卡片风格（外层显式 text-align:left 绝不漂移，内嵌 macOS 专属三色点 SVG）
    if (trimmed.startsWith('## ')) {
      flushList();
      flushTable();
      const text = trimmed.slice(3);
      if (isClaude) {
        htmlParts.push(`
          <section data-ignore-width="true" style="margin:34px 0 18px 0;text-align:left;box-sizing:border-box;">
            <section style="display:inline-block;padding:7px 16px 7px 12px;background-color:#faf9f5;border-radius:10px;border:1px solid rgba(217,119,87,0.25);box-sizing:border-box;">
              <table style="border-collapse:collapse;border:none;margin:0;padding:0;background:transparent !important;width:auto !important;">
                <tbody>
                  <tr style="border:none;background:transparent !important;">
                    <td style="border:none;padding:0 8px 0 0;vertical-align:middle;line-height:1;width:16px;">
                      ${renderClaudeSparkleSvg('#d97757', 14)}
                    </td>
                    <td style="border:none;padding:0;vertical-align:middle;line-height:1.4;">
                      <h2 style="margin:0;font-size:${fontSize + 3}px;font-weight:700;color:#262320;letter-spacing:0.5px;line-height:1.4;font-family:'Newsreader',Georgia,'Songti SC','Source Han Serif SC',serif;">
                        ${formatInline(text, primary)}
                      </h2>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </section>
        `);
      } else if (isMacosGlass) {
        htmlParts.push(`
          <section data-ignore-width="true" style="margin:34px 0 18px 0;text-align:left;box-sizing:border-box;">
            <section style="display:inline-block;padding:7px 16px 7px 12px;background-color:#f4f8ff;border-radius:14px;border:1px solid rgba(0,113,227,0.2);box-sizing:border-box; -webkit-font-smoothing: antialiased;">
              <table style="border-collapse:collapse;border:none;margin:0;padding:0;background:transparent !important;width:auto !important;">
                <tbody>
                  <tr style="border:none;background:transparent !important;">
                    <td style="border:none;padding:0 10px 0 0;vertical-align:middle;line-height:1;width:28px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="8" viewBox="0 0 28 8" style="display:block;width:28px;height:8px;">
                        <circle cx="4" cy="4" r="3.5" fill="#ff5f56" />
                        <circle cx="14" cy="4" r="3.5" fill="#ffbd2e" />
                        <circle cx="24" cy="4" r="3.5" fill="#27c93f" />
                      </svg>
                    </td>
                    <td style="border:none;padding:0;vertical-align:middle;line-height:1.4;">
                      <h2 style="margin:0;font-size:${fontSize + 3}px;font-weight:800;color:#1d1d1f;letter-spacing:0.4px;line-height:1.4;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','PingFang SC',sans-serif;">
                        ${formatInline(text, primary)}
                      </h2>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </section>
        `);
      } else {
        htmlParts.push(`
          <section style="margin:30px 0 16px 0;border-left:5px solid ${primary};padding-left:12px;box-sizing:border-box;text-align:left;">
            <h2 style="margin:0;font-size:${fontSize + 3}px;font-weight:800;color:${textColor};letter-spacing:0.5px;line-height:1.35;">
              ${formatInline(text, primary)}
            </h2>
          </section>
        `);
      }
      continue;
    }

    // 7. 三级标题 (H3) - 矢量 SVG 小圆点保护与防漂移
    if (trimmed.startsWith('### ')) {
      flushList();
      flushTable();
      const text = trimmed.slice(4);
      if (isClaude) {
        htmlParts.push(`
          <section data-ignore-width="true" style="margin:24px 0 12px 0;text-align:left;box-sizing:border-box;">
            <table style="border-collapse:collapse;border:none;margin:0;padding:0;background:transparent !important;width:auto !important;">
              <tbody>
                <tr style="border:none;background:transparent !important;">
                  <td style="border:none;padding:0 6px 0 0;vertical-align:middle;line-height:1;width:12px;">
                    ${renderClaudeSparkleSvg('#d97757', 11)}
                  </td>
                  <td style="border:none;padding:0;vertical-align:middle;line-height:1.4;">
                    <h3 style="margin:0;font-size:${fontSize + 1}px;font-weight:700;color:#d97757;line-height:1.4;font-family:'Newsreader',Georgia,serif;">
                      ${formatInline(text, primary)}
                    </h3>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        `);
      } else if (isMacosGlass) {
        htmlParts.push(`
          <section data-ignore-width="true" style="margin:24px 0 12px 0;text-align:left;box-sizing:border-box; -webkit-font-smoothing: antialiased;">
            <table style="border-collapse:collapse;border:none;margin:0;padding:0;background:transparent !important;width:auto !important;">
              <tbody>
                <tr style="border:none;background:transparent !important;">
                  <td style="border:none;padding:0 8px 0 0;vertical-align:middle;line-height:1;width:8px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" style="display:block;width:8px;height:8px;">
                      <circle cx="4" cy="4" r="3.5" fill="#0071e3" />
                    </svg>
                  </td>
                  <td style="border:none;padding:0;vertical-align:middle;line-height:1.4;">
                    <h3 style="margin:0;font-size:${fontSize + 1}px;font-weight:700;color:#0071e3;line-height:1.4;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','PingFang SC',sans-serif;">
                      ${formatInline(text, primary)}
                    </h3>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        `);
      } else {
        htmlParts.push(`
          <section data-ignore-width="true" style="margin:22px 0 10px 0;text-align:left;box-sizing:border-box;">
            <h3 style="margin:0;font-size:${fontSize + 1}px;font-weight:700;color:${primary};line-height:1.4;">
              ${formatInline(text, primary)}
            </h3>
          </section>
        `);
      }
      continue;
    }

    // 8. 引用块 (Blockquote) - 优雅纯色质感卡片（微信规范 #4.1.2 避免渐变与 #1.4 忽略宽度）
    if (trimmed.startsWith('>')) {
      flushList();
      flushTable();
      const text = trimmed.replace(/^>\s?/, '');
      if (isClaude) {
        htmlParts.push(`
          <section data-ignore-width="true" style="margin:24px 0;padding:18px 22px;background-color:#faf9f5;border-radius:10px;border:1px solid rgba(217,119,87,0.22);border-left:4px solid #d97757;box-sizing:border-box;">
            ${renderClaudeCardHeader('CLAUDE INSIGHT', '#d97757')}
            <p style="margin:0;font-size:${fontSize}px;line-height:${lineHeight};color:#262320;letter-spacing:0.5px;text-align:justify;word-break:break-all;font-family:'Newsreader',Georgia,'Songti SC',serif;">
              <span style="color:#262320;font-size:${fontSize}px;line-height:${lineHeight};font-family:'Newsreader',Georgia,'Songti SC',serif;">${formatInline(text, primary)}</span>
            </p>
          </section>
        `);
      } else if (isMacosGlass) {
        htmlParts.push(`
          <section data-ignore-width="true" style="margin:22px 0;padding:16px 20px;background-color:#f4f8ff;border-radius:16px;border:1px solid rgba(0,113,227,0.16);box-shadow:0 4px 16px rgba(0,113,227,0.06);box-sizing:border-box; -webkit-font-smoothing: antialiased;">
            ${renderMacosTrafficLights('INSIGHT', '#0071e3')}
            <p style="margin:0;font-size:${fontSize}px;line-height:${lineHeight};color:#1d1d1f;font-weight:400;letter-spacing:0.5px;text-align:justify;word-break:break-all;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','PingFang SC',sans-serif;">
              <span style="color:#1d1d1f;font-size:${fontSize}px;line-height:${lineHeight};font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','PingFang SC',sans-serif;">${formatInline(text, primary)}</span>
            </p>
          </section>
        `);
      } else {
        htmlParts.push(`
          <section data-ignore-width="true" style="margin:18px 0;padding:14px 18px;background-color:${secondary};border-left:4px solid ${primary};border-radius:0 8px 8px 0;color:${textColor};font-size:${fontSize}px;line-height:${lineHeight};box-sizing:border-box;">
            <p style="margin:0;opacity:0.95;"><span style="color:${textColor};font-size:${fontSize}px;">${formatInline(text, primary)}</span></p>
          </section>
        `);
      }
      continue;
    }

    // 9. 分割线（采用专业内联 SVG 矢量风格线，100% 免疫微信空标签过滤，居中永不折行）
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList();
      flushTable();
      if (isClaude) {
        htmlParts.push(`
          <section data-ignore-width="true" style="margin:34px 0;text-align:center;line-height:0;box-sizing:border-box;">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="16" viewBox="0 0 280 16" preserveAspectRatio="xMidYMid meet" style="max-width:240px;display:inline-block;vertical-align:middle;">
              <line x1="15" y1="8" x2="115" y2="8" stroke="#d97757" stroke-width="1" stroke-opacity="0.35" stroke-linecap="round" />
              <path d="M140 1C140.3 5.5 143.5 8.7 148 9C143.5 9.3 140.3 12.5 140 17C139.7 12.5 136.5 9.3 132 9C136.5 8.7 139.7 5.5 140 1Z" fill="#d97757" transform="translate(0, -1)" />
              <circle cx="140" cy="8" r="1.8" fill="#faf9f5" />
              <line x1="165" y1="8" x2="265" y2="8" stroke="#d97757" stroke-width="1" stroke-opacity="0.35" stroke-linecap="round" />
            </svg>
          </section>
        `);
      } else if (isMacosGlass) {
        htmlParts.push(`
          <section data-ignore-width="true" style="margin:34px 0;text-align:center;line-height:0;box-sizing:border-box;">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="14" viewBox="0 0 320 14" preserveAspectRatio="xMidYMid meet" style="max-width:260px;display:inline-block;vertical-align:middle;">
              <line x1="15" y1="7" x2="120" y2="7" stroke="#0071e3" stroke-width="1" stroke-opacity="0.25" stroke-linecap="round" />
              <circle cx="140" cy="7" r="4" fill="#ff5f56" stroke="#e0443e" stroke-width="0.5" />
              <circle cx="160" cy="7" r="4" fill="#ffbd2e" stroke="#dea123" stroke-width="0.5" />
              <circle cx="180" cy="7" r="4" fill="#27c93f" stroke="#1aab29" stroke-width="0.5" />
              <line x1="200" y1="7" x2="305" y2="7" stroke="#0071e3" stroke-width="1" stroke-opacity="0.25" stroke-linecap="round" />
            </svg>
          </section>
        `);
      } else {
        htmlParts.push(`
          <section data-ignore-width="true" style="margin:30px 0;text-align:center;line-height:0;box-sizing:border-box;">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="12" viewBox="0 0 240 12" preserveAspectRatio="xMidYMid meet" style="max-width:200px;display:inline-block;vertical-align:middle;">
              <line x1="10" y1="6" x2="105" y2="6" stroke="${primary}" stroke-width="1" stroke-opacity="0.3" stroke-linecap="round" />
              <circle cx="120" cy="6" r="3.5" fill="${primary}" />
              <line x1="135" y1="6" x2="230" y2="6" stroke="${primary}" stroke-width="1" stroke-opacity="0.3" stroke-linecap="round" />
            </svg>
          </section>
        `);
      }
      continue;
    }

    // 10. 图片处理（彻底移除微信 UEditor 严禁的 figure/figcaption 标签，100% 采用微信标准 section 容器并注入 data-src 与精确 data-type 属性，确保图片抓取与懒加载零失效）
    const mdImgMatch = trimmed.match(/^!\[(.*?)\]\(\s*([^\s'")]+)(?:\s+["'].*?["'])?\s*\)$/);
    const htmlImgMatch = !mdImgMatch && trimmed.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i);

    if (mdImgMatch || htmlImgMatch) {
      flushList();
      flushTable();
      let alt = '';
      let rawSrc = '';

      if (mdImgMatch) {
        alt = mdImgMatch[1] || '';
        rawSrc = mdImgMatch[2] || '';
      } else {
        rawSrc = htmlImgMatch[1] || '';
        const altMatch = trimmed.match(/alt=["']([^"']*)["']/i);
        alt = altMatch ? altMatch[1] : '';
      }

      const src = cleanImageUrl(rawSrc);
      const imgType = detectImgDataType(src);

      if (src) {
        if (isClaude) {
          htmlParts.push(`
            <section data-ignore-width="true" style="margin:24px auto;text-align:center;box-sizing:border-box;width:100% !important;max-width:100% !important;background-color:#faf9f5;padding:10px 10px 14px 10px;border-radius:12px;border:1px solid rgba(217,119,87,0.22);">
              <img src="${src}" data-src="${src}" alt="${escapeHtml(alt)}" data-type="${imgType}" referrerpolicy="no-referrer" style="display:block;width:100% !important;max-width:100% !important;height:auto !important;border-radius:8px;margin:0 auto;box-sizing:border-box;" />
              ${alt ? `<section style="margin-top:10px;text-align:center;"><span style="color:#6b635b;font-size:${fontSize - 3}px;display:inline-block;letter-spacing:0.4px;line-height:1.5;font-family:'Newsreader',Georgia,serif;">${escapeHtml(alt)}</span></section>` : ''}
            </section>
          `);
        } else if (isMacosGlass) {
          htmlParts.push(`
            <section data-ignore-width="true" style="margin:24px auto;text-align:center;box-sizing:border-box;width:100% !important;max-width:100% !important;background-color:#f4f8ff;padding:10px 10px 14px 10px;border-radius:16px;border:1px solid rgba(0,113,227,0.16);box-shadow:0 4px 16px rgba(0,113,227,0.06); -webkit-font-smoothing: antialiased;">
              ${renderMacosTrafficLights('', '#0071e3')}
              <img src="${src}" data-src="${src}" alt="${escapeHtml(alt)}" data-type="${imgType}" referrerpolicy="no-referrer" style="display:block;width:100% !important;max-width:100% !important;height:auto !important;border-radius:10px;margin:0 auto;box-sizing:border-box;" />
              ${alt ? `<section style="margin-top:10px;text-align:center;"><span style="color:#64748b;font-size:${fontSize - 3}px;display:inline-block;letter-spacing:0.3px;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;">${escapeHtml(alt)}</span></section>` : ''}
            </section>
          `);
        } else {
          htmlParts.push(`
            <section data-ignore-width="true" style="margin:24px auto;text-align:center;box-sizing:border-box;width:100% !important;max-width:100% !important;">
              <img src="${src}" data-src="${src}" alt="${escapeHtml(alt)}" data-type="${imgType}" referrerpolicy="no-referrer" style="display:block;max-width:100% !important;height:auto !important;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,0.08);margin:0 auto;box-sizing:border-box;" />
              ${alt ? `<section style="margin-top:8px;text-align:center;"><span style="color:#64748b;font-size:${fontSize - 3}px;display:inline-block;letter-spacing:0.3px;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;">${escapeHtml(alt)}</span></section>` : ''}
            </section>
          `);
        }
        continue;
      }
    }

    // 11. 普通段落（双保险：内层包裹显式 span 与字体声明，彻底避免微信插入全局默认深灰黑或换行顺色）
    htmlParts.push(`
      <p style="margin:16px 0;font-size:${fontSize}px;line-height:${lineHeight};letter-spacing:0.5px;color:${textColor};text-align:justify;word-break:break-all;box-sizing:border-box;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;">
        <span style="color:${textColor};font-size:${fontSize}px;line-height:${lineHeight};letter-spacing:0.5px;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;">${formatInline(trimmed, primary)}</span>
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
      isMacosGlass,
      isClaude,
    });
    if (rendered) htmlParts.push(rendered);
  }

  flushList();
  flushTable();

  // 组装总微信容器 (微信富文本一等公民：使用 section 替代 div，注入 data-ignore-width="true"，背景纯白保持微信文章自然流转，内部组件呈现液态玻璃卡片质感)
  const containerStyle = isClaude
    ? `width:100% !important;max-width:100% !important;margin:0 auto;padding:18px 12px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Hiragino Sans GB",sans-serif;font-size:${fontSize}px;color:${textColor};background-color:#ffffff;box-sizing:border-box;-webkit-font-smoothing:antialiased;line-height:1.85;letter-spacing:0.6px;`
    : isMacosGlass
    ? `width:100% !important;max-width:100% !important;margin:0 auto;padding:18px 12px;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;font-size:${fontSize}px;color:${textColor};background-color:#ffffff;box-sizing:border-box;-webkit-font-smoothing:antialiased;`
    : `width:100% !important;max-width:100% !important;margin:0 auto;padding:16px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:${fontSize}px;color:${textColor};background:#ffffff;box-sizing:border-box;-webkit-font-smoothing:antialiased;`;

  return `
    <section class="wechat-format-container" data-ignore-width="true" style="${containerStyle}">
      ${htmlParts.join('\n')}
    </section>
  `.trim();
}

/**
 * 格式化内联样式：图片、加粗、划重点、代码、链接、斜体
 */
function formatInline(text, primary) {
  if (!text) return '';

  let out = escapeHtml(text);

  // 0. 行内图片转义恢复：如果段落中包含行内图片，解析为合法的微信兼容 img 标签
  out = out.replace(
    /!\[(.*?)\]\(\s*([^\s'")]+)(?:\s+["'].*?["'])?\s*\)/g,
    (match, alt, url) => {
      const safe = cleanImageUrl(url);
      const dt = detectImgDataType(safe);
      return `<img src="${safe}" data-src="${safe}" alt="${alt}" data-type="${dt}" referrerpolicy="no-referrer" style="display:inline-block;max-width:100% !important;height:auto !important;border-radius:8px;vertical-align:middle;margin:4px 0;" />`;
    }
  );

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
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
