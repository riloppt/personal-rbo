import React, { useState, useEffect, useCallback, useContext, createContext, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL  = "https://cqgpgryldmzogfygpybl.supabase.co";
const SUPA_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZ3BncnlsZG16b2dmeWdweWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDMwMjksImV4cCI6MjA4ODI3OTAyOX0.MjkBexUvuAAU7sYcRs3uPaJh52jdMG723aqeDVuoe9w";
const sb        = createClient(SUPA_URL, SUPA_ANON);

// ─── Resend ───────────────────────────────────────────────────────────────────
const RESEND_KEY  = "re_MuY5yWVu_J3JoBwyfRfARsN6tUxP6fmzP";
const RESEND_FROM = "Rilop RBO <onboarding@resend.dev>";
const sendEmailResend = async ({ to, subject, html }) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, html }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Erro ao enviar email");
  return data;
};

// ─── Theme ────────────────────────────────────────────────────────────────────
const LIGHT = {
  teal:"#1a7a7a",tealD:"#0d5e5e",tealL:"#2a9b9b",tealXL:"#e6f5f5",tealM:"#b3e0e0",
  white:"#ffffff",grey50:"#f8fafb",grey100:"#eef2f3",grey200:"#d4dde0",
  grey400:"#8fa6ab",grey600:"#4a6468",grey800:"#1e3236",
  red:"#e05a5a",green:"#2db87d",amber:"#e8a83a",isDark:false,
};
const DARK = {
  teal:"#2a9d9d",tealD:"#0d5e5e",tealL:"#3abcbc",tealXL:"#0d2828",tealM:"#4d8e8e",
  white:"#122424",grey50:"#0a1818",grey100:"#162424",grey200:"#1e3535",
  grey400:"#4d7878",grey600:"#7aa0a0",grey800:"#cee4e4",
  red:"#e07878",green:"#3acc8d",amber:"#e8b858",isDark:true,
};
const ThemeCtx = createContext(LIGHT);
const useTheme = () => useContext(ThemeCtx);

