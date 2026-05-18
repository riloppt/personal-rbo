import { createClient } from '@supabase/supabase-js';

const SUPA_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPA_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const sb = createClient(SUPA_URL, SUPA_ANON);
