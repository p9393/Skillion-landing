import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    },
                },
            }
        )

        // Verify authentication
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get formData
        const formData = await req.formData()
        const file = formData.get('file') as File | null
        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const buffer = await file.arrayBuffer()
        const fileBytes = new Uint8Array(buffer)

        // Check size limit (10MB)
        if (fileBytes.byteLength > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File exceeds 10MB limit' }, { status: 400 })
        }

        // Generate checksum
        const hashSum = crypto.createHash('sha256')
        hashSum.update(Buffer.from(fileBytes))
        const checksum = hashSum.digest('hex')

        // Use Service Role to bypass storage RLS and ensure the bucket exists.
        // In production, you'd usually configure Storage RLS policies.
        const supabaseAdmin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: { getAll() { return [] }, setAll() { } }
            }
        )

        // Ensure bucket exists (ignores error if already exists)
        await supabaseAdmin.storage.createBucket('statements', { public: false }).catch(() => { })

        // Generate safe filename scoped by user ID
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('statements')
            .upload(fileName, fileBytes, {
                contentType: file.type,
            })

        if (uploadError) {
            console.error('Storage Upload Error:', uploadError)
            return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 })
        }

        // Create Data Source record
        const { data: sourceData, error: sourceError } = await supabaseAdmin
            .from('data_sources')
            .insert({
                user_id: user.id,
                source_type: 'upload',
                provider: 'custom_statement',
                verification_level: 'statement',
                status: 'pending',
                metadata: { originalFilename: file.name, type: file.type }
            })
            .select()
            .single()

        if (sourceError) {
            console.error('DB Source Error:', sourceError)
            return NextResponse.json({ error: 'Failed to create data source record' }, { status: 500 })
        }

        // Create Broker Statement record
        const { error: statementError } = await supabaseAdmin
            .from('broker_statements')
            .insert({
                user_id: user.id,
                source_id: sourceData.id,
                filename: file.name,
                format: fileExt?.toLowerCase() || 'unknown',
                file_path: uploadData.path,
                checksum: checksum,
                status: 'uploaded'
            })

        if (statementError) {
            console.error('DB Statement Error:', statementError)
            return NextResponse.json({ error: 'Failed to save statement record' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Upload complete' })

    } catch (err: unknown) {
        console.error('Upload handler error:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 })
    }
}
