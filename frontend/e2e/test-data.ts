/**
 * Shared test data for E2E tests.
 *
 * This file contains sample data used by both:
 * - Playwright route mocking (api-mock.fixture.ts)
 * - Express mock server (mock-server.ts)
 *
 * Keep this in sync to ensure consistent behavior between client-side
 * and SSR mocked responses.
 */

export interface TestStory {
  id: string;
  title: string;
  content: string;
  slug: string;
  is_published: boolean;
  createdDate: string;
  updatedDate: string;
}

// Fixed timestamp for consistent test behavior across timezones
export const FIXED_TIMESTAMP = '2025-01-01T12:00:00.000Z';

/**
 * Sample stories used in tests.
 * IDs and slugs are referenced in test specs - update tests if changing these.
 */
export const sampleStories: TestStory[] = [
  {
    id: 'story-1',
    title: 'My Published Story',
    content: '<p>This is a published story with rich content.</p>',
    slug: 'my-published-story',
    is_published: true,
    createdDate: FIXED_TIMESTAMP,
    updatedDate: FIXED_TIMESTAMP,
  },
  {
    id: 'story-2',
    title: 'My Draft Story',
    content: '<p>This draft is still in progress.</p>',
    slug: 'my-draft-story',
    is_published: false,
    createdDate: FIXED_TIMESTAMP,
    updatedDate: FIXED_TIMESTAMP,
  },
  {
    id: 'story-3',
    title: 'Story With Images',
    content: '<p>Story with an image:</p><img src="/test-image.jpg" alt="Test" width="800" height="600" />',
    slug: 'story-with-images',
    is_published: true,
    createdDate: FIXED_TIMESTAMP,
    updatedDate: FIXED_TIMESTAMP,
  },
];

/**
 * Helper to create a mock story with defaults.
 */
export function createTestStory(overrides: Partial<TestStory> = {}): TestStory {
  return {
    id: `story-${Date.now()}`,
    title: 'Test Story Title',
    content: '<p>Test story content.</p>',
    slug: 'test-story',
    is_published: true,
    createdDate: FIXED_TIMESTAMP,
    updatedDate: FIXED_TIMESTAMP,
    ...overrides,
  };
}
