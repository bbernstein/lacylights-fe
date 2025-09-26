#!/bin/bash

# Fix all lint errors in test files

echo "Fixing lint errors in test files..."

# Fix unused imports
sed -i '' 's/import { render, screen, fireEvent, waitFor }/import { render, screen, fireEvent }/g' src/components/__tests__/Autocomplete.test.tsx
sed -i '' 's/import { render, screen, fireEvent, waitFor }/import { render, screen, fireEvent }/g' src/components/__tests__/EditFixtureModal.test.tsx

# Fix unused variables by prefixing with underscore
find src -name "*.test.tsx" -o -name "*.test.ts" | xargs sed -i '' 's/const submitButton =/const _submitButton =/g'
find src -name "*.test.tsx" -o -name "*.test.ts" | xargs sed -i '' 's/const descriptionInput =/const _descriptionInput =/g'
find src -name "*.test.tsx" -o -name "*.test.ts" | xargs sed -i '' 's/const startMutation =/const _startMutation =/g'
find src -name "*.test.tsx" -o -name "*.test.ts" | xargs sed -i '' 's/const headings =/const _headings =/g'

# Fix unused imports by removing them
sed -i '' 's/, waitFor//g' src/components/__tests__/EditFixtureModal.test.tsx
sed -i '' 's/fireEvent, //g' src/components/__tests__/EditFixtureModal.test.tsx
sed -i '' 's/fireEvent, //g' src/components/__tests__/ProjectManagementModal.test.tsx
sed -i '' 's/import userEvent from.*;//g' src/components/__tests__/CueListPlaybackView.test.tsx

# Fix unused variable declarations
sed -i '' 's/const mockUpdatedScene =/const _mockUpdatedScene =/g' src/hooks/__tests__/useCurrentActiveScene.test.ts
sed -i '' 's/import { act, /import { /g' src/components/__tests__/SceneEditorModal.test.tsx

# Fix unused imports in various files
sed -i '' 's/UPDATE_PREVIEW_CHANNEL,//g' src/components/__tests__/SceneEditorModal.test.tsx
sed -i '' 's/REORDER_SCENE_FIXTURES,//g' src/components/__tests__/SceneEditorModal.test.tsx
sed -i '' 's/GET_CUE_LIST_PLAYBACK_STATUS,//g' src/components/__tests__/CueListUnifiedView.test.tsx
sed -i '' 's/REORDER_CUES,//g' src/components/__tests__/CueListUnifiedView.test.tsx
sed -i '' 's/UPDATE_CUE_LIST,//g' src/components/__tests__/CueListUnifiedView.test.tsx
sed -i '' 's/PREVIOUS_CUE,//g' src/components/__tests__/CueListUnifiedView.test.tsx

# Fix unused constants
sed -i '' 's/AMBER_BLUE_REDUCTION_FACTOR,//g' src/utils/__tests__/colorConversion.test.ts
sed -i '' 's/UV_COLOR_FACTORS,//g' src/utils/__tests__/colorConversion.test.ts

# Fix unused function parameters
sed -i '' 's/forEach((filter, index) =>/forEach((filter, _index) =>/g' src/data/__tests__/roscoluxFilters.test.ts

echo "Basic lint fixes applied. Now applying specific fixes..."

# Remove unused createMockProvider
sed -i '' '/const createMockProvider/,/^$/d' src/components/__tests__/CreateCueListModal.test.tsx

echo "Lint fixes completed!"