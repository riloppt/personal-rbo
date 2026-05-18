import React, { useState, useEffect } from 'react';
import { useTheme } from '../theme';
import { sb } from '../lib/supabase';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { fmtDate } from '../utils/formatters';

export const Dashboard = () => {
  const C = useTheme();
  const [stats,    setStats]    = useState({clientes:0,contratos:0,creditos:0,assistencias:0});
  const [recentes, setRecentes] = useState([]);
  const [tipStats, setTipStats] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(()=>{
    (async()=>{
      const [cliRes,conRes,movRes,tipRes] = await Promise.all([
        sb.from("rbo_clientes").select("id",{count:"exact",head:true}),
        sb.from("rbo_contratos").select("id,ativo,tipologia_id"),
        sb.from("rbo_movimentos").select("id,creditos,tipo,data,contrato_id,profile_tecnico_id").order("data",{ascending:false}),
        sb.from("rbo_tipologias").select("id,nome"),
      ]);
      const movs  = movRes.data||[];
      const cons  = conRes.data||[];
      const tips  = tipRes.data||[];
      const assis = movs.filter(m=>m.tipo==="assistencia");
      setStats({clientes:cliRes.count||0,contratos:cons.filter(c=>c.ativo).length,creditos:movs.reduce((s,m)=>s+m.creditos,0),assistencias:assis.length});
      const recentConIds = [...new Set(assis.slice(0,5).map(m=>m.contrato_id))];
      if (recentConIds.length) {
        const {data:cRec} = await sb.from("rbo_contratos").select("id,cliente_id").in("id",recentConIds);
        const cliIds = (cRec||[]).map(c=>c.cliente_id);
        const [{data:clRec},{data:tecRec}] = await Promise.all([
          sb.from("rbo_clientes").select("id,nome").in("id",cliIds),
          sb.from("rbo_profiles").select("id,nome").eq("is_tecnico",true),
        ]);
        setRecentes(assis.slice(0,5).map(m=>{
          const con=(cRec||[]).find(c=>c.id===m.contrato_id);
          const cli=con?(clRec||[]).find(c=>c.id===con.cliente_id):null;
          const tec=m.profile_tecnico_id?(tecRec||[]).find(t=>t.id===m.profile_tecnico_id):null;
          return {...m,clienteNome:cli?.nome,tecnicoNome:tec?.nome};
        }));
      }
      setTipStats(tips.map(t=>({...t,count:cons.filter(c=>c.tipologia_id===t.id).length})));
      setLoading(false);
    })();
  },[]);

  if (loading) return <><PageHeader title="Dashboard" subtitle="Visão geral"/><Loading/></>;
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Visão geral do sistema RBO"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginBottom:28}}>
        <StatCard label="Clientes"         value={stats.clientes}     icon="clients"   color={C.teal}/>
        <StatCard label="Contratos Ativos" value={stats.contratos}    icon="contracts" color={C.tealL}/>
        <StatCard label="Créditos Totais"  value={stats.creditos}     icon="credit"    color={C.green}/>
        <StatCard label="Assistências"     value={stats.assistencias} icon="wrench"    color={C.amber}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.grey100}`}}><h3 style={{fontSize:15,fontWeight:600,color:C.grey800}}>Últimas Assistências</h3></div>
          {recentes.length===0&&<div style={{padding:24,color:C.grey400,fontSize:13,textAlign:"center"}}>Sem assistências registadas</div>}
          {recentes.map(m=>(
            <div key={m.id} style={{padding:"12px 20px",borderBottom:`1px solid ${C.grey100}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:14,fontWeight:500,color:C.grey800}}>{m.clienteNome||"—"}</div><div style={{fontSize:12,color:C.grey400}}>{m.tecnicoNome||"—"} · {fmtDate(m.data)}</div></div>
              <Badge color={m.creditos<0?C.red:C.green}>{m.creditos>0?"+":""}{m.creditos} cr</Badge>
            </div>
          ))}
        </Card>
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.grey100}`}}><h3 style={{fontSize:15,fontWeight:600,color:C.grey800}}>Contratos por Tipologia</h3></div>
          <div style={{padding:"12px 0"}}>
            {tipStats.length===0&&<div style={{padding:24,color:C.grey400,fontSize:13,textAlign:"center"}}>Sem tipologias</div>}
            {tipStats.map(t=>(
              <div key={t.id} style={{padding:"10px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:14,color:C.grey800}}>{t.nome}</span>
                <Badge>{t.count} contrato{t.count!==1?"s":""}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
