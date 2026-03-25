'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function InviteButton({ email }: { email: string }) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
    const [msg, setMsg] = useState('')

    const invite = async () => {
        setStatus('loading')
        try {
            const res = await fetch('/api/beta-invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET ?? '',
                },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()
            if (!res.ok) {
                setMsg(data.error || 'Error sending invite')
                setStatus('error')
            } else {
                setMsg('Invited!')
                setStatus('done')
            }
        } catch {
            setMsg('Network error')
            setStatus('error')
        }
    }

    if (status === 'done') return <span className="text-xs text-emerald-400 font-medium">✓ Invited</span>
    if (status === 'error') return <span className="text-xs text-red-400">{msg}</span>

    return (
        <button
            onClick={invite}
            disabled={status === 'loading'}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#00F0FF]/20 text-[#00F0FF] hover:bg-[#00F0FF]/10 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
            {status === 'loading' ? <><Loader2 className="w-3 h-3 animate-spin" /> Sending…</> : 'Send Invite'}
        </button>
    )
}
