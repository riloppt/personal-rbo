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
      <button onClick={()=>setShowModal(true)} title={tipText}
        style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,display:"flex",alignItems:"center",transition:"background .15s"}}
        onMouseEnter={e=>e.currentTarget.style.background=C.grey100}
        onMouseLeave={e=>e.currentTarget.style.background="none"}>
        <Icon name={sent?"mailDone":"mail"} size={15} color={sent?C.green:C.grey600}/>
      </button>
      {showModal&&<EmailConfirmModal mov={mov} lookup={lookup} onSent={onSent} onClose={()=>setShowModal(false)}/>}
    </>
  );

};
