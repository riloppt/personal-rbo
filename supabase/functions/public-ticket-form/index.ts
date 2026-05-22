import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
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

const buildEmailHtml = (id: number, nome_empresa: string, nome_pessoa: string, email_cliente: string, telefone_cliente: string, descricao_problema: string, created_at: string) => {
  const idPadded = String(id).padStart(4, '0');
  const dataFormatada = new Date(created_at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const field = (label: string, value: string) => `
    <div>
      <div style="font-size:10px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${label}</div>
      <div style="font-size:14px;color:#1a1a1a;">${value || '—'}</div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,0.08);overflow:hidden;">

        <tr><td style="background:#0d3d3d;padding:28px 32px;">
          <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Rilop</div>
          <div style="font-size:13px;color:#4d9898;margin-top:2px;">BackOffice de Assistência</div>
        </td></tr>

        <tr><td style="padding:28px 32px 20px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:38px;font-weight:800;color:#0d5e5e;letter-spacing:-1px;line-height:1;">#${idPadded}</td>
            <td style="padding-left:16px;vertical-align:middle;">
              <div style="background:#e6f5f5;color:#0d6e6e;font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;padding:5px 12px;border-radius:20px;white-space:nowrap;">Novo Pedido</div>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:0 32px;"><div style="height:1px;background:#f0f0f0;"></div></td></tr>

        <tr><td style="padding:24px 32px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding-right:20px;padding-bottom:20px;">${field('Empresa', nome_empresa)}</td>
              <td width="50%" style="padding-bottom:20px;">${field('Pessoa de Contacto', nome_pessoa)}</td>
            </tr>
            <tr>
              <td width="50%" style="padding-right:20px;padding-bottom:20px;">${field('Email', email_cliente)}</td>
              <td width="50%" style="padding-bottom:20px;">${field('Telefone', telefone_cliente)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding-bottom:20px;">${field('Submetido em', dataFormatada)}</td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 32px;"><div style="height:1px;background:#f0f0f0;"></div></td></tr>

        <tr><td style="padding:24px 32px 28px;">
          <div style="font-size:10px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Descrição do Problema</div>
          <div style="background:#f9f9f9;border-left:3px solid #0d6e6e;border-radius:0 6px 6px 0;padding:14px 16px;font-size:14px;color:#333333;line-height:1.6;white-space:pre-wrap;">${descricao_problema || '—'}</div>
        </td></tr>

        <tr><td style="padding:0 32px 36px;text-align:center;">
          <a href="https://rbo-gules.vercel.app" style="display:inline-block;background:#0d6e6e;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 32px;border-radius:8px;letter-spacing:0.2px;">Abrir no RBO</a>
        </td></tr>

        <tr><td style="background:#0d3d3d;padding:18px 32px;text-align:center;">
          <div style="font-size:12px;color:#4d9898;">Rilop · noreply@rilop.pt</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });

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
        status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

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

    // Envio de email — consulta configuração de notificações
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      try {
        const { data: notifConfig } = await sb
          .from('rbo_notificacoes_config')
          .select('ativa, destinatario_principal, destinatarios')
          .eq('evento', 'ticket_novo')
          .maybeSingle();

        const ativa = notifConfig?.ativa ?? true;
        const principal: string = notifConfig?.destinatario_principal ?? '';
        const destinatarios: string[] = notifConfig?.destinatarios ?? [];

        if (!ativa) {
          console.log('[email] ticket_novo desativada — email não enviado');
        } else if (!principal) {
          console.log('[email] ticket_novo sem destinatário principal — email não enviado');
        } else {
          const cc = destinatarios.filter(e => e !== principal);
          const emailBody: Record<string, unknown> = {
            from: 'Rilop <noreply@rilop.pt>',
            to: [principal],
            subject: `Novo pedido de assistência #${String(ticket.id).padStart(4, '0')}`,
            html: buildEmailHtml(
              ticket.id,
              nome_empresa?.trim() ?? '',
              nome_pessoa?.trim() ?? '',
              email_cliente?.trim() ?? '',
              telefone_cliente?.trim() ?? '',
              descricao_problema?.trim() ?? '',
              ticket.created_at,
            ),
          };
          if (cc.length) emailBody.cc = cc;
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
            body: JSON.stringify(emailBody),
          });
          const emailData = await emailRes.json();
          if (!emailRes.ok) console.error('[email] Resend error:', JSON.stringify(emailData));
          else console.log('[email] sent to:', principal, cc.length ? `cc: ${cc}` : '', emailData?.id);
        }
      } catch (emailErr) {
        console.error('[email] fetch error:', emailErr);
      }
    }

    return new Response(JSON.stringify({ id: ticket.id }), {
      status: 200, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Erro interno. Tente novamente.' }), {
      status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
