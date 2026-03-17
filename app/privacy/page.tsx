import Link from "next/link";

const sections = [
    {
        title: "Information We Collect",
        body: "We collect information you provide directly, including your email address when you join our waitlist. We also collect usage data through standard web analytics (page views, device type, browser) that does not identify you personally.",
    },
    {
        title: "How We Use Your Information",
        body: "Your email is used exclusively to communicate about Skillion Finance access, product updates, and platform invitations. We do not sell, rent, or share your personal data with third parties for marketing purposes.",
    },
    {
        title: "Data Storage & Security",
        body: "Your data is stored on secure servers. We use industry-standard encryption and access controls. We retain your email for the duration of the waitlist program or until you request deletion.",
    },
    {
        title: "Your Rights",
        body: "You may request access to, correction of, or deletion of your personal data at any time by contacting us at contact@skillion.finance. We will respond within 30 days.",
    },
    {
        title: "Cookies",
        body: "Skillion Finance uses only essential session cookies necessary for basic functionality. No tracking or advertising cookies are used. See our Cookie Policy for full details.",
    },
    {
        title: "Changes to This Policy",
        body: "We may update this Privacy Policy periodically. We will notify waitlist members of material changes via email. Continued use of our services constitutes acceptance of the updated policy.",
    },
];

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-[#05060a] text-white px-6 py-20">
            <div className="mx-auto max-w-2xl">
                <Link href="/" className="text-xs text-cyan-400/60 hover:text-cyan-300 transition-colors mb-10 inline-flex items-center gap-1.5">
                    ← Back to Skillion
                </Link>

                <p className="text-xs uppercase tracking-[0.25em] text-white/40 mt-8">Legal</p>
                <h1 className="mt-3 text-3xl font-semibold text-white">Privacy Policy</h1>
                <p className="mt-4 text-sm text-white/45">
                    Last updated: February 2026 · Skillion Finance
                </p>

                <div className="mt-10 text-sm text-white/60 leading-relaxed mb-8 p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                    Skillion Finance is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.
                </div>

                <div className="space-y-10">
                    {sections.map((s, i) => (
                        <div key={i}>
                            <h2 className="text-base font-semibold text-white/85 mb-3">{i + 1}. {s.title}</h2>
                            <p className="text-sm text-white/55 leading-relaxed">{s.body}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-14 pt-8 border-t border-white/8 text-sm text-white/40">
                    <p>Questions? Contact us at{" "}
                        <a href="mailto:contact@skillion.finance" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                            contact@skillion.finance
                        </a>
                    </p>
                </div>
            </div>
        </main>
    );
}
