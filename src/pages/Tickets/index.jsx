import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../theme';
import { useSortable } from '../../hooks/useSortable';
import { sb } from '../../lib/supabase';
import { PageHeader } from '../../components/ui/PageHeader';
import { Btn } from '../../components/ui/Btn';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { Select } from '../../components/ui/Select';
import { fmtDate } from '../../utils/formatters';
import { ESTADOS, estadoLabel, estadoCor } from './helpers';
import { TicketDetalhe } from './TicketDetalhe';
import { TicketNovoModal } from './TicketNovoModal';

export const Tickets = ({ currentUserId }) => {
  const C = useTheme();
  const [tickets,       setTickets]       = useState([]);
  const [tecnicos,      setTecnicos]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [detalhe,       setDetalhe]       = useState(null);
  const [modal,         setModal]         = useState(false);
  const [search,        setSearch]        = useState('');
  const [filterEstado,  setFilterEstado]  = useState('');
  const [filterTecnico, setFilterTecnico] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [tkR, tecR] = await Promise.all([
      sb.from('rbo_tickets')
        .select('*,cliente:rbo_clientes(id,nome),tecnico:rbo_profiles(id,nome),equipamento:rbo_client_equipment(id,descricao,num_serie)')
        .order('created_at', { ascending: false }),
      sb.from('rbo_profiles').select('id,nome').eq('is_tecnico', true).neq('ativo', false).order('nome'),
    ]);
    setTickets(tkR.data || []);
    setTecnicos(tecR.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = tickets.filter(t => {
    if (filterEstado && t.estado !== filterEstado) return false;
    if (filterTecnico && t.tecnico_id !== filterTecnico) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [t.nome_empresa, t.nome_pessoa, t.descricao_problema, t.cliente?.nome].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const getTicketsVal = useCallback((key, row) => {
    if (key === 'empresa')    return row.nome_empresa || row.cliente?.nome || '';
    if (key === 'tecnico')    return row.tecnico?.nome || '';
    if (key === 'estado')     return row.estado || '';
    if (key === 'id')         return row.id;
    if (key === 'created_at') return row.created_at || '';
    return row[key] ?? '';
  }, []);

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filtered, getTicketsVal);

  const submCount = tickets.filter(t => t.estado === 'submetido').length;

  if (detalhe) {
    return (
      <TicketDetalhe
        ticket={detalhe}
        onBack={() => { setDetalhe(null); load(); }}
        currentUserId={currentUserId}
        onUpdated={load}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Tickets"
        subtitle={
          <span>
            {tickets.length} tickets
            {submCount > 0 && (
              <span style={{ marginLeft: 10, background: '#e8a83a22', color: '#e8a83a', border: '1px solid #e8a83a44', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                {submCount} a aguardar triagem
              </span>
            )}
          </span>
        }
        action={<Btn icon="plus" onClick={() => setModal(true)}>Novo Ticket</Btn>}
      />

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {/* Filters */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.grey100}`, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar empresa, pessoa ou descrição..."
            style={{ flex: 1, minWidth: 200, maxWidth: 320, border: `1.5px solid ${C.grey200}`, borderRadius: 8, padding: '7px 12px', fontSize: 13, outline: 'none', background: C.white, color: C.grey800, fontFamily: 'inherit' }}
          />
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
            style={{ border: `1.5px solid ${C.grey200}`, borderRadius: 8, padding: '7px 12px', fontSize: 13, outline: 'none', background: C.white, color: C.grey800, cursor: 'pointer', fontFamily: 'inherit' }}>
            <option value="">Todos os estados</option>
            {ESTADOS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
          <select value={filterTecnico} onChange={e => setFilterTecnico(e.target.value)}
            style={{ border: `1.5px solid ${C.grey200}`, borderRadius: 8, padding: '7px 12px', fontSize: 13, outline: 'none', background: C.white, color: C.grey800, cursor: 'pointer', fontFamily: 'inherit' }}>
            <option value="">Todos os técnicos</option>
            {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>

        {loading ? <Loading/> : (
          <div style={{ overflowX: 'auto' }}>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.grey100}` }}>
                  {/* indicator dot — not sortable */}
                  <th style={{ padding: '12px 16px', width: 20, background: C.white }}/>
                  {[
                    { label: '#ID',            sk: 'id' },
                    { label: 'Empresa / Pessoa', sk: 'empresa' },
                    { label: 'Equipamento',    sk: null },
                    { label: 'Técnico',        sk: 'tecnico' },
                    { label: 'Criado em',      sk: 'created_at' },
                    { label: 'Estado',         sk: 'estado' },
                  ].map(({ label, sk }) => {
                    const isActive = sk && sortKey === sk;
                    return (
                      <th key={label}
                        onClick={sk ? () => toggleSort(sk) : undefined}
                        style={{
                          padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap',
                          color: isActive ? C.teal : C.grey400,
                          background: C.white,
                          cursor: sk ? 'pointer' : 'default',
                          userSelect: 'none',
                          transition: 'color .15s',
                        }}
                        onMouseEnter={sk ? e => { e.currentTarget.style.background = C.grey50; } : undefined}
                        onMouseLeave={sk ? e => { e.currentTarget.style.background = C.white; } : undefined}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {label}
                          {sk && (
                            <span style={{ display:'inline-flex', flexDirection:'column', gap:1.5, flexShrink:0, lineHeight:1 }}>
                              <svg width="7" height="4" viewBox="0 0 7 4" fill="none">
                                <path d="M3.5 0L7 4H0L3.5 0Z" fill={isActive && sortDir === 'asc' ? C.teal : C.grey200}/>
                              </svg>
                              <svg width="7" height="4" viewBox="0 0 7 4" fill="none">
                                <path d="M3.5 4L0 0H7L3.5 4Z" fill={isActive && sortDir === 'desc' ? C.teal : C.grey200}/>
                              </svg>
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                  {/* actions column */}
                  <th style={{ padding: '12px 16px', background: C.white }}/>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '32px 16px', textAlign: 'center', color: C.grey400, fontSize: 13 }}>
                    {tickets.length === 0 ? 'Sem tickets. Crie o primeiro ticket ou aguarde submissões pelo formulário público.' : 'Nenhum ticket corresponde aos filtros.'}
                  </td></tr>
                )}
                {sorted.map(t => {
                  const isSubmetido = t.estado === 'submetido';
                  const rowBg = isSubmetido ? '#e8a83a08' : 'transparent';
                  return (
                    <tr key={t.id}
                      style={{ borderBottom: `1px solid ${C.grey100}`, background: rowBg, transition: 'background .1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = isSubmetido ? '#e8a83a18' : C.grey50}
                      onMouseLeave={e => e.currentTarget.style.background = rowBg}>
                      {/* Indicator dot */}
                      <td style={{ padding: '0 4px 0 12px', width: 20 }}>
                        {isSubmetido && (
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e8a83a', boxShadow: '0 0 6px #e8a83a', animation: 'pulse 2s infinite', flexShrink: 0 }}/>
                        )}
                      </td>
                      {/* ID */}
                      <td style={{ padding: '13px 16px', color: C.grey400, fontFamily: "'DM Mono', monospace", fontSize: 13, whiteSpace: 'nowrap' }}>
                        #{String(t.id).padStart(4, '0')}
                      </td>
                      {/* Empresa / Pessoa */}
                      <td style={{ padding: '13px 16px', color: C.grey800 }}>
                        <div style={{ fontWeight: 500 }}>{t.nome_empresa || t.cliente?.nome || '—'}</div>
                        {t.nome_pessoa && <div style={{ fontSize: 12, color: C.grey400, marginTop: 2 }}>{t.nome_pessoa}</div>}
                      </td>
                      {/* Equipamento */}
                      <td style={{ padding: '13px 16px', color: C.grey600, fontSize: 13 }}>
                        {t.equipamento ? (
                          <div>
                            <div>{t.equipamento.descricao}</div>
                            {t.equipamento.num_serie && <div style={{ fontSize: 11, color: C.grey400, fontFamily: "'DM Mono', monospace" }}>S/N {t.equipamento.num_serie}</div>}
                          </div>
                        ) : '—'}
                      </td>
                      {/* Técnico */}
                      <td style={{ padding: '13px 16px', fontSize: 13 }}>
                        {t.tecnico?.nome
                          ? <span style={{ color: C.grey800 }}>{t.tecnico.nome}</span>
                          : <span style={{ color: C.amber, fontSize: 12 }}>Sem técnico</span>
                        }
                      </td>
                      {/* Criado em */}
                      <td style={{ padding: '13px 16px', color: C.grey400, fontSize: 12, whiteSpace: 'nowrap' }}>
                        {fmtDate(t.created_at?.split('T')[0])}
                      </td>
                      {/* Estado */}
                      <td style={{ padding: '13px 16px' }}>
                        <Badge color={estadoCor(t.estado)}>{estadoLabel(t.estado)}</Badge>
                      </td>
                      {/* Ação */}
                      <td style={{ padding: '8px 16px' }}>
                        <Btn variant="ghost" size="sm" icon="eye" onClick={() => setDetalhe(t)}/>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal && (
        <TicketNovoModal
          onClose={() => setModal(false)}
          onCreated={() => { setModal(false); load(); }}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};
