import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    
    if (!backendUrl) {
      return res.status(500).json({ error: 'Backend URL not configured' });
    }

    const response = await fetch(`${backendUrl}/warmup`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Warmup proxy error:', error);
    return res.status(500).json({ 
      error: 'Warmup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
