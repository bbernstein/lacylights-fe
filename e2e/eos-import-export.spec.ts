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

const PROJECT = {
  id: 'p-eos-e2e',
  name: 'Eos E2E Project',
  description: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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
      return respond({ checkDeviceAuthorization: { authorized: true, deviceId: 'dev-1', deviceName: 'e2e' } });
    case 'GetSystemInfo':
      return respond({ systemInfo: { version: '0.0.0', artnetEnabled: false, oflImportEnabled: false } });
    default:
      return respond(null);
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
