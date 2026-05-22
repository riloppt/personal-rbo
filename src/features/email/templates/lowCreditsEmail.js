export const buildLowCreditsEmail = ({ cliente, contrato, tipologia, saldo, limiar }) => {
  const field = (label, value) => `
    <div>
      <div style="font-size:10px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${label}</div>
      <div style="font-size:14px;color:#1a1a1a;">${value || '—'}</div>
    </div>`;

  const dataContrato = contrato?.data_contrato
    ? new Date(contrato.data_contrato).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,0.08);overflow:hidden;">

        <tr><td style="background:#0d3d3d;padding:28px 32px;">
          <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Rilop</div>
          <div style="font-size:13px;color:#4d9898;margin-top:2px;">BackOffice de Assistência</div>
        </td></tr>

        <tr><td style="padding:28px 32px 20px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:38px;font-weight:800;color:#c27500;letter-spacing:-1px;line-height:1;">${saldo} cr.</td>
            <td style="padding-left:16px;vertical-align:middle;">
              <div style="background:#fef3e2;color:#b45309;font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;padding:5px 12px;border-radius:20px;white-space:nowrap;">Aviso de Créditos</div>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:0 32px;"><div style="height:1px;background:#f0f0f0;"></div></td></tr>

        <tr><td style="padding:24px 32px 8px;">
          <div style="font-size:15px;color:#1a1a1a;line-height:1.6;margin-bottom:14px;">
            Caro(a) <strong>${cliente?.nome || 'Cliente'}</strong>,
          </div>
          <div style="font-size:14px;color:#333333;line-height:1.75;">
            O saldo do seu contrato de <strong>${tipologia?.nome || '—'}</strong> desceu para
            <strong style="color:#c27500;">${saldo} créditos</strong>,
            abaixo do limiar de alerta de ${limiar} créditos.
          </div>
        </td></tr>

        <tr><td style="padding:16px 32px;">
          <div style="background:#fffbf0;border-left:4px solid #e8a83a;border-radius:0 8px 8px 0;padding:16px 18px;">
            <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.4px;">Renovação Automática</div>
            <div style="font-size:14px;color:#44403c;line-height:1.7;">
              O contrato será <strong>renovado automaticamente</strong> e faturado.
              Caso não pretenda renovar, deverá informar-nos no prazo de <strong>48 horas</strong>.
            </div>
          </div>
        </td></tr>

        <tr><td style="padding:0 32px;"><div style="height:1px;background:#f0f0f0;"></div></td></tr>

        <tr><td style="padding:24px 32px 20px;">
          <div style="font-size:10px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:16px;">Dados do Contrato</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding-right:20px;padding-bottom:20px;">${field('Tipologia', tipologia?.nome)}</td>
              <td width="50%" style="padding-bottom:20px;">${field('Data de Início', dataContrato)}</td>
            </tr>
            <tr>
              <td width="50%" style="padding-right:20px;padding-bottom:8px;">${field('Saldo Atual', `${saldo} créditos`)}</td>
              <td width="50%" style="padding-bottom:8px;">${field('Limiar de Alerta', `${limiar} créditos`)}</td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 32px 28px;">
          <div style="background:#f9f9f9;border-radius:8px;padding:16px 18px;">
            <div style="font-size:11px;font-weight:600;color:#888888;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:8px;">Contactos Rilop</div>
            <div style="font-size:13px;color:#444444;line-height:1.7;">
              Email: <a href="mailto:aveiro@rilop.pt" style="color:#0d6e6e;text-decoration:none;">aveiro@rilop.pt</a><br>
              Web: <a href="https://rilop.pt" style="color:#0d6e6e;text-decoration:none;">rilop.pt</a>
            </div>
          </div>
        </td></tr>

        <tr><td style="background:#0d3d3d;padding:18px 32px;text-align:center;">
          <div style="font-size:12px;color:#4d9898;">Rilop · noreply@rilop.pt</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};
