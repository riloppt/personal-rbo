import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Btn } from '../../components/ui/Btn';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { maskNif, maskPhone, maskCP } from '../../utils/formatters';
import { ContactosPanel } from './ContactosPanel';
import { EquipamentosPanel } from './EquipamentosPanel';
import { CredenciaisPanel } from './CredenciaisPanel';

export const ClienteDetalhe = ({ cliente: clienteInicial, tecnicoOpts, onBack, onDelete }) => {
  const C = useTheme();
  const [cliente,       setCliente]       = useState(clienteInicial);
  const [form,          setForm]          = useState({...clienteInicial});
  const [saving,        setSaving]        = useState(false);
  const [editingDados,  setEditingDados]  = useState(false);
  const [tab,           setTab]           = useState("dados");

  const save = async () => {
    if (!form.nome)                                      return alert("Nome é obrigatório");
    if (!form.morada)                                    return alert("Morada é obrigatória");
    if (!form.cp)                                        return alert("Código Postal é obrigatório");
    if (!form.localidade)                                return alert("Localidade é obrigatória");
    if (!form.email)                                     return alert("Email é obrigatório");
    if (!form.telefone && !form.telemovel)               return alert("Pelo menos telefone ou telemóvel é obrigatório");
    if (!form.consumidor_final && !form.nif)             return alert("NIF é obrigatório para clientes empresariais");
    setSaving(true);
    const { id: _id, created_at: _ca, ...rest } = form;
    const { data, error } = await sb.from("rbo_clientes").update(rest).eq("id", cliente.id).select().single();
    if (error) { alert("Erro: " + error.message); setSaving(false); return; }
    setCliente(data);
    setForm({...data});
    setSaving(false);
    setEditingDados(false);
  };

  const cancelEdit = () => { setForm({...cliente}); setEditingDados(false); };

  const tecNome = tecnicoOpts.find(t => t.value === cliente.tecnico_id)?.label || "—";

  const tabs = [
    {id:"dados",        label:"Dados",        icon:"user"},
    {id:"contactos",    label:"Contactos",    icon:"clients"},
    {id:"credenciais",  label:"Credenciais",  icon:"key"},
    {id:"equipamentos", label:"Equipamentos", icon:"wrench"},
  ];

  const labelSx = {fontSize:11,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px"};
  const valueSx = {fontSize:14,marginTop:2,color:C.grey800};

  const InfoField = ({ label, value }) => (
    <div>
      <div style={labelSx}>{label}</div>
      <div style={{...valueSx, color: value ? C.grey800 : C.grey300}}>{value || "—"}</div>
    </div>
  );

  return (
    <div>
      {/* Back */}
      <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:C.teal,fontSize:14,display:"flex",alignItems:"center",gap:6,padding:0,marginBottom:20}}>
        ← Voltar aos clientes
      </button>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:20}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <h1 style={{fontSize:22,fontWeight:700,color:C.grey800}}>{cliente.nome}</h1>
            {cliente.consumidor_final && (
              <span style={{fontSize:11,fontWeight:700,color:C.teal,background:C.teal+"18",borderRadius:6,padding:"3px 10px",textTransform:"uppercase",letterSpacing:".5px",flexShrink:0}}>
                Consumidor Final
              </span>
            )}
          </div>
          {tecNome !== "—" && <div style={{fontSize:13,color:C.grey400,marginTop:4}}>Técnico: {tecNome}</div>}
        </div>
        {onDelete && <Btn variant="danger" size="sm" icon="trash" onClick={onDelete}>Eliminar cliente</Btn>}
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",gap:4,marginBottom:20,background:C.white,borderRadius:12,padding:6,border:`1px solid ${C.grey100}`,flexWrap:"wrap"}}>
        {tabs.map(t=>{
          const active = tab===t.id;
          return (
            <button key={t.id} onClick={()=>{ setTab(t.id); if(t.id!=="dados") setEditingDados(false); }}
              style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderRadius:8,border:"none",cursor:"pointer",background:active?C.teal:"transparent",color:active?"#ffffff":C.grey600,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:active?600:400,transition:"all .15s"}}>
              <Icon name={t.icon} size={15} color={active?"#ffffff":C.grey400}/>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Dados */}
      {tab==="dados" && (
        <Card style={{padding:"20px 24px"}}>
          {!editingDados ? (
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <span style={{fontSize:14,fontWeight:600,color:C.grey600}}>Informações do cliente</span>
                <Btn size="sm" icon="edit" onClick={()=>{ setForm({...cliente}); setEditingDados(true); }}>Editar dados</Btn>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                {/* Nome — full width */}
                <div style={{gridColumn:"1/-1"}}>
                  <InfoField label="Nome da Empresa" value={cliente.nome}/>
                </div>

                {/* Técnico */}
                <InfoField label="Técnico Atribuído" value={tecNome !== "—" ? tecNome : null}/>

                {/* NIF */}
                <InfoField label="NIF" value={cliente.nif}/>

                {/* Consumidor Final */}
                <div>
                  <div style={labelSx}>Consumidor Final</div>
                  {cliente.consumidor_final
                    ? <span style={{display:"inline-block",marginTop:4,fontSize:11,fontWeight:700,color:C.teal,background:C.teal+"18",borderRadius:6,padding:"2px 10px",textTransform:"uppercase",letterSpacing:".5px"}}>Consumidor Final</span>
                    : <div style={{...valueSx,color:C.grey300}}>—</div>
                  }
                </div>

                {/* Email */}
                <InfoField label="Email" value={cliente.email}/>

                {/* Telefone */}
                <InfoField label="Telefone" value={cliente.telefone}/>

                {/* Telemóvel */}
                <InfoField label="Telemóvel" value={cliente.telemovel}/>

                {/* CP */}
                <InfoField label="Código Postal" value={cliente.cp}/>

                {/* Localidade */}
                <InfoField label="Localidade" value={cliente.localidade}/>

                {/* Morada — full width */}
                <div style={{gridColumn:"1/-1"}}>
                  <InfoField label="Morada" value={cliente.morada}/>
                </div>

                {/* GPS — full width */}
                <div style={{gridColumn:"1/-1"}}>
                  <InfoField label="Coordenadas GPS" value={cliente.gps}/>
                </div>
              </div>

              {/* Observações */}
              <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.grey100}`}}>
                <div style={{...labelSx,marginBottom:6}}>Observações</div>
                <div style={{fontSize:14,color:cliente.observacoes?C.grey800:C.grey300,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{cliente.observacoes||"—"}</div>
              </div>
            </>
          ) : (
            <>
              <div style={{fontSize:14,fontWeight:600,color:C.grey600,marginBottom:16}}>Editar dados do cliente</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div style={{gridColumn:"1/-1"}}>
                  <Input label="Nome da Empresa" value={form.nome||""} onChange={v=>setForm(f=>({...f,nome:v}))} required/>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <Select label="Técnico" value={form.tecnico_id||""} onChange={v=>setForm(f=>({...f,tecnico_id:v}))} options={tecnicoOpts}/>
                </div>
                {/* Consumidor Final */}
                <div style={{gridColumn:"1/-1"}}>
                  <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",userSelect:"none"}}>
                    <input type="checkbox" checked={!!form.consumidor_final} onChange={e=>setForm(f=>({...f,consumidor_final:e.target.checked}))}
                      style={{accentColor:C.teal,width:15,height:15,cursor:"pointer"}}/>
                    <span style={{fontSize:14,color:C.grey700}}>Consumidor Final</span>
                  </label>
                  <div style={{fontSize:11,color:C.grey400,marginLeft:23,marginTop:3}}>Quando ativo, o NIF é opcional</div>
                </div>
                <Input label={form.consumidor_final ? "NIF (opcional)" : "NIF"} value={form.nif||""} onChange={v=>setForm(f=>({...f,nif:maskNif(v)}))} placeholder="XXX XXX XXX" required={!form.consumidor_final}/>
                <div/>
                <div style={{gridColumn:"1/-1"}}>
                  <Input label="Morada" value={form.morada||""} onChange={v=>setForm(f=>({...f,morada:v}))} required/>
                </div>
                <Input label="Código Postal" value={form.cp||""} onChange={v=>setForm(f=>({...f,cp:maskCP(v)}))} placeholder="0000-000" required/>
                <Input label="Localidade"    value={form.localidade||""} onChange={v=>setForm(f=>({...f,localidade:v}))} required/>
                <div style={{gridColumn:"1/-1",display:"flex",gap:8,alignItems:"flex-end"}}>
                  <div style={{flex:1}}>
                    <Input label="Coordenadas GPS" value={form.gps||""} onChange={v=>setForm(f=>({...f,gps:v}))} placeholder="lat,lng"/>
                  </div>
                  <Btn variant="secondary" size="sm" onClick={()=>{
                    if (!navigator.geolocation) return alert("Geolocalização não suportada");
                    navigator.geolocation.getCurrentPosition(
                      p=>setForm(f=>({...f,gps:`${p.coords.latitude.toFixed(6)},${p.coords.longitude.toFixed(6)}`})),
                      ()=>alert("Não foi possível obter a localização")
                    );
                  }}>📍 Obter</Btn>
                </div>
                <Input label="Email" value={form.email||""} onChange={v=>setForm(f=>({...f,email:v}))} type="email" required/>
                <div/>
                <Input label="Telefone"  value={form.telefone||""}  onChange={v=>setForm(f=>({...f,telefone:maskPhone(v)}))}  placeholder="XXX XXX XXX"/>
                <Input label="Telemóvel" value={form.telemovel||""} onChange={v=>setForm(f=>({...f,telemovel:maskPhone(v)}))} placeholder="XXX XXX XXX"/>
                <div style={{gridColumn:"1/-1",fontSize:12,color:C.amber}}>* Pelo menos telefone ou telemóvel é obrigatório</div>
                <div style={{gridColumn:"1/-1"}}>
                  <Input label="Observações" value={form.observacoes||""} onChange={v=>setForm(f=>({...f,observacoes:v}))} textarea rows={3}/>
                </div>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
                <Btn variant="secondary" onClick={cancelEdit}>Cancelar</Btn>
                <Btn onClick={save} disabled={saving}>{saving?"A guardar...":"Guardar"}</Btn>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Tab: Contactos */}
      {tab==="contactos" && <ContactosPanel clienteId={cliente.id}/>}

      {/* Tab: Credenciais */}
      {tab==="credenciais" && <CredenciaisPanel clienteId={cliente.id}/>}

      {/* Tab: Equipamentos */}
      {tab==="equipamentos" && <EquipamentosPanel clienteId={cliente.id}/>}
    </div>
  );
};
