import React from 'react';
import { useTheme } from '../../theme';
import { Icon } from './Icon';
import { Btn } from './Btn';

export const ErrMsg = ({ msg, onRetry }) => {
  const C = useTheme();
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:C.red+"10",border:`1px solid ${C.red}33`,borderRadius:10,margin:"16px 0"}}>
      <Icon name="alert" size={18} color={C.red}/>
      <span style={{fontSize:14,color:C.red,flex:1}}>{msg}</span>
      {onRetry&&<Btn size="sm" variant="danger" onClick={onRetry}>Tentar novamente</Btn>}
    </div>
  );
};
