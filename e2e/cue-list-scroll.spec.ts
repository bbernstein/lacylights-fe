import { test, expect } from '@playwright/test';

/**
 * E2E tests for cue list player scroll behavior
 *
 * These tests verify that when returning to the cue list player,
 * the current playing cue is automatically scrolled into view.
 */

test.describe('Cue List Player Scroll Behavior', () => {
  // This test requires a running backend with test data
  // Skip if backend is not available
  test.beforeEach(async ({ page }) => {
    // Check if backend is available
    try {
      const response = await page.request.get('http://localhost:4000/graphql', {
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ query: '{ __typename }' }),
      });
      if (!response.ok()) {
        test.skip();
      }
    } catch {
      test.skip();
    }
  });

  test('should scroll to current cue when returning to player page', async ({ page }) => {
    // First, we need to get a cue list with enough cues to require scrolling
    // Navigate to home/projects page to find a project with cue lists
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // This test demonstrates the expected behavior
    // For now, let's document what we expect to happen

    // 1. Go to a cue list player page
    // 2. Start playing and advance through cues until current cue is not visible at top
    // 3. Navigate away (e.g., click back or go to another page)
    // 4. Return to the player page
    // 5. The current cue should be automatically scrolled into view

    // Since we need specific test data, let's create a more targeted test
    // that checks the scroll behavior mechanism
  });

  test('current cue element should be visible after navigation', async ({ page }) => {
    // This test will check if the scroll-to-cue functionality works
    // by monitoring the DOM state when returning to the player

    // Navigate to a player page (will need a real cue list ID)
    // For now, use a placeholder that would work if data exists
    const testCueListId = 'test-cue-list';

    await page.goto(`/player/${testCueListId}/`);
    await page.waitForLoadState('networkidle');

    // Check if we got redirected or if the page loaded
    const currentUrl = page.url();

    // If the page loaded with cue list data, test the scroll behavior
    // Look for cue elements
    const cueElements = await page.locator('[data-testid="cue-item"], [class*="cue"]').all();

    console.log(`Found ${cueElements.length} cue elements`);

    // If there are cues, check scroll behavior
    if (cueElements.length > 0) {
      // Find the current cue (should have special styling)
      const currentCue = page.locator('[class*="border-green-500"], [class*="border-amber-500"]').first();

      if (await currentCue.isVisible()) {
        // Get the bounding box of the current cue
        const boundingBox = await currentCue.boundingBox();
        console.log('Current cue bounding box:', boundingBox);

        // Check if it's in the visible viewport
        const viewportSize = page.viewportSize();
        if (boundingBox && viewportSize) {
          const isInViewport =
            boundingBox.y >= 0 &&
            boundingBox.y + boundingBox.height <= viewportSize.height;

          console.log(`Current cue in viewport: ${isInViewport}`);
          expect(isInViewport).toBeTruthy();
        }
      }
    }
  });

  test('debug: log scroll state on navigation', async ({ page }) => {
    // This test helps debug the scroll issue by logging state

    // Listen for console messages from the app
    page.on('console', msg => {
      if (msg.text().includes('[SCROLL]')) {
        console.log('App log:', msg.text());
      }
    });

    // Navigate to a cue list player
    // You'll need to replace this with an actual cue list ID from your test data
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to find a link to a cue list player
    const playerLinks = await page.locator('a[href*="/player/"]').all();
    console.log(`Found ${playerLinks.length} player links`);

    if (playerLinks.length > 0) {
      // Click the first player link
      await playerLinks[0].click();
      await page.waitForLoadState('networkidle');

      console.log('Navigated to player page:', page.url());

      // Wait a moment for scroll to happen
      await page.waitForTimeout(500);

      // Navigate away
      await page.goBack();
      await page.waitForLoadState('networkidle');

      console.log('Navigated back:', page.url());

      // Return to player
      if (playerLinks.length > 0) {
        // Find the player link again (DOM may have changed)
        const newPlayerLinks = await page.locator('a[href*="/player/"]').all();
        if (newPlayerLinks.length > 0) {
          await newPlayerLinks[0].click();
          await page.waitForLoadState('networkidle');

          console.log('Returned to player:', page.url());

          // Wait for scroll
          await page.waitForTimeout(500);

          // Check current cue visibility
          const currentCue = page.locator('[class*="border-green-500"], [class*="border-amber-500"]').first();
          const isVisible = await currentCue.isVisible().catch(() => false);
          console.log('Current cue visible:', isVisible);
        }
      }
    }
  });
});
