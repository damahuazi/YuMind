
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Node {
  id: string;
  parentId: string | null;
  content: string;
  level: number;
  positionX: number;
  positionY: number;
  color: string;
}

export interface MindMap {
  id: string;
  title: string;
  nodes: Node[];
  createdAt: string;
  updatedAt: string;
}

interface MindMapState {
  currentMindMap: MindMap | null;
  selectedNodeId: string | null;
  history: MindMap[];
  historyIndex: number;
  setCurrentMindMap: (mindMap: MindMap | null) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  addNode: (parentId: string | null, content?: string) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  deleteNode: (nodeId: string) => void;
  saveMindMap: () => void;
  loadMindMap: (id: string) => void;
  createNewMindMap: () => void;
  undo: () => void;
  redo: () => void;
  getMindMaps: () => MindMap[];
  exportMindMap: () => string;
}

const NODE_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#F59E0B', '#84CC16', '#10B981', '#14B8A6', '#06B6D4',
  '#3B82F6', '#6366F1'
];

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useMindMapStore = create<MindMapState>()(
  persist(
    (set, get) => ({
      currentMindMap: null,
      selectedNodeId: null,
      history: [],
      historyIndex: -1,
      
      setCurrentMindMap: (mindMap) => {
        set({ 
          currentMindMap: mindMap,
          history: mindMap ? [JSON.parse(JSON.stringify(mindMap))] : [],
          historyIndex: mindMap ? 0 : -1
        });
      },
      
      setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),
      
      addNode: (parentId, content = '新节点') => {
        set((state) => {
          if (!state.currentMindMap) return state;
          
          const parentNode = parentId ? 
            state.currentMindMap.nodes.find(n => n.id === parentId) : null;
          
          const newNode: Node = {
            id: generateId(),
            parentId: parentId,
            content,
            level: parentNode ? parentNode.level + 1 : 0,
            positionX: parentNode ? parentNode.positionX + 250 : 0,
            positionY: parentNode ? 
              parentNode.positionY + (state.currentMindMap.nodes.filter(n => n.parentId === parentId).length * 80) : 0,
            color: NODE_COLORS[(parentNode ? parentNode.level + 1 : 0) % NODE_COLORS.length],
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
      
      deleteNode: (nodeId) => {
        set((state) => {
          if (!state.currentMindMap) return state;
          
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
          get().setCurrentMindMap(map);
        }
      },
      
      createNewMindMap: () => {
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
            color: NODE_COLORS[0]
          }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        get().setCurrentMindMap(newMap);
      },
      
      undo: () => {
        set((state) => {
          if (state.historyIndex <= 0) return state;
          const newIndex = state.historyIndex - 1;
          return {
            currentMindMap: JSON.parse(JSON.stringify(state.history[newIndex])),
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
      }
    }),
    {
      name: 'mind-maps-storage',
      partialize: (state) => ({ mindMaps: state.currentMindMap ? [state.currentMindMap] : [] }),
    }
  )
);

