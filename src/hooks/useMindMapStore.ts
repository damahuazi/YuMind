import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FontSize = 'small' | 'medium' | 'large';
export type TextAlign = 'left' | 'center' | 'right';
export type BorderWidth = 'thin' | 'medium' | 'thick';
export type BackgroundPattern = 'none' | 'grid' | 'dots' | 'lines';
export type LayoutDirection = 'radial' | 'horizontal' | 'vertical';

export interface NodeStyle {
  fontSize: FontSize;
  fontColor: string;
  textAlign: TextAlign;
  fillColor: string;
  borderColor: string;
  borderWidth: BorderWidth;
  borderRadius: number;
}

export interface MindMapStyle {
  backgroundColor: string;
  backgroundPattern: BackgroundPattern;
  layoutDirection: LayoutDirection;
}

export interface Node {
  id: string;
  parentId: string | null;
  content: string;
  level: number;
  positionX: number;
  positionY: number;
  color: string;
  isRootNode: boolean;
  style: NodeStyle;
  originalStyle?: NodeStyle;
}

export interface MindMap {
  id: string;
  title: string;
  nodes: Node[];
  createdAt: string;
  updatedAt: string;
  style: MindMapStyle;
}

interface MindMapState {
  currentMindMap: MindMap | null;
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  history: MindMap[];
  historyIndex: number;
  isPanelCollapsed: boolean;
  setCurrentMindMap: (mindMap: MindMap | null) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setSelectedNodeIds: (nodeIds: string[]) => void;
  toggleNodeSelection: (nodeId: string) => void;
  addNode: (parentId: string | null, content?: string) => void;
  addFreeNode: (x: number, y: number, content?: string) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  updateMultipleNodes: (updates: Record<string, Partial<Node>>) => void;
  updateSameLevelNodes: (level: number, style: Partial<NodeStyle>) => void;
  resetNodeStyle: (nodeId: string) => void;
  resetAllSameLevelStyles: (level: number) => void;
  deleteNode: (nodeId: string) => void;
  deleteMultipleNodes: (nodeIds: string[]) => void;
  saveMindMap: () => void;
  loadMindMap: (id: string) => void;
  createNewMindMap: () => void;
  undo: () => void;
  redo: () => void;
  getMindMaps: () => MindMap[];
  exportMindMap: () => string;
  updateMindMapStyle: (style: Partial<MindMapStyle>) => void;
  togglePanelCollapse: () => void;
}

const NODE_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#F59E0B', '#84CC16', '#10B981', '#14B8A6', '#06B6D4',
  '#3B82F6', '#6366F1'
];

const DEFAULT_NODE_STYLES: Record<number, NodeStyle> = {
  0: {
    fontSize: 'large',
    fontColor: '#FFFFFF',
    textAlign: 'center',
    fillColor: NODE_COLORS[0],
    borderColor: NODE_COLORS[0],
    borderWidth: 'medium',
    borderRadius: 16
  },
  1: {
    fontSize: 'medium',
    fontColor: '#FFFFFF',
    textAlign: 'center',
    fillColor: NODE_COLORS[1],
    borderColor: NODE_COLORS[1],
    borderWidth: 'medium',
    borderRadius: 12
  }
};

const DEFAULT_MINDMAP_STYLE: MindMapStyle = {
  backgroundColor: '#1e293b',
  backgroundPattern: 'grid',
  layoutDirection: 'radial'
};

