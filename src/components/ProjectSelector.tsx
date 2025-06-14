'use client';

import { useState, useRef, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { CogIcon } from '@heroicons/react/24/outline';
import ProjectManagementModal from './ProjectManagementModal';

export default function ProjectSelector() {
  const { currentProject, projects, loading, selectProject } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Loading projects...
      </div>
    );
  }

  if (!currentProject) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      >
        <span>Project:</span>
        <span className="font-semibold">{currentProject.name}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 rounded-md bg-white dark:bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  selectProject(project);
                  setIsOpen(false);
                }}
                className={`
                  block w-full text-left px-4 py-2 text-sm
                  ${project.id === currentProject.id 
                    ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }
                `}
              >
                {project.name}
              </button>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-600"></div>
            <button
              onClick={() => {
                setShowManagementModal(true);
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
            >
              <CogIcon className="h-4 w-4" />
              Manage Projects
            </button>
          </div>
        </div>
      )}
      
      <ProjectManagementModal 
        isOpen={showManagementModal} 
        onClose={() => setShowManagementModal(false)} 
      />
    </div>
  );
}