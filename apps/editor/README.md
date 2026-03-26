# 川渝云图 — 编辑器应用

基于 React Three Fiber 和 WebGPU 构建的农村自建房 3D 设计工具。

## 项目架构

本项目采用 Turborepo monorepo 架构，包含三个主要包：

```
chuanyu-yuntu/
├── apps/
│   └── editor/          # Next.js 应用（本包）
├── packages/
│   ├── core/            # 节点定义、状态管理、几何系统
│   └── viewer/          # 3D 渲染组件
```

详细架构说明请参阅根目录 [README.md](../../README.md)。

## 快速开始

```bash
# 安装依赖
bun install

# 运行开发服务器
bun dev

# 打开 http://localhost:3000
```

## 关键文件

| 路径 | 描述 |
|------|-------------|
| `app/page.tsx` | 编辑器主页面 |
| `app/share/[code]/page.tsx` | H5 移动端 3D 预览页 |
| `app/api/leads/` | 线索相关 API |
| `app/privacy/page.tsx` | 隐私政策 |
| `app/terms/page.tsx` | 服务条款 |
