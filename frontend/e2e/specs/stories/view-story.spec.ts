import { test, expect } from '../../fixtures';
import { StoryDetailPage } from '../../page-objects/story-detail.page';
import { HomePage } from '../../page-objects/home.page';

/**
 * Story detail page tests.
 *
 * Note: Direct SSR tests are skipped as they require the mock server
 * to be reachable from Next.js server-side, which needs additional setup.
 * Navigation-based tests that use client-side routing work with API mocking.
 */
test.describe('View Story', () => {
  test('navigating to story from home page works', async ({ mockApiPage }) => {
    const homePage = new HomePage(mockApiPage);
    await homePage.goto();
    await homePage.waitForStories();

    // Click on a story to navigate
    const storyCard = homePage.getStoryCard('story-1');
    await storyCard.clickTitle();

    // Verify URL changed to story page
    expect(homePage.url).toContain('/stories/');
  });

  test('clicking read more navigates to story', async ({ mockApiPage }) => {
    const homePage = new HomePage(mockApiPage);
    await homePage.goto();
    await homePage.waitForStories();

    const storyCard = homePage.getStoryCard('story-1');
    await storyCard.clickReadMore();

    expect(homePage.url).toContain('/stories/');
  });

  // SSR tests - require mock server integration (skipped for now)
  test.describe('SSR Tests (require mock server)', () => {
    test.skip('displays story content', async ({ page }) => {
      const storyPage = new StoryDetailPage(page);
      await storyPage.gotoBySlug('my-published-story');
      await storyPage.waitForStory();
      await expect(storyPage.article).toBeVisible();
    });

    test.skip('shows error for non-existent story', async ({ page }) => {
      const storyPage = new StoryDetailPage(page);
      await storyPage.gotoBySlug('non-existent-story');
      await expect(storyPage.errorContainer).toBeVisible();
    });
  });
});
