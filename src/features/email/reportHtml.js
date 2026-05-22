import { fmtDate } from '../../utils/formatters';

export const buildPeriodReportHtml = ({ contrato, cliente, tipologia, inicio, fim, movimentos, saldoTotal, tecnicos, locais, equipamentos }) => {
  const hasEq     = movimentos.some(m => m.equipment_id);
  const loaded    = movimentos.filter(m => m.creditos > 0).reduce((s, m) => s + m.creditos, 0);
  const consumed  = Math.abs(movimentos.filter(m => m.creditos < 0).reduce((s, m) => s + m.creditos, 0));
  const pSaldo    = loaded - consumed;
  const nLoaded   = movimentos.filter(m => m.creditos > 0).length;
  const nConsumed = movimentos.filter(m => m.creditos < 0).length;
  const colCount  = hasEq ? 6 : 5;
  const psColor   = pSaldo   >= 0 ? '#2db87d' : '#e05a5a';
  const stColor   = saldoTotal >= 0 ? '#2db87d' : '#e05a5a';

  const eqHeader = hasEq ? '<th>Equipamento</th>' : '';

  const rowsHtml = movimentos.length === 0
    ? `<tr><td colspan="${colCount}" style="text-align:center;padding:40px 20px;color:#8fa6ab;font-size:14px;font-style:italic">Sem movimentos no período selecionado</td></tr>`
    : movimentos.map(m => {
        const tecNome  = m.profile_tecnico_id ? (tecnicos.find(t => t.id === m.profile_tecnico_id)?.nome    || '—') : '—';
        const locNome  = m.local_id           ? (locais.find(l => l.id === m.local_id)?.nome               || '—') : '—';
        const eqNome   = m.equipment_id       ? (equipamentos.find(e => e.id === m.equipment_id)?.descricao || '—') : '';
        const isPos    = m.creditos > 0;
        const credColor = isPos ? '#2db87d' : '#e05a5a';
        const eqCell   = hasEq ? `<td>${eqNome || '—'}</td>` : '';
        return `<tr>
          <td style="white-space:nowrap">${fmtDate(m.data)}</td>
          <td>${tecNome}</td>
          <td>${locNome}</td>
          ${eqCell}
          <td style="color:#4a6468;max-width:300px;word-break:break-word">${m.descritivo || '—'}</td>
          <td style="text-align:right;white-space:nowrap;color:${credColor};font-weight:700;font-family:'DM Mono',monospace">${isPos ? '+' : ''}${m.creditos}</td>
        </tr>`;
      }).join('\n');

  return `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Relatório de Assistências — ${cliente?.nome || ''}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#f8fafb;color:#1e3236;}
.page{max-width:900px;margin:0 auto;background:#fff;min-height:100vh;box-shadow:0 0 40px #0d5e5e15;}
.header{background:#0d5e5e;padding:32px 40px;display:flex;justify-content:space-between;align-items:flex-start;gap:24px;}
.logo{font-size:24px;font-weight:700;color:#fff;}.logo-sub{font-size:11px;color:#b3e0e0;margin-top:2px;}
.client-name{color:#fff;font-size:18px;font-weight:600;margin-top:10px;}
.tag{display:inline-block;background:#ffffff22;color:#fff;border:1px solid #ffffff33;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:600;margin-top:8px;}
.ref{text-align:right;flex-shrink:0;}
.ref-title{font-size:17px;font-weight:700;color:#fff;letter-spacing:-.2px;}
.ref-period{font-size:13px;color:#e0f5f5;margin-top:5px;font-family:'DM Mono',monospace;}
.ref-date{font-size:11px;color:#b3e0e0;margin-top:6px;}
.body{padding:32px 40px;}
.sec-title{font-size:10px;font-weight:700;color:#8fa6ab;text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px;padding-bottom:7px;border-bottom:1px solid #eef2f3;}
.section{margin-bottom:26px;}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.field label{font-size:10px;font-weight:600;color:#8fa6ab;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:2px;}
.field .val{font-size:13px;color:#1e3236;}
.mov-table{width:100%;border-collapse:collapse;font-size:13px;}
.mov-table th{text-align:left;font-size:10px;font-weight:600;color:#8fa6ab;text-transform:uppercase;letter-spacing:.5px;padding:0 10px 9px;border-bottom:2px solid #eef2f3;}
.mov-table th:last-child{text-align:right;}
.mov-table td{padding:10px;border-bottom:1px solid #f2f6f7;vertical-align:top;line-height:1.4;}
.mov-table tr:last-child td{border-bottom:none;}
.mov-table tbody tr:hover td{background:#f8fbfb;}
.totals-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px;}
.tot-box{border-radius:10px;padding:16px 18px;}
.tot-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;}
.tot-val{font-size:28px;font-weight:700;font-family:'DM Mono',monospace;line-height:1;}
.tot-sub{font-size:11px;margin-top:5px;opacity:.75;}
.tot-pos{background:#f0faf4;}.tot-pos .tot-label{color:#1a8c5c;}.tot-pos .tot-val{color:#2db87d;}
.tot-neg{background:#fef5f5;}.tot-neg .tot-label{color:#a03030;}.tot-neg .tot-val{color:#e05a5a;}
.tot-periodo{background:#eef8f8;}.tot-periodo .tot-label{color:#0d5e5e;}.tot-periodo .tot-val{color:${psColor};}
.saldo-atual{background:#0d5e5e;border-radius:10px;padding:16px 22px;display:flex;justify-content:space-between;align-items:center;}
.sa-label{font-size:13px;font-weight:600;color:#fff;}.sa-sub{font-size:11px;color:#b3e0e0;margin-top:2px;}
.sa-val{font-size:32px;font-weight:700;font-family:'DM Mono',monospace;color:${stColor};}
.footer{background:#f8fafb;padding:22px 40px;border-top:1px solid #eef2f3;display:flex;justify-content:space-between;align-items:center;}
.footer-brand{font-size:11px;color:#8fa6ab;}.footer-brand strong{color:#1e3236;display:block;font-size:12px;}
.btn-pdf{background:#1a7a7a;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500;}
@media print{.btn-pdf{display:none!important;}.page{box-shadow:none;}}
</style></head><body><div class="page">
<div class="header">
  <div>
    <div class="logo">rilop</div><div class="logo-sub">Informática e Comunicação</div>
    <div class="client-name">${cliente?.nome || '—'}</div>
    <span class="tag">${tipologia?.nome || '—'}</span>
  </div>
  <div class="ref">
    <div class="ref-title">Relatório de Assistências</div>
    <div class="ref-period">Período: ${fmtDate(inicio)} a ${fmtDate(fim)}</div>
    <div class="ref-date">Gerado em ${new Date().toLocaleString('pt-PT')}</div>
  </div>
</div>
<div class="body">
  <div class="section"><div class="sec-title">Dados do Cliente</div>
    <div class="grid">
      <div class="field"><label>Empresa</label><div class="val">${cliente?.nome || '—'}</div></div>
      <div class="field"><label>Contacto</label><div class="val">${cliente?.telefone || '—'}</div></div>
      <div class="field"><label>Morada</label><div class="val">${cliente?.morada ? cliente.morada + (cliente.localidade ? ', ' + cliente.localidade : '') : '—'}</div></div>
      <div class="field"><label>Email</label><div class="val">${cliente?.email || '—'}</div></div>
    </div>
  </div>
  <div class="section">
    <div class="sec-title">Movimentos do Período · ${movimentos.length} ${movimentos.length === 1 ? 'registo' : 'registos'}</div>
    <table class="mov-table">
      <thead><tr>
        <th>Data</th><th>Técnico</th><th>Local</th>${eqHeader}<th>Descritivo</th><th>Créditos</th>
      </tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>
  <div class="section"><div class="sec-title">Resumo</div>
    <div class="totals-grid">
      <div class="tot-box tot-pos">
        <div class="tot-label">Créditos Carregados</div>
        <div class="tot-val">+${loaded}</div>
        <div class="tot-sub">${nLoaded} ${nLoaded === 1 ? 'movimento' : 'movimentos'}</div>
      </div>
      <div class="tot-box tot-neg">
        <div class="tot-label">Créditos Consumidos</div>
        <div class="tot-val">${consumed}</div>
        <div class="tot-sub">${nConsumed} ${nConsumed === 1 ? 'assistência' : 'assistências'}</div>
      </div>
      <div class="tot-box tot-periodo">
        <div class="tot-label">Saldo do Período</div>
        <div class="tot-val">${pSaldo >= 0 ? '+' : ''}${pSaldo}</div>
      </div>
    </div>
    <div class="saldo-atual">
      <div>
        <div class="sa-label">Saldo Atual do Contrato</div>
        <div class="sa-sub">Total acumulado de todos os movimentos</div>
      </div>
      <div class="sa-val">${saldoTotal >= 0 ? '+' : ''}${saldoTotal}</div>
    </div>
  </div>
</div>
<div class="footer">
  <div class="footer-brand"><strong>rilop</strong>Relatório gerado pelo RBO · ${new Date().toLocaleString('pt-PT')}</div>
  <button class="btn-pdf" onclick="window.print()">⬇ Download PDF</button>
</div>
</div></body></html>`;
};

