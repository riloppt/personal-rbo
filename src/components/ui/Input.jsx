import React from 'react';
import { useTheme } from '../../theme';

export const Input = ({ label, value, onChange, type="text", placeholder, required, textarea, rows=3 }) => {
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
