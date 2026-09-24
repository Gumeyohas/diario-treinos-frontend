/**
 * Cliente para a API própria (Back-End FastAPI) do Diário de Treinos.
 * URL base configurável via VITE_API_URL.
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    let detail = `Erro ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body.detail === 'string') detail = body.detail;
      else if (Array.isArray(body.detail)) detail = 'Confira os campos do formulário.';
    } catch {
      /* resposta sem corpo JSON */
    }
    throw new Error(detail);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const treinosApi = {
  listar: (grupoMuscular) => {
    const q = grupoMuscular ? `?grupo_muscular=${encodeURIComponent(grupoMuscular)}` : '';
    return request(`/treinos${q}`);
  },
  obter: (id) => request(`/treinos/${id}`),
  resumo: (semanas = 12) => request(`/treinos/resumo?semanas=${semanas}`),
  criar: (payload) => request('/treinos', { method: 'POST', body: JSON.stringify(payload) }),
  atualizar: (id, payload) =>
    request(`/treinos/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  excluir: (id) => request(`/treinos/${id}`, { method: 'DELETE' }),
};

export const exerciciosApi = {
  nomes: () => request('/exercicios/nomes'),
  evolucao: (nome) => request(`/exercicios/evolucao?nome=${encodeURIComponent(nome)}`),
};
