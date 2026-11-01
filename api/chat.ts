import { getDeterministicReply } from '../src/services/scenarioEngine';

export interface ChatRequestBody {
  scenarioId: string;
  level?: 1 | 2 | 3;
  transcript: Array<{ speaker: string; text: string }>;
}

export interface ChatResponseBody {
  reply: string;
}

export async function processChat(body: ChatRequestBody): Promise<ChatResponseBody> {
  const scenarioId = body.scenarioId || 'skenario-1';
  const level = (body.level === 1 || body.level === 2 || body.level === 3) ? body.level : 2;
  const transcript = Array.isArray(body.transcript) ? body.transcript : [];

  try {
    const reply = getDeterministicReply(scenarioId, transcript, level);
    return { reply };
  } catch (error) {
    console.error('[API Chat] Error in deterministic scenario reply:', error);
    return { reply: 'Baik, tolong lanjutkan tugasnya ya.' };
  }
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

export async function handleChat(req: Request): Promise<Response> {
  try {
    const body: ChatRequestBody = await parseBody(req);
    const result = await processChat(body);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ reply: 'Baik, silakan lanjutkan tugasnya ya.' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export default async function handler(req: any, res?: any) {
  try {
    const body = await parseBody(req);
    const result = await processChat(body);
    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, 200, { reply: 'Baik, silakan lanjutkan tugasnya ya.' });
  }
}
