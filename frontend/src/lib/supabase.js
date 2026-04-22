import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

/**
 * Public client — uses the anon key that ships in the static bundle.
 * RLS on the `waitlist` table restricts this client to INSERT only.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Build an admin client at runtime using a service-role key that the site
 * owner pastes into the /admin page. The key is stored ONLY in localStorage
 * on the owner's browser — never committed, never shipped, never leaves the
 * machine unless the owner types it in.
 */
export function createAdminClient(serviceRoleKey) {
  if (!serviceRoleKey) return null;
  return createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const SUPABASE_PROJECT_URL = SUPABASE_URL;
