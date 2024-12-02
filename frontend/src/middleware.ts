import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_req: NextRequest) {
    const response = NextResponse.next();
    response.headers.set("X-Frame-Options", "DENY");
    return response;
}