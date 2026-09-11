import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Btn } from '../../components/ui/Btn';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

const emptyForm = { nome: '', email: '', telefone: '' };

export const TecnicosPanel = () => {
  const C = useTheme();
  const [tecnicos, setTecnicos] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [errMsg,   setErrMsg]   = useState(null);
  const [delErr,   setDelErr]   = useState(null);
  const [form,     setForm]     = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from('rbo_tecnicos').select('*').order('nome');
    setTecnicos(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setForm(emptyForm); setEditing(null); setErrMsg(null); setModal(true); };
  const openEdit = t  => { setForm({ nome: t.nome || '', email: t.email || '', telefone: t.telefone || '' }); setEditing(t); setErrMsg(null); setModal(true); };

  const save = async () => {
    const isUser = !!editing?.profile_id;
    if (!isUser && !form.nome) { setErrMsg('Nome é obrigatório'); return; }
    setSaving(true); setErrMsg(null);
    const payload = isUser ? { telefone: form.telefone || null } : { nome: form.nome, email: form.email || null, telefone: form.telefone || null };
    let err;
    if (editing) ({ error: err } = await sb.from('rbo_tecnicos').update(payload).eq('id', editing.id));
    else         ({ error: err } = await sb.from('rbo_tecnicos').insert([{ ...payload, ativo: true }]));
    if (err) { setErrMsg('Erro ao guardar: ' + err.message); setSaving(false); return; }
    await load();
    setSaving(false);
    setModal(false);
  };

  const toggleAtivo = async t => {
    await sb.from('rbo_tecnicos').update({ ativo: !t.ativo }).eq('id', t.id);
    await load();
  };

  const del = async t => {
    setDelErr(null);
    const { count } = await sb.from('rbo_movimentos').select('id', { count: 'exact', head: true }).eq('tecnico_id', t.id);
    if (count > 0) { setDelErr(`Este técnico está associado a ${count} movimento${count !== 1 ? 's' : ''} e não pode ser eliminado. Pode inativá-lo em alternativa.`); return; }
    if (!confirm('Eliminar técnico permanentemente?')) return;
    const { error } = await sb.from('rbo_tecnicos').delete().eq('id', t.id);
    if (error) setDelErr('Erro ao eliminar: ' + error.message);
    else await load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: C.grey400 }}>{tecnicos.length} técnico{tecnicos.length !== 1 ? 's' : ''}</span>
        <Btn icon="plus" size="sm" onClick={openNew}>Novo técnico</Btn>
      </div>

      {delErr && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', background: C.amber + '12', border: `1px solid ${C.amber}44`, borderRadius: 10, marginBottom: 16 }}>
          <Icon name="alert" size={16} color={C.amber}/>
          <span style={{ fontSize: 13, color: C.grey800, flex: 1 }}>{delErr}</span>
          <button onClick={() => setDelErr(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.grey400 }}><Icon name="close" size={14}/></button>
        </div>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <Loading/> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.grey100}` }}>
                  {['Nome', 'Email', 'Telefone', 'Origem', 'Estado', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', background: C.white, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tecnicos.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: C.grey400, fontSize: 13 }}>Sem técnicos</td></tr>
                )}
                {tecnicos.map(t => (
                  <tr key={t.id} style={{ borderBottom: `1px solid ${C.grey100}` }}
                    onMouseEnter={e => e.currentTarget.style.background = C.grey50}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 16px', color: C.grey800, fontWeight: 500, whiteSpace: 'nowrap' }}>{t.nome || '—'}</td>
                    <td style={{ padding: '10px 16px', color: C.grey600, fontSize: 13 }}>{t.email || '—'}</td>
                    <td style={{ padding: '10px 16px', color: C.grey600, fontSize: 13 }}>{t.telefone || '—'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <Badge color={t.profile_id ? C.teal : C.grey400}>{t.profile_id ? 'Utilizador' : 'Manual'}</Badge>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <Badge color={t.ativo ? C.green : C.grey400}>{t.ativo ? 'Ativo' : 'Inativo'}</Badge>
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button onClick={() => toggleAtivo(t)} title={t.ativo ? 'Inativar' : 'Ativar'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = C.grey100}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          <Icon name={t.ativo ? 'close' : 'eye'} size={14} color={t.ativo ? C.amber : C.green}/>
                        </button>
                        <button onClick={() => openEdit(t)} title="Editar"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = C.grey100}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          <Icon name="edit" size={14} color={C.teal}/>
                        </button>
                        {!t.profile_id && (
                          <button onClick={() => del(t)} title="Eliminar"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.background = C.grey100}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            <Icon name="trash" size={14} color={C.red}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal && (
        <Modal title={editing ? 'Editar técnico' : 'Novo técnico manual'} onClose={() => setModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {editing?.profile_id && (
              <div style={{ background: C.amber + '12', border: `1px solid ${C.amber}33`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: C.grey600, display: 'flex', gap: 8 }}>
                <Icon name="alert" size={14} color={C.amber}/>
                <span>Este técnico está ligado a um utilizador. Nome e email só podem ser alterados em Utilizadores.</span>
              </div>
            )}
            {editing?.profile_id ? (
              <>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.grey600, marginBottom: 5 }}>Nome</div>
                  <div style={{ padding: '8px 12px', background: C.grey50, borderRadius: 8, border: `1px solid ${C.grey100}`, fontSize: 14, color: C.grey500 }}>{form.nome || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.grey600, marginBottom: 5 }}>Email</div>
                  <div style={{ padding: '8px 12px', background: C.grey50, borderRadius: 8, border: `1px solid ${C.grey100}`, fontSize: 14, color: C.grey500 }}>{form.email || '—'}</div>
                </div>
              </>
            ) : (
              <>
                <Input label="Nome" value={form.nome} onChange={v => setForm(f => ({ ...f, nome: v }))} required/>
                <Input label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email"/>
              </>
            )}
            <Input label="Telefone" value={form.telefone} onChange={v => setForm(f => ({ ...f, telefone: v }))}/>
          </div>
          {errMsg && (
            <div style={{ marginTop: 12, background: C.red + '10', border: `1px solid ${C.red}33`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.red, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Icon name="alert" size={14} color={C.red}/>{errMsg}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <Btn variant="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? 'A guardar...' : 'Guardar'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};
