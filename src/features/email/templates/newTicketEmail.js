export const buildNewTicketEmail = ({ id, nome_empresa, nome_pessoa, email_cliente, telefone_cliente, descricao_problema, created_at }) => {
  const idPadded = String(id).padStart(4, '0');
  const dataFormatada = created_at
    ? new Date(created_at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const field = (label, value) => `
    <div>
      <div style="font-size:10px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${label}</div>
      <div style="font-size:14px;color:#1a1a1a;">${value || '—'}</div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,0.08);overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:#0d3d3d;padding:28px 32px;">
          <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Rilop</div>
          <div style="font-size:13px;color:#4d9898;margin-top:2px;">BackOffice de Assistência</div>
        </td></tr>

        <!-- Ticket ID + badge -->
        <tr><td style="padding:28px 32px 20px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:38px;font-weight:800;color:#0d5e5e;letter-spacing:-1px;line-height:1;">#${idPadded}</td>
            <td style="padding-left:16px;vertical-align:middle;">
              <div style="background:#e6f5f5;color:#0d6e6e;font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;padding:5px 12px;border-radius:20px;white-space:nowrap;">Novo Pedido</div>
            </td>
          </tr></table>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:0 32px;"><div style="height:1px;background:#f0f0f0;"></div></td></tr>

        <!-- Info fields -->
        <tr><td style="padding:24px 32px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding-right:20px;padding-bottom:20px;">${field('Empresa', nome_empresa)}</td>
              <td width="50%" style="padding-bottom:20px;">${field('Pessoa de Contacto', nome_pessoa)}</td>
            </tr>
            <tr>
              <td width="50%" style="padding-right:20px;padding-bottom:20px;">${field('Email', email_cliente)}</td>
              <td width="50%" style="padding-bottom:20px;">${field('Telefone', telefone_cliente)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding-bottom:20px;">${field('Submetido em', dataFormatada)}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:0 32px;"><div style="height:1px;background:#f0f0f0;"></div></td></tr>

        <!-- Description -->
        <tr><td style="padding:24px 32px 28px;">
          <div style="font-size:10px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Descrição do Problema</div>
          <div style="background:#f9f9f9;border-left:3px solid #0d6e6e;border-radius:0 6px 6px 0;padding:14px 16px;font-size:14px;color:#333333;line-height:1.6;white-space:pre-wrap;">${descricao_problema || '—'}</div>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 32px 36px;text-align:center;">
          <a href="https://rbo-gules.vercel.app" style="display:inline-block;background:#0d6e6e;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 32px;border-radius:8px;letter-spacing:0.2px;">Abrir no RBO</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0d3d3d;padding:18px 32px;text-align:center;">
          <div style="font-size:12px;color:#4d9898;">Rilop · noreply@rilop.pt</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};
