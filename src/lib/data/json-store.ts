import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Lead, Property, TeamUser } from "../types";
import type { Repository } from "./repository";
import { seedProperties, seedUsers } from "./seed";

interface Db {
  properties: Property[];
  users: TeamUser[];
  leads: Lead[];
}

const DB_PATH = path.join(process.cwd(), "data", "db.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

let cache: Db | null = null;
let queue: Promise<unknown> = Promise.resolve();
/** En hostings sin disco escribible (Netlify, Vercel) el modo local queda en memoria: sirve para una demo. */
let readOnly = false;

async function load(): Promise<Db> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(DB_PATH, "utf8")) as Db;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    cache = { properties: seedProperties(), users: seedUsers(), leads: [] };
    await persist(cache);
  }
  return cache;
}

async function persist(db: Db) {
  if (readOnly) return;
  try {
    await write(db);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "EROFS" && code !== "EACCES" && code !== "EPERM" && code !== "ENOENT") throw err;
    readOnly = true;
    console.warn("[datos] disco de solo lectura: modo demostración en memoria. Configurá Supabase para producción.");
  }
}

async function write(db: Db) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const tmp = `${DB_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, DB_PATH); // escritura atómica: nunca queda un archivo a medio escribir
}

/** Serializa escrituras para evitar condiciones de carrera entre requests simultáneos. */
function mutate<T>(fn: (db: Db) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const result = fn(db);
    await persist(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

function upsert<T extends { id: string }>(arr: T[], item: T) {
  const i = arr.findIndex((x) => x.id === item.id);
  if (i >= 0) arr[i] = item;
  else arr.push(item);
}

const clone = <T>(v: T): T => structuredClone(v);

export const jsonRepository: Repository = {
  async listProperties() {
    return clone((await load()).properties);
  },
  async getProperty(id) {
    return clone((await load()).properties.find((p) => p.id === id) ?? null);
  },
  async getPropertyBySlug(slug) {
    return clone((await load()).properties.find((p) => p.slug === slug) ?? null);
  },
  saveProperty: (p) => mutate((db) => (upsert(db.properties, p), clone(p))),
  deleteProperty: (id) =>
    mutate((db) => {
      db.properties = db.properties.filter((p) => p.id !== id);
    }),

  async listUsers() {
    return clone((await load()).users);
  },
  async getUser(id) {
    return clone((await load()).users.find((u) => u.id === id) ?? null);
  },
  async getUserByEmail(email) {
    const e = email.trim().toLowerCase();
    return clone((await load()).users.find((u) => u.email.toLowerCase() === e) ?? null);
  },
  saveUser: (u) => mutate((db) => (upsert(db.users, u), clone(u))),

  async listLeads() {
    return clone((await load()).leads);
  },
  async getLead(id) {
    return clone((await load()).leads.find((l) => l.id === id) ?? null);
  },
  saveLead: (l) => mutate((db) => (upsert(db.leads, l), clone(l))),

  async uploadImage(file, folder) {
    const ext = (file.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
    const dir = path.join(UPLOAD_DIR, folder.replace(/[^a-z0-9-]/gi, ""));
    await fs.mkdir(dir, { recursive: true });
    const name = `${randomUUID()}.${ext}`;
    await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    return `/uploads/${path.basename(dir)}/${name}`;
  },
};
