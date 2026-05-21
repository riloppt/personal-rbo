import { sb } from './supabase';

export const sendEmailResend = async ({ to, subject, html }) => {
  const { data, error } = await sb.functions.invoke('ticket-submitted', {
    body: { to, subject, html },
  });
  if (error) throw error;
  return data;
};
