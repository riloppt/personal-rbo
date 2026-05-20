import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { Icon } from '../../components/ui/Icon';
import { sb } from '../../lib/supabase';

const STYLES = `
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes logoFade {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes logoPulse {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.04); }
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export const LoginScreen = () => {
  const C = useTheme();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [btnHover, setBtnHover] = useState(false);

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

  const isDisabled = loading || !email || !password;

  const inputSx = {
    width:"100%", background:"#0a1818",
    border:"1.5px solid #1e3535", borderRadius:9,
    padding:"10px 14px", fontSize:14, color:"#cee4e4",
    outline:"none", boxSizing:"border-box",
    transition:"border-color .2s, box-shadow .2s",
    fontFamily:"'DM Sans',sans-serif",
  };

  return (
    <>
      <style>{STYLES}</style>
      <div style={{
        minHeight:"100vh",
        background:"linear-gradient(-45deg, #0a1818, #0d2828, #0d4e4e, #0d2828)",
        backgroundSize:"400% 400%",
        animation:"gradientShift 18s ease infinite",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:20,
      }}>
        <div style={{width:"100%", maxWidth:380}}>

          {/* Logo */}
          <div style={{
            textAlign:"center", marginBottom:40,
            animation:"logoFade .45s cubic-bezier(.22,.61,.36,1) both",
          }}>
            <div style={{
              width:56, height:56, borderRadius:16, background:"#0d5e5e",
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 16px",
              animation:"logoPulse 3s ease-in-out infinite",
            }}>
              <svg width="32" height="32" viewBox="0 0 50 50" fill="none">
                <path d="M8 42 C8 42 8 8 8 8 C8 4 12 4 12 4 C12 4 28 4 28 4 C42 4 42 18 34 22 C42 26 44 42 30 42 Z" fill="#4d8e8e"/>
              </svg>
            </div>
            <div style={{fontSize:26, fontWeight:700, color:"#ffffff", letterSpacing:".5px"}}>RBO</div>
            <div style={{fontSize:13, color:"#4d8e8e", marginTop:4}}>Rilop BackOffice</div>
          </div>

          {/* Card */}
          <div style={{
            background:"#122424", borderRadius:16,
            padding:"28px 28px 24px", border:"1px solid #1e3535",
            animation:"cardIn .55s .08s cubic-bezier(.22,.61,.36,1) both",
          }}>
            <h2 style={{fontSize:18, fontWeight:600, color:"#cee4e4", marginBottom:22}}>Iniciar sessão</h2>

            <div style={{display:"flex", flexDirection:"column", gap:14}}>
              <div>
                <label style={{fontSize:12, fontWeight:600, color:"#4d8e8e", textTransform:"uppercase", letterSpacing:".5px", display:"block", marginBottom:6}}>Email</label>
                <input
                  type="email" value={email}
                  onChange={e=>setEmail(e.target.value)} onKeyDown={handleKey}
                  placeholder="email@empresa.pt" autoComplete="email"
                  style={inputSx}
                  onFocus={e=>{ e.target.style.borderColor="#1a7a7a"; e.target.style.boxShadow="0 0 0 3px #1a7a7a22"; }}
                  onBlur={e=>{  e.target.style.borderColor="#1e3535";  e.target.style.boxShadow="none"; }}
                />
              </div>
              <div>
                <label style={{fontSize:12, fontWeight:600, color:"#4d8e8e", textTransform:"uppercase", letterSpacing:".5px", display:"block", marginBottom:6}}>Password</label>
                <input
                  type="password" value={password}
                  onChange={e=>setPassword(e.target.value)} onKeyDown={handleKey}
                  placeholder="••••••••" autoComplete="current-password"
                  style={inputSx}
                  onFocus={e=>{ e.target.style.borderColor="#1a7a7a"; e.target.style.boxShadow="0 0 0 3px #1a7a7a22"; }}
                  onBlur={e=>{  e.target.style.borderColor="#1e3535";  e.target.style.boxShadow="none"; }}
                />
              </div>
            </div>

            {error && (
              <div style={{marginTop:14, background:"#e0787818", border:"1px solid #e0787844", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#e07878", display:"flex", gap:8, alignItems:"center"}}>
                <Icon name="alert" size={14} color="#e07878"/>{error}
              </div>
            )}

            <button
              onClick={doLogin}
              disabled={isDisabled}
              onMouseEnter={()=>setBtnHover(true)}
              onMouseLeave={()=>setBtnHover(false)}
              style={{
                width:"100%", marginTop:20,
                background: isDisabled ? "#0d5e5e88" : btnHover ? "#1d8a8a" : "#1a7a7a",
                color:"#ffffff", border:"none", borderRadius:9,
                padding:"11px", fontSize:15, fontWeight:600,
                cursor: isDisabled ? "not-allowed" : "pointer",
                transition:"background .2s, box-shadow .2s",
                fontFamily:"'DM Sans',sans-serif",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                boxShadow: !isDisabled && btnHover ? "0 4px 20px #1a7a7a40" : "none",
              }}>
              {loading ? (
                <>
                  <span style={{
                    width:14, height:14,
                    border:"2px solid #ffffff44", borderTopColor:"#ffffff",
                    borderRadius:"50%",
                    animation:"spin .7s linear infinite",
                    display:"inline-block", flexShrink:0,
                  }}/>
                  A entrar...
                </>
              ) : "Entrar"}
            </button>
          </div>

          <div style={{textAlign:"center", marginTop:20, fontSize:12, color:"#2a5050"}}>
            Rilop BackOffice · Acesso restrito
          </div>
        </div>
      </div>
    </>
  );
};
