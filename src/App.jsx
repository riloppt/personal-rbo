import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sb } from './lib/supabase';
import { ThemeCtx, LIGHT, DARK } from './theme';
import { getGlobalStyle } from './theme/globalStyle';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { Loading } from './components/ui/Loading';
import { LoginScreen } from './pages/auth/LoginScreen';
import { AccessDenied } from './pages/auth/AccessDenied';
import { Dashboard } from './pages/Dashboard';
import { Contratos } from './pages/Contratos';
import { ClientesPage } from './pages/Clientes';
import { Definicoes } from './pages/Definicoes';
import { Tickets } from './pages/Tickets';

const checkMobile = () => {
  const w = window.visualViewport?.width ?? window.innerWidth;
  return w < 768;
};

export const navItems = [
  { id: 'dashboard',  label: 'Dashboard',  icon: 'dashboard'  },
  { id: 'clientes',   label: 'Clientes',   icon: 'clients'    },
  { id: 'contratos',  label: 'Contratos',  icon: 'contracts'  },
  { id: 'tickets',    label: 'Tickets',    icon: 'wrench'     },
  { id: 'definicoes', label: 'Definições', icon: 'settings'   },
];

export default function App() {
  const [page,        setPage]        = useState("dashboard");
  const [sideOpen,    setSideOpen]    = useState(false);
  const [darkMode,    setDarkMode]    = useState(true); // default até o perfil carregar
  const [isMobile,    setIsMobile]    = useState(checkMobile);
  const [session,     setSession]     = useState(null);
  const [profile,     setProfile]     = useState(null);   // rbo_profiles row
  const [authLoading, setAuthLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const theme = darkMode ? DARK : LIGHT;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async (userId) => {
    if (!initialLoadDone.current) setAuthLoading(true);
    const { data } = await sb.from("rbo_profiles").select("*").eq("id", userId).single();
    setProfile(data || null);
    if (data) setDarkMode(data.dark_mode ?? true);
    setAuthLoading(false);
    initialLoadDone.current = true;
  }, []);

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setAuthLoading(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') { setSession(session); return; }
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

  const pages = {
    dashboard:  <Dashboard/>,
    contratos:  <Contratos/>,
    clientes:   <ClientesPage/>,
    tickets:    <Tickets currentUserId={currentUserId}/>,
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
          <Sidebar
            sideOpen={sideOpen}
            setSideOpen={setSideOpen}
            page={page}
            navigate={navigate}
            darkMode={darkMode}
            toggleDark={toggleDark}
            profile={profile}
            navItems={navItems}
          />
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
          navItems={navItems}
        />
      )}
    </ThemeCtx.Provider>
  );
}
