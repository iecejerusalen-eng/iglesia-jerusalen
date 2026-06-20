import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';

export const ChordNodeView = (props: NodeViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [chordValue, setChordValue] = useState(props.node.attrs.chord);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (!props.editor.isEditable) return;
    setIsEditing(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChordValue(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    saveChord();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(false);
      saveChord();
      // Devuelve el foco al editor principal de tiptap
      props.editor.commands.focus();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setChordValue(props.node.attrs.chord); // Revert
      props.editor.commands.focus();
    }
  };

  const saveChord = () => {
    if (chordValue !== props.node.attrs.chord) {
      props.updateAttributes({ chord: chordValue });
    }
  };

  return (
    <NodeViewWrapper 
      as="span" 
      className="chord-node-wrapper relative inline-block w-0 h-0 overflow-visible select-none"
      data-chord-node="true"
      data-chord={props.node.attrs.chord}
    >
      <span 
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-[2px] transition-all
          ${props.selected ? 'ring-2 ring-red-400 bg-red-100 dark:bg-red-900/50' : 'bg-transparent'}
          ${props.editor.isEditable ? 'cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/30 rounded px-0.5' : ''}
        `}
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={chordValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="text-[0.75rem] font-bold text-red-600 dark:text-red-400 font-sans leading-none p-0 m-0 border-b border-red-400 bg-transparent outline-none text-center min-w-[20px]"
            style={{ width: `${Math.max(2, chordValue.length)}ch` }}
          />
        ) : (
          <span className="text-[0.75rem] font-bold text-red-600 dark:text-red-400 font-sans leading-none whitespace-nowrap">
            {props.node.attrs.chord}
          </span>
        )}
      </span>
    </NodeViewWrapper>
  );
};
