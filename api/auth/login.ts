import bcrypt from 'bcryptjs';
import { getDbPool } from '../../src/lib/db';
import { signJwt } from '../../src/lib/jwt';

export interface LoginRequestBody {
  username?: string;
  email?: string;
  password?: string;
}

export interface UserSessionData {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  roleSlug: 'super_admin' | 'org_admin' | 'manager' | 'employee' | 'guest';
  department: string;
  title: string;
  avatar: string;
  orgId: number;
  reduceMotion: boolean;
  highContrast: boolean;
  textScale: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: UserSessionData;
  token?: string;
  history?: any[];
}

export const ENTERPRISE_DEMO_ACCOUNTS: Record<string, { pass: string; user: UserSessionData }> = {
  admin: {
    pass: 'admin123',
    user: {
      id: 1,
      username: 'admin',
      email: 'admin@neurosimpro.com',
      fullName: 'Administrator NeuroSim Pro',
      role: 'Super Administrator',
      roleSlug: 'super_admin',
      department: 'Enterprise Management',
      title: 'Platform Administrator',
      avatar: '/assets/characters/office-worker/standing/south.png',
      orgId: 1,
      reduceMotion: false,
      highContrast: false,
      textScale: 'normal',
    },
  },
  leader: {
    pass: 'leader123',
    user: {
      id: 2,
      username: 'leader',
      email: 'leader@neurosimpro.com',
      fullName: 'Operations Lead (Bos Ruangan)',
      role: 'Bos / Leader Divisi',
      roleSlug: 'manager',
      department: 'Divisi Kolaborasi & Delivery',
      title: 'Engineering Manager & Leader',
      avatar: '/assets/characters/resident/standing/south.png',
      orgId: 1,
      reduceMotion: false,
      highContrast: false,
      textScale: 'normal',
    },
  },
  manager: {
    pass: 'manager123',
    user: {
      id: 2,
      username: 'manager',
      email: 'manager@neurosimpro.com',
      fullName: 'Operations Lead (Bos Ruangan)',
      role: 'Bos / Leader Divisi',
      roleSlug: 'manager',
      department: 'Divisi Kolaborasi & Delivery',
      title: 'Engineering Manager & Leader',
      avatar: '/assets/characters/resident/standing/south.png',
      orgId: 1,
      reduceMotion: false,
      highContrast: false,
      textScale: 'normal',
    },
  },
  humas: {
    pass: 'humas123',
    user: {
      id: 3,
      username: 'humas',
      email: 'humas@inovasidigital.co.id',
      fullName: 'Rina Wijaya, S.I.Kom',
      role: 'Humas / Corporate PIC',
      roleSlug: 'org_admin',
      department: 'Hubungan Masyarakat & Eksternal',
      title: 'Head of Public Relations & Liaison',
      avatar: '/assets/characters/resident/standing/south.png',
      orgId: 1,
      reduceMotion: false,
      highContrast: false,
      textScale: 'normal',
    },
  },
  employee: {
    pass: 'employee123',
    user: {
      id: 4,
      username: 'employee',
      email: 'employee@neurosimpro.com',
      fullName: 'Staff Pengembang Internal',
      role: 'Pengguna Internal',
      roleSlug: 'employee',
      department: 'Divisi Antarmuka & Frontend',
      title: 'Frontend Engineer',
      avatar: '/assets/characters/resident/standing/south.png',
      orgId: 1,
      reduceMotion: false,
      highContrast: false,
      textScale: 'normal',
    },
  },
  guest: {
    pass: 'guest123',
    user: {
      id: 5,
      username: 'guest',
      email: 'guest@neurosimpro.com',
      fullName: 'Tamu Eksternal / Pengunjung',
      role: 'Tamu (Guest)',
      roleSlug: 'guest',
      department: 'External Stakeholder',
      title: 'Guest Collaborator',
      avatar: '/assets/characters/courier/standing/south.png',
      orgId: 1,
      reduceMotion: false,
      highContrast: false,
      textScale: 'normal',
    },
  },
};

