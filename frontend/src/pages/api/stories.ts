import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ghostmonk.com';
    
    try {
        // Check authentication for non-GET requests
        if (req.method !== 'GET') {
            const token = await getToken({ req });
            
            if (!token || !token.accessToken) {
                return res.status(401).json({ 
                    detail: 'Not authenticated',
                    error: 'Authentication required'
                });
            }
        }

        // Prepare API call to backend
        const apiUrl = `${API_BASE_URL}/stories`;
        console.log(`Making ${req.method} request to:`, apiUrl);
        
        const token = await getToken({ req });
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        
        // Add authorization header for non-GET requests
        if (req.method !== 'GET' && token?.accessToken) {
            headers.Authorization = `Bearer ${token.accessToken}`;
        }
        
        // Make the request to the backend
        const response = await fetch(apiUrl, {
            method: req.method,
            headers,
            ...(req.method !== 'GET' && { body: JSON.stringify(req.body) }),
        });

        // Handle error responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            console.error('Backend error:', {
                status: response.status,
                statusText: response.statusText,
                errorData
            });
            
            // Return appropriate status code and error message
            return res.status(response.status).json({
                detail: errorData.detail || `Error: ${response.statusText}`,
                status: response.status
            });
        }

        // Return successful response
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