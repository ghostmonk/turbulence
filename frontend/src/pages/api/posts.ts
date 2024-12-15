import { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie"
import { getToken } from "next-auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }

    const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
    console.log("Parsed Cookies:", cookies);

    const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET});
    console.log("Decoded Token:", token);

    if (!token) {
        console.error("Session validation failed.");
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const { title, content } = req.body;
        const response = await fetch("https://api.ghostmonk.com/data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token.accessToken}`,
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
