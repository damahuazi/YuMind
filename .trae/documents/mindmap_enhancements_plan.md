# YuMind 右侧属性调整面板实现计划

## 需求概述

为 YuMind 思维导图应用增加右侧可折叠/展开的属性调整面板，根据选中状态呈现不同的属性配置项。

## 当前状态分析

### 已有的代码结构
- **技术栈**：React 18 + TypeScript + Vite + Tailwind CSS + Zustand
- **状态管理**：`useMindMapStore.ts` - 管理思维导图数据和节点选择
- **组件**：`MindMapCanvas.tsx`（画布）、`Node.tsx`（节点）、`Toolbar.tsx`（工具栏）
- **现有数据结构**：
  ```typescript
  interface Node {
    id: string;
    parentId: string | null;
    content: string;
    level: number;
    positionX: number;
    positionY: number;
    color: string;
    isRootNode: boolean;
  }
  ```

### 需要扩展的数据结构

```typescript
// 扩展 Node 接口，增加样式属性
interface NodeStyle {
  fontSize: 'small' | 'medium' | 'large'; // 文字大小
  fontColor: string;                        // 文字颜色
  textAlign: 'left' | 'center' | 'right';    // 文字对齐
  fillColor: string | 'transparent';        // 填充色（支持无色）
  borderColor: string;                      // 边框颜色
  borderWidth: 'thin' | 'medium' | 'thick'; // 边框粗细
  borderRadius: number;                     // 圆角
}

interface MindMapStyle {
  backgroundColor: string;                   // 画布背景颜色
  backgroundPattern: 'none' | 'grid' | 'dots' | 'lines'; // 背景图案
  layoutDirection: 'radial' | 'horizontal' | 'vertical'; // 结构方向
}
```

## 实施步骤

### 1. 扩展状态管理（useMindMapStore.ts）
- [ ] 扩展 `Node` 接口，增加样式属性
- [ ] 在 `MindMap` 接口中增加全局样式配置
- [ ] 实现批量更新同级别节点的功能
- [ ] 实现重置节点原始样式的功能

### 2. 创建属性面板组件（src/components/PropertyPanel.tsx）
- [ ] 创建可折叠/展开的面板容器
- [ ] 实现三种选中状态的切换逻辑
- [ ] 未选中状态：背景颜色选择、网格图案选择、结构方向选择
- [ ] 同级选中状态：完整的节点样式配置 + 重置/更新按钮
- [ ] 多级别选中状态：基于最高级别的样式配置

### 3. 实现样式配置UI
- [ ] 颜色选择器组件
- [ ] 边框粗细三档选择器
- [ ] 文字大小选择器
- [ ] 文字对齐方式选择器
- [ ] Pattern图案选择器
- [ ] 结构方向选择器（图标按钮组）

### 4. 更新 MindMapCanvas
- [ ] 应用画布背景颜色和图案
- [ ] 应用节点样式到 Node 组件
- [ ] 集成 PropertyPanel 到画布

### 5. 更新 Node 组件
- [ ] 使用新的样式属性
- [ ] 支持填充色为透明
- [ ] 支持边框样式配置

## 详细实现方案

### 属性面板结构

```
┌─────────────────────────────┐
│  属性面板              [折叠] │
├─────────────────────────────┤
│ ▼ 画布设置                    │
│   背景颜色：[选择器]           │
│   背景图案：[网格][点][线][无] │
│   结构方向：[图标组]           │
├─────────────────────────────┤
│ 或                           │
├─────────────────────────────┤
│ ▼ 节点样式                    │
│   文字大小：[小][中][大]       │
│   文字颜色：[选择器]           │
│   文字对齐：[左][中][右]       │
│   填充颜色：[选择器][透明]     │
│   边框颜色：[选择器]           │
│   边框粗细：[细][中][粗]       │
├─────────────────────────────┤
│ [重置]              [更新同级] │
└─────────────────────────────┘
```

### 三种状态的处理逻辑

1. **未选中任何节点**
   - 显示画布设置面板
   - 配置影响整个思维导图

2. **选中同一级别的节点**
   - 显示节点样式面板
   - 当前值取自第一个选中节点
   - "重置"按钮：恢复节点创建时的原始样式
   - "更新"按钮：将同级别的所有节点更新为新样式

3. **选中不同级别的节点**
   - 显示节点样式面板
   - 当前值取自**级别最高**（level 值最小）的节点
   - 修改后，所有选中节点（包括不同级别的）保持与最高级别节点一致的样式

### 关键实现细节

#### 同级节点更新
```typescript
const updateSameLevelNodes = (level: number, style: NodeStyle) => {
  const sameLevelNodes = currentMindMap.nodes.filter(n => n.level === level);
  const updates: Record<string, Partial<Node>> = {};
  sameLevelNodes.forEach(node => {
    updates[node.id] = { ...style };
  });
  updateMultipleNodes(updates);
};
```

#### 样式重置
```typescript
const resetNodeStyle = (nodeId: string) => {
  const originalStyle = getDefaultStyleForLevel(node.level);
  updateNode(nodeId, originalStyle);
};
```

#### 多级别统一
```typescript
const getHighestLevelNode = (nodeIds: string[]) => {
  return nodes
    .filter(n => nodeIds.includes(n.id))
    .sort((a, b) => a.level - b.level)[0];
};
```

## 文件清单

1. **src/hooks/useMindMapStore.ts** - 扩展状态管理
2. **src/components/PropertyPanel.tsx** - 新建属性面板组件
3. **src/components/MindMapCanvas.tsx** - 集成属性面板
4. **src/components/Node.tsx** - 应用节点样式
5. **src/index.css** - 可能需要添加的动画样式

## 验证步骤

1. 运行 `npm run check` 确保 TypeScript 类型正确
2. 运行 `npm run lint` 确保代码规范
3. 手动测试：
   - [ ] 未选中时调整画布背景
   - [ ] 未选中时切换结构方向
   - [ ] 选中同级别节点并批量更新样式
   - [ ] 重置节点样式
   - [ ] 选中不同级别节点并统一样式
   - [ ] 面板折叠/展开动画流畅
