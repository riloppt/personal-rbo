import React from 'react';
import { CrudPage } from '../../components/shared/CrudPage';

export const DefinicaoPanel = ({ tabela, nomeLabel = 'Nome', verificarUso }) => (
  <CrudPage
    key={tabela}
    compact
    hasAtivo
    table={tabela}
    cols={[{ key: 'nome', label: nomeLabel }]}
    emptyForm={{ nome: '', ativo: true }}
    formFields={[{ k: 'nome', label: nomeLabel, required: true }]}
    preDeleteCheck={verificarUso}
  />
);
