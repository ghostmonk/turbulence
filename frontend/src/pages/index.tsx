import React from 'react';
import Head from 'next/head';
import Posts from "@/components/Posts";

const Home: React.FC = () => {
    return (
        <>
            <Head>
                <title>Ghostmonk: Turbulence</title>
                <meta name="description" content="Posts and Such - Ghostmonk: Turbulence!"/>
                <meta name="keywords" content="Ghostmonk, Turbulence, News, Updates"/>
            </Head>

            <div className="text-center">
                <h1 className="text-4xl font-bold text-blue-600">Ghostmonk: Turbulence</h1>
                <Posts url="https://api.ghostmonk.com/data" />
            </div>
        </>
    );
};

export default Home;
