import "server-only";
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { repo } from "./data";
import type { TeamUser } from "./types";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

const COOKIE = "rb_session";
const MAX_AGE = 60 * 60 * 12; // 12 h
const DUMMY_HASH = `scrypt$${"A".repeat(22)}$${"A".repeat(86)}`;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = await scrypt(password, Buffer.from(salt, "base64url"), expected.length);
  return timingSafeEqual(expected, actual);
}

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET no está configurado (mínimo 32 caracteres).");
  }
  return "dev-only-secret-change-me-before-deploying-0000";
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export async function createSession(userId: string) {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE * 1000 })).toString(
    "base64url",
  );
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Usuario administrador definido por variables de entorno (ADMIN_EMAIL / ADMIN_PASSWORD). */
export const ENV_ADMIN_ID = "usr_admin";

function envAdmin(): TeamUser | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email || !process.env.ADMIN_PASSWORD) return null;
  return {
    id: ENV_ADMIN_ID,
    name: "Administración",
    email,
    phone: "",
    role: "admin",
    title: "Administración",
    license: null,
    bio: "",
    active: true,
    public: false,
    passwordHash: "",
    createdAt: new Date(0).toISOString(),
  };
}

export async function currentUser(): Promise<TeamUser | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid: string; exp: number };
    if (Date.now() > exp) return null;
    const user = await repo.getUser(uid);
    if (user) return user.active ? user : null;
    // El administrador de las variables de entorno existe aunque el almacenamiento todavía no lo tenga
    // (por ejemplo, en servidores que no comparten memoria).
    if (uid === ENV_ADMIN_ID) return envAdmin();
    return null;
  } catch {
    return null;
  }
}

/** Usar al inicio de cada página o acción del panel. */
export async function requireUser(role?: "admin"): Promise<TeamUser> {
  const user = await currentUser();
  if (!user) redirect("/panel/ingresar");
  if (role === "admin" && user.role !== "admin") redirect("/panel");
  return user;
}

/**
 * Autentica contra la base. Si todavía no hay ningún usuario con contraseña,
 * crea el administrador inicial a partir de ADMIN_EMAIL / ADMIN_PASSWORD.
 */
export async function authenticate(email: string, password: string): Promise<TeamUser | null> {
  const normalized = email.trim().toLowerCase();
  const admin = envAdmin();

  // Administrador de las variables de entorno: siempre puede ingresar (también sirve de acceso de recuperación).
  if (admin && normalized === admin.email) {
    const ok = timingSafeEqualStr(password, process.env.ADMIN_PASSWORD!);
    if (ok) {
      const stored = await repo.getUser(ENV_ADMIN_ID);
      if (stored) return stored.active ? stored : null;
      try {
        return await repo.saveUser({ ...admin, passwordHash: await hashPassword(password), createdAt: new Date().toISOString() });
      } catch {
        return admin;
      }
    }
  }

  const user = await repo.getUserByEmail(normalized);
  // Siempre se calcula un hash, exista o no el email: el tiempo de respuesta no revela nada.
  const ok = await verifyPassword(password, user?.passwordHash || DUMMY_HASH);
  return ok && user?.active ? user : null;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}
