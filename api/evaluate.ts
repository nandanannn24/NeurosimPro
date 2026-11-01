import { getDbPool } from '../src/lib/db';
import {
  evaluateDeterministicSession,
  DeterministicEvaluation,
} from '../src/services/scenarioEngine';

export interface EvaluateRequestBody {
  scenarioId: string;
  level?: 1 | 2 | 3;
  userGoal?: string;
  transcript: Array<{ speaker: string; text: string }>;
  userId?: number;
}

async function saveEvaluationToDb(
  userId: number,
  scenarioId: string,
  level: number,
  userGoal: string,
  result: DeterministicEvaluation,
  transcript: any[]
) {
  try {
    const pool = getDbPool();
    if (!pool) return;

    await pool.query(
      `INSERT INTO user_evaluations (
        user_id, scenario_id, level, user_goal,
        kejelasan_tingkat, kejelasan_umpan_balik,
        konteks_tingkat, konteks_umpan_balik,
        tujuan_tingkat, tujuan_umpan_balik,
        batasan_tingkat, batasan_umpan_balik,
        rekomendasi_level, rekomendasi_alasan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        scenarioId,
        level,
        userGoal,
        result.kejelasan_pesan.tingkat,
        result.kejelasan_pesan.alasan,
        result.pemahaman_konteks.tingkat,
        result.pemahaman_konteks.alasan,
        result.ketercapaian_tujuan.tingkat,
        result.ketercapaian_tujuan.alasan,
        result.rasa_hormat_dan_batasan.tingkat,
        result.rasa_hormat_dan_batasan.alasan,
        result.rekomendasi_level === 'naik' ? 3 : result.rekomendasi_level === 'turun' ? 1 : 2,
        result.maksud_tersembunyi_karakter,
      ]
    );
  } catch (err: any) {
    console.warn('[DB Save Evaluation Error]:', err.message);
  }
}

export async function processEvaluate(body: EvaluateRequestBody): Promise<DeterministicEvaluation> {
  const scenarioId = body.scenarioId || 'skenario-1';
  const level = (body.level === 1 || body.level === 2 || body.level === 3) ? body.level : 2;
  const userGoal = body.userGoal || '';
  const transcript = Array.isArray(body.transcript) ? body.transcript : [];
  const userId = body.userId;

  const result = evaluateDeterministicSession(scenarioId, userGoal, transcript, level);

  if (userId) {
    saveEvaluationToDb(userId, scenarioId, level, userGoal, result, transcript);
  }

  return result;
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

export async function handleEvaluate(req: Request): Promise<Response> {
  try {
    const body: EvaluateRequestBody = await parseBody(req);
    const result = await processEvaluate(body);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Gagal memproses evaluasi: ' + error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export default async function handler(req: any, res?: any) {
  try {
    const body = await parseBody(req);
    const result = await processEvaluate(body);
    return sendJson(res, 200, result);
  } catch (error: any) {
    return sendJson(res, 500, { error: 'Gagal memproses evaluasi: ' + error.message });
  }
}
