'use client'

import { useState, useRef, useCallback } from 'react'
import { UploadCloud, File as FileIcon, AlertCircle, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function BrokerUploadPage() {
    const [file, setFile] = useState<File | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0])
            setError(null)
            setSuccess(false)
        }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setError(null)
            setSuccess(false)
        }
    }

    const handleButtonClick = () => {
        fileInputRef.current?.click()
    }

    const handleUpload = async () => {
        if (!file) return
        setUploading(true)
        setError(null)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/upload/statement', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed')
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/dashboard')
                router.refresh()
            }, 2000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="mb-8">
                <Link href="/dashboard/connect" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors text-sm font-medium">
                    <ChevronLeft className="w-4 h-4" />
                    Back to Connect Options
                </Link>
                <h2 className="text-2xl font-light text-white mb-2 tracking-wide">Upload Broker Statement</h2>
                <p className="text-white/50 leading-relaxed">
                    Upload your trading history export from your broker. We currently support CSV, HTML, and PDF formats from platforms like MT4, MT5, Interactive Brokers, and others.
                </p>
            </div>

            <div className="bg-[#1A2235]/40 border border-white/5 rounded-2xl p-8">

                {/* Upload Area */}
                <div
                    className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${dragActive
                            ? 'border-[#00F0FF] bg-[#00F0FF]/5'
                            : file
                                ? 'border-[#00F0FF]/30 bg-[#1A2235]'
                                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".csv,.pdf,.html,.htm,.xlsx,.xls"
                        onChange={handleChange}
                    />

                    {!file ? (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                <UploadCloud className="w-8 h-8 text-white/50" />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-white/90">Drag & drop your file here</p>
                                <p className="text-sm text-white/40 mt-1">or click to browse from your computer</p>
                            </div>
                            <button
                                onClick={handleButtonClick}
                                className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg font-medium transition-colors border border-white/5 text-sm"
                            >
                                Select File
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-[#00F0FF]/10 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                                <FileIcon className="w-8 h-8 text-[#00F0FF]" />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-white/90">{file.name}</p>
                                <p className="text-sm text-white/40 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>

                            {!uploading && !success && (
                                <button
                                    onClick={() => setFile(null)}
                                    className="mt-4 text-sm text-white/50 hover:text-red-400 transition-colors"
                                >
                                    Remove file
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Error / Success Messages */}
                {error && (
                    <div className="mt-6 flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="text-sm">{error}</div>
                    </div>
                )}

                {success && (
                    <div className="mt-6 flex items-start gap-3 bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] p-4 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="text-sm">File uploaded successfully. Initializing parsing engine...</div>
                    </div>
                )}

                {/* Action Button */}
                <div className="mt-8 flex justify-end pt-6 border-t border-white/5">
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading || success}
                        className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-medium transition-all ${!file || success
                                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                : uploading
                                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30 cursor-wait'
                                    : 'bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                            }`}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Uploading & Verifying...
                            </>
                        ) : success ? (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                Complete
                            </>
                        ) : (
                            'Upload Statement'
                        )}
                    </button>
                </div>

            </div>
        </div>
    )
}
