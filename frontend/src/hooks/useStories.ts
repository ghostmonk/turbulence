/**
 * Story-related hooks - re-exported from focused modules.
 *
 * @deprecated Import directly from '@/hooks/stories' instead.
 * This file exists for backward compatibility.
 */
export { useFetchStories } from './stories/useFetchStories';
export { useFetchStory } from './stories/useFetchStory';
export { useStoryMutations as useStoryOperations } from './stories/useStoryMutations';

// Re-export types
export type { UseFetchStoriesOptions, UseFetchStoriesReturn } from './stories/useFetchStories';
export type { UseFetchStoryReturn } from './stories/useFetchStory';
export type { UseStoryMutationsReturn, MutationErrorDetails } from './stories/useStoryMutations';
