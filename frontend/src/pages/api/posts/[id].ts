import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ghostmonk.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    const { id } = req.query;

    if (!session?.accessToken) {
        return res.status(401).json({ detail: 'Unauthorized' });
    }

    try {
        let response;
        switch (req.method) {
            case 'GET':
                response = await fetch(`${API_BASE_URL}/data/${id}`, {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });
                break;
            case 'PUT':
                response = await fetch(`${API_BASE_URL}/data/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                    body: JSON.stringify(req.body),
                });
                break;
            case 'DELETE':
                response = await fetch(`${API_BASE_URL}/data/${id}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });
                break;
            default:
                return res.status(405).json({ detail: 'Method not allowed' });
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `Failed to ${req.method.toLowerCase()} post`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error(`Error ${req.method} post:`, error);
        res.status(500).json({ 
            detail: error instanceof Error ? error.message : 'Internal server error',
            method: req.method,
            id: id
        });
    }
} 