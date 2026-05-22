const estadoLabel = id => ({
  submetido: 'Submetido', pendente: 'Pendente', atribuido: 'Atribuído',
  em_curso: 'Em Curso', aguarda_cliente: 'Aguarda Cliente',
  concluido: 'Concluído', reaberto: 'Reaberto', cancelado: 'Cancelado',
})[id] || id;

const estadoCor = id => ({
  submetido: '#e8a83a', pendente: '#7b68ee', atribuido: '#2a9d9d',
  em_curso: '#2db87d', aguarda_cliente: '#e07878',
  concluido: '#4a6468', reaberto: '#e07d3c', cancelado: '#e05a5a',
})[id] || '#8fa6ab';

export const buildTicketEstadoEmail = ({ ticket, estadoNovo, estadoAnterior, tecnico }) => {
  const idPadded = String(ticket.id).padStart(4, '0');
  const corNovo  = estadoCor(estadoNovo);
  const empresa  = ticket.nome_empresa || ticket.cliente?.nome || '—';
  const contacto = ticket.nome_pessoa  || '—';
  const descricao = ticket.descricao_problema || '—';
  const tecNome  = tecnico?.nome || '—';
  const dataHoje = new Date().toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const field = (label, value) => `
    <div style="margin-bottom:16px;">
      <div style="font-size:10px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${label}</div>
      <div style="font-size:14px;color:#1a1a1a;line-height:1.5;">${value}</div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,0.08);overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:#0d3d3d;padding:28px 32px;">
          <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">RBO</div>
          <div style="font-size:13px;color:#4d9898;margin-top:2px;">Rilop BackOffice</div>
        </td></tr>

        <!-- Ticket ID + Estado -->
        <tr><td style="padding:28px 32px 20px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:36px;font-weight:800;color:#0d5e5e;letter-spacing:-1px;line-height:1;font-family:monospace;">#${idPadded}</td>
            <td style="padding-left:14px;vertical-align:middle;">
              <div style="background:${corNovo}18;color:${corNovo};font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;padding:5px 14px;border-radius:20px;white-space:nowrap;border:1px solid ${corNovo}44;">
                ${estadoLabel(estadoNovo)}
              </div>
            </td>
          </tr></table>

          ${estadoAnterior ? `
          <div style="margin-top:12px;font-size:13px;color:#888888;">
            Estado anterior:
            <span style="color:${estadoCor(estadoAnterior)};font-weight:600;">${estadoLabel(estadoAnterior)}</span>
            &nbsp;→&nbsp;
            <span style="color:${corNovo};font-weight:600;">${estadoLabel(estadoNovo)}</span>
          </div>` : ''}
        </td></tr>

        <tr><td style="padding:0 32px;"><div style="height:1px;background:#f0f0f0;"></div></td></tr>

        <!-- Dados -->
        <tr><td style="padding:24px 32px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding-right:16px;vertical-align:top;">${field('Empresa', empresa)}</td>
              <td width="50%" style="vertical-align:top;">${field('Contacto', contacto)}</td>
            </tr>
            <tr>
              <td colspan="2">${field('Técnico Atribuído', tecNome)}</td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 32px;"><div style="height:1px;background:#f0f0f0;"></div></td></tr>

        <!-- Descrição -->
        <tr><td style="padding:20px 32px 28px;">
          <div style="font-size:10px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Descrição do Problema</div>
          <div style="background:#f9f9f9;border-left:3px solid #0d6e6e;border-radius:0 6px 6px 0;padding:14px 16px;font-size:14px;color:#333333;line-height:1.6;white-space:pre-wrap;">${descricao}</div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0d3d3d;padding:18px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:12px;color:#4d9898;font-weight:500;">Rilop - Informática e Comunicação, Lda</td>
              <td align="right" style="font-size:11px;color:#ffffff;">${dataHoje}</td>
            </tr>
            <tr><td colspan="2" style="font-size:11px;color:#336666;padding-top:6px;">Por favor não responda a este email — esta é uma mensagem automática.</td></tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};
