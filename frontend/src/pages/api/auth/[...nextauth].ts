import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export default NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            console.log("JWT Callback - Account:", account);
            if (account) {
                token.accessToken = account.access_token;
            }
            console.log("JWT Callback - Token:", token);
            return token;
        },
        async session({ session, token }) {
            console.log("Session Callback - Token:", token);
            session.accessToken = token.accessToken as string;
            console.log("Session Callback - Session:", session);
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
});