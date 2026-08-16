# FKM 商家端移动网页

面向手机浏览器的经营管理网页，使用 React + TypeScript + Vite 构建。它不是原生 App，也无需下载安装到手机；将链接发给用户后，可直接在微信、Safari 或 Chrome 中打开。

## 分支说明

- `app-original`：原始 App 风格界面，完整保留当前版本。
- `mobile-web`：移动网页版本，也是后续接入 Supabase 和部署的分支。

## 启动

安装 Node.js 20+ 后，在本目录执行：

```bash
npm install
npm run dev
```

## 免费部署路径

1. 将本仓库推送到 GitHub（建议设为私有仓库）。
2. 在 Vercel 导入 `mobile-web` 分支，使用免费 Hobby 计划部署。
3. 在 Supabase 创建免费项目，在 SQL Editor 运行 `supabase/schema.sql`。
4. 将 `.env.example` 复制为 `.env.local`，填写 Supabase 项目的 URL 与 anon key；该文件已被 Git 忽略，不能上传。

数据库脚本已按门店隔离并启用了行级权限。尚未填写真实 Supabase 配置时，项目继续使用本地模拟数据，方便演示。

演示账号：`demo`；密码：`123456`。

## 已实现

- 首次登录保护与退出确认
- 桌台、订单、预订、更多、我的五个一级页面
- 桌台状态更新、订单确认、预订状态流转等模拟交互
- 菜品、服务请求、客户反馈、财务、店铺/AI/系统设置入口

真实接口接入时，可将 `src/services/mock.ts` 中的模拟服务替换为 HTTP 实现，页面数据类型保持不变。
