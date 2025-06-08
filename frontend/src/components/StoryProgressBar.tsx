import React, { useState, useEffect } from 'react';

interface StoryProgressBarProps {
  currentStoryCount: number;
  totalStoryCount: number;
}

const StoryProgressBar: React.FC<StoryProgressBarProps> = ({ 
  currentStoryCount, 
  totalStoryCount 
}) => {
  const [estimatedStoryNumber, setEstimatedStoryNumber] = useState(1);

  // Add/remove body class for any needed adjustments
  useEffect(() => {
    document.body.classList.add('has-progress-bar');
    return () => {
      document.body.classList.remove('has-progress-bar');
    };
  }, []);

  useEffect(() => {
    const updateProgress = () => {
      // Get all story cards
      const storyCards = document.querySelectorAll('.card');
      if (storyCards.length === 0) return;

      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Calculate which story is currently most visible in the viewport
      let currentVisibleIndex = 0;
      let maxVisibility = 0;

      storyCards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const cardTop = rect.top + scrollTop;
        const cardBottom = cardTop + rect.height;
        
        // Calculate how much of this card is visible
        const visibleTop = Math.max(cardTop, scrollTop);
        const visibleBottom = Math.min(cardBottom, scrollTop + windowHeight);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const visibilityRatio = visibleHeight / rect.height;

        if (visibilityRatio > maxVisibility) {
          maxVisibility = visibilityRatio;
          currentVisibleIndex = index;
        }
      });

      // Calculate overall scroll progress through the document
      const documentScrollProgress = documentHeight <= windowHeight 
        ? 0 
        : Math.min(100, (scrollTop / (documentHeight - windowHeight)) * 100);

      // Estimate which story number we're viewing out of total stories
      if (totalStoryCount > 0 && currentStoryCount > 0) {
        // Calculate the percentage of stories currently loaded
        const loadedStoriesRatio = currentStoryCount / totalStoryCount;
        
        // If we've loaded a significant portion, use story-based calculation
        if (loadedStoriesRatio > 0.8 || documentScrollProgress > 80) {
          // Near the end or most stories loaded - use story index
          setEstimatedStoryNumber(Math.min(currentVisibleIndex + 1, totalStoryCount));
        } else {
          // Early in the list - estimate based on scroll position and loading ratio
          const scrollBasedEstimate = Math.ceil((documentScrollProgress / 100) * totalStoryCount);
          const storyBasedEstimate = Math.ceil((currentVisibleIndex + 1) / currentStoryCount * totalStoryCount);
          
          // Use the more conservative estimate
          const estimate = Math.min(scrollBasedEstimate, storyBasedEstimate, totalStoryCount);
          setEstimatedStoryNumber(Math.max(1, estimate));
        }
      }
    };

    // Initial calculation
    updateProgress();

    // Add scroll listener with throttling
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateProgress);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateProgress);
    };
  }, [currentStoryCount, totalStoryCount]);

  // Calculate display progress based on estimated story position
  const displayProgress = totalStoryCount > 0 
    ? (estimatedStoryNumber / totalStoryCount) * 100
    : 0;

  return (
    <div className="story-progress-bar">
      <div className="story-progress-bar__container">
        <div 
          className="story-progress-bar__fill"
          style={{ width: `${Math.min(100, displayProgress)}%` }}
        />
      </div>
    </div>
  );
};

export default StoryProgressBar; 