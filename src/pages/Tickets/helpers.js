export const ESTADOS = [
  { id: 'submetido',       label: 'Submetido',       cor: '#e8a83a' },
  { id: 'pendente',        label: 'Pendente',         cor: '#8fa6ab' },
  { id: 'atribuido',       label: 'Atribuído',        cor: '#2a9d9d' },
  { id: 'em_curso',        label: 'Em Curso',         cor: '#2db87d' },
  { id: 'aguarda_cliente', label: 'Aguarda Cliente',  cor: '#e07878' },
  { id: 'concluido',       label: 'Concluído',        cor: '#4a6468' },
  { id: 'cancelado',       label: 'Cancelado',        cor: '#e05a5a' },
];

export const estadoLabel = id => ESTADOS.find(e => e.id === id)?.label || id;
export const estadoCor   = id => ESTADOS.find(e => e.id === id)?.cor   || '#8fa6ab';

export const TRANSICOES = {
  submetido:       ['pendente', 'cancelado'],
  pendente:        ['atribuido', 'cancelado'],
  atribuido:       ['em_curso', 'pendente', 'cancelado'],
  em_curso:        ['aguarda_cliente', 'concluido', 'cancelado'],
  aguarda_cliente: ['em_curso', 'concluido', 'cancelado'],
  concluido:       [],
  cancelado:       [],
};
