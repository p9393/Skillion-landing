import { createClient } from '@/utils/supabase/server'
import { Star, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardOverview() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // We can fetch data_sources count here
    const { count } = await supabase
        .from('data_sources')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id || '')

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1A2235]/50 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center h-48 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/5 to-transparent pointer-events-none" />
                    <Star className="w-8 h-8 text-[#00F0FF]/50 mb-4" />
                    <p className="text-sm text-white/50 uppercase tracking-widest font-medium mb-1">Skillion Score</p>
                    <p className="text-4xl font-light text-white">Pending Data</p>
                </div>

                <div className="bg-[#1A2235]/50 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center h-48 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-bl from-[#7000FF]/5 to-transparent pointer-events-none" />
                    <LinkIcon className="w-8 h-8 text-[#7000FF]/50 mb-4" />
                    <p className="text-sm text-white/50 uppercase tracking-widest font-medium mb-1">Connected Sources</p>
                    <p className="text-4xl font-light text-white mb-4">{count || 0}</p>
                    {count === 0 && (
                        <Link href="/dashboard/connect" className="text-sm text-[#00F0FF] hover:text-[#00F0FF]/80 transition-colors">
                            Connect your first data source →
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}
