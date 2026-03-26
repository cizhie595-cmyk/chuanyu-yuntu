# 川渝云图 — 架构说明

## 项目结构

使用 Turborepo 管理的 Monorepo。packages 为共享库；apps 为可部署应用。

```
apps/
  editor/          # 主 Next.js 应用（编辑器 + 公共路由）
packages/
  core/            # 场景模式、状态、系统、空间逻辑
  viewer/          # 3D 画布组件（React Three Fiber）
  ui/              # 共享 React UI 组件
```

---

## packages/core

核心库 — 无 UI、无渲染。其他所有模块依赖于此。

- **schema/** — 所有节点类型的 TypeScript 类型定义（`Wall`、`Slab`、`Door`、`Item` 等）
- **store/** — Zustand 场景 Store（`useScene`），通过 Zundo 支持撤销/重做
- **systems/** — 各元素的业务逻辑：几何生成、约束（`WallSystem`、`SlabSystem`、`DoorSystem` 等）
- **events/** — 节点变更的类型化事件总线
- **hooks/** — `useRegistry`（节点 ID → THREE.Object3D）、`useSpatialGrid`（2D 空间索引）
- **lib/** — 空间检测、资源存储、多边形工具

节点存储为扁平字典（`nodes: Record<id, AnyNode>`）。系统是在渲染循环中运行的纯逻辑；它们读取节点并写回派生的几何体。

---

## packages/viewer

3D 画布组件 — 仅负责展示，不涉及编辑器逻辑。

- **components/viewer/** — 根 `<Viewer>` 画布、相机、灯光、后处理、选择管理器
- **components/renderers/** — 每种节点类型一个渲染器（`WallRenderer`、`SlabRenderer` 等），由 `NodeRenderer` → `SceneRenderer` 分发
- **systems/** — Viewer 特有系统：`LevelSystem`（堆叠/展开/独立）、`WallCutout`、`ZoneSystem`、`InteractiveSystem`
- **store/** — `useViewer`：选择路径、相机模式、楼层模式、墙体模式、主题、显示开关

Viewer 接受外部 props 和回调（`onSelect`、`onExport`、children）以暴露控制点。它不得从 `apps/editor` 导入任何内容。

---

## apps/editor

Next.js 16 应用。将 `@pascal-app/viewer` 和 `@pascal-app/core` 组合为完整的编辑体验。

- **app/editor/[projectId]/** — 主编辑器路由
- **app/viewer/[id]/** — 只读预览路由
- **app/share/[code]/** — H5 移动端 3D 预览页
- **store/use-editor.tsx** — `useEditor`：阶段（`site | structure | furnish`）、模式（`select | edit | delete | build`）、当前工具
- **components/tools/** — 每个工具一个组件，由 `ToolManager` 协调
- **components/systems/** — 编辑器侧系统，与 viewer 集成（如剖面空间检测）
- **components/editor/** — 相机控制、导出、菜单、面板

---

## 数据流

```
用户输入（鼠标/键盘）
  → 工具组件（apps/editor/components/tools/）
  → useScene 变更
  → 核心系统重新计算几何体
  → 渲染器重新渲染 THREE 网格
  → useViewer 更新选择/悬停
```

---

## 关键约定

- **扁平节点** — 所有场景节点存储在单个扁平记录中；层级关系通过 `parentId` 表达。
- **系统/渲染器分离** — 系统负责逻辑；渲染器负责几何体和材质。不可混用。
- **Viewer 隔离** — `@pascal-app/viewer` 不得从 `apps/editor` 导入。编辑器特有行为（工具、系统、选择）通过 children 或 props 注入。
- **注册表模式** — `useRegistry()` 将节点 ID 映射到活跃的 THREE 对象，无需遍历树。
- **空间网格** — 2D 网格用于快速墙体/区域邻域查询；避免暴力迭代。
- **节点创建** — 始终使用 `NodeType.parse({…})` 然后 `createNode(node, parentId)`。不要直接构造原始节点对象。

---

## 技术栈

| 层 | 技术 |
|---|---|
| 3D | Three.js（WebGPU）、React Three Fiber |
| 框架 | Next.js 16、React 19 |
| 状态 | Zustand + Zundo |
| UI | Radix UI、Tailwind CSS 4 |
| 工具链 | Biome、TypeScript 5.9、Turborepo |
