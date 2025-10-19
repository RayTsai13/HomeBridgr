import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Accept either env var name for the service role secret
const serviceKey =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  // Fail fast with a clear message instead of surfacing opaque RLS errors
  throw new Error(
    "Supabase admin client missing required env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY)."
  );
}

export const supabaseAdmin = createClient(url, serviceKey);
