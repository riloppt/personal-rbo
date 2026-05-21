import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { Icon } from '../../components/ui/Icon';
import { useSortable } from '../../hooks/useSortable';
import { EquipamentoDetalhe } from './EquipamentoDetalhe';

const getVal = (k, r) => {
  if (k === 'tipo')    return r.tipo?.nome    ?? '';
  if (k === 'cliente') return r.cliente?.nome ?? '';
  if (k === 'ativo')   return r.ativo === false ? 0 : 1;
  return r[k] ?? '';
};

export const Equipamentos = ({ navigate }) => {
  const C = useTheme();
  const [rows, setRows] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('ativo');
  const [detalhe, setDetalhe] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: eqData }, { data: tipoData }] = await Promise.all([
      sb.from('rbo_client_equipment')
        .select('id,descricao,num_serie,localizacao,ativo,tipo_id,cliente_id,tipo:rbo_equipment_types(id,nome),cliente:rbo_clientes(id,nome)')
        .order('descricao'),
      sb.from('rbo_equipment_types').select('id,nome').order('nome'),
    ]);
    setRows(eqData || []);
    setTipos(tipoData || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter(r => {
    if (filterEstado === 'ativo' && r.ativo === false) return false;
    if (filterEstado === 'inativo' && r.ativo !== false) return false;
    if (filterTipo && String(r.tipo_id) !== filterTipo) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        (r.descricao || '').toLowerCase().includes(q) ||
        (r.num_serie || '').toLowerCase().includes(q) ||
        (r.cliente?.nome || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filtered, getVal);

  if (detalhe) return (
    <EquipamentoDetalhe
      equipamentoId={detalhe}
      onBack={() => setDetalhe(null)}
      navigate={navigate}
    />
  );

  const inputStyle = {
    border: `1.5px solid ${C.grey200}`,
    borderRadius: 8,
    padding: '7px 12px',
    fontSize: 13,
    outline: 'none',
    background: C.white,
    color: C.grey800,
    fontFamily: "'DM Sans',sans-serif",
  };

  return (
    <div>
      <PageHeader title="Equipamentos" subtitle={`${filtered.length} equipamento${filtered.length !== 1 ? 's' : ''}`} />

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.grey100}`, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por descrição, nº série ou cliente..."
            style={{ ...inputStyle, flex: '1 1 200px', minWidth: 180 }}
          />
          <select
            value={filterTipo}
            onChange={e => setFilterTipo(e.target.value)}
            style={{ ...inputStyle, minWidth: 150 }}
          >
            <option value="">Todos os tipos</option>
            {tipos.map(t => (
              <option key={t.id} value={String(t.id)}>{t.nome}</option>
            ))}
          </select>
          <select
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
            style={{ ...inputStyle, minWidth: 120 }}
          >
            <option value="todos">Todos os estados</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>
        {loading ? <Loading /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.grey100}` }}>
                  {[
                    { label: 'Descrição',   sk: 'descricao'  },
                    { label: 'Nº Série',    sk: 'num_serie'  },
                    { label: 'Tipo',        sk: 'tipo'       },
                    { label: 'Cliente',     sk: 'cliente'    },
                    { label: 'Localização', sk: 'localizacao'},
                    { label: 'Estado',      sk: 'ativo'      },
                    { label: '',            sk: null         },
                  ].map(({ label, sk }) => {
                    const active = sk && sortKey === sk;
                    return (
                      <th key={label}
                        onClick={sk ? () => toggleSort(sk) : undefined}
                        style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: active ? C.teal : C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', background: C.white, whiteSpace: 'nowrap', cursor: sk ? 'pointer' : 'default', userSelect: 'none' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          {label}
                          {sk && (
                            <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 1.5, flexShrink: 0 }}>
                              <svg width="7" height="4" viewBox="0 0 7 4" fill="none"><path d="M3.5 0L7 4H0L3.5 0Z" fill={active && sortDir === 'asc' ? C.teal : C.grey200}/></svg>
                              <svg width="7" height="4" viewBox="0 0 7 4" fill="none"><path d="M3.5 4L0 0H7L3.5 4Z" fill={active && sortDir === 'desc' ? C.teal : C.grey200}/></svg>
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: C.grey400, fontSize: 13 }}>Sem equipamentos</td></tr>
                )}
                {sorted.map(r => (
                  <tr key={r.id}
                    style={{ borderBottom: `1px solid ${C.grey100}`, transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.grey50}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', color: C.grey800, fontWeight: 500 }}>{r.descricao || '—'}</td>
                    <td style={{ padding: '12px 16px', color: C.grey600, fontSize: 13 }}>{r.num_serie || '—'}</td>
                    <td style={{ padding: '12px 16px', color: C.grey600, fontSize: 13 }}>{r.tipo?.nome || '—'}</td>
                    <td style={{ padding: '12px 16px', color: C.grey600, fontSize: 13 }}>{r.cliente?.nome || '—'}</td>
                    <td style={{ padding: '12px 16px', color: C.grey600, fontSize: 13 }}>{r.localizacao || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge color={r.ativo === false ? C.grey400 : C.green}>{r.ativo === false ? 'Inativo' : 'Ativo'}</Badge>
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <button
                        onClick={() => setDetalhe(r.id)}
                        title="Ver detalhe"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = C.grey100}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <Icon name="eye" size={14} color={C.teal} />
                      </button>
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
