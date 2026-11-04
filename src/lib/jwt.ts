import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'neurosim_pro_enterprise_jwt_secret_key_2026_super_secure';
const DEFAULT_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 hari dalam detik

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export interface JwtTokenPayload {
  id?: number;
  username?: string;
  email?: string;
  fullName?: string;
  role?: string;
  roleSlug?: string;
  orgId?: number;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

/**
 * Buat dan tanda tangani JWT HMAC-SHA256 berstandar RFC 7519
 */
export function signJwt(payload: Record<string, any>, expiresInSeconds: number = DEFAULT_EXPIRES_IN): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtTokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifikasi validitas tanda tangan dan kedaluwarsa JWT
 */
export function verifyJwt<T extends JwtTokenPayload = JwtTokenPayload>(token: string): { valid: boolean; payload?: T; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token otentikasi tidak ditemukan.' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Format token otentikasi JWT tidak valid.' };
  }

  const [encodedHeader, encodedPayload, signature] = parts;

  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSignature) {
    return { valid: false, error: 'Tanda tangan token otentikasi tidak sah (invalid signature).' };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as T;
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Sesi token otentikasi telah kedaluwarsa (expired). Silakan masuk kembali.' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: 'Gagal mengurai payload data token otentikasi.' };
  }
}
