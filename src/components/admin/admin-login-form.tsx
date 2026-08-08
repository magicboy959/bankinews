"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/layout/brand-mark";
import { getAdminLandingPath } from "@/lib/auth/permissions";
import type { SessionUser } from "@/types";

type LoginResponse = {
  data?: {
    user?: SessionUser;
  };
};

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error?.message ?? "Login failed");
      return;
    }

    const data = (await response.json().catch(() => ({}))) as LoginResponse;
    const destination = data.data?.user ? getAdminLandingPath(data.data.user.role) : "/admin";

    router.push(destination);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.06)]">
        <BrandMark locale="ar" size="admin" className="mb-5" />
        <h1 className="text-2xl font-black text-[var(--foreground)]">Admin Login</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Use your author, editor, or admin account credentials.</p>

        <label className="mt-5 block text-sm font-semibold text-[var(--text-muted)]">Email</label>
        <input
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="mt-4 block text-sm font-semibold text-[var(--text-muted)]">Password</label>
        <input
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="mt-5 w-full rounded-md bg-[#0A2342] px-4 py-2 font-semibold text-white disabled:opacity-60"
          type="submit"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
