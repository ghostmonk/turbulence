import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const API_BASE_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    
    if (!API_BASE_URL) {
        return res.status(500).json({ 
            detail: 'Backend URL not configured. Set BACKEND_URL or NEXT_PUBLIC_API_URL',
            error: 'Configuration error'
        });
    }
    
    try {
        if (req.method !== 'GET') {
            const token = await getToken({ req });
            
            if (!token || !token.accessToken) {
                return res.status(401).json({ 
                    detail: 'Not authenticated',
                    error: 'Authentication required'
                });
            }
        }

        const apiUrl = `${API_BASE_URL}/stories`;
        
        const token = await getToken({ req });
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        
        if (req.method !== 'GET' && token?.accessToken) {
            headers.Authorization = `Bearer ${token.accessToken}`;
        }
        
        const response = await fetch(apiUrl, {
            method: req.method,
            headers,
            ...(req.method !== 'GET' && { body: JSON.stringify(req.body) }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            
            return res.status(response.status).json({
                detail: errorData.detail || `Error: ${response.statusText}`,
                status: response.status
            });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error in /api/stories:', error);
        return res.status(500).json({ 
            detail: error instanceof Error ? error.message : 'Internal server error',
            error: 'Failed to process request'
        });
    }
} 