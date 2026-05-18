export const fmtDate     = d => d ? new Date(d+'T00:00:00').toLocaleDateString('pt-PT') : '—';
export const fmtDateTime = d => d ? new Date(d).toLocaleString('pt-PT') : '—';
export const maskPhone   = v => v.replace(/\D/g,'').slice(0,9).replace(/(\d{3})(\d{3})(\d{0,3})/,'$1 $2 $3').trim();
export const maskNif     = v => v.replace(/\D/g,'').slice(0,9).replace(/(\d{3})(\d{3})(\d{0,3})/,'$1 $2 $3').trim();
export const maskCP      = v => { const d = v.replace(/\D/g,'').slice(0,7); return d.length>4 ? d.slice(0,4)+'-'+d.slice(4) : d; };
