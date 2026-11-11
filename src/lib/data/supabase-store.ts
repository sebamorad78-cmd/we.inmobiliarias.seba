import "server-only";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Lead, Property, TeamUser } from "../types";
import type { Repository } from "./repository";

type Row = Record<string, unknown>;

const camelToSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const snakeToCamel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

function toRow(obj: object): Row {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [camelToSnake(k), v]));
}
function fromRow<T>(row: Row): T {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [snakeToCamel(k), v]),
  ) as T;
}

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

async function all<T>(table: string, order: string): Promise<T[]> {
  const { data, error } = await db().from(table).select("*").order(order, { ascending: false });
  if (error) throw new Error(`[supabase] ${table}: ${error.message}`);
  return (data ?? []).map((r) => fromRow<T>(r));
}

async function one<T>(table: string, column: string, value: string): Promise<T | null> {
  const { data, error } = await db().from(table).select("*").eq(column, value).maybeSingle();
  if (error) throw new Error(`[supabase] ${table}: ${error.message}`);
  return data ? fromRow<T>(data) : null;
}

async function save<T extends object>(table: string, item: T): Promise<T> {
  const { error } = await db().from(table).upsert(toRow(item));
  if (error) throw new Error(`[supabase] ${table}: ${error.message}`);
  return item;
}

export const supabaseRepository: Repository = {
  listProperties: () => all<Property>("properties", "created_at"),
  getProperty: (id) => one<Property>("properties", "id", id),
  getPropertyBySlug: (slug) => one<Property>("properties", "slug", slug),
  saveProperty: (p) => save("properties", p),
  async deleteProperty(id) {
    const { error } = await db().from("properties").delete().eq("id", id);
    if (error) throw new Error(`[supabase] properties: ${error.message}`);
  },

  listUsers: () => all<TeamUser>("team_users", "created_at"),
  getUser: (id) => one<TeamUser>("team_users", "id", id),
  async getUserByEmail(email) {
    const { data, error } = await db().from("team_users").select("*").ilike("email", email.trim()).maybeSingle();
    if (error) throw new Error(`[supabase] team_users: ${error.message}`);
    return data ? fromRow<TeamUser>(data) : null;
  },
  saveUser: (u) => save("team_users", u),

  listLeads: () => all<Lead>("leads", "created_at"),
  getLead: (id) => one<Lead>("leads", "id", id),
  saveLead: (l) => save("leads", l),

  async uploadImage(file, folder) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "propiedades";
    const ext = (file.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
    const key = `${folder}/${randomUUID()}.${ext}`;
    const { error } = await db()
      .storage.from(bucket)
      .upload(key, await file.arrayBuffer(), { contentType: file.type, cacheControl: "31536000", upsert: false });
    if (error) throw new Error(`[supabase] storage: ${error.message}`);
    return db().storage.from(bucket).getPublicUrl(key).data.publicUrl;
  },
};
