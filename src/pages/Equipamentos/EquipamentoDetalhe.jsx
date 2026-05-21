import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { Icon } from '../../components/ui/Icon';
import { estadoLabel, estadoCor } from '../Tickets/helpers';
import { fmtDate, fmtDateTime } from '../../utils/formatters';

const Field = ({ label, value }) => {
  const C = useTheme();
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: C.grey800 }}>{value || '—'}</div>
    </div>
  );
};

export const EquipamentoDetalhe = ({ equipamentoId, onBack, navigate }) => {
  const C = useTheme();
  const [eq, setEq] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: eqData }, { data: tkData }, { data: movData }] = await Promise.all([
      sb.from('rbo_client_equipment')
        .select('*,cliente:rbo_clientes(id,nome),tipo:rbo_equipment_types(id,nome)')
        .eq('id', equipamentoId)
        .single(),
      sb.from('rbo_tickets')
        .select('id,created_at,descricao_problema,estado,tecnico:rbo_profiles(id,nome)')
        .eq('equipamento_id', equipamentoId)
        .order('created_at', { ascending: false }),
      sb.from('rbo_movimentos')
        .select('id,data,descritivo,creditos,tecnico:rbo_profiles!profile_tecnico_id(id,nome)')
        .eq('equipment_id', equipamentoId)
        .order('data', { ascending: false }),
    ]);

    const tickets = (tkData || []).map(t => ({
      _type: 'ticket',
      _date: t.created_at,
      _id: t.id,
      descricao: t.descricao_problema,
      tecnico: t.tecnico,
      estado: t.estado,
    }));

    const movimentos = (movData || []).map(m => ({
      _type: 'movimento',
      _date: m.data,
      _id: m.id,
      descricao: m.descritivo,
      tecnico: m.tecnico,
      creditos: m.creditos,
    }));

    const unified = [...tickets, ...movimentos].sort((a, b) =>
      new Date(b._date) - new Date(a._date)
    );

    setEq(eqData || null);
    setHistory(unified);
    setLoading(false);
  }, [equipamentoId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading />;
  if (!eq) return (
    <div style={{ padding: 32, textAlign: 'center', color: C.grey400 }}>Equipamento não encontrado.</div>
  );

  return (
    <div>
      <button onClick={onBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.teal, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 20 }}>
        ← Voltar aos equipamentos
      </button>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.grey800 }}>{eq.descricao || '—'}</h2>
        {eq.num_serie && <div style={{ fontSize: 13, color: C.grey400, marginTop: 2 }}>N/S: {eq.num_serie}</div>}
      </div>

      <Card style={{ marginBottom: 20, padding: '20px 24px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 16 }}>Dados do Equipamento</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px 24px' }}>
          <Field label="Descrição" value={eq.descricao} />
          <Field label="Nº de Série" value={eq.num_serie} />
          <Field label="Tipo" value={eq.tipo?.nome} />
          <Field label="Localização" value={eq.localizacao} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Estado</div>
            <Badge color={eq.ativo === false ? C.grey400 : C.green}>{eq.ativo === false ? 'Inativo' : 'Ativo'}</Badge>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Cliente</div>
            <div style={{ fontSize: 14, color: C.teal, fontWeight: 500 }}>{eq.cliente?.nome || '—'}</div>
          </div>
          {eq.notas && (
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Notas" value={eq.notas} />
            </div>
          )}
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.grey100}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.grey800 }}>Histórico de Intervenções</span>
          <span style={{ fontSize: 12, color: C.grey400 }}>{history.length} registo{history.length !== 1 ? 's' : ''}</span>
        </div>
        {history.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: C.grey400, fontSize: 13 }}>Sem intervenções registadas para este equipamento.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.grey100}` }}>
                  {['Data', 'Descrição', 'Técnico', 'Origem', 'Estado / Créditos'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', background: C.white, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <tr key={`${row._type}-${row._id}-${i}`}
                    style={{ borderBottom: `1px solid ${C.grey100}`, transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.grey50}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '11px 16px', color: C.grey600, whiteSpace: 'nowrap', fontSize: 13 }}>
                      {row._type === 'ticket' ? fmtDateTime(row._date) : fmtDate(row._date)}
                    </td>
                    <td style={{ padding: '11px 16px', color: C.grey800, maxWidth: 280 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.descricao || '—'}</div>
                    </td>
                    <td style={{ padding: '11px 16px', color: C.grey600, fontSize: 13, whiteSpace: 'nowrap' }}>{row.tecnico?.nome || '—'}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <Badge color={row._type === 'ticket' ? C.teal : C.amber}>
                        {row._type === 'ticket' ? 'Ticket' : 'Contrato'}
                      </Badge>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      {row._type === 'ticket' ? (
                        <Badge color={estadoCor(row.estado)}>{estadoLabel(row.estado)}</Badge>
                      ) : (
                        <span style={{ fontSize: 13, fontWeight: 600, color: row.creditos < 0 ? C.amber : C.green }}>
                          {row.creditos > 0 ? '+' : ''}{row.creditos} cr.
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
