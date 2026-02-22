"use client";

import { useState } from "react";

export default function WaitlistForm() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || loading) return;
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Something went wrong. Try again.");
                return;
            }
            setSubmitted(true);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="mt-8 flex items-start gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/6 px-6 py-5">
                <div className="mt-0.5 flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/15">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
                <div>
                    <div className="text-sm font-semibold text-emerald-300">You're on the waitlist.</div>
                    <div className="mt-1 text-xs text-emerald-400/60">
                        Check your inbox — a confirmation is on its way from Aurion.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
                type="email"
                required
                value={email}
                disabled={loading}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                placeholder="your@email.com"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all disabled:opacity-60"
            />
            <button
                type="submit"
                disabled={loading}
                className="flex-shrink-0 relative rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black hover:bg-white/90 transition-all disabled:opacity-70 overflow-hidden"
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Sending…
                    </span>
                ) : "Request Invite"}
            </button>

            {error && (
                <p className="sm:col-span-2 text-xs text-red-400 mt-1">{error}</p>
            )}
        </form>
    );
}
