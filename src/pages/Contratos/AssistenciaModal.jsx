import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { Modal } from '../../components/ui/Modal';
import { Btn } from '../../components/ui/Btn';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

const calcCredits = (start, end) => {
  if (!start || !end) return null;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins <= 0) return null;
  return -Math.ceil(mins / 15);
};

const fmtDuration = (start, end) => {
  if (!start || !end) return null;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  return h > 0 ? `${h}h` : `${m}min`;
};

export const AssistenciaModal = ({ initialData, editingId, tecnicos, locais, equipamentos, onClose, onSave, saving }) => {
  const C = useTheme();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState(() => {
    const base = { data: today, hora_inicio: '', hora_fim: '', creditos: '', descritivo: '', profile_tecnico_id: '', local_id: '', equipment_id: '' };
    if (!initialData) return base;
    return {
      ...base, ...initialData,
      creditos:           initialData.creditos       != null ? String(initialData.creditos)       : '',
      hora_inicio:        initialData.hora_inicio    || '',
      hora_fim:           initialData.hora_fim       || '',
      local_id:           initialData.local_id       != null ? String(initialData.local_id)       : '',
      equipment_id:       initialData.equipment_id   != null ? String(initialData.equipment_id)   : '',
      profile_tecnico_id: initialData.profile_tecnico_id ?? '',
    };
  });

  // 'auto' = calculated from times | 'manual' = user-entered | 'empty' = no value yet
  const [creditsMode, setCreditsMode] = useState(editingId ? 'manual' : 'empty');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleTimeChange = (field, value) => {
    const newStart = field === 'hora_inicio' ? value : form.hora_inicio;
    const newEnd   = field === 'hora_fim'    ? value : form.hora_fim;
    const calc = calcCredits(newStart, newEnd);
    if (calc !== null) {
      setCreditsMode('auto');
      setForm(f => ({ ...f, [field]: value, creditos: String(calc) }));
    } else {
      set(field, value);
    }
  };

  const handleCreditsChange = (v) => {
    setCreditsMode('manual');
    set('creditos', v);
  };

  const handleCreditsBlur = () => {
    const num = parseInt(form.creditos, 10);
    if (!isNaN(num) && num > 0) set('creditos', String(-num));
  };

  const switchToAuto = () => {
    const calc = calcCredits(form.hora_inicio, form.hora_fim);
    if (calc !== null) { setCreditsMode('auto'); set('creditos', String(calc)); }
  };

  const duration      = fmtDuration(form.hora_inicio, form.hora_fim);
  const canSwitchAuto = calcCredits(form.hora_inicio, form.hora_fim) !== null;
  const canSave       = !!form.data && form.creditos !== '' && !isNaN(Number(form.creditos)) && !!form.descritivo.trim();

  const handleSave = () => {
    if (!canSave) return;
    const cred = parseInt(form.creditos, 10);
    onSave({
      data:               form.data,
      hora_inicio:        form.hora_inicio       || null,
      hora_fim:           form.hora_fim          || null,
      creditos:           isNaN(cred) ? 0 : cred,
      descritivo:         form.descritivo.trim(),
      profile_tecnico_id: form.profile_tecnico_id || null,
      local_id:           form.local_id           ? Number(form.local_id)       : null,
      equipment_id:       form.equipment_id       ? Number(form.equipment_id)   : null,
    });
  };

  // ── helpers ────────────────────────────────────────────────────────────
  const sectionHead = (label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, background: C.teal, flexShrink: 0 }}/>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.8px' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.grey100 }}/>
    </div>
  );

  const timeInputBase = {
    border: `1.5px solid ${C.grey200}`, borderRadius: 8,
    padding: '10px 12px', fontSize: 22,
    fontFamily: "'DM Mono', monospace", fontWeight: 600,
    outline: 'none', background: C.white, color: C.grey800,
    width: '100%', textAlign: 'center', letterSpacing: 2, height: 54,
    transition: 'border-color .2s, box-shadow .2s',
    fontFamily: 'inherit',
  };

  const creditsPanelBg    = creditsMode === 'auto'   ? C.tealXL          : creditsMode === 'manual' ? `${C.amber}10` : C.grey50;
  const creditsPanelBorder= creditsMode === 'auto'   ? `${C.teal}44`     : creditsMode === 'manual' ? `${C.amber}44` : C.grey100;
  const creditsLabelColor = creditsMode === 'auto'   ? C.teal            : creditsMode === 'manual' ? C.amber        : C.grey400;

  return (
    <Modal title={editingId ? 'Editar Assistência' : 'Nova Assistência'} onClose={onClose} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── SECÇÃO 1: TEMPO ──────────────────────────────────── */}
        <div>
          {sectionHead('Tempo')}

          {/* Hora início → fim */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 7 }}>Início</label>
              <input type="time" value={form.hora_inicio}
                onChange={e => handleTimeChange('hora_inicio', e.target.value)}
                style={timeInputBase}
                onFocus={e => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px ${C.teal}18`; }}
                onBlur={e  => { e.target.style.borderColor = C.grey200; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: 28, flexShrink: 0, minWidth: 40 }}>
              <div style={{ width: 24, height: 1.5, background: C.grey200 }}/>
              {duration && <span style={{ fontSize: 11, color: C.grey400, fontWeight: 500, whiteSpace: 'nowrap' }}>{duration}</span>}
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.grey400, textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 7 }}>Fim</label>
              <input type="time" value={form.hora_fim}
                onChange={e => handleTimeChange('hora_fim', e.target.value)}
                style={timeInputBase}
                onFocus={e => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px ${C.teal}18`; }}
                onBlur={e  => { e.target.style.borderColor = C.grey200; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Credits panel */}
          <div style={{
            borderRadius: 10, padding: '14px 16px',
            background: creditsPanelBg,
            border: `1.5px solid ${creditsPanelBorder}`,
            display: 'flex', alignItems: 'center', gap: 12,
            transition: 'background .2s, border-color .2s',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8, color: creditsLabelColor }}>
                Créditos <span style={{ color: C.teal }}>*</span>
              </div>

              {creditsMode === 'auto' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: C.tealD, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>{form.creditos}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.teal, background: `${C.teal}20`, borderRadius: 20, padding: '3px 10px', letterSpacing: '.3px', flexShrink: 0 }}>calculado</span>
                  {duration && <span style={{ fontSize: 13, color: C.grey400, marginLeft: 2 }}>· {duration}</span>}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="number"
                    value={form.creditos}
                    onChange={e => handleCreditsChange(e.target.value)}
                    onBlur={e => {
                      handleCreditsBlur();
                      e.target.style.borderColor = `${C.amber}66`;
                    }}
                    onFocus={e => { e.target.style.borderColor = C.amber; }}
                    placeholder="-2"
                    style={{
                      border: `1.5px solid ${C.amber}66`, borderRadius: 8,
                      padding: '6px 12px', fontSize: 22,
                      fontFamily: "'DM Mono', monospace", fontWeight: 700,
                      outline: 'none', background: 'transparent',
                      color: C.grey800, width: 110, height: 42,
                      transition: 'border-color .2s',
                    }}
                  />
                  {creditsMode === 'manual' && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.amber, background: `${C.amber}20`, borderRadius: 20, padding: '3px 10px', letterSpacing: '.3px', flexShrink: 0 }}>manual</span>
                  )}
                </div>
              )}
            </div>

            {creditsMode === 'auto' ? (
              <button onClick={() => setCreditsMode('manual')}
                style={{ background: 'none', border: `1px solid ${C.teal}40`, borderRadius: 6, padding: '5px 12px', fontSize: 12, color: C.grey600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${C.teal}10`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                Editar
              </button>
            ) : canSwitchAuto ? (
              <button onClick={switchToAuto}
                style={{ background: 'none', border: `1px solid ${C.amber}44`, borderRadius: 6, padding: '5px 12px', fontSize: 12, color: C.amber, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${C.amber}10`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                Usar auto
              </button>
            ) : null}
          </div>
        </div>

        {/* ── SECÇÃO 2: DADOS ──────────────────────────────────── */}
        <div>
          {sectionHead('Dados da Assistência')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Data" value={form.data} onChange={v => set('data', v)} type="date" required/>
            <Select label="Técnico"
              value={form.profile_tecnico_id || ''}
              onChange={v => set('profile_tecnico_id', v)}
              options={tecnicos.map(t => ({ value: t.id, label: t.nome }))}/>
            <Select label="Local"
              value={String(form.local_id || '')}
              onChange={v => set('local_id', v)}
              options={locais.map(l => ({ value: String(l.id), label: l.nome }))}/>
            {equipamentos.length > 0
              ? <Select label="Equipamento"
                  value={String(form.equipment_id || '')}
                  onChange={v => set('equipment_id', v)}
                  options={equipamentos.map(e => ({ value: String(e.id), label: e.descricao }))}/>
              : <div/>
            }
          </div>
          <div style={{ marginTop: 14 }}>
            <Input label="Descritivo" value={form.descritivo} onChange={v => set('descritivo', v)} textarea rows={4} required/>
          </div>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: `1px solid ${C.grey100}` }}>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={handleSave} disabled={saving || !canSave}>
            {saving ? 'A guardar...' : editingId ? 'Guardar alterações' : 'Criar Assistência'}
          </Btn>
        </div>

      </div>
    </Modal>
  );
};
