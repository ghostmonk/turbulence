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
            </Head>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </SessionProvider>
    );
};

export default MyApp;
