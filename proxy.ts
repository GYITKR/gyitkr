import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  // AUTH_SECRET 미설정이면 fail-closed(빈 키 HMAC 위조 방지) — 검증 자체를 건너뛰고 차단
  if (secret && (await verifyToken(token, secret))) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  return NextResponse.redirect(url);
}

// 로그인 페이지는 제외하고 /admin 하위만 보호
export const config = { matcher: ["/admin", "/admin/((?!login).*)"] };