export const buildReportHtml = ({ mov, cliente, tipologia, tecnico, local, equipamento, forEmail = false }) => {
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
${forEmail ? '' : "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');"}
*{box-sizing:border-box;margin:0;padding:0;}body{font-family:${forEmail ? "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" : "'DM Sans',sans-serif"};background:#f8fafb;color:#1e3236;}
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
.footer{background:#f8fafb;padding:24px 40px;border-top:1px solid #eef2f3;display:flex;justify-content:space-between;align-items:center;}
.footer-brand{font-size:12px;color:#8fa6ab;}.footer-brand strong{color:#1e3236;display:block;font-size:13px;}
.btn-pdf{background:#1a7a7a;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500;}
.neg{color:#e05a5a!important;}.pos{color:#2db87d!important;}
@media print{.btn-pdf{display:none!important;}.page{box-shadow:none;}}
</style></head><body><div class="page">
<div class="header">
  <div><div class="logo">rilop</div><div class="logo-sub">Informática e Comunicação</div>
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
      ${equipamento ? `<div class="field" style="grid-column:1/-1"><label>Equipamento</label><div class="val">${equipamento.descricao}${equipamento.num_serie ? ` <span style="font-family:'DM Mono',monospace;font-size:12px;color:#8fa6ab;">· N/S: ${equipamento.num_serie}</span>` : ''}</div></div>` : ''}
    </div>
    <div class="desc">${mov.descritivo||"—"}</div>
  </div>
  <div class="section"><div class="sec-title">Créditos Consumidos</div>
    <div class="cred-box">
      <div class="cred-val ${mov.creditos<0?"neg":"pos"}">${mov.creditos>0?"+":""}${mov.creditos}</div>
      <div class="cred-label">créditos nesta assistência</div>
    </div>
  </div>
</div>
<div class="footer">
  <div class="footer-brand"><strong>rilop</strong>Relatório gerado pelo RBO · ${new Date().toLocaleString("pt-PT")}</div>
  ${forEmail ? '' : '<button class="btn-pdf" onclick="window.print()">⬇ Download PDF</button>'}
</div>
</div></body></html>`;
};
