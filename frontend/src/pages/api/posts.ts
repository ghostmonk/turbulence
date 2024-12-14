import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log("Request headers:", req.headers);
    console.log("Request cookies:", req.cookies);
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }

    const session = await getSession({ req });
    console.log("Server-side session:", session);

    if (!session || !session.accessToken) {
        console.error("Session or accessToken is missing");
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        console.log("Access Token:", session.accessToken);
        const { title, content } = req.body;
        const response = await fetch("https://api.ghostmonk.com/data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.accessToken}`,
            },
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
}
