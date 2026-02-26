"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createJsClient, User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

/**
 * Secure authorization check. Re-verifies on every server action.
 */
async function requireAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized: No active session");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "admin") {
        throw new Error("Forbidden: Requires admin clearance");
    }

    return supabase;
}

export async function updateWaitlistStatus(id: string, newStatus: string) {
    try {
        const supabase = await requireAdmin();
        const { error } = await supabase
            .from("waitlist")
            .update({ status: newStatus })
            .eq("id", id);

        if (error) throw error;
        revalidatePath("/admin");
    } catch (error) {
        console.error("Failed to update status:", error);
    }
}

export async function toggleUserActivation(id: string, currentActivation: boolean) {
    try {
        const supabase = await requireAdmin();
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

export async function loginAdmin(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    // Auth successful, layout.tsx will handle role verification upon redirect
    return { success: true };
}

export async function bypassLocalAdmin() {
    // Only allow in development
    if (process.env.NODE_ENV !== "development") {
        return { error: "Bypass only available in local development" };
    }

    const supabase = await createClient();

    // We can use signInWithOtp for magic link, or since we are server side with the anon key, 
    // we can't easily force an auth session without a password or OTP link.
    // The most reliable local bypass when passwords are lost is to sign in via a magic link (OTP) 
    // which prints into the console, OR update the password via the service role.

    // We'll update the password for aurion.test@skillion.finance to 'skillion123' using the admin API
    const authAdmin = createJsClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: users, error: fetchErr } = await authAdmin.auth.admin.listUsers();
    if (fetchErr) return { error: fetchErr.message };

    const testUser = users.users.find((u: User) => u.email === "aurion.test@skillion.finance");
    if (!testUser) return { error: "Test user aurion.test@skillion.finance not found" };

    const { error: resetErr } = await authAdmin.auth.admin.updateUserById(testUser.id, {
        password: "skillionAdmin123!"
    });

    if (resetErr) return { error: resetErr.message };

    // Now sign in with the known overridden password
    const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: "aurion.test@skillion.finance",
        password: "skillionAdmin123!",
    });

    if (signInErr) return { error: signInErr.message };

    return { success: true };
}
