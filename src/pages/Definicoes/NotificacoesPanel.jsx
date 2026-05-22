import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Btn } from '../../components/ui/Btn';
import { Loading } from '../../components/ui/Loading';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Toggle = ({ checked, onChange }) => {
  const C = useTheme();
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', width: 44, height: 24, borderRadius: 12, border: 'none',
        background: checked ? C.teal : C.grey200, cursor: 'pointer', flexShrink: 0,
        transition: 'background .2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,.2)', transition: 'left .2s',
      }}/>
    </button>
  );
};

const RecipientBadge = ({ email, onRemove }) => {
  const C = useTheme();
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: C.tealXL, color: C.tealD, borderRadius: 20,
      padding: '3px 10px 3px 12px', fontSize: 12, fontWeight: 500,
      border: `1px solid ${C.tealM}`,
    }}>
      {email}
      <button
        onClick={onRemove}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: C.teal, display: 'flex', alignItems: 'center', padding: 0, lineHeight: 1,
        }}
        title="Remover"
      >
        <Icon name="close" size={12} color={C.teal}/>
      </button>
    </span>
  );
};

const NotificacaoCard = ({ config, onUpdate, limiar, setLimiar, saveLimiar, savingLimiar, savedLimiar }) => {
  const C = useTheme();
  const [inputEmail,      setInputEmail]      = useState('');
  const [emailError,      setEmailError]      = useState('');
  const [adding,          setAdding]          = useState(false);
  const [principal,       setPrincipal]       = useState(config.destinatario_principal || '');
  const [principalError,  setPrincipalError]  = useState('');
  const [savingPrincipal, setSavingPrincipal] = useState(false);

  const ativa = !!config.ativa;

  const toggleAtivo = async () => {
    const { error } = await sb
      .from('rbo_notificacoes_config')
      .update({ ativa: !ativa })
      .eq('id', config.id);
    if (!error) onUpdate({ ...config, ativa: !ativa });
  };

  const toggleEnviarCliente = async () => {
    const { error } = await sb
      .from('rbo_notificacoes_config')
      .update({ enviar_cliente: !config.enviar_cliente })
      .eq('id', config.id);
    if (!error) onUpdate({ ...config, enviar_cliente: !config.enviar_cliente });
  };

  const savePrincipal = async () => {
    const email = principal.trim().toLowerCase();
    if (email && !EMAIL_RE.test(email)) { setPrincipalError('Email inválido'); return; }
    setSavingPrincipal(true); setPrincipalError('');
    const { error } = await sb
      .from('rbo_notificacoes_config')
      .update({ destinatario_principal: email || null })
      .eq('id', config.id);
    if (!error) onUpdate({ ...config, destinatario_principal: email || null });
    setSavingPrincipal(false);
  };

  const removeDestinatario = async (email) => {
    const novos = config.destinatarios.filter(e => e !== email);
    const { error } = await sb
      .from('rbo_notificacoes_config')
      .update({ destinatarios: novos })
      .eq('id', config.id);
    if (!error) onUpdate({ ...config, destinatarios: novos });
  };

  const addDestinatario = async () => {
    const email = inputEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) { setEmailError('Email inválido'); return; }
    if (config.destinatarios.includes(email)) { setEmailError('Este email já existe'); return; }
    setAdding(true); setEmailError('');
    const novos = [...config.destinatarios, email];
    const { error } = await sb
      .from('rbo_notificacoes_config')
      .update({ destinatarios: novos })
      .eq('id', config.id);
    if (!error) { onUpdate({ ...config, destinatarios: novos }); setInputEmail(''); }
    setAdding(false);
  };

  const handleKey = e => { if (e.key === 'Enter') addDestinatario(); };

  return (
    <Card style={{
      padding: 0, overflow: 'hidden',
      borderLeft: `4px solid ${ativa ? C.teal : C.grey200}`,
      transition: 'border-color .2s',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, padding: '16px 20px',
        borderBottom: ativa ? `1px solid ${C.grey100}` : 'none',
        background: ativa ? C.white : C.grey50,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: ativa ? C.grey800 : C.grey400 }}>
              {config.nome}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '.4px',
              padding: '2px 8px', borderRadius: 20,
              background: ativa ? C.teal + '18' : C.grey200,
              color: ativa ? C.teal : C.grey400,
            }}>
              {ativa ? 'Ativa' : 'Inativa'}
            </span>
          </div>
          <div style={{ fontSize: 13, color: C.grey400, lineHeight: 1.4 }}>{config.descricao}</div>
        </div>
        <Toggle checked={ativa} onChange={toggleAtivo}/>
      </div>

      {/* Body — only shown when active */}
      {ativa && (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Limiar — apenas para créditos baixos */}
          {config.evento === 'creditos_baixos' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
                Limiar de alerta
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  value={limiar}
                  onChange={e => setLimiar(e.target.value)}
                  min={0}
                  placeholder="ex: 5"
                  style={{
                    width: 100, padding: '7px 12px', borderRadius: 8, fontSize: 13,
                    border: `1.5px solid ${C.grey200}`, background: C.white,
                    color: C.grey800, fontFamily: "'DM Sans',sans-serif", outline: 'none',
                  }}
                />
                <span style={{ fontSize: 13, color: C.grey400 }}>créditos</span>
                <Btn size="sm" onClick={saveLimiar} disabled={savingLimiar}>
                  {savedLimiar ? 'Guardado' : savingLimiar ? 'A guardar...' : 'Guardar'}
                </Btn>
              </div>
            </div>
          )}

          {/* Notificar cliente — apenas para créditos baixos */}
          {config.evento === 'creditos_baixos' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Toggle checked={!!config.enviar_cliente} onChange={toggleEnviarCliente}/>
              <span style={{ fontSize: 13, color: C.grey600 }}>Notificar o cliente</span>
            </div>
          )}

          {/* Destinatário principal — não mostrar para créditos baixos */}
          {config.evento !== 'creditos_baixos' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
                Destinatário principal (Para:)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="email"
                    value={principal}
                    onChange={e => { setPrincipal(e.target.value); setPrincipalError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') savePrincipal(); }}
                    placeholder="principal@email.pt"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '7px 12px', borderRadius: 8, fontSize: 13,
                      border: `1.5px solid ${principalError ? C.red : C.grey200}`,
                      background: C.white, color: C.grey800, fontFamily: "'DM Sans',sans-serif",
                      outline: 'none',
                    }}
                  />
                  {principalError && <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{principalError}</div>}
                </div>
                <Btn size="sm" onClick={savePrincipal} disabled={savingPrincipal}>
                  {savingPrincipal ? 'A guardar…' : 'Guardar'}
                </Btn>
              </div>
            </div>
          )}

          {/* CC */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
              CC
            </div>
            {config.destinatarios.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {config.destinatarios.map(email => (
                  <RecipientBadge key={email} email={email} onRemove={() => removeDestinatario(email)}/>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="email"
                  value={inputEmail}
                  onChange={e => { setInputEmail(e.target.value); setEmailError(''); }}
                  onKeyDown={handleKey}
                  placeholder="cc@email.pt"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '7px 12px', borderRadius: 8, fontSize: 13,
                    border: `1.5px solid ${emailError ? C.red : C.grey200}`,
                    background: C.white, color: C.grey800, fontFamily: "'DM Sans',sans-serif",
                    outline: 'none',
                  }}
                />
                {emailError && <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{emailError}</div>}
              </div>
              <Btn size="sm" onClick={addDestinatario} disabled={adding || !inputEmail}>
                Adicionar
              </Btn>
            </div>
          </div>

        </div>
      )}
    </Card>
  );
};

