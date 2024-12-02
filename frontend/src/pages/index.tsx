import React from 'react';
import Layout from '../components/Layout';
import Head from 'next/head';
import Posts from "@/components/Posts";

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
                    <Posts url="https://api.ghostmonk.com/data" />
                </div>
            </Layout>
        </>
    );
};

export default Home;
