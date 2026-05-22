import { sb } from './supabase';

export const sendEmailResend = async ({ to, cc, bcc, subject, html }) => {
  const { data, error } = await sb.functions.invoke('ticket-submitted', {
    body: { to, cc, bcc, subject, html },
  });
  if (error) throw error;
  return data;
};
