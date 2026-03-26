# 贡献指南 - 川渝云图

感谢您有兴趣参与贡献！我们欢迎各种形式的贡献 — Bug 修复、新功能、文档和创意。

## 快速开始

### 前置要求

- [Bun](https://bun.sh/) 1.3+（或 Node.js 18+）

### 环境搭建

```bash
git clone https://github.com/cizhie595-cmyk/chuanyu-yuntu.git
cd chuanyu-yuntu
bun install
bun dev
```

编辑器将在 **http://localhost:3000** 运行。就这么简单！

### 可选配置

将 `.env.example` 复制为 `.env`，添加高德地图 API Key 以启用地址搜索功能。编辑器在没有它的情况下也能完整运行。

## 提交更改

### 代码风格

我们使用 [Biome](https://biomejs.dev/) 进行代码检查和格式化。提交 PR 前请运行：

```bash
bun check        # 检查问题
bun check:fix    # 自动修复问题
```

### 项目结构

| 包 | 功能 |
|---------|-------------|
| `packages/core` | 场景模式、状态管理、系统 — 无 UI |
| `packages/viewer` | 基于 React Three Fiber 的 3D 渲染 |
| `apps/editor` | 完整的编辑器应用（Next.js） |

关键规则：**`packages/viewer` 不得从 `apps/editor` 导入**。Viewer 是独立组件；编辑器特有行为通过 props/children 注入。

## 提交 PR

1. **Fork 仓库**并从 `main` 创建分支
2. **进行更改**并使用 `bun dev` 在本地测试
3. **运行 `bun check`** 确保代码检查通过
4. **提交 PR**，清晰描述更改内容和原因
5. **关联相关 Issue**（如适用，例如 "Fixes #42"）

### PR 建议

- 保持 PR 聚焦 — 每个 PR 只包含一个功能或修复
- 视觉变更请附上截图或录屏
- 如果对实现方式不确定，请先创建 Issue 或讨论

## 报告 Bug

请在 [Issues](https://github.com/cizhie595-cmyk/chuanyu-yuntu/issues) 中提交 Bug 报告，包含复现步骤 — 这有助于我们更快修复问题。

## 功能建议

请在 [Issues](https://github.com/cizhie595-cmyk/chuanyu-yuntu/issues) 中提交功能请求，或在 [Discussions](https://github.com/cizhie595-cmyk/chuanyu-yuntu/discussions) 中发起讨论。

## 有问题？

前往 [Discussions](https://github.com/cizhie595-cmyk/chuanyu-yuntu/discussions) — 我们很乐意帮助！
