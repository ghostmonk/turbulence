import React from 'react';
import Head from 'next/head';
import { GetStaticProps } from 'next';
import Stories from '@/components/Stories';
import { Story, PaginatedResponse } from '@/types/api';

interface HomeProps {
    initialStories?: PaginatedResponse<Story>;
    error?: string;
}

const Home: React.FC<HomeProps> = ({ initialStories, error }) => {
    return (
        <>
            <Head>
                <title>Turbulence</title>
                <meta name="description" content="Stories and Such - Ghostmonk: Turbulence!"/>
                <meta name="keywords" content="Ghostmonk, Turbulence, News, Updates"/>
            </Head>

            <div style={{margin: '0 auto', maxWidth: '800px', padding: '0 1rem'}}>
                <h1 className="page-title text-blue-500">Turbulence</h1>
                <Stories initialData={initialStories} initialError={error} />
            </div>
        </>
    );
};

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
    try {
        const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
        
        if (!backendUrl) {
            return {
                props: {
                    error: 'Backend URL not configured'
                },
                revalidate: 60 // Try again in 1 minute
            };
        }

        // Fetch initial stories for SSG
        const response = await fetch(`${backendUrl}/stories?limit=5&offset=0&include_drafts=false`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch stories: ${response.status}`);
        }

        const data: PaginatedResponse<Story> = await response.json();

        return {
            props: {
                initialStories: data
            },
            revalidate: 300 // Revalidate every 5 minutes
        };
    } catch (error) {
        console.error('Error in getStaticProps:', error);
        
        return {
            props: {
                error: error instanceof Error ? error.message : 'Failed to load stories'
            },
            revalidate: 60 // Try again in 1 minute
        };
    }
};

export default Home;