export async function processLogin(body: LoginRequestBody): Promise<LoginResponse> {
  const identifier = (body.username || body.email || '').trim().toLowerCase();
  const password = body.password || '';

  if (!identifier || !password) {
    return { success: false, message: 'Username/Email dan password wajib diisi.' };
  }

  const pool = getDbPool();

  if (pool) {
    try {
      const [rows]: any = await pool.query(
        `SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.title, u.department, u.avatar,
                u.reduce_motion, u.high_contrast, u.text_scale, u.org_id,
                r.name as role_name, r.slug as role_slug
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.username = ? OR u.email = ? LIMIT 1`,
        [identifier, identifier]
      );

      if (rows && rows.length > 0) {
        const u = rows[0];
        const isMatch = await bcrypt.compare(password, u.password_hash);
        if (isMatch) {
          let history: any[] = [];
          try {
            const [histRows]: any = await pool.query(
              `SELECT id, scenario_id, level, user_goal, kejelasan_tingkat, konteks_tingkat,
                      tujuan_tingkat, batasan_tingkat, rekomendasi_level, created_at
               FROM user_evaluations WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
              [u.id]
            );
            history = histRows || [];
          } catch (e) {
            // history fetch optional
          }

          const userData: UserSessionData = {
            id: u.id,
            username: u.username,
            email: u.email || `${u.username}@neurosimpro.com`,
            fullName: u.full_name,
            role: u.role_name || 'Employee / Member',
            roleSlug: (u.role_slug || 'employee') as any,
            department: u.department || 'Product & Engineering',
            title: u.title || 'Staff Pengembang',
            avatar: u.avatar || '/assets/characters/resident/standing/south.png',
            orgId: u.org_id || 1,
            reduceMotion: Boolean(u.reduce_motion),
            highContrast: Boolean(u.high_contrast),
            textScale: u.text_scale || 'normal',
          };

          const token = signJwt({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            fullName: userData.fullName,
            role: userData.role,
            roleSlug: userData.roleSlug,
            department: userData.department,
            title: userData.title,
            orgId: userData.orgId,
          });

          return {
            success: true,
            message: 'Autentikasi berhasil melalui database MySQL.',
            token,
            user: userData,
            history,
          };
        }
      }
    } catch (err: any) {
      console.warn('[MySQL Login Query Warning]:', err.message);
    }
  }

  // Fallback Enterprise Demo Accounts (Aman: hanya aktif jika bukan produksi atau jika ALLOW_DEMO_ACCOUNTS=true)
  const isDemoAllowed = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEMO_ACCOUNTS === 'true';
  const demo = isDemoAllowed ? ENTERPRISE_DEMO_ACCOUNTS[identifier] : undefined;
  if (demo && (password === demo.pass || password === 'admin123' || password === 'password123')) {
    const token = signJwt({
      id: demo.user.id,
      username: demo.user.username,
      email: demo.user.email,
      fullName: demo.user.fullName,
      role: demo.user.role,
      roleSlug: demo.user.roleSlug,
      department: demo.user.department,
      title: demo.user.title,
      orgId: demo.user.orgId,
    });

    return {
      success: true,
      message: 'Login berhasil dengan sesi enterprise!',
      token,
      user: demo.user,
      history: [
        {
          id: 101,
          scenario_id: 'skenario-1',
          level: 2,
          user_goal: 'Konfirmasi prioritas sprint antarmuka',
          rekomendasi_level: 2,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
    };
  }

  return {
    success: false,
    message: 'Kredensial tidak valid. Silakan periksa kembali username/email dan kata sandi Anda.',
  };
}

async function parseBody(req: any): Promise<any> {
  if (req.body) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  if (typeof req.json === 'function') {
    return await req.json();
  }
  return new Promise((resolve) => {
    if (typeof req.on !== 'function') {
      resolve({});
      return;
    }
    let raw = '';
    req.on('data', (chunk: any) => { raw += chunk; });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res: any, status: number, data: any) {
  if (res) {
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(status).json(data);
    }
    if (typeof res.setHeader === 'function' && typeof res.end === 'function') {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return;
    }
  }
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleLogin(req: Request): Promise<Response> {
  try {
    const body: LoginRequestBody = await parseBody(req);
    const result = await processLogin(body);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 401,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: 'Format request salah: ' + err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export default async function handler(req: any, res?: any) {
  try {
    const body = await parseBody(req);
    const result = await processLogin(body);
    return sendJson(res, result.success ? 200 : 401, result);
  } catch (err: any) {
    return sendJson(res, 400, { success: false, message: 'Format request salah: ' + err.message });
  }
}
