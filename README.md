# 川渝云图

农村自建房3D设计工具，基于 React Three Fiber 和 WebGPU 构建。

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

https://github.com/user-attachments/assets/8b50e7cf-cebe-4579-9cf3-8786b35f7b6b



## 项目架构

本项目采用 Turborepo monorepo 架构，包含三个主要包：

```
chuanyu-yuntu/
├── apps/
│   └── editor/          # Next.js 应用（川渝云图主站）
├── packages/
│   ├── core/            # 节点定义、状态管理、几何系统
│   └── viewer/          # 3D 渲染组件
```

### 职责分离

| 包 | 职责 |
|---------|---------------|
| **@pascal-app/core** | 节点模式定义、场景状态（Zustand）、几何生成系统、空间查询、事件总线 |
| **@pascal-app/viewer** | 基于 React Three Fiber 的 3D 渲染、默认相机/控制器、后处理 |
| **apps/editor** | UI 组件、工具、自定义行为、编辑器特有系统 |

**viewer** 负责以合理默认值渲染场景。**editor** 在此基础上扩展交互工具、选择管理和编辑功能。

### 状态管理

每个包有独立的 Zustand Store 管理状态：

| Store | 所属包 | 职责 |
|-------|---------|----------------|
| `useScene` | `@pascal-app/core` | 场景数据：节点、根ID、脏节点、CRUD操作。通过 IndexedDB 持久化，Zundo 支持撤销/重做。 |
| `useViewer` | `@pascal-app/viewer` | 视图状态：当前选择（建筑/楼层/区域ID）、楼层显示模式（堆叠/展开/独立）、相机模式。 |
| `useEditor` | `apps/editor` | 编辑器状态：当前工具、结构层可见性、面板状态、编辑器偏好设置。 |

**访问模式：**

```typescript
// 在 React 组件中订阅状态变化
const nodes = useScene((state) => state.nodes)
const levelId = useViewer((state) => state.selection.levelId)
const activeTool = useEditor((state) => state.tool)

// 在 React 外部访问状态（回调、系统）
const node = useScene.getState().nodes[id]
useViewer.getState().setSelection({ levelId: 'level_123' })
```

---

## 核心概念

### 节点（Nodes）

节点是描述3D场景的数据原语。所有节点继承自 `BaseNode`：

```typescript
BaseNode {
  id: string              // 自动生成，带类型前缀（如 "wall_abc123"）
  type: string            // 类型判别符，用于类型安全处理
  parentId: string | null // 父节点引用
  visible: boolean
  camera?: Camera         // 可选的保存相机位置
  metadata?: JSON         // 任意元数据（如 { isTransient: true }）
}
```

**节点层级：**

```
Site（场地）
└── Building（建筑）
    └── Level（楼层）
        ├── Wall（墙体）→ Item（门、窗）
        ├── Slab（楼板）
        ├── Ceiling（天花板）→ Item（灯具）
        ├── Roof（屋顶）
        ├── Zone（区域）
        ├── Scan（3D参考）
        └── Guide（2D参考）
```

节点存储在**扁平字典**（`Record<id, Node>`）中，而非嵌套树。父子关系通过 `parentId` 和 `children` 数组定义。

---

### 场景状态（Zustand Store）

场景由 `@pascal-app/core` 中的 Zustand Store 管理：

```typescript
useScene.getState() = {
  nodes: Record<id, AnyNode>,  // 所有节点
  rootNodeIds: string[],       // 顶层节点（场地）
  dirtyNodes: Set<string>,     // 待系统更新的节点

  createNode(node, parentId),
  updateNode(id, updates),
  deleteNode(id),
}
```

**中间件：**
- **Persist** - 保存到 IndexedDB（排除临时节点）
- **Temporal**（Zundo）- 50步历史的撤销/重做

---

### 场景注册表

注册表将节点ID映射到 Three.js 对象，实现快速查找：

```typescript
sceneRegistry = {
  nodes: Map<id, Object3D>,    // ID → 3D 对象
  byType: {
    wall: Set<id>,
    item: Set<id>,
    zone: Set<id>,
    // ...
  }
}
```

渲染器通过 `useRegistry` Hook 注册其引用：

```tsx
const ref = useRef<Mesh>(null!)
useRegistry(node.id, 'wall', ref)
```

这使系统可以直接访问3D对象，无需遍历场景图。

---

### 节点渲染器

渲染器是为每种节点类型创建 Three.js 对象的 React 组件：

