import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { sb } from '../../lib/supabase';

export const AccessDenied = ({ email }) => (
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
