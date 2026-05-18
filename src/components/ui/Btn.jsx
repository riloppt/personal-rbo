import React from 'react';
import { useTheme } from '../../theme';
import { Icon } from './Icon';

export const Btn = ({ children, onClick, variant="primary", size="md", icon, disabled, title }) => {
  const C = useTheme();
  const styles = {
    primary:   {background:C.teal,       color:"#ffffff",border:"none"},
    secondary: {background:"transparent",color:C.teal,   border:`1.5px solid ${C.teal}`},
    ghost:     {background:"transparent",color:C.grey600,border:"none"},
    danger:    {background:C.red+"15",   color:C.red,    border:`1.5px solid ${C.red}44`},
  };
  const sz = {sm:{padding:"5px 12px",fontSize:13},md:{padding:"8px 18px",fontSize:14},lg:{padding:"11px 24px",fontSize:15}};
  return (
    <button disabled={disabled} onClick={onClick} title={title}
      style={{...styles[variant],...sz[size],borderRadius:8,cursor:disabled?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",gap:6,fontFamily:"'DM Sans',sans-serif",fontWeight:500,transition:"all .15s",opacity:disabled?.5:1}}>
      {icon&&<Icon name={icon} size={15}/>}{children}
    </button>
  );
};
