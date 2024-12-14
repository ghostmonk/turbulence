import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const session = await getSession({ req });

        if (!session) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!session.accessToken) {
            return res.status(500).json({ message: "Access token is missing" });
        }

        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required." });
        }

        try {
            const response = await fetch("https://api.ghostmonk.com/data", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                credentials: "include",
                body: JSON.stringify({ title, content }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return res.status(response.status).json({ message: errorData.message || "Error forwarding data" });
            }

            const responseData = await response.json();
            return res.status(200).json(responseData);
        } catch (error) {
            console.error("Error forwarding request:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    } else {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
}
