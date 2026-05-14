
import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Edit3 } from 'lucide-react';
import { Node as NodeType } from '../hooks/useMindMapStore';

interface NodeProps {
  node: NodeType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<NodeType>) => void;
}

const Node: React.FC<NodeProps> = ({ node, isSelected, onSelect, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(node.content);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
    onSelect();
  };

  const handleGripMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - node.positionX,
      y: e.clientY - node.positionY
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onUpdate({
          positionX: e.clientX - dragOffset.x,
          positionY: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onUpdate]);

  const nodeStyle = {
    left: `${node.positionX}px`,
    top: `${node.positionY}px`,
  };

  const getColorStyle = (color: string) => {
    const lighterColor = adjustColor(color, 20);
    return {
      background: `linear-gradient(135deg, ${color}, ${lighterColor})`,
      boxShadow: isSelected 
        ? `0 0 0 4px rgba(255,255,255,0.3), 0 10px 40px rgba(0,0,0,0.3)` 
        : `0 4px 20px rgba(0,0,0,0.2)`
    };
  };

  const adjustColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
  };

  return (
    <div
      ref={nodeRef}
      className="absolute cursor-default select-none"
      style={nodeStyle}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className={`
          relative min-w-[180px] max-w-[280px] rounded-2xl p-4 
          transition-all duration-200 ease-out
          ${isSelected ? 'scale-105 z-50' : 'hover:scale-102 z-10'}
          ${isDragging ? 'cursor-grabbing opacity-90' : 'cursor-pointer'}
        `}
        style={getColorStyle(node.color)}
      >
        <div className="flex items-start gap-2">
          <div 
            className="mt-1 cursor-grab active:cursor-grabbing text-white/70 hover:text-white transition-colors"
            onMouseDown={handleGripMouseDown}
          >
            <GripVertical className="w-4 h-4" />
          </div>
          
          <div className="flex-1">
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

          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="mt-1 text-white/50 hover:text-white transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Node;

