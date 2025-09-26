const fs = require('fs');
const path = require('path');

function addDisplayNames(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add display names to function components
  const patterns = [
    {
      pattern: /return function Mock(\w+)\(/g,
      replacement: (match, componentName) => {
        const displayName = `Mock${componentName}.displayName = 'Mock${componentName}';`;
        return `return function Mock${componentName}(`;
      }
    }
  ];

  patterns.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });

  // Add display names after function definitions
  const mockFunctionPattern = /return function Mock(\w+)\([^)]*\) \{/g;
  let match;
  const componentsFound = [];

  while ((match = mockFunctionPattern.exec(content)) !== null) {
    componentsFound.push(match[1]);
  }

  // Add display names for each component found
  componentsFound.forEach(componentName => {
    const mockFunctionName = `Mock${componentName}`;
    const displayNameLine = `${mockFunctionName}.displayName = '${mockFunctionName}';`;

    // Check if display name already exists
    if (!content.includes(displayNameLine)) {
      // Find the end of the mock function and add display name
      const functionEnd = new RegExp(`return function ${mockFunctionName}\\([^)]*\\) \\{[\\s\\S]*?\\}\\s*\\};`, 'g');
      content = content.replace(functionEnd, (fullMatch) => {
        return fullMatch + '\n  ' + displayNameLine;
      });
    }
  });

  // Add displayName for wrapper functions
  if (content.includes('wrapper: ({ children }:') && !content.includes('TestWrapper.displayName')) {
    content = content.replace(
      /wrapper: \(\{ children \}:[^}]+\}\) => <div>\{children\}<\/div>/g,
      `wrapper: function TestWrapper({ children }: { children: React.ReactNode }) { return <div>{children}</div>; }`
    );
    content += '\nTestWrapper.displayName = "TestWrapper";';
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
      if (file.endsWith('.test.tsx')) {
        const filePath = path.join(dir, file);
        console.log(`Adding display names in ${filePath}`);
        addDisplayNames(filePath);
      }
    });
  }
});

console.log('Display name fixes completed!');