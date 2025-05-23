import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { apiLogger } from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const API_BASE_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    
    if (!API_BASE_URL) {
        const error = new Error('Backend URL not configured');
        apiLogger.error('Configuration error', error, { 
            detail: 'Set BACKEND_URL or NEXT_PUBLIC_API_URL'
        });
        return res.status(500).json({ 
            detail: 'Backend URL not configured. Set BACKEND_URL or NEXT_PUBLIC_API_URL',
            error: 'Configuration error'
        });
    }
    
    // Start logging the request
    apiLogger.logApiRequest(req, res);
    
    try {
        if (req.method !== 'GET') {
            const token = await getToken({ req });
            
            if (!token || !token.accessToken) {
                const error = new Error('Authentication required');
                apiLogger.error('Authentication failed', error, {
                    path: req.url,
                    method: req.method
                });
                return res.status(401).json({ 
                    detail: 'Not authenticated',
                    error: 'Authentication required'
                });
            }
        }

        let apiUrl = `${API_BASE_URL}/stories`;
        
        const token = await getToken({ req });
        
        if (req.method === 'GET' && req.query) {
            const params = new URLSearchParams();
            
            if (req.query.limit) {
                params.append('limit', req.query.limit.toString());
            }
            
            if (req.query.offset) {
                params.append('offset', req.query.offset.toString());
            }
            
            if (token?.accessToken) {
                params.append('include_drafts', 'true');
            }
            
            if (params.toString()) {
                apiUrl += `?${params.toString()}`;
            }
        }

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        
        if ((req.method !== 'GET' || req.query.include_drafts) && token?.accessToken) {
            headers.Authorization = `Bearer ${token.accessToken}`;
        }
        
        const requestBody = req.method !== 'GET' ? req.body : undefined;
        console.log(`Backend request: ${req.method} ${apiUrl}`, {
            method: req.method,
            hasToken: !!token?.accessToken,
            bodyPreview: requestBody ? JSON.stringify(requestBody).substring(0, 150) + '...' : undefined
        });
        
        const response = await fetch(apiUrl, {
            method: req.method,
            headers,
            ...(req.method !== 'GET' && { body: JSON.stringify(req.body) }),
        });

        if (!response.ok) {
            let errorData: any;
            let responseText: string | undefined;
            
            try {
                errorData = await response.json();
            } catch (parseError) {
                try {
                    responseText = await response.text();
                    errorData = { detail: 'Non-JSON error response', rawResponse: responseText };
                } catch (textError) {
                    errorData = { detail: 'Unable to read error response' };
                }
            }
            
            console.error('Backend API error:', {
                status: response.status,
                statusText: response.statusText,
                url: apiUrl,
                errorData,
                responseText: responseText?.substring(0, 500),
                headers: Object.fromEntries(response.headers.entries())
            });
            
            return res.status(response.status).json({
                detail: errorData.detail || `Error: ${response.statusText}`,
                status: response.status,
                error: errorData,
                url: apiUrl
            });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Fatal error in /api/stories:', error);
        
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
        
        return res.status(500).json({ 
            detail: error instanceof Error ? error.message : 'Internal server error',
            error: 'Failed to process request',
            stack: error instanceof Error ? error.stack : undefined
        });
    }
}
