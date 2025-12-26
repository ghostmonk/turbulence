import { test, expect, sampleStories } from '../../fixtures';
import { StoryDetailPage } from '../../page-objects/story-detail.page';

test.describe('View Story', () => {
  test('displays story content', async ({ mockApiPage }) => {
    const storyPage = new StoryDetailPage(mockApiPage);

    await storyPage.gotoBySlug('my-published-story');
    await storyPage.waitForStory();

    // Verify story content is displayed
    await expect(storyPage.article).toBeVisible();
    await expect(storyPage.title).toBeVisible();
    await expect(storyPage.content).toBeVisible();
  });

  test('displays correct story title', async ({ mockApiPage }) => {
    const storyPage = new StoryDetailPage(mockApiPage);

    await storyPage.gotoBySlug('my-published-story');
    await storyPage.waitForStory();

    const title = await storyPage.getTitleText();
    expect(title).toBe('My Published Story');
  });

  test('back link navigates to home', async ({ mockApiPage }) => {
    const storyPage = new StoryDetailPage(mockApiPage);

    await storyPage.gotoBySlug('my-published-story');
    await storyPage.waitForStory();

    // Verify back link is visible
    await expect(storyPage.backLink).toBeVisible();

    // Click back link
    await storyPage.goBack();

    // Should be back on home page
    expect(storyPage.url).toBe('http://localhost:3000/');
  });

  test('shows error for non-existent story', async ({ mockApiPage }) => {
    const storyPage = new StoryDetailPage(mockApiPage);

    await storyPage.gotoBySlug('non-existent-story');

    // Should show error state
    await expect(storyPage.errorContainer).toBeVisible();
    await expect(storyPage.errorHomeLink).toBeVisible();
  });

  test('error page home link works', async ({ mockApiPage }) => {
    const storyPage = new StoryDetailPage(mockApiPage);

    await storyPage.gotoBySlug('non-existent-story');

    // Click home link in error state
    await storyPage.clickErrorHomeLink();

    // Should be on home page
    expect(storyPage.url).toBe('http://localhost:3000/');
  });

  test('navigation remains visible on story page', async ({ mockApiPage }) => {
    const storyPage = new StoryDetailPage(mockApiPage);

    await storyPage.gotoBySlug('my-published-story');
    await storyPage.waitForStory();

    // Verify navigation is visible
    await expect(storyPage.nav.nav).toBeVisible();
    await expect(storyPage.nav.homeLink).toBeVisible();
  });
});
