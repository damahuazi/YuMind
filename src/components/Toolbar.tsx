
import React from 'react';
import { 
  Plus, 
  Trash2, 
  Undo2, 
  Redo2, 
  Download, 
  FilePlus, 
  Save,
  FolderOpen,
  Share2
} from 'lucide-react';
import { useMindMapStore } from '../hooks/useMindMapStore';

const Toolbar: React.FC = () => {
  const { 
    currentMindMap, 
    selectedNodeId, 
    selectedNodeIds,
    addNode, 
    deleteNode, 
    undo, 
    redo,
    createNewMindMap,
    saveMindMap,
    exportMindMap,
    getMindMaps,
    loadMindMap
  } = useMindMapStore();

  // 判断是否可以删除 - 主节点完全禁止删除
  const canDelete = () => {
    if (selectedNodeIds.length === 0 && !selectedNodeId) return false;
    
    const targetIds = selectedNodeIds.length > 0 ? selectedNodeIds : [selectedNodeId];
    
    // 检查是否包含任何主节点（isRootNode === true）
    const hasRootNode = targetIds.some(id => {
      const node = currentMindMap?.nodes.find(n => n.id === id);
      return node?.isRootNode === true;
    });
    
    // 如果包含主节点，完全禁止删除
    return !hasRootNode;
  };

  const handleAddChild = () => {
    // 使用最后一个选中的节点作为父节点
    const targetId = selectedNodeIds.length > 0 
      ? selectedNodeIds[selectedNodeIds.length - 1] 
      : selectedNodeId;
      
    if (targetId) {
      addNode(targetId);
    }
  };

  const handleAddSibling = () => {
    const targetId = selectedNodeIds.length > 0 
      ? selectedNodeIds[selectedNodeIds.length - 1] 
      : selectedNodeId;
      
    if (targetId && currentMindMap) {
      const selectedNode = currentMindMap.nodes.find(n => n.id === targetId);
      if (selectedNode?.parentId) {
        addNode(selectedNode.parentId);
      }
    }
  };

  const handleDelete = () => {
    if (!canDelete()) return;
    
    if (selectedNodeIds.length > 0) {
      selectedNodeIds.forEach(id => deleteNode(id));
    } else if (selectedNodeId) {
      deleteNode(selectedNodeId);
    }
  };

  const handleExport = () => {
    const data = exportMindMap();
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentMindMap?.title || 'mindmap'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleSave = () => {
    saveMindMap();
    alert('思维导图已保存！');
  };

  const handleOpenExisting = () => {
    const maps = getMindMaps();
    if (maps.length === 0) {
      alert('没有保存的思维导图');
      return;
    }
    
    const mapList = maps.map((m, i) => `${i + 1}. ${m.title}`).join('\n');
    const choice = prompt(`选择要打开的思维导图（输入编号）：\n${mapList}`);
    
    if (choice) {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < maps.length) {
        loadMindMap(maps[index].id);
      }
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-3 shadow-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            思维导图
          </h1>
          {selectedNodeIds.length > 1 && (
            <span className="text-xs bg-indigo-600 px-2 py-1 rounded-full">
              已选择 {selectedNodeIds.length} 个节点
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={createNewMindMap}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200 hover:scale-105"
            title="新建"
          >
            <FilePlus className="w-4 h-4" />
            <span className="text-sm">新建</span>
          </button>

          <button
            onClick={handleOpenExisting}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200 hover:scale-105"
            title="打开"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="text-sm">打开</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200 hover:scale-105"
            title="保存"
          >
            <Save className="w-4 h-4" />
            <span className="text-sm">保存</span>
          </button>

          <div className="w-px h-8 bg-gray-600 mx-2" />

          <button
            onClick={handleAddChild}
            disabled={!selectedNodeId && selectedNodeIds.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="添加子节点"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">子节点</span>
          </button>

          <button
            onClick={handleAddSibling}
            disabled={!selectedNodeId && selectedNodeIds.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="添加同级节点"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">同级</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={!canDelete()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="删除节点"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">删除</span>
          </button>

          <div className="w-px h-8 bg-gray-600 mx-2" />

          <button
            onClick={undo}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200 hover:scale-105"
            title="撤销"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={redo}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200 hover:scale-105"
            title="重做"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-8 bg-gray-600 mx-2" />

          <button
            onClick={handleExport}
            disabled={!currentMindMap}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="导出"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">导出</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
