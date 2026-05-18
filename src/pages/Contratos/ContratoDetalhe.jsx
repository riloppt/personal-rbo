import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { Badge } from '../../components/ui/Badge';
import { Btn } from '../../components/ui/Btn';
import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Icon } from '../../components/ui/Icon';
import { fmtDate, fmtDateTime } from '../../utils/formatters';
import { qrUrl } from '../../utils/helpers';
import { buildReportHtml } from '../../features/email/reportHtml';
import { EmailReportBtn } from '../../features/email/EmailReportBtn';

export const ContratoDetalhe = ({ contrato, onBack }) => {
  const C = useTheme();
  const [movimentos, setMovimentos] = useState([]);
  const [tecnicos,   setTecnicos]   = useState([]);
  const [locais,     setLocais]     = useState([]);
  const [cliente,    setCliente]    = useState(null);
  const [tipologia,  setTipologia]  = useState(null);
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [previewMov, setPreviewMov] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const emptyMov = {data:new Date().toISOString().split("T")[0],hora_inicio:"",hora_fim:"",creditos:"",descritivo:"",profile_tecnico_id:"",local_id:"",equipment_id:"",tipo:"assistencia"};
  const [form, setForm] = useState(emptyMov);

  const load = useCallback(async()=>{
    setLoading(true);
    const [movRes,tecRes,locRes,cliRes,tipRes,eqRes] = await Promise.all([
      sb.from("rbo_movimentos").select("*").eq("contrato_id",contrato.id).order("data",{ascending:false}),
      sb.from("rbo_profiles").select("id,nome,email").eq("is_tecnico",true).order("nome"),
      sb.from("rbo_locais").select("*").order("nome"),
      sb.from("rbo_clientes").select("*").eq("id",contrato.cliente_id).single(),
      sb.from("rbo_tipologias").select("*").eq("id",contrato.tipologia_id).single(),
      sb.from("rbo_client_equipment").select("id,descricao,tipo_id").eq("cliente_id",contrato.cliente_id).eq("ativo",true),
    ]);
    setMovimentos(movRes.data||[]);
    setTecnicos(tecRes.data||[]);
    setLocais(locRes.data||[]);
    setCliente(cliRes.data);
    setTipologia(tipRes.data);
    setEquipamentos(eqRes.data||[]);
    setLoading(false);
  },[contrato.id]);

  useEffect(()=>{ load(); },[load]);

  const saldo = movimentos.reduce((s,m)=>s+m.creditos,0);
  const openNew  = tipo => { setForm({...emptyMov,tipo}); setEditingId(null); setModal("mov"); };
  const openEdit = m   => { setForm({...m,profile_tecnico_id:m.profile_tecnico_id||"",local_id:m.local_id||"",hora_inicio:m.hora_inicio||"",hora_fim:m.hora_fim||"",equipment_id:m.equipment_id||""}); setEditingId(m.id); setModal("mov"); };

  const saveMov = async () => {
    const cred = Number(form.creditos);
    if (!form.data||isNaN(cred)||!form.descritivo) return;
    setSaving(true);
    const payload = {
      contrato_id:contrato.id, data:form.data,
      hora_inicio:form.hora_inicio||null, hora_fim:form.hora_fim||null,
      creditos:cred, descritivo:form.descritivo,
      profile_tecnico_id:form.profile_tecnico_id||null,
      local_id:form.local_id?Number(form.local_id):null,
      equipment_id:form.equipment_id?Number(form.equipment_id):null,
      tipo:form.tipo,
    };
    let err;
    if (!editingId) ({error:err} = await sb.from("rbo_movimentos").insert([payload]));
    else            ({error:err} = await sb.from("rbo_movimentos").update(payload).eq("id",editingId));
    if (err) alert("Erro: "+err.message);
    else { await load(); setModal(null); }
    setSaving(false);
  };

  const delMov = async id => {
    if (!confirm("Eliminar movimento?")) return;
    await sb.from("rbo_movimentos").delete().eq("id",id);
    await load();
  };

  const onSent = async movId => {
    const ts = new Date().toISOString();
    await sb.from("rbo_movimentos").update({relatorio_enviado_em:ts}).eq("id",movId);
    setMovimentos(ms=>ms.map(m=>m.id===movId?{...m,relatorio_enviado_em:ts}:m));
  };

  const lookup = mov => ({
    cliente, tipologia,
    tecnico: mov.profile_tecnico_id?tecnicos.find(t=>t.id===mov.profile_tecnico_id):null,
    local:   mov.local_id  ?locais.find(l=>l.id===mov.local_id)    :null,
  });

  const F = ({ k, label, type }) => <Input label={label} value={form[k]!==undefined?String(form[k]):""} onChange={v=>setForm(f=>({...f,[k]:v}))} type={type}/>;

  if (loading) return <><button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:C.teal,fontSize:14,marginBottom:20}}>← Voltar</button><Loading/></>;

  return (
    <div>
      <div style={{marginBottom:20}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:C.teal,fontSize:14,display:"flex",alignItems:"center",gap:6,padding:0}}>← Voltar aos contratos</button>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:20}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:C.grey800}}>{cliente?.nome}</h1>
          <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
            <Badge>{tipologia?.nome}</Badge>
            <Badge color={C.grey400}>Desde {fmtDate(contrato.data_contrato)}</Badge>
            <Badge color={saldo>10?C.green:saldo>0?C.amber:C.red}>{saldo} créditos</Badge>
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn variant="secondary" size="sm" icon="credit" onClick={()=>openNew("credito")}>Adicionar Créditos</Btn>
          <Btn size="sm" icon="plus" onClick={()=>openNew("assistencia")}>Nova Assistência</Btn>
        </div>
      </div>

      <Card style={{padding:"16px 20px",marginBottom:20,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
        {[["Telefone",cliente?.telefone],["Email",cliente?.email],["Localidade",cliente?.localidade],["Código Postal",cliente?.cp],["GPS",cliente?.gps]].map(([l,v])=>(
          <div key={l}><div style={{fontSize:11,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px"}}>{l}</div><div style={{fontSize:14,marginTop:2,color:C.grey800}}>{v||"—"}</div></div>
        ))}
      </Card>

      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.grey100}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{fontSize:15,fontWeight:600,color:C.grey800}}>Movimentos</h3>
          <div style={{fontSize:12,color:C.grey400,display:"flex",alignItems:"center",gap:6}}>
            <Icon name="mailDone" size={13} color={C.green}/> Verde = relatório enviado
          </div>
        </div>
        <Table
          cols={[
            {key:"data",        label:"Data",       render:v=>fmtDate(v)},
            {key:"tipo",        label:"Tipo",       render:v=><Badge color={v==="credito"?C.green:C.teal}>{v==="credito"?"Crédito":"Assistência"}</Badge>},
            {key:"hora_inicio", label:"Início",     render:v=>v||"—"},
            {key:"hora_fim",    label:"Fim",        render:v=>v||"—"},
            {key:"creditos",    label:"Créditos",   render:v=><span style={{color:v>0?C.green:C.red,fontWeight:600,fontFamily:"'DM Mono',monospace"}}>{v>0?"+":""}{v}</span>},
            {key:"descritivo",  label:"Descritivo", render:v=><span style={{color:C.grey600,fontSize:13}}>{v}</span>},
            {key:"profile_tecnico_id", label:"Técnico", render:v=>v?tecnicos.find(t=>t.id===v)?.nome:"—"},
            {key:"local_id",    label:"Local",      render:v=>v?locais.find(l=>l.id===v)?.nome:"—"},
            {key:"equipment_id",label:"Equipamento",render:v=>v?equipamentos.find(e=>e.id===v)?.descricao||"—":"—"},
          ]}
          data={movimentos}
          onEdit={openEdit}
          onDelete={delMov}
          extraActions={row=>row.tipo==="assistencia"?(
            <>
              <button onClick={()=>setPreviewMov(row)} title="Pré-visualizar relatório"
                style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,display:"flex",alignItems:"center",transition:"background .15s"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.grey100}
                onMouseLeave={e=>e.currentTarget.style.background="none"}>
                <Icon name="qr" size={15} color={C.grey600}/>
              </button>
              <EmailReportBtn mov={row} lookup={lookup} onSent={onSent}/>
            </>
          ):null}
          emptyMsg="Sem movimentos neste contrato"
        />
      </Card>

      {modal==="mov"&&(
        <Modal title={editingId?"Editar Movimento":(form.tipo==="credito"?"Adicionar Créditos":"Nova Assistência")} onClose={()=>setModal(null)} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <F k="data" label="Data" type="date"/>
            <Input label="Créditos" value={String(form.creditos)} onChange={v=>setForm(f=>({...f,creditos:v}))} placeholder={form.tipo==="credito"?"ex: 50":"ex: -2"} required/>
            {form.tipo==="assistencia"&&<>
              <F k="hora_inicio" label="Hora de Início" type="time"/>
              <F k="hora_fim"    label="Hora de Fim"    type="time"/>
              <Select label="Técnico" value={form.profile_tecnico_id||""} onChange={v=>setForm(f=>({...f,profile_tecnico_id:v}))} options={tecnicos.map(t=>({value:t.id,label:t.nome}))}/>
              <Select label="Local"   value={String(form.local_id  ||"")} onChange={v=>setForm(f=>({...f,local_id:v}))}   options={locais.map(l=>({value:String(l.id),label:l.nome}))}/>
              {equipamentos.length>0&&<div style={{gridColumn:"1/-1"}}><Select label="Equipamento (opcional)" value={String(form.equipment_id||"")} onChange={v=>setForm(f=>({...f,equipment_id:v}))} options={equipamentos.map(e=>({value:String(e.id),label:e.descricao}))}/></div>}
            </>}
            <div style={{gridColumn:"1/-1"}}><Input label="Descritivo" value={form.descritivo} onChange={v=>setForm(f=>({...f,descritivo:v}))} textarea rows={3} required/></div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
            <Btn variant="secondary" onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn onClick={saveMov} disabled={saving}>{saving?"A guardar...":"Guardar"}</Btn>
          </div>
        </Modal>
      )}

      {previewMov&&(()=>{
        const tec = previewMov.profile_tecnico_id?tecnicos.find(t=>t.id===previewMov.profile_tecnico_id):null;
        const loc = previewMov.local_id  ?locais.find(l=>l.id===previewMov.local_id)   :null;
        const html = buildReportHtml({mov:previewMov,cliente,tipologia,tecnico:tec,local:loc});
        const blobUrl = URL.createObjectURL(new Blob([html],{type:"text/html"}));
        return (
          <Modal title={`Relatório #${previewMov.id} — ${fmtDate(previewMov.data)}`} onClose={()=>setPreviewMov(null)} wide>
            <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
              <Btn icon="eye"      onClick={()=>window.open(blobUrl,"_blank")}>Abrir relatório</Btn>
              <Btn icon="download" variant="secondary" onClick={()=>{ const a=document.createElement("a");a.href=blobUrl;a.download=`relatorio_${previewMov.id}_${previewMov.data}.html`;a.click(); }}>Download HTML</Btn>
              <EmailReportBtn mov={previewMov} lookup={lookup} onSent={async id=>{ await onSent(id); setPreviewMov(p=>({...p,relatorio_enviado_em:new Date().toISOString()})); }}/>
            </div>
            <div style={{background:C.grey50,borderRadius:12,padding:20,display:"flex",gap:20,alignItems:"center",border:`1px solid ${C.grey100}`,flexWrap:"wrap"}}>
              <img src={qrUrl("Assistencia Rilop Ref#"+previewMov.id+" | "+(cliente?.nome||"")+" | "+fmtDate(previewMov.data))} width={120} height={120} alt="QR" style={{borderRadius:8,border:`1px solid ${C.grey200}`,flexShrink:0}}/>
              <div>
                <div style={{fontWeight:600,fontSize:15,marginBottom:6,color:C.grey800}}>QR Code de Verificação</div>
                <div style={{fontSize:13,color:C.grey600,lineHeight:1.6}}>Incluído no relatório. Ao digitalizar, o cliente pode verificar a autenticidade e descarregar o PDF.</div>
                <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
                  <Badge color={C.teal}>#{previewMov.id}</Badge>
                  <Badge color={C.grey400}>{fmtDate(previewMov.data)}</Badge>
                  <Badge color={previewMov.creditos<0?C.red:C.green}>{previewMov.creditos>0?"+":""}{previewMov.creditos} cr</Badge>
                  {previewMov.relatorio_enviado_em&&<Badge color={C.green}>✓ Enviado {fmtDateTime(previewMov.relatorio_enviado_em)}</Badge>}
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};