// ─── Global Style ─────────────────────────────────────────────────────────────
const getGlobalStyle = (C) => `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:${C.grey50};color:${C.grey800};transition:background .2s,color .2s;}
  ::-webkit-scrollbar{width:6px;height:6px;}
  ::-webkit-scrollbar-track{background:${C.grey100};}
  ::-webkit-scrollbar-thumb{background:${C.tealM};border-radius:3px;}
  input,select,textarea{font-family:'DM Sans',sans-serif;color-scheme:${C.isDark?"dark":"light"};}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
  @keyframes spin{to{transform:rotate(360deg);}}
`;

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size=18, color="currentColor" }) => {
  const icons = {
    dashboard:   <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    contracts:   <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    clients:     <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    types:       <><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></>,
    technicians: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    locations:   <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    settings:    <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    moon:        <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
    sun:         <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    menu:        <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
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
    user:        <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    userPlus:    <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></>,
    logout:      <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    copy:        <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    check:       <><polyline points="20 6 9 12 4 10"/></>,
    eyeOff:      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>,
    key:         <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>,
    grip:        <><circle cx="9" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="19" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="19" r="1" fill="currentColor" stroke="none"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

// ─── Utils ────────────────────────────────────────────────────────────────────
const fmtDate     = d => d ? new Date(d+"T00:00:00").toLocaleDateString("pt-PT") : "—";
const fmtDateTime = d => d ? new Date(d).toLocaleString("pt-PT") : "—";
const qrUrl       = t => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(t)}`;

// ─── Report HTML ──────────────────────────────────────────────────────────────
const buildReportHtml = ({ mov, cliente, tipologia, tecnico, local }) => {
  const duracao = mov.hora_inicio && mov.hora_fim ? (() => {
    const [h1,m1]=mov.hora_inicio.split(":").map(Number);
    const [h2,m2]=mov.hora_fim.split(":").map(Number);
    const mins=(h2*60+m2)-(h1*60+m1);
    return mins>0 ? `${Math.floor(mins/60)}h ${mins%60}min` : "—";
  })() : "—";
  return `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Relatório — ${cliente?.nome||""}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'DM Sans',sans-serif;background:#f8fafb;color:#1e3236;}
.page{max-width:720px;margin:0 auto;background:#fff;min-height:100vh;box-shadow:0 0 40px #0d5e5e15;}
.header{background:#0d5e5e;padding:36px 40px;display:flex;justify-content:space-between;align-items:flex-start;}
.logo{font-size:26px;font-weight:700;color:#fff;}.logo-sub{font-size:12px;color:#b3e0e0;margin-top:3px;}
.ref{text-align:right;color:#b3e0e0;font-size:13px;}.ref-num{font-size:28px;font-weight:700;color:#fff;font-family:'DM Mono',monospace;}
.tag{display:inline-block;background:#ffffff22;color:#fff;border:1px solid #ffffff33;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:600;margin-top:10px;}
.client-name{color:#fff;font-size:20px;font-weight:600;margin-top:8px;}
.body{padding:36px 40px;}.sec-title{font-size:11px;font-weight:600;color:#8fa6ab;text-transform:uppercase;letter-spacing:.8px;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #eef2f3;}
.section{margin-bottom:28px;}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.field label{font-size:11px;font-weight:600;color:#8fa6ab;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:3px;}.field .val{font-size:14px;color:#1e3236;}
.desc{background:#f8fafb;border:1px solid #eef2f3;border-radius:10px;padding:16px;font-size:14px;line-height:1.7;color:#4a6468;}
.cred-box{background:#0d5e5e;border-radius:12px;padding:20px 24px;}.cred-val{font-size:40px;font-weight:700;font-family:'DM Mono',monospace;}
.cred-label{font-size:13px;color:#b3e0e0;margin-top:4px;}
.qr-box{display:flex;gap:20px;align-items:center;background:#f8fafb;border-radius:12px;padding:20px 24px;border:1px solid #eef2f3;}
.qr-info strong{font-size:14px;font-weight:600;display:block;margin-bottom:4px;}.qr-info p{font-size:13px;color:#4a6468;line-height:1.6;}
.footer{background:#f8fafb;padding:24px 40px;border-top:1px solid #eef2f3;display:flex;justify-content:space-between;align-items:center;}
.footer-brand{font-size:12px;color:#8fa6ab;}.footer-brand strong{color:#1e3236;display:block;font-size:13px;}
.btn-pdf{background:#1a7a7a;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500;}
.neg{color:#e05a5a!important;}.pos{color:#2db87d!important;}
@media print{.btn-pdf{display:none!important;}.page{box-shadow:none;}}
</style></head><body><div class="page">
<div class="header">
  <div><div class="logo">rilop</div><div class="logo-sub">Serviços de Tecnologia de Informação</div>
  <div class="client-name">${cliente?.nome||"—"}</div><span class="tag">${tipologia?.nome||"—"}</span></div>
  <div class="ref"><div class="ref-num">#${mov.id}</div><div>${fmtDate(mov.data)}</div>${mov.hora_inicio?`<div>${mov.hora_inicio}${mov.hora_fim?" → "+mov.hora_fim:""}</div>`:""}</div>
</div>
<div class="body">
  <div class="section"><div class="sec-title">Dados do Cliente</div>
    <div class="grid">
      <div class="field"><label>Empresa</label><div class="val">${cliente?.nome||"—"}</div></div>
      <div class="field"><label>Técnico</label><div class="val">${tecnico?.nome||"—"}</div></div>
      <div class="field"><label>Morada</label><div class="val">${cliente?.morada||"—"}, ${cliente?.localidade||""}</div></div>
      <div class="field"><label>Contacto</label><div class="val">${cliente?.telefone||"—"}</div></div>
    </div>
  </div>
  <div class="section"><div class="sec-title">Detalhe da Assistência</div>
    <div class="grid" style="margin-bottom:16px;">
      <div class="field"><label>Data</label><div class="val">${fmtDate(mov.data)}</div></div>
      <div class="field"><label>Duração</label><div class="val">${duracao}</div></div>
      <div class="field"><label>Técnico</label><div class="val">${tecnico?.nome||"—"}</div></div>
      <div class="field"><label>Local</label><div class="val">${local?.nome||"—"}</div></div>
    </div>
    <div class="desc">${mov.descritivo||"—"}</div>
  </div>
  <div class="section"><div class="sec-title">Créditos Consumidos</div>
    <div class="cred-box">
      <div class="cred-val ${mov.creditos<0?"neg":"pos"}">${mov.creditos>0?"+":""}${mov.creditos}</div>
      <div class="cred-label">créditos nesta assistência</div>
    </div>
  </div>
  <div class="section"><div class="sec-title">Verificação Digital</div>
    <div class="qr-box">
      <img src="${qrUrl("Assistencia Rilop Ref#"+mov.id+" | "+(cliente?.nome||"")+" | "+fmtDate(mov.data)+" | "+(tecnico?.nome||""))}" width="110" height="110" alt="QR" style="border-radius:8px;border:1px solid #eef2f3;flex-shrink:0;"/>
      <div class="qr-info"><strong>QR Code de Verificação</strong>
        <p>Digitalize para verificar a autenticidade deste relatório e aceder à versão digital com opção de download em PDF.</p>
        <p style="margin-top:8px;font-size:12px;color:#8fa6ab;">Ref. #${mov.id} · ${fmtDate(mov.data)} · ${cliente?.nome||""}</p>
      </div>
    </div>
  </div>
</div>
<div class="footer">
  <div class="footer-brand"><strong>rilop</strong>Relatório gerado pelo RBO · ${new Date().toLocaleString("pt-PT")}</div>
  <button class="btn-pdf" onclick="window.print()">⬇ Download PDF</button>
</div>
</div></body></html>`;
};

// ─── UI Primitives ────────────────────────────────────────────────────────────
const Badge = ({ children, color }) => {
  const C = useTheme();
  const col = color || C.teal;
  return (
    <span style={{background:col+"22",color:col,border:`1px solid ${col}44`,borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{children}</span>
  );
};

const Btn = ({ children, onClick, variant="primary", size="md", icon, disabled, title }) => {
  const C = useTheme();
  const styles = {
    primary:   {background:C.teal,       color:"#ffffff",border:"none"},
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

const Input = ({ label, value, onChange, type="text", placeholder, required, textarea, rows=3 }) => {
  const C = useTheme();
  const base = {border:`1.5px solid ${C.grey200}`,borderRadius:8,padding:"8px 12px",fontSize:14,outline:"none",background:C.white,color:C.grey800,width:"100%"};
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label&&<label style={{fontSize:13,fontWeight:500,color:C.grey600}}>{label}{required&&<span style={{color:C.red}}> *</span>}</label>}
      {textarea
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...base,resize:"vertical"}}/>
        : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{...base,height:38}}/>}
    </div>
  );
};

const Select = ({ label, value, onChange, options, required }) => {
  const C = useTheme();
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label&&<label style={{fontSize:13,fontWeight:500,color:C.grey600}}>{label}{required&&<span style={{color:C.red}}> *</span>}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{border:`1.5px solid ${C.grey200}`,borderRadius:8,padding:"8px 12px",fontSize:14,outline:"none",height:38,background:C.white,color:C.grey800,cursor:"pointer"}}>
        <option value="">Selecionar...</option>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
};

const Modal = ({ title, onClose, children, wide }) => {
  const C = useTheme();
  return (
    <div style={{position:"fixed",inset:0,background:"#00000066",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:16,width:"100%",maxWidth:wide?760:520,maxHeight:"90vh",overflow:"auto",boxShadow:"0 25px 60px #00000040",animation:"fadeIn .2s ease"}}>
        <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.grey100}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h3 style={{fontSize:17,fontWeight:600,color:C.grey800}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.grey400,padding:4}}><Icon name="close" size={20}/></button>
        </div>
        <div style={{padding:24}}>{children}</div>
      </div>
    </div>
  );
};

const Card = ({ children, style }) => {
  const C = useTheme();
  return <div style={{background:C.white,borderRadius:12,border:`1px solid ${C.grey100}`,boxShadow:`0 1px 8px #0d5e5e08`,...style}}>{children}</div>;
};

const StatCard = ({ label, value, icon, color }) => {
  const C = useTheme();
  const col = color || C.teal;
  return (
    <Card style={{padding:"20px 24px",display:"flex",alignItems:"center",gap:16}}>
      <div style={{width:48,height:48,borderRadius:12,background:col+"18",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon name={icon} size={22} color={col}/>
      </div>
      <div>
        <div style={{fontSize:26,fontWeight:700,color:C.grey800,lineHeight:1}}>{value}</div>
        <div style={{fontSize:13,color:C.grey400,marginTop:4}}>{label}</div>
      </div>
    </Card>
  );
};

const Loading = () => {
  const C = useTheme();
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60,gap:12,color:C.grey400}}>
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" style={{animation:"spin .8s linear infinite"}}>
        <circle cx="12" cy="12" r="10" strokeOpacity=".2"/><path d="M12 2a10 10 0 0 1 10 10"/>
      </svg>
      A carregar...
    </div>
  );
};

const ErrMsg = ({ msg, onRetry }) => {
  const C = useTheme();
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:C.red+"10",border:`1px solid ${C.red}33`,borderRadius:10,margin:"16px 0"}}>
      <Icon name="alert" size={18} color={C.red}/>
      <span style={{fontSize:14,color:C.red,flex:1}}>{msg}</span>
      {onRetry&&<Btn size="sm" variant="danger" onClick={onRetry}>Tentar novamente</Btn>}
    </div>
  );
};

const Table = ({ cols, data, onEdit, onDelete, onView, extraActions, emptyMsg="Sem registos" }) => {
  const C = useTheme();
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
        <thead>
          <tr style={{borderBottom:`2px solid ${C.grey100}`}}>
            {cols.map(c=><th key={c.key+c.label} style={{padding:"12px 16px",textAlign:"left",fontSize:12,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px",whiteSpace:"nowrap",background:C.white}}>{c.label}</th>)}
            {(onEdit||onDelete||onView||extraActions)&&<th style={{padding:"12px 16px",width:150,background:C.white}}/>}
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
};

const PageHeader = ({ title, subtitle, action }) => {
  const C = useTheme();
  return (
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,gap:16,flexWrap:"wrap"}}>
      <div>
        <h1 style={{fontSize:24,fontWeight:700,color:C.grey800}}>{title}</h1>
        {subtitle&&<p style={{fontSize:14,color:C.grey400,marginTop:4}}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
};

// ─── Email Confirm Modal ───────────────────────────────────────────────────────
const EmailConfirmModal = ({ mov, lookup, onSent, onClose }) => {
  const C = useTheme();
  const { cliente, tipologia, tecnico, local } = lookup(mov);
  const [emailTo,  setEmailTo]  = useState(cliente?.email || "");
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState(null);

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
    <Modal title="Enviar Relatório por Email" onClose={onClose}>
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
          <div style={{background:C.grey50,borderRadius:10,padding:"14px 16px",marginBottom:20,border:`1px solid ${C.grey100}`}}>
            <div style={{fontSize:12,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px",marginBottom:8}}>Relatório a enviar</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["Cliente",cliente?.nome],["Data",fmtDate(mov.data)],["Tipologia",tipologia?.nome],["Técnico",tecnico?.nome||"—"],["Créditos",`${mov.creditos>0?"+":""}${mov.creditos}`],["Local",local?.nome||"—"]].map(([l,v])=>(
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
          <div style={{marginBottom:8}}>
            <Input label="Enviar para (pode alterar antes de enviar)" value={emailTo} onChange={setEmailTo} type="email" placeholder="email@cliente.pt" required/>
            {cliente?.email && emailTo !== cliente.email && (
              <div style={{marginTop:6,fontSize:12,color:C.amber,display:"flex",alignItems:"center",gap:5}}>
                <Icon name="alert" size={13} color={C.amber}/> Email diferente do registado na ficha ({cliente.email})
              </div>
            )}
            {!cliente?.email && (
              <div style={{marginTop:6,fontSize:12,color:C.amber,display:"flex",alignItems:"center",gap:5}}>
                <Icon name="alert" size={13} color={C.amber}/> O cliente não tem email na ficha — introduza manualmente
              </div>
            )}
          </div>
          {result && result !== "ok" && (
            <div style={{background:C.red+"10",border:`1px solid ${C.red}33`,borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:13,color:C.red,display:"flex",gap:8,alignItems:"center"}}>
              <Icon name="alert" size={15} color={C.red}/>{result}
            </div>
          )}
          <div style={{background:C.amber+"12",border:`1px solid ${C.amber}33`,borderRadius:8,padding:"10px 14px",marginBottom:20,fontSize:12,color:C.grey600,display:"flex",gap:8,alignItems:"flex-start"}}>
            <Icon name="alert" size={14} color={C.amber}/>
            <span>Em ambiente StackBlitz o envio pode falhar por restrições de rede (CORS). Em produção ou com a Edge Function do Supabase funcionará normalmente.</span>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn variant="secondary" onClick={onClose} disabled={sending}>Cancelar</Btn>
            <Btn icon={sending?"loader":"mail"} onClick={doSend} disabled={sending||!emailTo}>{sending?"A enviar...":"Enviar Relatório"}</Btn>
          </div>
        </>
      )}
    </Modal>
  );
};

// ─── Email Report Button ───────────────────────────────────────────────────────
const EmailReportBtn = ({ mov, lookup, onSent }) => {
  const C = useTheme();
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
      {showModal&&<EmailConfirmModal mov={mov} lookup={lookup} onSent={onSent} onClose={()=>setShowModal(false)}/>}
    </>
  );
};


// ─── Login Screen ─────────────────────────────────────────────────────────────
const LoginScreen = () => {
  const C = useTheme();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const doLogin = async () => {
    if (!email || !password) return;
    setLoading(true); setError(null);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) setError(error.message === "Invalid login credentials"
      ? "Email ou password incorretos."
      : error.message);
    setLoading(false);
  };

  const handleKey = e => { if (e.key === "Enter") doLogin(); };

  return (
    <div style={{minHeight:"100vh",background:"#0a1818",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:380}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{width:56,height:56,borderRadius:16,background:"#0d5e5e",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <svg width="32" height="32" viewBox="0 0 50 50" fill="none">
              <path d="M8 42 C8 42 8 8 8 8 C8 4 12 4 12 4 C12 4 28 4 28 4 C42 4 42 18 34 22 C42 26 44 42 30 42 Z" fill="#4d8e8e"/>
            </svg>
          </div>
          <div style={{fontSize:26,fontWeight:700,color:"#ffffff",letterSpacing:".5px"}}>RBO</div>
          <div style={{fontSize:13,color:"#4d8e8e",marginTop:4}}>Rilop BackOffice</div>
        </div>

        {/* Card */}
        <div style={{background:"#122424",borderRadius:16,padding:"28px 28px 24px",border:"1px solid #1e3535"}}>
          <h2 style={{fontSize:18,fontWeight:600,color:"#cee4e4",marginBottom:22}}>Iniciar sessão</h2>

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:"#4d8e8e",textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:6}}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={handleKey}
                placeholder="email@empresa.pt" autoComplete="email"
                style={{width:"100%",background:"#0a1818",border:"1.5px solid #1e3535",borderRadius:9,padding:"10px 14px",fontSize:14,color:"#cee4e4",outline:"none",boxSizing:"border-box"}}
                onFocus={e=>e.target.style.borderColor="#1a7a7a"}
                onBlur={e=>e.target.style.borderColor="#1e3535"}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:"#4d8e8e",textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:6}}>Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={handleKey}
                placeholder="••••••••" autoComplete="current-password"
                style={{width:"100%",background:"#0a1818",border:"1.5px solid #1e3535",borderRadius:9,padding:"10px 14px",fontSize:14,color:"#cee4e4",outline:"none",boxSizing:"border-box"}}
                onFocus={e=>e.target.style.borderColor="#1a7a7a"}
                onBlur={e=>e.target.style.borderColor="#1e3535"}/>
            </div>
          </div>

          {error && (
            <div style={{marginTop:14,background:"#e07878" + "18",border:"1px solid #e07878" + "44",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#e07878",display:"flex",gap:8,alignItems:"center"}}>
              <Icon name="alert" size={14} color="#e07878"/>{error}
            </div>
          )}

          <button onClick={doLogin} disabled={loading||!email||!password}
            style={{width:"100%",marginTop:20,background:loading||!email||!password?"#0d5e5e88":"#1a7a7a",color:"#ffffff",border:"none",borderRadius:9,padding:"11px",fontSize:15,fontWeight:600,cursor:loading||!email||!password?"not-allowed":"pointer",transition:"background .15s",fontFamily:"'DM Sans',sans-serif"}}>
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </div>

        <div style={{textAlign:"center",marginTop:20,fontSize:12,color:"#2a5050"}}>
          Rilop BackOffice · Acesso restrito
        </div>
      </div>
    </div>
  );
};

// ─── Access Denied ─────────────────────────────────────────────────────────────
const AccessDenied = ({ email }) => (
  <div style={{minHeight:"100vh",background:"#0a1818",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{textAlign:"center",maxWidth:340}}>
      <div style={{width:56,height:56,borderRadius:"50%",background:"#e0787818",border:"1px solid #e0787844",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
        <Icon name="alert" size={26} color="#e07878"/>
      </div>
      <div style={{fontSize:18,fontWeight:600,color:"#cee4e4",marginBottom:8}}>Sem acesso</div>
      <div style={{fontSize:14,color:"#4d8e8e",lineHeight:1.6,marginBottom:24}}>
        A conta <strong style={{color:"#7abfbf"}}>{email}</strong> não tem acesso ao RBO.<br/>Contacta o administrador.
      </div>
      <button onClick={()=>sb.auth.signOut()}
        style={{background:"#1e3535",color:"#7abfbf",border:"1px solid #2a5050",borderRadius:8,padding:"9px 20px",fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
        Sair
      </button>
    </div>
  </div>
);

// ─── Utilizadores Panel ───────────────────────────────────────────────────────
const UtilizadoresPanel = ({ currentUserId }) => {
  const C = useTheme();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [errMsg,  setErrMsg]  = useState(null);
  const [form,    setForm]    = useState({email:"",nome:"",password:"",is_tecnico:false});

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("rbo_profiles").select("*").order("created_at");
    setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleAtivo = async (user) => {
    if (user.id === currentUserId) { setErrMsg("Não podes desativar a tua própria conta."); return; }
    await sb.from("rbo_profiles").update({ ativo: !user.ativo }).eq("id", user.id);
    await load();
  };

  const toggleTecnico = async (user) => {
    await sb.from("rbo_profiles").update({ is_tecnico: !user.is_tecnico }).eq("id", user.id);
    await load();
  };

  const openEdit = (user) => {
    setForm({id:user.id, nome:user.nome||"", email:user.email||"", password:"", is_tecnico:user.is_tecnico});
    setErrMsg(null);
    setModal("edit");
  };

  const saveUser = async () => {
    if (!form.id) return;
    setSaving(true); setErrMsg(null);
    // Update profile
    const { error: profErr } = await sb.from("rbo_profiles")
      .update({ nome: form.nome||null, email: form.email||null })
      .eq("id", form.id);
    if (profErr) { setErrMsg("Erro ao guardar: " + profErr.message); setSaving(false); return; }
    // Update password only for own account
    if (form.password && form.id === currentUserId) {
      const { error: passErr } = await sb.auth.updateUser({ password: form.password });
      if (passErr) { setErrMsg("Perfil guardado mas erro na password: " + passErr.message); setSaving(false); await load(); return; }
    }
    await load();
    setSaving(false);
    setModal(false);
    setForm({email:"",nome:"",password:"",is_tecnico:false});
  };

  const deleteUser = async (user) => {
    if (user.id === currentUserId) { setErrMsg("Não podes eliminar a tua própria conta."); return; }
    // Verificar se tem movimentos associados
    const { count } = await sb.from("rbo_movimentos")
      .select("id", { count: "exact", head: true })
      .eq("profile_tecnico_id", user.id);
    if (count > 0) {
      setErrMsg(`Não é possível eliminar "${user.nome||user.email}" porque tem ${count} movimento${count!==1?"s":""} associado${count!==1?"s":""}. Podes inativá-lo em alternativa.`);
      return;
    }
    if (!confirm(`Eliminar o utilizador "${user.nome||user.email}"? Esta acção não pode ser desfeita.`)) return;
    await sb.from("rbo_profiles").delete().eq("id", user.id);
    await load();
  };

  const createUser = async () => {
    if (!form.email || !form.password) return;
    setSaving(true); setErrMsg(null);
    // Criar conta no Supabase Auth (sem enviar email)
    const { data, error } = await sb.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: null },
    });
    if (error) { setErrMsg("Erro: " + error.message); setSaving(false); return; }
    const uid = data?.user?.id;
    if (uid) {
      await sb.from("rbo_profiles").upsert({
        id: uid, email: form.email,
        nome: form.nome || null,
        ativo: true,
        is_tecnico: form.is_tecnico,
      });
    }
    await load();
    setSaving(false);
    setModal(false);
    setForm({email:"",nome:"",password:"",is_tecnico:false});
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <span style={{fontSize:13,color:C.grey400}}>{users.length} utilizador{users.length!==1?"es":""}</span>
        <Btn icon="userPlus" size="sm" onClick={()=>{setForm({email:"",nome:"",password:"",is_tecnico:false});setErrMsg(null);setModal("new");}}>Novo utilizador</Btn>
      </div>

      {errMsg && (
        <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 16px",background:C.amber+"12",border:`1px solid ${C.amber}44`,borderRadius:10,marginBottom:16}}>
          <Icon name="alert" size={16} color={C.amber}/>
          <span style={{fontSize:13,color:C.grey800,flex:1}}>{errMsg}</span>
          <button onClick={()=>setErrMsg(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.grey400}}><Icon name="close" size={14}/></button>
        </div>
      )}

      <Card style={{padding:0,overflow:"hidden"}}>
        {loading ? <Loading/> : (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${C.grey100}`}}>
                  {["Nome","Email","Técnico","Estado",""].map(h=>(
                    <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:12,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px",background:C.white,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length===0 && (
                  <tr><td colSpan={5} style={{padding:"32px 16px",textAlign:"center",color:C.grey400,fontSize:13}}>Sem utilizadores</td></tr>
                )}
                {users.map(u=>(
                  <tr key={u.id} style={{borderBottom:`1px solid ${C.grey100}`,transition:"background .1s"}}
                    onMouseEnter={e=>e.currentTarget.style.background=C.grey50}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"13px 16px",color:C.grey800,fontWeight:500,whiteSpace:"nowrap"}}>
                      {u.nome || "—"}
                      {u.id === currentUserId && <span style={{marginLeft:8,fontSize:11,background:C.teal+"22",color:C.teal,borderRadius:10,padding:"1px 8px",fontWeight:600}}>Tu</span>}
                    </td>
                    <td style={{padding:"13px 16px",color:C.grey600,fontSize:13}}>{u.email}</td>
                    <td style={{padding:"13px 16px"}}>
                      <button onClick={()=>toggleTecnico(u)} title={u.is_tecnico?"Remover técnico":"Marcar como técnico"}
                        style={{background:u.is_tecnico?C.teal+"22":"transparent",border:`1px solid ${u.is_tecnico?C.teal+"44":C.grey200}`,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:12,fontWeight:600,color:u.is_tecnico?C.teal:C.grey400,transition:"all .15s"}}>
                        {u.is_tecnico ? "✓ Sim" : "Não"}
                      </button>
                    </td>
                    <td style={{padding:"13px 16px"}}>
                      <Badge color={u.ativo?C.green:C.grey400}>{u.ativo?"Ativo":"Inativo"}</Badge>
                    </td>
                    <td style={{padding:"8px 16px"}}>
                      <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                        {u.id === currentUserId && (
                          <button onClick={()=>openEdit(u)} title="Editar o meu perfil"
                            style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,display:"flex",alignItems:"center",transition:"background .15s"}}
                            onMouseEnter={e=>e.currentTarget.style.background=C.grey100}
                            onMouseLeave={e=>e.currentTarget.style.background="none"}>
                            <Icon name="edit" size={14} color={C.teal}/>
                          </button>
                        )}
                        {u.id !== currentUserId && (
                          <>
                            <button onClick={()=>openEdit(u)} title="Editar utilizador"
                              style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,display:"flex",alignItems:"center",transition:"background .15s"}}
                              onMouseEnter={e=>e.currentTarget.style.background=C.grey100}
                              onMouseLeave={e=>e.currentTarget.style.background="none"}>
                              <Icon name="edit" size={14} color={C.teal}/>
                            </button>
                            <button onClick={()=>toggleAtivo(u)} title={u.ativo?"Inativar":"Ativar"}
                              style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,display:"flex",alignItems:"center",transition:"background .15s"}}
                              onMouseEnter={e=>e.currentTarget.style.background=C.grey100}
                              onMouseLeave={e=>e.currentTarget.style.background="none"}>
                              <Icon name={u.ativo?"close":"eye"} size={14} color={u.ativo?C.amber:C.green}/>
                            </button>
                            <button onClick={()=>deleteUser(u)} title="Eliminar utilizador"
                              style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,display:"flex",alignItems:"center",transition:"background .15s"}}
                              onMouseEnter={e=>e.currentTarget.style.background=C.red+"15"}
                              onMouseLeave={e=>e.currentTarget.style.background="none"}>
                              <Icon name="trash" size={14} color={C.red}/>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal && (
        <Modal title={modal==="edit" ? "Editar utilizador" : "Novo utilizador"} onClose={()=>{setModal(false);setErrMsg(null);}}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Input label="Nome" value={form.nome} onChange={v=>setForm(f=>({...f,nome:v}))} placeholder="Nome completo"/>
            <Input label="Email" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} type="email" placeholder="email@empresa.pt" required={modal==="new"}/>
            {(modal==="new" || form.id===currentUserId) && (
              <Input label={modal==="edit"?"Nova password (deixar em branco para não alterar)":"Password"}
                value={form.password} onChange={v=>setForm(f=>({...f,password:v}))}
                type="password" placeholder={modal==="edit"?"••••••••":"Mínimo 6 caracteres"}
                required={modal==="new"}/>
            )}
            {modal==="new" && (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.grey50,borderRadius:8,border:`1px solid ${C.grey100}`}}>
                <input type="checkbox" id="is_tecnico" checked={form.is_tecnico} onChange={e=>setForm(f=>({...f,is_tecnico:e.target.checked}))}
                  style={{width:16,height:16,accentColor:C.teal,cursor:"pointer"}}/>
                <label htmlFor="is_tecnico" style={{fontSize:14,color:C.grey800,cursor:"pointer"}}>
                  Este utilizador é também um <strong>técnico</strong> (aparece na seleção de assistências)
                </label>
              </div>
            )}
            {modal==="edit" && form.id!==currentUserId && (
              <div style={{background:C.amber+"12",border:`1px solid ${C.amber}33`,borderRadius:8,padding:"10px 14px",fontSize:12,color:C.grey600,display:"flex",gap:8}}>
                <Icon name="alert" size={14} color={C.amber}/>
                <span>A password só pode ser alterada pelo próprio utilizador.</span>
              </div>
            )}
          </div>
          {errMsg && (
            <div style={{marginTop:12,background:C.red+"10",border:`1px solid ${C.red}33`,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.red,display:"flex",gap:8,alignItems:"center"}}>
              <Icon name="alert" size={14} color={C.red}/>{errMsg}
            </div>
          )}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
            <Btn variant="secondary" onClick={()=>setModal(false)}>Cancelar</Btn>
            <Btn onClick={modal==="edit" ? saveUser : createUser}
              disabled={saving||(modal==="new"&&(!form.email||!form.password))}>
              {saving ? (modal==="edit"?"A guardar...":"A criar...") : (modal==="edit"?"Guardar":"Criar utilizador")}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Generic CRUD ─────────────────────────────────────────────────────────────
const CrudPage = ({ title, table, cols, formFields, emptyForm, compact, hasAtivo, fieldOptions, onView }) => {
  const C = useTheme();
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [delErr,    setDelErr]    = useState(null); // FK delete error
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState(emptyForm);
  const [editing,   setEditing]   = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [showInativos, setShowInativos] = useState(false);

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
    setDelErr(null);
    if (!confirm("Eliminar registo permanentemente?")) return;
    const { error } = await sb.from(table).delete().eq("id", id);
    if (error) {
      // FK violation
      if (error.code === "23503") {
        setDelErr("Não é possível eliminar este registo porque está associado a movimentos existentes. Pode inativá-lo em alternativa.");
      } else {
        setDelErr("Erro ao eliminar: " + error.message);
      }
    } else {
      await load();
    }
  };

  const toggleAtivo = async row => {
    const { error } = await sb.from(table).update({ ativo: !row.ativo }).eq("id", row.id);
    if (error) alert("Erro: " + error.message); else await load();
  };

  const visibleRows = hasAtivo
    ? rows.filter(r => showInativos ? true : r.ativo !== false)
    : rows;

  const inativosCount = hasAtivo ? rows.filter(r => r.ativo === false).length : 0;

  return (
    <div>
      {!compact && <PageHeader title={title} subtitle={`${visibleRows.length} registos`} action={<Btn icon="plus" onClick={openNew}>Novo</Btn>}/>}
      {compact && (
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <span style={{fontSize:13,color:C.grey400}}>{visibleRows.length} registos</span>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {hasAtivo && inativosCount > 0 && (
              <button onClick={()=>setShowInativos(s=>!s)}
                style={{fontSize:12,color:C.grey400,background:"none",border:`1px solid ${C.grey200}`,borderRadius:6,padding:"4px 10px",cursor:"pointer"}}>
                {showInativos ? "Ocultar inativos" : `Mostrar inativos (${inativosCount})`}
              </button>
            )}
            <Btn icon="plus" size="sm" onClick={openNew}>Novo</Btn>
          </div>
        </div>
      )}
      {error&&<ErrMsg msg={error} onRetry={load}/>}
      {delErr&&(
        <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 16px",background:C.amber+"12",border:`1px solid ${C.amber}44`,borderRadius:10,marginBottom:16}}>
          <Icon name="alert" size={16} color={C.amber} style={{flexShrink:0,marginTop:1}}/>
          <span style={{fontSize:13,color:C.grey800,flex:1}}>{delErr}</span>
          <button onClick={()=>setDelErr(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.grey400,padding:2}}><Icon name="close" size={14}/></button>
        </div>
      )}
      <Card style={{padding:0,overflow:"hidden"}}>
        {loading?<Loading/>:<Table
          cols={[
            ...cols,
            ...(hasAtivo ? [{key:"ativo",label:"Estado",render:v=><Badge color={v===false?C.grey400:C.green}>{v===false?"Inativo":"Ativo"}</Badge>}] : []),
          ]}
          data={visibleRows}
          onView={onView}
          onEdit={openEdit}
          onDelete={del}
          extraActions={hasAtivo ? row=>(
            <button onClick={()=>toggleAtivo(row)} title={row.ativo===false?"Ativar":"Inativar"}
              style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,display:"flex",alignItems:"center",transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.grey100}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <Icon name={row.ativo===false?"eye":"close"} size={14} color={row.ativo===false?C.green:C.amber}/>
            </button>
          ) : null}
        />}
      </Card>
      {modal&&(
        <Modal title={editing?"Editar":"Novo registo"} onClose={()=>setModal(false)} wide={formFields.length>4}>
          <div style={{display:"grid",gridTemplateColumns:formFields.length>4?"1fr 1fr":"1fr",gap:14}}>
            {formFields.map(f=>(
              <div key={f.k} style={f.full?{gridColumn:"1/-1"}:{}}>
                {f.type==="select"
                  ? <Select label={f.label} value={form[f.k]||""} onChange={v=>setForm(p=>({...p,[f.k]:v}))}
                      options={fieldOptions?.[f.k]||[]} required={f.required}/>
                  : <Input label={f.label} value={form[f.k]||""} onChange={v=>setForm(p=>({...p,[f.k]:v}))}
                      type={f.type} textarea={f.textarea} rows={f.rows} placeholder={f.placeholder} required={f.required}/>
                }
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

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
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

// ─── Contract Detail ──────────────────────────────────────────────────────────
const ContratoDetalhe = ({ contrato, onBack }) => {
  const C = useTheme();
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
  const emptyMov = {data:new Date().toISOString().split("T")[0],hora_inicio:"",hora_fim:"",creditos:"",descritivo:"",profile_tecnico_id:"",local_id:"",tipo:"assistencia"};
  const [form, setForm] = useState(emptyMov);

  const load = useCallback(async()=>{
    setLoading(true);
    const [movRes,tecRes,locRes,cliRes,tipRes] = await Promise.all([
      sb.from("rbo_movimentos").select("*").eq("contrato_id",contrato.id).order("data",{ascending:false}),
      sb.from("rbo_profiles").select("id,nome,email").eq("is_tecnico",true).order("nome"),
      sb.from("rbo_locais").select("*").order("nome"),
      sb.from("rbo_clientes").select("*").eq("id",contrato.cliente_id).single(),
      sb.from("rbo_tipologias").select("*").eq("id",contrato.tipologia_id).single(),
    ]);
    setMovimentos(movRes.data||[]);
    setTecnicos(tecRes.data||[]);
    setLocais(locRes.data||[]);
    setCliente(cliRes.data);
    setTipologia(tipRes.data);
    setLoading(false);
  },[contrato.id]);

  useEffect(()=>{ load(); },[load]);

  const saldo = movimentos.reduce((s,m)=>s+m.creditos,0);
  const openNew  = tipo => { setForm({...emptyMov,tipo}); setEditingId(null); setModal("mov"); };
  const openEdit = m   => { setForm({...m,profile_tecnico_id:m.profile_tecnico_id||"",local_id:m.local_id||"",hora_inicio:m.hora_inicio||"",hora_fim:m.hora_fim||""}); setEditingId(m.id); setModal("mov"); };

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

// ─── Contratos List ───────────────────────────────────────────────────────────
const Contratos = () => {
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

  const del = async id => {
    if (!confirm("Eliminar contrato e todos os seus movimentos?")) return;
    await sb.from("rbo_contratos").delete().eq("id",id);
    await load();
  };

  const filtered = rows.filter(c=>{
    const cli = clientes.find(x=>x.id===c.cliente_id);
    const tip = tipologias.find(x=>x.id===c.tipologia_id);
    const q   = search.toLowerCase();
    return !q||cli?.nome.toLowerCase().includes(q)||tip?.nome.toLowerCase().includes(q);
  });

  if (detalhe) return <ContratoDetalhe contrato={detalhe} onBack={()=>{ setDetalhe(null); load(); }}/>;

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
            {key:"cliente_id",    label:"Cliente",     render:v=>{const cl=clientes.find(x=>x.id===v);return <span style={{fontWeight:500,color:C.grey800}}>{cl?.nome||"—"}</span>;}},
            {key:"tipologia_id",  label:"Tipologia",   render:v=>{const t=tipologias.find(x=>x.id===v);return <Badge>{t?.nome||"—"}</Badge>;}},
            {key:"data_contrato", label:"Data",        render:v=>fmtDate(v)},
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

// ─── Definições ───────────────────────────────────────────────────────────────
const Definicoes = ({ currentUserId }) => {
  const C = useTheme();
  const [tab, setTab] = useState("tipologias");

  const tabs = [
    {id:"tipologias",   label:"Tipologias",            icon:"types"},
    {id:"locais",       label:"Locais de Assistência", icon:"locations"},
    {id:"categorias",   label:"Categorias",            icon:"key"},
    {id:"utilizadores", label:"Utilizadores",           icon:"user"},
  ];

  return (
    <div>
      <PageHeader title="Definições" subtitle="Listas de suporte e configuração"/>
      {/* Tab bar */}
      <div style={{display:"flex",gap:4,marginBottom:24,background:C.white,borderRadius:12,padding:6,border:`1px solid ${C.grey100}`,flexWrap:"wrap"}}>
        {tabs.map(t=>{
          const active = tab===t.id;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderRadius:8,border:"none",cursor:"pointer",background:active?C.teal:"transparent",color:active?"#ffffff":C.grey600,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:active?600:400,transition:"all .15s"}}>
              <Icon name={t.icon} size={15} color={active?"#ffffff":C.grey400}/>
              {t.label}
            </button>
          );
        })}
      </div>
      {/* Content */}
      {tab==="tipologias"&&(
        <CrudPage key="tipologias" compact hasAtivo title="Tipologias" table="rbo_tipologias"
          cols={[{key:"nome",label:"Nome"}]}
          emptyForm={{nome:"",ativo:true}}
          formFields={[{k:"nome",label:"Nome da Tipologia",required:true}]}/>
      )}
      {tab==="locais"&&(
        <CrudPage key="locais" compact hasAtivo title="Locais de Assistência" table="rbo_locais"
          cols={[{key:"nome",label:"Local"}]}
          emptyForm={{nome:"",ativo:true}}
          formFields={[{k:"nome",label:"Nome do Local",required:true}]}/>
      )}
      {tab==="categorias"&&(
        <CrudPage key="categorias" compact title="Categorias de Credenciais" table="rbo_credential_categories"
          cols={[{key:"nome",label:"Categoria"}]}
          emptyForm={{nome:""}}
          formFields={[{k:"nome",label:"Nome da Categoria",required:true}]}/>
      )}
      {tab==="utilizadores"&&(
        <UtilizadoresPanel currentUserId={currentUserId}/>
      )}
    </div>
  );
};

// ─── Nav Items ────────────────────────────────────────────────────────────────
// Para adicionar itens basta acrescentar aqui — o mobile adapta-se automaticamente
const navItems = [
  {id:"dashboard",  label:"Dashboard",  icon:"dashboard"},
  {id:"contratos",  label:"Contratos",  icon:"contracts"},
  {id:"clientes",   label:"Clientes",   icon:"clients"},
  {id:"definicoes", label:"Definições", icon:"settings"},
];

// Quantos itens ficam visíveis na bottom nav (o resto vai para "Mais")
const BOTTOM_NAV_MAX = 4;

// ─── Mobile Bottom Navigation ─────────────────────────────────────────────────
const BottomNav = ({ page, onNavigate, darkMode, onToggleDark }) => {
  const C = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const primary  = navItems.slice(0, BOTTOM_NAV_MAX);
  const overflow = navItems.slice(BOTTOM_NAV_MAX);
  const hasMore  = overflow.length > 0;
  const moreActive = overflow.some(i => i.id === page);

  const go = id => { onNavigate(id); setDrawerOpen(false); };

  const NAV_H = 62;
  const safeBottom = "env(safe-area-inset-bottom, 0px)";

  return (
    <>
      {/* Overlay para o drawer "Mais" */}
      {drawerOpen && (
        <div onClick={()=>setDrawerOpen(false)}
          style={{position:"fixed",inset:0,background:"#00000055",zIndex:198,backdropFilter:"blur(2px)"}}/>
      )}

      {/* Drawer "Mais" — desliza de baixo */}
      {hasMore && (
        <div style={{
          position:"fixed", bottom: drawerOpen ? 0 : "-100%", left:0, right:0,
          background:"#0d5e5e", borderRadius:"20px 20px 0 0",
          zIndex:199, transition:"bottom .28s cubic-bezier(.4,0,.2,1)",
          paddingBottom:`calc(${NAV_H}px + ${safeBottom})`,
        }}>
          <div style={{padding:"12px 0 4px",display:"flex",justifyContent:"center"}}>
            <div style={{width:40,height:4,borderRadius:2,background:"rgba(255,255,255,0.2)"}}/>
          </div>
          <div style={{padding:"8px 0 4px"}}>
            {overflow.map(item=>{
              const active = page===item.id;
              return (
                <button key={item.id} onClick={()=>go(item.id)}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"13px 24px",background:active?"rgba(42,155,155,0.2)":"transparent",border:"none",cursor:"pointer",borderLeft:active?"3px solid #fff":"3px solid transparent",transition:"all .15s"}}>
                  <Icon name={item.icon} size={20} color={active?"#ffffff":"#7abfbf"}/>
                  <span style={{fontSize:15,fontWeight:active?600:400,color:active?"#ffffff":"#7abfbf"}}>{item.label}</span>
                </button>
              );
            })}
            {/* Dark mode no drawer */}
            <button onClick={()=>{onToggleDark();setDrawerOpen(false);}}
              style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"13px 24px",background:"transparent",border:"none",cursor:"pointer",borderLeft:"3px solid transparent"}}>
              <Icon name={darkMode?"sun":"moon"} size={20} color="#7abfbf"/>
              <span style={{fontSize:15,color:"#7abfbf"}}>{darkMode?"Modo claro":"Modo escuro"}</span>
            </button>
            {/* Logout */}
            <button onClick={()=>sb.auth.signOut()}
              style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"13px 24px",background:"transparent",border:"none",cursor:"pointer",borderLeft:"3px solid transparent"}}>
              <Icon name="logout" size={20} color="#e07878"/>
              <span style={{fontSize:15,color:"#e07878"}}>Terminar sessão</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav style={{
        position:"fixed", bottom:0, left:0, right:0, height:NAV_H,
        background:"#0d5e5e",
        display:"flex", alignItems:"stretch",
        borderTop:"1px solid rgba(42,155,155,0.25)",
        zIndex:200,
        paddingBottom:safeBottom,
      }}>
        {primary.map(item=>{
          const active = page===item.id;
          return (
            <button key={item.id} onClick={()=>go(item.id)}
              style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,background:"transparent",border:"none",cursor:"pointer",borderTop:active?"2.5px solid #ffffff":"2.5px solid transparent",transition:"all .15s",paddingTop:2}}>
              <Icon name={item.icon} size={20} color={active?"#ffffff":"#4d8e8e"}/>
              <span style={{fontSize:10,fontWeight:active?700:400,color:active?"#ffffff":"#4d8e8e",letterSpacing:".2px"}}>{item.label}</span>
            </button>
          );
        })}

        {/* Botão "Mais" — aparece só se houver overflow */}
        {hasMore && (
          <button onClick={()=>setDrawerOpen(d=>!d)}
            style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,background:"transparent",border:"none",cursor:"pointer",borderTop:(moreActive||drawerOpen)?"2.5px solid #ffffff":"2.5px solid transparent",paddingTop:2}}>
            <Icon name="menu" size={20} color={(moreActive||drawerOpen)?"#ffffff":"#4d8e8e"}/>
            <span style={{fontSize:10,fontWeight:(moreActive||drawerOpen)?700:400,color:(moreActive||drawerOpen)?"#ffffff":"#4d8e8e",letterSpacing:".2px"}}>Mais</span>
          </button>
        )}

        {/* Dark mode direto na nav se não houver overflow */}
        {!hasMore && (
          <button onClick={onToggleDark}
            style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,background:"transparent",border:"none",cursor:"pointer",borderTop:"2.5px solid transparent",paddingTop:2}}>
            <Icon name={darkMode?"sun":"moon"} size={20} color="#4d8e8e"/>
            <span style={{fontSize:10,color:"#4d8e8e",letterSpacing:".2px"}}>{darkMode?"Claro":"Escuro"}</span>
          </button>
        )}
        {/* Logout sempre visível */}
        {!hasMore && (
          <button onClick={()=>sb.auth.signOut()}
            style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,background:"transparent",border:"none",cursor:"pointer",borderTop:"2.5px solid transparent",paddingTop:2}}>
            <Icon name="logout" size={20} color="#e07878"/>
            <span style={{fontSize:10,color:"#e07878",letterSpacing:".2px"}}>Sair</span>
          </button>
        )}
      </nav>
    </>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
// Detecção mobile robusta — funciona mesmo sem meta viewport
const checkMobile = () => {
  const w = window.visualViewport?.width ?? window.innerWidth;
  return w < 768;
};

export default function App() {
  const [page,        setPage]        = useState("dashboard");
  const [sideOpen,    setSideOpen]    = useState(true);
  const [darkMode,    setDarkMode]    = useState(true); // default até o perfil carregar
  const [isMobile,    setIsMobile]    = useState(checkMobile);
  const [session,     setSession]     = useState(null);
  const [profile,     setProfile]     = useState(null);   // rbo_profiles row
  const [authLoading, setAuthLoading] = useState(true);

  const theme = darkMode ? DARK : LIGHT;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async (userId) => {
    setAuthLoading(true);
    const { data } = await sb.from("rbo_profiles").select("*").eq("id", userId).single();
    setProfile(data || null);
    if (data) setDarkMode(data.dark_mode ?? true);
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setAuthLoading(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setProfile(null); setAuthLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // Garante meta viewport + desativa service worker (evita cache desatualizada)
  useEffect(()=>{
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    setIsMobile(checkMobile());
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then(regs => regs.forEach(r => r.unregister()));
    }
  },[]);

  useEffect(()=>{
    const fn = ()=>setIsMobile(checkMobile());
    window.addEventListener("resize", fn);
    window.visualViewport?.addEventListener("resize", fn);
    return ()=>{
      window.removeEventListener("resize", fn);
      window.visualViewport?.removeEventListener("resize", fn);
    };
  },[]);

  useEffect(()=>{ if(isMobile) setSideOpen(false); },[isMobile]);

  const currentUserId = session?.user?.id || null;

  const navigate = id => { setPage(id); if(isMobile) setSideOpen(false); };

  const toggleDark = async () => {
    const next = !darkMode;
    setDarkMode(next);
    if (currentUserId) {
      await sb.from("rbo_profiles").update({ dark_mode: next }).eq("id", currentUserId);
    }
  };

  const SIDE_W = sideOpen ? 240 : 64;


// ─── Credenciais Panel ────────────────────────────────────────────────────────
const CopyBtn = ({ value, isPassword }) => {
  const C = useTheme();
  const [state, setState] = useState("idle"); // idle | copied | clearing

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
      if (isPassword) {
        // Clear clipboard after 15s
        setTimeout(async () => {
          setState("clearing");
          try { await navigator.clipboard.writeText(""); } catch(_) {}
          setTimeout(() => setState("idle"), 800);
        }, 15000);
      } else {
        setTimeout(() => setState("idle"), 2000);
      }
    } catch(_) { setState("idle"); }
  };

  const col = state === "copied" ? C.green : state === "clearing" ? C.amber : C.grey400;
  const ic  = state === "copied" ? "check" : state === "clearing" ? "close" : "copy";
  const tip = state === "copied"
    ? (isPassword ? "Copiado — apaga em 15s" : "Copiado!")
    : state === "clearing" ? "A limpar clipboard..."
    : (isPassword ? "Copiar password (15s)" : "Copiar");

  return (
    <button onClick={copy} title={tip}
      style={{background:"none",border:"none",cursor:value?"pointer":"default",padding:"3px 5px",borderRadius:5,display:"flex",alignItems:"center",opacity:value?1:0.3,transition:"all .15s"}}
      onMouseEnter={e=>{if(value)e.currentTarget.style.background=C.grey100;}}
      onMouseLeave={e=>e.currentTarget.style.background="none"}>
      <Icon name={ic} size={13} color={col}/>
    </button>
  );
};

const CredenciaisPanel = ({ clienteId }) => {
  const C = useTheme();
  const [creds,      setCreds]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [showPwd,    setShowPwd]    = useState({});
  const [dragging,   setDragging]   = useState(null);
  const [dragOver,   setDragOver]   = useState(null);
  const touchRef = useRef(null);
  const empty = {categoria:"",url_ip:"",utilizador:"",password:"",notas:""};
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    setLoading(true);
    const [credsRes, catsRes] = await Promise.all([
      sb.from("rbo_client_credentials").select("*").eq("cliente_id", clienteId).order("ordem").order("id"),
      sb.from("rbo_credential_categories").select("nome").order("nome"),
    ]);
    setCreds(credsRes.data || []);
    setCategories((catsRes.data || []).map(c => c.nome));
    setLoading(false);
  }, [clienteId]);

  useEffect(() => { load(); }, [load]);

  const openNew  = ()  => { setForm(empty); setEditId(null); setModal(true); };
  const openEdit = c   => { setForm({...c}); setEditId(c.id); setModal(true); };

  const save = async () => {
    setSaving(true);
    const { id: _id, created_at: _ca, ...rest } = form;
    if (form.categoria && !categories.includes(form.categoria)) {
      await sb.from("rbo_credential_categories").insert([{nome: form.categoria}]);
    }
    let err;
    if (!editId) {
      const payload = { ...rest, cliente_id: clienteId, ordem: creds.length };
      ({ error: err } = await sb.from("rbo_client_credentials").insert([payload]));
    } else {
      const currentOrdem = creds.find(c => c.id === editId)?.ordem ?? rest.ordem ?? 0;
      ({ error: err } = await sb.from("rbo_client_credentials")
        .update({ ...rest, ordem: currentOrdem })
        .eq("id", editId));
    }
    if (err) alert("Erro: " + err.message);
    else { await load(); setModal(false); }
    setSaving(false);
  };

  const del = async id => {
    if (!confirm("Eliminar credencial?")) return;
    await sb.from("rbo_client_credentials").delete().eq("id", id);
    await load();
  };

  const togglePwd = id => setShowPwd(s => ({...s, [id]: !s[id]}));

  const reorderList = (fromId, toId) => {
    const from = creds.find(c => c.id === fromId);
    const rest  = creds.filter(c => c.id !== fromId);
    const toIdx = rest.findIndex(c => c.id === toId);
    const next  = [...rest];
    next.splice(toIdx >= 0 ? toIdx : rest.length, 0, from);
    return next;
  };

  const saveOrder = async (newList) => {
    setCreds(newList); // optimistic
    await Promise.all(newList.map((c, i) =>
      sb.from("rbo_client_credentials").update({ ordem: i }).eq("id", c.id)
    ));
  };

  // Desktop DnD
  const onDragStart = (e, id) => { setDragging(id); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver  = (e, id) => { e.preventDefault(); if (id !== dragging) setDragOver(id); };
  const onDragEnd   = ()      => { setDragging(null); setDragOver(null); };
  const onDrop      = async (e, id) => {
    e.preventDefault();
    if (dragging && dragging !== id) await saveOrder(reorderList(dragging, id));
    setDragging(null); setDragOver(null);
  };

  // Mobile touch DnD
  const onTouchStart = (e, id) => { touchRef.current = id; setDragging(id); };
  const onTouchMove  = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const credEl = el?.closest("[data-cred-id]");
    const overId = credEl ? Number(credEl.getAttribute("data-cred-id")) : null;
    if (overId && overId !== touchRef.current) setDragOver(overId);
  };
  const onTouchEnd = async () => {
    if (touchRef.current && dragOver && touchRef.current !== dragOver) {
      await saveOrder(reorderList(touchRef.current, dragOver));
    }
    setDragging(null); setDragOver(null); touchRef.current = null;
  };

  return (
    <Card style={{padding:0,overflow:"hidden",marginTop:16}}>
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.grey100}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Icon name="key" size={15} color={C.teal}/>
          <h3 style={{fontSize:15,fontWeight:600,color:C.grey800}}>Credenciais e Acessos</h3>
        </div>
        <Btn size="sm" icon="plus" onClick={openNew}>Nova</Btn>
      </div>

      {loading ? <Loading/> : creds.length === 0 ? (
        <div style={{padding:"24px 20px",textAlign:"center",color:C.grey400,fontSize:13}}>
          Sem credenciais registadas
        </div>
      ) : (
        <div>
          {creds.map((c, i) => (
            <div
              key={c.id}
              data-cred-id={c.id}
              draggable
              onDragStart={e=>onDragStart(e,c.id)}
              onDragOver={e=>onDragOver(e,c.id)}
              onDragEnd={onDragEnd}
              onDrop={e=>onDrop(e,c.id)}
              style={{
                padding:"14px 20px",
                borderBottom:i<creds.length-1?`1px solid ${C.grey100}`:"none",
                opacity: dragging===c.id ? 0.35 : 1,
                background: dragOver===c.id ? C.teal+"12" : "transparent",
                borderLeft: dragOver===c.id ? `3px solid ${C.teal}` : "3px solid transparent",
                transition:"opacity .15s, background .1s, border .1s",
              }}>
              {/* Header row */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {/* Grip handle */}
                  <div
                    title="Arrastar para reordenar"
                    style={{cursor:"grab",padding:"4px 2px",color:C.grey400,flexShrink:0,touchAction:"none"}}
                    onTouchStart={e=>onTouchStart(e,c.id)}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}>
                    <Icon name="grip" size={14} color={C.grey400}/>
                  </div>
                  {c.categoria && (
                    <span style={{fontSize:13,fontWeight:700,color:C.teal,background:C.teal+"15",borderRadius:6,padding:"2px 10px"}}>{c.categoria}</span>
                  )}
                  {c.url_ip && (
                    <span style={{fontSize:12,color:C.grey600,fontFamily:"'DM Mono',monospace"}}>{c.url_ip}</span>
                  )}
                </div>
                <div style={{display:"flex",gap:2}}>
                  <Btn variant="ghost" size="sm" icon="edit"  onClick={()=>openEdit(c)}/>
                  <Btn variant="ghost" size="sm" icon="trash" onClick={()=>del(c.id)}/>
                </div>
              </div>

              {/* Credentials grid */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {/* Utilizador */}
                {c.utilizador && (
                  <div style={{background:C.grey50,borderRadius:8,padding:"8px 12px",border:`1px solid ${C.grey100}`}}>
                    <div style={{fontSize:10,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>Utilizador</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
                      <span style={{fontSize:13,color:C.grey800,fontFamily:"'DM Mono',monospace",wordBreak:"break-all"}}>{c.utilizador}</span>
                      <CopyBtn value={c.utilizador} isPassword={false}/>
                    </div>
                  </div>
                )}

                {/* Password */}
                {c.password && (
                  <div style={{background:C.grey50,borderRadius:8,padding:"8px 12px",border:`1px solid ${C.grey100}`}}>
                    <div style={{fontSize:10,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>Password</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
                      <span style={{fontSize:13,color:C.grey800,fontFamily:"'DM Mono',monospace",wordBreak:"break-all",flex:1}}>
                        {showPwd[c.id] ? c.password : "••••••••"}
                      </span>
                      <div style={{display:"flex",gap:2,flexShrink:0}}>
                        <button onClick={()=>togglePwd(c.id)} title={showPwd[c.id]?"Ocultar":"Mostrar"}
                          style={{background:"none",border:"none",cursor:"pointer",padding:"3px 5px",borderRadius:5,display:"flex",alignItems:"center"}}
                          onMouseEnter={e=>e.currentTarget.style.background=C.grey100}
                          onMouseLeave={e=>e.currentTarget.style.background="none"}>
                          <Icon name={showPwd[c.id]?"eyeOff":"eye"} size={13} color={C.grey400}/>
                        </button>
                        <CopyBtn value={c.password} isPassword={true}/>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas */}
              {c.notas && (
                <div style={{marginTop:8,fontSize:12,color:C.grey600,lineHeight:1.6,whiteSpace:"pre-wrap",background:C.grey50,borderRadius:6,padding:"6px 10px",border:`1px solid ${C.grey100}`}}>
                  {c.notas}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={editId ? "Editar credencial" : "Nova credencial"} onClose={()=>setModal(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{fontSize:13,fontWeight:500,color:C.grey600}}>Categoria / Serviço</label>
                <input
                  list="cred-categories"
                  value={form.categoria}
                  onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}
                  placeholder="Escolhe ou escreve uma nova..."
                  style={{border:`1.5px solid ${C.grey200}`,borderRadius:8,padding:"8px 12px",fontSize:14,outline:"none",height:38,background:C.white,color:C.grey800,width:"100%"}}
                />
                <datalist id="cred-categories">
                  {categories.map(c=><option key={c} value={c}/>)}
                </datalist>
                {form.categoria && !categories.includes(form.categoria) && (
                  <div style={{fontSize:11,color:C.amber,display:"flex",alignItems:"center",gap:4}}>
                    <Icon name="plus" size={11} color={C.amber}/> Nova categoria — será adicionada automaticamente
                  </div>
                )}
              </div>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <Input label="URL / IP" value={form.url_ip} onChange={v=>setForm(f=>({...f,url_ip:v}))} placeholder="ex: 192.168.1.1 ou https://..."/>
            </div>
            <Input label="Utilizador" value={form.utilizador} onChange={v=>setForm(f=>({...f,utilizador:v}))} placeholder="email ou username"/>
            <Input label="Password" value={form.password} onChange={v=>setForm(f=>({...f,password:v}))} type="password" placeholder="••••••••"/>
            <div style={{gridColumn:"1/-1"}}>
              <Input label="Notas" value={form.notas} onChange={v=>setForm(f=>({...f,notas:v}))} textarea rows={3} placeholder="Informações adicionais..."/>
            </div>
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


// ─── Cliente Detalhe ──────────────────────────────────────────────────────────
const ClienteDetalhe = ({ cliente: clienteInicial, tecnicoOpts, onBack }) => {
  const C = useTheme();
  const [cliente,  setCliente]  = useState(clienteInicial);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({...clienteInicial});
  const [saving,   setSaving]   = useState(false);

  const save = async () => {
    setSaving(true);
    const { id: _id, created_at: _ca, ...rest } = form;
    const { data, error } = await sb.from("rbo_clientes").update(rest).eq("id", cliente.id).select().single();
    if (error) { alert("Erro: " + error.message); setSaving(false); return; }
    setCliente(data);
    setSaving(false);
    setModal(false);
  };

  const tecNome = tecnicoOpts.find(t => t.value === cliente.tecnico_id)?.label || "—";

  return (
    <div>
      {/* Back */}
      <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:C.teal,fontSize:14,display:"flex",alignItems:"center",gap:6,padding:0,marginBottom:20}}>
        ← Voltar aos clientes
      </button>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:20}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:C.grey800}}>{cliente.nome}</h1>
          {tecNome !== "—" && <div style={{fontSize:13,color:C.grey400,marginTop:4}}>Técnico: {tecNome}</div>}
        </div>
        <Btn size="sm" icon="edit" onClick={()=>{setForm({...cliente});setModal(true);}}>Editar dados</Btn>
      </div>

      {/* Info card */}
      <Card style={{padding:"16px 20px",marginBottom:4,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
        {[["Telefone",cliente.telefone],["Email",cliente.email],["Morada",cliente.morada],["Localidade",cliente.localidade],["Código Postal",cliente.cp],["GPS",cliente.gps]].map(([l,v])=>(
          v ? <div key={l}>
            <div style={{fontSize:11,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px"}}>{l}</div>
            <div style={{fontSize:14,marginTop:2,color:C.grey800}}>{v}</div>
          </div> : null
        ))}
      </Card>

      {/* Credenciais */}
      <CredenciaisPanel clienteId={cliente.id}/>

      {/* Edit modal */}
      {modal && (
        <Modal title="Editar cliente" onClose={()=>setModal(false)} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <Input label="Nome da Empresa" value={form.nome||""} onChange={v=>setForm(f=>({...f,nome:v}))} required/>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <Select label="Técnico" value={form.tecnico_id||""} onChange={v=>setForm(f=>({...f,tecnico_id:v}))} options={tecnicoOpts}/>
            </div>
            <Input label="Telefone" value={form.telefone||""} onChange={v=>setForm(f=>({...f,telefone:v}))} type="tel"/>
            <Input label="Email" value={form.email||""} onChange={v=>setForm(f=>({...f,email:v}))} type="email"/>
            <div style={{gridColumn:"1/-1"}}>
              <Input label="Morada" value={form.morada||""} onChange={v=>setForm(f=>({...f,morada:v}))}/>
            </div>
            <Input label="Localidade" value={form.localidade||""} onChange={v=>setForm(f=>({...f,localidade:v}))}/>
            <Input label="Código Postal" value={form.cp||""} onChange={v=>setForm(f=>({...f,cp:v}))} placeholder="0000-000"/>
            <Input label="Coordenadas GPS" value={form.gps||""} onChange={v=>setForm(f=>({...f,gps:v}))} placeholder="lat,lng"/>
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

  const ClientesPage = () => {
    const [detalhe, setDetalhe] = React.useState(null);
    const [reload,  setReload]  = React.useState(0);
    const [tecnicoOpts, setTecnicoOpts] = React.useState([]);
    React.useEffect(()=>{
      sb.from("rbo_profiles").select("id,nome").eq("is_tecnico",true).eq("ativo",true).order("nome")
        .then(({data})=>setTecnicoOpts((data||[]).map(t=>({value:t.id,label:t.nome||t.email}))));
    },[]);

    if (detalhe) return <ClienteDetalhe cliente={detalhe} tecnicoOpts={tecnicoOpts} onBack={()=>{setDetalhe(null);setReload(r=>r+1);}}/>;

    return (
      <CrudPage key={reload} title="Clientes" table="rbo_clientes"
        cols={[
          {key:"nome",       label:"Nome"},
          {key:"tecnico_id", label:"Técnico", render:(v)=>tecnicoOpts.find(t=>t.value===v)?.label||"—"},
          {key:"localidade", label:"Localidade"},
          {key:"telefone",   label:"Telefone"},
          {key:"email",      label:"Email"},
        ]}
        emptyForm={{nome:"",tecnico_id:"",morada:"",localidade:"",cp:"",gps:"",telefone:"",email:""}}
        fieldOptions={{tecnico_id: tecnicoOpts}}
        formFields={[
          {k:"nome",      label:"Nome da Empresa",      required:true, full:true},
          {k:"tecnico_id",label:"Técnico",              type:"select"},
          {k:"telefone",  label:"Telefone",             type:"tel"},
          {k:"morada",    label:"Morada",               full:true},
          {k:"localidade",label:"Localidade"},
          {k:"cp",        label:"Código Postal",        placeholder:"0000-000"},
          {k:"gps",       label:"Coordenadas GPS",      placeholder:"lat,lng"},
          {k:"email",     label:"Email",                type:"email"},
        ]}
        onView={r=>setDetalhe(r)}
      />
    );
  };

  const pages = {
    dashboard:  <Dashboard/>,
    contratos:  <Contratos/>,
    clientes:   <ClientesPage/>,
    definicoes: <Definicoes currentUserId={currentUserId}/>,
  };

  // Auth guards
  if (authLoading) return (
    <div style={{minHeight:"100vh",background:"#0a1818",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#1a7a7a" strokeWidth="2" strokeLinecap="round" style={{animation:"spin .8s linear infinite"}}>
        <circle cx="12" cy="12" r="10" strokeOpacity=".2"/><path d="M12 2a10 10 0 0 1 10 10"/>
      </svg>
    </div>
  );
  if (!session) return <ThemeCtx.Provider value={theme}><style>{getGlobalStyle(theme)}</style><LoginScreen/></ThemeCtx.Provider>;
  if (!profile || !profile.ativo) return <ThemeCtx.Provider value={theme}><style>{getGlobalStyle(theme)}</style><AccessDenied email={session.user.email}/></ThemeCtx.Provider>;

  return (
    <ThemeCtx.Provider value={theme}>
      <style>{getGlobalStyle(theme)}</style>

      <div style={{display:"flex",minHeight:"100vh",background:theme.grey50}}>

        {/* ── Desktop Sidebar ── */}
        {!isMobile && (
          <aside style={{
            width:SIDE_W, minHeight:"100vh", background:"#0d5e5e",
            display:"flex", flexDirection:"column",
            transition:"width .22s ease", flexShrink:0,
            position:"sticky", top:0, height:"100vh", overflow:"hidden", zIndex:1,
          }}>
            {/* Logo */}
            <div style={{padding:sideOpen?"22px 18px 18px":"22px 0 18px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid rgba(42,155,155,0.2)",justifyContent:sideOpen?"flex-start":"center",flexShrink:0}}>
              <div style={{width:36,height:36,borderRadius:10,background:"#ffffff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="20" height="20" viewBox="0 0 50 50" fill="none">
                  <path d="M8 42 C8 42 8 8 8 8 C8 4 12 4 12 4 C12 4 28 4 28 4 C42 4 42 18 34 22 C42 26 44 42 30 42 Z" fill="#0d5e5e"/>
                </svg>
              </div>
              {sideOpen&&<div><div style={{fontWeight:700,fontSize:16,color:"#ffffff",lineHeight:1}}>RBO</div><div style={{fontSize:11,color:"#4d8e8e",marginTop:2}}>Rilop BackOffice</div></div>}
            </div>
            {/* Nav */}
            <nav style={{flex:1,padding:"10px 0",overflowY:"auto"}}>
              {navItems.map(item=>{
                const active = page===item.id;
                return (
                  <button key={item.id} onClick={()=>navigate(item.id)}
                    style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:sideOpen?"11px 18px":"11px 0",justifyContent:sideOpen?"flex-start":"center",background:active?"rgba(42,155,155,0.2)":"transparent",border:"none",cursor:"pointer",borderLeft:active?"3px solid #ffffff":"3px solid transparent",transition:"all .15s"}}>
                    <Icon name={item.icon} size={19} color={active?"#ffffff":"#4d8e8e"}/>
                    {sideOpen&&<span style={{fontSize:14,fontWeight:active?600:400,color:active?"#ffffff":"#4d8e8e"}}>{item.label}</span>}
                  </button>
                );
              })}
            </nav>
            {/* Bottom controls */}
            <div style={{borderTop:"1px solid rgba(42,155,155,0.2)",flexShrink:0}}>
              {/* User info */}
              {sideOpen && (
                <div style={{padding:"10px 18px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(42,155,155,0.1)"}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(42,155,155,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Icon name="user" size={15} color="#7abfbf"/>
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#cee4e4",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile?.nome || profile?.email}</div>
                    {profile?.nome && <div style={{fontSize:10,color:"#4d8e8e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile?.email}</div>}
                  </div>
                </div>
              )}
              <button onClick={toggleDark} title={darkMode?"Modo claro":"Modo escuro"}
                style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:sideOpen?"11px 18px":"11px 0",justifyContent:sideOpen?"flex-start":"center",background:"transparent",border:"none",cursor:"pointer",transition:"all .15s"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(42,155,155,0.15)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <Icon name={darkMode?"sun":"moon"} size={18} color="#4d8e8e"/>
                {sideOpen&&<span style={{fontSize:13,color:"#4d8e8e"}}>{darkMode?"Modo claro":"Modo escuro"}</span>}
              </button>
              <button onClick={()=>sb.auth.signOut()} title="Terminar sessão"
                style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:sideOpen?"11px 18px":"11px 0",justifyContent:sideOpen?"flex-start":"center",background:"transparent",border:"none",cursor:"pointer",transition:"all .15s"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(224,120,120,0.12)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <Icon name="logout" size={18} color="#e07878"/>
                {sideOpen&&<span style={{fontSize:13,color:"#e07878"}}>Terminar sessão</span>}
              </button>
              <button onClick={()=>setSideOpen(s=>!s)}
                style={{width:"100%",padding:"12px 0",background:"transparent",border:"none",cursor:"pointer",display:"flex",justifyContent:"center",transition:"all .15s"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(42,155,155,0.15)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <Icon name={sideOpen?"chevronR":"chevronD"} size={15} color="#4d8e8e"/>
              </button>
            </div>
          </aside>
        )}

        {/* ── Main content ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          {/* Mobile: top bar simples com título da página */}
          {isMobile && (
            <div style={{position:"sticky",top:0,background:"#0d5e5e",padding:"0 16px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:50,flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#ffffff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="16" height="16" viewBox="0 0 50 50" fill="none">
                    <path d="M8 42 C8 42 8 8 8 8 C8 4 12 4 12 4 C12 4 28 4 28 4 C42 4 42 18 34 22 C42 26 44 42 30 42 Z" fill="#0d5e5e"/>
                  </svg>
                </div>
                <span style={{color:"#ffffff",fontWeight:700,fontSize:15}}>RBO</span>
              </div>
              <span style={{color:"#7abfbf",fontSize:13,fontWeight:500}}>
                {navItems.find(n=>n.id===page)?.label||""}
              </span>
            </div>
          )}

          <main style={{
            flex:1,
            padding: isMobile ? "14px 12px" : "28px 32px",
            paddingBottom: isMobile ? "calc(62px + env(safe-area-inset-bottom, 0px) + 12px)" : undefined,
            maxWidth:"100%",
            overflow:"hidden",
          }}>
            {pages[page]}
          </main>
        </div>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      {isMobile && (
        <BottomNav
          page={page}
          onNavigate={navigate}
          darkMode={darkMode}
          onToggleDark={toggleDark}
        />
      )}
    </ThemeCtx.Provider>
  );
}