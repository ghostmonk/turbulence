import { useState, useCallback } from 'react';
import { ApiRequestError, StandardErrorResponse } from '@/types/error';
import { ErrorService } from '@/services/errorService';

/**
 * State for API request tracking.
 */
export interface ApiRequestState<T> {
  data: T | null;
  loading: boolean;
  error: ApiRequestError | null;
}

/**
 * Return type for useApiRequest hook.
 */
export interface UseApiRequestReturn<T, Args extends unknown[]> extends ApiRequestState<T> {
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
  displayError: StandardErrorResponse | string | null;
  userMessage: string | null;
}

/**
 * Hook for making API requests with integrated error handling via ErrorService.
 * Provides structured error information including user-friendly messages and suggestions.
 *
 * @param apiFn - The API function to execute (from apiClient)
 * @param options - Configuration options
 * @returns API state and execute function
 *
 * @example
 * const { data, loading, error, execute, userMessage } = useApiRequest(
 *   (id: string) => apiClient.stories.getById(id, token)
 * );
 *
 * // Execute the request
 * const story = await execute('story-123');
 *
 * // Display error if any
 * if (userMessage) {
 *   showToast(userMessage);
 * }
 */
export function useApiRequest<T, Args extends unknown[] = []>(
  apiFn?: (...args: Args) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: ApiRequestError) => void;
    context?: string; // For error logging
  } = {}
): UseApiRequestReturn<T, Args> {
  const [state, setState] = useState<ApiRequestState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      if (!apiFn) return null;

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await apiFn(...args);
        setState({ data: result, loading: false, error: null });
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const apiError = err instanceof ApiRequestError
          ? err
          : new ApiRequestError(
              err instanceof Error ? err.message : 'An error occurred',
              0,
              null
            );

        setState(prev => ({ ...prev, loading: false, error: apiError }));
        ErrorService.logError(apiError, options.context);
        options.onError?.(apiError);
        return null;
      }
    },
    [apiFn, options.onSuccess, options.onError, options.context]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  // Derived error display values
  const displayError = state.error ? ErrorService.createDisplayError(state.error) : null;
  const userMessage = state.error ? ErrorService.getUserMessage(state.error) : null;

  return {
    ...state,
    execute,
    reset,
    displayError,
    userMessage,
  };
}

export default useApiRequest;
