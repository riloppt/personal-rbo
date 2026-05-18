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
import { maskPhone } from '../../utils/formatters';

export const ContactosPanel = ({ clienteId }) => {
  const C = useTheme();
  const [contacts, setContacts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [editId,   setEditId]   = useState(null);
  const empty = {nome:"",email:"",telefone:"",telemovel:""};
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("rbo_client_contacts").select("*").eq("cliente_id", clienteId).order("id");
    setContacts(data || []);
    setLoading(false);
  }, [clienteId]);

  useEffect(() => { load(); }, [load]);

  const openNew  = ()  => { setForm(empty); setEditId(null); setModal(true); };
  const openEdit = c   => { setForm({...c}); setEditId(c.id); setModal(true); };

  const save = async () => {
    if (!form.nome) return alert("Nome é obrigatório");
    if (!form.telefone && !form.telemovel) return alert("Pelo menos telefone ou telemóvel é obrigatório");
    setSaving(true);
    const { id: _id, created_at: _ca, ...rest } = form;
    let err;
    if (!editId) ({ error: err } = await sb.from("rbo_client_contacts").insert([{ ...rest, cliente_id: clienteId }]));
    else         ({ error: err } = await sb.from("rbo_client_contacts").update(rest).eq("id", editId));
    if (err) alert("Erro: " + err.message);
    else { await load(); setModal(false); }
    setSaving(false);
  };

  const del = async id => {
    if (!confirm("Eliminar contacto?")) return;
    await sb.from("rbo_client_contacts").delete().eq("id", id);
    await load();
  };

  return (
    <Card style={{padding:0,overflow:"hidden",marginTop:16}}>
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.grey100}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Icon name="clients" size={15} color={C.teal}/>
          <h3 style={{fontSize:15,fontWeight:600,color:C.grey800}}>Contactos</h3>
        </div>
        <Btn size="sm" icon="plus" onClick={openNew}>Novo</Btn>
      </div>
      {loading ? <Loading/> : contacts.length===0 ? (
        <div style={{padding:"24px 20px",textAlign:"center",color:C.grey400,fontSize:13}}>Sem contactos registados</div>
      ) : (
        <div>
          {contacts.map((c,i)=>(
            <div key={c.id} style={{padding:"14px 20px",borderBottom:i<contacts.length-1?`1px solid ${C.grey100}`:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <span style={{fontWeight:600,fontSize:14,color:C.grey800}}>{c.nome}</span>
                <div style={{display:"flex",gap:2}}>
                  <Btn variant="ghost" size="sm" icon="edit"  onClick={()=>openEdit(c)}/>
                  <Btn variant="ghost" size="sm" icon="trash" onClick={()=>del(c.id)}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {c.email&&(
                  <div style={{background:C.grey50,borderRadius:8,padding:"7px 10px",border:`1px solid ${C.grey100}`}}>
                    <div style={{fontSize:10,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px",marginBottom:3}}>Email</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:4}}>
                      <span style={{fontSize:13,color:C.grey800,wordBreak:"break-all"}}>{c.email}</span>
                      <CopyBtn value={c.email} isPassword={false}/>
                    </div>
                  </div>
                )}
                {c.telefone&&(
                  <div style={{background:C.grey50,borderRadius:8,padding:"7px 10px",border:`1px solid ${C.grey100}`}}>
                    <div style={{fontSize:10,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px",marginBottom:3}}>Telefone</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:4}}>
                      <span style={{fontSize:13,color:C.grey800}}>{c.telefone}</span>
                      <CopyBtn value={c.telefone} isPassword={false}/>
                    </div>
                  </div>
                )}
                {c.telemovel&&(
                  <div style={{background:C.grey50,borderRadius:8,padding:"7px 10px",border:`1px solid ${C.grey100}`}}>
                    <div style={{fontSize:10,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px",marginBottom:3}}>Telemóvel</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:4}}>
                      <span style={{fontSize:13,color:C.grey800}}>{c.telemovel}</span>
                      <CopyBtn value={c.telemovel} isPassword={false}/>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {modal&&(
        <Modal title={editId?"Editar contacto":"Novo contacto"} onClose={()=>setModal(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}><Input label="Nome" value={form.nome} onChange={v=>setForm(f=>({...f,nome:v}))} required/></div>
            <div style={{gridColumn:"1/-1"}}><Input label="Email" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} type="email"/></div>
            <Input label="Telefone"  value={form.telefone}  onChange={v=>setForm(f=>({...f,telefone:maskPhone(v)}))}  placeholder="XXX XXX XXX"/>
            <Input label="Telemóvel" value={form.telemovel} onChange={v=>setForm(f=>({...f,telemovel:maskPhone(v)}))} placeholder="XXX XXX XXX"/>
          </div>
          <div style={{fontSize:12,color:C.amber,marginTop:8}}>* Pelo menos telefone ou telemóvel é obrigatório</div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
            <Btn variant="secondary" onClick={()=>setModal(false)}>Cancelar</Btn>
            <Btn onClick={save} disabled={saving}>{saving?"A guardar...":"Guardar"}</Btn>
          </div>
        </Modal>
      )}
    </Card>
  );
};
