/**
 * Cliente para a API externa pública "wger" (https://wger.de/api/v2/).
 * Banco aberto de exercícios, sem cadastro nem chave para os endpoints
 * públicos usados aqui. Os dados são normalizados nesta aplicação antes
 * de serem exibidos -- o usuário nunca é redirecionado para a wger.
 */
const WGER_BASE_URL = 'https://wger.de/api/v2';

// Categorias do wger (id e nome em inglês) mapeadas para os grupos da aplicação.
export const GRUPOS_MUSCULARES = [
  { id: 11, label: 'Peito', wger: 'Chest' },
  { id: 12, label: 'Costas', wger: 'Back' },
  { id: 13, label: 'Ombros', wger: 'Shoulders' },
  { id: 8, label: 'Braços', wger: 'Arms' },
  { id: 9, label: 'Pernas', wger: 'Legs' },
  { id: 10, label: 'Abdômen', wger: 'Abs' },
  { id: 14, label: 'Panturrilha', wger: 'Calves' },
  { id: 15, label: 'Cardio', wger: 'Cardio' },
];

function grupoPorCategoria(categoria) {
  if (!categoria) return '';
  const nome = typeof categoria === 'object' ? categoria.name : categoria;
  const id = typeof categoria === 'object' ? categoria.id : null;
  const g = GRUPOS_MUSCULARES.find((x) => x.id === id || x.wger === nome);
  return g ? g.label : '';
}

function normalizarExercicio(item) {
  const traducao =
    item.translations?.find((t) => t.language === 2) || item.translations?.[0] || {};
  return {
    id: item.id,
    nome: traducao.name || '',
    imagem: item.images?.[0]?.image || null,
    equipamentos: (item.equipment || []).map((e) => e.name).filter(Boolean),
    grupo: grupoPorCategoria(item.category),
  };
}

/** Exercícios de um grupo muscular (endpoint exerciseinfo: nome, imagem e equipamento). */
export async function buscarExerciciosPorGrupo(categoriaId, { limit = 24 } = {}) {
  const url = `${WGER_BASE_URL}/exerciseinfo/?category=${categoriaId}&language=2&limit=${limit}&format=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Não foi possível consultar a base de exercícios externa (wger).');
  }
  const data = await response.json();
  return (data.results || []).map(normalizarExercicio).filter((ex) => ex.nome);
}

/** Busca livre por nome. */
export async function buscarExerciciosPorNome(termo) {
  const url = `${WGER_BASE_URL}/exercise/search/?term=${encodeURIComponent(
    termo
  )}&language=english&format=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Não foi possível consultar a base de exercícios externa (wger).');
  }
  const data = await response.json();
  return (data.suggestions || []).map((s) => ({
    id: s.data.id,
    nome: s.value,
    imagem: s.data.image ? new URL(s.data.image, 'https://wger.de').href : null,
    equipamentos: [],
    grupo: grupoPorCategoria(s.data.category),
  }));
}
