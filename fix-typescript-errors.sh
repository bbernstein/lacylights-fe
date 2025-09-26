#!/bin/bash

echo "Fixing TypeScript errors in test files..."

# Fix @dnd-kit mock types
echo "Fixing @dnd-kit mock types..."
sed -i '' 's/({ children }: unknown)/({ children }: { children: React.ReactNode })/g' src/components/__tests__/*.test.tsx

# Fix ProjectManagementModal mock types
echo "Fixing ProjectManagementModal mock types..."
sed -i '' "s/({ className }: unknown)/({ className }: { className?: string })/g" src/components/__tests__/ProjectManagementModal.test.tsx

# Fix nullable descriptions to empty strings
echo "Fixing nullable descriptions..."
sed -i '' 's/description: null/description: ""/g' src/components/__tests__/*.test.tsx

# Fix followTime null to undefined
echo "Fixing followTime types..."
sed -i '' 's/followTime: null/followTime: undefined/g' src/components/__tests__/*.test.tsx

# Fix EditFixtureModal fixture type
echo "Fixing EditFixtureModal fixture type..."
sed -i '' "s/type: 'LED_PAR'/type: FixtureType.LED_PAR/g" src/components/__tests__/EditFixtureModal.test.tsx

# Add MockedResponse type to arrays
echo "Adding MockedResponse types..."
for file in src/components/__tests__/*.test.tsx src/hooks/__tests__/*.test.ts; do
  if [ -f "$file" ]; then
    # Check if MockedResponse is already imported
    if ! grep -q "MockedResponse" "$file"; then
      # Add MockedResponse to imports if it has MockedProvider
      if grep -q "MockedProvider" "$file"; then
        sed -i '' "s/import { MockedProvider }/import { MockedProvider, MockedResponse }/g" "$file"
      fi
    fi
  fi
done

echo "TypeScript fixes completed!"