```
SceneRenderer
└── NodeRenderer（按类型分发）
    ├── BuildingRenderer
    ├── LevelRenderer
    ├── WallRenderer
    ├── SlabRenderer
    ├── ZoneRenderer
    ├── ItemRenderer
    └── ...
```

**模式：**
1. 渲染器创建占位网格/组
2. 通过 `useRegistry` 注册
3. 系统根据节点数据更新几何体

示例（简化版）：
```tsx
const WallRenderer = ({ node }) => {
  const ref = useRef<Mesh>(null!)
  useRegistry(node.id, 'wall', ref)

  return (
    <mesh ref={ref}>
      <boxGeometry args={[0, 0, 0]} />  {/* 由 WallSystem 替换 */}
      <meshStandardMaterial />
      {node.children.map(id => <NodeRenderer key={id} nodeId={id} />)}
    </mesh>
  )
}
```

---

### 系统（Systems）

系统是在渲染循环（`useFrame`）中运行的 React 组件，用于更新几何体和变换。它们处理 Store 标记的**脏节点**。

**核心系统（`@pascal-app/core`）：**

| 系统 | 职责 |
|--------|---------------|
| `WallSystem` | 生成墙体几何体，支持斜接和门窗CSG切割 |
| `SlabSystem` | 从多边形生成楼板几何体 |
| `CeilingSystem` | 生成天花板几何体 |
| `RoofSystem` | 生成屋顶几何体 |
| `ItemSystem` | 将物品放置在墙面、天花板或地面上（楼板高程） |

**视图系统（`@pascal-app/viewer`）：**

| 系统 | 职责 |
|--------|---------------|
| `LevelSystem` | 处理楼层可见性和垂直定位（堆叠/展开/独立模式） |
| `ScanSystem` | 控制3D扫描可见性 |
| `GuideSystem` | 控制参考图可见性 |

**处理模式：**
```typescript
useFrame(() => {
  for (const id of dirtyNodes) {
    const obj = sceneRegistry.nodes.get(id)
    const node = useScene.getState().nodes[id]

    // 更新几何体、变换等
    updateGeometry(obj, node)

    dirtyNodes.delete(id)
  }
})
```

---

### 脏节点

当节点发生变化时，会在 `useScene.getState().dirtyNodes` 中标记为**脏**。系统每帧检查此集合，仅为脏节点重新计算几何体。

```typescript
// 自动标记：createNode、updateNode、deleteNode 会标记节点为脏
useScene.getState().updateNode(wallId, { thickness: 0.2 })
// → wallId 添加到 dirtyNodes
// → WallSystem 在下一帧重新生成几何体
// → wallId 从 dirtyNodes 移除
```

**手动标记：**
```typescript
useScene.getState().dirtyNodes.add(wallId)
```

---

### 事件总线

组件间通信使用类型化事件发射器（mitt）：

```typescript
// 节点事件
emitter.on('wall:click', (event) => { ... })
emitter.on('item:enter', (event) => { ... })
emitter.on('zone:context-menu', (event) => { ... })

// 网格事件（背景）
emitter.on('grid:click', (event) => { ... })

// 事件载荷
NodeEvent {
  node: AnyNode
  position: [x, y, z]
  localPosition: [x, y, z]
  normal?: [x, y, z]
  stopPropagation: () => void
}
```

---

### 空间网格管理器

处理碰撞检测和放置验证：

```typescript
spatialGridManager.canPlaceOnFloor(levelId, position, dimensions, rotation)
spatialGridManager.canPlaceOnWall(wallId, t, height, dimensions)
spatialGridManager.getSlabElevationAt(levelId, x, z)
```

物品放置工具使用它来验证位置和计算楼板高程。

---

## 编辑器架构

编辑器在 viewer 基础上扩展了：

### 工具

工具通过工具栏激活，处理特定操作的用户输入：

- **选择工具** - 选择和操作
- **墙体工具** - 绘制墙体
- **区域工具** - 创建区域
- **物品工具** - 放置家具/固定装置
- **楼板工具** - 创建楼板

### 选择管理器

编辑器使用自定义选择管理器，支持层级导航：

```
场地 → 建筑 → 楼层 → 区域 → 物品
```

每个深度层级有自己的悬停/点击选择策略。

### 编辑器特有系统

- `ZoneSystem` - 根据楼层模式控制区域可见性
- 自定义相机控制，支持节点聚焦

---

## 数据流

