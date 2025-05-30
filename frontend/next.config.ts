import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '4mb'
        },
    },
    // Add rewrites to proxy static uploads to backend API based on explicit env var
    async rewrites() {
        // For Docker: backend:5001, for local dev: localhost:5001
        // BACKEND_URL should be specifically set for Docker environment
        let backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.ghostmonk.com';
        
        // Log the backend URL for debugging
        console.log('Backend URL for uploads proxy:', backendUrl);
        
        return [
            {
                source: '/uploads/:path*',
                destination: `${backendUrl}/uploads/:path*`,
            },
        ];
    },
    async headers() {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const csp_value = `
                            default-src 'self';
                            script-src 'self' 'unsafe-inline' 'unsafe-eval' ${apiUrl};
                            style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                            img-src 'self' data: blob: ${apiUrl} https://storage.googleapis.com https://authjs.dev;
                            connect-src 'self' ${apiUrl} https://accounts.google.com https://*.googleapis.com https://www.google.com;
                            font-src 'self' https://fonts.gstatic.com;
                            frame-src 'self' https://accounts.google.com https://*.google.com;
                        `.replace(/\n/g, '').trim();
        return [
            {
                source: "/api/:path*",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: csp_value,
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
                source: "/(.*)",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: csp_value,
                    }
                ]
            }
        ];
    },
};

export default nextConfig;
