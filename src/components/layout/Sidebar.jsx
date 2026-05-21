import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { Icon } from '../ui/Icon';
import { sb } from '../../lib/supabase';

const getInitials = (nome, email) => {
  if (nome) {
    const parts = nome.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return (email || '?').slice(0, 2).toUpperCase();
};

export const Sidebar = ({ sideOpen, setSideOpen, page, navigate, darkMode, toggleDark, profile, navItems }) => {
  const C = useTheme();
  const [navTooltip, setNavTooltip] = useState(null);

  const SIDE_W = sideOpen ? 240 : 64;

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside style={{
        width:SIDE_W, minHeight:"100vh", background:C.tealD,
        display:"flex", flexDirection:"column",
        transition:"width .22s ease", flexShrink:0,
        position:"sticky", top:0, height:"100vh", overflow:"hidden", zIndex:1,
      }}>
        {/* Logo */}
        <div style={{padding:sideOpen?"22px 18px 18px":"22px 0 18px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${C.teal}33`,justifyContent:sideOpen?"flex-start":"center",flexShrink:0}}>
          <div style={{width:36,height:36,borderRadius:10,background:"#ffffff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="20" height="20" viewBox="0 0 50 50" fill="none">
              <path d="M8 42 C8 42 8 8 8 8 C8 4 12 4 12 4 C12 4 28 4 28 4 C42 4 42 18 34 22 C42 26 44 42 30 42 Z" fill={C.tealD}/>
            </svg>
          </div>
          {sideOpen&&<div><div style={{fontWeight:700,fontSize:16,color:"#ffffff",lineHeight:1}}>RBO</div><div style={{fontSize:11,color:C.sidebarFg,marginTop:2}}>Rilop BackOffice</div></div>}
        </div>
        {/* Nav */}
        <nav style={{flex:1,padding:"10px 0",overflowY:"auto"}}>
          {navItems.map(item=>{
            const active = page===item.id;
            return (
              <button key={item.id} onClick={()=>navigate(item.id)}
                onMouseEnter={e=>!sideOpen&&setNavTooltip({label:item.label,y:e.currentTarget.getBoundingClientRect().top+e.currentTarget.getBoundingClientRect().height/2})}
                onMouseLeave={()=>setNavTooltip(null)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:sideOpen?"11px 18px":"11px 0",justifyContent:sideOpen?"flex-start":"center",background:active?`${C.teal}33`:"transparent",border:"none",cursor:"pointer",borderLeft:active?"3px solid #ffffff":"3px solid transparent",transition:"all .15s"}}>
                <Icon name={item.icon} size={19} color={active?"#ffffff":C.sidebarFg}/>
                {sideOpen&&<span style={{fontSize:14,fontWeight:active?600:400,color:active?"#ffffff":C.sidebarFg}}>{item.label}</span>}
              </button>
            );
          })}
        </nav>
        {/* Bottom controls */}
        <div style={{borderTop:`1px solid ${C.teal}33`,flexShrink:0}}>
          {/* User avatar — always visible */}
          <div style={{
            padding:sideOpen?"10px 18px":"10px 0",
            display:"flex", alignItems:"center", gap:10,
            borderBottom:`1px solid ${C.teal}1a`,
            justifyContent:sideOpen?"flex-start":"center",
          }}>
            <div style={{
              width:32, height:32, borderRadius:"50%",
              background:profile?.avatar_url?"transparent":`${C.teal}33`,
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0, overflow:"hidden",
            }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <span style={{fontSize:11,fontWeight:700,color:C.tealL,letterSpacing:".5px"}}>
                    {getInitials(profile?.nome, profile?.email)}
                  </span>
              }
            </div>
            {sideOpen && (
              <div style={{minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.9)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile?.nome || profile?.email}</div>
                {profile?.nome && <div style={{fontSize:10,color:C.sidebarFg,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile?.email}</div>}
              </div>
            )}
          </div>
          <button onClick={toggleDark} title={darkMode?"Modo claro":"Modo escuro"}
            style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:sideOpen?"11px 18px":"11px 0",justifyContent:sideOpen?"flex-start":"center",background:"transparent",border:"none",cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={e=>e.currentTarget.style.background=`${C.teal}26`}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <Icon name={darkMode?"sun":"moon"} size={18} color={C.sidebarFg}/>
            {sideOpen&&<span style={{fontSize:13,color:C.sidebarFg}}>{darkMode?"Modo claro":"Modo escuro"}</span>}
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
            onMouseEnter={e=>e.currentTarget.style.background=`${C.teal}26`}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <Icon name={sideOpen?"chevronR":"chevronD"} size={15} color={C.sidebarFg}/>
          </button>
        </div>
      </aside>

      {/* ── Sidebar tooltip ── */}
      {navTooltip && (
        <div style={{position:"fixed",left:70,top:navTooltip.y,transform:"translateY(-50%)",background:C.tealD,color:"#ffffff",fontSize:13,fontWeight:500,padding:"6px 12px",borderRadius:7,whiteSpace:"nowrap",zIndex:9999,pointerEvents:"none",boxShadow:"0 4px 14px rgba(0,0,0,0.25)",border:`1px solid ${C.teal}66`}}>
          {navTooltip.label}
        </div>
      )}
    </>
  );
};