```
用户操作（点击、拖拽）
       ↓
工具处理器
       ↓
useScene.createNode() / updateNode()
       ↓
节点在 Store 中添加/更新
节点标记为脏
       ↓
React 重新渲染 NodeRenderer
useRegistry() 注册 3D 对象
       ↓
系统检测到脏节点（useFrame）
通过 sceneRegistry 更新几何体
清除脏标记
```

---

## 技术栈

- **React 19** + **Next.js 16**
- **Three.js**（WebGPU 渲染器）
- **React Three Fiber** + **Drei**
- **Zustand**（状态管理）
- **Zod**（模式验证）
- **Zundo**（撤销/重做）
- **three-bvh-csg**（布尔几何运算）
- **Turborepo**（monorepo 管理）
- **Bun**（包管理器）

---

## 快速开始

### 开发环境

从**根目录**运行开发服务器，以启用所有包的热重载：

```bash
# 安装依赖
bun install

# 运行开发服务器（构建包 + 启动编辑器的监听模式）
bun dev

# 这将：
# 1. 构建 @pascal-app/core 和 @pascal-app/viewer
# 2. 开始监听两个包的文件变化
# 3. 启动 Next.js 编辑器开发服务器
# 打开 http://localhost:3000
```

**重要：** 始终从根目录运行 `bun dev`，以确保包监听器正在运行。这样在编辑 `packages/core/src/` 或 `packages/viewer/src/` 中的文件时可以实现热重载。

### 生产构建

```bash
# 构建所有包
turbo build

# 构建特定包
turbo build --filter=@pascal-app/core
```

---

## 关键文件

| 路径 | 描述 |
|------|-------------|
| `packages/core/src/schema/` | 节点类型定义（Zod 模式） |
| `packages/core/src/store/use-scene.ts` | 场景状态 Store |
| `packages/core/src/hooks/scene-registry/` | 3D 对象注册表 |
| `packages/core/src/systems/` | 几何生成系统 |
| `packages/viewer/src/components/renderers/` | 节点渲染器 |
| `packages/viewer/src/components/viewer/` | 主 Viewer 组件 |
| `apps/editor/components/tools/` | 编辑器工具 |
| `apps/editor/store/` | 编辑器特有状态 |
| `apps/editor/app/api/` | API 路由（认证、线索、项目、同步） |
| `apps/editor/lib/auth.ts` | Better Auth 认证配置 |
| `apps/editor/lib/supabase.ts` | Supabase 客户端工具 |
| `apps/editor/lib/amap.ts` | 高德地图地址解析 |
| `apps/editor/scripts/migrate.mjs` | 数据库迁移脚本 |

---

## 环境变量

复制 `.env.example` 为 `.env` 并填写以下变量：

| 变量 | 必填 | 说明 |
|------|------|------|
| `POSTGRES_URL` | ✅ | Supabase PostgreSQL 连接字符串 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase Service Role Key |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 项目 URL |
| `BETTER_AUTH_SECRET` | ✅ | JWT 签名密钥 |
| `JWT_SECRET` | ✅ | JWT 加密密钥 |
| `AMAP_KEY` | 可选 | 高德地图 Web 服务 API Key |
| `NEXT_PUBLIC_ASSETS_CDN_URL` | 可选 | 静态资源 CDN 地址 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 可选 | Supabase Anon Key |

---

## 部署

### Vercel 部署

1. 在 [Vercel](https://vercel.com) 导入本仓库
2. 设置 Root Directory 为 `apps/editor`
3. Framework Preset 选择 `Next.js`
4. 在 Environment Variables 中配置上述环境变量
5. 部署前运行数据库迁移：`node apps/editor/scripts/migrate.mjs`

### Supabase 配置

1. 创建 [Supabase](https://supabase.com) 项目
2. 运行 `apps/editor/scripts/migrate.mjs` 创建数据库表
3. 启用 Row Level Security (RLS) 策略（迁移脚本已包含）

---

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/sms/send` | POST | 发送短信验证码 |
| `/api/auth/sms/verify` | POST | 验证码登录/注册 |
| `/api/auth/me` | GET | 获取当前用户信息 |
| `/api/projects` | GET/POST | 项目列表/创建项目 |
| `/api/projects/[id]/sync` | GET/POST | 项目云同步 |
| `/api/projects/share/[code]` | GET | 通过分享码获取项目 |
| `/api/leads` | POST | 业主提交留资 |
| `/api/leads/market` | GET | 抢单大厅线索列表 |
| `/api/leads/[id]/buy` | POST | 包工头购买线索 |
| `/api/leads/orders` | GET | 包工头订单列表 |
