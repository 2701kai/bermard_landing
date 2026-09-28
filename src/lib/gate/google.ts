// Google Identity Services credential (an ID token) verified against Google's JWKS.
// Ported from BEVMAQ_OS lib/auth.ts verifyGoogleIdToken; the team decision lives in access.ts.
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { GoogleClaims } from "./access";

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function verifyGoogleIdToken(credential: string): Promise<GoogleClaims> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");
  const { payload } = await jwtVerify(credential, GOOGLE_JWKS, {
    // Google issues both spellings of its issuer.
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId,
  });
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  return {
    email,
    email_verified: payload.email_verified === true,
    hd: typeof payload.hd === "string" ? payload.hd : null,
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : (email.split("@")[0] ?? ""),
  };
}
