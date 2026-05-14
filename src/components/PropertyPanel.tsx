import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Palette, 
  Layout, 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Square,
  Circle
} from 'lucide-react';
import { 
  useMindMapStore, 
  NodeStyle, 
  FontSize, 
  TextAlign, 
  BorderWidth,
  BackgroundPattern,
  LayoutDirection,
  MindMapStyle
} from '../hooks/useMindMapStore';

const PropertyPanel: React.FC = () => {
  const {
    currentMindMap,
    selectedNodeIds,
    selectedNodeId,
    isPanelCollapsed,
    togglePanelCollapse,
    updateNode,
    updateSameLevelNodes,
    resetNodeStyle,
    resetAllSameLevelStyles,
    updateMindMapStyle
  } = useMindMapStore();

  const getSelectionInfo = () => {
    if (selectedNodeIds.length === 0) {
      return { type: 'none' as const };
    }

    const selectedNodes = currentMindMap?.nodes.filter(n => selectedNodeIds.includes(n.id)) || [];
    if (selectedNodes.length === 0) {
      return { type: 'none' as const };
    }

    const levels = selectedNodes.map(n => n.level);
    const uniqueLevels = new Set(levels);
    
    if (uniqueLevels.size === 1) {
      return { type: 'same-level' as const, level: levels[0], nodes: selectedNodes };
    } else {
      const highestLevel = Math.min(...levels);
      const highestNode = selectedNodes.find(n => n.level === highestLevel);
      return { 
        type: 'multi-level' as const, 
        highestLevel, 
        highestNode,
        nodes: selectedNodes 
      };
    }
  };

  const selectionInfo = getSelectionInfo();

  const handleStyleChange = (styleUpdates: Partial<NodeStyle>) => {
    if (selectionInfo.type === 'none') return;

    if (selectionInfo.type === 'same-level') {
      updateSameLevelNodes(selectionInfo.level, styleUpdates);
    } else if (selectionInfo.type === 'multi-level' && selectionInfo.highestNode) {
      selectedNodeIds.forEach(nodeId => {
        updateNode(nodeId, { style: { ...selectionInfo.highestNode!.style, ...styleUpdates } });
      });
    }
  };

  const handleReset = () => {
    if (selectionInfo.type === 'same-level' && selectionInfo.nodes.length > 0) {
      selectionInfo.nodes.forEach(node => {
        resetNodeStyle(node.id);
      });
    }
  };

  const handleUpdateSameLevel = () => {
    if (selectionInfo.type === 'same-level' && selectionInfo.highestNode) {
      const style = selectionInfo.highestNode.style;
      updateSameLevelNodes(selectionInfo.level, style);
    }
  };

  const handleBackgroundChange = (updates: Partial<MindMapStyle>) => {
    if (currentMindMap) {
      updateMindMapStyle(updates);
    }
  };

  const renderCanvasSettings = () => {
    if (!currentMindMap) return null;
    const style = currentMindMap.style;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            背景颜色
          </label>
          <input
            type="color"
            value={style.backgroundColor}
            onChange={(e) => handleBackgroundChange({ backgroundColor: e.target.value })}
            className="w-full h-10 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            背景图案
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['none', 'grid', 'dots', 'lines'] as BackgroundPattern[]).map((pattern) => (
              <button
                key={pattern}
                onClick={() => handleBackgroundChange({ backgroundPattern: pattern })}
                className={`p-2 rounded-lg text-xs transition-all ${
                  style.backgroundPattern === pattern
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {pattern === 'none' && '无'}
                {pattern === 'grid' && '网格'}
                {pattern === 'dots' && '点阵'}
                {pattern === 'lines' && '线条'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            结构方向
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['radial', 'horizontal', 'vertical'] as LayoutDirection[]).map((direction) => (
              <button
                key={direction}
                onClick={() => handleBackgroundChange({ layoutDirection: direction })}
                className={`p-3 rounded-lg transition-all flex flex-col items-center gap-1 ${
                  style.layoutDirection === direction
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {direction === 'radial' && <Layout className="w-5 h-5" />}
                {direction === 'horizontal' && <AlignRight className="w-5 h-5" />}
                {direction === 'vertical' && <AlignCenter className="w-5 h-5" />}
                <span className="text-xs">
                  {direction === 'radial' && '放射'}
                  {direction === 'horizontal' && '水平'}
                  {direction === 'vertical' && '垂直'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderNodeSettings = () => {
    if (selectionInfo.type === 'none') return null;

    const currentStyle = selectionInfo.type === 'same-level' || selectionInfo.type === 'multi-level'
      ? selectionInfo.highestNode?.style
      : null;

    if (!currentStyle) return null;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            文字大小
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => handleStyleChange({ fontSize: size })}
                className={`p-2 rounded-lg text-sm transition-all ${
                  currentStyle.fontSize === size
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {size === 'small' && '小'}
                {size === 'medium' && '中'}
                {size === 'large' && '大'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            文字颜色
          </label>
          <input
            type="color"
            value={currentStyle.fontColor}
            onChange={(e) => handleStyleChange({ fontColor: e.target.value })}
            className="w-full h-10 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            文字对齐
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['left', 'center', 'right'] as TextAlign[]).map((align) => (
              <button
                key={align}
                onClick={() => handleStyleChange({ textAlign: align })}
                className={`p-2 rounded-lg transition-all ${
                  currentStyle.textAlign === align
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {align === 'left' && <AlignLeft className="w-5 h-5 mx-auto" />}
                {align === 'center' && <AlignCenter className="w-5 h-5 mx-auto" />}
                {align === 'right' && <AlignRight className="w-5 h-5 mx-auto" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            填充颜色
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={currentStyle.fillColor === 'transparent' ? '#000000' : currentStyle.fillColor}
              onChange={(e) => handleStyleChange({ fillColor: e.target.value })}
              className="flex-1 h-10 rounded-lg cursor-pointer"
            />
            <button
              onClick={() => handleStyleChange({ fillColor: 'transparent' })}
              className={`px-4 rounded-lg transition-all ${
                currentStyle.fillColor === 'transparent'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              透明
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            边框颜色
          </label>
          <input
            type="color"
            value={currentStyle.borderColor}
            onChange={(e) => handleStyleChange({ borderColor: e.target.value })}
            className="w-full h-10 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            边框粗细
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['thin', 'medium', 'thick'] as BorderWidth[]).map((width) => (
              <button
                key={width}
                onClick={() => handleStyleChange({ borderWidth: width })}
                className={`p-2 rounded-lg text-sm transition-all ${
                  currentStyle.borderWidth === width
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {width === 'thin' && '细'}
                {width === 'medium' && '中'}
                {width === 'thick' && '粗'}
              </button>
            ))}
          </div>
        </div>

        {selectionInfo.type === 'same-level' && (
          <div className="pt-4 border-t border-gray-700 flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
            >
              重置
            </button>
            <button
              onClick={handleUpdateSameLevel}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all"
            >
              更新同级
            </button>
          </div>
        )}
      </div>
    );
  };

  if (isPanelCollapsed) {
    return (
      <div 
        className="fixed right-0 top-16 bottom-0 w-12 bg-gray-900 border-l border-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors z-40"
        onClick={togglePanelCollapse}
      >
        <ChevronLeft className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-16 bottom-0 w-80 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 overflow-y-auto z-40">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Palette className="w-5 h-5" />
            属性面板
          </h2>
          <button
            onClick={togglePanelCollapse}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {selectionInfo.type === 'none' ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-400 mb-4">
              未选中节点，显示画布设置
            </div>
            {renderCanvasSettings()}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-400 mb-4">
              {selectionInfo.type === 'same-level' && (
                <>已选中 {selectionInfo.nodes.length} 个同级节点（级别 {selectionInfo.level}）</>
              )}
              {selectionInfo.type === 'multi-level' && (
                <>已选中 {selectionInfo.nodes.length} 个不同级节点</>
              )}
            </div>
            {renderNodeSettings()}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyPanel;
