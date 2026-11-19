import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { Modal } from '../../components/ui/Modal';
import { Icon } from '../../components/ui/Icon';
import { Btn } from '../../components/ui/Btn';
import { Input } from '../../components/ui/Input';
import { sendEmailResend } from '../../lib/email';

const parseLista = s => s.split(',').map(e => e.trim()).filter(Boolean);

// Confirmação antes de enviar um email já construído. bcc não é editável (destinatários internos ocultos).
export const EnviarEmailModal = ({ titulo, to, cc = [], bcc = [], subject, html, onSent, onClose }) => {
  const C = useTheme();
  const [para,    setPara]    = useState(to || '');
  const [ccTxt,   setCcTxt]   = useState(cc.join(', '));
  const [sending, setSending] = useState(false);
  const [erro,    setErro]    = useState('');

  const enviar = async () => {
    setSending(true); setErro('');
    try {
      const ccList = parseLista(ccTxt);
      await sendEmailResend({ to: para.trim(), cc: ccList.length ? ccList : undefined, bcc: bcc.length ? bcc : undefined, subject, html });
      await onSent?.();
      onClose();
    } catch (err) {
      setErro(err?.message || 'Erro desconhecido');
      setSending(false);
    }
  };

  const preview = () => window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank');

  return (
    <Modal title={titulo} onClose={sending ? () => {} : onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 13, color: C.grey600 }}>Assunto: <strong style={{ color: C.grey800 }}>{subject}</strong></div>
        <Input label="Para" value={para} onChange={setPara} type="email" placeholder="email@cliente.pt" required/>
        <Input label="CC (separados por vírgula)" value={ccTxt} onChange={setCcTxt}/>
        {bcc.length > 0 && <div style={{ fontSize: 12, color: C.grey400 }}>BCC: {bcc.join(', ')}</div>}
        {erro && (
          <div style={{ background: C.red + '10', border: `1px solid ${C.red}33`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.red, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Icon name="alert" size={15} color={C.red}/>{erro}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, flexWrap: 'wrap' }}>
        <Btn variant="secondary" onClick={preview} disabled={sending}>Pré-visualizar</Btn>
        <Btn variant="secondary" onClick={onClose} disabled={sending}>Não enviar</Btn>
        <Btn icon={sending ? 'loader' : 'mail'} onClick={enviar} disabled={sending || !para.trim()}>{sending ? 'A enviar...' : 'Enviar'}</Btn>
      </div>
    </Modal>
  );
};
