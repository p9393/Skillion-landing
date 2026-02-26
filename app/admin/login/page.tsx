"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin, bypassLocalAdmin } from "../actions";

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);

        const result = await loginAdmin(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push("/admin");
            router.refresh();
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#05060a] p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0e1017] p-8 shadow-2xl">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <span className="text-xl font-bold text-indigo-400">⌘</span>
                    </div>
                    <h1 className="text-xl font-semibold text-white tracking-tight">Command Center</h1>
                    <p className="mt-2 text-xs text-white/40 uppercase tracking-widest">Authorized Personnel Only</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-white/60">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-[#05060a] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                            placeholder="admin@skillion.finance"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-white/60">Passkey / Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-[#05060a] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="rounded-md bg-rose-500/10 p-3 text-sm text-rose-400 border border-rose-500/20">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Authenticating..." : "Establish Connection"}
                    </button>

                    {process.env.NODE_ENV === "development" && (
                        <button
                            type="button"
                            disabled={loading}
                            onClick={async () => {
                                setLoading(true);
                                setError("");
                                const res = await bypassLocalAdmin();
                                if (res?.error) {
                                    setError(res.error);
                                    setLoading(false);
                                } else {
                                    router.push("/admin");
                                    router.refresh();
                                }
                            }}
                            className="mt-3 flex w-full items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 active:bg-indigo-500/30 disabled:opacity-50 transition-colors"
                        >
                            [DEV] Override Login (aurion.test)
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
