import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { Icon } from '../../components/ui/Icon';
import { sb } from '../../lib/supabase';

export const LoginScreen = () => {
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
