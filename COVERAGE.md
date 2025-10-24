# Code Coverage Policy

## Current Coverage Thresholds

This repository maintains minimum code coverage thresholds to ensure code quality. The thresholds are configured in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 47,
    functions: 47,
    lines: 56,
    statements: 55,
  },
}
```

**Current Coverage (as of 2025-10-24):**
- Statements: 55.17%
- Branches: 47.98%
- Functions: 47.56%
- Lines: 56.15%

## Continuous Improvement Strategy

### High-Water Mark Approach

We use a **high-water mark** strategy for code coverage:

1. **Current thresholds reflect actual coverage** - Thresholds are set slightly below current coverage to allow for minor variations
2. **Coverage should never decrease** - New code must maintain or improve coverage
3. **Periodic threshold increases** - When coverage improves significantly, update thresholds in `jest.config.js`

### Goal: 75% Coverage

The project goal is to reach **75% coverage across all metrics**. This requires adding tests for:
- Uncovered React components
- Event handlers and user interactions
- GraphQL query/mutation error paths
- Utility functions

### Running Coverage Tests

```bash
# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Open detailed HTML coverage report
open coverage/index.html
```

### CI/CD Enforcement

The GitHub Actions CI workflow (`ci.yml`) runs coverage tests on every pull request. **Builds will fail** if coverage drops below the configured thresholds.

## Improving Coverage

### Priority Areas for Improvement

Files with **0% coverage** that need tests:
- `src/app/(main)/cue-lists/[id]/CueListPageClient.tsx`: 0%
- `src/app/(main)/scenes/[sceneId]/edit/SceneEditorPageClient.tsx`: 0%
- `src/components/ChannelListEditor.tsx`: 0%
- `src/utils/channelAbbreviation.ts`: 4.54%
- `src/utils/routeUtils.ts`: 0%
- `src/utils/uuid.ts`: 0%
- `src/graphql/settings.ts`: 0%

### Adding Tests

1. **Component Tests** - Use `@testing-library/react` for React components:
   ```typescript
   import { render, screen, fireEvent } from '@testing-library/react';
   import { MyComponent } from '../MyComponent';

   test('renders and handles click', () => {
     render(<MyComponent />);
     const button = screen.getByRole('button');
     fireEvent.click(button);
     expect(button).toHaveTextContent('Clicked');
   });
   ```

2. **GraphQL Query Tests** - Use `@apollo/client/testing` for mocking:
   ```typescript
   import { MockedProvider } from '@apollo/client/testing';

   const mocks = [
     {
       request: { query: MY_QUERY },
       result: { data: { myField: 'value' } },
     },
   ];

   render(
     <MockedProvider mocks={mocks}>
       <MyComponent />
     </MockedProvider>
   );
   ```

3. **Utility Function Tests** - Write simple unit tests:
   ```typescript
   import { myUtility } from '../myUtility';

   test('formats value correctly', () => {
     expect(myUtility('input')).toBe('expected output');
   });
   ```

### Updating Thresholds

When coverage improves across the codebase:

1. Run `npm run test:coverage` to get current metrics
2. Update thresholds in `jest.config.js` to reflect new baseline
3. Round down slightly to allow for minor variations
4. Commit the updated thresholds
5. Document the change in this file

### Best Practices

- **Test user interactions** - Click handlers, form submissions, keyboard events
- **Test error states** - Loading, error, empty state rendering
- **Test GraphQL integration** - Queries, mutations, subscriptions
- **Use meaningful assertions** - Don't just test rendering, test behavior
- **Mock external dependencies** - GraphQL client, browser APIs, routing

## Progress Tracking

| Date       | Statements | Branches | Functions | Lines | Notes |
|------------|------------|----------|-----------|-------|-------|
| 2025-10-24 | 55.17%     | 47.98%   | 47.56%    | 56.15% | Initial baseline |

**Next Milestone:** 60% coverage across all metrics

## Resources

- [Jest Coverage Documentation](https://jestjs.io/docs/configuration#coveragethreshold-object)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Apollo Client Testing](https://www.apollographql.com/docs/react/development-testing/testing/)
- [Coverage Reports Location](./coverage/index.html)
