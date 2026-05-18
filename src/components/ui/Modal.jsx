import React from 'react';
import { useTheme } from '../../theme';
import { Icon } from './Icon';

export const Modal = ({ title, onClose, children, wide }) => {
  const C = useTheme();
  return (
    <div style={{position:"fixed",inset:0,background:"#00000066",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:16,width:"100%",maxWidth:wide?760:520,maxHeight:"90vh",overflow:"auto",boxShadow:"0 25px 60px #00000040",animation:"fadeIn .2s ease"}}>
        <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.grey100}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h3 style={{fontSize:17,fontWeight:600,color:C.grey800}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.grey400,padding:4}}><Icon name="close" size={20}/></button>
        </div>
        <div style={{padding:24}}>{children}</div>
      </div>
    </div>
  );
};
