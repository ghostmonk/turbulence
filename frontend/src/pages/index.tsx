import React from 'react';
import Head from 'next/head';
import Posts from '@/components/Posts';

const Home: React.FC = () => {
    return (
        <>
            <Head>
                <title>Ghostmonk: Turbulence</title>
                <meta name="description" content="Posts and Such - Ghostmonk: Turbulence!"/>
                <meta name="keywords" content="Ghostmonk, Turbulence, News, Updates"/>
            </Head>

            <div style={{margin: '0 auto', maxWidth: '800px'}}>
                <h1 className="text-4xl font-bold text-blue-500 mb-12 text-center">Ghostmonk: Turbulence</h1>
                <Posts />
            </div>
        </>
    );
};

export default Home;
