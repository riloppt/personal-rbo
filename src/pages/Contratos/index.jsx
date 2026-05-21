import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../theme';
import { useSortable } from '../../hooks/useSortable';
import { sb } from '../../lib/supabase';
import { PageHeader } from '../../components/ui/PageHeader';
import { Btn } from '../../components/ui/Btn';
import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { fmtDate } from '../../utils/formatters';
import { ContratoDetalhe } from './ContratoDetalhe';

export const Contratos = () => {
  const C = useTheme();
  const [rows,       setRows]       = useState([]);
  const [clientes,   setClientes]   = useState([]);
  const [tipologias, setTipologias] = useState([]);
  const [movStats,   setMovStats]   = useState({});
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [detalhe,    setDetalhe]    = useState(null);
  const [search,     setSearch]     = useState("");
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState({cliente_id:"",tipologia_id:"",data_contrato:new Date().toISOString().split("T")[0],ativo:true});

  const load = useCallback(async()=>{
    setLoading(true);
    const [conRes,cliRes,tipRes,movRes] = await Promise.all([
      sb.from("rbo_contratos").select("*").order("id",{ascending:false}),
      sb.from("rbo_clientes").select("id,nome,email").order("nome"),
      sb.from("rbo_tipologias").select("*").order("nome"),
      sb.from("rbo_movimentos").select("id,contrato_id,creditos,tipo,data").order("data",{ascending:false}),
    ]);
    setRows(conRes.data||[]);
    setClientes(cliRes.data||[]);
    setTipologias(tipRes.data||[]);
    const stats = {};
    (movRes.data||[]).forEach(m=>{
      if (!stats[m.contrato_id]) stats[m.contrato_id]={creditos:0,ultimaAssist:null};
      stats[m.contrato_id].creditos += m.creditos;
      if (m.tipo==="assistencia"&&!stats[m.contrato_id].ultimaAssist) stats[m.contrato_id].ultimaAssist=m.data;
    });
    setMovStats(stats);
    setLoading(false);
  },[]);

  useEffect(()=>{ load(); },[load]);

  const save = async () => {
    if (!form.cliente_id||!form.tipologia_id) return;
    setSaving(true);
    const {data:novo,error} = await sb.from("rbo_contratos").insert([{cliente_id:Number(form.cliente_id),tipologia_id:Number(form.tipologia_id),data_contrato:form.data_contrato,ativo:true}]).select().single();
    if (error) { alert("Erro: "+error.message); setSaving(false); return; }
    await sb.from("rbo_movimentos").insert([{contrato_id:novo.id,data:form.data_contrato,hora_inicio:null,hora_fim:null,creditos:0,descritivo:"Contrato criado — adicione créditos iniciais",tecnico_id:null,local_id:null,tipo:"credito"}]);
    await load(); setSaving(false); setModal(false);
    setForm({cliente_id:"",tipologia_id:"",data_contrato:new Date().toISOString().split("T")[0],ativo:true});
  };

  const filtered = rows.filter(c=>{
    const cli = clientes.find(x=>x.id===c.cliente_id);
    const tip = tipologias.find(x=>x.id===c.tipologia_id);
    const q   = search.toLowerCase();
    return !q||cli?.nome.toLowerCase().includes(q)||tip?.nome.toLowerCase().includes(q);
  });

  const getContratosVal = useCallback((key, row) => {
    if (key === 'cliente')   return clientes.find(x=>x.id===row.cliente_id)?.nome ?? '';
    if (key === 'tipologia') return tipologias.find(x=>x.id===row.tipologia_id)?.nome ?? '';
    if (key === 'creditos')  return movStats[row.id]?.creditos ?? 0;
    return row[key] ?? '';
  }, [clientes, tipologias, movStats]);

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filtered, getContratosVal);

  const handleDeleteContrato = async () => {
    if (!confirm("Eliminar contrato e todos os seus movimentos?")) return;
    const { error } = await sb.from("rbo_contratos").delete().eq("id", detalhe.id);
    if (error) { alert("Erro: " + error.message); return; }
    setDetalhe(null);
    await load();
  };

  if (detalhe) return <ContratoDetalhe contrato={detalhe} onBack={()=>{ setDetalhe(null); load(); }} onDelete={handleDeleteContrato}/>;

  return (
    <div>
      <PageHeader title="Contratos" subtitle={`${rows.length} contratos`} action={<Btn icon="plus" onClick={()=>setModal(true)}>Novo Contrato</Btn>}/>
      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.grey100}`}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar por cliente ou tipologia..."
            style={{width:"100%",maxWidth:320,border:`1.5px solid ${C.grey200}`,borderRadius:8,padding:"7px 12px",fontSize:13,outline:"none",background:C.white,color:C.grey800}}/>
        </div>
        {loading?<Loading/>:<Table
          cols={[
            {key:"cliente_id",    label:"Cliente",     sortable:true, sortKey:"cliente",   render:v=>{const cl=clientes.find(x=>x.id===v);return <span style={{fontWeight:500,color:C.grey800}}>{cl?.nome||"—"}</span>;}},
            {key:"tipologia_id",  label:"Tipologia",   sortable:true, sortKey:"tipologia", render:v=>{const t=tipologias.find(x=>x.id===v);return <Badge>{t?.nome||"—"}</Badge>;}},
            {key:"data_contrato", label:"Data",        sortable:true,                      render:v=>fmtDate(v)},
            {key:"id",            label:"Últ. Assist.",                                    render:v=>{const s=movStats[v];return s?.ultimaAssist?fmtDate(s.ultimaAssist):<span style={{color:C.grey400}}>—</span>;}},
            {key:"id",            label:"Créditos",    sortable:true, sortKey:"creditos",  render:v=>{const cr=movStats[v]?.creditos||0;return <span style={{fontFamily:"'DM Mono',monospace",fontWeight:600,color:cr>10?C.green:cr>0?C.amber:C.red}}>{cr}</span>;}},
            {key:"ativo",         label:"Estado",                                          render:v=><Badge color={v?C.green:C.grey400}>{v?"Ativo":"Inativo"}</Badge>},
          ]}
          data={sorted}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
          onView={r=>setDetalhe(r)}
          emptyMsg="Sem contratos. Crie o primeiro contrato."
        />}
      </Card>
      {modal&&(
        <Modal title="Novo Contrato" onClose={()=>setModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Select label="Cliente"   value={form.cliente_id}   onChange={v=>setForm(f=>({...f,cliente_id:v}))}   options={clientes.map(c=>({value:String(c.id),label:c.nome}))}   required/>
            <Select label="Tipologia" value={form.tipologia_id} onChange={v=>setForm(f=>({...f,tipologia_id:v}))} options={tipologias.map(t=>({value:String(t.id),label:t.nome}))} required/>
            <Input  label="Data"      value={form.data_contrato} onChange={v=>setForm(f=>({...f,data_contrato:v}))} type="date" required/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
            <Btn variant="secondary" onClick={()=>setModal(false)}>Cancelar</Btn>
            <Btn onClick={save} disabled={saving||!form.cliente_id||!form.tipologia_id}>{saving?"A criar...":"Criar Contrato"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};
