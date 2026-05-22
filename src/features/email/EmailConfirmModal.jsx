import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { Modal } from '../../components/ui/Modal';
import { Icon } from '../../components/ui/Icon';
import { Btn } from '../../components/ui/Btn';
import { Input } from '../../components/ui/Input';
import { sendEmailResend } from '../../lib/email';
import { buildReportHtml } from './reportHtml';
import { fmtDate } from '../../utils/formatters';

export const EmailConfirmModal = ({ mov, lookup, onSent, onClose }) => {
  const C = useTheme();
  const { cliente, tipologia, tecnico, local, equipamento } = lookup(mov);
  const [emailTo,  setEmailTo]  = useState(cliente?.email || "");
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState(null);

  const doSend = async () => {
    if (!emailTo) return;
    setSending(true); setResult(null);
    try {
      const html    = buildReportHtml({ mov, cliente, tipologia, tecnico, local, equipamento, forEmail: true });
      const subject = `Relatório de Assistência Técnica — ${cliente?.nome||""} — ${fmtDate(mov.data)}`;
      await sendEmailResend({ to: emailTo, subject, html });
      await onSent(mov.id);
      setResult("ok");
    } catch (err) {
      setResult(err.message || "Erro desconhecido");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal title="Enviar Relatório por Email" onClose={onClose}>
      {result === "ok" ? (
        <div style={{textAlign:"center",padding:"20px 0"}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:C.green+"18",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <Icon name="mailDone" size={28} color={C.green}/>
          </div>
          <div style={{fontSize:17,fontWeight:600,color:C.grey800,marginBottom:6}}>Email enviado com sucesso!</div>
          <div style={{fontSize:14,color:C.grey400,marginBottom:24}}>O relatório foi enviado para <strong style={{color:C.grey800}}>{emailTo}</strong></div>
          <Btn onClick={onClose}>Fechar</Btn>
        </div>
      ) : (
        <>
          <div style={{background:C.grey50,borderRadius:10,padding:"14px 16px",marginBottom:20,border:`1px solid ${C.grey100}`}}>
            <div style={{fontSize:12,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".5px",marginBottom:8}}>Relatório a enviar</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["Cliente",cliente?.nome],["Data",fmtDate(mov.data)],["Tipologia",tipologia?.nome],["Técnico",tecnico?.nome||"—"],["Créditos",`${mov.creditos>0?"+":""}${mov.creditos}`],["Local",local?.nome||"—"]].map(([l,v])=>(
                <div key={l}>
                  <div style={{fontSize:11,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".4px"}}>{l}</div>
                  <div style={{fontSize:13,color:C.grey800,marginTop:1}}>{v||"—"}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.grey200}`}}>
              <div style={{fontSize:11,fontWeight:600,color:C.grey400,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>Descrição</div>
              <div style={{fontSize:13,color:C.grey600,lineHeight:1.5}}>{mov.descritivo}</div>
            </div>
          </div>
          <div style={{marginBottom:8}}>
            <Input label="Enviar para (pode alterar antes de enviar)" value={emailTo} onChange={setEmailTo} type="email" placeholder="email@cliente.pt" required/>
            {cliente?.email && emailTo !== cliente.email && (
              <div style={{marginTop:6,fontSize:12,color:C.amber,display:"flex",alignItems:"center",gap:5}}>
                <Icon name="alert" size={13} color={C.amber}/> Email diferente do registado na ficha ({cliente.email})
              </div>
            )}
            {!cliente?.email && (
              <div style={{marginTop:6,fontSize:12,color:C.amber,display:"flex",alignItems:"center",gap:5}}>
                <Icon name="alert" size={13} color={C.amber}/> O cliente não tem email na ficha — introduza manualmente
              </div>
            )}
          </div>
          {result && result !== "ok" && (
            <div style={{background:C.red+"10",border:`1px solid ${C.red}33`,borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:13,color:C.red,display:"flex",gap:8,alignItems:"center"}}>
              <Icon name="alert" size={15} color={C.red}/>{result}
            </div>
          )}
          <div style={{background:C.amber+"12",border:`1px solid ${C.amber}33`,borderRadius:8,padding:"10px 14px",marginBottom:20,fontSize:12,color:C.grey600,display:"flex",gap:8,alignItems:"flex-start"}}>
            <Icon name="alert" size={14} color={C.amber}/>
            <span>Em ambiente StackBlitz o envio pode falhar por restrições de rede (CORS). Em produção ou com a Edge Function do Supabase funcionará normalmente.</span>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn variant="secondary" onClick={onClose} disabled={sending}>Cancelar</Btn>
            <Btn icon={sending?"loader":"mail"} onClick={doSend} disabled={sending||!emailTo}>{sending?"A enviar...":"Enviar Relatório"}</Btn>
          </div>
        </>
      )}
    </Modal>
  );
};
