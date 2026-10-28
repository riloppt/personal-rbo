import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Keep in sync with ADMIN_EMAIL in src/lib/permissions.js
const ADMIN_EMAIL = 'sergiohenriques@graficaideal.pt';

const ALLOWED_ORIGINS =(Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',').map(s => s.trim()).filter(Boolean);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const base: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  if (ALLOWED_ORIGINS.includes(origin)) base['Access-Control-Allow-Origin'] = origin;
  return base;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });

  // Verify caller is an authenticated RBO user
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }

  const sbAnon = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user: caller } } = await sbAnon.auth.getUser();
  if (!caller) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }

  // Service role bypasses RLS — upsert profile for any user id
  const sbAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Caller must be allowed to manage users — mirrors checkPermission(…, 'access_definicoes') in src/lib/permissions.js
  const [{ data: callerProfile }, { data: perm }] = await Promise.all([
    sbAdmin.from('rbo_profiles').select('email, ativo, is_supervisor').eq('id', caller.id).maybeSingle(),
    sbAdmin.from('rbo_permissions').select('ativo_supervisor, ativo_normal').eq('chave', 'access_definicoes').maybeSingle(),
  ]);
  const allowed = !!callerProfile?.ativo && (
    callerProfile.email === ADMIN_EMAIL ||
    (callerProfile.is_supervisor ? !!perm?.ativo_supervisor : !!perm?.ativo_normal)
  );
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Sem permissão' }), {
      status: 403, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }

  try {
    const { uid, email, nome, is_tecnico } = await req.json();
    if (!uid || !email) throw new Error('uid e email são obrigatórios');

    const { error } = await sbAdmin.from('rbo_profiles').upsert({
      id: uid,
      email,
      nome: nome || null,
      ativo: true,
      is_tecnico: !!is_tecnico,
    }, { onConflict: 'id' });

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[create-user]', err);
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
