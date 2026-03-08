import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  fmtDate, fmtDateTime, qrUrl, buildReportHtml, sendEmailResend,
  calcSaldo, buildMovStats, filterContratos,
} from "./utils";

const SUPA_URL  = "https://cqgpgryldmzogfygpybl.supabase.co";
const SUPA_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZ3BncnlsZG16b2dmeWdweWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDMwMjksImV4cCI6MjA4ODI3OTAyOX0.MjkBexUvuAAU7sYcRs3uPaJh52jdMG723aqeDVuoe9w";
const sb        = createClient(SUPA_URL, SUPA_ANON);

const C = {
  teal:"#1a7a7a",tealD:"#0d5e5e",tealL:"#2a9b9b",tealXL:"#e6f5f5",tealM:"#b3e0e0",
  white:"#ffffff",grey50:"#f8fafb",grey100:"#eef2f3",grey200:"#d4dde0",
  grey400:"#8fa6ab",grey600:"#4a6468",grey800:"#1e3236",
  red:"#e05a5a",green:"#2db87d",amber:"#e8a83a",
};

const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:#f8fafb;color:#1e3236;}
  ::-webkit-scrollbar{width:6px;height:6px;}
  ::-webkit-scrollbar-track{background:#eef2f3;}
  ::-webkit-scrollbar-thumb{background:#b3e0e0;border-radius:3px;}
  input,select,textarea{font-family:'DM Sans',sans-serif;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
  @keyframes spin{to{transform:rotate(360deg);}}
`;

const Icon = ({ name, size=18, color="currentColor" }) => {
  const icons = {
    dashboard:   <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    contracts:   <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    clients:     <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    types:       <><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></>,
    technicians: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    locations:   <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    plus:        <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    edit:        <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash:       <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
    eye:         <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    close:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    chevronR:    <><polyline points="9 18 15 12 9 6"/></>,
    chevronD:    <><polyline points="6 9 12 15 18 9"/></>,
    credit:      <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
    wrench:      <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
    mail:        <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    mailDone:    <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/><polyline points="7 13 10 16 15 11"/></>,
    qr:          <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="5" y="5" width="3" height="3"/><rect x="16" y="5" width="3" height="3"/><rect x="5" y="16" width="3" height="3"/><line x1="14" y1="14" x2="17" y2="14"/><line x1="20" y1="14" x2="20" y2="17"/><line x1="14" y1="17" x2="17" y2="20"/></>,
    download:    <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    alert:       <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};


// ── UI primitives ──────────────────────────────────────────────────────────────
const Badge = ({ children, color=C.teal }) => (
  <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{children}</span>
);

const Btn = ({ children, onClick, variant="primary", size="md", icon, disabled, title }) => {
  const styles = {
    primary:   {background:C.teal,       color:C.white,  border:"none"},
    secondary: {background:"transparent",color:C.teal,   border:`1.5px solid ${C.teal}`},
    ghost:     {background:"transparent",color:C.grey600,border:"none"},
    danger:    {background:C.red+"15",   color:C.red,    border:`1.5px solid ${C.red}44`},
  };
  const sz = {sm:{padding:"5px 12px",fontSize:13},md:{padding:"8px 18px",fontSize:14},lg:{padding:"11px 24px",fontSize:15}};
  return (
    <button disabled={disabled} onClick={onClick} title={title}
      style={{...styles[variant],...sz[size],borderRadius:8,cursor:disabled?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",gap:6,fontFamily:"'DM Sans',sans-serif",fontWeight:500,transition:"all .15s",opacity:disabled?.5:1}}>
      {icon&&<Icon name={icon} size={15}/>}{children}
    </button>
  );
};

const Input = ({ label, value, onChange, type="text", placeholder, required, textarea, rows=3 }) => (
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label&&<label style={{fontSize:13,fontWeight:500,color:C.grey600}}>{label}{required&&<span style={{color:C.red}}> *</span>}</label>}
    {textarea
      ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{border:`1.5px solid ${C.grey200}`,borderRadius:8,padding:"8px 12px",fontSize:14,outline:"none",resize:"vertical",background:C.white}}/>
      : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{border:`1.5px solid ${C.grey200}`,borderRadius:8,padding:"8px 12px",fontSize:14,outline:"none",height:38,background:C.white}}/>}
  </div>
);

const Select = ({ label, value, onChange, options, required }) => (
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label&&<label style={{fontSize:13,fontWeight:500,color:C.grey600}}>{label}{required&&<span style={{color:C.red}}> *</span>}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{border:`1.5px solid ${C.grey200}`,borderRadius:8,padding:"8px 12px",fontSize:14,outline:"none",height:38,background:C.white,cursor:"pointer"}}>
      <option value="">Selecionar...</option>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Modal = ({ title, onClose, children, wide }) => (
  <div style={{position:"fixed",inset:0,background:"#00000055",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:16,width:"100%",maxWidth:wide?760:520,maxHeight:"90vh",overflow:"auto",boxShadow:"0 25px 60px #00000030",animation:"fadeIn .2s ease"}}>
      <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.grey100}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <h3 style={{fontSize:17,fontWeight:600,color:C.grey800}}>{title}</h3>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.grey400,padding:4}}><Icon name="close" size={20}/></button>
      </div>
      <div style={{padding:24}}>{children}</div>
    </div>
  </div>
);

const Card = ({ children, style }) => (
  <div style={{background:C.white,borderRadius:12,border:`1px solid ${C.grey100}`,boxShadow:"0 1px 8px #0d5e5e08",...style}}>{children}</div>
);

const StatCard = ({ label, value, icon, color=C.teal }) => (
  <Card style={{padding:"20px 24px",display:"flex",alignItems:"center",gap:16}}>
    <div style={{width:48,height:48,borderRadius:12,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <Icon name={icon} size={22} color={color}/>
    </div>
    <div>
      <div style={{fontSize:26,fontWeight:700,color:C.grey800,lineHeight:1}}>{value}</div>
      <div style={{fontSize:13,color:C.grey400,marginTop:4}}>{label}</div>
    </div>
  </Card>
);

const Loading = () => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60,gap:12,color:C.grey400}}>
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" style={{animation:"spin .8s linear infinite"}}>
      <circle cx="12" cy="12" r="10" strokeOpacity=".2"/><path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
    A carregar...
  </div>
);

const ErrMsg = ({ msg, onRetry }) => (
  <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:C.red+"10",border:`1px solid ${C.red}33`,borderRadius:10,margin:"16px 0"}}>
    <Icon name="alert" size={18} color={C.red}/>
    <span style={{fontSize:14,color:C.red,flex:1}}>{msg}</span>
    {onRetry&&<Btn size="sm" variant="danger" onClick={onRetry}>Tentar novamente</Btn>}
  </div>
);

const Table = ({ cols, data, onEdit, onDelete, onView, extraActions, emptyMsg="Sem registos" }) => (
  <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
      <thead>
        <tr style={{borderBottom:`2px solid ${C.grey100}`}}>
          {cols.map(c=><th key={c.key+c.label} style={{padding:"12px 16px",textAlign:"left",fontSize:12,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px",whiteSpace:"nowrap"}}>{c.label}</th>)}
          {(onEdit||onDelete||onView||extraActions)&&<th style={{padding:"12px 16px",width:150}}/>}
        </tr>
      </thead>
      <tbody>
        {data.length===0&&<tr><td colSpan={cols.length+1} style={{padding:"32px 16px",textAlign:"center",color:C.grey400,fontSize:13}}>{emptyMsg}</td></tr>}
        {data.map((row,i)=>(
          <tr key={row.id||i} style={{borderBottom:`1px solid ${C.grey100}`,transition:"background .1s"}}
            onMouseEnter={e=>e.currentTarget.style.background=C.grey50}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            {cols.map(c=><td key={c.key+c.label} style={{padding:"13px 16px",color:C.grey800,verticalAlign:"middle"}}>{c.render?c.render(row[c.key],row):(row[c.key]??"—")}</td>)}
            {(onEdit||onDelete||onView||extraActions)&&(
              <td style={{padding:"8px 16px"}}>
                <div style={{display:"flex",gap:4,justifyContent:"flex-end",alignItems:"center"}}>
                  {extraActions&&extraActions(row)}
                  {onView   &&<Btn variant="ghost" size="sm" icon="eye"   onClick={()=>onView(row)}/>}
                  {onEdit   &&<Btn variant="ghost" size="sm" icon="edit"  onClick={()=>onEdit(row)}/>}
                  {onDelete &&<Btn variant="ghost" size="sm" icon="trash" onClick={()=>onDelete(row.id)}/>}
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PageHeader = ({ title, subtitle, action }) => (
  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,gap:16,flexWrap:"wrap"}}>
    <div>
      <h1 style={{fontSize:24,fontWeight:700,color:C.grey800}}>{title}</h1>
      {subtitle&&<p style={{fontSize:14,color:C.grey400,marginTop:4}}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ── Email Confirm Modal ────────────────────────────────────────────────────────
const EmailConfirmModal = ({ mov, lookup, onSent, onClose }) => {
  const { cliente, tipologia, tecnico, local } = lookup(mov);
  const [emailTo,  setEmailTo]  = useState(cliente?.email || "");
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState(null); // "ok" | Error message

  const doSend = async () => {
    if (!emailTo) return;
    setSending(true); setResult(null);
    try {
      const html    = buildReportHtml({ mov, cliente, tipologia, tecnico, local });
      const subject = `Relatório de Assistência Técnica — ${cliente?.nome||""} — ${fmtDate(mov.data)}`;
      await sendEmailResend({ to: emailTo, subject, html });
      await onSent(mov.id);
      setResult("ok");
    } catch (err) {
      setResult(err.message || "Erro desconhecido");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal title="Enviar Relatório por Email" onClose={result === "ok" ? onClose : onClose}>
      {result === "ok" ? (
        <div style={{textAlign:"center",padding:"20px 0"}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:C.green+"18",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <Icon name="mailDone" size={28} color={C.green}/>
          </div>
          <div style={{fontSize:17,fontWeight:600,color:C.grey800,marginBottom:6}}>Email enviado com sucesso!</div>
          <div style={{fontSize:14,color:C.grey400,marginBottom:24}}>O relatório foi enviado para <strong style={{color:C.grey800}}>{emailTo}</strong></div>
          <Btn onClick={onClose}>Fechar</Btn>
        </div>
      ) : (
        <>
          {/* Info do relatório */}
          <div style={{background:C.grey50,borderRadius:10,padding:"14px 16px",marginBottom:20,border:`1px solid ${C.grey100}`}}>
            <div style={{fontSize:12,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px",marginBottom:8}}>Relatório a enviar</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                ["Cliente",   cliente?.nome],
                ["Data",      fmtDate(mov.data)],
                ["Tipologia", tipologia?.nome],
                ["Técnico",   tecnico?.nome || "—"],
                ["Créditos",  `${mov.creditos > 0 ? "+" : ""}${mov.creditos}`],
                ["Local",     local?.nome || "—"],
              ].map(([l,v])=>(
                <div key={l}>
                  <div style={{fontSize:11,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".4px"}}>{l}</div>
                  <div style={{fontSize:13,color:C.grey800,marginTop:1}}>{v||"—"}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.grey200}`}}>
              <div style={{fontSize:11,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>Descrição</div>
              <div style={{fontSize:13,color:C.grey600,lineHeight:1.5}}>{mov.descritivo}</div>
            </div>
          </div>

          {/* Email destino editável */}
          <div style={{marginBottom:8}}>
            <Input
              label="Enviar para (pode alterar antes de enviar)"
              value={emailTo}
              onChange={setEmailTo}
              type="email"
              placeholder="email@cliente.pt"
              required
            />
            {cliente?.email && emailTo !== cliente.email && (
              <div style={{marginTop:6,fontSize:12,color:C.amber,display:"flex",alignItems:"center",gap:5}}>
                <Icon name="alert" size={13} color={C.amber}/>
                Email diferente do registado na ficha do cliente ({cliente.email})
              </div>
            )}
            {!cliente?.email && (
              <div style={{marginTop:6,fontSize:12,color:C.amber,display:"flex",alignItems:"center",gap:5}}>
                <Icon name="alert" size={13} color={C.amber}/>
                O cliente não tem email na ficha — introduza manualmente
              </div>
            )}
          </div>

          {/* Erro */}
          {result && result !== "ok" && (
            <div style={{background:C.red+"10",border:`1px solid ${C.red}33`,borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:13,color:C.red,display:"flex",gap:8,alignItems:"center"}}>
              <Icon name="alert" size={15} color={C.red}/>
              {result}
            </div>
          )}

          {/* Aviso StackBlitz */}
          <div style={{background:C.amber+"12",border:`1px solid ${C.amber}33`,borderRadius:8,padding:"10px 14px",marginBottom:20,fontSize:12,color:C.grey600,display:"flex",gap:8,alignItems:"flex-start"}}>
            <Icon name="alert" size={14} color={C.amber} style={{flexShrink:0,marginTop:1}}/>
            <span>Em ambiente StackBlitz o envio pode falhar por restrições de rede (CORS). Em produção ou com a Edge Function do Supabase funcionará sem problemas.</span>
          </div>

          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn variant="secondary" onClick={onClose} disabled={sending}>Cancelar</Btn>
            <Btn icon={sending?"loader":"mail"} onClick={doSend} disabled={sending||!emailTo}>
              {sending ? "A enviar..." : "Enviar Relatório"}
            </Btn>
          </div>
        </>
      )}
    </Modal>
  );
};

