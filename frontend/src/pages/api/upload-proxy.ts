import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { apiLogger } from '@/utils/logger';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  apiLogger.logApiRequest(req, res);

  if (req.method !== 'POST') {
    const error = new Error('Method not allowed');
    apiLogger.error('Invalid method', error, { method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      const error = new Error('Unauthorized');
      apiLogger.error('Authentication failed', error);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Use BACKEND_URL for server-to-server communication (in Docker)
    // Fall back to NEXT_PUBLIC_API_URL if BACKEND_URL is not available
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    
    if (!backendUrl) {
      throw new Error('Backend URL not configured. Set BACKEND_URL or NEXT_PUBLIC_API_URL');
    }
    
    apiLogger.info('Proxying upload request', { backendUrl });
    
    // Stream the request to the backend
    const response = await fetch(`${backendUrl}/uploads`, {
      method: 'POST',
      headers: {
        ...req.headers as any,
        'Authorization': `Bearer ${session.accessToken}`,
      },
      // @ts-ignore - Stream the body
      body: req,
      // Add the duplex option which is required when streaming a request body
      duplex: 'half',
    });

    // Stream the response back to the client
    const data = await response.json();
    
    // Return the response from the backend
    return res.status(response.status).json(data);
  } catch (error: any) {
    const e = error instanceof Error ? error : new Error(String(error));
    apiLogger.error('Upload proxy error', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
