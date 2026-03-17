import Link from "next/link";

const sections = [
    {
        title: "Acceptance of Terms",
        body: "By accessing or using Skillion Finance (\"the Platform\"), you agree to be bound by these Terms of Use. If you do not agree, please do not use the Platform.",
    },
    {
        title: "Nature of Service",
        body: "Skillion Finance is a reputation analytics platform that measures and gamifies trading discipline through an algorithmic score. The Platform does not provide financial advice, manage funds, execute trades, or operate as a regulated financial institution.",
    },
    {
        title: "The Skillion Score",
        body: "The Skillion Score is an algorithmic performance metric based on historical trading data provided by the user. It is not a guarantee, prediction, or endorsement of future performance. Past results do not imply future returns.",
    },
    {
        title: "User Responsibilities",
        body: "You are solely responsible for the accuracy of data you provide. You agree not to manipulate, falsify, or misrepresent your trading history. Violations will result in permanent account removal.",
    },
    {
        title: "Intellectual Property",
        body: "All Platform content, branding, the Skillion Score algorithm, and the Aurion interface are the exclusive property of Skillion Finance. Unauthorized reproduction or distribution is prohibited.",
    },
    {
        title: "Limitation of Liability",
        body: "Skillion Finance shall not be liable for any investment decisions made based on information from the Platform. The Platform is provided \"as is\" without warranties of any kind.",
    },
    {
        title: "Termination",
        body: "We reserve the right to suspend or terminate access to the Platform at our discretion, including in cases of abuse, fraud, or violation of these Terms.",
    },
];

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-[#05060a] text-white px-6 py-20">
            <div className="mx-auto max-w-2xl">
                <Link href="/" className="text-xs text-cyan-400/60 hover:text-cyan-300 transition-colors mb-10 inline-flex items-center gap-1.5">
                    ← Back to Skillion
                </Link>

                <p className="text-xs uppercase tracking-[0.25em] text-white/40 mt-8">Legal</p>
                <h1 className="mt-3 text-3xl font-semibold text-white">Terms of Use</h1>
                <p className="mt-4 text-sm text-white/45">Last updated: February 2026 · Skillion Finance</p>

                <div className="mt-10 text-sm text-white/60 leading-relaxed mb-8 p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                    Please read these Terms carefully before using Skillion Finance. These terms govern your use of our platform and services.
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
