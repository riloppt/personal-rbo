import { fmtDate } from '../../utils/formatters';
import { estadoLabel, estadoCor } from './helpers';

const via = (ticket, viaLabel) => {
  const tid = `#${String(ticket.id).padStart(4, '0')}`;
  const cor = estadoCor(ticket.estado);
  return `<div class="page">
  <div class="header">
    <div class="brand">
      <div class="logo">RBO</div>
      <div class="brand-name">Rilop - Informática e Comunicação, Lda</div>
    </div>
    <div class="ref">
      <div class="ref-title">Ficha de Assistência</div>
      <div class="ref-num">${tid}</div>
      <div class="ref-date">${fmtDate(ticket.created_at?.split('T')[0])}</div>
    </div>
  </div>
  <div class="via-tag">${viaLabel}</div>
  <div class="body">
    <div class="grid">
      <div class="field"><label>Cliente</label><div class="val">${ticket.cliente?.nome || ticket.nome_empresa || '—'}</div></div>
      <div class="field"><label>Técnico</label><div class="val">${ticket.tecnico?.nome || '—'}</div></div>
      ${ticket.equipamento ? `<div class="field"><label>Equipamento</label><div class="val">${ticket.equipamento.descricao}${ticket.equipamento.num_serie ? ' — S/N ' + ticket.equipamento.num_serie : ''}</div></div>` : ''}
      <div class="field"><label>Estado</label><div class="val"><span class="badge" style="background:${cor}22;color:${cor};border-color:${cor}55">${estadoLabel(ticket.estado)}</span></div></div>
    </div>
    <div class="section">
      <label>Descrição do Problema</label>
      <div class="desc-box">${(ticket.descricao_problema || '—').replace(/\n/g, '<br/>')}</div>
    </div>
    ${ticket.solicitado_backup ? `<div class="backup-flag">⚠ Solicitado Backup</div>` : ''}
  </div>
  <div class="signatures">
    <div class="sig">
      <div class="sig-line"></div>
      <div class="sig-label">Assinatura do Cliente</div>
      <div class="sig-date">Data: ____ / ____ / ______</div>
    </div>
    <div class="sig">
      <div class="sig-line"></div>
      <div class="sig-label">Assinatura Rilop</div>
      <div class="sig-date">Data: ____ / ____ / ______</div>
    </div>
  </div>
</div>`;
};

export const buildTicketPrintHtml = (ticket) => `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"/>
<title>Ficha de Assistência #${String(ticket.id).padStart(4, '0')}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;color:#1e3236;}
@page{size:A4;margin:14mm;}
.page{page-break-after:always;min-height:100vh;display:flex;flex-direction:column;}
.page:last-child{page-break-after:auto;}
.header{background:#0d5e5e;color:#fff;padding:20px 24px;border-radius:10px;display:flex;justify-content:space-between;align-items:flex-start;}
.logo{font-size:20px;font-weight:700;}
.brand-name{font-size:11px;color:#b3e0e0;margin-top:4px;max-width:220px;}
.ref{text-align:right;}
.ref-title{font-size:14px;font-weight:600;}
.ref-num{font-size:20px;font-weight:700;font-family:'DM Mono',monospace;margin-top:2px;}
.ref-date{font-size:11px;color:#b3e0e0;margin-top:4px;}
.via-tag{align-self:flex-end;margin-top:10px;font-size:11px;font-weight:700;color:#0d5e5e;text-transform:uppercase;letter-spacing:.6px;border:1px solid #0d5e5e55;border-radius:20px;padding:3px 12px;}
.body{flex:1;padding:24px 4px;}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:22px;}
.field label{font-size:10px;font-weight:700;color:#8fa6ab;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px;}
.field .val{font-size:14px;color:#1e3236;}
.badge{display:inline-block;font-size:12px;font-weight:600;border:1px solid;border-radius:20px;padding:2px 12px;}
.section label{font-size:10px;font-weight:700;color:#8fa6ab;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px;}
.desc-box{font-size:14px;line-height:1.6;border:1px solid #eef2f3;border-radius:8px;padding:14px;min-height:90px;}
.backup-flag{margin-top:16px;display:inline-block;background:#fdf3e3;color:#a3721c;border:1px solid #e8a83a55;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;}
.signatures{display:flex;gap:24px;margin-top:auto;padding-top:40px;}
.sig{flex:1;}
.sig-line{border-top:1.5px solid #1e3236;margin-bottom:8px;}
.sig-label{font-size:13px;font-weight:600;}
.sig-date{font-size:12px;color:#8fa6ab;margin-top:14px;}
@media print{.page{margin:0;}}
</style></head><body>
${via(ticket, 'Via Cliente')}
${via(ticket, 'Via Rilop')}
</body></html>`;
