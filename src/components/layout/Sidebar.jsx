import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { Icon } from '../ui/Icon';
import { sb } from '../../lib/supabase';

export const Sidebar = ({ sideOpen, setSideOpen, page, navigate, darkMode, toggleDark, profile, navItems }) => {
  const C = useTheme();
  const [navTooltip, setNavTooltip] = useState(null);

  const SIDE_W = sideOpen ? 240 : 64;

  return (
    <>
      {/* ── Desktop Sidebar ── */}
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
                onMouseEnter={e=>!sideOpen&&setNavTooltip({label:item.label,y:e.currentTarget.getBoundingClientRect().top+e.currentTarget.getBoundingClientRect().height/2})}
                onMouseLeave={()=>setNavTooltip(null)}
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

      {/* ── Sidebar tooltip ── */}
      {navTooltip && (
        <div style={{position:"fixed",left:70,top:navTooltip.y,transform:"translateY(-50%)",background:"#0d5e5e",color:"#ffffff",fontSize:13,fontWeight:500,padding:"6px 12px",borderRadius:7,whiteSpace:"nowrap",zIndex:9999,pointerEvents:"none",boxShadow:"0 4px 14px rgba(0,0,0,0.25)",border:"1px solid rgba(42,155,155,0.4)"}}>
          {navTooltip.label}
        </div>
      )}
    </>
  );
};
