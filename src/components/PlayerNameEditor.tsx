import { useState, useEffect, useRef } from 'react';

interface PlayerNameEditorProps {
  playerId: 1 | 2;
  initialName: string;
  onSave: (playerId: 1 | 2, newName: string) => void;
  className?: string;
}

export const PlayerNameEditor = ({ playerId, initialName, onSave, className }: PlayerNameEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(playerId, name.trim());
      // Persistence is handled by the onSave callback (via Zustand store)
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setName(initialName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="w-full">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSubmit}
          className={`w-full px-3 py-2 text-lg font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 ${
            playerId === 1 
              ? 'border-blue-500 focus:ring-blue-500 text-blue-600' 
              : 'border-green-500 focus:ring-green-500 text-green-600'
          } bg-white`}
          maxLength={20}
          placeholder="Enter name"
        />
      </form>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={`w-full text-lg font-semibold text-left hover:opacity-80 transition-opacity ${
        playerId === 1 ? 'text-blue-600' : 'text-green-600'
      } ${className}`}
    >
      {name}
    </button>
  );
};
