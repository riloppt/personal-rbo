import { fmtDate } from '../../utils/formatters';
import { qrUrl } from '../../utils/helpers';

export const buildReportHtml = ({ mov, cliente, tipologia, tecnico, local }) => {
  const duracao = mov.hora_inicio && mov.hora_fim ? (() => {
    const [h1,m1]=mov.hora_inicio.split(":").map(Number);
    const [h2,m2]=mov.hora_fim.split(":").map(Number);
    const mins=(h2*60+m2)-(h1*60+m1);
    return mins>0 ? `${Math.floor(mins/60)}h ${mins%60}min` : "—";
  })() : "—";
  return `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Relatório — ${cliente?.nome||""}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'DM Sans',sans-serif;background:#f8fafb;color:#1e3236;}
.page{max-width:720px;margin:0 auto;background:#fff;min-height:100vh;box-shadow:0 0 40px #0d5e5e15;}
.header{background:#0d5e5e;padding:36px 40px;display:flex;justify-content:space-between;align-items:flex-start;}
.logo{font-size:26px;font-weight:700;color:#fff;}.logo-sub{font-size:12px;color:#b3e0e0;margin-top:3px;}
.ref{text-align:right;color:#b3e0e0;font-size:13px;}.ref-num{font-size:28px;font-weight:700;color:#fff;font-family:'DM Mono',monospace;}
.tag{display:inline-block;background:#ffffff22;color:#fff;border:1px solid #ffffff33;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:600;margin-top:10px;}
.client-name{color:#fff;font-size:20px;font-weight:600;margin-top:8px;}
.body{padding:36px 40px;}.sec-title{font-size:11px;font-weight:600;color:#8fa6ab;text-transform:uppercase;letter-spacing:.8px;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #eef2f3;}
.section{margin-bottom:28px;}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.field label{font-size:11px;font-weight:600;color:#8fa6ab;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:3px;}.field .val{font-size:14px;color:#1e3236;}
.desc{background:#f8fafb;border:1px solid #eef2f3;border-radius:10px;padding:16px;font-size:14px;line-height:1.7;color:#4a6468;}
.cred-box{background:#0d5e5e;border-radius:12px;padding:20px 24px;}.cred-val{font-size:40px;font-weight:700;font-family:'DM Mono',monospace;}
.cred-label{font-size:13px;color:#b3e0e0;margin-top:4px;}
.qr-box{display:flex;gap:20px;align-items:center;background:#f8fafb;border-radius:12px;padding:20px 24px;border:1px solid #eef2f3;}
.qr-info strong{font-size:14px;font-weight:600;display:block;margin-bottom:4px;}.qr-info p{font-size:13px;color:#4a6468;line-height:1.6;}
.footer{background:#f8fafb;padding:24px 40px;border-top:1px solid #eef2f3;display:flex;justify-content:space-between;align-items:center;}
.footer-brand{font-size:12px;color:#8fa6ab;}.footer-brand strong{color:#1e3236;display:block;font-size:13px;}
.btn-pdf{background:#1a7a7a;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500;}
.neg{color:#e05a5a!important;}.pos{color:#2db87d!important;}
@media print{.btn-pdf{display:none!important;}.page{box-shadow:none;}}
</style></head><body><div class="page">
<div class="header">
  <div><div class="logo">rilop</div><div class="logo-sub">Serviços de Tecnologia de Informação</div>
  <div class="client-name">${cliente?.nome||"—"}</div><span class="tag">${tipologia?.nome||"—"}</span></div>
  <div class="ref"><div class="ref-num">#${mov.id}</div><div>${fmtDate(mov.data)}</div>${mov.hora_inicio?`<div>${mov.hora_inicio}${mov.hora_fim?" → "+mov.hora_fim:""}</div>`:""}</div>
</div>
<div class="body">
  <div class="section"><div class="sec-title">Dados do Cliente</div>
    <div class="grid">
      <div class="field"><label>Empresa</label><div class="val">${cliente?.nome||"—"}</div></div>
      <div class="field"><label>Técnico</label><div class="val">${tecnico?.nome||"—"}</div></div>
      <div class="field"><label>Morada</label><div class="val">${cliente?.morada||"—"}, ${cliente?.localidade||""}</div></div>
      <div class="field"><label>Contacto</label><div class="val">${cliente?.telefone||"—"}</div></div>
    </div>
  </div>
  <div class="section"><div class="sec-title">Detalhe da Assistência</div>
    <div class="grid" style="margin-bottom:16px;">
      <div class="field"><label>Data</label><div class="val">${fmtDate(mov.data)}</div></div>
      <div class="field"><label>Duração</label><div class="val">${duracao}</div></div>
      <div class="field"><label>Técnico</label><div class="val">${tecnico?.nome||"—"}</div></div>
      <div class="field"><label>Local</label><div class="val">${local?.nome||"—"}</div></div>
    </div>
    <div class="desc">${mov.descritivo||"—"}</div>
  </div>
  <div class="section"><div class="sec-title">Créditos Consumidos</div>
    <div class="cred-box">
      <div class="cred-val ${mov.creditos<0?"neg":"pos"}">${mov.creditos>0?"+":""}${mov.creditos}</div>
      <div class="cred-label">créditos nesta assistência</div>
    </div>
  </div>
  <div class="section"><div class="sec-title">Verificação Digital</div>
    <div class="qr-box">
      <img src="${qrUrl("Assistencia Rilop Ref#"+mov.id+" | "+(cliente?.nome||"")+" | "+fmtDate(mov.data)+" | "+(tecnico?.nome||""))}" width="110" height="110" alt="QR" style="border-radius:8px;border:1px solid #eef2f3;flex-shrink:0;"/>
      <div class="qr-info"><strong>QR Code de Verificação</strong>
        <p>Digitalize para verificar a autenticidade deste relatório e aceder à versão digital com opção de download em PDF.</p>
        <p style="margin-top:8px;font-size:12px;color:#8fa6ab;">Ref. #${mov.id} · ${fmtDate(mov.data)} · ${cliente?.nome||""}</p>
      </div>
    </div>
  </div>
</div>
<div class="footer">
  <div class="footer-brand"><strong>rilop</strong>Relatório gerado pelo RBO · ${new Date().toLocaleString("pt-PT")}</div>
  <button class="btn-pdf" onclick="window.print()">⬇ Download PDF</button>
</div>
</div></body></html>`;
};
