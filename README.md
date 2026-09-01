# 公众号爆款文章工坊（gzh-baokuan-studio）

一句话主题 → 爆款标题 → 成稿 → 公众号排版。把 [creator-buddy](https://github.com/SpaceZephyr/creator-buddy) 仓库的公众号 Skills 方法论（MIT）落地成一个**本地运行的交互式小应用**，全程零 npm 依赖，Node 18+ 即可跑。

## 用到的 Skills（方法论已内嵌为提示词）

| 步骤 | Skill | 作用 |
|---|---|---|
| 起标题 | `baokuan-title-generator` | 16 种爆款方法批量出候选、八维评分、风险分级、Top5 按用途推荐、A/B 建议 |
| 选题角 | `gzh-longform-writer`（破题式） | 5~8 个角度让作者挑，避免撞车 |
| 写长文 | `gzh-longform-writer`（大纲式/破题式） | 1500–4000 字、公众号五约束、AI 腔黑名单、成稿质检 |
| 写短文 | `gzh-short-post` | ≤1000 字纯文字，第一人称不说教、骨架 A/B |
| 排版 | `space-wechat-layout` | 文章转内联样式公众号 HTML，三种风格，一键复制 |

## 快速开始

```bash
cd gzh-baokuan-studio
# 方式一：网页右上角输入 DeepSeek API Key（只存本浏览器 localStorage）
# 方式二：复制 config.example.json 为 config.json 填入 apiKey
# 方式三：设置环境变量 DEEPSEEK_API_KEY

npm start        # 或 node server.mjs
```

打开 <http://127.0.0.1:43121> 即可使用（端口可用环境变量 `PORT` 或 `config.json` 覆盖）。

## 使用流程

1. **选题**：输入一句主题（可加补充素材），选长文/短文、字数。
2. **起标题**：点「生成标题」→ 在候选矩阵里点选，或直接点 Top5 推荐卡。
3. **写正文**：破题式先「生成角度」挑一个；大纲式直接写；短文一键成稿。正文流式输出，可复制 Markdown。
4. **排版**：选风格 →「生成排版」→ 在 677px 微信预览里看效果 →「复制 HTML 到公众号」直接粘贴进公众号编辑器。

**⚡ 一键生成全文**：自动完成 标题 → 角度 → 正文 → 排版 全流程。

## 配置项（config.json）

```json
{
  "apiKey": "sk-...",          // 可留空，用页面输入或 DEEPSEEK_API_KEY 环境变量
  "model": "deepseek-chat",    // 或 deepseek-reasoner
  "port": 43121,
  "baseUrl": "https://api.deepseek.com"
}
```

## 目录结构

```
gzh-baokuan-studio/
├── server.mjs          # 零依赖 HTTP 服务：静态页 + /api/titles /api/angles /api/article(SSE) /api/layout
├── lib/
│   ├── prompts.mjs     # 由 gzh-Skills 改编的 system prompt（标题/角度/长文/短文/排版）
│   └── deepseek.mjs    # DeepSeek 对话封装（JSON + SSE 流式）
├── public/             # 前端单页（index.html / app.js / style.css）
├── config.example.json
└── package.json
```

## Linux 服务器一键部署

### 方式一：一键自动脚本（推荐 ⭐）

在你的 Linux 服务器（Ubuntu / Debian / CentOS / Rocky 等）上执行：

```bash
# 1. 克隆代码或上传到服务器
git clone https://github.com/BDruby/GZH-Easy.git
cd GZH-Easy

# 2. 执行一键部署脚本（自动安装 Node 20、构建并配置开机自启）
sudo bash deploy.sh
```

部署完成后，脚本会显示公网访问地址 `http://<你的服务器IP>:43121`。

**常用管理命令**：
```bash
systemctl status gzh-easy   # 查看状态
systemctl restart gzh-easy  # 重启服务
systemctl stop gzh-easy     # 停止服务
journalctl -u gzh-easy -f   # 查看实时日志
```

### 方式二：Docker 容器化部署

```bash
docker compose up -d --build
```

---

## 说明

- 应用只调用兼容 OpenAI 的大模型 API（如 DeepSeek、通义千问等），Key 默认仅保存在浏览器本地 localStorage，安全无忧。

