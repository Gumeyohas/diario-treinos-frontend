import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { exerciciosApi, treinosApi } from '../api/treinosApi';
import { GRUPOS_MUSCULARES } from '../api/wgerApi';
import { exercicioVazio, useRascunho } from '../context/RascunhoContext';
import { formatarKg } from '../utils/datas';

/**
 * Formulário de treino com lista dinâmica de exercícios.
 * - Novo treino: o estado vive no RascunhoContext (sobrevive à navegação).
 * - Edição: estado local carregado da API.
 */
export default function FormTreino() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const ctx = useRascunho();

  const [local, setLocal] = useState(null);
  const [nomesConhecidos, setNomesConhecidos] = useState([]);
  const [carregando, setCarregando] = useState(editando);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const form = editando ? local : ctx.rascunho;
  const setForm = editando ? setLocal : ctx.setRascunho;

  useEffect(() => {
    exerciciosApi.nomes().then(setNomesConhecidos).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editando) return;
    setCarregando(true);
    treinosApi
      .obter(id)
      .then((t) =>
        setLocal({
          nome: t.nome,
          data: t.data,
          observacoes: t.observacoes || '',
          exercicios: t.exercicios.map(({ nome, grupo_muscular, series, repeticoes, carga_kg }) => ({
            nome, grupo_muscular, series, repeticoes, carga_kg,
          })),
        })
      )
      .catch(() => setErro('Não foi possível carregar este treino.'))
      .finally(() => setCarregando(false));
  }, [id, editando]);

  // Novo treino sem nenhum exercício: já começa com uma linha em branco
  useEffect(() => {
    if (!editando && ctx.rascunho.exercicios.length === 0) {
      ctx.setRascunho((r) => ({ ...r, exercicios: [exercicioVazio()] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editando]);

  if (carregando || !form) {
    return (
      <div className="loading-row">
        <span className="spinner" /> Carregando…
      </div>
    );
  }

  const campo = (nome, valor) => setForm((f) => ({ ...f, [nome]: valor }));
  const campoExercicio = (i, nome, valor) =>
    setForm((f) => ({
      ...f,
      exercicios: f.exercicios.map((ex, j) => (j === i ? { ...ex, [nome]: valor } : ex)),
    }));
  const adicionarLinha = () =>
    setForm((f) => {
      const anterior = f.exercicios[f.exercicios.length - 1];
      return {
        ...f,
        exercicios: [...f.exercicios, { ...exercicioVazio(), grupo_muscular: anterior?.grupo_muscular || '' }],
      };
    });
  const removerLinha = (i) =>
    setForm((f) => ({ ...f, exercicios: f.exercicios.filter((_, j) => j !== i) }));
  const mover = (i, delta) =>
    setForm((f) => {
      const lista = [...f.exercicios];
      const alvo = i + delta;
      if (alvo < 0 || alvo >= lista.length) return f;
      [lista[i], lista[alvo]] = [lista[alvo], lista[i]];
      return { ...f, exercicios: lista };
    });

  const volumeTotal = form.exercicios.reduce(
    (s, ex) => s + Number(ex.series || 0) * Number(ex.repeticoes || 0) * Number(ex.carga_kg || 0),
    0
  );
  const seriesTotal = form.exercicios.reduce((s, ex) => s + Number(ex.series || 0), 0);

  async function salvar(e) {
    e.preventDefault();
    if (form.exercicios.length === 0) {
      setErro('Adicione pelo menos um exercício ao treino.');
      return;
    }
    setSalvando(true);
    setErro('');
    const payload = {
      nome: form.nome.trim(),
      data: form.data,
      observacoes: form.observacoes?.trim() || null,
      exercicios: form.exercicios.map((ex) => ({
        nome: ex.nome.trim(),
        grupo_muscular: ex.grupo_muscular,
        series: Number(ex.series),
        repeticoes: Number(ex.repeticoes),
        carga_kg: ex.carga_kg === '' ? 0 : Number(ex.carga_kg),
      })),
    };
    try {
      if (editando) {
        await treinosApi.atualizar(id, payload);
      } else {
        await treinosApi.criar(payload);
        ctx.limpar();
      }
      navigate('/');
    } catch (err) {
      setErro(err.message || 'Não foi possível salvar o treino.');
    } finally {
      setSalvando(false);
    }
  }

  function descartar() {
    if (!editando) {
      const temConteudo = form.nome || form.exercicios.some((ex) => ex.nome);
      if (temConteudo && !window.confirm('Descartar o treino em montagem?')) return;
      ctx.limpar();
    }
    navigate('/');
  }

  return (
    <>
      <header className="main__header">
        <p className="main__eyebrow">{editando ? 'Editar treino' : 'Novo treino'}</p>
        <h1 className="main__title">{editando ? form.nome || 'Editar treino' : 'Montar treino'}</h1>
      </header>

      {erro && <div className="alert alert--error">{erro}</div>}

      <form onSubmit={salvar} className="workout-form">
        <div className="form-card">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="nome">Nome do treino</label>
              <input
                id="nome"
                type="text"
                placeholder="Ex: Treino A — Pernas, Push, Corrida longa"
                value={form.nome}
                onChange={(e) => campo('nome', e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="data">Data</label>
              <input
                id="data"
                type="date"
                value={form.data}
                onChange={(e) => campo('data', e.target.value)}
                required
              />
            </div>
            <div className="field form-grid--full">
              <label htmlFor="obs">Observações (opcional)</label>
              <textarea
                id="obs"
                placeholder="Como se sentiu, sono, ajustes de técnica, recorde pessoal…"
                value={form.observacoes || ''}
                onChange={(e) => campo('observacoes', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="section-head">
          <h2 className="panel__title">
            Exercícios <span className="muted">({form.exercicios.length})</span>
          </h2>
          {!editando && (
            <Link to="/exercicios" className="btn btn--ghost btn--small">
              Buscar no banco de exercícios
            </Link>
          )}
        </div>

        <datalist id="nomes-conhecidos">
          {nomesConhecidos.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>

        <div className="exercise-list">
          {form.exercicios.map((ex, i) => (
            <div className="exercise-row" key={i}>
              <span className="exercise-row__index">{i + 1}</span>
              <div className="field exercise-row__name">
                <label htmlFor={`ex-nome-${i}`}>Exercício</label>
                <input
                  id={`ex-nome-${i}`}
                  list="nomes-conhecidos"
                  type="text"
                  placeholder="Ex: Supino reto"
                  value={ex.nome}
                  onChange={(e) => campoExercicio(i, 'nome', e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor={`ex-grupo-${i}`}>Grupo</label>
                <select
                  id={`ex-grupo-${i}`}
                  value={ex.grupo_muscular}
                  onChange={(e) => campoExercicio(i, 'grupo_muscular', e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Selecione
                  </option>
                  {GRUPOS_MUSCULARES.map((g) => (
                    <option key={g.id} value={g.label}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field exercise-row__num">
                <label htmlFor={`ex-series-${i}`}>Séries</label>
                <input
                  id={`ex-series-${i}`}
                  type="number"
                  min="1"
                  max="50"
                  value={ex.series}
                  onChange={(e) => campoExercicio(i, 'series', e.target.value)}
                  required
                />
              </div>
              <div className="field exercise-row__num">
                <label htmlFor={`ex-reps-${i}`}>Reps</label>
                <input
                  id={`ex-reps-${i}`}
                  type="number"
                  min="1"
                  max="200"
                  value={ex.repeticoes}
                  onChange={(e) => campoExercicio(i, 'repeticoes', e.target.value)}
                  required
                />
              </div>
              <div className="field exercise-row__num">
                <label htmlFor={`ex-carga-${i}`}>Carga (kg)</label>
                <input
                  id={`ex-carga-${i}`}
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  value={ex.carga_kg}
                  onChange={(e) => campoExercicio(i, 'carga_kg', e.target.value)}
                />
              </div>
              <div className="exercise-row__tools">
                <button type="button" className="icon-btn" title="Mover para cima" onClick={() => mover(i, -1)} disabled={i === 0}>
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  title="Mover para baixo"
                  onClick={() => mover(i, 1)}
                  disabled={i === form.exercicios.length - 1}
                >
                  ↓
                </button>
                <button type="button" className="icon-btn icon-btn--danger" title="Remover exercício" onClick={() => removerLinha(i)}>
                  ×
                </button>
              </div>
            </div>
          ))}

          <button type="button" className="add-row" onClick={adicionarLinha}>
            + Adicionar exercício
          </button>
        </div>

        <div className="form-footer">
          <div className="form-footer__totals">
            <span>
              <strong>{seriesTotal}</strong> séries
            </span>
            <span>
              <strong>{formatarKg(volumeTotal)}</strong> de volume
            </span>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={descartar}>
              {editando ? 'Cancelar' : 'Descartar'}
            </button>
            <button type="submit" className="btn btn--primary" disabled={salvando}>
              {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Salvar treino'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
