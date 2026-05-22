import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Btn } from '../../components/ui/Btn';
import { Loading } from '../../components/ui/Loading';
import { Input } from '../../components/ui/Input';

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

const NotificacaoCard = ({ config, onUpdate }) => {
  const C = useTheme();
  const [inputEmail,     setInputEmail]     = useState('');
  const [emailError,     setEmailError]     = useState('');
  const [adding,         setAdding]         = useState(false);
  const [principal,      setPrincipal]      = useState(config.destinatario_principal || '');
  const [principalError, setPrincipalError] = useState('');
  const [savingPrincipal, setSavingPrincipal] = useState(false);

  const toggleAtivo = async () => {
    const { error } = await sb
      .from('rbo_notificacoes_config')
      .update({ ativa: !config.ativa })
      .eq('id', config.id);
    if (!error) onUpdate({ ...config, ativa: !config.ativa });
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
    setAdding(true);
    setEmailError('');
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
    <Card style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.grey800, marginBottom: 3 }}>{config.nome}</div>
          <div style={{ fontSize: 13, color: C.grey400, lineHeight: 1.4 }}>{config.descricao}</div>
        </div>
        <Toggle checked={!!config.ativa} onChange={toggleAtivo}/>
      </div>

      {config.enviar_cliente !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Toggle checked={!!config.enviar_cliente} onChange={toggleEnviarCliente}/>
          <span style={{ fontSize: 13, color: C.grey600 }}>Notificar também o cliente</span>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
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

      <div style={{ marginBottom: config.destinatarios.length > 0 ? 14 : 0 }}>
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
    </Card>
  );
};

export const NotificacoesPanel = () => {
  const C = useTheme();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limiar, setLimiar] = useState('');
  const [savingLimiar, setSavingLimiar] = useState(false);
  const [savedLimiar, setSavedLimiar] = useState(false);

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

  const updateConfig = updated => {
    setConfigs(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.grey600, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 14 }}>
          Notificações
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {configs.length === 0 && (
            <Card style={{ padding: '32px', textAlign: 'center' }}>
              <span style={{ fontSize: 13, color: C.grey400 }}>Sem notificações configuradas.</span>
            </Card>
          )}
          {configs.map(c => (
            <NotificacaoCard key={c.id} config={c} onUpdate={updateConfig}/>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.grey600, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 14 }}>
          Configurações Globais
        </div>
        <Card style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.grey800, marginBottom: 16 }}>Configurações Globais</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <div style={{ flex: 1, maxWidth: 280 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.grey600, marginBottom: 6 }}>
                Alertar quando créditos abaixo de
              </div>
              <input
                type="number"
                value={limiar}
                onChange={e => setLimiar(e.target.value)}
                min={0}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '8px 12px', borderRadius: 8, fontSize: 14,
                  border: `1.5px solid ${C.grey200}`,
                  background: C.white, color: C.grey800, fontFamily: "'DM Sans',sans-serif",
                  outline: 'none',
                }}
              />
            </div>
            <Btn onClick={saveLimiar} disabled={savingLimiar}>
              {savedLimiar ? 'Guardado' : savingLimiar ? 'A guardar...' : 'Guardar'}
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
};
