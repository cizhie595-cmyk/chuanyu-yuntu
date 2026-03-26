# @pascal-app/core

川渝云图 3D 建筑编辑器核心库。

## 安装

```bash
npm install @pascal-app/core
```

## 对等依赖

```bash
npm install react three @react-three/fiber @react-three/drei
```

## 包含内容

- **节点模式** - 所有建筑原语的 Zod 模式（墙体、楼板、物品等）
- **场景状态** - 支持 IndexedDB 持久化和撤销/重做的 Zustand Store
- **系统** - 墙体、楼板、天花板、屋顶的几何生成
- **场景注册表** - 从节点 ID 到 Three.js 对象的快速查找
- **空间网格** - 碰撞检测和放置验证
- **事件总线** - 类型化事件发射器，用于组件间通信
- **资源存储** - 基于 IndexedDB 的用户上传资源文件存储

## 使用方法

```typescript
import { useScene, WallNode, ItemNode } from '@pascal-app/core'

// 创建墙体
const wall = WallNode.parse({
  points: [[0, 0], [5, 0]],
  height: 3,
  thickness: 0.2,
})

useScene.getState().createNode(wall, parentLevelId)

// 订阅场景变化
function MyComponent() {
  const nodes = useScene((state) => state.nodes)
  const walls = Object.values(nodes).filter(n => n.type === 'wall')

  return <div>墙体总数: {walls.length}</div>
}
```

## 节点类型

- `SiteNode` - 根容器（场地）
- `BuildingNode` - 场地内的建筑
- `LevelNode` - 楼层
- `WallNode` - 垂直墙体，支持可选开口
- `SlabNode` - 楼板
- `CeilingNode` - 天花板
- `RoofNode` - 屋顶几何体
- `ZoneNode` - 空间区域/房间
- `ItemNode` - 家具、固定装置、电器
- `ScanNode` - 3D 扫描参考
- `GuideNode` - 2D 参考图

## 系统

系统每帧处理脏节点以更新几何体：

- `WallSystem` - 墙体几何体，支持斜接和 CSG 切割
- `SlabSystem` - 楼板多边形生成
- `CeilingSystem` - 天花板几何体
- `RoofSystem` - 屋顶生成
- `ItemSystem` - 物品在墙面/天花板/地面上的定位

## 许可证

MIT
