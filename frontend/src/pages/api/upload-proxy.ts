import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the backend URL
    const backendUrl = process.env.BACKEND_URL;
    
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
    console.error('Upload proxy error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 