import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Check authentication for non-GET requests
        if (req.method !== 'GET') {
            const token = await getToken({ req });
            
            console.log("Token from NextAuth:", {
                hasToken: !!token,
                accessToken: token?.accessToken ? "exists" : "missing",
            });
            
            if (!token || !token.accessToken) {
                return res.status(401).json({ 
                    error: 'Not authenticated',
                    details: 'No access token found in session'
                });
    }
        }

        // Prepare API call to backend
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/data`;
        console.log(`Making ${req.method} request to:`, apiUrl);
        console.log('Request body:', req.body);
        
        const token = await getToken({ req });
        const accessToken = token?.accessToken as string;
        
        const response = await fetch(apiUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...(req.method !== 'GET' && accessToken && {
                    Authorization: `Bearer ${accessToken}`,
                }),
            },
            ...(req.method !== 'GET' && { body: JSON.stringify(req.body) }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error('Backend error:', {
                status: response.status,
                statusText: response.statusText,
                errorData
            });
            throw new Error(`Backend error: ${response.status} ${response.statusText}${errorData ? ` - ${JSON.stringify(errorData)}` : ''}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error in /api/posts:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch posts',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
