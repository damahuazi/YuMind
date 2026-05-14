import React, { useState, useRef, useEffect } from 'react';
import { useMindMapStore, Node as NodeType } from '../hooks/useMindMapStore';
import Node from './Node';

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const MindMapCanvas: React.FC = () => {
  const {
    currentMindMap,
    selectedNodeId,
    selectedNodeIds,
    setSelectedNodeId,
    setSelectedNodeIds,
    toggleNodeSelection,
    updateNode,
    updateMultipleNodes,
    addFreeNode,
    deleteNode,
    createNewMindMap
  } = useMindMapStore();

  const [pan, setPan] = useState({ x: 400, y: 300 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isDraggingNodes, setIsDraggingNodes] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentMindMap) {
      createNewMindMap();
    }
  }, [currentMindMap, createNewMindMap]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Tab 添加子节点
      if (e.key === 'Tab' && selectedNodeId) {
        e.preventDefault();
        const targetNodeId = selectedNodeIds.length > 0 
          ? selectedNodeIds[selectedNodeIds.length - 1] 
          : selectedNodeId;
        const { addNode } = useMindMapStore.getState();
        addNode(targetNodeId);
      }
      
      // Enter 添加同级节点
      if (e.key === 'Enter' && selectedNodeId) {
        e.preventDefault();
        const targetNodeId = selectedNodeIds.length > 0 
          ? selectedNodeIds[selectedNodeIds.length - 1] 
          : selectedNodeId;
        const selectedNode = currentMindMap?.nodes.find(n => n.id === targetNodeId);
        if (selectedNode?.parentId) {
          const { addNode } = useMindMapStore.getState();
          addNode(selectedNode.parentId);
        }
      }
      
      // Delete 删除节点 - 主节点完全禁止删除
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault();
        const targetIds = selectedNodeIds.length > 0 ? selectedNodeIds : [selectedNodeId];
        
        // 检查是否包含任何主节点（parentId === null）
        const hasRootNode = targetIds.some(id => {
          const node = currentMindMap?.nodes.find(n => n.id === id);
          return node?.parentId === null;
        });
        
        // 如果包含主节点，直接返回，不允许删除
        if (hasRootNode) {
          return;
        }
        
        // 删除所有选中的非主节点
        if (selectedNodeIds.length > 0) {
          selectedNodeIds.forEach(id => deleteNode(id));
        } else {
          deleteNode(selectedNodeId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedNodeIds, currentMindMap, deleteNode]);

  // 处理画布鼠标事件
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node')) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    if (e.ctrlKey || e.metaKey) {
      // 开始框选
      const { worldX, worldY } = screenToWorld(clientX, clientY);
      setIsSelecting(true);
      setSelectionBox({
        startX: worldX,
        startY: worldY,
        endX: worldX,
        endY: worldY
      });
    } else if (!isDraggingNodes && selectedNodeIds.length === 0) {
      // 画布平移
      setIsPanning(true);
      setPanStart({ x: clientX - pan.x, y: clientY - pan.y });
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (isDraggingNodes && selectedNodeIds.length > 0) {
      const { worldX, worldY } = screenToWorld(e.clientX, e.clientY);
      
      const updates: Record<string, Partial<NodeType>> = {};
      selectedNodeIds.forEach(id => {
        const node = currentMindMap?.nodes.find(n => n.id === id);
        if (node) {
          updates[id] = {
            positionX: worldX - dragOffset.x,
            positionY: worldY - dragOffset.y
          };
        }
      });
      
      updateMultipleNodes(updates);
    } else if (isSelecting && selectionBox) {
      const { worldX, worldY } = screenToWorld(e.clientX, e.clientY);
      setSelectionBox({
        ...selectionBox,
        endX: worldX,
        endY: worldY
      });
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (isSelecting && selectionBox) {
      // 结束框选，检查哪些节点在框内
      const nodesInSelection = currentMindMap?.nodes.filter(node => {
        const minX = Math.min(selectionBox.startX, selectionBox.endX);
        const maxX = Math.max(selectionBox.startX, selectionBox.endX);
        const minY = Math.min(selectionBox.startY, selectionBox.endY);
        const maxY = Math.max(selectionBox.startY, selectionBox.endY);
        
        const nodeWidth = 180;
        const nodeHeight = 72;
        
        return (
          node.positionX < maxX &&
          node.positionX + nodeWidth > minX &&
          node.positionY < maxY &&
          node.positionY + nodeHeight > minY
        );
      }) || [];
      
      if (nodesInSelection.length > 0) {
        setSelectedNodeIds(nodesInSelection.map(n => n.id));
      }
      
      setIsSelecting(false);
      setSelectionBox(null);
    }
    
    setIsPanning(false);
    setIsDraggingNodes(false);
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node')) return;
    
    const { worldX, worldY } = screenToWorld(e.clientX, e.clientY);
    addFreeNode(worldX, worldY);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(2, zoom * delta));
    setZoom(newZoom);
  };

  // 屏幕坐标转世界坐标
  const screenToWorld = (screenX: number, screenY: number) => {
    const worldX = (screenX - pan.x) / zoom;
    const worldY = (screenY - pan.y) / zoom;
    return { worldX, worldY };
  };

  // 处理节点选择
  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleNodeToggleSelect = (nodeId: string) => {
    toggleNodeSelection(nodeId);
  };

  // 开始拖动节点
  const handleNodeDragStart = (nodeId: string, e: React.MouseEvent) => {
    const node = currentMindMap?.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // 如果不是按着 Ctrl/Cmd 键，并且节点没有被选中，则只选中这个节点
    if (!e.ctrlKey && !e.metaKey && !selectedNodeIds.includes(nodeId)) {
      setSelectedNodeId(nodeId);
    }

    const { worldX, worldY } = screenToWorld(e.clientX, e.clientY);
    
    setIsDraggingNodes(true);
    setDragOffset({
      x: worldX - node.positionX,
      y: worldY - node.positionY
    });
  };

  const drawConnections = (nodes: NodeType[]) => {
    const connections: JSX.Element[] = [];

    nodes.forEach(node => {
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent) {
          const startX = parent.positionX + 180;
          const startY = parent.positionY + 36;
          const endX = node.positionX;
          const endY = node.positionY + 36;
          const controlX = (startX + endX) / 2;

          const path = `M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`;

          connections.push(
            <g key={`${parent.id}-${node.id}`}>
              <path
                d={path}
                fill="none"
                stroke="#ffffff"
                strokeWidth="6"
                strokeOpacity="0.2"
                strokeLinecap="round"
                className="transition-all duration-300"
              />
              <path
                d={path}
                fill="none"
                stroke={parent.color}
                strokeWidth="4"
                strokeOpacity="0.9"
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </g>
          );
        }
      }
    });

    return connections;
  };

  // 渲染框选矩形
  const renderSelectionBox = () => {
    if (!selectionBox) return null;

    const minX = Math.min(selectionBox.startX, selectionBox.endX);
    const maxX = Math.max(selectionBox.startX, selectionBox.endX);
    const minY = Math.min(selectionBox.startY, selectionBox.endY);
    const maxY = Math.max(selectionBox.startY, selectionBox.endY);

    return (
      <rect
        x={minX}
        y={minY}
        width={maxX - minX}
        height={maxY - minY}
        fill="rgba(99, 102, 241, 0.1)"
        stroke="rgba(99, 102, 241, 0.5)"
        strokeWidth="2"
        strokeDasharray="5,5"
      />
    );
  };

  if (!currentMindMap) return null;

  return (
    <div
      ref={canvasRef}
      className="fixed inset-0 pt-16 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onDoubleClick={handleCanvasDoubleClick}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? 'grabbing' : isSelecting ? 'crosshair' : 'default' }}
    >
      {/* 网格背景 */}
      <svg className="absolute inset-0 pointer-events-none opacity-10" width="100%" height="100%">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* 画布内容 */}
      <div
        className="absolute origin-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isPanning ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        {/* 连接线和框选 */}
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          style={{ width: '8000px', height: '8000px', overflow: 'visible' }}
        >
          {drawConnections(currentMindMap.nodes)}
          {renderSelectionBox()}
        </svg>

        {/* 节点 */}
        {currentMindMap.nodes.map(node => (
          <Node
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            isMultiSelected={selectedNodeIds.includes(node.id)}
            onSelect={() => handleNodeSelect(node.id)}
            onToggleSelect={() => handleNodeToggleSelect(node.id)}
            onUpdate={(updates) => updateNode(node.id, updates)}
            onDragStart={(e) => handleNodeDragStart(node.id, e)}
          />
        ))}
      </div>

      {/* 底部提示 */}
      <div className="fixed bottom-6 left-6 bg-gray-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg text-sm flex flex-wrap items-center gap-3">
        <span className="text-gray-400">缩放: {Math.round(zoom * 100)}%</span>
        <div className="w-px h-5 bg-gray-600" />
        <span className="text-gray-400">节点: {currentMindMap.nodes.length}</span>
        <div className="w-px h-5 bg-gray-600" />
        <span className="text-gray-500 text-xs">
          <span className="inline-flex items-center gap-1 mr-2">
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Tab</kbd> 子节点
          </span>
          <span className="inline-flex items-center gap-1 mr-2">
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Enter</kbd> 同级
          </span>
          <span className="inline-flex items-center gap-1 mr-2">
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Del</kbd> 删除
          </span>
          <span className="inline-flex items-center gap-1 mr-2">
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Ctrl</kbd> 多选
          </span>
          <span className="inline-flex items-center gap-1">
            拖拽节点 · 双击画布 · 滚轮缩放
          </span>
        </span>
      </div>

      {/* 缩放控制 */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2">
        <button
          onClick={() => setZoom(z => Math.min(2, z * 1.2))}
          className="w-10 h-10 bg-gray-800/90 backdrop-blur-sm text-white rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
        >
          +
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.3, z * 0.8))}
          className="w-10 h-10 bg-gray-800/90 backdrop-blur-sm text-white rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
        >
          -
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 400, y: 300 });
          }}
          className="w-10 h-10 bg-gray-800/90 backdrop-blur-sm text-white rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-xs"
        >
          ⟲
        </button>
      </div>
    </div>
  );
};

export default MindMapCanvas;
