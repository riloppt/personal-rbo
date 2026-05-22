import React, { useState, useEffect } from 'react';
import { useTheme } from '../theme';
import { sb } from '../lib/supabase';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Icon } from '../components/ui/Icon';
import { fmtDate } from '../utils/formatters';
import { ESTADOS, estadoCor, estadoLabel } from './Tickets/helpers';

export const Dashboard = () => {
  const C = useTheme();
  const [stats,      setStats]      = useState({ clientes: 0, contratos: 0, creditos: 0, assistencias: 0 });
  const [recentes,   setRecentes]   = useState([]);
  const [tipStats,   setTipStats]   = useState([]);
  const [tickets,    setTickets]    = useState([]);
  const [contratos,  setContratos]  = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    (async () => {
      const [cliRes, conRes, movRes, tipRes, tkRes] = await Promise.all([
        sb.from("rbo_clientes").select("id", { count: "exact", head: true }).neq("ativo", false),
        sb.from("rbo_contratos").select("id,ativo,tipologia_id,cliente_id,notificacao_creditos_enviada_em,cliente:rbo_clientes(id,nome)"),
        sb.from("rbo_movimentos").select("id,creditos,tipo,data,contrato_id,profile_tecnico_id").order("data", { ascending: false }),
        sb.from("rbo_tipologias").select("id,nome"),
        sb.from("rbo_tickets").select("id,estado,created_at,tecnico_id").order("created_at", { ascending: false }),
      ]);

      const movs  = movRes.data || [];
      const cons  = conRes.data || [];
      const tips  = tipRes.data || [];
      const tks   = tkRes.data  || [];
      const assis = movs.filter(m => m.tipo === "assistencia");

      setStats({
        clientes:     cliRes.count || 0,
        contratos:    cons.filter(c => c.ativo).length,
        creditos:     movs.reduce((s, m) => s + m.creditos, 0),
        assistencias: assis.length,
      });
      setContratos(cons);
      setMovimentos(movs);
      setTickets(tks);
      setTipStats(tips.map(t => ({ ...t, count: cons.filter(c => c.tipologia_id === t.id).length })));

      const recentAssis = assis.slice(0, 5);
      if (recentAssis.length) {
        const { data: tecRec } = await sb.from("rbo_profiles").select("id,nome").eq("is_tecnico", true);
        setRecentes(recentAssis.map(m => {
          const con = cons.find(c => c.id === m.contrato_id);
          const tec = m.profile_tecnico_id ? (tecRec || []).find(t => t.id === m.profile_tecnico_id) : null;
          return { ...m, clienteNome: con?.cliente?.nome, tecnicoNome: tec?.nome };
        }));
      }

      setLoading(false);
    })();
  }, []);

  if (loading) return <><PageHeader title="Dashboard" subtitle="Visão geral" /><Loading /></>;

  const ticketsAbertos = tickets.filter(t => !['concluido', 'cancelado'].includes(t.estado)).length;
  const ticketsAtencao = tickets.filter(t => t.estado === 'submetido').length;

  const creditosBaixos = contratos
    .filter(c => c.ativo)
    .map(c => ({
      ...c,
      saldo: movimentos.filter(m => m.contrato_id === c.id).reduce((s, m) => s + m.creditos, 0),
    }))
    .filter(c => c.saldo <= 5)
    .sort((a, b) => a.saldo - b.saldo);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Visão geral do sistema RBO" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Clientes"         value={stats.clientes}     icon="clients"   color={C.teal} />
        <StatCard label="Contratos Ativos" value={stats.contratos}    icon="contracts" color={C.tealL} />
        <StatCard label="Créditos Totais"  value={stats.creditos}     icon="credit"    color={C.green} />
        <StatCard label="Assistências"     value={stats.assistencias} icon="wrench"    color={C.amber} />
        <StatCard label="Tickets Abertos"  value={ticketsAbertos}     icon="wrench"    color={C.teal} />
        <StatCard label="Requerem Atenção" value={ticketsAtencao}     icon="alert"     color={C.amber} />
      </div>

      <style>{`@media(max-width:700px){.db-grid{grid-template-columns:1fr!important}}`}</style>
      <div className="db-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>

        {/* Últimas Assistências */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.grey100}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: C.grey800, margin: 0 }}>Últimas Assistências</h3>
          </div>
          {recentes.length === 0 && (
            <div style={{ padding: 24, color: C.grey400, fontSize: 13, textAlign: "center" }}>Sem assistências registadas</div>
          )}
          {recentes.map(m => (
            <div key={m.id} style={{ padding: "12px 20px", borderBottom: `1px solid ${C.grey100}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.grey800 }}>{m.clienteNome || "—"}</div>
                <div style={{ fontSize: 12, color: C.grey400 }}>{m.tecnicoNome || "—"} · {fmtDate(m.data)}</div>
              </div>
              <Badge color={m.creditos < 0 ? C.red : C.green}>{m.creditos > 0 ? "+" : ""}{m.creditos} cr</Badge>
            </div>
          ))}
        </Card>

        {/* Tickets por Estado */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.grey100}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: C.grey800, margin: 0 }}>Tickets por Estado</h3>
          </div>
          <div style={{ padding: "4px 20px" }}>
            {tickets.length === 0 ? (
              <div style={{ padding: "20px 0", color: C.grey400, fontSize: 13, textAlign: "center" }}>Sem tickets registados</div>
            ) : (
              ESTADOS.map(e => {
                const count = tickets.filter(t => t.estado === e.id).length;
                if (count === 0) return null;
                return (
                  <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.grey100}` }}>
                    <Badge color={estadoCor(e.id)}>{estadoLabel(e.id)}</Badge>
                    <span style={{ fontWeight: 700, fontFamily: "'DM Mono',monospace", color: C.grey800 }}>{count}</span>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Contratos por Tipologia */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.grey100}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: C.grey800, margin: 0 }}>Contratos por Tipologia</h3>
          </div>
          <div style={{ padding: "12px 0" }}>
            {tipStats.length === 0 && (
              <div style={{ padding: 24, color: C.grey400, fontSize: 13, textAlign: "center" }}>Sem tipologias</div>
            )}
            {tipStats.map(t => (
              <div key={t.id} style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: C.grey800 }}>{t.nome}</span>
                <Badge>{t.count} contrato{t.count !== 1 ? "s" : ""}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Contratos com Créditos Baixos */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.grey100}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: C.grey800, margin: 0 }}>Contratos com Créditos Baixos</h3>
          </div>
          <div style={{ padding: "4px 20px" }}>
            {creditosBaixos.length === 0 ? (
              <div style={{ padding: "20px 0", fontSize: 13, textAlign: "center", color: C.green }}>
                Todos os contratos têm créditos suficientes
              </div>
            ) : (
              creditosBaixos.map(c => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.grey100}` }}>
                  <span style={{ fontSize: 14, color: C.grey800 }}>{c.cliente?.nome || "—"}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {c.notificacao_creditos_enviada_em ? (
                      <span title={`Notificado em ${fmtDate(c.notificacao_creditos_enviada_em.slice(0,10))}`} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.green, fontWeight: 600 }}>
                        <Icon name="mailDone" size={13} color={C.green}/>
                        {fmtDate(c.notificacao_creditos_enviada_em.slice(0,10))}
                      </span>
                    ) : (
                      <span title="Não notificado" style={{ display: "flex", alignItems: "center" }}>
                        <Icon name="mail" size={13} color={C.grey300}/>
                      </span>
                    )}
                    <Badge color={c.saldo <= 0 ? C.red : C.amber}>{c.saldo} cr</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};
