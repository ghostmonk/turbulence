import { jwtDecode } from "jwt-decode";

interface DecodedToken {
    exp: number;
}

export const isTokenExpired = (token: string | undefined): boolean => {
    if (!token) {
        console.error("No token provided.");
        return true;
    }

    try {
        const decoded: DecodedToken = jwtDecode<DecodedToken>(token);
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    } catch (error) {
        console.error("Failed to decode token:", error);
        return true;
    }
};