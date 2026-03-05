"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Secure authorization check. Re-verifies on every server action.
 */
async function requireAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized: No active session");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "admin") {
        throw new Error("Forbidden: Requires admin clearance");
    }
    return { supabase, userId: user.id };
}

// ─── Waitlist Actions ──────────────────────────────────────────────────────────

export async function updateWaitlistStatus(id: string, newStatus: string) {
    try {
        const { supabase } = await requireAdmin();
        const { error } = await supabase
            .from("waitlist")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", id);
        if (error) throw error;
        revalidatePath("/admin");
    } catch (error) {
        console.error("Failed to update status:", error);
    }
}

export async function bulkUpdateWaitlistStatus(ids: string[], newStatus: string) {
    try {
        const { supabase } = await requireAdmin();
        const { error } = await supabase
            .from("waitlist")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .in("id", ids);
        if (error) throw error;
        revalidatePath("/admin");
        return { success: true, count: ids.length };
    } catch (error) {
        console.error("Failed to bulk update:", error);
        return { success: false, error: String(error) };
    }
}

// ─── Profile / User Actions ───────────────────────────────────────────────────

export async function toggleUserActivation(id: string, currentActivation: boolean) {
    try {
        const { supabase } = await requireAdmin();
        const { error } = await supabase
            .from("profiles")
            .update({ is_activated: !currentActivation })
            .eq("id", id);
        if (error) throw error;
        revalidatePath("/admin");
    } catch (error) {
        console.error("Failed to toggle activation:", error);
    }
}

// ─── Network Stats (anonymous aggregates) ────────────────────────────────────

export async function getNetworkStats() {
    try {
        const { supabase } = await requireAdmin();

        const [
            { count: totalUsers },
            { count: activeUsers },
            { count: pendingWaitlist },
            { data: scores },
            { count: totalTrades },
        ] = await Promise.all([
            supabase.from("profiles").select("*", { count: "exact", head: true }),
            supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_activated", true),
            supabase.from("waitlist").select("*", { count: "exact", head: true }).eq("status", "pending"),
            supabase.from("sdi_scores").select("sdi_score, tier"),
            supabase.from("mt4_trades").select("*", { count: "exact", head: true }),
        ]);

        const avgScore = scores && scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + (b.sdi_score || 0), 0) / scores.length)
            : 0;

        const tierDist: Record<string, number> = {};
        scores?.forEach(s => {
            tierDist[s.tier] = (tierDist[s.tier] || 0) + 1;
        });

        return {
            totalUsers: totalUsers || 0,
            activeUsers: activeUsers || 0,
            pendingWaitlist: pendingWaitlist || 0,
            avgNetworkScore: avgScore,
            totalTrades: totalTrades || 0,
            totalAnalyzed: scores?.length || 0,
            tierDistribution: tierDist,
        };
    } catch (error) {
        console.error("Failed to get network stats:", error);
        return null;
    }
}

// ─── Admin Login ──────────────────────────────────────────────────────────────

export async function loginAdmin(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    if (!email || !password) return { error: "Email and password are required" };

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { success: true };
}
