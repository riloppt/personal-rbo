import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { ts_token, nome_empresa, nome_pessoa, email_cliente, telefone_cliente, descricao_problema } = await req.json();

    // Validate Turnstile token
    const fd = new FormData();
    fd.append('secret', Deno.env.get('TURNSTILE_SECRET_KEY') ?? '');
    fd.append('response', ts_token ?? '');

    const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: fd });
    const tsData = await tsRes.json();

    if (!tsData.success) {
      return new Response(JSON.stringify({ error: 'Verificação falhou. Tente novamente.' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Insert using service role key (bypasses RLS)
    const sb = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: ticket, error } = await sb.from('rbo_tickets').insert([{
      tipo: 'publico', estado: 'submetido',
      nome_empresa:       nome_empresa?.trim(),
      nome_pessoa:        nome_pessoa?.trim(),
      email_cliente:      email_cliente?.trim(),
      telefone_cliente:   telefone_cliente?.trim() || null,
      descricao_problema: descricao_problema?.trim(),
    }]).select().single();

    if (error) throw error;

    await sb.from('rbo_ticket_historico').insert([{
      ticket_id: ticket.id, estado_anterior: null, estado_novo: 'submetido',
      alterado_por_id: null, nota: 'Submetido via formulário público',
    }]);

    return new Response(JSON.stringify({ id: ticket.id }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Erro interno. Tente novamente.' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
