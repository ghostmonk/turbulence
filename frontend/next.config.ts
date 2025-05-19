import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    typescript: {
        // Be strict about type checking
        ignoreBuildErrors: false,
    },
    eslint: {
        // Run ESLint as part of the build
        ignoreDuringBuilds: false,
    },
    experimental: {
        // Enable the latest features
        serverActions: {
            bodySizeLimit: '4mb'
        },
    },
    // Add rewrites to proxy static uploads to backend API based on explicit env var
    async rewrites() {
        // Check if proxy is explicitly disabled with "false"
        const enableProxy = process.env.ENABLE_PROXY_UPLOADS !== 'false';
        
        if (!enableProxy) {
            console.log('Proxy disabled: Image requests will go directly to backend');
            return [];
        }
        
        console.log('Proxy enabled: Proxying static uploads through Next.js');
        return [
            {
                source: '/static/uploads/:path*',
                destination: `${process.env.BACKEND_URL}/static/uploads/:path*`,
            },
        ];
    },
    async headers() {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        return [
            {
                source: "/api/:path*",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: `
                            default-src 'self';
                            script-src 'self' 'unsafe-inline' 'unsafe-eval' ${apiUrl};
                            style-src 'self' 'unsafe-inline';
                            img-src 'self' data: blob: ${apiUrl} https://storage.googleapis.com;
                            connect-src 'self' ${apiUrl};
                            font-src 'self';
                            frame-src 'self';
                        `.replace(/\n/g, '').trim(),
                    },
                    {
                        key: "Access-Control-Allow-Origin",
                        value: "https://ghostmonk.com",
                    },
                    {
                        key: "Access-Control-Allow-Credentials",
                        value: "true",
                    },
                    {
                        key: "Access-Control-Allow-Methods",
                        value: "GET, POST, PUT, DELETE, OPTIONS",
                    },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "Content-Type, Authorization",
                    },
                ],
            },
            {
                // Add CSP headers for all pages, not just API routes
                source: "/(.*)",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: `
                            default-src 'self';
                            script-src 'self' 'unsafe-inline' 'unsafe-eval' ${apiUrl};
                            style-src 'self' 'unsafe-inline';
                            img-src 'self' data: blob: ${apiUrl} https://storage.googleapis.com;
                            connect-src 'self' ${apiUrl};
                            font-src 'self';
                            frame-src 'self';
                        `.replace(/\n/g, '').trim(),
                    }
                ]
            }
        ];
    },
};

export default nextConfig;
