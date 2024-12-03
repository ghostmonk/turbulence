import { Html, Head, Main, NextScript } from "next/document";

const isDevelopment = process.env.NODE_ENV === "development";

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                {/* Meta tags */}
                <meta charSet="utf-8" />
                <meta name="referrer" content="strict-origin-when-cross-origin" />
                <meta name="robots" content="index, follow" />
                <meta name="theme-color" content="#000000" />
                <link rel="icon" href="/favicon.ico" />

                {/* Security headers as meta tags */}
                <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
                <meta
                    httpEquiv="Content-Security-Policy"
                    content={`
                        default-src 'self';
                        connect-src 'self' https://api.ghostmonk.com;
                        script-src 'self' ${isDevelopment ? "'unsafe-eval'" : ""};
                        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                        img-src 'self' data:;
                        font-src 'self' https://fonts.gstatic.com;
                    `}
                />
                <meta name="referrer-policy" content="strict-origin-when-cross-origin"/>
            </Head>
            <body>
            <Main/>
            <NextScript/>
            </body>
        </Html>
    );
}
