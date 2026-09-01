#!/usr/bin/env bash
# ==============================================================================
# 公众号爆款文章工坊 (GZH-Easy) Linux 一键自动化部署脚本
# 适用系统: Ubuntu / Debian / CentOS / AlmaLinux / Rocky Linux / Fedora
# 特性: 自动检测安装 Node 20 LTS、安装依赖、构建前端、注册 Systemd 后台守护、配置开机自启与防火墙
# ==============================================================================

set -e

GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}      公众号爆款文章工坊 (GZH-Easy) Linux 一键部署      ${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

# 1. 检查 root 权限
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ 请以 root 用户或使用 sudo 运行此脚本：${NC}"
  echo -e "${YELLOW}   sudo bash deploy.sh${NC}"
  exit 1
fi

PROJECT_DIR=$(cd "$(dirname "$0")"; pwd)
SERVICE_NAME="gzh-easy"
PORT=43121

echo -e "${BLUE}📁 项目路径:${NC} ${PROJECT_DIR}"
echo -e "${BLUE}🚀 运行端口:${NC} ${PORT}"
echo ""

# 2. 检测并安装基础工具 (curl, git)
echo -e "${YELLOW}🔍 检查基础系统依赖...${NC}"
if command -v apt-get &> /dev/null; then
  apt-get update -y
  apt-get install -y curl git
elif command -v dnf &> /dev/null; then
  dnf install -y curl git
elif command -v yum &> /dev/null; then
  yum install -y curl git
fi

# 3. 检测与安装 Node.js (要求 >= 18，推荐 Node 20 LTS)
INSTALL_NODE=false
if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}⚠️ 未检测到 Node.js，准备安装 Node.js 20 LTS...${NC}"
  INSTALL_NODE=true
else
  NODE_VER=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
  if [ "$NODE_VER" -lt 18 ]; then
    echo -e "${YELLOW}⚠️ 当前 Node.js 版本 (v$NODE_VER) 过低，需要升级到 Node.js 20 LTS...${NC}"
    INSTALL_NODE=true
  else
    echo -e "${GREEN}✅ Node.js 已安装: $(node -v)${NC}"
  fi
fi

if [ "$INSTALL_NODE" = true ]; then
  if command -v apt-get &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  elif command -v dnf &> /dev/null || command -v yum &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    if command -v dnf &> /dev/null; then
      dnf install -y nodejs
    else
      yum install -y nodejs
    fi
  else
    echo -e "${RED}❌ 无法识别的包管理器，请手动安装 Node.js >= 18 后重试${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Node.js 20 安装成功: $(node -v)${NC}"
fi

# 4. 安装 npm 项目依赖
echo ""
echo -e "${YELLOW}📦 正在安装项目依赖 (npm install)...${NC}"
cd "${PROJECT_DIR}"
npm install --production=false

# 5. 编译 React 前端产物 (npm run build)
echo ""
echo -e "${YELLOW}🔨 正在编译打包前端生产产物 (npm run build)...${NC}"
npm run build

# 6. 配置 Systemd 系统守护进程 (开机自启、崩溃自动重启)
echo ""
echo -e "${YELLOW}⚙️  正在配置 Systemd 服务守护进程 (${SERVICE_NAME}.service)...${NC}"

NODE_BIN_PATH=$(which node)

cat <<EOF > /etc/systemd/system/${SERVICE_NAME}.service
[Unit]
Description=GZH-Easy Wechat Studio Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${PROJECT_DIR}
ExecStart=${NODE_BIN_PATH} server.mjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=${PORT}

[Install]
WantedBy=multi-user.target
EOF

# 7. 重载并启动服务
echo -e "${YELLOW}🔄 启动服务并设置开机自启...${NC}"
systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl restart ${SERVICE_NAME}

# 8. 开放防火墙端口
echo ""
echo -e "${YELLOW}🛡️ 检查并开放防火墙端口 (${PORT})...${NC}"
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
  ufw allow ${PORT}/tcp
  echo -e "${GREEN}✅ UFW 防火墙已开放端口 ${PORT}${NC}"
elif command -v firewall-cmd &> /dev/null && systemctl is-active --quiet firewalld; then
  firewall-cmd --zone=public --add-port=${PORT}/tcp --permanent
  firewall-cmd --reload
  echo -e "${GREEN}✅ Firewalld 已开放端口 ${PORT}${NC}"
else
  echo -e "${BLUE}ℹ️ 防火墙未激活或无需配置，请确保云服务器安全组已放行 ${PORT} 端口${NC}"
fi

# 9. 获取公网/内网 IP
PUBLIC_IP=$(curl -s --connect-timeout 3 ifconfig.me || curl -s --connect-timeout 3 icanhazip.com || echo "你的服务器公网IP")

echo ""
echo -e "${GREEN}======================================================${NC}"
echo -e "${GREEN}🎉 部署完成！公众号爆款文章工坊已在后台稳定运行${NC}"
echo -e "${GREEN}======================================================${NC}"
echo ""
echo -e "${BLUE}🌐 访问地址:${NC}"
echo -e "   👉 ${GREEN}http://${PUBLIC_IP}:${PORT}${NC}"
echo -e "   👉 ${GREEN}http://127.0.0.1:${PORT}${NC} (本地)"
echo ""
echo -e "${BLUE}📋 常用运维管理命令:${NC}"
echo -e "   查看服务状态: ${YELLOW}systemctl status ${SERVICE_NAME}${NC}"
echo -e "   查看实时日志: ${YELLOW}journalctl -u ${SERVICE_NAME} -f${NC}"
echo -e "   重启服务:     ${YELLOW}systemctl restart ${SERVICE_NAME}${NC}"
echo -e "   停止服务:     ${YELLOW}systemctl stop ${SERVICE_NAME}${NC}"
echo ""
echo -e "${YELLOW}⚠️ 提示: 如果通过公网无法打开，请前往云厂商后台（如阿里云/腾讯云/华为云）的安全组规则中添加放行 TCP ${PORT} 端口！${NC}"
echo ""
