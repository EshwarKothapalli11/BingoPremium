import { NextResponse, type NextRequest } from "next/server";

// Firebase Auth is handled client-side, so the middleware simply
// passes through all requests without modifying them.
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
