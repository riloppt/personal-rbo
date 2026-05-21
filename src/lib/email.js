const RESEND_KEY  = import.meta.env.VITE_RESEND_KEY;
const RESEND_FROM = 'Rilop <noreply@rilop.pt>';

export const sendEmailResend = async ({ to, subject, html }) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, html }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Erro ao enviar email');
  return data;
};
