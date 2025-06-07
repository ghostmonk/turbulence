import React from 'react';
import Head from 'next/head';
import Stories from '@/components/Stories';

const Home: React.FC = () => {
    return (
        <>
            <Head>
                <title>Turbulence</title>
                <meta name="description" content="Stories and Such - Ghostmonk: Turbulence!"/>
                <meta name="keywords" content="Ghostmonk, Turbulence, News, Updates"/>
            </Head>

            <div style={{margin: '0 auto', maxWidth: '800px'}}>
                <h1 className="text-4xl font-bold text-blue-500 mb-12 text-center">Ghostmonk: Turbulence</h1>
                <Stories />
            </div>
        </>
    );
};

export default Home;
