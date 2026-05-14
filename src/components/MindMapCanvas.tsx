
import React, { useState, useRef, useEffect } from 'react';
import { useMindMapStore, Node as NodeType } from '../hooks/useMindMapStore';
import Node from './Node';

const MindMapCanvas: React.FC = () => {
  const { 
    currentMindMap, 
    selectedNodeId, 
    setSelectedNodeId, 
    updateNode,
    createNewMindMap,
    addNode,
    deleteNode
  } = useMindMapStore();
  
  const [pan, setPan] = useState({ x: 400, y: 300 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentMindMap) {
      createNewMindMap();
    }
  }, [currentMindMap, createNewMindMap]);

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // 如果正在输入框中，不处理快捷键
      }

      if (selectedNodeId) {
        if (e.key === 'Tab') {
          e.preventDefault();
          addNode(selectedNodeId);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const selectedNode = currentMindMap?.nodes.find(n => n.id === selectedNodeId);
          if (selectedNode?.parentId) {
            addNode(selectedNode.parentId);
          }
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          deleteNode(selectedNodeId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, currentMindMap, addNode, deleteNode]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node')) return;
    setSelectedNodeId(null);
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, panStart]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(2, zoom * delta));
    setZoom(newZoom);
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

  if (!currentMindMap) return null;

  return (
    <div 
      ref={canvasRef}
      className="fixed inset-0 pt-16 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      onMouseDown={handleCanvasMouseDown}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      <svg className="absolute inset-0 pointer-events-none opacity-10" width="100%" height="100%">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div
        className="absolute origin-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isPanning ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        <svg 
          className="absolute top-0 left-0 pointer-events-none"
          style={{ width: '8000px', height: '8000px', overflow: 'visible' }}
        >
          {drawConnections(currentMindMap.nodes)}
        </svg>

        {currentMindMap.nodes.map(node => (
          <Node
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            onSelect={() => setSelectedNodeId(node.id)}
            onUpdate={(updates) => updateNode(node.id, updates)}
          />
        ))}
      </div>

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
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Delete</kbd> 删除
          </span>
          <span className="inline-flex items-center gap-1">
            拖拽节点 · 双击编辑 · 画布平移 · 滚轮缩放
          </span>
        </span>
      </div>

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

