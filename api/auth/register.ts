import bcrypt from 'bcryptjs';
import { getDbPool } from '../../src/lib/db';
import { signJwt } from '../../src/lib/jwt';
import { UserSessionData } from './login';

export interface RegisterRequestBody {
  username: string;
  email?: string;
  password: string;
  fullName: string;
  role?: string;
  title?: string;
  department?: string;
  avatar?: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  user?: UserSessionData;
  token?: string;
}

export async function processRegister(body: RegisterRequestBody): Promise<RegisterResponse> {
  const { username, password, fullName } = body;
  const email = (body.email || `${username.trim().toLowerCase()}@neurosimpro.com`).trim().toLowerCase();
  const role = body.role || 'Employee / Member';
  const title = body.title || 'Staff Pengembang';
  const department = body.department || 'Divisi Antarmuka & Frontend';
  const avatar = body.avatar || '/assets/characters/resident/standing/south.png';

  if (!username || username.trim().length < 3) {
    return { success: false, message: 'Username minimal 3 karakter.' };
  }
  if (!password || password.length < 6) {
    return { success: false, message: 'Password minimal 6 karakter.' };
  }
  if (!fullName || fullName.trim().length < 2) {
    return { success: false, message: 'Nama lengkap wajib diisi.' };
  }

  const cleanUser = username.trim().toLowerCase();
  const pool = getDbPool();

  if (pool) {
    try {
      const [existing]: any = await pool.query(
        'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
        [cleanUser, email]
      );

      if (existing && existing.length > 0) {
        return { success: false, message: 'Username atau email sudah digunakan.' };
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const [result]: any = await pool.query(
        `INSERT INTO users (org_id, role_id, username, email, password_hash, full_name, title, department, avatar)
         VALUES (1, 4, ?, ?, ?, ?, ?, ?, ?)`,
        [cleanUser, email, passwordHash, fullName.trim(), title, department, avatar]
      );

      const newId = result.insertId;

      const newUser: UserSessionData = {
        id: newId,
        username: cleanUser,
        email,
        fullName: fullName.trim(),
        role,
        roleSlug: 'employee',
        department,
        title,
        avatar,
        orgId: 1,
        reduceMotion: false,
        highContrast: false,
        textScale: 'normal',
      };

      const token = signJwt({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        roleSlug: newUser.roleSlug,
        department: newUser.department,
        title: newUser.title,
        orgId: newUser.orgId,
      });

      return {
        success: true,
        message: 'Registrasi akun NeuroSim Pro berhasil!',
        token,
        user: newUser,
      };
    } catch (err: any) {
      console.warn('[Register MySQL Warning]:', err.message);
    }
  }

  // Fallback instant verified user for offline dev
  const fallbackId = Math.floor(1000 + Math.random() * 9000);
  const fallbackUser: UserSessionData = {
    id: fallbackId,
    username: cleanUser,
    email,
    fullName: fullName.trim(),
    role,
    roleSlug: 'employee',
    department,
    title,
    avatar,
    orgId: 1,
    reduceMotion: false,
    highContrast: false,
    textScale: 'normal',
  };

  const token = signJwt({
    id: fallbackUser.id,
    username: fallbackUser.username,
    email: fallbackUser.email,
    fullName: fallbackUser.fullName,
    role: fallbackUser.role,
    roleSlug: fallbackUser.roleSlug,
    department: fallbackUser.department,
    title: fallbackUser.title,
    orgId: fallbackUser.orgId,
  });

  return {
    success: true,
    message: 'ID Karyawan NeuroSim Pro berhasil diterbitkan!',
    token,
    user: fallbackUser,
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

export async function handleRegister(req: Request): Promise<Response> {
  try {
    const body: RegisterRequestBody = await parseBody(req);
    const result = await processRegister(body);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
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
    const result = await processRegister(body);
    return sendJson(res, result.success ? 200 : 400, result);
  } catch (err: any) {
    return sendJson(res, 400, { success: false, message: 'Format request salah: ' + err.message });
  }
}
