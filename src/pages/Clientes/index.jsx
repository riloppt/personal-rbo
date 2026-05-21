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
  const emptyNew = {nome:"",nif:"",consumidor_final:false,tecnico_id:"",morada:"",cp:"",localidade:"",email:"",telefone:"",telemovel:"",observacoes:""};
  const [newForm, setNewForm] = useState(emptyNew);

  useEffect(()=>{
    sb.from("rbo_profiles").select("id,nome").eq("is_tecnico",true).eq("ativo",true).order("nome")
      .then(({data})=>setTecnicoOpts((data||[]).map(t=>({value:t.id,label:t.nome||t.email}))));
  },[]);

  const saveNew = async () => {
    const cf = newForm.consumidor_final;
    if (!newForm.nome)                           return alert("Nome é obrigatório");
    if (!cf && !newForm.morada)                  return alert("Morada é obrigatória");
    if (!cf && !newForm.cp)                      return alert("Código Postal é obrigatório");
    if (!cf && !newForm.localidade)              return alert("Localidade é obrigatória");
    if (!newForm.email)                          return alert("Email é obrigatório");
    if (!newForm.telefone && !newForm.telemovel) return alert("Pelo menos telefone ou telemóvel é obrigatório");
    if (!cf && !newForm.nif)                     return alert("NIF é obrigatório para clientes empresariais");
    setNewSaving(true);
    const { error } = await sb.from("rbo_clientes").insert([{ ...newForm, tecnico_id: newForm.tecnico_id || null }]);
    if (error) { alert("Erro: " + error.message); setNewSaving(false); return; }
    setNewModal(false);
    setNewForm(emptyNew);
    setReload(r=>r+1);
    setNewSaving(false);
  };

  const onBack = () => { setDetalhe(null); setReload(r=>r+1); };

  const handleDeleteCliente = async () => {
    const err = await preDeleteCliente(detalhe.id);
    if (err) { alert(err); return; }
    if (!window.confirm("Eliminar cliente permanentemente? Esta ação não pode ser revertida.")) return;
    const { error } = await sb.from("rbo_clientes").delete().eq("id", detalhe.id);
    if (error) { alert("Erro: " + error.message); return; }
    onBack();
  };

  const preDeleteCliente = async (id) => {
    const [tkR, conR] = await Promise.all([
      sb.from('rbo_tickets').select('id', { count: 'exact', head: true }).eq('cliente_id', id),
      sb.from('rbo_contratos').select('id', { count: 'exact', head: true }).eq('cliente_id', id),
    ]);
    const nT = tkR.count || 0;
    const nC = conR.count || 0;
    if (nT > 0 || nC > 0) {
      const parts = [];
      if (nT > 0) parts.push(`${nT} ticket${nT !== 1 ? 's' : ''}`);
      if (nC > 0) parts.push(`${nC} contrato${nC !== 1 ? 's' : ''}`);
      return `Não é possível eliminar este cliente porque tem ${parts.join(' e ')} associado${parts.length > 1 || (nT + nC) > 1 ? 's' : ''}. Elimine primeiro os tickets e contratos.`;
    }
    return null;
  };

  if (detalhe) return <ClienteDetalhe cliente={detalhe} tecnicoOpts={tecnicoOpts} onBack={onBack} onDelete={handleDeleteCliente}/>;

  return (
    <>
      <CrudPage key={reload} title="Clientes" table="rbo_clientes"
        sortableKeys={["nome","nif","localidade"]}
        cols={[
          {key:"nome", label:"Nome", render:(v,row)=>(
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span>{v}</span>
              {row.consumidor_final && (
                <span style={{fontSize:10,fontWeight:700,color:C.teal,background:C.teal+"18",borderRadius:4,padding:"1px 7px",letterSpacing:".5px",flexShrink:0}}>CF</span>
              )}
            </div>
          )},
          {key:"nif",        label:"NIF"},
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
        preDeleteCheck={preDeleteCliente}
        searchPlaceholder="Pesquisar por nome, email, NIF ou localidade..."
        onView={r=>setDetalhe(r)}
        noInlineEdit
        noListDelete
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
            {/* Consumidor Final */}
            <div style={{gridColumn:"1/-1"}}>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",userSelect:"none"}}>
                <input type="checkbox" checked={!!newForm.consumidor_final} onChange={e=>setNewForm(f=>({...f,consumidor_final:e.target.checked}))}
                  style={{accentColor:C.teal,width:15,height:15,cursor:"pointer"}}/>
                <span style={{fontSize:14,color:C.grey700}}>Consumidor Final</span>
              </label>
              <div style={{fontSize:11,color:C.grey400,marginLeft:23,marginTop:3}}>Quando ativo, NIF, morada, código postal e localidade são opcionais</div>
            </div>
            <Input label={newForm.consumidor_final ? "NIF (opcional)" : "NIF"} value={newForm.nif} onChange={v=>setNewForm(f=>({...f,nif:maskNif(v)}))} placeholder="XXX XXX XXX" required={!newForm.consumidor_final}/>
            <div/>
            <div style={{gridColumn:"1/-1"}}>
              <Input label="Morada" value={newForm.morada} onChange={v=>setNewForm(f=>({...f,morada:v}))} required={!newForm.consumidor_final}/>
            </div>
            <Input label="Código Postal" value={newForm.cp}        onChange={v=>setNewForm(f=>({...f,cp:maskCP(v)}))}       placeholder="0000-000" required={!newForm.consumidor_final}/>
            <Input label="Localidade"    value={newForm.localidade} onChange={v=>setNewForm(f=>({...f,localidade:v}))}       required={!newForm.consumidor_final}/>
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
