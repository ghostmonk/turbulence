import { Html, Head, Main, NextScript } from "next/document";

const isUnsafeEval = process.env.UNSAFE_EVAL === "true";

export default function Document() {
    return (
        <Html lang="en" className="dark" data-theme="dark" style={{backgroundColor: '#0f172a'}}>
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
                        connect-src 'self' http://localhost:5001 https://api.ghostmonk.com https://accounts.google.com https://*.googleapis.com https://www.google.com;
                        script-src 'self' ${isUnsafeEval ? "'unsafe-eval'" : ""};
                        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                        font-src 'self' https://fonts.gstatic.com;
                        img-src 'self' data: blob:;
                        frame-src 'self' https://accounts.google.com https://*.google.com;
                    `}
                />
                <meta name="referrer-policy" content="strict-origin-when-cross-origin"/>
            </Head>
            <body style={{backgroundColor: '#0f172a'}} className="text-foreground">
            <Main/>
            <NextScript/>
            </body>
        </Html>
    );
}
