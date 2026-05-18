import React from 'react';
import { useTheme } from '../../theme';

export const Select = ({ label, value, onChange, options, required }) => {
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
