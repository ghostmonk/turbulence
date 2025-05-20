import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const { id } = req.query;

    try {
        // Check authentication
        const token = await getToken({ req });
        
        if (!token?.accessToken) {
            return res.status(401).json({ 
                detail: 'Authentication required', 
                error: 'Not authenticated' 
            });
        }

        // Determine API endpoint and method
        const url = `${API_BASE_URL}/stories/${id}`;
        const method = req.method || 'GET';
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.accessToken}`,
        };
        
        // Make request to backend API
        const response = await fetch(url, {
            method,
            headers,
            ...(method !== 'GET' && { body: JSON.stringify(req.body) }),
        });

        // Handle error responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            
            console.error(`Error ${method} story:`, {
                status: response.status,
                data: errorData
            });
            
            return res.status(response.status).json({
                detail: errorData.detail || `Error: ${response.statusText}`,
                status: response.status
            });
        }

        // Return successful response
        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error(`Error in /api/stories/${id}:`, error);
        
        return res.status(500).json({ 
            detail: error instanceof Error ? error.message : 'Internal server error',
            method: req.method,
            id: id
        });
    }
} 