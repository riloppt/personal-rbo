import React from 'react';
import { useTheme } from '../../theme';

export const Loading = () => {
  const C = useTheme();
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60,gap:12,color:C.grey400}}>
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" style={{animation:"spin .8s linear infinite"}}>
        <circle cx="12" cy="12" r="10" strokeOpacity=".2"/><path d="M12 2a10 10 0 0 1 10 10"/>
      </svg>
      A carregar...
    </div>
  );
};
