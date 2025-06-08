import React from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { formatDate } from '@/utils/formatDate';
import { getStoryUrl } from '@/utils/urls';
import { Story } from '@/types/api';
import { sanitizeHtml } from '@/utils/sanitizer';

interface StoryPageProps {
  story: Story | null;
  error?: string;
}

export default function StoryPage({ story, error }: StoryPageProps) {
  const canonicalUrl = story?.slug ? getStoryUrl(story.slug) : '';
  
  // Create a short excerpt from the content
  const createExcerpt = (content: string): string => {
    // Remove HTML tags and get plain text
    const div = document.createElement('div');
    div.innerHTML = content;
    const text = div.textContent || div.innerText || '';
    
    // Trim to 160 chars for meta description
    return text.substring(0, 157) + '...';
  };
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-semibold">Error Loading Story</h3>
          <p className="text-red-600 mt-2">{error}</p>
          <Link href="/" className="btn btn--primary">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center p-8">
          <h2 className="loading-title">Loading...</h2>
        </div>
      </div>
    );
  }
  
  const excerpt = typeof window !== 'undefined' ? createExcerpt(story.content) : '';

  return (
    <>
      <Head>
        <title>{story.title} | Turbulence Blog</title>
        <meta name="description" content={excerpt || `${story.title} - Read the full story on Turbulence Blog`} />
        <meta property="og:title" content={story.title} />
        <meta property="og:description" content={excerpt || `Read the full story on Turbulence Blog`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:title" content={story.title} />
        <meta name="twitter:description" content={excerpt || `Read the full story on Turbulence Blog`} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      
      <div style={{margin: '0 auto', maxWidth: '800px', padding: '2rem 1rem'}}>
        <Link href="/" className="inline-block mb-8 btn btn--secondary btn--sm">
          &larr; Back to all stories
        </Link>
        
        <article className="card">
          <h1 className="story-title">{story.title}</h1>
          
          <div className="flex items-center text-sm mb-8">
            <span className="text-gray-400">{formatDate(story.createdDate)}</span>
            {story.updatedDate !== story.createdDate && (
              <span className="text-gray-400 text-xs ml-2 opacity-70">
                (Updated: {formatDate(story.updatedDate)})
              </span>
            )}
          </div>
          
          <div 
            className="prose--card lg:prose-lg dark:prose-invert dark:text-gray-200"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(story.content),
            }}
          />
          
          <div className="mt-10 pt-6">
            <Link href="/" className="btn btn--secondary btn--sm">
              &larr; Back to all stories
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<StoryPageProps> = async (context) => {
  const { slug } = context.params || {};

  if (!slug || typeof slug !== 'string') {
    return {
      props: {
        story: null,
        error: 'Story not found'
      }
    };
  }

  try {
    // Use the API endpoint directly since we're on the server
    const apiUrl = `${process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL}/stories/slug/${slug}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      if (response.status === 404) {
        return {
          props: {
            story: null,
            error: 'Story not found'
          }
        };
      }
      
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      return {
        props: {
          story: null,
          error: errorData.detail || `Error: ${response.statusText}`
        }
      };
    }
    
    const story = await response.json();
    
    return {
      props: {
        story
      }
    };
  } catch (error) {
    console.error('Error fetching story by slug:', error);
    
    return {
      props: {
        story: null,
        error: error instanceof Error ? error.message : 'Failed to load story'
      }
    };
  }
}; 
