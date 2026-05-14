import React, { useState, useRef, useEffect } from 'react';
import { Node as NodeType } from '../hooks/useMindMapStore';

interface NodeProps {
  node: NodeType;
  isSelected: boolean;
  isMultiSelected: boolean;
  onSelect: () => void;
  onToggleSelect: () => void;
  onUpdate: (updates: Partial<NodeType>) => void;
  onDragStart: (e: React.MouseEvent) => void;
}

const Node: React.FC<NodeProps> = ({ 
  node, 
  isSelected, 
  isMultiSelected, 
  onSelect, 
  onToggleSelect, 
  onUpdate,
  onDragStart 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(node.content);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleEditComplete = () => {
    if (editContent.trim() !== node.content) {
      onUpdate({ content: editContent.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditComplete();
    } else if (e.key === 'Escape') {
      setEditContent(node.content);
      setIsEditing(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    
    if (e.ctrlKey || e.metaKey) {
      onToggleSelect();
    } else {
      onSelect();
    }
    
    onDragStart(e);
  };

  const getNodeStyle = () => {
    const { style } = node;
    
    const borderWidthMap = {
      thin: '1px',
      medium: '2px',
      thick: '4px'
    };
    
    const fontSizeMap = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg'
    };
    
    const backgroundColor = style.fillColor === 'transparent' 
      ? 'rgba(0,0,0,0.5)' 
      : style.fillColor;
    
    return {
      backgroundColor,
      borderColor: style.borderColor,
      borderWidth: borderWidthMap[style.borderWidth],
      borderRadius: `${style.borderRadius}px`,
      boxShadow: isSelected || isMultiSelected
        ? `0 0 0 4px rgba(255,255,255,0.3), 0 10px 40px rgba(0,0,0,0.3)`
        : `0 4px 20px rgba(0,0,0,0.2)`,
    };
  };

  const getFontSizeClass = () => {
    const { style } = node;
    const fontSizeMap = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg'
    };
    return fontSizeMap[style.fontSize];
  };

  const getTextAlignClass = () => {
    const { style } = node;
    const alignMap = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    };
    return alignMap[style.textAlign];
  };

  return (
    <div
      className="absolute cursor-grab select-none"
      style={{
        left: `${node.positionX}px`,
        top: `${node.positionY}px`,
        zIndex: isSelected || isMultiSelected ? 50 : 10
      }}
    >
      <div
        className={`
          relative min-w-[180px] max-w-[280px] p-4 
          transition-all duration-200 ease-out
          ${isSelected || isMultiSelected ? 'scale-105' : 'hover:scale-102'}
        `}
        style={getNodeStyle()}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleEditComplete}
              onKeyDown={handleKeyDown}
              className={`w-full bg-white/20 placeholder-white/50 border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50 ${getTextAlignClass()}`}
              style={{ color: node.style.fontColor }}
              placeholder="输入内容..."
            />
          ) : (
            <div 
              className={`font-medium leading-relaxed break-words ${getFontSizeClass()} ${getTextAlignClass()}`}
              style={{ color: node.style.fontColor }}
            >
              {node.content}
            </div>
          )}
        </div>
        {isMultiSelected && (
          <div className="absolute -top-2 -left-2 w-5 h-5 bg-white rounded-full border-2 border-indigo-500 flex items-center justify-center">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Node;
