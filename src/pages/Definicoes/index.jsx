import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { ACCENTS } from '../../theme';
import { sb } from '../../lib/supabase';
import { PageHeader } from '../../components/ui/PageHeader';
import { Icon } from '../../components/ui/Icon';
import { Card } from '../../components/ui/Card';
import { DefinicaoPanel } from './DefinicaoPanel';
import { UtilizadoresPanel } from './UtilizadoresPanel';

const checkTipologia = async id => {
  const { count } = await sb.from('rbo_contratos').select('id', { count: 'exact', head: true }).eq('tipologia_id', id);
  return count > 0
    ? `Esta tipologia está associada a ${count} contrato${count !== 1 ? 's' : ''} e não pode ser eliminada. Pode inativá-la em alternativa.`
    : null;
};

const checkLocal = async id => {
  const { count } = await sb.from('rbo_movimentos').select('id', { count: 'exact', head: true }).eq('local_id', id);
  return count > 0
    ? `Este local está associado a ${count} movimento${count !== 1 ? 's' : ''} e não pode ser eliminado. Pode inativá-lo em alternativa.`
    : null;
};

const checkCategoria = async id => {
  const { data: cat } = await sb.from('rbo_credential_categories').select('nome').eq('id', id).single();
  if (!cat) return null;
  const { count } = await sb.from('rbo_client_credentials').select('id', { count: 'exact', head: true }).eq('categoria', cat.nome);
  return count > 0
    ? `Esta categoria está em uso em ${count} credencial${count !== 1 ? 'is' : ''} e não pode ser eliminada. Pode inativá-la em alternativa.`
    : null;
};

const checkTipoEquipamento = async id => {
  const { count } = await sb.from('rbo_client_equipment').select('id', { count: 'exact', head: true }).eq('tipo_id', id);
  return count > 0
    ? `Este tipo está associado a ${count} equipamento${count !== 1 ? 's' : ''} e não pode ser eliminado. Pode inativá-lo em alternativa.`
    : null;
};

const GeraisPanel = ({ accent, onAccentChange }) => {
  const C = useTheme();
  return (
    <Card style={{ padding: '24px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.grey800, marginBottom: 4 }}>Cor de destaque</div>
        <div style={{ fontSize: 13, color: C.grey400 }}>Afeta a sidebar, botões e elementos de destaque da aplicação.</div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {ACCENTS.map(a => {
          const active = accent === a.id;
          return (
            <button key={a.id} onClick={() => onAccentChange(a.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: a.color,
                boxShadow: active ? `0 0 0 3px ${C.white}, 0 0 0 5px ${a.color}` : '0 2px 6px rgba(0,0,0,0.18)',
                transition: 'box-shadow .15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {active && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M4 9l4 4 6-7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 12, color: active ? C.teal : C.grey600, fontWeight: active ? 600 : 400 }}>{a.label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export const Definicoes = ({ currentUserId, accent, onAccentChange }) => {
  const C = useTheme();
  const [tab, setTab] = useState('gerais');

  const tabs = [
    { id: 'gerais',       label: 'Gerais',               icon: 'settings'  },
    { id: 'tipologias',   label: 'Tipologias',            icon: 'types'     },
    { id: 'locais',       label: 'Locais de Assistência', icon: 'locations' },
    { id: 'categorias',   label: 'Categorias',            icon: 'key'       },
    { id: 'equipamentos', label: 'Tipos de Equipamento',  icon: 'wrench'    },
    { id: 'utilizadores', label: 'Utilizadores',          icon: 'user'      },
  ];

  return (
    <div>
      <PageHeader title="Definições" subtitle="Listas de suporte e configuração"/>
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: C.white, borderRadius: 12, padding: 6, border: `1px solid ${C.grey100}`, flexWrap: 'wrap' }}>
        {tabs.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: active ? C.teal : 'transparent', color: active ? '#ffffff' : C.grey600, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: active ? 600 : 400, transition: 'all .15s' }}>
              <Icon name={t.icon} size={15} color={active ? '#ffffff' : C.grey400}/>
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'gerais'      && <GeraisPanel accent={accent} onAccentChange={onAccentChange}/>}
      {tab === 'tipologias'  && <DefinicaoPanel tabela="rbo_tipologias"            nomeLabel="Nome"  verificarUso={checkTipologia}/>}
      {tab === 'locais'      && <DefinicaoPanel tabela="rbo_locais"                nomeLabel="Local" verificarUso={checkLocal}/>}
      {tab === 'categorias'  && <DefinicaoPanel tabela="rbo_credential_categories" nomeLabel="Nome"  verificarUso={checkCategoria}/>}
      {tab === 'equipamentos'&& <DefinicaoPanel tabela="rbo_equipment_types"       nomeLabel="Tipo"  verificarUso={checkTipoEquipamento}/>}
      {tab === 'utilizadores'&& <UtilizadoresPanel currentUserId={currentUserId}/>}
    </div>
  );
};
