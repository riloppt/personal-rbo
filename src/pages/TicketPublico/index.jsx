import React, { useState } from 'react';
import { sb } from '../../lib/supabase';

const T = {
  teal: '#1a7a7a', tealD: '#0d5e5e', tealXL: '#e6f5f5',
  white: '#ffffff', grey50: '#f8fafb', grey100: '#eef2f3',
  grey200: '#d4dde0', grey400: '#8fa6ab', grey600: '#4a6468', grey800: '#1e3236',
  red: '#e05a5a',
};

const baseInp = {
  border: `1.5px solid ${T.grey200}`, borderRadius: 8, padding: '8px 12px',
  fontSize: 14, outline: 'none', background: T.white, color: T.grey800,
  width: '100%', fontFamily: "'DM Sans', sans-serif",
};

function Field({ label, value, onChange, type = 'text', required, textarea, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: T.grey600 }}>
        {label}{required && <span style={{ color: T.red }}> *</span>}
      </label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={4}
            style={{ ...baseInp, height: 'auto', resize: 'vertical', borderColor: error ? T.red : T.grey200 }}/>
        : <input type={type} value={value} onChange={e => onChange(e.target.value)}
            style={{ ...baseInp, height: 38, borderColor: error ? T.red : T.grey200 }}/>
      }
      {error && <span style={{ fontSize: 12, color: T.red }}>{error}</span>}
    </div>
  );
}

export default function TicketPublico() {
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [ticketId, setTicketId] = useState(null);
  const [form, setForm] = useState({ nome_empresa: '', nome_pessoa: '', email_cliente: '', telefone_cliente: '', descricao_problema: '' });
  const [errors, setErrors] = useState({});

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.nome_empresa.trim())      e.nome_empresa = 'Campo obrigatório';
    if (!form.nome_pessoa.trim())       e.nome_pessoa = 'Campo obrigatório';
    if (!form.email_cliente.trim())     e.email_cliente = 'Campo obrigatório';
    if (!form.descricao_problema.trim()) e.descricao_problema = 'Campo obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setStatus('submitting');
    try {
      const { data: ticket, error } = await sb.from('rbo_tickets').insert([{
        tipo: 'publico', estado: 'submetido',
        nome_empresa:      form.nome_empresa.trim(),
        nome_pessoa:       form.nome_pessoa.trim(),
        email_cliente:     form.email_cliente.trim(),
        telefone_cliente:  form.telefone_cliente.trim() || null,
        descricao_problema: form.descricao_problema.trim(),
      }]).select().single();
      if (error) throw error;
      await sb.from('rbo_ticket_historico').insert([{
        ticket_id: ticket.id, estado_anterior: null, estado_novo: 'submetido',
        alterado_por_id: null, nota: 'Submetido via formulário público',
      }]);
      setTicketId(ticket.id);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.grey50, fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>

      {/* Header */}
      <div style={{ background: T.tealD, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', flexShrink: 0, boxShadow: '0 2px 12px #00000020' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 50 50" fill="none">
              <path d="M8 42 C8 42 8 8 8 8 C8 4 12 4 12 4 C12 4 28 4 28 4 C42 4 42 18 34 22 C42 26 44 42 30 42 Z" fill={T.tealD}/>
            </svg>
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>rilop</span>
          <span style={{ color: '#7abfbf', fontSize: 13, marginLeft: 8 }}>Pedido de Assistência</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 580, animation: 'fadeIn .3s ease' }}>
          {status === 'success' ? (
            <div style={{ background: T.white, borderRadius: 16, border: `1px solid ${T.grey100}`, padding: 40, textAlign: 'center', boxShadow: '0 4px 24px #0d5e5e10' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.tealXL, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 12 4 10"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: T.grey800, marginBottom: 10 }}>Pedido recebido!</h2>
              <p style={{ color: T.grey600, fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                O seu pedido foi recebido. Entraremos em contacto brevemente.
              </p>
              <div style={{ background: T.tealXL, borderRadius: 10, padding: '14px 28px', display: 'inline-block', border: `1px solid ${T.teal}22` }}>
                <div style={{ fontSize: 11, color: T.teal, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Referência do pedido</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: T.tealD, fontFamily: "'DM Mono', monospace" }}>
                  #{String(ticketId).padStart(4, '0')}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: T.white, borderRadius: 16, border: `1px solid ${T.grey100}`, padding: 32, boxShadow: '0 4px 24px #0d5e5e10' }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: T.grey800, marginBottom: 6 }}>Pedido de Assistência Técnica</h1>
              <p style={{ fontSize: 14, color: T.grey400, marginBottom: 28 }}>
                Preencha o formulário abaixo e entraremos em contacto brevemente.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Nome da Empresa"       value={form.nome_empresa}      onChange={set('nome_empresa')}      required error={errors.nome_empresa}/>
                <Field label="Pessoa de Contacto"    value={form.nome_pessoa}       onChange={set('nome_pessoa')}       required error={errors.nome_pessoa}/>
                <Field label="Email"                 value={form.email_cliente}     onChange={set('email_cliente')}     type="email" required error={errors.email_cliente}/>
                <Field label="Telefone"              value={form.telefone_cliente}  onChange={set('telefone_cliente')}/>
                <Field label="Descrição do Problema" value={form.descricao_problema} onChange={set('descricao_problema')} textarea required error={errors.descricao_problema}/>
              </div>

              {status === 'error' && (
                <div style={{ marginTop: 16, padding: '10px 16px', background: '#e05a5a15', borderRadius: 8, border: '1px solid #e05a5a44', fontSize: 13, color: T.red }}>
                  Ocorreu um erro ao submeter o pedido. Por favor tente novamente.
                </div>
              )}

              <button onClick={submit} disabled={status === 'submitting'}
                style={{ marginTop: 24, width: '100%', background: status === 'submitting' ? T.grey400 : T.teal, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: status === 'submitting' ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all .15s' }}>
                {status === 'submitting' ? 'A enviar...' : 'Enviar Pedido'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '20px', textAlign: 'center', color: T.grey400, fontSize: 12, flexShrink: 0 }}>
        Rilop — Serviços de Tecnologia de Informação
      </div>
    </div>
  );
}
