import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Command {
  id: string;
  name: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteContextType {
  isOpen: boolean;
  toggleCommandPalette: () => void;
  closeCommandPalette: () => void;
  commands: Command[];
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

export const CommandPaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleCommandPalette = () => {
    setIsOpen(prev => !prev);
  };

  const closeCommandPalette = () => {
    setIsOpen(false);
  };

  // Define navigation and action commands
  const commands: Command[] = [
    {
      id: 'home',
      name: 'Go to Home',
      shortcut: 'g h',
      action: () => {
        navigate('/');
        closeCommandPalette();
      }
    },
    {
      id: 'skills',
      name: 'Go to Skills',
      shortcut: 'g s',
      action: () => {
        navigate('/skills');
        closeCommandPalette();
      }
    },
    {
      id: 'projects',
      name: 'Go to Projects',
      shortcut: 'g p',
      action: () => {
        navigate('/projects');
        closeCommandPalette();
      }
    },
    {
      id: 'contact',
      name: 'Go to Contact',
      shortcut: 'g c',
      action: () => {
        navigate('/contact');
        closeCommandPalette();
      }
    },
    {
      id: 'theme',
      name: 'Toggle Theme',
      shortcut: 't t',
      action: () => {
        document.dispatchEvent(new CustomEvent('toggle-theme'));
        closeCommandPalette();
      }
    }
  ];

  // Setup keyboard shortcut to open command palette (Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
      
      if (isOpen && e.key === 'Escape') {
        closeCommandPalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <CommandPaletteContext.Provider value={{ isOpen, toggleCommandPalette, closeCommandPalette, commands }}>
      {children}
    </CommandPaletteContext.Provider>
  );
};

export const useCommandPalette = (): CommandPaletteContextType => {
  const context = useContext(CommandPaletteContext);
  if (context === undefined) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
};