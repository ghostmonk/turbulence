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
    async headers() {
        return [
            {
                source: "/api/:path*",
                headers: [
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
        ];
    },
};

export default nextConfig;
