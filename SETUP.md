# 川渝云图 — 环境搭建

## 前置要求

- [Bun](https://bun.sh/) 1.3+（或 Node.js 18+）

## 快速开始

```bash
bun install
bun dev
```

编辑器将在 **http://localhost:3000** 运行。

## 环境变量（可选）

如需配置环境变量，请复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

| 变量 | 必填 | 描述 |
|----------|----------|-------------|
| `NEXT_PUBLIC_AMAP_API_KEY` | 否 | 启用编辑器中的地址搜索功能（高德地图） |
| `PORT` | 否 | 开发服务器端口（默认：3000） |

编辑器在没有任何环境变量的情况下也能完整运行。

## Monorepo 结构

```
├── apps/
│   └── editor/          # Next.js 编辑器应用
├── packages/
│   ├── core/            # @pascal-app/core — 场景模式、状态、系统
│   ├── viewer/          # @pascal-app/viewer — 3D 渲染
│   └── ui/              # 共享 UI 组件
└── tooling/             # 构建与发布工具
```

## 脚本命令

| 命令 | 描述 |
|---------|-------------|
| `bun dev` | 启动开发服务器 |
| `bun build` | 构建所有包 |
| `bun check` | 代码检查和格式化检查（Biome） |
| `bun check:fix` | 自动修复代码检查和格式化问题 |
| `bun check-types` | TypeScript 类型检查 |

## 贡献

请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解提交 PR 和报告问题的指南。
