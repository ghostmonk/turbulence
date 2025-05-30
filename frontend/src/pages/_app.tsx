import '../styles/globals.css';
import { AppProps } from 'next/app';
import { SessionProvider } from "next-auth/react";
import Layout from "@/components/Layout";
import React, { useEffect } from "react";
import Head from "next/head";
import { configureDOMPurify } from '@/utils/sanitizer';

function MyApp({ Component, pageProps }: AppProps) {
    useEffect(() => {
        configureDOMPurify();
    }, []);

    return (
        <SessionProvider session={pageProps.session}>
            <Head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes"
                />
                <meta name="author" content="Ghostmonk"/>
                <link rel="canonical" href="https://ghostmonk.com/"/>
                <style>{`
                    .grid { display: grid !important; }
                    .border-b { border-bottom-width: 1px !important; }
                    .border-gray-700 { border-color: rgb(55, 65, 81) !important; }
                    .leading-relaxed { line-height: 1.625 !important; }
                    .pb-10 { padding-bottom: 2.5rem !important; }
                `}</style>
            </Head>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </SessionProvider>
    );
};

export default MyApp;
