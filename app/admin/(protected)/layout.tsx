import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Navbar from "../../components/Navbar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/admin/login"); // Not logged in
    }

    // Verify Admin Role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "admin") {
        redirect("/"); // Not authorized
    }

    return (
        <div className="min-h-screen bg-[#0e1017] text-white">
            {/* ── NAVBAR ──────────────────────────────────────────────────── */}
            <div className="sticky top-0 z-40 border-b border-white/[0.05] bg-[#05060a]/85 backdrop-blur-xl">
                <Navbar />
            </div>

            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-8 border-b border-white/10 pb-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 mb-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        <span className="text-[10px] text-indigo-300 tracking-[0.2em] uppercase font-bold">
                            Level 5 Clearance
                        </span>
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight text-white">
                        Command Center
                    </h1>
                    <p className="mt-2 text-sm text-white/40">
                        Skillion Administration & Network Operations
                    </p>
                </div>

                {children}
            </div>
        </div>
    );
}
