import { useState, useCallback } from 'react';

/**
 * Async state for tracking loading, error, and data.
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Return type for useAsync hook.
 */
export interface UseAsyncReturn<T, Args extends unknown[]> extends AsyncState<T> {
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

/**
 * Generic hook for managing async operations with loading, error, and data states.
 * Eliminates the repeated pattern of [loading, setLoading], [error, setError], [data, setData].
 *
 * @param asyncFn - The async function to execute
 * @param options - Configuration options
 * @returns AsyncState and execute function
 *
 * @example
 * const { data, loading, error, execute } = useAsync(
 *   (id: string) => apiClient.stories.getById(id, token)
 * );
 *
 * // Later: execute('story-123');
 */
export function useAsync<T, Args extends unknown[] = []>(
  asyncFn?: (...args: Args) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
): UseAsyncReturn<T, Args> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      if (!asyncFn) return null;

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await asyncFn(...args);
        setState({ data: result, loading: false, error: null });
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        options.onError?.(err instanceof Error ? err : new Error(errorMessage));
        return null;
      }
    },
    [asyncFn, options.onSuccess, options.onError]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
  };
}

export default useAsync;
