"use client";

import React, {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { computeSkillionScore, Trade } from "../lib/scoreEngine";
import { createClient } from "../../utils/supabase/client";

/* ─── Types ──────────────────────────────────────────────────────── */
type AurionState = "IDLE" | "FOCUS" | "CONFIRM" | "ALERT" | "SPEAK";

type AurionEvent =
  | { type: "HOVER_IMPORTANT"; source?: string }
  | { type: "UNHOVER" }
  | { type: "CONFIRM"; source?: string }
  | { type: "ALERT"; level: "low" | "mid" | "high"; source?: string }
  | { type: "VOICE_ON" }
  | { type: "VOICE_OFF" }
  | { type: "SPEAK"; text: string };

type LogItem = {
  ts: string;
  type: "INFO" | "CONFIRM" | "ALERT";
  msg: string;
};

type ChatMessage = {
  role: "user" | "aurion";
  content: string;
};

/* ─── Reducer ────────────────────────────────────────────────────── */
function reducer(prev: AurionState, ev: AurionEvent): AurionState {
  switch (ev.type) {
    case "HOVER_IMPORTANT":
      return prev === "SPEAK" ? prev : "FOCUS";
    case "UNHOVER":
      return prev === "SPEAK" ? prev : "IDLE";
    case "CONFIRM":
      return prev === "SPEAK" ? prev : "CONFIRM";
    case "ALERT":
      return prev === "SPEAK" ? prev : "ALERT";
    case "SPEAK":
      return "SPEAK";
    case "VOICE_ON":
    case "VOICE_OFF":
      return prev;
    default:
      return prev;
  }
}

/* ─── Helpers ────────────────────────────────────────────────────── */
function nowStamp() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/* ─── Sub-components ─────────────────────────────────────────────── */
function ProgressRow(props: { label: string; value01: number; hint: string }) {
  const pct = Math.round(clamp01(props.value01) * 100);
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white/90">{props.label}</div>
        <div className="text-sm text-white/80">{pct}%</div>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 text-xs text-white/60">{props.hint}</div>
    </div>
  );
}

function StatRow(props: { k: string; v: string }) {
  return (
    <>
      <div className="text-white/75">{props.k}</div>
      <div className="text-right text-white/90">{props.v}</div>
    </>
  );
}

