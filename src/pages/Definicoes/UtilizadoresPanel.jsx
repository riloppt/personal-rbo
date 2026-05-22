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

const getInitials = (nome, email) => {
  if (nome) {
    const parts = nome.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return (email || '?').slice(0, 2).toUpperCase();
};

const Avatar = ({ nome, email, avatar_url, size = 32 }) => {
  const C = useTheme();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatar_url ? 'transparent' : `${C.teal}22`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, overflow: 'hidden', border: `1.5px solid ${C.teal}33`,
    }}>
      {avatar_url
        ? <img src={avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        : <span style={{ fontSize: size * 0.35, fontWeight: 700, color: C.teal }}>
            {getInitials(nome, email)}
          </span>
      }
    </div>
  );
};

export const UtilizadoresPanel = ({ currentUserId }) => {
  const C = useTheme();
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [errMsg,       setErrMsg]       = useState(null);
  const [form,         setForm]         = useState({ email: '', nome: '', password: '', is_tecnico: false, avatar_url: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from('rbo_profiles').select('*').order('nome');
    setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleAtivo = async user => {
    if (user.id === currentUserId) { setErrMsg('Não podes desativar a tua própria conta.'); return; }
    await sb.from('rbo_profiles').update({ ativo: !user.ativo }).eq('id', user.id);
    await load();
  };

  const openEdit = user => {
    setForm({ id: user.id, nome: user.nome || '', email: user.email || '', password: '', is_tecnico: !!user.is_tecnico, avatar_url: user.avatar_url || '' });
    setErrMsg(null);
    setModal('edit');
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !form.id) return;
    setUploading(true);
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `${form.id}.${ext}`;
    const { error: upErr } = await sb.storage.from('photos').upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setErrMsg('Erro ao carregar foto: ' + upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = sb.storage.from('photos').getPublicUrl(path);
    setForm(f => ({ ...f, avatar_url: `${publicUrl}?t=${Date.now()}` }));
    setUploading(false);
  };

  const removeAvatar = () => setForm(f => ({ ...f, avatar_url: '' }));

  const saveUser = async () => {
    if (!form.id) return;
    setSaving(true); setErrMsg(null);
    const { error: profErr } = await sb.from('rbo_profiles')
      .update({ nome: form.nome || null, is_tecnico: form.is_tecnico, avatar_url: form.avatar_url || null })
      .eq('id', form.id);
    if (profErr) { setErrMsg('Erro ao guardar: ' + profErr.message); setSaving(false); return; }
    if (form.password && form.id === currentUserId) {
      const { error: passErr } = await sb.auth.updateUser({ password: form.password });
      if (passErr) { setErrMsg('Perfil guardado mas erro na password: ' + passErr.message); setSaving(false); await load(); return; }
    }
    await load();
    setSaving(false);
    setModal(false);
  };

  const createUser = async () => {
    if (!form.email || !form.password) return;
    setSaving(true); setErrMsg(null);
    const { data, error } = await sb.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) { setErrMsg('Erro: ' + error.message); setSaving(false); return; }
    const uid = data?.user?.id;
    if (uid) {
      await sb.from('rbo_profiles').upsert({
        id: uid, email: form.email,
        nome: form.nome || null,
        ativo: true,
        is_tecnico: form.is_tecnico,
      });
    }
    await load();
    setSaving(false);
    setModal(false);
    setForm({ email: '', nome: '', password: '', is_tecnico: false, avatar_url: '' });
  };

  const closeModal = () => { setModal(false); setErrMsg(null); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: C.grey400 }}>{users.length} utilizador{users.length !== 1 ? 'es' : ''}</span>
        <Btn icon="plus" size="sm" onClick={() => { setForm({ email: '', nome: '', password: '', is_tecnico: false, avatar_url: '' }); setErrMsg(null); setModal('new'); }}>Novo</Btn>
      </div>

      {errMsg && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', background: C.amber + '12', border: `1px solid ${C.amber}44`, borderRadius: 10, marginBottom: 16 }}>
          <Icon name="alert" size={16} color={C.amber}/>
          <span style={{ fontSize: 13, color: C.grey800, flex: 1 }}>{errMsg}</span>
          <button onClick={() => setErrMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.grey400 }}><Icon name="close" size={14}/></button>
        </div>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <Loading/> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.grey100}` }}>
                  {['Nome', 'Email', 'Técnico', 'Estado', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', background: C.white, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: C.grey400, fontSize: 13 }}>Sem utilizadores</td></tr>
                )}
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${C.grey100}`, transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.grey50}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 16px', color: C.grey800, fontWeight: 500, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar nome={u.nome} email={u.email} avatar_url={u.avatar_url} size={32}/>
                        <span>
                          {u.nome || '—'}
                          {u.id === currentUserId && <span style={{ marginLeft: 8, fontSize: 11, background: C.teal + '22', color: C.teal, borderRadius: 10, padding: '1px 8px', fontWeight: 600 }}>Tu</span>}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', color: C.grey600, fontSize: 13 }}>{u.email}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <Badge color={u.is_tecnico ? C.teal : C.grey400}>{u.is_tecnico ? 'Técnico' : '—'}</Badge>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <Badge color={u.ativo ? C.green : C.grey400}>{u.ativo ? 'Ativo' : 'Inativo'}</Badge>
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        {u.id !== currentUserId && (
                          <button onClick={() => toggleAtivo(u)} title={u.ativo ? 'Inativar' : 'Ativar'}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'background .15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = C.grey100}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            <Icon name={u.ativo ? 'close' : 'eye'} size={14} color={u.ativo ? C.amber : C.green}/>
                          </button>
                        )}
                        <button onClick={() => openEdit(u)} title="Editar"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'background .15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = C.grey100}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          <Icon name="edit" size={14} color={C.teal}/>
                        </button>
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
        <Modal title={modal === 'edit' ? 'Editar utilizador' : 'Novo utilizador'} onClose={closeModal}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Avatar — só no modo editar */}
            {modal === 'edit' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '8px 0 4px' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
                  background: form.avatar_url ? 'transparent' : `${C.teal}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${C.teal}33`,
                }}>
                  {form.avatar_url
                    ? <img src={form.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    : <span style={{ fontSize: 24, fontWeight: 700, color: C.teal }}>{getInitials(form.nome, form.email)}</span>
                  }
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <label style={{ cursor: uploading ? 'wait' : 'pointer' }}>
                    <span style={{ fontSize: 13, color: C.teal, textDecoration: 'underline', fontWeight: 500 }}>
                      {uploading ? 'A carregar...' : form.avatar_url ? 'Alterar foto' : 'Adicionar foto'}
                    </span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading} onChange={handleAvatarChange}/>
                  </label>
                  {form.avatar_url && !uploading && (
                    <button onClick={removeAvatar} style={{ fontSize: 12, color: C.grey400, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                      Remover
                    </button>
                  )}
                </div>
              </div>
            )}

            <Input label="Nome" value={form.nome} onChange={v => setForm(f => ({ ...f, nome: v }))} placeholder="Nome completo"/>
            {modal === 'edit' ? (
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.grey600, marginBottom: 5 }}>Email</div>
                <div style={{ padding: '8px 12px', background: C.grey50, borderRadius: 8, border: `1px solid ${C.grey100}`, fontSize: 14, color: C.grey500 }}>{form.email || '—'}</div>
                <div style={{ fontSize: 11, color: C.grey400, marginTop: 4 }}>O email não pode ser alterado aqui</div>
              </div>
            ) : (
              <Input label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" placeholder="email@empresa.pt" required/>
            )}
            {(modal === 'new' || form.id === currentUserId) && (
              <Input label={modal === 'edit' ? 'Nova password (deixar em branco para não alterar)' : 'Password'}
                value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))}
                type="password" placeholder={modal === 'edit' ? '••••••••' : 'Mínimo 6 caracteres'}
                required={modal === 'new'}/>
            )}
            {modal === 'edit' && form.id !== currentUserId && (
              <div style={{ background: C.amber + '12', border: `1px solid ${C.amber}33`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: C.grey600, display: 'flex', gap: 8 }}>
                <Icon name="alert" size={14} color={C.amber}/>
                <span>A password só pode ser alterada pelo próprio utilizador.</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: C.grey50, borderRadius: 8, border: `1px solid ${C.grey100}` }}>
              <input type="checkbox" id="frm_is_tecnico" checked={!!form.is_tecnico} onChange={e => setForm(f => ({ ...f, is_tecnico: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: C.teal, cursor: 'pointer' }}/>
              <label htmlFor="frm_is_tecnico" style={{ fontSize: 14, color: C.grey800, cursor: 'pointer' }}>
                É <strong>técnico</strong> (aparece na seleção de assistências)
              </label>
            </div>
          </div>
          {errMsg && (
            <div style={{ marginTop: 12, background: C.red + '10', border: `1px solid ${C.red}33`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.red, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Icon name="alert" size={14} color={C.red}/>{errMsg}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <Btn variant="secondary" onClick={closeModal}>Cancelar</Btn>
            <Btn onClick={modal === 'edit' ? saveUser : createUser}
              disabled={saving || uploading || (modal === 'new' && (!form.email || !form.password))}>
              {saving ? (modal === 'edit' ? 'A guardar...' : 'A criar...') : (modal === 'edit' ? 'Guardar' : 'Criar utilizador')}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};
