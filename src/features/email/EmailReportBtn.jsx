import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { Icon } from '../../components/ui/Icon';
import { EmailConfirmModal } from './EmailConfirmModal';
import { fmtDateTime } from '../../utils/formatters';

export const EmailReportBtn = ({ mov, lookup, onSent }) => {
  const C = useTheme();
  const sent = mov.relatorio_enviado_em;
  const [showModal, setShowModal] = useState(false);
  const { cliente } = lookup(mov);
  const tipText = sent
    ? `Enviado em ${fmtDateTime(sent)} — clique para reenviar`
    : `Enviar relatório para ${cliente?.email || "cliente"}`;
  return (
    <>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,position:"relative"}}>
        <button onClick={()=>setShowModal(true)} title={tipText}
          style={{background:sent?C.green+"15":"none",border:sent?`1px solid ${C.green}33`:"none",cursor:"pointer",padding:"4px 7px",borderRadius:7,display:"flex",alignItems:"center",transition:"all .15s",position:"relative"}}
          onMouseEnter={e=>e.currentTarget.style.background=sent?C.green+"25":C.tealXL}
          onMouseLeave={e=>e.currentTarget.style.background=sent?C.green+"15":"none"}>
          <Icon name={sent?"mailDone":"mail"} size={16} color={sent?C.green:C.teal}/>
          {sent&&<span style={{position:"absolute",top:0,right:0,width:7,height:7,borderRadius:"50%",background:C.green,border:`1.5px solid ${C.white}`}}/>}
        </button>
        {sent&&<span style={{fontSize:9,color:C.green,fontWeight:700,letterSpacing:".3px"}}>enviado</span>}
      </div>
      {showModal&&<EmailConfirmModal mov={mov} lookup={lookup} onSent={onSent} onClose={()=>setShowModal(false)}/>}
    </>
  );
};
