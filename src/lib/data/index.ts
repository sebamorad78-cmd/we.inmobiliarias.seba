import "server-only";
import type { Repository } from "./repository";
import { jsonRepository } from "./json-store";
import { supabaseRepository } from "./supabase-store";

export const usingSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export const repo: Repository = usingSupabase ? supabaseRepository : jsonRepository;
