#!/usr/bin/env bash
# ==============================================================================
# 公众号爆款文章工坊 (GZH-Easy) Linux 交互式管理与运维脚本
# 适用系统: Ubuntu / Debian / CentOS / AlmaLinux / Rocky Linux / Fedora
# 功能: 一键安装部署、代码热更新、启动/停止/重启、查看实时日志、修改端口、卸载
# ==============================================================================

GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
BOLD="\033[1m"
NC="\033[0m"

PROJECT_DIR=$(cd "$(dirname "$0")"; pwd)
SERVICE_NAME="gzh-easy"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# 检查 root 权限
check_root() {
  if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用 root 权限或 sudo 运行此脚本：${NC}"
    echo -e "${YELLOW}   sudo bash $0${NC}"
    exit 1
  fi
}

# 获取当前运行端口
get_port() {
  if [ -f "$SERVICE_FILE" ]; then
    local p=$(grep "Environment=PORT=" "$SERVICE_FILE" | cut -d '=' -f 3)
    if [ -n "$p" ]; then
      echo "$p"
      return
    fi
  fi
  echo "43121"
}

# 获取公网 IP
get_public_ip() {
  local ip=$(curl -s --connect-timeout 2 ifconfig.me || curl -s --connect-timeout 2 icanhazip.com || echo "127.0.0.1")
  echo "$ip"
}

# 获取服务运行状态文本
get_status_text() {
  if ! [ -f "$SERVICE_FILE" ]; then
    echo -e "${YELLOW}未安装服务${NC}"
  elif systemctl is-active --quiet "$SERVICE_NAME"; then
    local pid=$(systemctl show --property MainPID --value "$SERVICE_NAME")
    echo -e "${GREEN}● 运行中 (PID: ${pid})${NC}"
  else
    echo -e "${RED}○ 已停止${NC}"
  fi
}

# 1. 一键全新安装部署
install_and_deploy() {
  check_root
  local PORT=$(get_port)
  echo ""
  echo -e "${CYAN}======================================================${NC}"
  echo -e "${GREEN}       开始执行 GZH-Easy 全新一键安装部署            ${NC}"
  echo -e "${CYAN}======================================================${NC}"

  # 1.1 系统基础包
  echo -e "${YELLOW}🔍 检查并安装系统依赖 (curl, git)...${NC}"
  if command -v apt-get &> /dev/null; then
    apt-get update -y && apt-get install -y curl git
  elif command -v dnf &> /dev/null; then
    dnf install -y curl git
  elif command -v yum &> /dev/null; then
    yum install -y curl git
  fi

  # 1.2 检查/安装 Node.js 20 LTS
  local INSTALL_NODE=false
  if ! command -v node &> /dev/null; then
    INSTALL_NODE=true
  else
    local NODE_VER=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VER" -lt 18 ]; then
      INSTALL_NODE=true
    else
      echo -e "${GREEN}✅ Node.js 已就绪: $(node -v)${NC}"
    fi
  fi

  if [ "$INSTALL_NODE" = true ]; then
    echo -e "${YELLOW}📦 正在自动配置安装 Node.js 20 LTS...${NC}"
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
    fi
    echo -e "${GREEN}✅ Node.js 20 安装成功: $(node -v)${NC}"
  fi

  # 1.3 安装 npm 依赖
  echo ""
  echo -e "${YELLOW}📦 正在安装项目依赖 (npm install)...${NC}"
  cd "${PROJECT_DIR}"
  npm install --production=false

  # 1.4 构建生产前端产物
  echo ""
  echo -e "${YELLOW}🔨 正在编译生产环境前端 (npm run build)...${NC}"
  npm run build

  # 1.5 写入 Systemd 服务配置
  echo ""
  echo -e "${YELLOW}⚙️  注册系统守护服务 (${SERVICE_NAME}.service)...${NC}"
  local NODE_BIN=$(which node)

  cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=GZH-Easy Wechat Studio Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${PROJECT_DIR}
ExecStart=${NODE_BIN} server.mjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=${PORT}

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable "${SERVICE_NAME}"
  systemctl restart "${SERVICE_NAME}"

  # 1.6 配置防火墙
  if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
    ufw allow "${PORT}/tcp" &> /dev/null
    echo -e "${GREEN}✅ UFW 防火墙已放行 ${PORT} 端口${NC}"
  elif command -v firewall-cmd &> /dev/null && systemctl is-active --quiet firewalld; then
    firewall-cmd --zone=public --add-port="${PORT}/tcp" --permanent &> /dev/null
    firewall-cmd --reload &> /dev/null
    echo -e "${GREEN}✅ Firewalld 防火墙已放行 ${PORT} 端口${NC}"
  fi

  local PUB_IP=$(get_public_ip)
  echo ""
  echo -e "${GREEN}======================================================${NC}"
  echo -e "${GREEN}🎉 部署成功！服务已在后台运行并开启开机自启${NC}"
  echo -e "${GREEN}======================================================${NC}"
  echo -e "   公网访问: ${CYAN}http://${PUB_IP}:${PORT}${NC}"
  echo -e "   本地访问: ${CYAN}http://127.0.0.1:${PORT}${NC}"
  echo ""
  read -p "按回车键返回主菜单..."
}

