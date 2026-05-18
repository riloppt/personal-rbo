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

export const UtilizadoresPanel = ({ currentUserId }) => {
  const C = useTheme();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [errMsg,  setErrMsg]  = useState(null);
  const [form,    setForm]    = useState({email:"",nome:"",password:"",is_tecnico:false});

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("rbo_profiles").select("*").order("created_at");
    setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleAtivo = async (user) => {
    if (user.id === currentUserId) { setErrMsg("Não podes desativar a tua própria conta."); return; }
    await sb.from("rbo_profiles").update({ ativo: !user.ativo }).eq("id", user.id);
    await load();
  };

  const toggleTecnico = async (user) => {
    await sb.from("rbo_profiles").update({ is_tecnico: !user.is_tecnico }).eq("id", user.id);
    await load();
  };

  const openEdit = (user) => {
    setForm({id:user.id, nome:user.nome||"", email:user.email||"", password:"", is_tecnico:user.is_tecnico});
    setErrMsg(null);
    setModal("edit");
  };

  const saveUser = async () => {
    if (!form.id) return;
    setSaving(true); setErrMsg(null);
    // Update profile
    const { error: profErr } = await sb.from("rbo_profiles")
      .update({ nome: form.nome||null, email: form.email||null })
      .eq("id", form.id);
    if (profErr) { setErrMsg("Erro ao guardar: " + profErr.message); setSaving(false); return; }
    // Update password only for own account
    if (form.password && form.id === currentUserId) {
      const { error: passErr } = await sb.auth.updateUser({ password: form.password });
      if (passErr) { setErrMsg("Perfil guardado mas erro na password: " + passErr.message); setSaving(false); await load(); return; }
    }
    await load();
    setSaving(false);
    setModal(false);
    setForm({email:"",nome:"",password:"",is_tecnico:false});
  };

  const deleteUser = async (user) => {
    if (user.id === currentUserId) { setErrMsg("Não podes eliminar a tua própria conta."); return; }
    // Verificar se tem movimentos associados
    const { count } = await sb.from("rbo_movimentos")
      .select("id", { count: "exact", head: true })
      .eq("profile_tecnico_id", user.id);
    if (count > 0) {
      setErrMsg(`Não é possível eliminar "${user.nome||user.email}" porque tem ${count} movimento${count!==1?"s":""} associado${count!==1?"s":""}. Podes inativá-lo em alternativa.`);
      return;
    }
    if (!confirm(`Eliminar o utilizador "${user.nome||user.email}"? Esta acção não pode ser desfeita.`)) return;
    await sb.from("rbo_profiles").delete().eq("id", user.id);
    await load();
  };

  const createUser = async () => {
    if (!form.email || !form.password) return;
    setSaving(true); setErrMsg(null);
    // Criar conta no Supabase Auth (sem enviar email)
    const { data, error } = await sb.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: null },
    });
    if (error) { setErrMsg("Erro: " + error.message); setSaving(false); return; }
    const uid = data?.user?.id;
    if (uid) {
      await sb.from("rbo_profiles").upsert({
        id: uid, email: form.email,
        nome: form.nome || null,
        ativo: true,
        is_tecnico: form.is_tecnico,
      });
    }
    await load();
    setSaving(false);
    setModal(false);
    setForm({email:"",nome:"",password:"",is_tecnico:false});
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <span style={{fontSize:13,color:C.grey400}}>{users.length} utilizador{users.length!==1?"es":""}</span>
        <Btn icon="userPlus" size="sm" onClick={()=>{setForm({email:"",nome:"",password:"",is_tecnico:false});setErrMsg(null);setModal("new");}}>Novo utilizador</Btn>
      </div>

      {errMsg && (
        <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 16px",background:C.amber+"12",border:`1px solid ${C.amber}44`,borderRadius:10,marginBottom:16}}>
          <Icon name="alert" size={16} color={C.amber}/>
          <span style={{fontSize:13,color:C.grey800,flex:1}}>{errMsg}</span>
          <button onClick={()=>setErrMsg(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.grey400}}><Icon name="close" size={14}/></button>
        </div>
      )}

      <Card style={{padding:0,overflow:"hidden"}}>
        {loading ? <Loading/> : (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${C.grey100}`}}>
                  {["Nome","Email","Técnico","Estado",""].map(h=>(
                    <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:12,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px",background:C.white,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length===0 && (
                  <tr><td colSpan={5} style={{padding:"32px 16px",textAlign:"center",color:C.grey400,fontSize:13}}>Sem utilizadores</td></tr>
                )}
                {users.map(u=>(
                  <tr key={u.id} style={{borderBottom:`1px solid ${C.grey100}`,transition:"background .1s"}}
                    onMouseEnter={e=>e.currentTarget.style.background=C.grey50}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"13px 16px",color:C.grey800,fontWeight:500,whiteSpace:"nowrap"}}>
                      {u.nome || "—"}
                      {u.id === currentUserId && <span style={{marginLeft:8,fontSize:11,background:C.teal+"22",color:C.teal,borderRadius:10,padding:"1px 8px",fontWeight:600}}>Tu</span>}
                    </td>
                    <td style={{padding:"13px 16px",color:C.grey600,fontSize:13}}>{u.email}</td>
                    <td style={{padding:"13px 16px"}}>
                      <button onClick={()=>toggleTecnico(u)} title={u.is_tecnico?"Remover técnico":"Marcar como técnico"}
                        style={{background:u.is_tecnico?C.teal+"22":"transparent",border:`1px solid ${u.is_tecnico?C.teal+"44":C.grey200}`,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:12,fontWeight:600,color:u.is_tecnico?C.teal:C.grey400,transition:"all .15s"}}>
                        {u.is_tecnico ? "✓ Sim" : "Não"}
                      </button>
                    </td>
                    <td style={{padding:"13px 16px"}}>
                      <Badge color={u.ativo?C.green:C.grey400}>{u.ativo?"Ativo":"Inativo"}</Badge>
                    </td>
                    <td style={{padding:"8px 16px"}}>
                      <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                        {u.id === currentUserId && (
                          <button onClick={()=>openEdit(u)} title="Editar o meu perfil"
                            style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,display:"flex",alignItems:"center",transition:"background .15s"}}
                            onMouseEnter={e=>e.currentTarget.style.background=C.grey100}
                            onMouseLeave={e=>e.currentTarget.style.background="none"}>
                            <Icon name="edit" size={14} color={C.teal}/>
                          </button>
                        )}
                        {u.id !== currentUserId && (
                          <>
                            <button onClick={()=>openEdit(u)} title="Editar utilizador"
                              style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,display:"flex",alignItems:"center",transition:"background .15s"}}
                              onMouseEnter={e=>e.currentTarget.style.background=C.grey100}
                              onMouseLeave={e=>e.currentTarget.style.background="none"}>
                              <Icon name="edit" size={14} color={C.teal}/>
                            </button>
                            <button onClick={()=>toggleAtivo(u)} title={u.ativo?"Inativar":"Ativar"}
                              style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,display:"flex",alignItems:"center",transition:"background .15s"}}
                              onMouseEnter={e=>e.currentTarget.style.background=C.grey100}
                              onMouseLeave={e=>e.currentTarget.style.background="none"}>
                              <Icon name={u.ativo?"close":"eye"} size={14} color={u.ativo?C.amber:C.green}/>
                            </button>
                            <button onClick={()=>deleteUser(u)} title="Eliminar utilizador"
                              style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,display:"flex",alignItems:"center",transition:"background .15s"}}
                              onMouseEnter={e=>e.currentTarget.style.background=C.red+"15"}
                              onMouseLeave={e=>e.currentTarget.style.background="none"}>
                              <Icon name="trash" size={14} color={C.red}/>
                            </button>
                          </>
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
        <Modal title={modal==="edit" ? "Editar utilizador" : "Novo utilizador"} onClose={()=>{setModal(false);setErrMsg(null);}}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Input label="Nome" value={form.nome} onChange={v=>setForm(f=>({...f,nome:v}))} placeholder="Nome completo"/>
            <Input label="Email" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} type="email" placeholder="email@empresa.pt" required={modal==="new"}/>
            {(modal==="new" || form.id===currentUserId) && (
              <Input label={modal==="edit"?"Nova password (deixar em branco para não alterar)":"Password"}
                value={form.password} onChange={v=>setForm(f=>({...f,password:v}))}
                type="password" placeholder={modal==="edit"?"••••••••":"Mínimo 6 caracteres"}
                required={modal==="new"}/>
            )}
            {modal==="new" && (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.grey50,borderRadius:8,border:`1px solid ${C.grey100}`}}>
                <input type="checkbox" id="is_tecnico" checked={form.is_tecnico} onChange={e=>setForm(f=>({...f,is_tecnico:e.target.checked}))}
                  style={{width:16,height:16,accentColor:C.teal,cursor:"pointer"}}/>
                <label htmlFor="is_tecnico" style={{fontSize:14,color:C.grey800,cursor:"pointer"}}>
                  Este utilizador é também um <strong>técnico</strong> (aparece na seleção de assistências)
                </label>
              </div>
            )}
            {modal==="edit" && form.id!==currentUserId && (
              <div style={{background:C.amber+"12",border:`1px solid ${C.amber}33`,borderRadius:8,padding:"10px 14px",fontSize:12,color:C.grey600,display:"flex",gap:8}}>
                <Icon name="alert" size={14} color={C.amber}/>
                <span>A password só pode ser alterada pelo próprio utilizador.</span>
              </div>
            )}
          </div>
          {errMsg && (
            <div style={{marginTop:12,background:C.red+"10",border:`1px solid ${C.red}33`,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.red,display:"flex",gap:8,alignItems:"center"}}>
              <Icon name="alert" size={14} color={C.red}/>{errMsg}
            </div>
          )}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
            <Btn variant="secondary" onClick={()=>setModal(false)}>Cancelar</Btn>
            <Btn onClick={modal==="edit" ? saveUser : createUser}
              disabled={saving||(modal==="new"&&(!form.email||!form.password))}>
              {saving ? (modal==="edit"?"A guardar...":"A criar...") : (modal==="edit"?"Guardar":"Criar utilizador")}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};
