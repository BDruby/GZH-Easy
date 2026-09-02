// 微信公众号专业排版引擎（融合 Doocs Markdown 与 gzh-design-skill 经典主题与排版组件）
// 核心机制：将 Markdown 与增强排版组件转化为 100% 纯内联样式 (Inlined CSS) HTML，避免样式被微信公众号过滤

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

  const flushList = () => {
    if (!inList) return;
    const tag = listType === 'ol' ? 'ol' : 'ul';
    const listHtml = listBuffer
      .map((item, idx) => {
        const marker =
          listType === 'ol'
            ? `<span style="display:inline-block;min-width:20px;font-weight:bold;color:${primary};margin-right:6px;font-family:Menlo,Monaco,monospace;">${String(idx + 1).padStart(2, '0')}.</span>`
            : `<span style="display:inline-block;width:6px;height:6px;background-color:${primary};border-radius:50%;margin-right:8px;vertical-align:middle;margin-top:-2px;"></span>`;
        return `<li style="margin-bottom:8px;list-style:none;display:flex;align-items:baseline;line-height:${lineHeight};color:${textColor};">${marker}<span>${formatInline(item, primary)}</span></li>`;
      })
      .join('');
    htmlParts.push(
      `<${tag} style="padding-left:4px;margin:16px 0;box-sizing:border-box;">${listHtml}</${tag}>`
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
          `<th style="padding:10px 14px;background:${secondary};color:${primary};font-weight:bold;border:1px solid #e2e8f0;font-size:${fontSize - 1}px;text-align:left;">${formatInline(th, primary)}</th>`
      )
      .join('')}</tr>`;

    const bodyHtml = body
      .map(
        (row, rIdx) =>
          `<tr style="background:${rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${row
            .map(
              (td) =>
                `<td style="padding:9px 14px;border:1px solid #e2e8f0;font-size:${fontSize - 1}px;color:${textColor};line-height:1.6;">${formatInline(td, primary)}</td>`
            )
            .join('')}</tr>`
      )
      .join('');

    htmlParts.push(
      `<div style="overflow-x:auto;margin:20px 0;border-radius:10px;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,0.03);"><table style="width:100%;border-collapse:collapse;text-align:left;font-size:${fontSize - 1}px;"><thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody></table></div>`
    );
    inTable = false;
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. 代码块处理 (macOS 终端卡片风格)
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
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:#2d2d2d;border-bottom:1px solid #3d3d3d;">
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:#ff5f56;"></span>
                <span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:#ffbd2e;"></span>
                <span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:#27c93f;"></span>
              </div>
              <span style="font-size:11px;color:#9ca3af;font-family:Menlo,Monaco,Consolas,monospace;text-transform:uppercase;">${codeLang || 'code'}</span>
            </div>
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

    // 2. 表格处理
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

    // 3. gzh-design-skill 增强组件处理
    // 3.1 导读引言卡 :::lead
    if (trimmed.startsWith(':::lead')) {
      flushList();
      flushTable();
      const content = trimmed.replace(/^:::lead\s*/, '').replace(/:::$/, '').trim();
      htmlParts.push(`
        <section style="margin:22px 0;padding:16px 20px;background:${secondary};border:1.5px solid ${primary}30;border-left:5px solid ${primary};border-radius:8px;box-sizing:border-box;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-size:12px;font-weight:bold;color:${primary};text-transform:uppercase;letter-spacing:1px;">📌 导读·LEAD IN</span>
          </div>
          <p style="margin:0;font-size:${fontSize}px;line-height:${lineHeight};color:${textColor};font-weight:500;">
            ${formatInline(content, primary)}
          </p>
        </section>
      `);
      continue;
    }

    // 3.2 重点金句居中卡 :::quote
    if (trimmed.startsWith(':::quote')) {
      flushList();
      flushTable();
      const content = trimmed.replace(/^:::quote\s*/, '').replace(/:::$/, '').trim();
      htmlParts.push(`
        <section style="margin:26px 0;padding:20px 24px;background:${secondary};border-radius:12px;text-align:center;box-sizing:border-box;border:1px dashed ${primary}60;">
          <span style="font-size:24px;color:${primary};line-height:1;display:block;margin-bottom:8px;">“</span>
          <p style="margin:0;font-size:${fontSize + 1}px;font-weight:700;color:${primary};line-height:1.6;letter-spacing:0.5px;">
            ${formatInline(content, primary)}
          </p>
          <span style="font-size:24px;color:${primary};line-height:1;display:block;margin-top:8px;">”</span>
        </section>
      `);
      continue;
    }

    // 3.3 步骤/步骤徽章 :::step
    if (trimmed.startsWith(':::step')) {
      flushList();
      flushTable();
      const content = trimmed.replace(/^:::step\s*/, '').replace(/:::$/, '').trim();
      htmlParts.push(`
        <section style="margin:24px 0 12px 0;display:flex;align-items:center;gap:10px;box-sizing:border-box;">
          <span style="display:inline-block;padding:3px 10px;background:${primary};color:#ffffff;border-radius:6px;font-size:11px;font-weight:900;letter-spacing:1px;font-family:Menlo,Monaco,monospace;">
            STEP
          </span>
          <h3 style="margin:0;font-size:${fontSize + 2}px;font-weight:800;color:${textColor};line-height:1.4;">
            ${formatInline(content, primary)}
          </h3>
        </section>
      `);
      continue;
    }

    // 3.4 作者专属签名栏 :::author
    if (trimmed.startsWith(':::author')) {
      flushList();
      flushTable();
      const content = trimmed.replace(/^:::author\s*/, '').replace(/:::$/, '').trim();
      const parts = content.split(/[|｜]/);
      const authorName = parts[0]?.trim() || '本文作者';
      const authorBio = parts[1]?.trim() || '专注于深度思考、优质干货与实战复盘。';
      htmlParts.push(`
        <section style="margin:36px 0 20px 0;padding:16px 20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;display:flex;align-items:center;gap:14px;box-sizing:border-box;">
          <div style="width:42px;height:42px;border-radius:50%;background:${primary};color:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;flex-shrink:0;">
            ${authorName.slice(0, 1)}
          </div>
          <div>
            <div style="font-size:14px;font-weight:bold;color:${textColor};margin-bottom:2px;">${authorName}</div>
            <div style="font-size:12px;color:#64748b;line-height:1.4;">${authorBio}</div>
          </div>
        </section>
      `);
      continue;
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

    // 6. 二级标题 (H2) - 章节卡片/带标志色块风格
    if (trimmed.startsWith('## ')) {
      flushList();
      flushTable();
      const text = trimmed.slice(3);
      htmlParts.push(`
        <section style="margin:30px 0 16px 0;display:flex;align-items:center;gap:10px;box-sizing:border-box;">
          <span style="display:inline-block;width:5px;height:22px;background:${primary};border-radius:3px;flex-shrink:0;"></span>
          <h2 style="margin:0;font-size:${fontSize + 3}px;font-weight:800;color:${textColor};letter-spacing:0.5px;line-height:1.4;">
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
        <section style="margin:18px 0;padding:14px 18px;background:${secondary};border-left:4px solid ${primary};border-radius:0 8px 8px 0;color:${textColor};font-size:${fontSize}px;line-height:${lineHeight};box-sizing:border-box;">
          <p style="margin:0;opacity:0.95;">${formatInline(text, primary)}</p>
        </section>
      `);
      continue;
    }

    // 9. 分割线
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList();
      flushTable();
      htmlParts.push(`
        <section style="margin:28px auto;text-align:center;box-sizing:border-box;">
          <div style="display:inline-flex;align-items:center;gap:8px;">
            <span style="display:inline-block;width:30px;height:1px;background:#cbd5e1;"></span>
            <span style="display:inline-block;width:5px;height:5px;background:${primary};border-radius:50%;"></span>
            <span style="display:inline-block;width:30px;height:1px;background:#cbd5e1;"></span>
          </div>
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