// ── Email Report Button ────────────────────────────────────────────────────────
const EmailReportBtn = ({ mov, lookup, onSent }) => {
  const sent = mov.relatorio_enviado_em;
  const [showModal, setShowModal] = useState(false);
  const { cliente } = lookup(mov);

  const tipText = sent
    ? `Enviado em ${fmtDateTime(sent)} — clique para reenviar`
    : `Enviar relatório para ${cliente?.email || "cliente"}`;

  return (
    <>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,position:"relative"}}>
        <button onClick={()=>setShowModal(true)} title={tipText}
          style={{background:sent?C.green+"15":"none",border:sent?`1px solid ${C.green}33`:"none",cursor:"pointer",padding:"4px 7px",borderRadius:7,display:"flex",alignItems:"center",transition:"all .15s",position:"relative"}}
          onMouseEnter={e=>e.currentTarget.style.background=sent?C.green+"25":C.tealXL}
          onMouseLeave={e=>e.currentTarget.style.background=sent?C.green+"15":"none"}>
          <Icon name={sent?"mailDone":"mail"} size={16} color={sent?C.green:C.teal}/>
          {sent&&<span style={{position:"absolute",top:0,right:0,width:7,height:7,borderRadius:"50%",background:C.green,border:`1.5px solid ${C.white}`}}/>}
        </button>
        {sent&&<span style={{fontSize:9,color:C.green,fontWeight:700,letterSpacing:".3px"}}>enviado</span>}
      </div>
      {showModal && (
        <EmailConfirmModal
          mov={mov}
          lookup={lookup}
          onSent={onSent}
          onClose={()=>setShowModal(false)}
        />
      )}
    </>
  );
};

