import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { Icon } from '../../components/ui/Icon';
import { estadoLabel, estadoCor } from '../Tickets/helpers';
import { fmtDateTime } from '../../utils/formatters';

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
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: eqData }, { data: tkData }] = await Promise.all([
      sb.from('rbo_client_equipment')
        .select('*,cliente:rbo_clientes(id,nome),tipo:rbo_equipment_types(id,nome)')
        .eq('id', equipamentoId)
        .single(),
      sb.from('rbo_tickets')
        .select('id,created_at,descricao,estado,tecnico:rbo_profiles(id,nome)')
        .eq('equipamento_id', equipamentoId)
        .order('created_at', { ascending: false }),
    ]);
    setEq(eqData || null);
    setTickets(tkData || []);
    setLoading(false);
  }, [equipamentoId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading />;
  if (!eq) return (
    <div style={{ padding: 32, textAlign: 'center', color: C.grey400 }}>Equipamento não encontrado.</div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="secondary" icon="chevronR" onClick={onBack} style={{ transform: 'rotate(180deg)' }}>Voltar</Btn>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.grey800 }}>{eq.descricao || '—'}</h2>
          {eq.num_serie && <div style={{ fontSize: 13, color: C.grey400, marginTop: 2 }}>N/S: {eq.num_serie}</div>}
        </div>
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
          <span style={{ fontSize: 14, fontWeight: 600, color: C.grey800 }}>Histórico de Tickets</span>
          <span style={{ fontSize: 12, color: C.grey400 }}>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</span>
        </div>
        {tickets.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: C.grey400, fontSize: 13 }}>Sem tickets para este equipamento</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.grey100}` }}>
                {['ID', 'Data', 'Descrição', 'Estado', 'Técnico', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', background: C.white, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id}
                  style={{ borderBottom: `1px solid ${C.grey100}`, cursor: navigate ? 'pointer' : 'default', transition: 'background .1s' }}
                  onClick={() => navigate && navigate('tickets')}
                  onMouseEnter={e => e.currentTarget.style.background = C.grey50}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '11px 16px', color: C.grey400, fontSize: 12, fontWeight: 600 }}>#{t.id}</td>
                  <td style={{ padding: '11px 16px', color: C.grey600, whiteSpace: 'nowrap', fontSize: 13 }}>{fmtDateTime(t.created_at)}</td>
                  <td style={{ padding: '11px 16px', color: C.grey800, maxWidth: 260 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.descricao || '—'}</div>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <Badge color={estadoCor(t.estado)}>{estadoLabel(t.estado)}</Badge>
                  </td>
                  <td style={{ padding: '11px 16px', color: C.grey600, fontSize: 13 }}>{t.tecnico?.nome || '—'}</td>
                  <td style={{ padding: '8px 16px' }}>
                    {navigate && (
                      <button onClick={e => { e.stopPropagation(); navigate('tickets'); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.background = C.grey100}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <Icon name="chevronR" size={14} color={C.teal} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};
