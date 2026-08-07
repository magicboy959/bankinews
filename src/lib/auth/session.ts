import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "@/types";

const COOKIE_NAME = "bankinews_session";
const encoder = new TextEncoder();

function sessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || process.env.JWT_SECRET?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "bankinews-session-secret-v1";

  if (!secret) {
    throw new Error("No session secret is configured.");
  }

  return encoder.encode(secret);
}

type SessionToken = {
  user: SessionUser;
};

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ user } satisfies SessionToken)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(sessionSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, sessionSecret());
    return (verified.payload as SessionToken).user;
  } catch {
    return null;
  }
}
