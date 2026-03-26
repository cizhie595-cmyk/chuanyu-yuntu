# 《川渝云图》开发指南 (DEVELOPMENT.md)

本文档旨在为《川渝云图》开发团队提供技术架构概览、本地开发环境配置指南以及 V1.0 版本的核心开发任务清单。请在开始编写代码前仔细阅读。

## 一、 技术架构概览

本项目基于开源的 Pascal Editor 深度定制，采用 Turbo Monorepo 架构。

### 1.1 核心技术栈
- **前端框架**: Next.js 16 (App Router) + React 19 + TypeScript 5.9
- **3D 引擎**: Three.js 0.183 + React Three Fiber 9 + Drei 10
- **状态管理**: Zustand 5 + Zundo (用于撤销/重做)
- **样式方案**: TailwindCSS 4 + Radix UI
- **后端与数据库**: Supabase (PostgreSQL)
- **身份认证**: Better Auth
- **构建工具**: Turbo + Bun 1.3

### 1.2 Monorepo 目录结构
```text
chuanyu-yuntu/
├── apps/
│   └── editor/             # Next.js 主应用，负责路由、页面渲染、API 接口和鉴权
├── packages/
│   ├── core/               # 核心业务逻辑：场景 Schema (Zod)、状态管理 (use-scene)、建筑系统计算
│   ├── editor/             # 编辑器 UI 组件库：包含 150+ 个面板、工具栏、菜单组件
│   ├── viewer/             # 3D 渲染器：基于 R3F 的渲染逻辑、相机控制、材质管理
│   ├── ui/                 # 共享的基础 UI 组件
│   ├── eslint-config/      # 共享的 ESLint 配置
│   └── typescript-config/  # 共享的 TS 配置
└── package.json            # 根目录依赖与脚本
```

## 二、 本地开发环境配置

### 2.1 环境要求
- **Node.js**: >= 20.x
- **Bun**: >= 1.1.x (推荐使用 Bun 作为包管理器)
- **Git**: 用于版本控制

### 2.2 初始化步骤

1. **安装依赖**
   ```bash
   bun install
   ```

2. **配置环境变量**
   复制 `apps/editor/.env.example` 为 `apps/editor/.env.local`，并根据 `apps/editor/env.mjs` 的要求填入以下必填项：
   ```env
   # 数据库 (Supabase)
   POSTGRES_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

   # 身份认证 (Better Auth)
   BETTER_AUTH_SECRET="generate-a-random-secret-string"
   
   # 地图服务 (V1.0 需替换为高德地图)
   NEXT_PUBLIC_AMAP_API_KEY="your-amap-key"
   ```

3. **启动开发服务器**
   ```bash
   bun run dev
   ```
   启动后，访问 `http://localhost:3002` 即可预览编辑器。

## 三、 V1.0 核心开发任务清单

根据 PRD 文档，V1.0 版本的核心目标是跑通"工具→分享→留资→卖线索"的最小闭环。以下是具体的开发任务拆解：

### 3.1 全面汉化与快捷键重映射 (优先级：高)
- **目标**: 将编辑器中所有硬编码的英文文案替换为中文，并调整快捷键。
- **实施路径**:
  1. 在 `apps/editor` 中引入 `next-intl`。
  2. 提取 `packages/editor/src/components/ui/` 下的英文文案（如 `view-toggles.tsx`, `editor-commands.tsx`, `settings-panel/index.tsx` 等），建立 `zh-CN.json`。
  3. 修改 `packages/editor/src/components/ui/sidebar/panels/settings-panel/keyboard-shortcuts-dialog.tsx` 等文件，将撤销统一为 `Ctrl+Z`，删除统一为 `Delete/Backspace`。

### 3.2 中式素材库建设 (优先级：高)
- **目标**: 替换现有的西式家具，引入中式建筑与家具模型。
- **实施路径**:
  1. 修改 `packages/editor/src/components/ui/item-catalog/catalog-items.tsx`。
  2. 定义新的素材数据结构，分类包括：`structure` (结构), `furniture` (家具), `outdoor` (户外) 等。
  3. 将采购的 GLB 模型放入 `apps/editor/public/items/` 目录下，并配置缩略图。

### 3.3 地图服务替换 (优先级：中)
- **目标**: 移除 Google Maps，接入高德地图 Web JS API。
- **实施路径**:
  1. 移除 `apps/editor` 中对 Google Maps 的依赖。
  2. 修改 `packages/editor/src/components/ui/sidebar/panels/site-panel/index.tsx`，集成高德地图的地址搜索和卫星图切片加载功能。

### 3.4 身份认证扩展 (优先级：高)
- **目标**: 在 Better Auth 基础上，新增微信扫码登录和手机号验证码登录。
- **实施路径**:
  1. 在 `apps/editor/app/api/auth/[...better-auth]/route.ts` 中配置自定义 Provider。
  2. 对接阿里云短信 API 实现验证码发送逻辑。
  3. 开发前端登录弹窗组件，替换现有的登录逻辑。

### 3.5 云端存储与 H5 预览 (优先级：高)
- **目标**: 实现项目云端保存、生成分享链接以及移动端 H5 预览。
- **实施路径**:
  1. **云端保存**: 复用 `packages/editor/src/components/editor/index.tsx` 中的 `onSave` 回调，将 `useScene.getState().nodes` 序列化后存入 Supabase `projects` 表。
  2. **H5 预览**: 在 `apps/editor/app/` 下新建 `share/[code]/page.tsx`，仅加载 `@pascal-app/viewer`，禁用编辑工具，支持单指旋转、双指缩放。
  3. **微信分享**: 在 H5 页面注入 `wx.config`，自定义分享卡片。

### 3.6 线索派单引擎 (优先级：高)
- **目标**: 实现 C 端留资与 B 端抢单大厅。
- **实施路径**:
  1. **数据库**: 在 Supabase 中创建 `leads` 和 `lead_orders` 表。
  2. **C端表单**: 在 H5 预览页底部增加"获取本地施工报价"按钮，弹出留资表单，提交至 `/api/leads`。
  3. **B端大厅**: 开发抢单大厅页面，调用 `/api/leads/market` 获取脱敏线索，实现购买逻辑。

## 四、 代码规范与提交指南

1. **类型安全**: 严格使用 TypeScript，避免使用 `any`。核心数据模型必须通过 `packages/core/src/schema/` 中的 Zod 进行验证。
2. **状态管理**: 
   - 场景数据 (SceneGraph) 必须存放在 `useScene` (Zustand) 中。
   - 视图状态 (相机、选中状态) 存放在 `useViewer` 中。
   - 编辑器 UI 状态 (当前工具、面板开关) 存放在 `useEditor` 中。
3. **代码格式化**: 提交前请运行 `bun run lint` 和 `bun run check-types` 确保代码符合规范。
4. **提交信息**: 遵循 Conventional Commits 规范，如 `feat: add wechat login`, `fix: resolve wall rendering issue`。

---
*文档维护者：川渝云图开发团队*
*最后更新：2026-03-27*
