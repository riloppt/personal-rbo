import React, { useState, useEffect } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { Modal } from '../../components/ui/Modal';
import { Btn } from '../../components/ui/Btn';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { CrudPage } from '../../components/shared/CrudPage';
import { maskNif, maskPhone, maskCP } from '../../utils/formatters';
import { ClienteDetalhe } from './ClienteDetalhe';

export const ClientesPage = () => {
  const C = useTheme();
  const [detalhe,     setDetalhe]     = useState(null);
  const [reload,      setReload]      = useState(0);
  const [tecnicoOpts, setTecnicoOpts] = useState([]);
  const [newModal,    setNewModal]    = useState(false);
  const [newSaving,   setNewSaving]   = useState(false);
  const emptyNew = {nome:"",nif:"",tecnico_id:"",morada:"",cp:"",localidade:"",gps:"",email:"",telefone:"",telemovel:"",observacoes:""};
  const [newForm, setNewForm] = useState(emptyNew);

  useEffect(()=>{
    sb.from("rbo_profiles").select("id,nome").eq("is_tecnico",true).eq("ativo",true).order("nome")
      .then(({data})=>setTecnicoOpts((data||[]).map(t=>({value:t.id,label:t.nome||t.email}))));
  },[]);

  const saveNew = async () => {
    if (!newForm.nome)                           return alert("Nome é obrigatório");
    if (!newForm.morada)                         return alert("Morada é obrigatória");
    if (!newForm.cp)                             return alert("Código Postal é obrigatório");
    if (!newForm.localidade)                     return alert("Localidade é obrigatória");
    if (!newForm.email)                          return alert("Email é obrigatório");
    if (!newForm.telefone && !newForm.telemovel) return alert("Pelo menos telefone ou telemóvel é obrigatório");
    setNewSaving(true);
    const { error } = await sb.from("rbo_clientes").insert([newForm]);
    if (error) { alert("Erro: " + error.message); setNewSaving(false); return; }
    setNewModal(false);
    setNewForm(emptyNew);
    setReload(r=>r+1);
    setNewSaving(false);
  };

  const onBack = () => { setDetalhe(null); setReload(r=>r+1); };

  if (detalhe) return <ClienteDetalhe cliente={detalhe} tecnicoOpts={tecnicoOpts} onBack={onBack}/>;

  return (
    <>
      <CrudPage key={reload} title="Clientes" table="rbo_clientes"
        cols={[
          {key:"nome",       label:"Nome"},
          {key:"tecnico_id", label:"Técnico", render:(v)=>tecnicoOpts.find(t=>t.value===v)?.label||"—"},
          {key:"localidade", label:"Localidade"},
          {key:"telefone",   label:"Telefone"},
          {key:"email",      label:"Email"},
        ]}
        emptyForm={emptyNew}
        fieldOptions={{tecnico_id: tecnicoOpts}}
        formFields={[]}
        onNew={()=>{ setNewForm(emptyNew); setNewModal(true); }}
        newLabel="Novo Cliente"
        onView={r=>setDetalhe(r)}
        viewIcon="edit"
        noInlineEdit
      />

      {newModal && (
        <Modal title="Novo cliente" onClose={()=>setNewModal(false)} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <Input label="Nome da Empresa" value={newForm.nome} onChange={v=>setNewForm(f=>({...f,nome:v}))} required/>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <Select label="Técnico" value={newForm.tecnico_id} onChange={v=>setNewForm(f=>({...f,tecnico_id:v}))} options={tecnicoOpts}/>
            </div>
            <Input label="NIF" value={newForm.nif} onChange={v=>setNewForm(f=>({...f,nif:maskNif(v)}))} placeholder="XXX XXX XXX"/>
            <div/>
            <div style={{gridColumn:"1/-1"}}>
              <Input label="Morada" value={newForm.morada} onChange={v=>setNewForm(f=>({...f,morada:v}))} required/>
            </div>
            <Input label="Código Postal" value={newForm.cp}        onChange={v=>setNewForm(f=>({...f,cp:maskCP(v)}))}       placeholder="0000-000" required/>
            <Input label="Localidade"    value={newForm.localidade} onChange={v=>setNewForm(f=>({...f,localidade:v}))}       required/>
            <div style={{gridColumn:"1/-1",display:"flex",gap:8,alignItems:"flex-end"}}>
              <div style={{flex:1}}>
                <Input label="Coordenadas GPS" value={newForm.gps} onChange={v=>setNewForm(f=>({...f,gps:v}))} placeholder="lat,lng"/>
              </div>
              <Btn variant="secondary" size="sm" onClick={()=>{
                if (!navigator.geolocation) return alert("Geolocalização não suportada");
                navigator.geolocation.getCurrentPosition(
                  p=>setNewForm(f=>({...f,gps:`${p.coords.latitude.toFixed(6)},${p.coords.longitude.toFixed(6)}`})),
                  ()=>alert("Não foi possível obter a localização")
                );
              }}>📍 Obter</Btn>
            </div>
            <Input label="Email"     value={newForm.email}     onChange={v=>setNewForm(f=>({...f,email:v}))}               type="email" required/>
            <div/>
            <Input label="Telefone"  value={newForm.telefone}  onChange={v=>setNewForm(f=>({...f,telefone:maskPhone(v)}))}  placeholder="XXX XXX XXX"/>
            <Input label="Telemóvel" value={newForm.telemovel} onChange={v=>setNewForm(f=>({...f,telemovel:maskPhone(v)}))} placeholder="XXX XXX XXX"/>
            <div style={{gridColumn:"1/-1",fontSize:12,color:C.amber}}>* Pelo menos telefone ou telemóvel é obrigatório</div>
            <div style={{gridColumn:"1/-1"}}>
              <Input label="Observações" value={newForm.observacoes} onChange={v=>setNewForm(f=>({...f,observacoes:v}))} textarea rows={3}/>
            </div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
            <Btn variant="secondary" onClick={()=>setNewModal(false)}>Cancelar</Btn>
            <Btn onClick={saveNew} disabled={newSaving}>{newSaving?"A guardar...":"Guardar"}</Btn>
          </div>
        </Modal>
      )}
    </>
  );
};
