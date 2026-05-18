import React from 'react';
import { useTheme } from '../../theme';

export const PageHeader = ({ title, subtitle, action }) => {
  const C = useTheme();
  return (
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,gap:16,flexWrap:"wrap"}}>
      <div>
        <h1 style={{fontSize:24,fontWeight:700,color:C.grey800}}>{title}</h1>
        {subtitle&&<p style={{fontSize:14,color:C.grey400,marginTop:4}}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
};