const getDefaultStyleForLevel = (level: number): NodeStyle => {
  return DEFAULT_NODE_STYLES[level] || {
    fontSize: 'small',
    fontColor: '#FFFFFF',
    textAlign: 'center',
    fillColor: NODE_COLORS[level % NODE_COLORS.length],
    borderColor: NODE_COLORS[level % NODE_COLORS.length],
    borderWidth: 'medium',
    borderRadius: 8
  };
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useMindMapStore = create<MindMapState>()(
  persist(
    (set, get) => ({
      currentMindMap: null,
      selectedNodeId: null,
      selectedNodeIds: [],
      history: [],
      historyIndex: -1,
      isPanelCollapsed: false,
      
      setCurrentMindMap: (mindMap) => {
        set({ 
          currentMindMap: mindMap,
          selectedNodeId: null,
          selectedNodeIds: [],
          history: mindMap ? [JSON.parse(JSON.stringify(mindMap))] : [],
          historyIndex: mindMap ? 0 : -1
        });
      },
      
      setSelectedNodeId: (nodeId) => set({ 
        selectedNodeId: nodeId,
        selectedNodeIds: nodeId ? [nodeId] : []
      }),
      
      setSelectedNodeIds: (nodeIds) => set({ 
        selectedNodeIds: nodeIds,
        selectedNodeId: nodeIds.length > 0 ? nodeIds[nodeIds.length - 1] : null
      }),
      
      toggleNodeSelection: (nodeId) => {
        set((state) => {
          const isSelected = state.selectedNodeIds.includes(nodeId);
          let newSelectedIds: string[];
          
          if (isSelected) {
            newSelectedIds = state.selectedNodeIds.filter(id => id !== nodeId);
          } else {
            newSelectedIds = [...state.selectedNodeIds, nodeId];
          }
          
          return {
            selectedNodeIds: newSelectedIds,
            selectedNodeId: newSelectedIds.length > 0 ? newSelectedIds[newSelectedIds.length - 1] : null
          };
        });
      },
      
      addNode: (parentId, content = '新节点') => {
        set((state) => {
          if (!state.currentMindMap) return state;
          
          const parentNode = parentId ? 
            state.currentMindMap.nodes.find(n => n.id === parentId) : null;
          
          const level = parentNode ? parentNode.level + 1 : 0;
          const defaultStyle = getDefaultStyleForLevel(level);
          
          const newNode: Node = {
            id: generateId(),
            parentId: parentId,
            content,
            level,
            positionX: parentNode ? parentNode.positionX + 250 : 0,
            positionY: parentNode ? 
              parentNode.positionY + (state.currentMindMap.nodes.filter(n => n.parentId === parentId).length * 80) : 0,
            color: NODE_COLORS[(parentNode ? parentNode.level + 1 : 0) % NODE_COLORS.length],
            isRootNode: false,
            style: { ...defaultStyle },
            originalStyle: { ...defaultStyle }
          };
          
          const newMindMap = {
            ...state.currentMindMap,
            nodes: [...state.currentMindMap.nodes, newNode],
            updatedAt: new Date().toISOString()
          };
          
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newMindMap)));
          
          return {
            currentMindMap: newMindMap,
            selectedNodeId: newNode.id,
            selectedNodeIds: [newNode.id],
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        });
      },
      
      addFreeNode: (x, y, content = '自由节点') => {
        set((state) => {
          if (!state.currentMindMap) return state;
          
          const defaultStyle = getDefaultStyleForLevel(0);
          
          const newNode: Node = {
            id: generateId(),
            parentId: null,
            content,
            level: 0,
            positionX: x,
            positionY: y,
            color: NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)],
            isRootNode: false,
            style: { ...defaultStyle },
            originalStyle: { ...defaultStyle }
          };
          
          const newMindMap = {
            ...state.currentMindMap,
            nodes: [...state.currentMindMap.nodes, newNode],
            updatedAt: new Date().toISOString()
          };
          
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newMindMap)));
          
          return {
            currentMindMap: newMindMap,
            selectedNodeId: newNode.id,
            selectedNodeIds: [newNode.id],
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        });
      },
      
      updateNode: (nodeId, updates) => {
        set((state) => {
          if (!state.currentMindMap) return state;
          
          const newNodes = state.currentMindMap.nodes.map(node => 
            node.id === nodeId ? { ...node, ...updates } : node
          );
          
          const newMindMap = {
            ...state.currentMindMap,
            nodes: newNodes,
            updatedAt: new Date().toISOString()
          };
          
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newMindMap)));
          
          return {
            currentMindMap: newMindMap,
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        });
      },
      
      updateMultipleNodes: (updates) => {
        set((state) => {
          if (!state.currentMindMap) return state;
          
          const newNodes = state.currentMindMap.nodes.map(node => {
            const nodeUpdates = updates[node.id];
            return nodeUpdates ? { ...node, ...nodeUpdates } : node;
          });
          
          const newMindMap = {
            ...state.currentMindMap,
            nodes: newNodes,
            updatedAt: new Date().toISOString()
          };
          
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newMindMap)));
          
          return {
            currentMindMap: newMindMap,
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        });
      },
      
      updateSameLevelNodes: (level: number, styleUpdates: Partial<NodeStyle>) => {
        set((state) => {
          if (!state.currentMindMap) return state;
          
          const newNodes = state.currentMindMap.nodes.map(node => {
            if (node.level === level) {
              return {
                ...node,
                style: { ...node.style, ...styleUpdates }
              };
            }
            return node;
          });
          
          const newMindMap = {
            ...state.currentMindMap,
            nodes: newNodes,
            updatedAt: new Date().toISOString()
          };
          
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newMindMap)));
          
          return {
            currentMindMap: newMindMap,
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        });
      },
      
      resetNodeStyle: (nodeId: string) => {
        set((state) => {
          if (!state.currentMindMap) return state;
          
          const node = state.currentMindMap.nodes.find(n => n.id === nodeId);
          if (!node || !node.originalStyle) return state;
          
          const newNodes = state.currentMindMap.nodes.map(n => {
            if (n.id === nodeId) {
              return {
                ...n,
                style: { ...n.originalStyle! }
              };
            }
            return n;
          });
          
          const newMindMap = {
            ...state.currentMindMap,
            nodes: newNodes,
            updatedAt: new Date().toISOString()
          };
          
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newMindMap)));
          
          return {
            currentMindMap: newMindMap,
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        });
      },
      
      resetAllSameLevelStyles: (level: number) => {
        set((state) => {
          if (!state.currentMindMap) return state;
          
          const newNodes = state.currentMindMap.nodes.map(node => {
            if (node.level === level && node.originalStyle) {
              return {
                ...node,
                style: { ...node.originalStyle }
              };
            }
            return node;
          });
          
          const newMindMap = {
            ...state.currentMindMap,
            nodes: newNodes,
            updatedAt: new Date().toISOString()
          };
          
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newMindMap)));
          
          return {
            currentMindMap: newMindMap,
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        });
      },
      
      deleteNode: (nodeId) => {
        set((state) => {
          if (!state.currentMindMap) return state;
          
          // 完全禁止删除主节点（isRootNode === true）
          const nodeToDelete = state.currentMindMap.nodes.find(n => n.id === nodeId);
          if (nodeToDelete && nodeToDelete.isRootNode) {
            return state;
          }
          
          const deleteNodeRecursive = (id: string): string[] => {
            const children = state.currentMindMap!.nodes.filter(n => n.parentId === id);
            return [id, ...children.flatMap(child => deleteNodeRecursive(child.id))];
          };
          
          const nodesToDelete = deleteNodeRecursive(nodeId);
          const newNodes = state.currentMindMap.nodes.filter(n => !nodesToDelete.includes(n.id));
          
          const newMindMap = {
            ...state.currentMindMap,
            nodes: newNodes,
            updatedAt: new Date().toISOString()
          };
          
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newMindMap)));
          
          return {
            currentMindMap: newMindMap,
            selectedNodeId: null,
            selectedNodeIds: [],
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        });
      },
      
      deleteMultipleNodes: (nodeIds) => {
        set((state) => {
          if (!state.currentMindMap || nodeIds.length === 0) return state;
          
          // 过滤掉主节点
          const idsToDelete = nodeIds.filter(id => {
            const node = state.currentMindMap!.nodes.find(n => n.id === id);
            return node && !node.isRootNode;
          });
          
          if (idsToDelete.length === 0) return state;
          
          // 收集所有要删除的节点（包括子节点）
          const nodesToDeleteSet = new Set<string>();
          const deleteNodeRecursive = (id: string) => {
            const children = state.currentMindMap!.nodes.filter(n => n.parentId === id);
            nodesToDeleteSet.add(id);
            children.forEach(child => deleteNodeRecursive(child.id));
          };
          
          idsToDelete.forEach(id => deleteNodeRecursive(id));
          
          const newNodes = state.currentMindMap.nodes.filter(n => !nodesToDeleteSet.has(n.id));
          
          const newMindMap = {
            ...state.currentMindMap,
            nodes: newNodes,
            updatedAt: new Date().toISOString()
          };
          
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newMindMap)));
          
          return {
            currentMindMap: newMindMap,
            selectedNodeId: null,
            selectedNodeIds: [],
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        });
      },
      
      saveMindMap: () => {
        const { currentMindMap } = get();
        if (!currentMindMap) return;
        
        const savedMaps = JSON.parse(localStorage.getItem('mind-maps-storage') || '{}');
        const maps = savedMaps.state?.mindMaps || [];
        
        const existingIndex = maps.findIndex((m: MindMap) => m.id === currentMindMap.id);
        if (existingIndex >= 0) {
          maps[existingIndex] = currentMindMap;
        } else {
          maps.push(currentMindMap);
        }
        
        localStorage.setItem('saved-mind-maps', JSON.stringify(maps));
      },
      
      loadMindMap: (id) => {
        const maps = JSON.parse(localStorage.getItem('saved-mind-maps') || '[]');
        const map = maps.find((m: MindMap) => m.id === id);
        if (map) {
          if (map.nodes && map.nodes.length > 0) {
            let foundRootNode = false;
            map.nodes = map.nodes.map(node => {
              if (node.parentId === null && !foundRootNode) {
                foundRootNode = true;
                return { ...node, isRootNode: true };
              }
              return { ...node, isRootNode: false };
            });
          }
          
          if (map.nodes) {
            map.nodes = map.nodes.map(node => {
              if (!node.style) {
                const defaultStyle = getDefaultStyleForLevel(node.level);
                return {
                  ...node,
                  style: defaultStyle,
                  originalStyle: defaultStyle
                };
              }
              if (!node.originalStyle) {
                return { ...node, originalStyle: { ...node.style } };
              }
              return node;
            });
          }
          
          if (!map.style) {
            map.style = { ...DEFAULT_MINDMAP_STYLE };
          }
          
          get().setCurrentMindMap(map);
        }
      },
      
      createNewMindMap: () => {
        const defaultStyle = getDefaultStyleForLevel(0);
        const newMap: MindMap = {
          id: generateId(),
          title: '新思维导图',
          nodes: [{
            id: generateId(),
            parentId: null,
            content: '中心主题',
            level: 0,
            positionX: 0,
            positionY: 0,
            color: NODE_COLORS[0],
            isRootNode: true,
            style: { ...defaultStyle },
            originalStyle: { ...defaultStyle }
          }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          style: { ...DEFAULT_MINDMAP_STYLE }
        };
        get().setCurrentMindMap(newMap);
      },
      
      undo: () => {
        set((state) => {
          if (state.historyIndex <= 0) return state;
          const newIndex = state.historyIndex - 1;
          return {
            currentMindMap: JSON.parse(JSON.stringify(state.history[newIndex])),
            selectedNodeId: null,
            selectedNodeIds: [],
            historyIndex: newIndex
          };
        });
      },
      
      redo: () => {
        set((state) => {
          if (state.historyIndex >= state.history.length - 1) return state;
          const newIndex = state.historyIndex + 1;
          return {
            currentMindMap: JSON.parse(JSON.stringify(state.history[newIndex])),
            selectedNodeId: null,
            selectedNodeIds: [],
            historyIndex: newIndex
          };
        });
      },
      
      getMindMaps: () => {
        return JSON.parse(localStorage.getItem('saved-mind-maps') || '[]');
      },
      
      exportMindMap: () => {
        const { currentMindMap } = get();
        if (!currentMindMap) return '';
        return JSON.stringify(currentMindMap, null, 2);
      },
      
      updateMindMapStyle: (styleUpdates: Partial<MindMapStyle>) => {
        set((state) => {
          if (!state.currentMindMap) return state;
          
          const newMindMap = {
            ...state.currentMindMap,
            style: { ...state.currentMindMap.style, ...styleUpdates },
            updatedAt: new Date().toISOString()
          };
          
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newMindMap)));
          
          return {
            currentMindMap: newMindMap,
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        });
      },
      
      togglePanelCollapse: () => {
        set((state) => ({ isPanelCollapsed: !state.isPanelCollapsed }));
      }
    }),
    {
      name: 'mind-maps-storage',
      partialize: (state) => ({ mindMaps: state.currentMindMap ? [state.currentMindMap] : [] }),
    }
  )
);
