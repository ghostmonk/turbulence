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

            <div style={{margin: '0 auto', maxWidth: '800px', padding: '0 1rem'}}>
                <h1 className="page-title text-blue-500">Turbulence</h1>
                <Stories />
            </div>
        </>
    );
};

export default Home;
