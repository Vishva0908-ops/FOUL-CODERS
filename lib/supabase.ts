import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Missing Supabase environment variables. NEXT_PUBLIC_SUPABASE_URL: ${!!supabaseUrl}, NEXT_PUBLIC_SUPABASE_ANON_KEY: ${!!supabaseAnonKey}`
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

export const supabase = {
  get auth() {
    return getSupabaseClient().auth;
  },
  from(table: string) {
    return getSupabaseClient().from(table);
  },
  channel(name: string) {
    return getSupabaseClient().channel(name);
  },
  removeChannel(channel: ReturnType<SupabaseClient["channel"]>) {
    return getSupabaseClient().removeChannel(channel);
  },
};
