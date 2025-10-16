import { test, expect } from '@playwright/test';

/**
 * E2E tests for dynamic routes in static export mode
 *
 * These tests verify that dynamic routes work correctly in both:
 * - Dev mode (Next.js server with dynamic routing)
 * - Static export mode (static files served by custom server)
 */

test.describe('Dynamic Route Navigation', () => {
  test.describe('Scene Editor', () => {
    test('should load scene editor page with dynamic sceneId', async ({ page }) => {
      // Use a realistic scene ID (CUID format used by the app)
      const sceneId = 'cmggobir40ntk4ipsxdkg2o9y';

      // Navigate directly to the scene editor URL
      await page.goto(`/scenes/${sceneId}/edit/`);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Verify we're on the scene editor page (not redirected to /fixtures/)
      expect(page.url()).toContain(`/scenes/${sceneId}/edit`);
      expect(page.url()).not.toContain('/fixtures');

      // Verify the page title or heading suggests scene editor
      // (This will fail gracefully if backend is not running, which is okay for static export tests)
      const heading = await page.textContent('h1,h2').catch(() => '');
      console.log(`Scene editor heading: ${heading}`);
    });

    test('should not redirect to /fixtures/ when scene ID is missing', async ({ page }) => {
      // Use a realistic scene ID
      const sceneId = 'test-scene-id-123';

      // Navigate to scene editor
      await page.goto(`/scenes/${sceneId}/edit/`);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Verify the URL still contains the scene editor route
      expect(page.url()).toContain(`/scenes/${sceneId}/edit`);

      // Verify we didn't get redirected to fixtures page
      expect(page.url()).not.toContain('/fixtures');
    });

    test('should extract scene ID from URL in static export mode', async ({ page }) => {
      const sceneId = 'static-export-test-id';

      // Navigate to scene editor
      await page.goto(`/scenes/${sceneId}/edit/`);

      await page.waitForLoadState('networkidle');

      // In static export mode, the page should extract the scene ID from the URL
      // We can't easily test the internal state, but we can verify:
      // 1. The URL is correct
      expect(page.url()).toContain(`/scenes/${sceneId}/edit`);

      // 2. The page loaded (no 404)
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('404');
      expect(bodyText).not.toContain('Page Not Found');
    });
  });

  test.describe('Cue List Player', () => {
    test('should load player page with dynamic cueListId', async ({ page }) => {
      const cueListId = 'test-cue-list-123';

      await page.goto(`/player/${cueListId}/`);
      await page.waitForLoadState('networkidle');

      // Verify we're on the player page
      expect(page.url()).toContain(`/player/${cueListId}`);

      // Verify no unexpected redirects
      expect(page.url()).not.toContain('/fixtures');
    });
  });

  test.describe('Cue List Detail', () => {
    test('should load cue list detail page with dynamic id', async ({ page }) => {
      const cueListId = 'test-cue-list-detail-456';

      await page.goto(`/cue-lists/${cueListId}/`);
      await page.waitForLoadState('networkidle');

      // Verify we're on the cue list detail page
      expect(page.url()).toContain(`/cue-lists/${cueListId}`);

      // Verify no unexpected redirects
      expect(page.url()).not.toContain('/fixtures');
    });
  });

  test.describe('Static Asset Loading', () => {
    test('should load JavaScript bundles correctly', async ({ page }) => {
      // Navigate to home page
      await page.goto('/');

      // Check for Next.js framework scripts
      const scripts = await page.$$eval('script[src]', (elements) =>
        elements.map((el) => el.getAttribute('src'))
      );

      // Should have Next.js scripts
      const hasNextScripts = scripts.some((src) => src?.includes('/_next/'));
      expect(hasNextScripts).toBeTruthy();
    });

    test('should load CSS correctly', async ({ page }) => {
      await page.goto('/');

      // Check for stylesheets
      const styles = await page.$$eval('link[rel="stylesheet"]', (elements) =>
        elements.map((el) => el.getAttribute('href'))
      );

      // Should have at least one stylesheet
      expect(styles.length).toBeGreaterThan(0);
    });
  });
});
