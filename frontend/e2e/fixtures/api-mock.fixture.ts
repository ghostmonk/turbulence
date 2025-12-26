import { test as base, Page } from '@playwright/test';
import { test as authTest, MockSession, defaultMockSession } from './auth.fixture';

/**
 * Story type matching the frontend API types.
 */
export interface MockStory {
  id: string;
  title: string;
  content: string;
  slug: string;
  is_published: boolean;
  createdDate: string;
  updatedDate: string;
}

/**
 * Paginated response matching the backend API.
 */
export interface MockPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/**
 * Creates a mock story with default values.
 */
export function createMockStory(overrides: Partial<MockStory> = {}): MockStory {
  const id = overrides.id || `story-${Date.now()}`;
  const now = new Date().toISOString();

  return {
    id,
    title: 'Test Story Title',
    content: '<p>This is test story content with some <strong>bold</strong> text.</p>',
    slug: 'test-story-title',
    is_published: true,
    createdDate: now,
    updatedDate: now,
    ...overrides,
  };
}

/**
 * Creates a paginated response with mock stories.
 */
export function createMockStoriesResponse(
  stories: MockStory[],
  options: { page?: number; size?: number; total?: number } = {}
): MockPaginatedResponse<MockStory> {
  const page = options.page ?? 1;
  const size = options.size ?? 10;
  const total = options.total ?? stories.length;
  const pages = Math.ceil(total / size);

  return {
    items: stories,
    total,
    page,
    size,
    pages,
  };
}

/**
 * Sample stories for testing various scenarios.
 */
export const sampleStories = {
  published: createMockStory({
    id: 'story-1',
    title: 'My Published Story',
    slug: 'my-published-story',
    is_published: true,
    content: '<p>This is a published story with rich content.</p>',
  }),

  draft: createMockStory({
    id: 'story-2',
    title: 'My Draft Story',
    slug: 'my-draft-story',
    is_published: false,
    content: '<p>This draft is still in progress.</p>',
  }),

  withImages: createMockStory({
    id: 'story-3',
    title: 'Story With Images',
    slug: 'story-with-images',
    is_published: true,
    content: '<p>Story with an image:</p><img src="/test-image.jpg" alt="Test" width="800" height="600" />',
  }),
};

/**
 * API mock configuration options.
 */
export interface ApiMockOptions {
  stories?: MockStory[];
  failRequests?: boolean;
  networkDelay?: number;
}

/**
 * Sets up API mocking for the backend endpoints.
 */
async function setupApiMocks(page: Page, options: ApiMockOptions = {}) {
  const {
    stories = [sampleStories.published, sampleStories.draft],
    failRequests = false,
    networkDelay = 0,
  } = options;

  // Helper to add delay if configured
  const maybeDelay = async () => {
    if (networkDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, networkDelay));
    }
  };

  // Mock stories list endpoint
  await page.route('**/stories?**', async (route) => {
    await maybeDelay();

    if (failRequests) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      });
      return;
    }

    const url = new URL(route.request().url());
    const page_num = parseInt(url.searchParams.get('page') || '1', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);

    // Paginate stories
    const start = (page_num - 1) * size;
    const pageStories = stories.slice(start, start + size);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createMockStoriesResponse(pageStories, {
        page: page_num,
        size,
        total: stories.length,
      })),
    });
  });

  // Mock individual story by slug
  await page.route('**/stories/slug/**', async (route) => {
    await maybeDelay();

    if (failRequests) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      });
      return;
    }

    const url = route.request().url();
    const slug = url.split('/stories/slug/')[1]?.split('?')[0];
    const story = stories.find((s) => s.slug === slug);

    if (story) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(story),
      });
    } else {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Story not found' }),
      });
    }
  });

  // Mock individual story by ID (matches story-1, UUIDs, etc.)
  await page.route(/\/stories\/[\w-]+$/, async (route) => {
    await maybeDelay();
    const method = route.request().method();

    if (failRequests) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      });
      return;
    }

    const url = route.request().url();
    const id = url.split('/stories/')[1]?.split('?')[0];

    if (method === 'DELETE') {
      await route.fulfill({
        status: 204,
      });
      return;
    }

    if (method === 'PUT') {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...body, id }),
      });
      return;
    }

    const story = stories.find((s) => s.id === id);
    if (story) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(story),
      });
    } else {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Story not found' }),
      });
    }
  });

  // Mock create story endpoint
  await page.route('**/stories', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }

    await maybeDelay();

    if (failRequests) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      });
      return;
    }

    const body = route.request().postDataJSON();
    const newStory = createMockStory({
      ...body,
      id: `story-${Date.now()}`,
    });

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(newStory),
    });
  });

  // Mock upload endpoints
  await page.route('**/upload/**', async (route) => {
    await maybeDelay();

    if (failRequests) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Upload failed' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: '/mock-uploaded-file.jpg' }),
    });
  });
}

/**
 * Extended test fixture with API mocking.
 */
export const test = authTest.extend<{
  mockApiPage: Page;
  mockAuthenticatedApiPage: Page;
}>({
  /**
   * Page with mocked API (unauthenticated).
   */
  mockApiPage: async ({ unauthenticatedPage }, use) => {
    await setupApiMocks(unauthenticatedPage);
    await use(unauthenticatedPage);
  },

  /**
   * Page with mocked API (authenticated).
   */
  mockAuthenticatedApiPage: async ({ authenticatedPage }, use) => {
    await setupApiMocks(authenticatedPage);
    await use(authenticatedPage);
  },
});

export { expect } from '@playwright/test';
export { setupApiMocks, defaultMockSession };
export type { MockSession };
