export type Role = 'PLANNER' | 'OPS' | 'AUDITOR' | 'EXEC';

const TOKEN_KEY = 'groundops.token';
const ROLE_KEY = 'groundops.role';

const encoder = new TextEncoder();

function base64Url(input: ArrayBuffer | string) {
  const bytes = typeof input === 'string' ? encoder.encode(input) : new Uint8Array(input);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return base64Url(signature);
}

export async function createToken(role: Role) {
  const secret = import.meta.env.VITE_JWT_SECRET || 'local-dev-secret-32-bytes-minimum!';
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iss: 'groundops-ui',
    sub: `demo-${role.toLowerCase()}`,
    roles: [role],
    iat: now,
    exp: now + 60 * 60 * 8,
  };

  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signature = await sign(unsigned, secret);
  return `${unsigned}.${signature}`;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRole(): Role | null {
  return (localStorage.getItem(ROLE_KEY) as Role | null) ?? null;
}

export function storeAuth(role: Role, token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}
