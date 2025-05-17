import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { Post, ApiError, CreatePostRequest } from "@/types/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Post | ApiError>) {
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ detail: `Method ${req.method} not allowed` });
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.accessToken) {
        return res.status(401).json({ detail: "Unauthorized" });
    }

    try {
        const { title, content, is_published } = req.body as CreatePostRequest;
        
        // Validate required fields
        if (!title || !content || is_published === undefined) {
            return res.status(400).json({ 
                detail: "Missing required fields. 'title', 'content', and 'is_published' are required." 
            });
        }
        
        const response = await fetch("https://api.ghostmonk.com/data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify({ title, content, is_published }),
        });

        if (!response.ok) {
            const errorData = await response.json() as ApiError;
            return res.status(response.status).json({ 
                detail: errorData.detail || "Error forwarding data" 
            });
        }

        const responseData = await response.json() as Post;
        return res.status(201).json(responseData);
    } catch (error) {
        return res.status(500).json({ detail: "Internal server error" });
    }
}