# 2. 拉取最新代码并重新编译
update_project() {
  check_root
  echo ""
  echo -e "${CYAN}======================================================${NC}"
  echo -e "${GREEN}         更新项目至 GitHub 最新版本                  ${NC}"
  echo -e "${CYAN}======================================================${NC}"
  cd "${PROJECT_DIR}"

  echo -e "${YELLOW}📥 正在拉取远程代码 (git pull)...${NC}"
  git pull origin main || git pull

  echo -e "${YELLOW}📦 正在更新依赖 (npm install)...${NC}"
  npm install

  echo -e "${YELLOW}🔨 正在重新编译构建前端 (npm run build)...${NC}"
  npm run build

  if [ -f "$SERVICE_FILE" ]; then
    echo -e "${YELLOW}🔄 正在热重启后台服务...${NC}"
    systemctl restart "$SERVICE_NAME"
    echo -e "${GREEN}✅ 服务已完成平滑热重启！${NC}"
  fi

  echo ""
  read -p "按回车键返回主菜单..."
}

# 3. 启动服务
start_service() {
  check_root
  if ! [ -f "$SERVICE_FILE" ]; then
    echo -e "${RED}❌ 尚未安装系统服务，请先选择 [1] 进行安装部署${NC}"
  else
    systemctl start "$SERVICE_NAME"
    echo -e "${GREEN}✅ 服务已成功启动！${NC}"
  fi
  sleep 1
}

# 4. 停止服务
stop_service() {
  check_root
  if ! [ -f "$SERVICE_FILE" ]; then
    echo -e "${RED}❌ 尚未安装系统服务${NC}"
  else
    systemctl stop "$SERVICE_NAME"
    echo -e "${YELLOW}🛑 服务已停止运行${NC}"
  fi
  sleep 1
}

# 5. 重启服务
restart_service() {
  check_root
  if ! [ -f "$SERVICE_FILE" ]; then
    echo -e "${RED}❌ 尚未安装系统服务，请先选择 [1] 进行安装部署${NC}"
  else
    systemctl restart "$SERVICE_NAME"
    echo -e "${GREEN}✅ 服务已成功重启！${NC}"
  fi
  sleep 1
}

# 6. 查看服务状态
view_status() {
  echo ""
  echo -e "${CYAN}================ 服务运行状态 ================${NC}"
  if ! [ -f "$SERVICE_FILE" ]; then
    echo -e "${RED}❌ 尚未安装系统服务${NC}"
  else
    systemctl status "$SERVICE_NAME" --no-pager
  fi
  echo ""
  read -p "按回车键返回主菜单..."
}

# 7. 查看实时运行日志
view_logs() {
  echo ""
  echo -e "${CYAN}================ 实时运行日志 (Ctrl+C 退出) ================${NC}"
  journalctl -u "$SERVICE_NAME" -f -n 50
}

