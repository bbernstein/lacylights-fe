const fs = require('fs');
const path = require('path');

// Define proper types for common mock function patterns
const mockTypes = {
  autocompleteProps: `{
    value?: string;
    onChange?: (value: string) => void;
    onSelect?: (value: string) => void;
    options?: string[];
    placeholder?: string;
  }`,

  colorPickerProps: `{
    isOpen?: boolean;
    onClose?: () => void;
    onColorSelect?: (color: { r: number; g: number; b: number }) => void;
    initialColor?: { r: number; g: number; b: number };
  }`,

  dndContextProps: `{
    children: React.ReactNode;
    onDragEnd?: (event: unknown) => void;
  }`,

  sortableContextProps: `{
    children: React.ReactNode;
    items?: string[];
    strategy?: unknown;
  }`,

  bulkUpdateModalProps: `{
    isOpen?: boolean;
    onClose?: () => void;
    selectedCues?: unknown[];
    onUpdate?: () => void;
  }`,

  wrapperProps: `{
    children: React.ReactNode;
  }`,

  mockProviderProps: `{
    children: React.ReactNode;
    mocks?: unknown[];
    addTypename?: boolean;
  }`
};

function fixAnyTypes(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix common patterns
  content = content.replace(
    /function MockAutocomplete\(\{ value, onChange, onSelect, options = \[\], placeholder \}: any\)/g,
    `function MockAutocomplete({ value, onChange, onSelect, options = [], placeholder }: ${mockTypes.autocompleteProps})`
  );

  content = content.replace(
    /function MockColorPickerModal\(\{ isOpen, onClose, onColorSelect, initialColor \}: any\)/g,
    `function MockColorPickerModal({ isOpen, onClose, onColorSelect, initialColor }: ${mockTypes.colorPickerProps})`
  );

  content = content.replace(
    /DndContext: \(\{ children, onDragEnd \}: any\)/g,
    `DndContext: ({ children, onDragEnd }: ${mockTypes.dndContextProps})`
  );

  content = content.replace(
    /SortableContext: \(\{ children \}: any\)/g,
    `SortableContext: ({ children }: ${mockTypes.sortableContextProps})`
  );

  content = content.replace(
    /function MockBulkFadeUpdateModal\(\{ isOpen, onClose, selectedCues, onUpdate \}: any\)/g,
    `function MockBulkFadeUpdateModal({ isOpen, onClose, selectedCues, onUpdate }: ${mockTypes.bulkUpdateModalProps})`
  );

  content = content.replace(
    /wrapper: \(\{ children \}: any\)/g,
    `wrapper: ({ children }: ${mockTypes.wrapperProps})`
  );

  content = content.replace(
    /MockedProvider.*children.*: any/g,
    `MockedProvider({ children, mocks, addTypename }: ${mockTypes.mockProviderProps})`
  );

  // Fix specific any patterns
  content = content.replace(
    /: any\) => \(/g,
    ': unknown) => ('
  );

  // Add display names for components
  const displayNamePattern = /return function Mock(\w+)/g;
  content = content.replace(displayNamePattern, (match, componentName) => {
    return `return function Mock${componentName}`;
  });

  // Add React import if using React.ReactNode
  if (content.includes('React.ReactNode') && !content.includes('import React')) {
    content = `import React from 'react';\n${content}`;
  }

  fs.writeFileSync(filePath, content);
}

// Get all test files
const testDirs = [
  'src/components/__tests__',
  'src/hooks/__tests__',
  'src/contexts/__tests__'
];

testDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.endsWith('.test.tsx') || file.endsWith('.test.ts')) {
        const filePath = path.join(dir, file);
        console.log(`Fixing types in ${filePath}`);
        fixAnyTypes(filePath);
      }
    });
  }
});

console.log('Type fixes completed!');