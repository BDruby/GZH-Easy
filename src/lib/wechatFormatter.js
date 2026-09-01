// 微信公众号专业排版引擎（基于 Doocs Markdown / mdnice 设计哲学）
// 核心机制：将 Markdown 转化为符合微信官方富文本规范的 100% 纯内联样式 (Inlined CSS) HTML，避免样式在公众号后台被过滤

export const WECHAT_THEMES = [
  {
    id: 'classic-green',
    name: '🌿 微信经典绿',
    primaryColor: '#07c160',
    secondaryColor: '#e8f8f0',
    textColor: '#2c3e50',
    desc: '官方质感、清新自然、亲和力强，适合全品类推文',
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
  {
    id: 'minimal-dark',
    name: '🖤 现代黑白灰',
    primaryColor: '#18181b',
    secondaryColor: '#f4f4f5',
    textColor: '#27272a',
    desc: '极简克制、国际范排版、专栏作家与摄影随笔',
  },
  {
    id: 'autumn-gold',
    name: '🍂 暖金人文风',
    primaryColor: '#d97706',
    secondaryColor: '#fef3c7',
    textColor: '#451a03',
    desc: '文化干货、生活随笔、金句语录、故事会',
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
            ? `<span style="display:inline-block;min-width:18px;font-weight:bold;color:${primary};margin-right:6px;">${idx + 1}.</span>`
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
          `<th style="padding:10px 12px;background:${secondary};color:${primary};font-weight:bold;border:1px solid #e2e8f0;font-size:${fontSize - 1}px;text-align:left;">${formatInline(th, primary)}</th>`
      )
      .join('')}</tr>`;

    const bodyHtml = body
      .map(
        (row, rIdx) =>
          `<tr style="background:${rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${row
            .map(
              (td) =>
                `<td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:${fontSize - 1}px;color:${textColor};">${formatInline(td, primary)}</td>`
            )
            .join('')}</tr>`
      )
      .join('');

    htmlParts.push(
      `<div style="overflow-x:auto;margin:20px 0;border-radius:8px;border:1px solid #e2e8f0;"><table style="width:100%;border-collapse:collapse;text-align:left;font-size:${fontSize - 1}px;"><thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody></table></div>`
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
      // 检查是否为分隔符行 |---|---|
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

    // 3. 列表处理
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
      // 列表连续行
      listBuffer[listBuffer.length - 1] += ' ' + trimmed;
      continue;
    } else if (inList && !trimmed) {
      flushList();
    }

    // 空行
    if (!trimmed) {
      continue;
    }

    // 4. 一级标题 (H1) - 微信大头条风格
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

    // 5. 二级标题 (H2) - 微信章节卡片/带标志色块风格
    if (trimmed.startsWith('## ')) {
      flushList();
      flushTable();
      const text = trimmed.slice(3);
      htmlParts.push(`
        <section style="margin:28px 0 16px 0;display:flex;align-items:center;gap:8px;box-sizing:border-box;">
          <span style="display:inline-block;width:5px;height:22px;background:${primary};border-radius:3px;"></span>
          <h2 style="margin:0;font-size:${fontSize + 3}px;font-weight:800;color:${textColor};letter-spacing:0.5px;line-height:1.4;">
            ${formatInline(text, primary)}
          </h2>
        </section>
      `);
      continue;
    }

    // 6. 三级标题 (H3)
    if (trimmed.startsWith('### ')) {
      flushList();
      flushTable();
      const text = trimmed.slice(4);
      htmlParts.push(`
        <section style="margin:20px 0 10px 0;box-sizing:border-box;">
          <h3 style="margin:0;font-size:${fontSize + 1}px;font-weight:700;color:${primary};line-height:1.4;">
            ${formatInline(text, primary)}
          </h3>
        </section>
      `);
      continue;
    }

    // 7. 引用块 (Blockquote) - 优雅质感卡片
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

    // 8. 分割线
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

    // 9. 图片处理
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      flushList();
      flushTable();
      const alt = imgMatch[1] || '';
      const src = imgMatch[2] || '';
      htmlParts.push(`
        <figure style="margin:20px 0;text-align:center;box-sizing:border-box;">
          <img src="${src}" alt="${alt}" style="max-width:100%;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.08);display:inline-block;vertical-align:middle;" />
          ${alt ? `<figcaption style="margin-top:6px;font-size:${fontSize - 3}px;color:#64748b;letter-spacing:0.3px;">${alt}</figcaption>` : ''}
        </figure>
      `);
      continue;
    }

    // 10. 普通段落
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
