import { test, expect, Route } from '@playwright/test';

/**
 * E2E: surfacing the ETC Eos (.asc) format in the project selector's
 * import dropdown.
 *
 * This stubs the GraphQL endpoint so the test does not depend on a real
 * lacylights-go backend. It intercepts POSTs to /graphql, dispatches on
 * the operation name and returns enough data for ProjectSelector to
 * render with a current project. The full happy-path import — which
 * would create real database state — is exercised by the Jest tests in
 * src/components/__tests__/ImportExportButtons.test.tsx.
 */

type GqlBody = { operationName?: string; query?: string; variables?: Record<string, unknown> };

// Use fixed timestamps so the GraphQL stub responses are deterministic across
// test runs; otherwise re-running the suite produces different mocked payloads.
const PROJECT = {
  id: 'p-eos-e2e',
  name: 'Eos E2E Project',
  description: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  layoutCanvasWidth: 2000,
  layoutCanvasHeight: 2000,
  groupId: 'g1',
  group: { id: 'g1', name: 'Personal', isPersonal: true },
};

function inferOperation(body: GqlBody): string {
  if (body.operationName) return body.operationName;
  const m = body.query?.match(/(?:query|mutation|subscription)\s+(\w+)/);
  return m ? m[1] : '';
}

async function handleGraphQL(route: Route): Promise<void> {
  const request = route.request();
  let body: GqlBody = {};
  try {
    body = JSON.parse(request.postData() ?? '{}') as GqlBody;
  } catch {
    body = {};
  }
  const op = inferOperation(body);

  const respond = (data: unknown) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data }),
    });

  switch (op) {
    case 'GetProjects':
      return respond({ projects: [PROJECT] });
    case 'GetProject':
      return respond({ project: { ...PROJECT, fixtures: [], looks: [], cueLists: [] } });
    case 'GetMyInvitations':
      return respond({ myInvitations: [] });
    case 'CheckDeviceAuthorization':
      return respond({
        checkDeviceAuthorization: {
          isAuthorized: true,
          isPending: false,
          device: null,
          defaultUser: null,
        },
      });
    case 'GetSystemInfo':
      return respond({ systemInfo: { version: '0.0.0', artnetEnabled: false, oflImportEnabled: false } });
    default:
      // Fail fast on unhandled GraphQL operations so this test signals when
      // the app starts issuing new queries the stub hasn't accounted for,
      // rather than silently passing on `{ data: null }`.
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          errors: [
            {
              message: `Unhandled GraphQL operation in e2e stub: ${op || 'unknown'}`,
            },
          ],
        }),
      });
  }
}

test('shows ETC Eos (.asc) in the project selector import dropdown', async ({ page }) => {
  await page.route('**/graphql', handleGraphQL);

  await page.goto('/');

  // Open the project dropdown in the header.
  const projectButton = page.getByRole('button', { name: /Project:|Eos E2E Project/i });
  await expect(projectButton).toBeVisible({ timeout: 15_000 });
  await projectButton.click();

  // ProjectSelector renders ImportExportButtons with inDropdown=true; that
  // exposes the format options as menu items keyed by the format label.
  // Both the import and export sections render an "ETC Eos (.asc)" item,
  // so assert on the count rather than a single match.
  const eosItems = page.getByRole('menuitem', { name: /ETC Eos \(\.asc\)/ });
  await expect(eosItems).toHaveCount(2);
  await expect(eosItems.first()).toBeVisible();
});
