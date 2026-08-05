"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
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

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-[#0A2342]">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-600">Use your editorial/admin account credentials.</p>

        <label className="mt-5 block text-sm font-semibold text-slate-700">Email</label>
        <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label className="mt-4 block text-sm font-semibold text-slate-700">Password</label>
        <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button disabled={loading} className="mt-5 w-full rounded-md bg-[#0A2342] px-4 py-2 font-semibold text-white disabled:opacity-60" type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
