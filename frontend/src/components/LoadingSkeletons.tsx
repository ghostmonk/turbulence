import React from 'react';

/**
 * Skeleton loading components for better perceived performance
 */

export const StoryItemSkeleton: React.FC = () => (
  <div className="card animate-pulse">
    <div className="story-header">
      <div className="story-header__actions">
        <div className="h-6 w-16 bg-gray-300 rounded"></div>
      </div>
      
      {/* Title skeleton */}
      <div className="h-8 w-3/4 bg-gray-300 rounded mb-2"></div>
      
      {/* Meta skeleton */}
      <div className="story-header__meta">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    </div>
    
    {/* Content skeleton */}
    <div className="story-content prose--card">
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
        <div className="h-4 w-4/5 bg-gray-200 rounded"></div>
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
      </div>
    </div>
    
    {/* Read more button skeleton */}
    <div className="mt-4">
      <div className="h-8 w-32 bg-gray-300 rounded"></div>
    </div>
  </div>
);

export const StoriesListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="mt-4">
    <div className="flex flex-col space-y-6">
      {Array.from({ length: count }, (_, index) => (
        <StoryItemSkeleton key={index} />
      ))}
    </div>
  </div>
);

export const EditorSkeleton: React.FC = () => (
  <div className="container mx-auto px-4 py-8 animate-pulse">
    {/* Title input skeleton */}
    <div className="mb-6">
      <div className="h-12 w-full bg-gray-200 rounded border"></div>
    </div>
    
    {/* Toolbar skeleton */}
    <div className="mb-4 flex space-x-2">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="h-8 w-8 bg-gray-300 rounded"></div>
      ))}
    </div>
    
    {/* Editor content skeleton */}
    <div className="mb-6 p-4 border rounded">
      <div className="space-y-3">
        {Array.from({ length: 10 }, (_, index) => (
          <div 
            key={index} 
            className={`h-4 bg-gray-200 rounded ${
              index % 3 === 0 ? 'w-5/6' : index % 2 === 0 ? 'w-full' : 'w-4/5'
            }`}
          ></div>
        ))}
      </div>
    </div>
    
    {/* Controls skeleton */}
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <div className="h-6 w-6 bg-gray-300 rounded"></div>
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
      <div className="flex space-x-2">
        <div className="h-10 w-24 bg-gray-300 rounded"></div>
        <div className="h-10 w-20 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

export const PageLoadingSkeleton: React.FC<{ message?: string }> = ({ 
  message = "Loading..." 
}) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    <p className="text-gray-600 animate-pulse">{message}</p>
  </div>
);

export const BackendWarmupBanner: React.FC<{ 
  isWarming: boolean; 
  warmupFailed: boolean;
  onRetry?: () => void;
}> = ({ isWarming, warmupFailed, onRetry }) => {
  if (!isWarming && !warmupFailed) return null;

  return (
    <div className={`p-4 mb-4 rounded-lg border-l-4 ${
      warmupFailed 
        ? 'bg-red-50 border-red-400 text-red-700' 
        : 'bg-blue-50 border-blue-400 text-blue-700'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isWarming && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
          )}
          <span className="font-medium">
            {isWarming ? 'Starting up services...' : 'Connection failed'}
          </span>
        </div>
        {warmupFailed && onRetry && (
          <button 
            onClick={onRetry}
            className="text-sm underline hover:no-underline"
          >
            Retry
          </button>
        )}
      </div>
      <p className="text-sm mt-1">
        {isWarming 
          ? 'This may take a few moments on the first visit.' 
          : 'Unable to connect to services. Please try again.'}
      </p>
    </div>
  );
};