// ── Generic CRUD ───────────────────────────────────────────────────────────────
const CrudPage = ({ title, table, cols, formFields, emptyForm }) => {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async()=>{
    setLoading(true); setError(null);
    const { data, error } = await sb.from(table).select("*").order("id");
    if (error) setError(error.message); else setRows(data||[]);
    setLoading(false);
  },[table]);

  useEffect(()=>{ load(); },[load]);

  const openNew  = ()  => { setForm(emptyForm); setEditing(null); setModal(true); };
  const openEdit = r   => { setForm({...r});    setEditing(r.id); setModal(true); };

  const save = async () => {
    setSaving(true);
    const { id: _id, created_at: _ca, ...rest } = form;
    let err;
    if (!editing) ({ error: err } = await sb.from(table).insert([rest]));
    else          ({ error: err } = await sb.from(table).update(rest).eq("id", editing));
    if (err) { alert("Erro: "+err.message); setSaving(false); return; }
    await load(); setSaving(false); setModal(false);
  };

  const del = async id => {
    if (!confirm("Eliminar registo?")) return;
    const { error } = await sb.from(table).delete().eq("id",id);
    if (error) alert("Erro: "+error.message); else await load();
  };

  return (
    <div>
      <PageHeader title={title} subtitle={`${rows.length} registos`} action={<Btn icon="plus" onClick={openNew}>Novo</Btn>}/>
      {error&&<ErrMsg msg={error} onRetry={load}/>}
      <Card style={{padding:0,overflow:"hidden"}}>
        {loading?<Loading/>:<Table cols={cols} data={rows} onEdit={openEdit} onDelete={del}/>}
      </Card>
      {modal&&(
        <Modal title={editing?"Editar":"Novo registo"} onClose={()=>setModal(false)} wide={formFields.length>4}>
          <div style={{display:"grid",gridTemplateColumns:formFields.length>4?"1fr 1fr":"1fr",gap:14}}>
            {formFields.map(f=>(
              <div key={f.k} style={f.full?{gridColumn:"1/-1"}:{}}>
                <Input label={f.label} value={form[f.k]||""} onChange={v=>setForm(p=>({...p,[f.k]:v}))}
                  type={f.type} textarea={f.textarea} rows={f.rows} placeholder={f.placeholder} required={f.required}/>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
            <Btn variant="secondary" onClick={()=>setModal(false)}>Cancelar</Btn>
            <Btn onClick={save} disabled={saving}>{saving?"A guardar...":"Guardar"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [stats,    setStats]    = useState({clientes:0,contratos:0,creditos:0,assistencias:0});
  const [recentes, setRecentes] = useState([]);
  const [tipStats, setTipStats] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(()=>{
    (async()=>{
      const [cliRes,conRes,movRes,tipRes] = await Promise.all([
        sb.from("clientes").select("id",{count:"exact",head:true}),
        sb.from("contratos").select("id,ativo,tipologia_id"),
        sb.from("movimentos").select("id,creditos,tipo,data,contrato_id,tecnico_id").order("data",{ascending:false}),
        sb.from("tipologias").select("id,nome"),
      ]);
      const movs  = movRes.data||[];
      const cons  = conRes.data||[];
      const tips  = tipRes.data||[];
      const assis = movs.filter(m=>m.tipo==="assistencia");
      setStats({clientes:cliRes.count||0,contratos:cons.filter(c=>c.ativo).length,creditos:movs.reduce((s,m)=>s+m.creditos,0),assistencias:assis.length});
      const recentConIds = [...new Set(assis.slice(0,5).map(m=>m.contrato_id))];
      if (recentConIds.length) {
        const {data:cRec} = await sb.from("contratos").select("id,cliente_id").in("id",recentConIds);
        const cliIds = (cRec||[]).map(c=>c.cliente_id);
        const [{data:clRec},{data:tecRec}] = await Promise.all([
          sb.from("clientes").select("id,nome").in("id",cliIds),
          sb.from("tecnicos").select("id,nome"),
        ]);
        setRecentes(assis.slice(0,5).map(m=>{
          const con = (cRec||[]).find(c=>c.id===m.contrato_id);
          const cli = con?(clRec||[]).find(c=>c.id===con.cliente_id):null;
          const tec = m.tecnico_id?(tecRec||[]).find(t=>t.id===m.tecnico_id):null;
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
        <StatCard label="Clientes"         value={stats.clientes}     icon="clients"    color={C.teal}/>
        <StatCard label="Contratos Ativos" value={stats.contratos}    icon="contracts"  color={C.tealL}/>
        <StatCard label="Créditos Totais"  value={stats.creditos}     icon="credit"     color={C.green}/>
        <StatCard label="Assistências"     value={stats.assistencias} icon="wrench"     color={C.amber}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.grey100}`}}><h3 style={{fontSize:15,fontWeight:600}}>Últimas Assistências</h3></div>
          {recentes.length===0&&<div style={{padding:24,color:C.grey400,fontSize:13,textAlign:"center"}}>Sem assistências registadas</div>}
          {recentes.map(m=>(
            <div key={m.id} style={{padding:"12px 20px",borderBottom:`1px solid ${C.grey50}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:14,fontWeight:500}}>{m.clienteNome||"—"}</div><div style={{fontSize:12,color:C.grey400}}>{m.tecnicoNome||"—"} · {fmtDate(m.data)}</div></div>
              <Badge color={m.creditos<0?C.red:C.green}>{m.creditos>0?"+":""}{m.creditos} cr</Badge>
            </div>
          ))}
        </Card>
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.grey100}`}}><h3 style={{fontSize:15,fontWeight:600}}>Contratos por Tipologia</h3></div>
          <div style={{padding:"12px 0"}}>
            {tipStats.length===0&&<div style={{padding:24,color:C.grey400,fontSize:13,textAlign:"center"}}>Sem tipologias</div>}
            {tipStats.map(t=>(
              <div key={t.id} style={{padding:"10px 20px",display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:14}}>{t.nome}</span>
                <Badge>{t.count} contrato{t.count!==1?"s":""}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ── Contract Detail ────────────────────────────────────────────────────────────
const ContratoDetalhe = ({ contrato, onBack }) => {
  const [movimentos, setMovimentos] = useState([]);
  const [tecnicos,   setTecnicos]   = useState([]);
  const [locais,     setLocais]     = useState([]);
  const [cliente,    setCliente]    = useState(null);
  const [tipologia,  setTipologia]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [previewMov, setPreviewMov] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const emptyMov = {data:new Date().toISOString().split("T")[0],hora_inicio:"",hora_fim:"",creditos:"",descritivo:"",tecnico_id:"",local_id:"",tipo:"assistencia"};
  const [form, setForm] = useState(emptyMov);

  const load = useCallback(async()=>{
    setLoading(true);
    const [movRes,tecRes,locRes,cliRes,tipRes] = await Promise.all([
      sb.from("movimentos").select("*").eq("contrato_id",contrato.id).order("data",{ascending:false}),
      sb.from("tecnicos").select("*").order("nome"),
      sb.from("locais").select("*").order("nome"),
      sb.from("clientes").select("*").eq("id",contrato.cliente_id).single(),
      sb.from("tipologias").select("*").eq("id",contrato.tipologia_id).single(),
    ]);
    setMovimentos(movRes.data||[]);
    setTecnicos(tecRes.data||[]);
    setLocais(locRes.data||[]);
    setCliente(cliRes.data);
    setTipologia(tipRes.data);
    setLoading(false);
  },[contrato.id]);

  useEffect(()=>{ load(); },[load]);

  const saldo = calcSaldo(movimentos);

  const openNew  = tipo => { setForm({...emptyMov,tipo}); setEditingId(null); setModal("mov"); };
  const openEdit = m   => { setForm({...m,tecnico_id:m.tecnico_id||"",local_id:m.local_id||"",hora_inicio:m.hora_inicio||"",hora_fim:m.hora_fim||""}); setEditingId(m.id); setModal("mov"); };

  const saveMov = async () => {
    const cred = Number(form.creditos);
    if (!form.data||isNaN(cred)||!form.descritivo) return;
    setSaving(true);
    const payload = {
      contrato_id:contrato.id, data:form.data,
      hora_inicio:form.hora_inicio||null, hora_fim:form.hora_fim||null,
      creditos:cred, descritivo:form.descritivo,
      tecnico_id:form.tecnico_id?Number(form.tecnico_id):null,
      local_id:form.local_id?Number(form.local_id):null,
      tipo:form.tipo,
    };
    let err;
    if (!editingId) ({error:err} = await sb.from("movimentos").insert([payload]));
    else            ({error:err} = await sb.from("movimentos").update(payload).eq("id",editingId));
    if (err) alert("Erro: "+err.message);
    else { await load(); setModal(null); }
    setSaving(false);
  };

  const delMov = async id => {
    if (!confirm("Eliminar movimento?")) return;
    await sb.from("movimentos").delete().eq("id",id);
    await load();
  };

  const onSent = async movId => {
    const ts = new Date().toISOString();
    await sb.from("movimentos").update({relatorio_enviado_em:ts}).eq("id",movId);
    setMovimentos(ms=>ms.map(m=>m.id===movId?{...m,relatorio_enviado_em:ts}:m));
  };

  const lookup = mov => ({
    cliente, tipologia,
    tecnico: mov.tecnico_id?tecnicos.find(t=>t.id===mov.tecnico_id):null,
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
          <h1 style={{fontSize:22,fontWeight:700}}>{cliente?.nome}</h1>
          <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
            <Badge>{tipologia?.nome}</Badge>
            <Badge color={C.grey400}>Desde {fmtDate(contrato.data_contrato)}</Badge>
            <Badge color={saldo>10?C.green:saldo>0?C.amber:C.red}>{saldo} créditos</Badge>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn variant="secondary" size="sm" icon="credit" onClick={()=>openNew("credito")}>Adicionar Créditos</Btn>
          <Btn size="sm" icon="plus" onClick={()=>openNew("assistencia")}>Nova Assistência</Btn>
        </div>
      </div>

      <Card style={{padding:"16px 20px",marginBottom:20,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
        {[["Responsável TI",cliente?.responsavel],["Telefone",cliente?.telefone],["Email",cliente?.email],["Localidade",cliente?.localidade],["Código Postal",cliente?.cp],["GPS",cliente?.gps]].map(([l,v])=>(
          <div key={l}><div style={{fontSize:11,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px"}}>{l}</div><div style={{fontSize:14,marginTop:2}}>{v||"—"}</div></div>
        ))}
        {cliente?.parque&&<div style={{gridColumn:"1/-1"}}><div style={{fontSize:11,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px"}}>Parque Informático</div><div style={{fontSize:14,marginTop:2,color:C.grey600}}>{cliente.parque}</div></div>}
      </Card>

      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.grey100}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{fontSize:15,fontWeight:600}}>Movimentos</h3>
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
            {key:"tecnico_id",  label:"Técnico",    render:v=>v?tecnicos.find(t=>t.id===v)?.nome:"—"},
            {key:"local_id",    label:"Local",      render:v=>v?locais.find(l=>l.id===v)?.nome:"—"},
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
              <Select label="Técnico" value={String(form.tecnico_id||"")} onChange={v=>setForm(f=>({...f,tecnico_id:v}))} options={tecnicos.map(t=>({value:String(t.id),label:t.nome}))}/>
              <Select label="Local"   value={String(form.local_id  ||"")} onChange={v=>setForm(f=>({...f,local_id:v}))}   options={locais.map(l=>({value:String(l.id),label:l.nome}))}/>
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
        const tec = previewMov.tecnico_id?tecnicos.find(t=>t.id===previewMov.tecnico_id):null;
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
            <div style={{background:C.grey50,borderRadius:12,padding:20,display:"flex",gap:20,alignItems:"center",border:`1px solid ${C.grey100}`}}>
              <img src={qrUrl("Assistencia Rilop Ref#"+previewMov.id+" | "+(cliente?.nome||"")+" | "+fmtDate(previewMov.data))} width={120} height={120} alt="QR" style={{borderRadius:8,border:`1px solid ${C.grey200}`,flexShrink:0}}/>
              <div>
                <div style={{fontWeight:600,fontSize:15,marginBottom:6}}>QR Code de Verificação</div>
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

// ── Contratos List ─────────────────────────────────────────────────────────────
const Contratos = () => {
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
      sb.from("contratos").select("*").order("id",{ascending:false}),
      sb.from("clientes").select("id,nome,email").order("nome"),
      sb.from("tipologias").select("*").order("nome"),
      sb.from("movimentos").select("id,contrato_id,creditos,tipo,data").order("data",{ascending:false}),
    ]);
    setRows(conRes.data||[]);
    setClientes(cliRes.data||[]);
    setTipologias(tipRes.data||[]);
    setMovStats(buildMovStats(movRes.data||[]));
    setLoading(false);
  },[]);

  useEffect(()=>{ load(); },[load]);

  const save = async () => {
    if (!form.cliente_id||!form.tipologia_id) return;
    setSaving(true);
    const {data:novo,error} = await sb.from("contratos").insert([{cliente_id:Number(form.cliente_id),tipologia_id:Number(form.tipologia_id),data_contrato:form.data_contrato,ativo:true}]).select().single();
    if (error) { alert("Erro: "+error.message); setSaving(false); return; }
    await sb.from("movimentos").insert([{contrato_id:novo.id,data:form.data_contrato,hora_inicio:null,hora_fim:null,creditos:0,descritivo:"Contrato criado — adicione créditos iniciais",tecnico_id:null,local_id:null,tipo:"credito"}]);
    await load(); setSaving(false); setModal(false);
    setForm({cliente_id:"",tipologia_id:"",data_contrato:new Date().toISOString().split("T")[0],ativo:true});
  };

  const del = async id => {
    if (!confirm("Eliminar contrato e todos os seus movimentos?")) return;
    await sb.from("contratos").delete().eq("id",id);
    await load();
  };

  const filtered = filterContratos(rows, clientes, tipologias, search);

  if (detalhe) return <ContratoDetalhe contrato={detalhe} onBack={()=>{ setDetalhe(null); load(); }}/>;

  return (
    <div>
      <PageHeader title="Contratos" subtitle={`${rows.length} contratos`} action={<Btn icon="plus" onClick={()=>setModal(true)}>Novo Contrato</Btn>}/>
      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.grey100}`}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar..."
            style={{width:"100%",maxWidth:300,border:`1.5px solid ${C.grey200}`,borderRadius:8,padding:"7px 12px",fontSize:13,outline:"none"}}/>
        </div>
        {loading?<Loading/>:<Table
          cols={[
            {key:"cliente_id",    label:"Cliente",     render:v=>{const cl=clientes.find(x=>x.id===v);return <span style={{fontWeight:500}}>{cl?.nome||"—"}</span>;}},
            {key:"tipologia_id",  label:"Tipologia",   render:v=>{const t=tipologias.find(x=>x.id===v);return <Badge>{t?.nome||"—"}</Badge>;}},
            {key:"data_contrato", label:"Data",         render:v=>fmtDate(v)},
            {key:"id",            label:"Últ. Assist.", render:v=>{const s=movStats[v];return s?.ultimaAssist?fmtDate(s.ultimaAssist):<span style={{color:C.grey400}}>—</span>;}},
            {key:"id",            label:"Créditos",    render:v=>{const cr=movStats[v]?.creditos||0;return <span style={{fontFamily:"'DM Mono',monospace",fontWeight:600,color:cr>10?C.green:cr>0?C.amber:C.red}}>{cr}</span>;}},
            {key:"ativo",         label:"Estado",      render:v=><Badge color={v?C.green:C.grey400}>{v?"Ativo":"Inativo"}</Badge>},
          ]}
          data={filtered}
          onView={r=>setDetalhe(r)}
          onDelete={del}
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

// ── Sidebar + App ──────────────────────────────────────────────────────────────
const navItems = [
  {id:"dashboard", label:"Dashboard",  icon:"dashboard"},
  {id:"contratos", label:"Contratos",  icon:"contracts"},
  {id:"clientes",  label:"Clientes",   icon:"clients"},
  {id:"tipologias",label:"Tipologias", icon:"types"},
  {id:"tecnicos",  label:"Técnicos",   icon:"technicians"},
  {id:"locais",    label:"Locais",     icon:"locations"},
];

export default function App() {
  const [page,     setPage]     = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(true);
  const SIDE_W = sideOpen ? 240 : 64;

  const pages = {
    dashboard:  <Dashboard/>,
    contratos:  <Contratos/>,
    clientes:   <CrudPage title="Clientes" table="clientes"
                  cols={[{key:"nome",label:"Nome"},{key:"responsavel",label:"Responsável TI"},{key:"localidade",label:"Localidade"},{key:"telefone",label:"Telefone"},{key:"email",label:"Email"}]}
                  emptyForm={{nome:"",responsavel:"",morada:"",localidade:"",cp:"",gps:"",telefone:"",email:"",parque:""}}
                  formFields={[
                    {k:"nome",label:"Nome da Empresa",required:true,full:true},
                    {k:"responsavel",label:"Responsável Informático"},
                    {k:"telefone",label:"Telefone",type:"tel"},
                    {k:"morada",label:"Morada",full:true},
                    {k:"localidade",label:"Localidade"},
                    {k:"cp",label:"Código Postal",placeholder:"0000-000"},
                    {k:"gps",label:"Coordenadas GPS",placeholder:"lat,lng"},
                    {k:"email",label:"Email",type:"email"},
                    {k:"parque",label:"Parque Informático",textarea:true,rows:3,full:true},
                  ]}/>,
    tipologias: <CrudPage title="Tipologias" table="tipologias"
                  cols={[{key:"nome",label:"Nome"}]}
                  emptyForm={{nome:""}}
                  formFields={[{k:"nome",label:"Nome da Tipologia",required:true}]}/>,
    tecnicos:   <CrudPage title="Técnicos" table="tecnicos"
                  cols={[{key:"nome",label:"Nome"},{key:"email",label:"Email"}]}
                  emptyForm={{nome:"",email:""}}
                  formFields={[{k:"nome",label:"Nome",required:true},{k:"email",label:"Email",type:"email"}]}/>,
    locais:     <CrudPage title="Locais de Assistência" table="locais"
                  cols={[{key:"nome",label:"Local"}]}
                  emptyForm={{nome:""}}
                  formFields={[{k:"nome",label:"Nome do Local",required:true}]}/>,
  };

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{display:"flex",minHeight:"100vh",background:C.grey50}}>
        <aside style={{width:SIDE_W,minHeight:"100vh",background:C.tealD,display:"flex",flexDirection:"column",transition:"width .2s",flexShrink:0,position:"sticky",top:0,height:"100vh",overflow:"hidden"}}>
          <div style={{padding:sideOpen?"24px 20px 20px":"24px 0 20px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${C.tealL}30`,justifyContent:sideOpen?"flex-start":"center"}}>
            <div style={{width:36,height:36,borderRadius:10,background:C.white,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="20" height="20" viewBox="0 0 50 50" fill="none"><path d="M8 42 C8 42 8 8 8 8 C8 4 12 4 12 4 C12 4 28 4 28 4 C42 4 42 18 34 22 C42 26 44 42 30 42 Z" fill={C.tealD}/></svg>
            </div>
            {sideOpen&&<div><div style={{fontWeight:700,fontSize:16,color:C.white,lineHeight:1}}>RBO</div><div style={{fontSize:11,color:C.tealM,marginTop:2}}>Rilop BackOffice</div></div>}
          </div>
          <nav style={{flex:1,padding:"12px 0"}}>
            {navItems.map(item=>{
              const active=page===item.id;
              return (
                <button key={item.id} onClick={()=>setPage(item.id)}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:sideOpen?"11px 20px":"11px 0",justifyContent:sideOpen?"flex-start":"center",background:active?C.tealL+"30":"transparent",border:"none",cursor:"pointer",borderLeft:active?`3px solid ${C.white}`:"3px solid transparent",transition:"all .15s"}}>
                  <Icon name={item.icon} size={19} color={active?C.white:C.tealM}/>
                  {sideOpen&&<span style={{fontSize:14,fontWeight:active?600:400,color:active?C.white:C.tealM}}>{item.label}</span>}
                </button>
              );
            })}
          </nav>
          <button onClick={()=>setSideOpen(s=>!s)}
            style={{padding:"14px",background:"transparent",border:"none",cursor:"pointer",color:C.tealM,display:"flex",justifyContent:sideOpen?"flex-end":"center",borderTop:`1px solid ${C.tealL}30`}}>
            <Icon name={sideOpen?"chevronR":"chevronD"} size={16} color={C.tealM}/>
          </button>
        </aside>
        <main style={{flex:1,padding:"28px 32px",maxWidth:"100%",overflow:"hidden"}}>
          {pages[page]}
        </main>
      </div>
    </>
  );
}
