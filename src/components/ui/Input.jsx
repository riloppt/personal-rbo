import React from 'react';
import { useTheme } from '../../theme';

export const Input = ({ label, value, onChange, onBlur, type="text", placeholder, required, textarea, rows=3, error }) => {
  const C = useTheme();
  const base = {
    border: `1.5px solid ${error ? C.red : C.grey200}`,
    borderRadius: 8, padding: "8px 12px", fontSize: 14,
    outline: "none", background: C.white, color: C.grey800, width: "100%",
    transition: "border-color .15s",
  };
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label && (
        <label style={{fontSize:13,fontWeight:500,color:C.grey600}}>
          {label}{required && <span style={{color:C.red}}> *</span>}
        </label>
      )}
      {textarea
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} rows={rows} style={{...base,resize:"vertical"}}/>
        : <input type={type} value={value} onChange={e=>onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} style={{...base,height:38}}/>
      }
      {error && (
        <span style={{fontSize:12,color:C.red,display:"flex",alignItems:"center",gap:4}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </span>
      )}
    </div>
  );
};
