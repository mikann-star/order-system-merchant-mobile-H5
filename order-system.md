# Order System 项目上下文

## 项目定位

- 项目名称：FKM 商家端移动 H5。
- 使用场景：商家通过手机浏览器访问网页链接，不开发或发布原生 App。
- 技术栈：React + TypeScript + Vite。
- 当前项目代码使用本地模拟数据；最终将接入 Supabase 数据库与认证。

## 代码与发布

- 仅保留 H5 仓库：`mikann-star/order-system-merchant-mobile-H5`。
- GitHub Pages 地址：`https://mikann-star.github.io/order-system-merchant-mobile-H5/`。
- GitHub Pages 使用 GitHub Actions 自动构建 Vite 的 `dist` 目录并部署。
- Vite 的生产构建需使用仓库子路径 `/order-system-merchant-mobile-H5/`，否则静态资源会加载失败。

## 协作约定

- 默认先在本地完成一批修改、验证后，再由用户确认是否推送到 GitHub。
- 不要为小改动频繁触发云端部署。
- 推送至 GitHub `main` 分支会触发 H5 自动部署。
- 未经确认，不提交未跟踪文件、环境变量或密钥。

## 后续计划

1. 创建免费的 Supabase 项目。
2. 执行 `supabase/schema.sql` 创建门店、账号、桌台、菜品、订单、预订和服务请求等数据表。
3. 在 `.env.local` 中填写 Supabase 的公开 URL 与 anon key（该文件不得提交）。
4. 将 `src/services/mock.ts` 的模拟数据服务逐步替换为真实接口。

## 已知事项

- `src/services/mock.ts` 仍是当前页面的数据来源。
- 本地存在未跟踪的“架构调整后压力测试.md”，除非用户明确要求，不纳入版本控制或部署。
