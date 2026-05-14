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

  const adjustColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
  };

  const getNodeStyle = () => {
    const lighterColor = adjustColor(node.color, 20);
    return {
      background: `linear-gradient(135deg, ${node.color}, ${lighterColor})`,
      boxShadow: isSelected || isMultiSelected
        ? `0 0 0 4px rgba(255,255,255,0.3), 0 10px 40px rgba(0,0,0,0.3)`
        : `0 4px 20px rgba(0,0,0,0.2)`,
    };
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
          relative min-w-[180px] max-w-[280px] rounded-2xl p-4 
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
              className="w-full bg-white/20 text-white placeholder-white/50 border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="输入内容..."
            />
          ) : (
            <div className="text-white font-medium leading-relaxed break-words">
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
