import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { sb } from '../../lib/supabase';
import { PageHeader } from '../../components/ui/PageHeader';
import { Icon } from '../../components/ui/Icon';
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

export const Definicoes = ({ currentUserId }) => {
  const C = useTheme();
  const [tab, setTab] = useState('tipologias');

  const tabs = [
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

      {tab === 'tipologias'   && <DefinicaoPanel tabela="rbo_tipologias"            nomeLabel="Nome"  verificarUso={checkTipologia}/>}
      {tab === 'locais'       && <DefinicaoPanel tabela="rbo_locais"                nomeLabel="Local" verificarUso={checkLocal}/>}
      {tab === 'categorias'   && <DefinicaoPanel tabela="rbo_credential_categories" nomeLabel="Nome"  verificarUso={checkCategoria}/>}
      {tab === 'equipamentos' && <DefinicaoPanel tabela="rbo_equipment_types"       nomeLabel="Tipo"  verificarUso={checkTipoEquipamento}/>}
      {tab === 'utilizadores' && <UtilizadoresPanel currentUserId={currentUserId}/>}
    </div>
  );
};
