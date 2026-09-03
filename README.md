# 公众号爆款文章工坊 (GZH-Easy)

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-18.3-blue.svg" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF.svg" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License" />
</p>

一句话主题 → 爆款标题矩阵 → 破题角度甄选 → 流式正文成稿 → 微信公众号专业可视化排版。

**GZH-Easy** 将公众号爆款写作方法论与专业排版美学（基于 [creator-buddy](https://github.com/SpaceZephyr/creator-buddy) 与 [gzh-design-skill](https://github.com/SpaceZephyr/gzh-design-skill)）落地为一个**本地即开即用、颜值极高、功能完善的交互式全流程创作工作台**。

---

## ✨ 核心特性

- 🎯 **16 种爆款标题矩阵**：批量产出多维标题候选，提供八维吸引力评分、安全合规风险分级、Top 5 场景化推荐（朋友圈/社群/公众号等）与 A/B 建议。
- 🧭 **差异化破题角度**：一键提炼 5~8 个高辨识度切入角度（反直觉、切身利益、行业对比、溯源剖析等），杜绝撞车与同质化。
- ✍️ **深度长文 / 精炼短文流式写作**：
  - 支持 1500~4000 字深度长文（破题式/大纲式）与 ≤1000 字第一人称观点短文。
  - **SSE 实时流式传输**，配有动态写作进度与字数统计。
  - **底层流式管道与保活心跳机制**（自动 Flush Headers 与 Ping 保持连接），彻底杜绝智谱 GLM、DeepSeek 等大模型在长文本生成时出现的网关 `504 Gateway Timeout`。
- 🎨 **专业级微信可视化排版编辑器 (WechatVisualEditor)**：
  - 融合 Doocs/mdnice 微信排版引擎与 `gzh-design-skill` 主题美学。
  - **9 大精选高颜值主题**：🎣 摸鱼绿、🔴 红白经典、✒️ 石墨极简、🍃 留白禅意、🧾 摸鱼票据、🫒 橄榄手记、⚡ 极客科技蓝、🔮 优雅极光紫、🔥 热点爆款橙。
  - **丰富的微信专用增强排版组件**：导读卡 (`:::lead`)、居中金句 (`:::quote`)、步骤徽章 (`:::step`)、重点提示卡 (`:::tip`)、警告注意卡 (`:::warning`)、指标数据卡 (`:::metric`)、macOS 终端代码块等。
  - **100% 微信富文本内联规范 (Inlined CSS)**：一键复制，直接粘贴至微信公众号后台，排版完美还原不走样。
  - 支持 **375px 手机真机与 677px PC 效果双模式实时预览**，字号（14~17px）、行高（1.6~2.0）、自定义品牌色拾色实时渲染。
- 🖼️ **无版权高清商用图库**：
  - 内置 CC0 / Unsplash 高清图库，涵盖科技AI、商务职场、认知成长、艺术创意、自然风景、生活极简等多大热门分类。
  - 支持分类筛选与关键词实时搜索，一键插入正文与排版区。
- 🤖 **全主流大模型与中转接口全兼容**：
  - 开箱预设：DeepSeek 官方、OpenAI (GPT-4o/o3-mini)、Google Gemini、Anthropic Claude、硅基流动 (SiliconFlow)、阿里云通义千问、智谱 GLM、月之暗面 Kimi、本地 Ollama 离线模型等。
  - 完美支持各类 OpenAI 兼容格式的第三方中转（OneAPI / NewAPI 等）。
  - 支持在页面顶部快速下拉切换模型，并在设置中自定义新增、编辑与测试模型连通性。
- 💾 **草稿实时自动保存与防误触**：
  - 主题、标题矩阵、角度、正文内容实时自动同步至本地 `localStorage`，刷新或意外关闭页面不丢失进度。
  - 页面防误刷新与误关闭拦截提示（`beforeunload`）。
- 📱 **全终端响应式自适应**：深度优化移动端界面显示，手机端浏览器同样舒适创作。
- ⚡ **一键全流程生成**：支持「一键全自动生成」，从主题输入到最终微信排版一步到位。

---

## 🛠️ Skills 方法论对应表

| 创作环节 | 核心方法论 / Skill | 功能与机制 |
|---|---|---|
| **起标题** | `baokuan-title-generator` | 16 种爆款方法批量出候选、八维评分、合规风险分级、Top 5 场景推荐、A/B 建议 |
| **选题角** | `gzh-longform-writer`（破题式） | 5~8 个高差异化角度，反直觉/切身利益/溯源，避免撞车 |
| **写长文** | `gzh-longform-writer`（破题式/大纲式） | 1500~4000 字、五大公众号约束、AI 腔黑名单清洗、成稿质检与流式保活 |
| **写短文** | `gzh-short-post` | ≤1000 字观点短文，第一人称、不说教、骨架 A/B |
| **专业排版** | `space-wechat-layout` + `gzh-design-skill` | 9 套经典主题、微信专用组件卡片、100% 纯内联样式转译、一键贴入公众号 |

---

## 🚀 快速开始

### 方式一：本地 Node.js 运行

需要环境：**Node.js 18+**

```bash
# 1. 克隆项目仓库
git clone https://github.com/BDruby/GZH-Easy.git
cd GZH-Easy

# 2. 安装依赖
npm install

# 3. 构建前端产物
npm run build

# 4. 启动服务（默认端口 43121）
npm start
```

启动后打开浏览器访问：**<http://127.0.0.1:43121>** 即可开始创作。

> **API Key 配置（三选一）**：
> 1. **网页右上角直接设置（推荐 ⭐）**：点击右上角「设置」图标输入 API Key 与 Base URL，信息仅存放在您当前浏览器的本地 `localStorage` 中，安全无忧。
> 2. **配置文件**：复制 `config.example.json` 为 `config.json` 并填入配置。
> 3. **环境变量**：设置系统环境变量 `OPENAI_API_KEY` 或 `DEEPSEEK_API_KEY`。

---

## 🐧 Linux 服务器一键交互式部署与运维

项目内置了针对 Linux（Ubuntu / Debian / CentOS / Rocky / AlmaLinux / Fedora 等）的**交互式运维管理面板**脚本 `deploy.sh`。

### 1. 执行一键部署

在服务器终端执行：

```bash
# 1. 克隆代码
git clone https://github.com/BDruby/GZH-Easy.git
cd GZH-Easy

# 2. 运行管理脚本（具备交互式菜单）
sudo bash deploy.sh
```

首次运行选择 `1`（一键安装与全新部署），脚本会自动检查并安装 Node.js 20、安装依赖、构建前端、注册 `systemd` 开机自启服务并立即启动。

### 2. 交互式运维面板功能

随时再次运行 `sudo bash deploy.sh`，可调出全能运维菜单：

```text
==============================================================
         公众号爆款文章工坊 (GZH-Easy) 交互式运维管理          
==============================================================
 📁 项目目录: /path/to/GZH-Easy
 📊 服务状态: ● 运行中 (PID: 12345)
 🔌 运行端口: 43121
 🌐 访问地址: http://<你的服务器IP>:43121
--------------------------------------------------------------
 1.  一键安装与全新部署 (Install & Deploy)
 2.  拉取最新代码并重新构建 (Git Pull & Rebuild)
 3.  启动服务 (Start)
 4.  停止服务 (Stop)
 5.  重启服务 (Restart)
 6.  查看服务运行状态 (Status)
 7.  查看实时运行日志 (Live Logs)
 8.  修改运行端口 (Change Port)
 9.  卸载系统服务 (Uninstall Service)
 0.  退出脚本 (Exit)
==============================================================
```

**常用 systemctl 原生命令**：
```bash
systemctl status gzh-easy   # 查看状态
systemctl restart gzh-easy  # 重启服务
systemctl stop gzh-easy     # 停止服务
journalctl -u gzh-easy -f   # 查看实时日志
```

---

## 🐳 Docker 容器化部署

已预置轻量级多阶段构建 `Dockerfile` 与 `docker-compose.yml`：

```bash
# 启动容器并在后台运行
docker compose up -d --build
```

访问 `http://<服务器IP或localhost>:43121` 即可使用。

如需停止或更新：
```bash
docker compose down
docker compose up -d --build
```

---

## ⚙️ 配置文件说明 (`config.json`)

根目录下 `config.json`（可选，优先级低于网页前端实时传入）：

```json
{
  "apiKey": "sk-...",
  "model": "deepseek-v4-flash",
  "port": 43121,
  "baseUrl": "https://api.deepseek.com"
}
```

- `port`：HTTP 服务监听端口（默认 `43121`，也支持环境变量 `PORT`）。
- `baseUrl`：兼容 OpenAI 规范的 API 基础端点。
- `model`：后端默认备用大模型名称。

---

## 📁 目录结构

```text
GZH-Easy/
├── src/                               # 现代化 React 前端代码
│   ├── App.jsx                        # 核心创作流程与工作台
│   ├── main.jsx                       # 前端挂载入口
│   ├── index.css                      # Tailwind 与全局排版样式
│   ├── components/
│   │   ├── ApiSettingsModal.jsx       # API / 大模型厂商配置与连通性测试
│   │   ├── ImagePickerModal.jsx       # 无版权商用图库选择器
│   │   ├── WechatEditor/
│   │   │   └── WechatVisualEditor.jsx # 微信公众号专业可视化排版编辑器
│   │   └── ui/                        # Spotlight 卡片、流光按钮、网格背景等 UI 组件
│   └── lib/
│       ├── stockImages.js             # CC0 / Unsplash 高清图库预设
│       ├── wechatFormatter.js         # 微信内联 CSS 转译引擎与 9 套精选主题
│       └── utils.js                   # 常用工具方法
├── lib/                               # 后端模块（Node.js 原生 ES Module）
│   ├── deepseek.mjs                   # 通用 OpenAI/DeepSeek 兼容封装（流式管道与保活）
│   └── prompts.mjs                    # 标题/角度/长文/短文/排版系统级提示词
├── server.mjs                         # 零重依赖本地 HTTP API 服务与静态托管
├── deploy.sh                          # Linux 交互式一键部署与运维管理脚本
├── Dockerfile                         # 多阶段 Docker 生产镜像构建
├── docker-compose.yml                 # Docker Compose 编排文件
├── config.example.json                # 配置文件示例
├── tailwind.config.js                 # Tailwind CSS 配置
├── vite.config.js                     # Vite 构建配置
└── package.json                       # 项目元信息与依赖
```

---

## 💡 使用步骤指南

1. **设定主题**：输入核心主题（可补充参考背景素材），选择文章类型（长文/短文）、期望字数与写作路线。
2. **生成与挑选标题**：点击「生成标题」，浏览 16 种爆款方法产出的标题候选，参考八维评分、合规提示，或直接挑选 Top 5 场景卡片。
3. **选择破题角度与写作**：
   - 破题式长文：点击「生成角度」，在 5~8 个反常识、切身相关的破题点中选一个；
   - 点击「开始写作」，正文将**实时流式生成**，并显示当前字数与生成进度；
   - 写作过程中可随时点击「搜索无版权图」插入高清配图。
4. **一键专业可视化排版**：
   - 生成的正文会自动同步至下方的**微信公众号可视化排版编辑器**；
   - 切换 9 套设计主题（如摸鱼绿、石墨极简、红白经典等），实时切换字号、行高与主色调；
   - 切换 **手机 (375px) / PC (677px)** 视图真机预览；
   - 点击**「复制公众号格式」**，直接在微信公众号后台编辑器中 `Ctrl+V` (或 `Cmd+V`) 粘贴，秒级发布！
5. **⚡ 一键生成全文**：若赶时间，直接点击「一键生成全文」，系统将自动串联标题生成 → 角度优选 → 正文流式成稿 → 微信内联排版全套流程。

---

## 🔒 隐私与安全说明

- 本应用在网页端配置的 API Key 仅保存在浏览器本地 `localStorage`，不会上传至任何第三方服务器。
- 请求直连大模型服务商（或用户配置的自定义代理网关），透明可靠，安全可信。

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 许可证开源。

特别感谢 [creator-buddy](https://github.com/SpaceZephyr/creator-buddy) 与 [gzh-design-skill](https://github.com/SpaceZephyr/gzh-design-skill) 的公众号方法论与排版灵感。
