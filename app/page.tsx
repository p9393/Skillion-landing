import Navbar from "./components/Navbar";
import HowItWorksSection from "./components/HowItWorksSection";
import ScoreEngineSection from "./components/ScoreEngineSection";
import ProgressionSection from "./components/ProgressionSection";
import RoadmapSection from "./components/RoadmapSection";
import WaitlistForm from "./components/WaitlistForm";
import Footer from "./components/Footer";
import AurionWidget from "./components/AurionWidget";

export default function Page() {
  return (
    <>
      {/* ── NAVBAR ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-white/[0.05] bg-[#05060a]/85 backdrop-blur-xl">
        <Navbar />
      </div>

      <main className="relative z-10">

        {/* ═══════════════════════════════════════════════════════════
            1. HERO
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative mx-auto max-w-6xl px-6 pt-20 pb-14">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">

            {/* Left — copy */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/[0.06] px-4 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-xs text-indigo-300/80 tracking-[0.18em] uppercase font-medium">
                  Reputation Infrastructure
                </span>
              </div>

              <h1 className="text-4xl font-semibold leading-[1.12] text-white md:text-5xl lg:text-[3.4rem]">
                Where Skill<br />
                <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Becomes Capital.
                </span>
              </h1>

              <p className="mt-5 border-l-2 border-indigo-400/40 pl-5 text-base leading-relaxed text-white/55 md:text-lg">
                Prima diventi <span className="text-white/80 font-medium">misurabile</span> →
                poi diventi <span className="text-white/80 font-medium">credibile</span> →
                poi diventi <span className="text-white/80 font-medium">capital-ready</span>.<br />
                La prima infrastruttura dove la disciplina è un <em className="not-italic text-white">asset verificato.</em>
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#waitlist" className="rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg hover:opacity-90 transition-opacity">
                  Request Early Access
                </a>
                <a href="#how-it-works" className="rounded-xl border border-white/12 bg-white/[0.04] px-7 py-3.5 text-sm font-medium text-white/70 hover:bg-white/[0.08] transition-colors">
                  Explore the System →
                </a>
              </div>

              <p className="mt-5 text-xs text-white/25">
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-amber-400/70 align-middle" />
                Private build phase — founding cohort opening soon.
              </p>
            </div>

            {/* Right — score card */}
            <div className="hidden lg:flex justify-center">
              <div className="w-[340px] rounded-2xl border border-white/8 bg-[#06080f]/85 p-6 backdrop-blur-xl shadow-2xl">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/30">SDI Score</p>
                    <p className="mt-1 text-4xl font-bold text-white">741<span className="text-lg font-light text-white/25"> /1000</span></p>
                  </div>
                  <span className="rounded-lg border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-300">Initiate</span>
                </div>
                {[
                  { label: "Risk Control", v: 82 },
                  { label: "Stability", v: 74 },
                  { label: "Consistency", v: 78 },
                  { label: "Drawdown Discipline", v: 61 },
                  { label: "Behavioral Stability", v: 87 },
                ].map((m) => (
                  <div key={m.label} className="mb-3.5">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-white/50">{m.label}</span>
                      <span className="text-white/35">{m.v}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-500" style={{ width: `${m.v}%` }} />
                    </div>
                  </div>
                ))}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
                  {[{ v: "1.42", l: "Sharpe" }, { v: "61%", l: "Win Rate" }, { v: "8.2%", l: "Max DD" }].map(s => (
                    <div key={s.l} className="rounded-xl border border-white/6 bg-white/[0.02] py-2.5 text-center">
                      <div className="text-sm font-semibold text-white/80">{s.v}</div>
                      <div className="text-[10px] text-white/30">{s.l}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-center text-[10px] text-white/20 italic">Illustrative profile — not indicative of a real user</p>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-10 flex flex-wrap justify-center gap-x-7 gap-y-2 border-t border-white/[0.05] pt-7">
            {["🔒 Read-only only", "🔑 Non-custodial", "🛡 Encrypted", "📐 Transparent methodology", "⚖ No financial advice"].map(t => (
              <span key={t} className="text-xs text-white/28">{t}</span>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            2. PARADIGM SHIFT — full-width cinematic strip
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden border-y border-white/[0.05] bg-white/[0.012]">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4 top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            <div className="absolute bottom-0 left-1/4 h-px w-1/2 bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent" />
          </div>
          <div className="mx-auto max-w-6xl px-6 py-14">
            <p className="mb-2 text-center text-xs uppercase tracking-[0.28em] text-white/30">Philosophy</p>
            <h2 className="mb-10 text-center text-2xl font-semibold text-white md:text-3xl">
              The Shift From{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                Performance to Reputation
              </span>
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { left: "Markets reward risk.", right: "Skillion rewards discipline.", accent: "from-sky-400 to-indigo-400" },
                { left: "Performance is self-declared.", right: "Skillion makes it verified.", accent: "from-indigo-400 to-violet-400" },
                { left: "Discipline is invisible.", right: "Skillion makes it measurable.", accent: "from-violet-400 to-fuchsia-400" },
              ].map((c, i) => (
                <div key={i} className="rounded-2xl border border-white/6 bg-black/20 p-6 backdrop-blur-sm">
                  <p className="text-sm text-white/35 line-through mb-2">{c.left}</p>
                  <p className={`text-base font-semibold bg-gradient-to-r ${c.accent} bg-clip-text text-transparent`}>{c.right}</p>
                </div>
              ))}
            </div>

            <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-white/40">
              In modern trading and investing, performance is often self-declared and unverified. True financial discipline remains invisible.
              Skillion introduces a measurable standard of <span className="text-white/65">behavioral consistency</span> and <span className="text-white/65">risk control</span>.
            </p>
            <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-rose-500/10 bg-rose-500/[0.02] p-8 backdrop-blur-sm sm:p-10">
              <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">✖</span>
                  <h3 className="text-xl font-semibold text-white/90">Cos'è davvero Skillion. E cosa <span className="text-rose-400">NON</span> è.</h3>
                </div>
              </div>
              <p className="text-sm font-medium text-white/70 mb-4 bg-white/5 p-3 rounded-lg border border-white/10 uppercase tracking-wide text-center">
                Skillion non è: una prop firm · un broker · un exchange · un fondo · un venditore di segnali
              </p>

              <div className="grid gap-6 sm:grid-cols-2 mt-8">
                <div>
                  <h4 className="mb-4 text-xs tracking-widest uppercase text-white/40 border-b border-white/10 pb-2">Prop Firm Model</h4>
                  <ul className="space-y-3">
                    <li className="flex gap-3 text-sm text-white/50"><span className="text-rose-400/70 opacity-70">✗</span> Valuta su 30 giorni</li>
                    <li className="flex gap-3 text-sm text-white/50"><span className="text-rose-400/70 opacity-70">✗</span> Ricerca di guadagni veloci</li>
                    <li className="flex gap-3 text-sm text-white/50"><span className="text-rose-400/70 opacity-70">✗</span> Alta rotazione (churn rate)</li>
                    <li className="flex gap-3 text-sm text-white/50"><span className="text-rose-400/70 opacity-70">✗</span> Premia la speculazione e la visibilità</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-4 text-xs tracking-widest uppercase text-white/40 border-b border-white/10 pb-2">Skillion Standard</h4>
                  <ul className="space-y-3">
                    <li className="flex gap-3 text-sm text-white/80"><span className="text-indigo-400">✓</span> Valuta la disciplina a lungo termine</li>
                    <li className="flex gap-3 text-sm text-white/80"><span className="text-indigo-400">✓</span> Costruisce una reputazione on-chain solida</li>
                    <li className="flex gap-3 text-sm text-white/80"><span className="text-indigo-400">✓</span> Crescita sostenibile e progressiva</li>
                    <li className="flex gap-3 text-sm text-white/80"><span className="text-indigo-400">✓</span> Premia la stabilità e la coerenza comportamentale</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            3. HOW IT WORKS
        ═══════════════════════════════════════════════════════════ */}
        <div id="how-it-works">
          <HowItWorksSection />
        </div>

        {/* ═══════════════════════════════════════════════════════════
            4. SCORE ENGINE — full alternate-bg section
        ═══════════════════════════════════════════════════════════ */}
        <div className="border-y border-white/[0.04] bg-white/[0.01]">
          <ScoreEngineSection />
        </div>

        {/* ═══════════════════════════════════════════════════════════
            5. AURION — wide 2-col with visual left accent
        ═══════════════════════════════════════════════════════════ */}
        <section id="aurion" className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">

            {/* Left — visual card (reversed from ScoreEngine) */}
            <div className="order-2 lg:order-1 flex justify-center">
              <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-[#06080f]/85 p-7 backdrop-blur-xl">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/15 to-fuchsia-400/15 text-lg text-white/60">◈</div>
                  <div>
                    <div className="text-sm font-semibold text-white/85">Aurion</div>
                    <div className="text-xs text-white/35">Intelligence Layer · Skillion</div>
                  </div>
                </div>
                <div className="space-y-3 divide-y divide-white/[0.04]">
                  {[
                    { k: "Mode", v: "Behavioral Analysis" },
                    { k: "Function", v: "Pattern Recognition" },
                    { k: "Layer", v: "Intelligence" },
                    { k: "Status", v: "Active" },
                  ].map(r => (
                    <div key={r.k} className="flex items-center justify-between pt-3 first:pt-0">
                      <span className="text-xs text-white/35">{r.k}</span>
                      <span className="text-xs font-medium text-white/70">{r.v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.03] p-4">
                  <p className="text-xs leading-relaxed text-white/40 italic">
                    "Aurion surfaces verified behavioral patterns — not recommendations."
                  </p>
                </div>
              </div>
            </div>

            {/* Right — copy */}
            <div className="order-1 lg:order-2">
              <p className="text-xs uppercase tracking-[0.28em] text-white/35">Intelligence Layer</p>
              <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
                Aurion —{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
                  The Intelligence Layer
                </span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/50">
                Aurion interprets behavioral data patterns and tracks progression across the Skillion ecosystem.
                It is the analytical intelligence layer of the platform — not a traditional assistant.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { t: "Performance Interpretation", d: "Translates verified metrics into comprehensible behavioral insights." },
                  { t: "Stability Tracking", d: "Monitors consistency patterns across time and market conditions." },
                  { t: "Progression Feedback", d: "Identifies trajectory toward the next reputation tier." },
                  { t: "Behavioral Analytics", d: "Surfaces risk patterns, deviations, and consistency signals." },
                ].map(item => (
                  <div key={item.t} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-400" />
                    <div>
                      <span className="text-sm font-medium text-white/75">{item.t}</span>
                      <span className="text-sm text-white/40"> — {item.d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            6. PROGRESSION — horizontal tier timeline
        ═══════════════════════════════════════════════════════════ */}
        <div className="border-y border-white/[0.04] bg-white/[0.01]">
          <ProgressionSection />
        </div>

        {/* ═══════════════════════════════════════════════════════════
            7. ROADMAP
        ═══════════════════════════════════════════════════════════ */}
        <RoadmapSection />

        {/* ═══════════════════════════════════════════════════════════
            8. TRUST & SECURITY — horizontal strip
        ═══════════════════════════════════════════════════════════ */}
        <section id="security" className="border-y border-white/[0.05] bg-white/[0.015]">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <p className="mb-2 text-center text-xs uppercase tracking-[0.28em] text-white/30">Foundations</p>
            <h2 className="mb-10 text-center text-2xl font-semibold text-white md:text-3xl">
              Security, Privacy &{" "}
              <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Methodology</span>
            </h2>
            {/* 5-pillar horizontal grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { icon: "🔒", t: "Data Privacy", d: "Processed for scoring only. Never sold." },
                { icon: "🔑", t: "Read-Only", d: "No trading or withdrawal permissions ever." },
                { icon: "🛡", t: "Non-Custodial", d: "Skillion holds no funds or private keys." },
                { icon: "📐", t: "Open Methodology", d: "Based on accepted financial mathematics." },
                { icon: "⚖", t: "No Advice", d: "Reputation system only — not a financial advisor." },
              ].map(p => (
                <div key={p.t} className="rounded-2xl border border-white/8 bg-black/15 p-5 backdrop-blur-sm">
                  <div className="mb-3 text-xl">{p.icon}</div>
                  <div className="mb-1.5 text-sm font-semibold text-white/80">{p.t}</div>
                  <p className="text-xs leading-relaxed text-white/40">{p.d}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-xs text-white/22 leading-relaxed">
              Skillion is not a financial institution, broker, or investment advisor. Nothing on this platform constitutes investment advice or a solicitation to trade.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            9. FINAL CTA
        ═══════════════════════════════════════════════════════════ */}
        <section id="waitlist" className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          {/* Radial glow */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-72 w-72 rounded-full bg-indigo-500/8 blur-3xl" />
          </div>
          <div className="relative">
            <p className="mb-4 text-xs uppercase tracking-[0.28em] text-white/30">Early Access</p>
            <h2 className="text-3xl font-semibold text-white md:text-4xl lg:text-5xl leading-tight">
              The Future of Financial<br />
              <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">
                Reputation Starts Here.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-white/40 leading-relaxed">
              Early participants will shape the first version of the reputation standard.
            </p>
            <div className="mt-8">
              <WaitlistForm />
            </div>
            <p className="mt-5 text-xs text-white/22 italic">No spam. No financial solicitation. Early access only.</p>
          </div>
        </section>

      </main>

      <div className="relative z-10">
        <Footer />
      </div>
      <AurionWidget />
    </>
  );
}
