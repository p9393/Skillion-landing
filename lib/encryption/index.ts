/**
 * AES-256-GCM encryption/decryption using Web Crypto API (built-in to Node.js 18+).
 * Key stored as base64 in ENCRYPTION_KEY_B64 environment variable.
 *
 * Generate key: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 * Add to .env.local: ENCRYPTION_KEY_B64=<output>
 * Add to Vercel env: ENCRYPTION_KEY_B64=<output>  (server-only, not NEXT_PUBLIC_)
 */

const KEY_ENV = process.env.ENCRYPTION_KEY_B64

function getKeyMaterial(): Uint8Array {
    if (!KEY_ENV) {
        throw new Error('[Encryption] ENCRYPTION_KEY_B64 is not set in environment variables.')
    }
    const bytes = Buffer.from(KEY_ENV, 'base64')
    if (bytes.length !== 32) {
        throw new Error('[Encryption] ENCRYPTION_KEY_B64 must be exactly 32 bytes (256 bits).')
    }
    return new Uint8Array(bytes)
}

async function importKey(keyBytes: Uint8Array, usage: KeyUsage[]): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        'raw',
        keyBytes.buffer as ArrayBuffer,
        { name: 'AES-GCM' },
        false,
        usage
    )
}

export interface EncryptedPayload {
    cipher: string  // base64 ciphertext
    iv: string      // base64 IV (12 bytes)
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 * Returns base64 cipher + unique IV.
 */
export async function encrypt(plaintext: string): Promise<EncryptedPayload> {
    const key = await importKey(getKeyMaterial(), ['encrypt'])
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(plaintext)
    )

    return {
        cipher: Buffer.from(cipherBuffer).toString('base64'),
        iv: Buffer.from(iv).toString('base64'),
    }
}

/**
 * Decrypt an AES-256-GCM encrypted payload.
 */
export async function decrypt(payload: EncryptedPayload): Promise<string> {
    const key = await importKey(getKeyMaterial(), ['decrypt'])
    const iv = Buffer.from(payload.iv, 'base64')
    const cipherBuffer = Buffer.from(payload.cipher, 'base64')

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipherBuffer
    )

    return new TextDecoder().decode(decrypted)
}

/**
 * Utility — validate that encryption is working correctly.
 * Call during startup health checks.
 */
export async function selfTest(): Promise<boolean> {
    try {
        const test = 'aurion-encryption-test-2026'
        const enc = await encrypt(test)
        const dec = await decrypt(enc)
        return dec === test
    } catch {
        return false
    }
}
