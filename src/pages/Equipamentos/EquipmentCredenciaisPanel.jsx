import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Btn } from '../../components/ui/Btn';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { CopyBtn } from '../../components/ui/CopyBtn';

export const EquipmentCredenciaisPanel = ({ equipmentId }) => {
  const C = useTheme();
  const [creds,   setCreds]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [editId,  setEditId]  = useState(null);
  const [showPwd, setShowPwd] = useState({});
  const empty = {label:"",utilizador:"",password:""};
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("rbo_equipment_credentials").select("*").eq("equipment_id", equipmentId).order("created_at");
    setCreds(data || []);
    setLoading(false);
  }, [equipmentId]);

  useEffect(() => { load(); }, [load]);

  const openNew  = ()  => { setForm(empty); setEditId(null); setModal(true); };
  const openEdit = c   => { setForm({label:c.label||"",utilizador:c.utilizador||"",password:c.password||""}); setEditId(c.id); setModal(true); };

  const save = async () => {
    setSaving(true);
    let err;
    if (!editId) {
      ({ error: err } = await sb.from("rbo_equipment_credentials").insert([{ ...form, equipment_id: equipmentId }]));
    } else {
      ({ error: err } = await sb.from("rbo_equipment_credentials").update(form).eq("id", editId));
    }
    if (err) alert("Erro: " + err.message);
    else { await load(); setModal(false); }
    setSaving(false);
  };

  const del = async id => {
    if (!confirm("Eliminar credencial?")) return;
    await sb.from("rbo_equipment_credentials").delete().eq("id", id);
    await load();
  };

  const togglePwd = id => setShowPwd(s => ({...s, [id]: !s[id]}));

  return (
    <Card style={{padding:0,overflow:"hidden",marginTop:20}}>
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.grey100}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Icon name="key" size={15} color={C.teal}/>
          <h3 style={{fontSize:15,fontWeight:600,color:C.grey800}}>Credenciais</h3>
        </div>
        <Btn size="sm" icon="plus" onClick={openNew}>Nova</Btn>
      </div>

      {loading ? <Loading/> : creds.length === 0 ? (
        <div style={{padding:"24px 20px",textAlign:"center",color:C.grey400,fontSize:13}}>
          Sem credenciais registadas
        </div>
      ) : (
        <div>
          {creds.map((c, i) => (
            <div key={c.id} style={{padding:"14px 20px",borderBottom:i<creds.length-1?`1px solid ${C.grey100}`:"none"}}>
              {/* Header row */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {c.label && (
                    <span style={{fontSize:13,fontWeight:700,color:C.teal,background:C.teal+"15",borderRadius:6,padding:"2px 10px"}}>{c.label}</span>
                  )}
                </div>
                <div style={{display:"flex",gap:2}}>
                  <Btn variant="ghost" size="sm" icon="edit"  onClick={()=>openEdit(c)}/>
                  <Btn variant="ghost" size="sm" icon="trash" onClick={()=>del(c.id)}/>
                </div>
              </div>

              {/* Credentials grid */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {/* Utilizador */}
                {c.utilizador && (
                  <div style={{background:C.grey50,borderRadius:8,padding:"8px 12px",border:`1px solid ${C.grey100}`}}>
                    <div style={{fontSize:10,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>Utilizador</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
                      <span style={{fontSize:13,color:C.grey800,fontFamily:"'DM Mono',monospace",wordBreak:"break-all"}}>{c.utilizador}</span>
                      <CopyBtn value={c.utilizador} isPassword={false}/>
                    </div>
                  </div>
                )}

                {/* Password */}
                {c.password && (
                  <div style={{background:C.grey50,borderRadius:8,padding:"8px 12px",border:`1px solid ${C.grey100}`}}>
                    <div style={{fontSize:10,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>Password</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
                      <span style={{fontSize:13,color:C.grey800,fontFamily:"'DM Mono',monospace",wordBreak:"break-all",flex:1}}>
                        {showPwd[c.id] ? c.password : "••••••••"}
                      </span>
                      <div style={{display:"flex",gap:2,flexShrink:0}}>
                        <button onClick={()=>togglePwd(c.id)} title={showPwd[c.id]?"Ocultar":"Mostrar"}
                          style={{background:"none",border:"none",cursor:"pointer",padding:"3px 5px",borderRadius:5,display:"flex",alignItems:"center"}}
                          onMouseEnter={e=>e.currentTarget.style.background=C.grey100}
                          onMouseLeave={e=>e.currentTarget.style.background="none"}>
                          <Icon name={showPwd[c.id]?"eyeOff":"eye"} size={13} color={C.grey400}/>
                        </button>
                        <CopyBtn value={c.password} isPassword={true}/>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={editId ? "Editar credencial" : "Nova credencial"} onClose={()=>setModal(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <Input label="Label" value={form.label} onChange={v=>setForm(f=>({...f,label:v}))} placeholder="ex: Administrador"/>
            </div>
            <Input label="Utilizador" value={form.utilizador} onChange={v=>setForm(f=>({...f,utilizador:v}))} placeholder="email ou username"/>
            <Input label="Password" value={form.password} onChange={v=>setForm(f=>({...f,password:v}))} type="password" placeholder="••••••••"/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
            <Btn variant="secondary" onClick={()=>setModal(false)}>Cancelar</Btn>
            <Btn onClick={save} disabled={saving}>{saving?"A guardar...":"Guardar"}</Btn>
          </div>
        </Modal>
      )}
    </Card>
  );
};
