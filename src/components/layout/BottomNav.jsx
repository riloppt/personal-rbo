import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { Icon } from '../ui/Icon';
import { sb } from '../../lib/supabase';

const BOTTOM_NAV_MAX = 4;

export const BottomNav = ({ page, onNavigate, darkMode, onToggleDark, navItems }) => {
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
