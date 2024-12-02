import React from 'react';
import Layout from '../components/Layout';
import Head from 'next/head';

const Home: React.FC = () => {
    return (
        <>
            {/* Page-specific meta tags */}
            <Head>
                <title>Ghostmonk: Turbulence</title>
                <meta name="description" content="Explore what's going on at Ghostmonk: Turbulence!"/>
                <meta name="keywords" content="Ghostmonk, Turbulence, News, Updates"/>
                <meta name="author" content="Ghostmonk Team"/>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes"
                />
                <link rel="canonical" href="https://ghostmonk.com/"/>
            </Head>

            {/* Page Layout */}
            <Layout>
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-blue-600">Ghostmonk: Turbulence</h1>
                    {/* Escape the single quote */}
                    <p className="mt-4 text-lg text-gray-700">What&apos;s going on?</p>
                </div>
            </Layout>
        </>
    );
};

export default Home;
