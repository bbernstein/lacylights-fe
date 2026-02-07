'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGroup } from '@/contexts/GroupContext';

export default function GroupSelector() {
  const { activeGroup, groups, selectGroup } = useGroup();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Only render if user has groups
  if (groups.length === 0 || !activeGroup) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? 'group-selector-dropdown' : undefined}
        aria-label={`Active group: ${activeGroup.name}${activeGroup.isPersonal ? ' (Personal)' : ''}`}
      >
        <span className="hidden md:inline">Group:</span>
        <span className="font-semibold">
          {activeGroup.name}
          {activeGroup.isPersonal && ' (Personal)'}
        </span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div id="group-selector-dropdown" role="listbox" className="absolute right-0 z-10 mt-2 w-56 rounded-md bg-white dark:bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  selectGroup(group);
                  setIsOpen(false);
                }}
                className={`
                  block w-full text-left px-4 py-2 text-sm
                  ${group.id === activeGroup.id
                    ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }
                `}
              >
                {group.name}
                {group.isPersonal && (
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(Personal)</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
