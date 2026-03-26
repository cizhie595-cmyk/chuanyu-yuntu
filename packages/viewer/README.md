# @pascal-app/viewer

川渝云图 3D 建筑查看器组件。

## 安装

```bash
npm install @pascal-app/viewer @pascal-app/core
```

## 对等依赖

```bash
npm install react three @react-three/fiber @react-three/drei
```

## 包含内容

- **Viewer 组件** - 基于 WebGPU 的 3D 查看器，带相机控制
- **节点渲染器** - 所有节点类型的 React Three Fiber 组件
- **后处理** - SSGI（环境光遮蔽 + 全局光照）、TRAA（抗锯齿）、轮廓效果
- **楼层系统** - 楼层可见性和定位（堆叠/展开/独立模式）
- **墙体剖切系统** - 根据相机位置动态隐藏墙体
- **资源 URL 辅助** - 模型和纹理的 CDN URL 解析

## 使用方法

```typescript
import { Viewer, useViewer } from '@pascal-app/viewer'
import { useScene } from '@pascal-app/core'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Viewer />
    </div>
  )
}
```

## 自定义相机控制

```typescript
import { Viewer } from '@pascal-app/viewer'
import { CameraControls } from '@react-three/drei'

function App() {
  return (
    <Viewer selectionManager="custom">
      <CameraControls />
    </Viewer>
  )
}
```

## Viewer 状态

```typescript
import { useViewer } from '@pascal-app/viewer'

function ViewerControls() {
  const levelMode = useViewer(s => s.levelMode)
  const setLevelMode = useViewer(s => s.setLevelMode)
  const wallMode = useViewer(s => s.wallMode)
  const setWallMode = useViewer(s => s.setWallMode)

  return (
    <div>
      <button onClick={() => setLevelMode('stacked')}>堆叠</button>
      <button onClick={() => setLevelMode('exploded')}>展开</button>
      <button onClick={() => setWallMode('cutaway')}>剖切</button>
      <button onClick={() => setWallMode('up')}>完整高度</button>
    </div>
  )
}
```

## 资源 CDN 辅助

```typescript
import { resolveCdnUrl, ASSETS_CDN_URL } from '@pascal-app/viewer'

// 将相对路径解析为 CDN URL
const url = resolveCdnUrl('/items/chair/model.glb')

// 处理外部 URL 和 asset:// 协议
const externalUrl = resolveCdnUrl('https://example.com/model.glb')
// → 'https://example.com/model.glb'（不变）
```

## 功能特性

- **WebGPU 渲染** - 通过 Three.js WebGPU 实现硬件加速渲染
- **后处理** - SSGI 实现逼真光照、轮廓效果用于选择高亮
- **楼层模式** - 堆叠、展开或独立楼层显示
- **墙体剖切** - 自动隐藏墙体以查看室内
- **相机模式** - 透视和正交投影
- **扫描/参考支持** - 3D 扫描和 2D 参考图

## 许可证

MIT
