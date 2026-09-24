import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GRUPOS_MUSCULARES, buscarExerciciosPorGrupo, buscarExerciciosPorNome } from '../api/wgerApi';
import { useRascunho } from '../context/RascunhoContext';

export default function BuscarExercicios() {
  const { rascunho, setRascunho, adicionarExercicio } = useRascunho();
  const [grupoAtivo, setGrupoAtivo] = useState(null);
  const [termo, setTermo] = useState('');
  const [exercicios, setExercicios] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [buscou, setBuscou] = useState(false);

  const nomesNoTreino = new Set(rascunho.exercicios.map((e) => e.nome));
  const qtdNoTreino = rascunho.exercicios.filter((e) => e.nome).length;

  async function executar(busca, grupo) {
    setCarregando(true);
    setErro('');
    setBuscou(true);
    try {
      const resultado = await busca();
      setExercicios(resultado.map((ex) => ({ ...ex, grupo: ex.grupo || grupo?.label || '' })));
    } catch (e) {
      setErro(e.message);
      setExercicios([]);
    } finally {
      setCarregando(false);
    }
  }

  function selecionarGrupo(grupo) {
    setGrupoAtivo(grupo);
    setTermo('');
    executar(() => buscarExerciciosPorGrupo(grupo.id), grupo);
  }

  function buscarPorNome(e) {
    e.preventDefault();
    if (!termo.trim()) return;
    setGrupoAtivo(null);
    executar(() => buscarExerciciosPorNome(termo.trim()));
  }

  function adicionar(ex) {
    // Remove linhas em branco antes de adicionar, para o treino não ficar com "buracos"
    setRascunho((r) => ({ ...r, exercicios: r.exercicios.filter((e) => e.nome.trim()) }));
    adicionarExercicio({ nome: ex.nome, grupo_muscular: ex.grupo });
  }

  return (
    <>
      <header className="main__header">
        <p className="main__eyebrow">Dados da API externa wger</p>
        <h1 className="main__title">Banco de exercícios</h1>
      </header>

      <div className="alert alert--info">
        Exercícios consultados em tempo real na API pública e gratuita wger (wger.de). Adicione
        quantos quiser ao treino em montagem e depois ajuste séries, repetições e carga.
      </div>

      <form className="search-row" onSubmit={buscarPorNome}>
        <input
          type="text"
          placeholder="Buscar por nome em inglês (ex: bench press, squat, row)"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          aria-label="Buscar exercício por nome"
        />
        <button type="submit" className="btn btn--ghost">
          Buscar
        </button>
      </form>

      <div className="chip-row">
        {GRUPOS_MUSCULARES.map((grupo) => (
          <button
            key={grupo.id}
            className={'chip' + (grupoAtivo?.id === grupo.id ? ' chip--active' : '')}
            onClick={() => selecionarGrupo(grupo)}
          >
            {grupo.label}
          </button>
        ))}
      </div>

      {erro && <div className="alert alert--error">{erro}</div>}

      {carregando ? (
        <div className="loading-row">
          <span className="spinner" /> Consultando a API externa…
        </div>
      ) : !buscou ? (
        <div className="panel empty-state">
          <div className="empty-state__title">Escolha um grupo muscular ou busque pelo nome</div>
          <p>Os exercícios encontrados podem ser adicionados direto ao seu treino.</p>
        </div>
      ) : exercicios.length === 0 ? (
        <div className="panel empty-state">
          <div className="empty-state__title">Nenhum exercício encontrado</div>
          <p>Tente outro termo (os nomes estão em inglês) ou outro grupo muscular.</p>
        </div>
      ) : (
        <div className="exercise-grid">
          {exercicios.map((ex) => {
            const adicionado = nomesNoTreino.has(ex.nome);
            return (
              <div className="exercise-card" key={ex.id}>
                {ex.imagem ? (
                  <img className="exercise-card__image" src={ex.imagem} alt={ex.nome} loading="lazy" />
                ) : (
                  <div className="exercise-card__image exercise-card__image--empty">Sem imagem</div>
                )}
                <div className="exercise-card__body">
                  <div className="exercise-card__name">{ex.nome}</div>
                  {ex.equipamentos?.length > 0 && <span className="badge">{ex.equipamentos.join(', ')}</span>}
                  <span className="exercise-card__meta">{ex.grupo || 'Grupo não informado'}</span>
                  <button
                    className={'btn btn--small ' + (adicionado ? 'btn--ghost' : 'btn--primary')}
                    onClick={() => adicionar(ex)}
                    disabled={adicionado}
                  >
                    {adicionado ? 'No treino ✓' : 'Adicionar ao treino'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {qtdNoTreino > 0 && (
        <div className="draft-bar">
          <span>
            Treino em montagem: <strong>{qtdNoTreino}</strong> exercício(s)
          </span>
          <Link to="/novo" className="btn btn--primary btn--small">
            Ir para o treino
          </Link>
        </div>
      )}
    </>
  );
}
