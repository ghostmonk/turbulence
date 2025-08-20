import React from 'react';

export type LoadingAnimationType = 
  | 'bouncingDots' 
  | 'pulsingDot' 
  | 'spinnerLarge' 
  | 'wavyDots' 
  | 'breathingBar';

interface LoadingAnimationProps {
  type: LoadingAnimationType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Reusable loading animation component with multiple animation types
 */
export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  type, 
  size = 'md',
  className = '' 
}) => {
  // Size variants for different animations
  const sizeClasses = {
    sm: {
      dot: 'w-1.5 h-1.5',
      largeDot: 'w-2.5 h-2.5',
      spinner: 'h-3 w-3',
      bar: 'w-0.5 h-3'
    },
    md: {
      dot: 'w-2 h-2',
      largeDot: 'w-3 h-3',
      spinner: 'h-4 w-4',
      bar: 'w-1 h-4'
    },
    lg: {
      dot: 'w-3 h-3',
      largeDot: 'w-4 h-4',
      spinner: 'h-6 w-6',
      bar: 'w-1.5 h-6'
    }
  };

  const sizes = sizeClasses[size];

  const animations = {
    bouncingDots: (
      <div className={`flex space-x-1 ${className}`}>
        <div className={`${sizes.dot} bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce`} style={{animationDelay: '0ms'}}></div>
        <div className={`${sizes.dot} bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce`} style={{animationDelay: '150ms'}}></div>
        <div className={`${sizes.dot} bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce`} style={{animationDelay: '300ms'}}></div>
      </div>
    ),
    
    pulsingDot: (
      <div className={`${sizes.largeDot} bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse ${className}`}></div>
    ),
    
    spinnerLarge: (
      <div className={`animate-spin rounded-full ${sizes.spinner} border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300 ${className}`}></div>
    ),
    
    wavyDots: (
      <div className={`flex space-x-1 ${className}`}>
        <div className={`${sizes.dot} bg-gray-500 dark:bg-gray-400 rounded-full animate-ping`} style={{animationDelay: '0ms'}}></div>
        <div className={`${sizes.dot} bg-gray-500 dark:bg-gray-400 rounded-full animate-ping`} style={{animationDelay: '200ms'}}></div>
        <div className={`${sizes.dot} bg-gray-500 dark:bg-gray-400 rounded-full animate-ping`} style={{animationDelay: '400ms'}}></div>
      </div>
    ),
    
    breathingBar: (
      <div className={`flex space-x-0.5 ${className}`}>
        <div className={`${sizes.bar} bg-gray-500 dark:bg-gray-400 rounded animate-pulse`} style={{animationDelay: '0ms'}}></div>
        <div className={`${sizes.bar} bg-gray-500 dark:bg-gray-400 rounded animate-pulse`} style={{animationDelay: '100ms'}}></div>
        <div className={`${sizes.bar} bg-gray-500 dark:bg-gray-400 rounded animate-pulse`} style={{animationDelay: '200ms'}}></div>
        <div className={`${sizes.bar} bg-gray-500 dark:bg-gray-400 rounded animate-pulse`} style={{animationDelay: '300ms'}}></div>
      </div>
    )
  };

  return animations[type];
};

/**
 * Showcase component to preview all loading animations
 */
export const LoadingAnimationShowcase: React.FC = () => {
  const animationTypes: LoadingAnimationType[] = [
    'bouncingDots', 
    'pulsingDot', 
    'spinnerLarge', 
    'wavyDots', 
    'breathingBar'
  ];

  const animationNames = {
    bouncingDots: 'Bouncing Dots',
    pulsingDot: 'Pulsing Dot',
    spinnerLarge: 'Large Spinner',
    wavyDots: 'Wavy Dots',
    breathingBar: 'Breathing Bars'
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {animationTypes.map((type) => (
        <div key={type} className="p-4 border dark:border-gray-600 rounded text-center">
          <div className="mb-2 flex justify-center">
            <LoadingAnimation type={type} />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {animationNames[type]}
          </p>
          <div className="flex justify-center space-x-2">
            <LoadingAnimation type={type} size="sm" />
            <LoadingAnimation type={type} size="md" />
            <LoadingAnimation type={type} size="lg" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">sm / md / lg</p>
        </div>
      ))}
    </div>
  );
};

export default LoadingAnimation;
