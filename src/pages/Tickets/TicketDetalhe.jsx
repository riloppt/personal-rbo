import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Loading } from '../../components/ui/Loading';
import { fmtDate, fmtDateTime } from '../../utils/formatters';
import { estadoLabel, estadoCor, TRANSICOES } from './helpers';

// ── Module-level section card (stable component type, avoids remount issues) ──
const SectionCard = ({ title, sectionKey, editSection, saving, onEdit, onCancel, onSave, noEdit, children }) => {
  const C = useTheme();
  const isEditing = editSection === sectionKey;
  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.grey100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px' }}>{title}</span>
        {!noEdit && !isEditing && !editSection && (
          <Btn variant="ghost" size="sm" icon="edit" onClick={() => onEdit(sectionKey)}/>
        )}
        {isEditing && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm" onClick={onCancel}>Cancelar</Btn>
            <Btn size="sm" onClick={onSave} disabled={saving}>{saving ? 'A guardar...' : 'Guardar'}</Btn>
          </div>
        )}
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </Card>
  );
};

const FieldView = ({ label, value }) => {
  const C = useTheme();
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: C.grey800 }}>{value || '—'}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

export const TicketDetalhe = ({ ticket: initialTicket, onBack, currentUserId, onUpdated }) => {
  const C = useTheme();

  const [ticket,     setTicket]     = useState(initialTicket);
  const [historico,  setHistorico]  = useState([]);
  const [tecnicos,   setTecnicos]   = useState([]);
  const [clientes,   setClientes]   = useState([]);
  const [tiposEquip, setTiposEquip] = useState([]);
  const [tipologias, setTipologias] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);

  const [editSection,   setEditSection]   = useState(null);
  const [contactForm,   setContactForm]   = useState({});
  const [assocForm,     setAssocForm]     = useState({});
  const [descForm,      setDescForm]      = useState({});
  const [tempoForm,     setTempoForm]     = useState({});
  const [clienteSearch, setClienteSearch] = useState('');

  const [assocEquipamentos, setAssocEquipamentos] = useState([]);
  const [assocContratos,    setAssocContratos]    = useState([]);
  const [assocMovStats,     setAssocMovStats]     = useState({});

  const [showCriarCliente,  setShowCriarCliente]  = useState(false);
  const [showCriarEquip,    setShowCriarEquip]    = useState(false);
  const [novoClienteForm,   setNovoClienteForm]   = useState({ nome: '', nif: '', email: '', telefone: '', consumidor_final: false });
  const [novoEquipForm,     setNovoEquipForm]     = useState({ descricao: '', tipo_id: '', num_serie: '', localizacao: '' });
  const [numSerieError,     setNumSerieError]     = useState('');

  const [novoEstado,        setNovoEstado]        = useState('');
  const [notaEstado,        setNotaEstado]        = useState('');
  const [showModalConcluir, setShowModalConcluir] = useState(false);
  const [saldoContrato,     setSaldoContrato]     = useState(0);
  const [creditosDesconto,  setCreditosDesconto]  = useState(-1);
  const [pendingEstado,     setPendingEstado]     = useState('');
  const [pendingNota,       setPendingNota]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [tkR, histR, tecR, cliR, tipEqR, tipR] = await Promise.all([
      sb.from('rbo_tickets')
        .select('*,cliente:cliente_id(id,nome,email,telefone),tecnico:profile_tecnico_id(id,nome),equipamento:equipamento_id(id,descricao,num_serie),contrato:contrato_id(id,tipologia_id)')
        .eq('id', initialTicket.id).single(),
      sb.from('rbo_ticket_historico')
        .select('*,alterado_por:alterado_por_id(nome)')
        .eq('ticket_id', initialTicket.id).order('created_at', { ascending: false }),
      sb.from('rbo_profiles').select('id,nome').eq('is_tecnico', true).order('nome'),
      sb.from('rbo_clientes').select('id,nome,nif').order('nome'),
      sb.from('rbo_equipment_types').select('id,nome').order('nome'),
      sb.from('rbo_tipologias').select('id,nome').order('nome'),
    ]);
    if (tkR.data) setTicket(tkR.data);
    setHistorico(histR.data || []);
    setTecnicos(tecR.data || []);
    setClientes(cliR.data || []);
    setTiposEquip(tipEqR.data || []);
    setTipologias(tipR.data || []);
    setLoading(false);
  }, [initialTicket.id]);

  useEffect(() => { load(); }, [load]);

  // Load assoc data when client changes in edit mode
  useEffect(() => {
    const cid = assocForm.cliente_id;
    if (editSection !== 'associacoes' || !cid) {
      setAssocEquipamentos([]);
      setAssocContratos([]);
      return;
    }
    (async () => {
      const [eqR, conR] = await Promise.all([
        sb.from('rbo_client_equipment').select('id,descricao,num_serie').eq('cliente_id', cid).eq('ativo', true).order('descricao'),
        sb.from('rbo_contratos').select('id,tipologia_id').eq('cliente_id', cid).eq('ativo', true).order('id', { ascending: false }),
      ]);
      setAssocEquipamentos(eqR.data || []);
      const cons = conR.data || [];
      setAssocContratos(cons);
      if (cons.length > 0) {
        const ids = cons.map(c => c.id);
        const movR = await sb.from('rbo_movimentos').select('contrato_id,creditos').in('contrato_id', ids);
        const stats = {};
        (movR.data || []).forEach(m => { stats[m.contrato_id] = (stats[m.contrato_id] || 0) + m.creditos; });
        setAssocMovStats(stats);
      }
    })();
  }, [editSection, assocForm.cliente_id]);

  const enterEdit = section => {
    setEditSection(section);
    if (section === 'contactos') {
      setContactForm({ nome_empresa: ticket.nome_empresa || '', nome_pessoa: ticket.nome_pessoa || '', email_cliente: ticket.email_cliente || '', telefone_cliente: ticket.telefone_cliente || '' });
    } else if (section === 'associacoes') {
      const cid = ticket.cliente_id ? String(ticket.cliente_id) : '';
      setAssocForm({ cliente_id: cid, equipamento_id: ticket.equipamento_id ? String(ticket.equipamento_id) : '', contrato_id: ticket.contrato_id ? String(ticket.contrato_id) : '', profile_tecnico_id: ticket.profile_tecnico_id || '' });
      setClienteSearch(ticket.cliente?.nome || '');
    } else if (section === 'descricao') {
      setDescForm({ descricao_problema: ticket.descricao_problema || '', notas_internas: ticket.notas_internas || '' });
    } else if (section === 'tempo') {
      setTempoForm({ data_inicio: ticket.data_inicio || '', hora_inicio: ticket.hora_inicio || '', data_fim: ticket.data_fim || '', hora_fim: ticket.hora_fim || '', duracao_minutos: ticket.duracao_minutos != null ? String(ticket.duracao_minutos) : '' });
    }
  };

  const cancelEdit = () => { setEditSection(null); setNumSerieError(''); };

  const saveContact = async () => {
    setSaving(true);
    await sb.from('rbo_tickets').update({ nome_empresa: contactForm.nome_empresa || null, nome_pessoa: contactForm.nome_pessoa || null, email_cliente: contactForm.email_cliente || null, telefone_cliente: contactForm.telefone_cliente || null }).eq('id', ticket.id);
    await load(); setEditSection(null); setSaving(false);
  };

  const saveAssoc = async () => {
    setSaving(true);
    await sb.from('rbo_tickets').update({ cliente_id: assocForm.cliente_id ? Number(assocForm.cliente_id) : null, equipamento_id: assocForm.equipamento_id ? Number(assocForm.equipamento_id) : null, contrato_id: assocForm.contrato_id ? Number(assocForm.contrato_id) : null, profile_tecnico_id: assocForm.profile_tecnico_id || null }).eq('id', ticket.id);
    await load(); setEditSection(null); setSaving(false);
    onUpdated?.();
  };

  const saveDesc = async () => {
    setSaving(true);
    await sb.from('rbo_tickets').update({ descricao_problema: descForm.descricao_problema || null, notas_internas: descForm.notas_internas || null }).eq('id', ticket.id);
    await load(); setEditSection(null); setSaving(false);
  };

  const saveTempo = async () => {
    setSaving(true);
    await sb.from('rbo_tickets').update({ data_inicio: tempoForm.data_inicio || null, hora_inicio: tempoForm.hora_inicio || null, data_fim: tempoForm.data_fim || null, hora_fim: tempoForm.hora_fim || null, duracao_minutos: tempoForm.duracao_minutos ? Number(tempoForm.duracao_minutos) : null }).eq('id', ticket.id);
    await load(); setEditSection(null); setSaving(false);
  };

  const alterarEstado = async () => {
    if (!novoEstado) return;
    setSaving(true);
    if (novoEstado === 'concluido' && ticket.contrato_id) {
      const movR = await sb.from('rbo_movimentos').select('creditos').eq('contrato_id', ticket.contrato_id);
      const saldo = (movR.data || []).reduce((s, m) => s + m.creditos, 0);
      if (saldo > 0) {
        setSaldoContrato(saldo);
        setCreditosDesconto(-1);
        setPendingEstado(novoEstado);
        setPendingNota(notaEstado);
        setSaving(false);
        setShowModalConcluir(true);
        return;
      }
    }
    await doAlterarEstado(novoEstado, notaEstado, false, 0);
    setSaving(false);
  };

  const doAlterarEstado = async (estado, nota, descontar, creditos) => {
    await sb.from('rbo_tickets').update({ estado }).eq('id', ticket.id);
    await sb.from('rbo_ticket_historico').insert([{ ticket_id: ticket.id, estado_anterior: ticket.estado, estado_novo: estado, alterado_por_id: currentUserId || null, nota: nota || null }]);
    if (descontar && ticket.contrato_id) {
      const { data: mov } = await sb.from('rbo_movimentos').insert([{
        contrato_id: ticket.contrato_id,
        data: ticket.data_fim || new Date().toISOString().split('T')[0],
        hora_inicio: ticket.hora_inicio || null, hora_fim: ticket.hora_fim || null,
        creditos: Number(creditos),
        descritivo: `Ticket #${String(ticket.id).padStart(3, '0')} — ${(ticket.descricao_problema || '').slice(0, 150)}`,
        profile_tecnico_id: ticket.profile_tecnico_id || null,
        tipo: 'assistencia',
      }]).select().single();
      if (mov) await sb.from('rbo_tickets').update({ movimento_id: mov.id }).eq('id', ticket.id);
    }
    await load();
    setNovoEstado(''); setNotaEstado('');
    setShowModalConcluir(false);
    onUpdated?.();
  };

  const criarClienteAssoc = async () => {
    if (!novoClienteForm.nome.trim()) return;
    setSaving(true);
    const { data: cli } = await sb.from('rbo_clientes').insert([{ nome: novoClienteForm.nome.trim(), nif: novoClienteForm.nif || null, email: novoClienteForm.email || null, telefone: novoClienteForm.telefone || null, consumidor_final: novoClienteForm.consumidor_final }]).select().single();
    if (cli) {
      setClientes(prev => [...prev, cli].sort((a, b) => a.nome.localeCompare(b.nome)));
      setAssocForm(f => ({ ...f, cliente_id: String(cli.id), equipamento_id: '', contrato_id: '' }));
      setClienteSearch(cli.nome);
    }
    setNovoClienteForm({ nome: '', nif: '', email: '', telefone: '', consumidor_final: false });
    setShowCriarCliente(false); setSaving(false);
  };

  const criarEquipAssoc = async () => {
    if (!novoEquipForm.descricao.trim()) return;
    if (novoEquipForm.num_serie) {
      const { data } = await sb.from('rbo_client_equipment').select('id,cliente_id').eq('num_serie', novoEquipForm.num_serie);
      const conflict = (data || []).find(e => String(e.cliente_id) !== String(assocForm.cliente_id));
      if (conflict) { setNumSerieError('Este número de série já está associado a outro cliente.'); return; }
    }
    setSaving(true);
    const { data: eq } = await sb.from('rbo_client_equipment').insert([{ cliente_id: Number(assocForm.cliente_id), descricao: novoEquipForm.descricao.trim(), tipo_id: novoEquipForm.tipo_id ? Number(novoEquipForm.tipo_id) : null, num_serie: novoEquipForm.num_serie || null, localizacao: novoEquipForm.localizacao || null, ativo: true }]).select().single();
    if (eq) { setAssocEquipamentos(prev => [...prev, eq]); setAssocForm(f => ({ ...f, equipamento_id: String(eq.id) })); }
    setNovoEquipForm({ descricao: '', tipo_id: '', num_serie: '', localizacao: '' });
    setNumSerieError(''); setShowCriarEquip(false); setSaving(false);
  };

  if (loading) return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.teal, fontSize: 14, marginBottom: 20 }}>← Voltar</button>
      <Loading/>
    </div>
  );

  const tid = `#${String(ticket.id).padStart(3, '0')}`;
  const transicoes = TRANSICOES[ticket.estado] || [];
  const tempoEditavel = ['em_curso', 'aguarda_cliente', 'concluido'].includes(ticket.estado);
  const showTempoSection = tempoEditavel || ticket.data_inicio || ticket.data_fim;

  const clientesFiltrados = clientes.filter(c => {
    const q = clienteSearch.toLowerCase();
    return !q || c.nome.toLowerCase().includes(q) || (c.nif || '').replace(/\s/g, '').includes(q.replace(/\s/g, ''));
  }).slice(0, 8);

  const tipNome = id => tipologias.find(t => t.id === id)?.nome;

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.teal, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 16 }}>
        ← Voltar aos tickets
      </button>

      {/* ── Secção 1 — Cabeçalho ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: C.grey800, fontFamily: "'DM Mono', monospace" }}>{tid}</span>
            <Badge color={estadoCor(ticket.estado)}>{estadoLabel(ticket.estado)}</Badge>
            <Badge color={C.grey400}>{ticket.tipo === 'publico' ? 'Público' : 'Manual'}</Badge>
            {ticket.movimento_id && <Badge color={C.green}>Crédito descontado</Badge>}
          </div>
          <div style={{ fontSize: 14, color: C.grey600 }}>
            {ticket.nome_empresa && <span style={{ fontWeight: 500 }}>{ticket.nome_empresa}</span>}
            {ticket.nome_empresa && ticket.nome_pessoa && <span style={{ color: C.grey400 }}> · </span>}
            {ticket.nome_pessoa && <span>{ticket.nome_pessoa}</span>}
          </div>
        </div>
        <div style={{ fontSize: 12, color: C.grey400 }}>Criado: {fmtDateTime(ticket.created_at)}</div>
      </div>

      {/* ── Secção 2 — Dados de contacto ── */}
      <SectionCard title="Dados de Contacto" sectionKey="contactos" editSection={editSection} saving={saving} onEdit={enterEdit} onCancel={cancelEdit} onSave={saveContact}>
        {editSection === 'contactos' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Nome da Empresa"    value={contactForm.nome_empresa}      onChange={v => setContactForm(f => ({ ...f, nome_empresa: v }))}/>
            <Input label="Pessoa de Contacto" value={contactForm.nome_pessoa}       onChange={v => setContactForm(f => ({ ...f, nome_pessoa: v }))}/>
            <Input label="Email"              value={contactForm.email_cliente}     onChange={v => setContactForm(f => ({ ...f, email_cliente: v }))} type="email"/>
            <Input label="Telefone"           value={contactForm.telefone_cliente}  onChange={v => setContactForm(f => ({ ...f, telefone_cliente: v }))}/>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <FieldView label="Empresa"  value={ticket.nome_empresa}/>
            <FieldView label="Contacto" value={ticket.nome_pessoa}/>
            <FieldView label="Email"    value={ticket.email_cliente}/>
            <FieldView label="Telefone" value={ticket.telefone_cliente}/>
          </div>
        )}
      </SectionCard>

      {/* ── Secção 3 — Associações ── */}
      <SectionCard title="Associações" sectionKey="associacoes" editSection={editSection} saving={saving} onEdit={enterEdit} onCancel={cancelEdit} onSave={saveAssoc}>
        {editSection === 'associacoes' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Client search */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: C.grey600, display: 'block', marginBottom: 5 }}>Cliente</label>
              <input value={clienteSearch}
                onChange={e => {
                  setClienteSearch(e.target.value);
                  if (assocForm.cliente_id) {
                    const cur = clientes.find(c => c.id === Number(assocForm.cliente_id));
                    if (e.target.value !== cur?.nome) setAssocForm(f => ({ ...f, cliente_id: '', equipamento_id: '', contrato_id: '' }));
                  }
                }}
                placeholder="Pesquisar por nome ou NIF..."
                style={{ border: `1.5px solid ${C.grey200}`, borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', background: C.white, color: C.grey800, width: '100%', height: 38, fontFamily: 'inherit' }}
              />
              {clienteSearch && !assocForm.cliente_id && clientesFiltrados.length > 0 && (
                <div style={{ border: `1px solid ${C.grey100}`, borderRadius: 8, marginTop: 4, overflow: 'hidden', boxShadow: '0 4px 16px #00000010' }}>
                  {clientesFiltrados.map(c => (
                    <div key={c.id}
                      onClick={() => { setAssocForm(f => ({ ...f, cliente_id: String(c.id), equipamento_id: '', contrato_id: '' })); setClienteSearch(c.nome); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${C.grey100}`, background: C.white, fontSize: 14, color: C.grey800 }}
                      onMouseEnter={e => e.currentTarget.style.background = C.grey50}
                      onMouseLeave={e => e.currentTarget.style.background = C.white}>
                      <span style={{ fontWeight: 500 }}>{c.nome}</span>
                      {c.nif && <span style={{ color: C.grey400, marginLeft: 8, fontSize: 12 }}>NIF {c.nif}</span>}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {assocForm.cliente_id && <span style={{ fontSize: 12, color: C.teal }}>✓ Cliente selecionado</span>}
                <button onClick={() => setShowCriarCliente(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.teal, fontSize: 12, padding: 0, marginLeft: 'auto' }}>+ Criar cliente</button>
              </div>
            </div>

            {assocForm.cliente_id && (
              <>
                <div>
                  <Select label="Equipamento (opcional)" value={assocForm.equipamento_id} onChange={v => setAssocForm(f => ({ ...f, equipamento_id: v }))}
                    options={assocEquipamentos.map(e => ({ value: String(e.id), label: `${e.descricao}${e.num_serie ? ' — S/N ' + e.num_serie : ''}` }))}/>
                  <button onClick={() => { setNovoEquipForm({ descricao: '', tipo_id: '', num_serie: '', localizacao: '' }); setNumSerieError(''); setShowCriarEquip(true); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.teal, fontSize: 12, padding: '4px 0' }}>
                    + Novo equipamento
                  </button>
                </div>
                {assocContratos.length > 0 && (
                  <Select label="Contrato (opcional)" value={assocForm.contrato_id} onChange={v => setAssocForm(f => ({ ...f, contrato_id: v }))}
                    options={assocContratos.map(c => ({ value: String(c.id), label: `${tipNome(c.tipologia_id) || 'Contrato #' + c.id} — ${assocMovStats[c.id] ?? 0} créditos` }))}/>
                )}
              </>
            )}

            <Select label="Técnico (opcional)" value={assocForm.profile_tecnico_id} onChange={v => setAssocForm(f => ({ ...f, profile_tecnico_id: v }))}
              options={tecnicos.map(t => ({ value: t.id, label: t.nome }))}/>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <FieldView label="Cliente"     value={ticket.cliente?.nome}/>
            <FieldView label="Equipamento" value={ticket.equipamento ? `${ticket.equipamento.descricao}${ticket.equipamento.num_serie ? ' · ' + ticket.equipamento.num_serie : ''}` : null}/>
            <FieldView label="Contrato"    value={ticket.contrato ? tipNome(ticket.contrato.tipologia_id) || `Contrato #${ticket.contrato_id}` : null}/>
            <FieldView label="Técnico"     value={ticket.tecnico?.nome}/>
          </div>
        )}
      </SectionCard>

      {/* ── Secção 4 — Descrição e notas ── */}
      <SectionCard title="Descrição e Notas" sectionKey="descricao" editSection={editSection} saving={saving} onEdit={enterEdit} onCancel={cancelEdit} onSave={saveDesc}>
        {editSection === 'descricao' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Descrição do Problema" value={descForm.descricao_problema} onChange={v => setDescForm(f => ({ ...f, descricao_problema: v }))} textarea rows={4}/>
            <div>
              <Input label="Notas Internas" value={descForm.notas_internas} onChange={v => setDescForm(f => ({ ...f, notas_internas: v }))} textarea rows={3}/>
              <div style={{ fontSize: 11, color: C.grey400, marginTop: 4 }}>Não visível para o cliente</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Problema</div>
              <div style={{ fontSize: 14, color: C.grey800, lineHeight: 1.6 }}>{ticket.descricao_problema || '—'}</div>
            </div>
            {ticket.notas_internas && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.amber, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Notas Internas · interno</div>
                <div style={{ fontSize: 14, color: C.grey800, lineHeight: 1.6 }}>{ticket.notas_internas}</div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── Secção 5 — Tempo de trabalho ── */}
      {showTempoSection && (
        <SectionCard title="Tempo de Trabalho" sectionKey="tempo" editSection={editSection} saving={saving} onEdit={enterEdit} onCancel={cancelEdit} onSave={saveTempo} noEdit={!tempoEditavel}>
          {editSection === 'tempo' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="Data Início"       value={tempoForm.data_inicio}      onChange={v => setTempoForm(f => ({ ...f, data_inicio: v }))}      type="date"/>
              <Input label="Hora Início"       value={tempoForm.hora_inicio}      onChange={v => setTempoForm(f => ({ ...f, hora_inicio: v }))}      type="time"/>
              <Input label="Data Fim"          value={tempoForm.data_fim}         onChange={v => setTempoForm(f => ({ ...f, data_fim: v }))}         type="date"/>
              <Input label="Hora Fim"          value={tempoForm.hora_fim}         onChange={v => setTempoForm(f => ({ ...f, hora_fim: v }))}         type="time"/>
              <div style={{ gridColumn: '1/-1' }}>
                <Input label="Duração (minutos)" value={tempoForm.duracao_minutos} onChange={v => setTempoForm(f => ({ ...f, duracao_minutos: v }))} type="number"/>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
              <FieldView label="Data Início"   value={fmtDate(ticket.data_inicio)}/>
              <FieldView label="Hora Início"   value={ticket.hora_inicio}/>
              <FieldView label="Data Fim"      value={fmtDate(ticket.data_fim)}/>
              <FieldView label="Hora Fim"      value={ticket.hora_fim}/>
              <FieldView label="Duração (min)" value={ticket.duracao_minutos != null ? String(ticket.duracao_minutos) : null}/>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Secção 6 — Mudança de estado ── */}
      {transicoes.length > 0 && !editSection && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.grey100}` }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px' }}>Alterar Estado</span>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Select label="Novo estado" value={novoEstado} onChange={setNovoEstado}
              options={transicoes.map(id => ({ value: id, label: estadoLabel(id) }))}/>
            <Input label="Nota (opcional)" value={notaEstado} onChange={setNotaEstado} placeholder="Motivo da mudança de estado..."/>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn onClick={alterarEstado} disabled={saving || !novoEstado}>{saving ? 'A guardar...' : 'Alterar Estado'}</Btn>
            </div>
          </div>
        </Card>
      )}

      {/* ── Secção 7 — Histórico ── */}
      <Card>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.grey100}` }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px' }}>Histórico de Estados</span>
        </div>
        <div style={{ padding: '4px 0' }}>
          {historico.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: C.grey400, fontSize: 13 }}>Sem histórico.</div>
          ) : historico.map((h, i) => (
            <div key={h.id || i} style={{ padding: '12px 20px', borderBottom: i < historico.length - 1 ? `1px solid ${C.grey100}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                {h.estado_anterior && <><Badge color={estadoCor(h.estado_anterior)}>{estadoLabel(h.estado_anterior)}</Badge><span style={{ color: C.grey400, fontSize: 12 }}>→</span></>}
                <Badge color={estadoCor(h.estado_novo)}>{estadoLabel(h.estado_novo)}</Badge>
                <span style={{ color: C.grey400, fontSize: 12, marginLeft: 'auto' }}>{fmtDateTime(h.created_at)}</span>
              </div>
              {(h.alterado_por?.nome || h.nota) && (
                <div style={{ fontSize: 12, color: C.grey400 }}>
                  {h.alterado_por?.nome && <span>{h.alterado_por.nome}</span>}
                  {h.alterado_por?.nome && h.nota && <span> · </span>}
                  {h.nota && <span style={{ fontStyle: 'italic' }}>{h.nota}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* ── Modal: Criar Cliente ── */}
      {showCriarCliente && (
        <Modal title="Criar Cliente" onClose={() => setShowCriarCliente(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Nome" value={novoClienteForm.nome} onChange={v => setNovoClienteForm(f => ({ ...f, nome: v }))} required/>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="NIF (opcional)"      value={novoClienteForm.nif}      onChange={v => setNovoClienteForm(f => ({ ...f, nif: v }))}/>
              <Input label="Telefone (opcional)" value={novoClienteForm.telefone} onChange={v => setNovoClienteForm(f => ({ ...f, telefone: v }))}/>
            </div>
            <Input label="Email (opcional)" value={novoClienteForm.email} onChange={v => setNovoClienteForm(f => ({ ...f, email: v }))} type="email"/>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.grey600, cursor: 'pointer' }}>
              <input type="checkbox" checked={novoClienteForm.consumidor_final} onChange={e => setNovoClienteForm(f => ({ ...f, consumidor_final: e.target.checked }))}/>
              Consumidor final (particular)
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <Btn variant="secondary" onClick={() => setShowCriarCliente(false)}>Cancelar</Btn>
            <Btn onClick={criarClienteAssoc} disabled={saving || !novoClienteForm.nome.trim()}>{saving ? 'A criar...' : 'Criar Cliente'}</Btn>
          </div>
        </Modal>
      )}

      {/* ── Modal: Criar Equipamento ── */}
      {showCriarEquip && (
        <Modal title="Novo Equipamento" onClose={() => setShowCriarEquip(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Descrição" value={novoEquipForm.descricao} onChange={v => setNovoEquipForm(f => ({ ...f, descricao: v }))} required/>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select label="Tipo" value={novoEquipForm.tipo_id} onChange={v => setNovoEquipForm(f => ({ ...f, tipo_id: v }))} options={tiposEquip.map(t => ({ value: String(t.id), label: t.nome }))}/>
              <div>
                <Input label="Número de Série" value={novoEquipForm.num_serie} onChange={v => { setNovoEquipForm(f => ({ ...f, num_serie: v })); setNumSerieError(''); }}/>
                {numSerieError && <div style={{ fontSize: 12, color: C.red, marginTop: 3 }}>{numSerieError}</div>}
              </div>
            </div>
            <Input label="Localização (opcional)" value={novoEquipForm.localizacao} onChange={v => setNovoEquipForm(f => ({ ...f, localizacao: v }))}/>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <Btn variant="secondary" onClick={() => setShowCriarEquip(false)}>Cancelar</Btn>
            <Btn onClick={criarEquipAssoc} disabled={saving || !novoEquipForm.descricao.trim() || !!numSerieError}>{saving ? 'A criar...' : 'Criar Equipamento'}</Btn>
          </div>
        </Modal>
      )}

      {/* ── Modal: Confirmar desconto de créditos ── */}
      {showModalConcluir && (
        <Modal title="Descontar créditos do contrato?" onClose={() => setShowModalConcluir(false)}>
          <p style={{ fontSize: 14, color: C.grey600, lineHeight: 1.6, marginBottom: 16 }}>
            Este contrato tem <strong style={{ color: C.green }}>{saldoContrato} créditos</strong> disponíveis.
            Deseja descontar esta assistência no contrato?
          </p>
          <Input label="Créditos a registar (valor negativo)" value={String(creditosDesconto)} onChange={v => setCreditosDesconto(v)} type="number"/>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <Btn onClick={async () => { setSaving(true); await doAlterarEstado(pendingEstado, pendingNota, true, creditosDesconto); setSaving(false); }} disabled={saving}>
              {saving ? 'A guardar...' : 'Sim, descontar'}
            </Btn>
            <Btn variant="secondary" onClick={async () => { setSaving(true); await doAlterarEstado(pendingEstado, pendingNota, false, 0); setSaving(false); }} disabled={saving}>
              Não, registar sem desconto
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};
