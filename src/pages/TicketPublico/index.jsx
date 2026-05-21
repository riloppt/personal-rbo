import React, { useState, useEffect, useRef } from 'react';
import { sb } from '../../lib/supabase';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

// Define at module scope so it exists before the Turnstile script fires its onload
window.__rboTsReady = () => {};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const maskTelefone = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
};

const T = {
  teal:   '#1a7a7a', tealD:  '#0d5e5e', tealL:  '#2a9b9b',
  tealXL: '#e6f5f5', tealXXL:'#f0f9f9',
  white:  '#ffffff', grey50: '#f8fafb', grey100:'#eef2f3',
  grey200:'#d4dde0', grey400:'#8fa6ab', grey600:'#4a6468', grey800:'#1e3236',
  red:    '#e05a5a',
};

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes headerIn {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes circleIn {
    from { opacity: 0; transform: scale(.6); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes checkDraw {
    to { stroke-dashoffset: 0; }
  }
  @keyframes stepIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .pub-header { animation: headerIn .4s cubic-bezier(.22,.61,.36,1) both; }
  .pub-card   { animation: cardIn  .52s .08s cubic-bezier(.22,.61,.36,1) both; }

  .pub-input {
    border: 1.5px solid ${T.grey200};
    border-radius: 10px;
    padding: 11px 14px;
    font-size: 14px;
    line-height: 1.4;
    outline: none;
    background: ${T.white};
    color: ${T.grey800};
    width: 100%;
    font-family: 'DM Sans', sans-serif;
    transition: border-color .2s, box-shadow .2s;
    display: block;
  }
  .pub-input:focus {
    border-color: ${T.teal};
    box-shadow: 0 0 0 3px ${T.teal}1e;
  }
  .pub-input.err  { border-color: ${T.red}; }
  .pub-input::placeholder { color: ${T.grey400}; opacity: 1; }

  .pub-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  @media (max-width: 520px) {
    .pub-grid { grid-template-columns: 1fr; }
  }

  .pub-btn {
    width: 100%;
    background: ${T.teal};
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 13px 24px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background .2s, transform .15s, box-shadow .2s;
  }
  .pub-btn:hover:not(:disabled) {
    background: ${T.tealL};
    transform: translateY(-1px);
    box-shadow: 0 6px 24px ${T.teal}40;
  }
  .pub-btn:active:not(:disabled) { transform: translateY(0); }
  .pub-btn:disabled { opacity: .65; cursor: not-allowed; }

  .pub-step {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    animation: stepIn .35s ease both;
  }
  .pub-step:nth-child(1) { animation-delay: .5s; }
  .pub-step:nth-child(2) { animation-delay: .65s; }
  .pub-step:nth-child(3) { animation-delay: .8s; }
`;

function SectionBadge({ n, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
      <div style={{
        width:26, height:26, borderRadius:'50%',
        background: T.teal, color:'#fff',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:12, fontWeight:700, flexShrink:0,
      }}>{n}</div>
      <span style={{ fontSize:14, fontWeight:700, color:T.grey800, letterSpacing:'.1px' }}>{label}</span>
    </div>
  );
}

function Field({ label, value, onChange, onBlur, type='text', required, textarea, error, placeholder }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:12, fontWeight:600, color:T.grey600, textTransform:'uppercase', letterSpacing:'.5px' }}>
        {label}
        {required && <span style={{ color:T.teal, marginLeft:2 }}>*</span>}
      </label>
      {textarea
        ? <textarea
            value={value} rows={5} placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            onBlur={onBlur}
            className={`pub-input${error ? ' err' : ''}`}
            style={{ resize:'vertical', minHeight:120 }}
          />
        : <input
            type={type} value={value} placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            onBlur={onBlur}
            className={`pub-input${error ? ' err' : ''}`}
          />
      }
      {error && (
        <span style={{ fontSize:12, color:T.red, display:'flex', alignItems:'center', gap:4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </span>
      )}
    </div>
  );
}

export default function TicketPublico() {
  const [status,   setStatus]   = useState('idle');
  const [ticketId, setTicketId] = useState(null);
  const [form,     setForm]     = useState({
    nome_empresa:'', nome_pessoa:'', email_cliente:'',
    telefone_cliente:'', descricao_problema:'',
  });
  const [errors,   setErrors]   = useState({});
  const [honeypot, setHoneypot] = useState('');
  const [tsToken,  setTsToken]  = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const tsRef      = useRef(null);
  const tsWidgetId = useRef(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return; // skip if env var not configured

    const renderWidget = () => {
      if (!tsRef.current || tsWidgetId.current !== null) return;
      tsWidgetId.current = window.turnstile.render(tsRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        size: 'invisible',
        callback: (token) => setTsToken(token),
        'expired-callback': () => setTsToken(null),
        'error-callback': () => setTsToken(null),
      });
    };

    // Override the module-scope no-op with the real handler
    window.__rboTsReady = renderWidget;

    // Script may have already fired before this effect ran
    if (window.turnstile) renderWidget();

    return () => {
      window.__rboTsReady = () => {};
      if (tsWidgetId.current !== null && window.turnstile) {
        window.turnstile.remove(tsWidgetId.current);
        tsWidgetId.current = null;
      }
    };
  }, []);

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const handleEmailBlur = () => {
    const val = form.email_cliente.trim();
    if (!val) return;
    if (!EMAIL_RE.test(val)) {
      setErrors(prev => ({ ...prev, email_cliente: 'Email inválido' }));
    } else {
      setErrors(prev => { const { email_cliente, ...rest } = prev; return rest; });
    }
  };

  const validate = () => {
    const e = {};
    if (!form.nome_empresa.trim())       e.nome_empresa = 'Campo obrigatório';
    if (!form.nome_pessoa.trim())        e.nome_pessoa = 'Campo obrigatório';
    if (!form.email_cliente.trim())      e.email_cliente = 'Campo obrigatório';
    else if (!EMAIL_RE.test(form.email_cliente.trim())) e.email_cliente = 'Email inválido';
    if (!form.descricao_problema.trim()) e.descricao_problema = 'Campo obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    // Honeypot check — silent fake success
    if (honeypot) { setTicketId(9999); setStatus('success'); return; }

    if (!validate()) return;

    // Turnstile check (skip if not configured — e.g. env var missing)
    if (TURNSTILE_SITE_KEY && !tsToken) {
      if (window.turnstile && tsWidgetId.current !== null) {
        window.turnstile.execute(tsWidgetId.current);
      }
      setErrorMsg('Verificação pendente, tente novamente.');
      return;
    }

    setErrorMsg(null);
    setStatus('submitting');
    try {
      const { data, error } = await sb.functions.invoke('submit-ticket', {
        body: {
          ts_token:           tsToken,
          nome_empresa:       form.nome_empresa.trim(),
          nome_pessoa:        form.nome_pessoa.trim(),
          email_cliente:      form.email_cliente.trim(),
          telefone_cliente:   form.telefone_cliente.trim() || null,
          descricao_problema: form.descricao_problema.trim(),
        },
      });
      if (error) throw error;
      setTicketId(data.id);
      setStatus('success');
    } catch (err) {
      console.error(err);
      // Reset Turnstile token so next attempt gets a fresh one
      if (window.turnstile && tsWidgetId.current !== null) {
        window.turnstile.reset(tsWidgetId.current);
      }
      setTsToken(null);
      setStatus('error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: T.tealXXL,
      backgroundImage: `radial-gradient(circle, ${T.teal}12 1px, transparent 1px)`,
      backgroundSize: '28px 28px',
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      <style>{STYLES}</style>

      {/* ── Header ── */}
      <header className="pub-header" style={{
        background: T.tealD,
        padding: '0 28px', height: 60, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 20px #00000025',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:34, height:34, borderRadius:9,
            background:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0,
          }}>
            <svg width="18" height="18" viewBox="0 0 50 50" fill="none">
              <path d="M8 42 C8 42 8 8 8 8 C8 4 12 4 12 4 C12 4 28 4 28 4 C42 4 42 18 34 22 C42 26 44 42 30 42 Z" fill={T.tealD}/>
            </svg>
          </div>
          <span style={{ color:'#fff', fontWeight:800, fontSize:17, letterSpacing:'.4px' }}>rilop</span>
        </div>
        <span style={{ color:'#7abfbf', fontSize:13, fontWeight:500 }}>Pedido de Assistência</span>
      </header>

      {/* ── Main ── */}
      <main style={{
        flex:1,
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'flex-start',
        padding:'48px 20px 60px',
        position:'relative',
      }}>
        {/* Ambient glow */}
        <div style={{
          position:'fixed', top:'15%', left:'50%',
          transform:'translateX(-50%)',
          width:800, height:500,
          background:`radial-gradient(ellipse, ${T.teal}07 0%, transparent 65%)`,
          pointerEvents:'none', zIndex:0,
        }}/>

        <div className="pub-card" style={{ width:'100%', maxWidth:600, position:'relative', zIndex:1 }}>

          {/* Above-card title */}
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <h1 style={{
              fontSize:28, fontWeight:800, color:T.grey800,
              letterSpacing:'-.4px', marginBottom:8,
            }}>
              Precisa de ajuda?
            </h1>
            <p style={{ fontSize:14, color:T.grey400, lineHeight:1.65 }}>
              Preencha o formulário e a nossa equipa contacta-o brevemente.
            </p>
          </div>

          {status === 'success' ? (

            /* ── Success state ── */
            <div style={{
              background:T.white, borderRadius:20,
              border:`1px solid ${T.grey100}`,
              padding:'48px 40px',
              textAlign:'center',
              boxShadow:'0 8px 48px #0d5e5e10, 0 2px 8px #0d5e5e08',
            }}>
              {/* Check circle */}
              <div style={{
                width:76, height:76, borderRadius:'50%',
                background:`linear-gradient(135deg, ${T.tealXL}, ${T.tealXXL})`,
                border:`2px solid ${T.teal}28`,
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 24px',
                animation:'circleIn .4s cubic-bezier(.34,1.46,.64,1) both',
              }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                  stroke={T.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path
                    d="M4 12.5 L9 17.5 L20 6.5"
                    pathLength="1"
                    style={{
                      strokeDasharray: 1,
                      strokeDashoffset: 1,
                      animation: 'checkDraw .5s .3s ease forwards',
                    }}
                  />
                </svg>
              </div>

              <h2 style={{ fontSize:24, fontWeight:800, color:T.grey800, letterSpacing:'-.2px', marginBottom:10 }}>
                Pedido recebido!
              </h2>
              <p style={{ color:T.grey400, fontSize:14, lineHeight:1.7, marginBottom:32 }}>
                O seu pedido foi registado com sucesso.<br/>
                Receberá uma resposta da nossa equipa em breve.
              </p>

              {/* Reference badge */}
              <div style={{
                background:`linear-gradient(135deg, ${T.tealXXL}, ${T.tealXL})`,
                borderRadius:14, padding:'20px 36px',
                display:'inline-block',
                border:`1.5px solid ${T.teal}22`,
                marginBottom:32,
              }}>
                <div style={{ fontSize:10, color:T.teal, fontWeight:700, textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:6 }}>
                  Referência do pedido
                </div>
                <div style={{ fontSize:34, fontWeight:800, color:T.tealD, fontFamily:"'DM Mono', monospace", letterSpacing:'2px' }}>
                  #{String(ticketId).padStart(4, '0')}
                </div>
              </div>

              {/* Next steps */}
              <div style={{
                background:T.grey50, borderRadius:14,
                border:`1px solid ${T.grey100}`,
                padding:'20px 24px', textAlign:'left',
              }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.grey800, textTransform:'uppercase', letterSpacing:'.6px', marginBottom:14 }}>
                  O que acontece agora?
                </div>
                {[
                  'A nossa equipa analisa o seu pedido',
                  'Entraremos em contacto pelo email fornecido',
                  'Agendamos a resolução do problema consigo',
                ].map((step, i) => (
                  <div key={i} className="pub-step" style={{ marginTop: i > 0 ? 10 : 0 }}>
                    <div style={{
                      width:22, height:22, borderRadius:'50%',
                      background:T.teal, color:'#fff',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:11, fontWeight:700, flexShrink:0, marginTop:1,
                    }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize:13, color:T.grey600, lineHeight:1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

          ) : (

            /* ── Form ── */
            <div style={{
              background:T.white, borderRadius:20,
              border:`1px solid ${T.grey100}`,
              overflow:'hidden',
              boxShadow:'0 8px 48px #0d5e5e10, 0 2px 8px #0d5e5e08',
            }}>

              {/* Section 1 — Contact info */}
              <div style={{ padding:'28px 32px', borderBottom:`1px solid ${T.grey100}` }}>
                <SectionBadge n="1" label="Os seus dados"/>
                <div className="pub-grid">
                  <Field label="Empresa" value={form.nome_empresa} onChange={set('nome_empresa')}
                    required error={errors.nome_empresa} placeholder="Nome da empresa"/>
                  <Field label="Pessoa de Contacto" value={form.nome_pessoa} onChange={set('nome_pessoa')}
                    required error={errors.nome_pessoa} placeholder="O seu nome"/>
                  <Field label="Email" value={form.email_cliente} onChange={set('email_cliente')}
                    onBlur={handleEmailBlur}
                    type="email" required error={errors.email_cliente} placeholder="email@empresa.pt"/>
                  <Field label="Telefone" value={form.telefone_cliente}
                    onChange={v => setForm(f => ({ ...f, telefone_cliente: maskTelefone(v) }))}
                    placeholder="XXX XXX XXX"/>
                </div>
              </div>

              {/* Section 2 — Problem */}
              <div style={{ padding:'28px 32px', borderBottom:`1px solid ${T.grey100}` }}>
                <SectionBadge n="2" label="Descreva o problema"/>
                <Field
                  label="Descrição"
                  value={form.descricao_problema}
                  onChange={set('descricao_problema')}
                  textarea required
                  error={errors.descricao_problema}
                  placeholder="Descreva o problema com o máximo de detalhe — equipamento afetado, quando ocorreu, mensagens de erro..."
                />
              </div>

              {/* Honeypot — invisible to real users, must not be display:none */}
              <div aria-hidden="true" style={{ position:'absolute', left:'-9999px', top:0, width:1, height:1, overflow:'hidden' }}>
                <input
                  type="text" name="website" tabIndex={-1} autoComplete="off"
                  value={honeypot} onChange={e => setHoneypot(e.target.value)}
                />
              </div>

              {/* Turnstile invisible widget mount point */}
              <div ref={tsRef}/>

              {/* Form footer — submit */}
              <div style={{ padding:'24px 32px' }}>
                {(status === 'error' || errorMsg) && (
                  <div style={{
                    marginBottom:16, padding:'11px 16px',
                    background:'#e05a5a0f', borderRadius:10,
                    border:'1px solid #e05a5a33',
                    fontSize:13, color:T.red,
                    display:'flex', alignItems:'center', gap:8,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {errorMsg || 'Ocorreu um erro. Por favor tente novamente.'}
                  </div>
                )}

                <button className="pub-btn" onClick={submit} disabled={status === 'submitting'}>
                  {status === 'submitting' ? (
                    <>
                      <span style={{
                        width:15, height:15,
                        border:'2px solid #ffffff50', borderTopColor:'#fff',
                        borderRadius:'50%',
                        animation:'spin .7s linear infinite',
                        display:'inline-block', flexShrink:0,
                      }}/>
                      A enviar...
                    </>
                  ) : (
                    <>
                      Enviar Pedido
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  )}
                </button>

                <p style={{ marginTop:12, fontSize:11, color:T.grey400, textAlign:'center' }}>
                  Os campos marcados com <span style={{ color:T.teal, fontWeight:600 }}>*</span> são obrigatórios
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        padding:'18px 20px', textAlign:'center',
        color:T.grey400, fontSize:12, flexShrink:0,
        borderTop:`1px solid ${T.grey100}`,
        background:T.white,
      }}>
        Rilop — Informática e Comunicação
      </footer>
    </div>
  );
}
