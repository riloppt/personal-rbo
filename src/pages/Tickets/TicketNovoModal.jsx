import React, { useState, useEffect } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Btn } from '../../components/ui/Btn';
import { Badge } from '../../components/ui/Badge';
import { maskNif, maskPhone, maskCP } from '../../utils/formatters';

export const TicketNovoModal = ({ onClose, onCreated, currentUserId }) => {
  const C = useTheme();
  const [step, setStep] = useState(1);

  // Data
  const [clientes,   setClientes]   = useState([]);
  const [tiposEquip, setTiposEquip] = useState([]);
  const [tipologias, setTipologias] = useState([]);
  const [tecnicos,   setTecnicos]   = useState([]);

  // Step 1 — Cliente
  const [clienteSearch,      setClienteSearch]      = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [showNovoCliente,    setShowNovoCliente]    = useState(false);
  const emptyNovoCliente = { nome: '', nif: '', morada: '', cp: '', localidade: '', email: '', telefone: '', telemovel: '', observacoes: '' };
  const [novoClienteForm,    setNovoClienteForm]    = useState(emptyNovoCliente);
  const [savingCliente,      setSavingCliente]      = useState(false);
  const [erroCliente,        setErroCliente]        = useState('');

  // Step 2 — Equipamento
  const [equipamentos,       setEquipamentos]       = useState([]);
  const [equipSeleccionado,  setEquipSeleccionado]  = useState(null); // null = nenhum, false = sem equip, object = selecionado
  const [showNovoEquip,      setShowNovoEquip]      = useState(false);
  const [novoEquipForm,      setNovoEquipForm]      = useState({ descricao: '', tipo_id: '', num_serie: '', localizacao: '' });
  const [numSerieError,      setNumSerieError]      = useState('');
  const [savingEquip,        setSavingEquip]        = useState(false);

  // Step 3 — Detalhes
  const [contratos,  setContratos]  = useState([]);
  const [movStats,   setMovStats]   = useState({});
  const [form3,      setForm3]      = useState({ contrato_id: '', profile_tecnico_id: '', descricao_problema: '', notas_internas: '' });

  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    Promise.all([
      sb.from('rbo_clientes').select('id,nome,nif').order('nome'),
      sb.from('rbo_equipment_types').select('id,nome').order('nome'),
      sb.from('rbo_tipologias').select('id,nome').order('nome'),
      sb.from('rbo_profiles').select('id,nome').eq('is_tecnico', true).eq('ativo', true).order('nome'),
    ]).then(([cliR, tipEqR, tipR, tecR]) => {
      setClientes(cliR.data || []);
      setTiposEquip(tipEqR.data || []);
      setTipologias(tipR.data || []);
      setTecnicos(tecR.data || []);
    });
  }, []);

  // Load equipamentos when cliente changes
  useEffect(() => {
    if (!clienteSeleccionado) { setEquipamentos([]); return; }
    sb.from('rbo_client_equipment').select('id,descricao,num_serie').eq('cliente_id', clienteSeleccionado.id).eq('ativo', true).order('descricao')
      .then(r => setEquipamentos(r.data || []));
  }, [clienteSeleccionado]);

  // Load contratos when reaching step 3
  useEffect(() => {
    if (step !== 3 || !clienteSeleccionado) return;
    (async () => {
      const conR = await sb.from('rbo_contratos').select('id,tipologia_id').eq('cliente_id', clienteSeleccionado.id).eq('ativo', true).order('id', { ascending: false });
      const cons = conR.data || [];
      setContratos(cons);
      if (cons.length > 0) {
        const ids = cons.map(c => c.id);
        const movR = await sb.from('rbo_movimentos').select('contrato_id,creditos').in('contrato_id', ids);
        const stats = {};
        (movR.data || []).forEach(m => { stats[m.contrato_id] = (stats[m.contrato_id] || 0) + m.creditos; });
        setMovStats(stats);
      }
    })();
  }, [step, clienteSeleccionado]);

  const clientesFiltrados = clientes.filter(c => {
    const q = clienteSearch.toLowerCase();
    return !q || c.nome.toLowerCase().includes(q) || (c.nif || '').replace(/\s/g, '').includes(q.replace(/\s/g, ''));
  }).slice(0, 8);

  const criarCliente = async () => {
    if (!novoClienteForm.nome.trim())       return setErroCliente('Nome é obrigatório.');
    if (!novoClienteForm.morada.trim())     return setErroCliente('Morada é obrigatória.');
    if (!novoClienteForm.cp.trim())         return setErroCliente('Código Postal é obrigatório.');
    if (!novoClienteForm.localidade.trim()) return setErroCliente('Localidade é obrigatória.');
    if (!novoClienteForm.email.trim())      return setErroCliente('Email é obrigatório.');
    if (!novoClienteForm.telefone.trim() && !novoClienteForm.telemovel.trim()) return setErroCliente('Telefone ou telemóvel é obrigatório.');
    setErroCliente('');
    setSavingCliente(true);
    const { data: cli, error } = await sb.from('rbo_clientes').insert([{
      nome:        novoClienteForm.nome.trim(),
      nif:         novoClienteForm.nif        || null,
      morada:      novoClienteForm.morada.trim(),
      cp:          novoClienteForm.cp.trim(),
      localidade:  novoClienteForm.localidade.trim(),
      email:       novoClienteForm.email.trim() || null,
      telefone:    novoClienteForm.telefone     || null,
      telemovel:   novoClienteForm.telemovel    || null,
      observacoes: novoClienteForm.observacoes  || null,
    }]).select().single();
    if (error) {
      setErroCliente('Erro ao criar cliente: ' + error.message);
      setSavingCliente(false);
      return;
    }
    if (cli) {
      setClientes(prev => [...prev, cli].sort((a, b) => a.nome.localeCompare(b.nome)));
      setClienteSeleccionado(cli);
      setClienteSearch(cli.nome);
      setShowNovoCliente(false);
      setNovoClienteForm(emptyNovoCliente);
    }
    setSavingCliente(false);
  };

  const validarNumSerie = async (numSerie) => {
    if (!numSerie || !clienteSeleccionado) return true;
    const { data } = await sb.from('rbo_client_equipment').select('id,cliente_id').eq('num_serie', numSerie);
    const conflict = (data || []).find(e => e.cliente_id !== clienteSeleccionado.id);
    if (conflict) { setNumSerieError('Este número de série já está associado a outro cliente.'); return false; }
    setNumSerieError('');
    return true;
  };

  const criarEquipamento = async () => {
    if (!novoEquipForm.descricao.trim()) return;
    const ok = await validarNumSerie(novoEquipForm.num_serie);
    if (!ok) return;
    setSavingEquip(true);
    const { data: eq } = await sb.from('rbo_client_equipment').insert([{
      cliente_id: clienteSeleccionado.id,
      descricao:  novoEquipForm.descricao.trim(),
      tipo_id:    novoEquipForm.tipo_id ? Number(novoEquipForm.tipo_id) : null,
      num_serie:  novoEquipForm.num_serie || null,
      localizacao: novoEquipForm.localizacao || null,
      ativo: true,
    }]).select().single();
    if (eq) {
      setEquipamentos(prev => [...prev, eq]);
      setEquipSeleccionado(eq);
      setShowNovoEquip(false);
      setNovoEquipForm({ descricao: '', tipo_id: '', num_serie: '', localizacao: '' });
    }
    setSavingEquip(false);
  };

  const criarTicket = async () => {
    if (!form3.descricao_problema.trim()) { setError('A descrição do problema é obrigatória.'); return; }
    setSaving(true);
    setError('');
    const equipId = equipSeleccionado && equipSeleccionado !== false ? equipSeleccionado.id : null;
    const { data: ticket, error: err } = await sb.from('rbo_tickets').insert([{
      tipo: 'manual',
      estado: 'pendente',
      cliente_id:          clienteSeleccionado?.id || null,
      equipamento_id:      equipId,
      contrato_id:         form3.contrato_id ? Number(form3.contrato_id) : null,
      tecnico_id:          form3.profile_tecnico_id || null,
      descricao_problema:  form3.descricao_problema.trim(),
      notas_internas:      form3.notas_internas.trim() || null,
    }]).select().single();
    if (err) { setError('Erro ao criar ticket: ' + err.message); setSaving(false); return; }
    await sb.from('rbo_ticket_historico').insert([{
      ticket_id: ticket.id, estado_anterior: null, estado_novo: 'pendente',
      alterado_por_id: currentUserId || null, nota: null,
    }]);
    setSaving(false);
    onCreated?.();
  };

  const lb = { fontSize: 11, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 };
  const stepLabel = ['Selecionar Cliente', 'Equipamento (opcional)', 'Detalhes do Ticket'];

  return (
    <Modal title="Novo Ticket" onClose={onClose} wide>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: s > step ? .4 : 1 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: s < step ? C.green : s === step ? C.teal : C.grey200, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s < step ? '✓' : s}
            </div>
            <span style={{ fontSize: 13, color: s === step ? C.grey800 : C.grey400, fontWeight: s === step ? 600 : 400 }}>{stepLabel[s - 1]}</span>
            {s < 3 && <span style={{ color: C.grey200, margin: '0 4px' }}>›</span>}
          </div>
        ))}
      </div>

      {/* ── Step 1 — Cliente ── */}
      {step === 1 && (
        <div>
          {/* Search — hidden while creating new client */}
          {!showNovoCliente && (
            <>
              <div style={lb}>Pesquisar cliente por nome ou NIF</div>
              <input
                value={clienteSearch}
                onChange={e => { setClienteSearch(e.target.value); setClienteSeleccionado(null); }}
                placeholder="Nome ou NIF..."
                style={{ border: `1.5px solid ${C.grey200}`, borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', background: C.white, color: C.grey800, width: '100%', height: 38, fontFamily: 'inherit' }}
              />

              {/* Results */}
              {clienteSearch && !clienteSeleccionado && clientesFiltrados.length > 0 && (
                <div style={{ border: `1px solid ${C.grey100}`, borderRadius: 8, marginTop: 4, overflow: 'hidden', boxShadow: '0 4px 16px #00000010' }}>
                  {clientesFiltrados.map(c => (
                    <div key={c.id}
                      onClick={() => { setClienteSeleccionado(c); setClienteSearch(c.nome); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${C.grey100}`, background: C.white, fontSize: 14, color: C.grey800 }}
                      onMouseEnter={e => e.currentTarget.style.background = C.grey50}
                      onMouseLeave={e => e.currentTarget.style.background = C.white}>
                      <span style={{ fontWeight: 500 }}>{c.nome}</span>
                      {c.nif && <span style={{ color: C.grey400, marginLeft: 8, fontSize: 12 }}>NIF {c.nif}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Selected */}
              {clienteSeleccionado && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: C.tealXL, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${C.teal}33` }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.teal }}>{clienteSeleccionado.nome}</span>
                    {clienteSeleccionado.nif && <span style={{ color: C.grey400, marginLeft: 8, fontSize: 12 }}>NIF {clienteSeleccionado.nif}</span>}
                  </div>
                  <button onClick={() => { setClienteSeleccionado(null); setClienteSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.grey400, fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              )}

              <button onClick={() => { setShowNovoCliente(true); setErroCliente(''); }} style={{ marginTop: 12, background: 'none', border: `1.5px dashed ${C.grey200}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: C.grey600, fontSize: 13, width: '100%', fontFamily: 'inherit' }}>
                + Criar novo cliente
              </button>
            </>
          )}

          {/* New client form */}
          {showNovoCliente && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.grey800, marginBottom: 2 }}>Novo Cliente</div>
              <Input label="Nome da Empresa" value={novoClienteForm.nome} onChange={v => setNovoClienteForm(f => ({ ...f, nome: v }))} required/>
              <Input label="NIF (opcional)" value={novoClienteForm.nif} onChange={v => setNovoClienteForm(f => ({ ...f, nif: maskNif(v) }))} placeholder="XXX XXX XXX"/>
              <Input label="Morada" value={novoClienteForm.morada} onChange={v => setNovoClienteForm(f => ({ ...f, morada: v }))} required/>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Código Postal" value={novoClienteForm.cp} onChange={v => setNovoClienteForm(f => ({ ...f, cp: maskCP(v) }))} placeholder="XXXX-XXX" required/>
                <Input label="Localidade" value={novoClienteForm.localidade} onChange={v => setNovoClienteForm(f => ({ ...f, localidade: v }))} required/>
              </div>
              <Input label="Email" value={novoClienteForm.email} onChange={v => setNovoClienteForm(f => ({ ...f, email: v }))} type="email" required/>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Telefone" value={novoClienteForm.telefone} onChange={v => setNovoClienteForm(f => ({ ...f, telefone: maskPhone(v) }))}/>
                <Input label="Telemóvel" value={novoClienteForm.telemovel} onChange={v => setNovoClienteForm(f => ({ ...f, telemovel: maskPhone(v) }))}/>
              </div>
              <div style={{ fontSize: 11, color: C.grey400, marginTop: -6 }}>Pelo menos telefone ou telemóvel é obrigatório.</div>
              <Input label="Observações (opcional)" value={novoClienteForm.observacoes} onChange={v => setNovoClienteForm(f => ({ ...f, observacoes: v }))} textarea rows={2}/>
              {erroCliente && <div style={{ fontSize: 12, color: '#e05a5a', padding: '6px 10px', background: '#e05a5a15', borderRadius: 6 }}>{erroCliente}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <Btn variant="secondary" size="sm" onClick={() => { setShowNovoCliente(false); setNovoClienteForm(emptyNovoCliente); setErroCliente(''); }}>Cancelar</Btn>
                <Btn size="sm" onClick={criarCliente} disabled={savingCliente}>{savingCliente ? 'A criar...' : 'Criar Cliente'}</Btn>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <Btn onClick={() => setStep(2)} disabled={!clienteSeleccionado || showNovoCliente}>Próximo →</Btn>
          </div>
        </div>
      )}

      {/* ── Step 2 — Equipamento ── */}
      {step === 2 && (
        <div>
          <div style={lb}>Equipamentos de {clienteSeleccionado?.nome}</div>

          {equipamentos.length === 0 && !showNovoEquip && (
            <div style={{ padding: '20px', textAlign: 'center', color: C.grey400, fontSize: 13, border: `1px solid ${C.grey100}`, borderRadius: 8 }}>
              Este cliente não tem equipamentos registados.
            </div>
          )}

          {equipamentos.length > 0 && !showNovoEquip && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {equipamentos.map(eq => (
                <div key={eq.id}
                  onClick={() => setEquipSeleccionado(eq)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${equipSeleccionado?.id === eq.id ? C.teal : C.grey200}`, background: equipSeleccionado?.id === eq.id ? C.tealXL : C.white, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: C.grey800 }}>{eq.descricao}</span>
                    {eq.num_serie && <span style={{ color: C.grey400, marginLeft: 10, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>S/N {eq.num_serie}</span>}
                  </div>
                  {equipSeleccionado?.id === eq.id && <span style={{ color: C.teal, fontWeight: 700 }}>✓</span>}
                </div>
              ))}
            </div>
          )}

          {/* Novo equipamento */}
          {!showNovoEquip && (
            <button onClick={() => setShowNovoEquip(true)} style={{ marginTop: 12, background: 'none', border: `1.5px dashed ${C.grey200}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: C.grey600, fontSize: 13, width: '100%', fontFamily: 'inherit' }}>
              + Novo equipamento
            </button>
          )}

          {showNovoEquip && (
            <div style={{ marginTop: 12, padding: 16, border: `1px solid ${C.grey100}`, borderRadius: 8, background: C.grey50, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.grey800, marginBottom: 4 }}>Novo equipamento</div>
              <Input label="Descrição" value={novoEquipForm.descricao} onChange={v => setNovoEquipForm(f => ({ ...f, descricao: v }))} required/>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Select label="Tipo" value={novoEquipForm.tipo_id} onChange={v => setNovoEquipForm(f => ({ ...f, tipo_id: v }))} options={tiposEquip.map(t => ({ value: String(t.id), label: t.nome }))}/>
                <div>
                  <Input label="Número de Série" value={novoEquipForm.num_serie}
                    onChange={v => { setNovoEquipForm(f => ({ ...f, num_serie: v })); setNumSerieError(''); }}/>
                  {numSerieError && <div style={{ fontSize: 12, color: '#e05a5a', marginTop: 3 }}>{numSerieError}</div>}
                </div>
              </div>
              <Input label="Localização (opcional)" value={novoEquipForm.localizacao} onChange={v => setNovoEquipForm(f => ({ ...f, localizacao: v }))}/>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <Btn variant="secondary" size="sm" onClick={() => { setShowNovoEquip(false); setNumSerieError(''); }}>Cancelar</Btn>
                <Btn size="sm" onClick={criarEquipamento} disabled={savingEquip || !novoEquipForm.descricao.trim() || !!numSerieError}>{savingEquip ? 'A criar...' : 'Criar Equipamento'}</Btn>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Btn variant="secondary" onClick={() => setStep(1)}>← Voltar</Btn>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="secondary" onClick={() => { setEquipSeleccionado(false); setStep(3); }}>Sem equipamento</Btn>
              <Btn onClick={() => setStep(3)} disabled={!equipSeleccionado}>Próximo →</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3 — Detalhes ── */}
      {step === 3 && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {contratos.length > 0 && (
              <Select
                label="Contrato (opcional)"
                value={form3.contrato_id}
                onChange={v => setForm3(f => ({ ...f, contrato_id: v }))}
                options={contratos.map(c => ({
                  value: String(c.id),
                  label: `${tipologias.find(t => t.id === c.tipologia_id)?.nome || 'Contrato #' + c.id} — ${movStats[c.id] ?? 0} créditos`,
                }))}
              />
            )}
            <Select
              label="Técnico (opcional)"
              value={form3.profile_tecnico_id}
              onChange={v => setForm3(f => ({ ...f, profile_tecnico_id: v }))}
              options={tecnicos.map(t => ({ value: t.id, label: t.nome }))}
            />
            <Input label="Descrição do Problema" value={form3.descricao_problema} onChange={v => setForm3(f => ({ ...f, descricao_problema: v }))} textarea rows={4} required/>
            <Input label="Notas Internas (não visível para o cliente)" value={form3.notas_internas} onChange={v => setForm3(f => ({ ...f, notas_internas: v }))} textarea rows={3}/>
          </div>

          {error && <div style={{ marginTop: 12, padding: '10px 14px', background: '#e05a5a15', borderRadius: 8, fontSize: 13, color: '#e05a5a', border: '1px solid #e05a5a33' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Btn variant="secondary" onClick={() => setStep(2)}>← Voltar</Btn>
            <Btn icon="plus" onClick={criarTicket} disabled={saving || !form3.descricao_problema.trim()}>
              {saving ? 'A criar...' : 'Criar Ticket'}
            </Btn>
          </div>
        </div>
      )}
    </Modal>
  );
};
