import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';

export const PermissoesPanel = () => {
  const C = useTheme();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from('rbo_permissions').select('*').order('label');
    setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (row, campo) => {
    setRows(rs => rs.map(r => r.id === row.id ? { ...r, [campo]: !r[campo] } : r));
    await sb.from('rbo_permissions').update({ [campo]: !row[campo] }).eq('id', row.id);
  };

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {loading ? <Loading/> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.grey100}` }}>
                {['Permissão', 'Supervisores', 'Utilizadores normais'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', background: C.white, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={3} style={{ padding: '32px 16px', textAlign: 'center', color: C.grey400, fontSize: 13 }}>Sem permissões definidas</td></tr>
              )}
              {rows.map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.grey100}` }}>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ color: C.grey800, fontWeight: 500 }}>{r.label}</div>
                    {r.descricao && <div style={{ color: C.grey400, fontSize: 12, marginTop: 2 }}>{r.descricao}</div>}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <input type="checkbox" checked={!!r.ativo_supervisor} onChange={() => toggle(r, 'ativo_supervisor')}
                      style={{ width: 16, height: 16, accentColor: C.teal, cursor: 'pointer' }}/>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <input type="checkbox" checked={!!r.ativo_normal} onChange={() => toggle(r, 'ativo_normal')}
                      style={{ width: 16, height: 16, accentColor: C.teal, cursor: 'pointer' }}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
