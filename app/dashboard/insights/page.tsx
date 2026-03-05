'use client'

import { useState, useEffect, useRef } from 'react'
import { Lightbulb, AlertTriangle, AlertCircle, Info, RefreshCw, Check, Send, Bot, User } from 'lucide-react'

interface Insight {
    id: string
    insight_type: 'performance' | 'risk' | 'behavior' | 'coaching' | 'anomaly'
    title: string
    body: string
    severity: 'info' | 'warning' | 'critical'
    is_read: boolean
    generated_at: string
}

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp?: Date
}

const SEVERITY_CONFIG = {
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/15' },
    warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/15' },
    critical: { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/15' },
}

const TYPE_LABELS: Record<string, string> = {
    performance: 'Performance',
    risk: 'Risk Alert',
    behavior: 'Behavior',
    coaching: 'Coaching',
    anomaly: 'Anomaly',
}

export default function InsightsPage() {
    const [insights, setInsights] = useState<Insight[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'insights' | 'chat'>('insights')
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello. I\'m Aurion, your performance intelligence layer. Ask me about your trading metrics, score drivers, risk flags, or what to focus on next. I provide analytical insights only — not financial advice.', timestamp: new Date() },
    ])
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadInsights()
    }, [])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const loadInsights = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/aurion/insights')
            const data = await res.json() as { insights: Insight[] }
            setInsights(data.insights ?? [])
        } finally {
            setLoading(false)
        }
    }

    const markRead = async (id: string) => {
        setInsights(prev => prev.map(i => i.id === id ? { ...i, is_read: true } : i))
        // TODO: PATCH /api/aurion/insights/[id]/read
    }

    const sendMessage = async () => {
        if (!input.trim() || sending) return
        const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setSending(true)

        try {
            const res = await fetch('/api/aurion/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg.content }),
            })
            const data = await res.json() as { response?: string; error?: string }
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response ?? data.error ?? 'Unable to respond.',
                timestamp: new Date(),
            }])
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Connection error. Please try again.',
                timestamp: new Date(),
            }])
        } finally {
            setSending(false)
        }
    }

    const unreadCount = insights.filter(i => !i.is_read).length

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] pb-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-4 p-1 bg-white/5 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('insights')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'insights' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                    <Lightbulb className="w-4 h-4" />
                    Insights
                    {unreadCount > 0 && (
                        <span className="bg-[#00F0FF]/20 text-[#00F0FF] text-xs px-1.5 py-0.5 rounded-full font-bold">
                            {unreadCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                    <Bot className="w-4 h-4" />
                    Chat with Aurion
                </button>
            </div>

            {/* INSIGHTS TAB */}
            {activeTab === 'insights' && (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-light text-white">Active Insights</h2>
                        <button onClick={loadInsights} disabled={loading} className="p-2 text-white/30 hover:text-white/70 transition-colors">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-6 h-6 text-white/30 animate-spin" />
                        </div>
                    ) : insights.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-14 h-14 rounded-2xl bg-[#7000FF]/10 border border-[#7000FF]/20 flex items-center justify-center mx-auto mb-4">
                                <Lightbulb className="w-7 h-7 text-[#7000FF]/60" />
                            </div>
                            <p className="text-white/40 text-sm">No insights yet. Connect an exchange account and sync data to generate your first insights.</p>
                        </div>
                    ) : (
                        insights.map(insight => {
                            const cfg = SEVERITY_CONFIG[insight.severity]
                            const IconComp = cfg.icon
                            return (
                                <div
                                    key={insight.id}
                                    className={`rounded-2xl border p-4 transition-all ${cfg.bg} ${insight.is_read ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 flex-shrink-0 ${cfg.color}`}>
                                            <IconComp className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] uppercase tracking-wider font-semibold ${cfg.color}`}>
                                                    {TYPE_LABELS[insight.insight_type]}
                                                </span>
                                                <span className="text-[10px] text-white/20">
                                                    {new Date(insight.generated_at).toLocaleDateString('en-GB')}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-semibold text-white mb-1">{insight.title}</h3>
                                            <p className="text-xs text-white/50 leading-relaxed">{insight.body}</p>
                                        </div>
                                        {!insight.is_read && (
                                            <button
                                                onClick={() => markRead(insight.id)}
                                                className="flex-shrink-0 p-1.5 rounded-lg text-white/20 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                                                title="Mark as read"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <p className="text-[11px] text-white/20 text-center pt-4">
                        Insights are informational only. Not financial advice.
                    </p>
                </div>
            )}

            {/* CHAT TAB */}
            {activeTab === 'chat' && (
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#7000FF]/20 border border-[#7000FF]/30 flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-[#7000FF]" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-[#00F0FF]/15 border border-[#00F0FF]/20 text-white'
                                        : 'bg-white/5 border border-white/10 text-white/80'
                                    }`}>
                                    <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                                </div>
                                {msg.role === 'user' && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                                        <User className="w-4 h-4 text-white/60" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {sending && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 rounded-xl bg-[#7000FF]/20 border border-[#7000FF]/30 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-[#7000FF]" />
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map(d => (
                                            <div key={d} className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="flex gap-2 pt-2 border-t border-white/8">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                            placeholder="Ask Aurion about your performance..."
                            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 focus:border-[#7000FF]/40 focus:outline-none focus:ring-1 focus:ring-[#7000FF]/40 transition-colors"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={sending || !input.trim()}
                            className="px-4 py-3 rounded-xl bg-[#7000FF]/20 border border-[#7000FF]/30 text-[#7000FF] hover:bg-[#7000FF]/30 transition-colors disabled:opacity-40"
                            aria-label="Send message"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-white/20 text-center pt-2">
                        Aurion provides analytical insights only — not financial advice. Max 30 messages/day.
                    </p>
                </div>
            )}
        </div>
    )
}
