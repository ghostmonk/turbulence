import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const session = await getSession({ req });

        if (!session) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required." });
        }

        try {
            // Send data to another endpoint
            const response = await fetch("https://api.example.com/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`, // Include authorization if needed
                },
                body: JSON.stringify({ title, content }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return res.status(response.status).json({ message: errorData.message || "Error forwarding data" });
            }

            const responseData = await response.json();
            return res.status(200).json(responseData); // Forward the response from the endpoint
        } catch (error) {
            console.error("Error forwarding request:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    } else {
        res.setHeader("Allow", ["POST"]);
        res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
}
