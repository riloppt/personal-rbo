import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../theme';
import { sb } from '../lib/supabase';
import { useSortable } from '../hooks/useSortable';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Icon } from '../components/ui/Icon';
import { Loading } from '../components/ui/Loading';
import { Table } from '../components/ui/Table';
import { fmtDate } from '../utils/formatters';

// Lista global de assistências (todos os contratos), mais recentes primeiro.
export const Assistencias = ({ navigate }) => {
  const C = useTheme();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // ponytail: carrega tudo de uma vez; paginar com .range() se o volume crescer
      const [movRes, conRes] = await Promise.all([
        sb.from("rbo_movimentos")
          .select("id,data,hora_inicio,creditos,descritivo,contrato_id,tecnico:rbo_tecnicos!tecnico_id(id,nome)")
          .eq("tipo", "assistencia")
          .order("data", { ascending: false })
          .order("hora_inicio", { ascending: false, nullsFirst: false }),
        sb.from("rbo_contratos").select("id,cliente:rbo_clientes(id,nome)"),
      ]);
      const cons = conRes.data || [];
      setRows((movRes.data || []).map(m => ({
        ...m,
        clienteNome: cons.find(c => c.id === m.contrato_id)?.cliente?.nome,
        tecnicoNome: m.tecnico?.nome,
      })));
      setLoading(false);
    })();
  }, []);

  const getVal = useCallback((key, row) => row[key] ?? '', []);
  const { sorted, sortKey, sortDir, toggleSort } = useSortable(rows, getVal);

  const abrirContrato = r => navigate("contratos", { contratoId: r.contrato_id });

  return (
    <div>
      <button onClick={() => navigate("dashboard")} style={{ background: "none", border: "none", cursor: "pointer", color: C.teal, fontSize: 14, padding: 0, marginBottom: 20 }}>← Voltar ao dashboard</button>
      <PageHeader title="Assistências" subtitle={`${rows.length} assistências em todos os contratos`}/>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <Loading/> : <Table
          cols={[
            { key: "data",        label: "Data",       sortable: true, render: v => fmtDate(v) },
            { key: "clienteNome", label: "Cliente",    sortable: true, render: v => <span style={{ fontWeight: 500, color: C.grey800 }}>{v || "—"}</span> },
            { key: "tecnicoNome", label: "Técnico",    sortable: true, render: v => v || <span style={{ color: C.grey400 }}>—</span> },
            { key: "creditos",    label: "Créditos",   sortable: true, render: v => <Badge color={v < 0 ? C.red : C.green}>{v > 0 ? "+" : ""}{v} cr</Badge> },
            { key: "descritivo",  label: "Descritivo", render: v => <span style={{ color: C.grey600, fontSize: 13 }}>{v}</span> },
          ]}
          data={sorted}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
          onView={abrirContrato}
          emptyMsg="Sem assistências registadas"
          mobileCard={r => (
            <div onClick={() => abrirContrato(r)}
              style={{ padding: "14px 20px", borderBottom: `1px solid ${C.grey100}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.grey800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{r.clienteNome || "—"}</div>
                <div style={{ fontSize: 12, color: C.grey500 }}>{r.tecnicoNome || "—"} · {fmtDate(r.data)}</div>
              </div>
              <Badge color={r.creditos < 0 ? C.red : C.green}>{r.creditos > 0 ? "+" : ""}{r.creditos} cr</Badge>
              <Icon name="chevronR" size={16} color={C.grey300}/>
            </div>
          )}
        />}
      </Card>
    </div>
  );
};
