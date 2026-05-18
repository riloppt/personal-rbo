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
import { Select } from '../../components/ui/Select';

export const EquipamentosPanel = ({ clienteId }) => {
  const C = useTheme();
  const [equipamentos,  setEquipamentos]  = useState([]);
  const [tipos,         setTipos]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [modal,         setModal]         = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [editId,        setEditId]        = useState(null);
  const [showInativos,  setShowInativos]  = useState(false);
  const empty = {descricao:"",tipo_id:"",num_serie:"",localizacao:""};
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    setLoading(true);
    const [eqRes,tipRes] = await Promise.all([
      sb.from("rbo_client_equipment").select("*").eq("cliente_id",clienteId).order("tipo_id").order("descricao"),
      sb.from("rbo_equipment_types").select("*").order("nome"),
    ]);
    setEquipamentos(eqRes.data||[]);
    setTipos(tipRes.data||[]);
    setLoading(false);
  }, [clienteId]);

  useEffect(() => { load(); }, [load]);

  const openNew  = ()  => { setForm(empty); setEditId(null); setModal(true); };
  const openEdit = e   => { setForm({descricao:e.descricao,tipo_id:String(e.tipo_id||""),num_serie:e.num_serie||"",localizacao:e.localizacao||""}); setEditId(e.id); setModal(true); };

  const save = async () => {
    if (!form.descricao) return alert("Descrição é obrigatória");
    if (!form.tipo_id)   return alert("Tipo é obrigatório");
    setSaving(true);
    const payload = {descricao:form.descricao,tipo_id:Number(form.tipo_id),num_serie:form.num_serie||null,localizacao:form.localizacao||null};
    let err;
    if (!editId) ({ error: err } = await sb.from("rbo_client_equipment").insert([{...payload,cliente_id:clienteId,ativo:true}]));
    else         ({ error: err } = await sb.from("rbo_client_equipment").update(payload).eq("id",editId));
    if (err) alert("Erro: " + err.message);
    else { await load(); setModal(false); }
    setSaving(false);
  };

  const toggleAtivo = async e => {
    await sb.from("rbo_client_equipment").update({ativo:!e.ativo}).eq("id",e.id);
    await load();
  };

  const del = async id => {
    const { data:movs } = await sb.from("rbo_movimentos").select("id").eq("equipment_id",id).limit(1);
    if (movs&&movs.length>0) { alert("Não é possível eliminar — tem movimentos associados. Pode inativá-lo."); return; }
    if (!confirm("Eliminar equipamento?")) return;
    await sb.from("rbo_client_equipment").delete().eq("id",id);
    await load();
  };

  const tipoNome = id => tipos.find(t=>t.id===id)?.nome||"—";
  const tipoOpts = tipos.map(t=>({value:String(t.id),label:t.nome}));
  const inativos = equipamentos.filter(e=>!e.ativo);
  const visible  = showInativos ? equipamentos : equipamentos.filter(e=>e.ativo);

  return (
    <Card style={{padding:0,overflow:"hidden",marginTop:16}}>
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.grey100}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Icon name="wrench" size={15} color={C.teal}/>
          <h3 style={{fontSize:15,fontWeight:600,color:C.grey800}}>Equipamentos</h3>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {inativos.length>0&&(
            <Btn variant="ghost" size="sm" onClick={()=>setShowInativos(s=>!s)}>
              {showInativos?"Ocultar inativos":`Mostrar inativos (${inativos.length})`}
            </Btn>
          )}
          <Btn size="sm" icon="plus" onClick={openNew}>Novo</Btn>
        </div>
      </div>
      {loading ? <Loading/> : visible.length===0 ? (
        <div style={{padding:"24px 20px",textAlign:"center",color:C.grey400,fontSize:13}}>Sem equipamentos registados</div>
      ) : (
        <div>
          {visible.map((e,i)=>(
            <div key={e.id} style={{padding:"13px 20px",borderBottom:i<visible.length-1?`1px solid ${C.grey100}`:"none",opacity:e.ativo?1:0.55,transition:"opacity .2s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                    <span style={{fontWeight:600,fontSize:14,color:C.grey800}}>{e.descricao}</span>
                    <Badge color={e.ativo?C.teal:C.grey400}>{tipoNome(e.tipo_id)}</Badge>
                    {!e.ativo&&<Badge color={C.grey400}>Inativo</Badge>}
                  </div>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                    {e.num_serie&&<span style={{fontSize:12,color:C.grey600}}>N/S: <span style={{fontFamily:"'DM Mono',monospace"}}>{e.num_serie}</span></span>}
                    {e.localizacao&&<span style={{fontSize:12,color:C.grey600}}>📍 {e.localizacao}</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:2,flexShrink:0,alignItems:"center"}}>
                  <button onClick={()=>toggleAtivo(e)} title={e.ativo?"Inativar":"Ativar"}
                    style={{background:"none",border:"none",cursor:"pointer",padding:"4px 8px",borderRadius:6,fontSize:12,color:e.ativo?C.amber:C.green,fontWeight:600,fontFamily:"'DM Sans',sans-serif",transition:"background .15s"}}
                    onMouseEnter={ev=>ev.currentTarget.style.background=C.grey100}
                    onMouseLeave={ev=>ev.currentTarget.style.background="none"}>
                    {e.ativo?"Inativar":"Ativar"}
                  </button>
                  <Btn variant="ghost" size="sm" icon="edit"  onClick={()=>openEdit(e)}/>
                  <Btn variant="ghost" size="sm" icon="trash" onClick={()=>del(e.id)}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal&&(
        <Modal title={editId?"Editar equipamento":"Novo equipamento"} onClose={()=>setModal(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}><Input label="Descrição" value={form.descricao} onChange={v=>setForm(f=>({...f,descricao:v}))} required/></div>
            <div style={{gridColumn:"1/-1"}}><Select label="Tipo" value={form.tipo_id} onChange={v=>setForm(f=>({...f,tipo_id:v}))} options={tipoOpts} required/></div>
            <Input label="Número de Série" value={form.num_serie}   onChange={v=>setForm(f=>({...f,num_serie:v}))}   placeholder="ex: SN-123456"/>
            <Input label="Localização"     value={form.localizacao} onChange={v=>setForm(f=>({...f,localizacao:v}))} placeholder="ex: Sala de servidores"/>
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