/* ─── Chat Panel ─────────────────────────────────────────────────── */
function ChatPanel({
  log,
  voiceEnabled,
  setVoiceEnabled,
  dispatch,
  say,
  state,
}: {
  log: LogItem[];
  voiceEnabled: boolean;
  setVoiceEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  dispatch: React.Dispatch<AurionEvent>;
  say: (t: string, type?: LogItem["type"]) => void;
  state: AurionState;
}) {
  // ── Auth gate ──────────────────────────────────────────────────
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data?.user);
      setAuthChecked(true);
    });
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "aurion", content: "Ciao. Sono Aurion — il tuo advisor di Skillion. Come posso aiutarti?" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    setMessages(m => [...m, { role: "user", content: text }]);
    setThinking(true);
    dispatch({ type: "SPEAK", text: "..." });

    try {
      const res = await fetch("/api/aurion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Errore API");

      const reply: string = data.reply ?? "";
      setMessages(m => [...m, { role: "aurion", content: reply }]);
      say(reply.slice(0, 80) + (reply.length > 80 ? "…" : ""), "INFO");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore di rete.";
      setMessages(m => [...m, { role: "aurion", content: `⚠ ${msg}` }]);
      dispatch({ type: "ALERT", level: "mid" });
    } finally {
      setThinking(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Auth gate for non-members ──────────────────────────────── */}
      {!authChecked ? (
        /* Loading auth state */
        <div className="flex flex-1 items-center justify-center">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <span key={i} className="h-2 w-2 rounded-full bg-cyan-400/40"
                style={{ animation: `bounce 1.2s ease ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
      ) : !isAuthenticated ? (
        /* Non-member gate */
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/15 to-fuchsia-400/15 text-2xl">◈</div>
          <div>
            <div className="text-sm font-semibold text-white/85 mb-2">Aurion è riservato ai membri Skillion</div>
            <p className="text-xs leading-relaxed text-white/45">
              La chat Aurion è accessibile esclusivamente agli utenti registrati nell&apos;ecosistema Skillion.
              Accedi per continuare.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <a
              href="/auth/login"
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white text-center hover:opacity-90 transition-opacity"
            >
              Accedi a Skillion
            </a>
            <a
              href="#waitlist"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-xs text-white/55 text-center hover:bg-white/[0.07] transition-colors"
            >
              Non sei membro? Richiedi accesso
            </a>
          </div>
          <p className="text-[10px] text-white/25 italic">
            Aurion è il layer di intelligenza analitica di Skillion — disponibile per gli utenti attivi.
          </p>
        </div>
      ) : (
        /* Authenticated member — full chat interface */
        <>

          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <div>
              <div className="text-xs tracking-[0.22em] text-white/50">AURION</div>
              <div className="text-sm font-semibold text-white/90">Chat con Aurion</div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/60"
              >
                {state}
              </span>
              <button
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
                onClick={() => {
                  setVoiceEnabled(v => !v);
                  dispatch({ type: voiceEnabled ? "VOICE_OFF" : "VOICE_ON" });
                  say(voiceEnabled ? "Voce disattivata." : "Voce attivata.", "INFO");
                }}
              >
                {voiceEnabled ? "🔊 ON" : "🔇 OFF"}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 aurion-scroll">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user"
                    ? "bg-indigo-500/25 text-white/90 border border-indigo-400/20"
                    : "bg-white/5 text-white/80 border border-white/8"
                    }`}
                >
                  {m.role === "aurion" && (
                    <span className="block text-[10px] text-cyan-400/70 mb-1 tracking-wider">AURION</span>
                  )}
                  {m.content}
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {thinking && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  <span className="block text-[10px] text-cyan-400/70 mb-1 tracking-wider">AURION</span>
                  <span className="flex gap-1.5 items-center">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-cyan-400/60"
                        style={{ animation: `bounce 1.2s ease ${i * 0.2}s infinite` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="px-5 py-4 border-t border-white/8">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5">
              <textarea
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                disabled={thinking}
                placeholder="Scrivi ad Aurion… (Invio per inviare)"
                className="flex-1 resize-none bg-transparent text-sm text-white/85 placeholder:text-white/30 outline-none disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || thinking}
                className="flex-shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Invia
              </button>
            </div>
            <p className="mt-2 text-[10px] text-white/25 text-center">
              Aurion è in modalità simulazione — non fornisce consigli finanziari.
            </p>
          </div>

          {/* Audit log (collapsed at bottom) */}
          <details className="px-5 pb-4">
            <summary className="text-[10px] tracking-widest text-white/30 uppercase cursor-pointer select-none hover:text-white/50 transition-colors">
              Audit log ({log.length})
            </summary>
            <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto aurion-scroll">
              {log.map((l, i) => (
                <div key={i} className="rounded-xl border border-white/6 bg-black/20 px-3 py-1.5">
                  <span className="text-[10px] text-white/40">{l.type} · {l.ts} — </span>
                  <span className="text-[11px] text-white/65">{l.msg}</span>
                </div>
              ))}
            </div>
          </details>
        </>
      )}
    </div>
  );
}

/* ─── Main Widget ─────────────────────────────────────────────────── */
export default function AurionWidget() {
  const [open, setOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [state, dispatch] = useReducer(reducer, "IDLE");
  const [lastText, setLastText] = useState("");

  // Mock trades for score engine
  const trades: Trade[] = useMemo(
    () => [
      { ts: 1, pnl: 50 },
      { ts: 2, pnl: -30 },
      { ts: 3, pnl: 80 },
      { ts: 4, pnl: -20 },
      { ts: 5, pnl: 40 },
      { ts: 6, pnl: -10 },
      { ts: 7, pnl: 100 },
      { ts: 8, pnl: -50 },
      { ts: 9, pnl: 60 },
      { ts: 10, pnl: 30 },
    ],
    []
  );

  const score = useMemo(() => computeSkillionScore(trades), [trades]);

  const derived = useMemo(
    () => ({
      stability: clamp01(score.stability / 100),
      risk: clamp01((100 - score.riskControl) / 100),
      consistency: clamp01(score.consistency / 100),
      compliance: clamp01(score.drawdownDiscipline / 100),
    }),
    [score]
  );

  const [metrics, setMetrics] = useState(derived);
  const [log, setLog] = useState<LogItem[]>([
    { ts: nowStamp(), type: "INFO", msg: "Simulation mode active." },
    { ts: nowStamp(), type: "INFO", msg: "Risk guardrails loaded." },
  ]);

  useEffect(() => { setMetrics(derived); }, [derived]);

  // Lock body scroll when panel is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Auto-return from CONFIRM to IDLE
  useEffect(() => {
    if (state !== "CONFIRM") return;
    const t = window.setTimeout(() => dispatch({ type: "UNHOVER" }), 900);
    return () => window.clearTimeout(t);
  }, [state]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pushLog = (item: Omit<LogItem, "ts">) => {
    setLog(prev => [{ ts: nowStamp(), ...item }, ...prev].slice(0, 20));
  };

  const say = (t: string, logType: LogItem["type"] = "INFO") => {
    setLastText(t);
    dispatch({ type: "SPEAK", text: t });
    pushLog({ type: logType, msg: t });
    if (voiceEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const synth = window.speechSynthesis;
        synth.cancel();
        const u = new SpeechSynthesisUtterance(t);
        u.lang = "it-IT"; u.rate = 0.95; u.pitch = 1.0; u.volume = 1;
        synth.speak(u);
      } catch { /* ignore */ }
    }
    window.setTimeout(() => dispatch({ type: "UNHOVER" }), 900);
  };

  const tier = score.total >= 850 ? "Elite" : score.total >= 700 ? "Initiate" : "Bronze";
  const leverage = tier === "Elite" ? "5.0x" : tier === "Initiate" ? "2.0x" : "1.0x";
  const capital = tier === "Elite" ? "$2,500 (sim)" : tier === "Initiate" ? "$250 (sim)" : "$0";

  /* State color */
  const stateColor =
    state === "CONFIRM" ? "border-cyan-400/40 shadow-cyan-400/20" :
      state === "ALERT" ? "border-fuchsia-400/40 shadow-fuchsia-400/20" :
        state === "SPEAK" ? "border-indigo-400/40 shadow-indigo-400/20" :
          state === "FOCUS" ? "border-white/20" :
            "border-cyan-300/20";

  return (
    <>
      {/* ── Dock button ─────────────────────────────────────────── */}
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={() => setOpen(true)}
          onMouseEnter={() => dispatch({ type: "HOVER_IMPORTANT" })}
          onMouseLeave={() => dispatch({ type: "UNHOVER" })}
          className={`group relative flex items-center gap-3 rounded-2xl border bg-black/40 px-4 py-3 backdrop-blur-xl hover:bg-black/55 transition-all shadow-lg ${stateColor}`}
          aria-label="Apri Aurion"
        >
          {/* Avatar */}
          <div className="relative h-10 w-10 flex-shrink-0">
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400/30 via-blue-500/25 to-fuchsia-500/25 ring-1 ring-white/10 ${state !== "IDLE" ? "animate-pulse" : ""}`} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/aurion-avatar.png"
              alt="Aurion"
              className="absolute inset-0 h-full w-full rounded-xl object-cover"
            />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold tracking-wide text-white/85">Aurion</div>
            <div className="text-[11px] text-white/55">
              {state === "SPEAK" ? lastText.slice(0, 28) + "…" : "Calm · Analytical · Merit-driven"}
            </div>
          </div>
          {/* Status badge */}
          <div className={`ml-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium ${state === "ALERT" ? "text-fuchsia-300" :
            state === "CONFIRM" ? "text-cyan-300" :
              state === "SPEAK" ? "text-indigo-300" : "text-white/55"
            }`}>
            {state}
          </div>
        </button>
      </div>

      {/* ── Full panel ──────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Drawer */}
          <aside className="absolute right-0 top-0 h-full w-[480px] max-w-[95vw] border-l border-white/10 bg-[#070a12]/97 backdrop-blur-2xl flex flex-col">

            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-10 rounded-full border border-white/10 bg-white/5 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setOpen(false)}
              aria-label="Chiudi"
            >
              ✕
            </button>

            {/* Tabs */}
            <TabView
              log={log}
              score={score}
              metrics={metrics}
              derived={derived}
              setMetrics={setMetrics}
              pushLog={pushLog}
              voiceEnabled={voiceEnabled}
              setVoiceEnabled={setVoiceEnabled}
              dispatch={dispatch}
              say={say}
              state={state}
              tier={tier}
              leverage={leverage}
              capital={capital}
              lastText={lastText}
            />
          </aside>
        </div>
      )}

      {/* Bounce animation for thinking dots */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50%       { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}

/* ─── Tab view ───────────────────────────────────────────────────── */
function TabView({
  log, score, metrics, derived, setMetrics, pushLog,
  voiceEnabled, setVoiceEnabled, dispatch, say, state,
  tier, leverage, capital, lastText,
}: {
  log: LogItem[];
  score: ReturnType<typeof computeSkillionScore>;
  metrics: { stability: number; risk: number; consistency: number; compliance: number };
  derived: typeof metrics;
  setMetrics: React.Dispatch<React.SetStateAction<typeof metrics>>;
  pushLog: (item: Omit<LogItem, "ts">) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  dispatch: React.Dispatch<AurionEvent>;
  say: (t: string, type?: LogItem["type"]) => void;
  state: AurionState;
  tier: string;
  leverage: string;
  capital: string;
  lastText: string;
}) {
  const [tab, setTab] = useState<"chat" | "risk" | "session">("chat");

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-5 pt-5 pb-0 flex-shrink-0">
        {(["chat", "risk", "session"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all ${tab === t
              ? "bg-white/10 text-white border border-white/15"
              : "text-white/40 hover:text-white/70"
              }`}
          >
            {t === "chat" ? "💬 Chat" : t === "risk" ? "📊 Risk Desk" : "🔐 Session Gate"}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px mx-5 mt-3 bg-white/8 flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "chat" && (
          <ChatPanel
            log={log}
            voiceEnabled={voiceEnabled}
            setVoiceEnabled={setVoiceEnabled}
            dispatch={dispatch}
            say={say}
            state={state}
          />
        )}
        {tab === "risk" && (
          <div className="h-full overflow-y-auto px-5 py-4 space-y-4 aurion-scroll">
            <div className="flex items-center justify-between">
              <div className="text-xs tracking-[0.22em] text-white/55">RISK DESK SNAPSHOT</div>
              <button
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
                onClick={() => { pushLog({ type: "INFO", msg: "Refresh requested." }); setMetrics(derived); }}
              >
                Refresh
              </button>
            </div>
            <div className="space-y-3">
              <ProgressRow label="Stability" value01={metrics.stability} hint="Session-to-session variance" />
              <ProgressRow label="Risk Load" value01={metrics.risk} hint="Exposure & leverage pressure (lower is better)" />
              <ProgressRow label="Consistency" value01={metrics.consistency} hint="Rule adherence & execution quality" />
              <ProgressRow label="Compliance" value01={metrics.compliance} hint="Guardrails met across the last window" />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <div className="mb-2 font-semibold text-white/90">Performance Stats</div>
              <div className="grid grid-cols-2 gap-2 text-white/80">
                <StatRow k="Sharpe" v={score.stats.sharpe.toFixed(2)} />
                <StatRow k="Sortino" v={score.stats.sortino.toFixed(2)} />
                <StatRow k="Z-Score" v={score.stats.zScore.toFixed(2)} />
                <StatRow k="Max DD" v={`${score.stats.maxDrawdownPct.toFixed(2)}%`} />
              </div>
            </div>
          </div>
        )}
        {tab === "session" && (
          <div className="h-full overflow-y-auto px-5 py-4 space-y-4 aurion-scroll">
            <div className="text-xs tracking-[0.22em] text-white/55">RANK & CAPITAL</div>
            <div className="grid gap-2">
              {[
                { label: "Reputation score", value: String(score.total) },
                { label: "Tier", value: tier },
                { label: "Capital access", value: capital },
                { label: "Leverage permission", value: leverage },
                { label: "Daily loss limit", value: "-1.2%" },
                { label: "Overtrading penalty", value: "ON" },
                { label: "Stability requirement", value: "7 sessions" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/80">
                  <span>{label}</span>
                  <span className="text-white/95 font-medium">{value}</span>
                </div>
              ))}
            </div>

            <div className="text-xs tracking-[0.18em] text-white/50 pt-2">UNLOCK PATH</div>
            <div className="space-y-2">
              {[
                { dot: "bg-cyan-400", text: "Initiate → Stable 7 sessions" },
                { dot: "bg-white/30", text: "Operator → Compliance ≥ 90% for 14 days" },
                { dot: "bg-white/20", text: "Architect → Risk load ≤ 25% for 30 sessions" },
              ].map(({ dot, text }) => (
                <div key={text} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
                  <span className={`mr-2 inline-block h-2 w-2 rounded-full ${dot}`} />
                  {text}
                </div>
              ))}
              <button
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
                onClick={() => say("Progression is merit-based: improve stability and drawdown discipline to unlock higher tiers and capital modules.", "INFO")}
              >
                Explain progression
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
