import React from 'react';
import { useTheme } from '../../theme';

export const Badge = ({ children, color }) => {
  const C = useTheme();
  const col = color || C.teal;
  return (
    <span style={{background:col+"22",color:col,border:`1px solid ${col}44`,borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{children}</span>
  );
};
