import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { to, cc, bcc, subject, html } = await req.json();

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) throw new Error('RESEND_API_KEY not configured');

    const body: Record<string, unknown> = {
      from: 'Rilop <noreply@rilop.pt>',
      to: [to],
      subject,
      html,
    };
    if (cc?.length)  body.cc  = cc;
    if (bcc?.length) body.bcc = bcc;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[send-email] Resend error:', JSON.stringify(data));
      throw new Error(data?.message || 'Resend error');
    }

    return new Response(JSON.stringify(data), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[send-email]', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