# 8. 修改服务端口
change_port() {
  check_root
  if ! [ -f "$SERVICE_FILE" ]; then
    echo -e "${RED}❌ 尚未安装系统服务，请先选择 [1] 进行安装部署${NC}"
    read -p "按回车键返回主菜单..."
    return
  fi

  local CURRENT_PORT=$(get_port)
  echo ""
  echo -e "${YELLOW}当前运行端口为: ${CYAN}${CURRENT_PORT}${NC}"
  read -p "请输入新的端口号 (1024~65535): " NEW_PORT

  if [[ ! "$NEW_PORT" =~ ^[0-9]+$ ]] || [ "$NEW_PORT" -lt 1024 ] || [ "$NEW_PORT" -gt 65535 ]; then
    echo -e "${RED}❌ 输入端口无效，请输入 1024 到 65535 之间的数字${NC}"
    sleep 2
    return
  fi

  sed -i "s/Environment=PORT=.*/Environment=PORT=${NEW_PORT}/g" "$SERVICE_FILE"
  systemctl daemon-reload
  systemctl restart "$SERVICE_NAME"

  # 放行新端口
  if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
    ufw allow "${NEW_PORT}/tcp" &> /dev/null
  elif command -v firewall-cmd &> /dev/null && systemctl is-active --quiet firewalld; then
    firewall-cmd --zone=public --add-port="${NEW_PORT}/tcp" --permanent &> /dev/null
    firewall-cmd --reload &> /dev/null
  fi

  echo -e "${GREEN}✅ 端口已成功修改为: ${NEW_PORT} 并已重启服务生效！${NC}"
  local PUB_IP=$(get_public_ip)
  echo -e "   新访问地址: ${CYAN}http://${PUB_IP}:${NEW_PORT}${NC}"
  echo ""
  read -p "按回车键返回主菜单..."
}

# 9. 卸载服务
uninstall_service() {
  check_root
  echo ""
  echo -e "${RED}⚠️  警告: 确定要完全卸载 ${SERVICE_NAME} 系统服务吗？(不会删除源代码)${NC}"
  read -p "请输入 [y/N] 确认: " CONFIRM
  if [[ "$CONFIRM" =~ ^[yY]$ ]]; then
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    systemctl disable "$SERVICE_NAME" 2>/dev/null || true
    rm -f "$SERVICE_FILE"
    systemctl daemon-reload
    echo -e "${GREEN}✅ 系统服务已成功卸载清理！${NC}"
  else
    echo -e "${YELLOW}已取消卸载操作${NC}"
  fi
  sleep 1.5
}

# ----------------- 交互式主菜单循环 -----------------
main_menu() {
  while true; do
    clear
    local PORT=$(get_port)
    local STATUS=$(get_status_text)
    local PUB_IP=$(get_public_ip)

    echo -e "${CYAN}==============================================================${NC}"
    echo -e "${BOLD}${GREEN}         公众号爆款文章工坊 (GZH-Easy) 交互式运维管理          ${NC}"
    echo -e "${CYAN}==============================================================${NC}"
    echo -e " 📁 项目目录: ${BOLD}${PROJECT_DIR}${NC}"
    echo -e " 📊 服务状态: ${STATUS}"
    echo -e " 🔌 运行端口: ${BOLD}${PORT}${NC}"
    echo -e " 🌐 访问地址: ${CYAN}http://${PUB_IP}:${PORT}${NC}"
    echo -e "${CYAN}--------------------------------------------------------------${NC}"
    echo -e " ${GREEN}1.${NC}  一键安装与全新部署 (Install & Deploy)"
    echo -e " ${GREEN}2.${NC}  拉取最新代码并重新构建 (Git Pull & Rebuild)"
    echo -e " ${CYAN}3.${NC}  启动服务 (Start)"
    echo -e " ${CYAN}4.${NC}  停止服务 (Stop)"
    echo -e " ${CYAN}5.${NC}  重启服务 (Restart)"
    echo -e " ${BLUE}6.${NC}  查看服务运行状态 (Status)"
    echo -e " ${BLUE}7.${NC}  查看实时运行日志 (Live Logs)"
    echo -e " ${YELLOW}8.${NC}  修改运行端口 (Change Port)"
    echo -e " ${RED}9.${NC}  卸载系统服务 (Uninstall Service)"
    echo -e " ${BOLD}0.${NC}  退出脚本 (Exit)"
    echo -e "${CYAN}==============================================================${NC}"
    read -p " 请输入操作编号 [0-9]: " OPTION

    case "$OPTION" in
      1) install_and_deploy ;;
      2) update_project ;;
      3) start_service ;;
      4) stop_service ;;
      5) restart_service ;;
      6) view_status ;;
      7) view_logs ;;
      8) change_port ;;
      9) uninstall_service ;;
      0) echo -e "${GREEN}再见！${NC}"; exit 0 ;;
      *) echo -e "${RED}输入有误，请输入 0 到 9 之间的数字${NC}"; sleep 1 ;;
    esac
  done
}

# 运行主菜单
main_menu
