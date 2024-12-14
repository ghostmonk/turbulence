import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    async headers() {
        return [
            {
                source: "/api/:path*", // Apply headers to all API routes
                headers: [
                    {
                        key: "Access-Control-Allow-Origin",
                        value: "https://ghostmonk.com", // Your production domain
                    },
                    {
                        key: "Access-Control-Allow-Credentials",
                        value: "true", // Allow cookies
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