export const NotificacoesPanel = () => {
  const C = useTheme();
  const [configs,       setConfigs]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [limiar,        setLimiar]        = useState('');
  const [savingLimiar,  setSavingLimiar]  = useState(false);
  const [savedLimiar,   setSavedLimiar]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: notifs }, { data: globais }] = await Promise.all([
      sb.from('rbo_notificacoes_config').select('*').order('nome'),
      sb.from('rbo_definicoes_globais').select('*').eq('chave', 'creditos_limiar_alerta').maybeSingle(),
    ]);
    setConfigs(notifs || []);
    setLimiar(globais?.valor ?? '');
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateConfig = updated => setConfigs(prev => prev.map(c => c.id === updated.id ? updated : c));

  const saveLimiar = async () => {
    setSavingLimiar(true);
    await sb.from('rbo_definicoes_globais').upsert(
      { chave: 'creditos_limiar_alerta', valor: limiar },
      { onConflict: 'chave' }
    );
    setSavingLimiar(false);
    setSavedLimiar(true);
    setTimeout(() => setSavedLimiar(false), 2000);
  };

  if (loading) return <Loading/>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {configs.length === 0 && (
        <Card style={{ padding: '32px', textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: C.grey400 }}>Sem notificações configuradas.</span>
        </Card>
      )}
      {configs.map(c => (
        <NotificacaoCard
          key={c.id}
          config={c}
          onUpdate={updateConfig}
          limiar={limiar}
          setLimiar={setLimiar}
          saveLimiar={saveLimiar}
          savingLimiar={savingLimiar}
          savedLimiar={savedLimiar}
        />
      ))}
    </div>
  );
};
