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
import { fmtDate } from '../../utils/formatters';
import { useSortable } from '../../hooks/useSortable';
import { buildReportHtml, buildPeriodReportHtml } from '../../features/email/reportHtml';
import { sendEmailResend } from '../../lib/email';
import { EmailReportBtn } from '../../features/email/EmailReportBtn';
import { AssistenciaModal } from './AssistenciaModal';

export const ContratoDetalhe = ({ contrato, onBack, onDelete }) => {
  const C = useTheme();
  const [movimentos, setMovimentos] = useState([]);
  const [tecnicos,   setTecnicos]   = useState([]);
  const [locais,     setLocais]     = useState([]);
  const [cliente,    setCliente]    = useState(null);
  const [tipologia,  setTipologia]  = useState(null);
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const emptyMov = {data:new Date().toISOString().split("T")[0],hora_inicio:"",hora_fim:"",creditos:"",descritivo:"",profile_tecnico_id:"",local_id:"",equipment_id:"",tipo:"assistencia"};
  const [form, setForm] = useState(emptyMov);
  const [periodModal,        setPeriodModal]        = useState(false);
  const [periodDates,        setPeriodDates]        = useState({ inicio: '', fim: '' });
  const [periodError,        setPeriodError]        = useState('');
  const [periodEmailTo,      setPeriodEmailTo]      = useState('');
  const [periodEmailSending, setPeriodEmailSending] = useState(false);
  const [periodEmailResult,  setPeriodEmailResult]  = useState(null);

  const load = useCallback(async()=>{
    setLoading(true);
    const [movRes,tecRes,locRes,cliRes,tipRes,eqRes] = await Promise.all([
      sb.from("rbo_movimentos").select("*").eq("contrato_id",contrato.id).order("data",{ascending:false}),
      sb.from("rbo_profiles").select("id,nome,email").eq("is_tecnico",true).order("nome"),
      sb.from("rbo_locais").select("*").order("nome"),
      sb.from("rbo_clientes").select("*").eq("id",contrato.cliente_id).single(),
      sb.from("rbo_tipologias").select("*").eq("id",contrato.tipologia_id).single(),
      sb.from("rbo_client_equipment").select("id,descricao,tipo_id,num_serie").eq("cliente_id",contrato.cliente_id).eq("ativo",true),
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

  const saveAssistencia = async (fields) => {
    setSaving(true);
    const payload = { contrato_id: contrato.id, tipo: 'assistencia', ...fields };
    let err;
    if (!editingId) ({ error: err } = await sb.from("rbo_movimentos").insert([payload]));
    else            ({ error: err } = await sb.from("rbo_movimentos").update(payload).eq("id", editingId));
    if (err) alert("Erro: " + err.message);
    else { await load(); setModal(null); }
    setSaving(false);
  };

  const buildPeriodHtml = () => {
    const periodoMovs = [...movimentos]
      .filter(m => m.data >= periodDates.inicio && m.data <= periodDates.fim)
      .sort((a, b) => a.data.localeCompare(b.data));
    return buildPeriodReportHtml({
      contrato, cliente, tipologia,
      inicio: periodDates.inicio, fim: periodDates.fim,
      movimentos: periodoMovs, saldoTotal: saldo,
      tecnicos, locais, equipamentos,
    });
  };

  const validatePeriod = () => {
    if (!periodDates.inicio || !periodDates.fim) { setPeriodError('Ambas as datas são obrigatórias'); return false; }
    if (periodDates.fim < periodDates.inicio)    { setPeriodError('A data de fim não pode ser anterior à data de início'); return false; }
    return true;
  };

  const generatePeriodReport = () => {
    if (!validatePeriod()) return;
    const w = window.open('', '_blank');
    if (w) { w.document.write(buildPeriodHtml()); w.document.close(); }
  };

  const sendPeriodReport = async () => {
    if (!validatePeriod() || !periodEmailTo) return;
    setPeriodEmailSending(true); setPeriodEmailResult(null);
    try {
      const html    = buildPeriodHtml();
      const subject = `Relatório de Assistências — ${cliente?.nome||''} — ${fmtDate(periodDates.inicio)} a ${fmtDate(periodDates.fim)}`;
      await sendEmailResend({ to: periodEmailTo, subject, html });
      setPeriodEmailResult('ok');
    } catch (err) {
      setPeriodEmailResult(err.message || 'Erro desconhecido');
    } finally {
      setPeriodEmailSending(false);
    }
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
    tecnico:     mov.profile_tecnico_id ? tecnicos.find(t=>t.id===mov.profile_tecnico_id)  : null,
    local:       mov.local_id           ? locais.find(l=>l.id===mov.local_id)              : null,
    equipamento: mov.equipment_id       ? equipamentos.find(e=>e.id===mov.equipment_id)    : null,
  });

  const getMovVal = useCallback((key, row) => {
    if (key === 'tecnico') return tecnicos.find(t=>t.id===row.profile_tecnico_id)?.nome ?? '';
    if (key === 'local')   return locais.find(l=>l.id===row.local_id)?.nome ?? '';
    return row[key] ?? '';
  }, [tecnicos, locais]);

  const { sorted: sortedMovimentos, sortKey, sortDir, toggleSort } = useSortable(movimentos, getMovVal);

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
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <Btn variant="secondary" size="sm" icon="contracts" onClick={()=>{ setPeriodModal(true); setPeriodError(''); setPeriodEmailTo(cliente?.email||''); setPeriodEmailResult(null); }}>Relatório de Período</Btn>
          <Btn variant="secondary" size="sm" icon="credit" onClick={()=>openNew("credito")}>Adicionar Créditos</Btn>
          <Btn size="sm" icon="plus" onClick={()=>openNew("assistencia")}>Nova Assistência</Btn>
          {onDelete && <Btn variant="danger" size="sm" icon="trash" onClick={onDelete}>Eliminar contrato</Btn>}
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
            {key:"data",        label:"Data",       sortable:true, render:v=>fmtDate(v)},
            {key:"tipo",        label:"Tipo",       sortable:true, render:v=><Badge color={v==="credito"?C.green:C.teal}>{v==="credito"?"Crédito":"Assistência"}</Badge>},
            {key:"hora_inicio", label:"Início",     render:v=>v?v.slice(0,5):"—"},
            {key:"hora_fim",    label:"Fim",        render:v=>v?v.slice(0,5):"—"},
            {key:"creditos",    label:"Créditos",   sortable:true, render:v=><span style={{color:v>0?C.green:C.red,fontWeight:600,fontFamily:"'DM Mono',monospace"}}>{v>0?"+":""}{v}</span>},
            {key:"descritivo",  label:"Descritivo", render:v=><span style={{color:C.grey600,fontSize:13}}>{v}</span>},
            {key:"profile_tecnico_id", label:"Técnico", sortable:true, sortKey:"tecnico", render:v=>v?tecnicos.find(t=>t.id===v)?.nome:"—"},
            {key:"local_id",    label:"Local",      sortable:true, sortKey:"local",   render:v=>v?locais.find(l=>l.id===v)?.nome:"—"},
            {key:"equipment_id",label:"Equipamento",render:v=>v?equipamentos.find(e=>e.id===v)?.descricao||"—":"—"},
          ]}
          data={sortedMovimentos}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
          onEdit={openEdit}
          onDelete={delMov}
          extraActions={row=>row.tipo==="assistencia"?(
            <>
              <button onClick={()=>{
                const { cliente: cl, tipologia: tip, tecnico, local, equipamento } = lookup(row);
                const html = buildReportHtml({ mov: row, cliente: cl, tipologia: tip, tecnico, local, equipamento });
                const w = window.open('', '_blank');
                if (w) { w.document.write(html); w.document.close(); }
              }} title="Abrir relatório"
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

      {modal==="mov" && form.tipo==="assistencia" && (
        <AssistenciaModal
          initialData={editingId ? form : null}
          editingId={editingId}
          tecnicos={tecnicos}
          locais={locais}
          equipamentos={equipamentos}
          onClose={()=>setModal(null)}
          onSave={saveAssistencia}
          saving={saving}
        />
      )}

      {modal==="mov" && form.tipo==="credito" && (
        <Modal title={editingId?"Editar Movimento":"Adicionar Créditos"} onClose={()=>setModal(null)} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <F k="data" label="Data" type="date"/>
            <Input label="Créditos" value={String(form.creditos)} onChange={v=>setForm(f=>({...f,creditos:v}))} placeholder="ex: 50" required/>
            <div style={{gridColumn:"1/-1"}}><Input label="Descritivo" value={form.descritivo} onChange={v=>setForm(f=>({...f,descritivo:v}))} textarea rows={3} required/></div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
            <Btn variant="secondary" onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn onClick={saveMov} disabled={saving}>{saving?"A guardar...":"Guardar"}</Btn>
          </div>
        </Modal>
      )}

      {periodModal && (
        <Modal title="Relatório de Período" onClose={()=>{ setPeriodModal(false); setPeriodError(''); }}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
            <Input label="Data de início" value={periodDates.inicio} onChange={v=>{ setPeriodDates(d=>({...d,inicio:v})); setPeriodError(''); }} type="date" required/>
            <Input label="Data de fim"    value={periodDates.fim}    onChange={v=>{ setPeriodDates(d=>({...d,fim:v}));    setPeriodError(''); }} type="date" required/>
          </div>

          <div style={{height:1,background:C.grey100,marginBottom:18}}/>

          <Input label="Enviar por email (opcional)" value={periodEmailTo}
            onChange={v=>{ setPeriodEmailTo(v); setPeriodEmailResult(null); }}
            type="email" placeholder="email@cliente.pt"/>
          {cliente?.email && periodEmailTo && periodEmailTo !== cliente.email && (
            <div style={{marginTop:6,fontSize:12,color:C.amber,display:"flex",alignItems:"center",gap:5}}>
              <Icon name="alert" size={13} color={C.amber}/> Email diferente do registado na ficha ({cliente.email})
            </div>
          )}

          {periodError && (
            <div style={{marginTop:12,fontSize:13,color:C.red,display:"flex",alignItems:"center",gap:6}}>
              <Icon name="alert" size={14} color={C.red}/> {periodError}
            </div>
          )}
          {periodEmailResult==="ok" && (
            <div style={{marginTop:12,fontSize:13,color:C.green,background:C.green+"12",border:`1px solid ${C.green}33`,borderRadius:8,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
              <Icon name="mailDone" size={14} color={C.green}/> Email enviado para <strong style={{marginLeft:4}}>{periodEmailTo}</strong>
            </div>
          )}
          {periodEmailResult && periodEmailResult!=="ok" && (
            <div style={{marginTop:12,fontSize:13,color:C.red,background:C.red+"10",border:`1px solid ${C.red}33`,borderRadius:8,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
              <Icon name="alert" size={14} color={C.red}/> {periodEmailResult}
            </div>
          )}

          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
            <Btn variant="secondary" onClick={()=>{ setPeriodModal(false); setPeriodError(''); }}>Cancelar</Btn>
            <Btn variant="secondary" icon={periodEmailSending?"loader":"mail"}
              onClick={sendPeriodReport}
              disabled={periodEmailSending||!periodEmailTo}>
              {periodEmailSending?"A enviar...":"Enviar por Email"}
            </Btn>
            <Btn icon="contracts" onClick={generatePeriodReport}>Gerar Relatório</Btn>
          </div>
        </Modal>
      )}

    </div>
  );
};
