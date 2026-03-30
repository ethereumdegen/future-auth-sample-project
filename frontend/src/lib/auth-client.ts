/**
 * FutureAuth client for React frontends.
 *
 * IMPORTANT: Do NOT use better-auth or other third-party auth client libraries.
 * FutureAuth has its own route structure — the paths don't match.
 *
 * SDK auth routes (full paths, provided by auth_router()):
 *   POST /api/auth/send-otp     — body: { email } or { phone }
 *   POST /api/auth/verify-otp   — body: { email, code } or { phone, code }
 *   GET  /api/auth/session      — reads futureauth_session cookie
 *   POST /api/auth/sign-out     — reads futureauth_session cookie
 */

import { useState, useEffect } from "react";

const BASE_URL = window.location.origin;

export const authClient = {
  emailOtp: {
    async sendVerificationOtp({ email }: { email: string }) {
      const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send OTP");
      }
      return res.json();
    },

    async verifyEmail({ email, otp }: { email: string; otp: string }) {
      const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { error: { message: data.error || "Verification failed" } };
      }
      return { data, error: null };
    },
  },
};

export async function signOut() {
  await fetch(`${BASE_URL}/api/auth/sign-out`, {
    method: "POST",
    credentials: "include",
  });
  window.location.href = "/";
}

/**
 * React hook — checks auth session on mount.
 * Returns { data, isPending } where data is the session payload or null.
 */
export function useSession() {
  const [data, setData] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/api/auth/session`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((session) => {
        setData(session);
        setIsPending(false);
      })
      .catch(() => {
        setData(null);
        setIsPending(false);
      });
  }, []);

  return { data, isPending };
}
