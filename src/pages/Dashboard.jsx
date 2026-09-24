import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { exerciciosApi, treinosApi } from '../api/treinosApi';
import { useRascunho } from '../context/RascunhoContext';
import { formatarKg, inicioSemanaAtualIso } from '../utils/datas';
import VolumeChart from '../components/VolumeChart';
import EquilibrioChart from '../components/EquilibrioChart';
import EvolucaoChart from '../components/EvolucaoChart';
import TreinoCard from '../components/TreinoCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { rascunho, repetirTreino } = useRascunho();

  const [treinos, setTreinos] = useState([]);
  const [resumo, setResumo] = useState([]);
  const [nomes, setNomes] = useState([]);
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [gruposExistentes, setGruposExistentes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizadoEm, setAtualizadoEm] = useState(0);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const [todos, listaResumo, listaNomes] = await Promise.all([
        treinosApi.listar(),
        treinosApi.resumo(12),
        exerciciosApi.nomes(),
      ]);
      setGruposExistentes(Array.from(new Set(todos.flatMap((t) => t.grupos_musculares))).sort());
      setTreinos(filtroGrupo ? await treinosApi.listar(filtroGrupo) : todos);
      setResumo(listaResumo);
      setNomes(listaNomes);
      setAtualizadoEm(Date.now());
    } catch {
      setErro('Não foi possível conectar à API de treinos. Verifique se o back-end está em execução.');
    } finally {
      setCarregando(false);
    }
  }, [filtroGrupo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const semanaAtual = useMemo(
    () => resumo.find((s) => s.semana_inicio === inicioSemanaAtualIso()),
    [resumo]
  );
  const mediaSemanal = useMemo(() => {
    const ultimas = resumo.filter((s) => s.semana_inicio <= inicioSemanaAtualIso()).slice(-4);
    if (!ultimas.length) return 0;
    return ultimas.reduce((soma, s) => soma + s.quantidade_treinos, 0) / ultimas.length;
  }, [resumo]);

  async function excluir(treino) {
    if (!window.confirm(`Excluir "${treino.nome}" de ${treino.data}? Essa ação não pode ser desfeita.`)) {
      return;
    }
    await treinosApi.excluir(treino.id);
    carregar();
  }

  function repetir(treino) {
    if (
      rascunho.exercicios.length > 0 &&
      !window.confirm('Já existe um treino em montagem. Substituir pelos exercícios deste treino?')
    ) {
      return;
    }
    repetirTreino(treino);
    navigate('/novo');
  }

  const vazio = !carregando && !erro && treinos.length === 0 && !filtroGrupo;

  return (
    <>
      <header className="main__header main__header--row">
        <div>
          <p className="main__eyebrow">Painel</p>
          <h1 className="main__title">Seus treinos</h1>
        </div>
        <Link to="/novo" className="btn btn--primary">
          + Novo treino
        </Link>
      </header>

      {erro && <div className="alert alert--error">{erro}</div>}

      <div className="stat-strip">
        <div className="stat">
          <div className="stat__value stat__value--accent">{semanaAtual?.quantidade_treinos ?? 0}</div>
          <div className="stat__label">Treinos nesta semana</div>
        </div>
        <div className="stat">
          <div className="stat__value">{mediaSemanal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</div>
          <div className="stat__label">Média de treinos/semana (últimas 4)</div>
        </div>
        <div className="stat">
          <div className="stat__value">{semanaAtual?.total_series ?? 0}</div>
          <div className="stat__label">Séries nesta semana</div>
        </div>
        <div className="stat">
          <div className="stat__value">{formatarKg(semanaAtual?.volume_total_kg ?? 0).replace(' kg', '')}</div>
          <div className="stat__label">Volume nesta semana (kg)</div>
        </div>
      </div>

      {vazio ? (
        <div className="panel empty-state">
          <div className="empty-state__title">Nenhum treino registrado ainda</div>
          <p>Registre seu primeiro treino para começar a acompanhar frequência, equilíbrio e evolução.</p>
          <Link to="/novo" className="btn btn--primary" style={{ marginTop: 16 }}>
            Registrar primeiro treino
          </Link>
        </div>
      ) : (
        <>
          <div className="panel-grid">
            <section className="panel panel--wide">
              <h2 className="panel__title">Estou evoluindo?</h2>
              <p className="panel__subtitle">Carga máxima por treino em cada exercício</p>
              <EvolucaoChart nomes={nomes} atualizadoEm={atualizadoEm} />
            </section>

            <section className="panel">
              <h2 className="panel__title">Volume por semana</h2>
              <p className="panel__subtitle">Séries × repetições × carga, últimas 12 semanas</p>
              <VolumeChart resumo={resumo} />
            </section>

            <section className="panel">
              <h2 className="panel__title">Equilíbrio muscular</h2>
              <p className="panel__subtitle">Média de séries por semana em cada grupo (últimas 4 semanas)</p>
              <EquilibrioChart resumo={resumo.filter((s) => s.semana_inicio <= inicioSemanaAtualIso())} />
            </section>
          </div>

          <div className="section-head">
            <h2 className="panel__title">Histórico</h2>
          </div>

          {gruposExistentes.length > 1 && (
            <div className="chip-row">
              <button
                className={'chip' + (filtroGrupo === '' ? ' chip--active' : '')}
                onClick={() => setFiltroGrupo('')}
              >
                Todos
              </button>
              {gruposExistentes.map((g) => (
                <button
                  key={g}
                  className={'chip' + (filtroGrupo === g ? ' chip--active' : '')}
                  onClick={() => setFiltroGrupo(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {carregando ? (
            <div className="loading-row">
              <span className="spinner" /> Carregando treinos…
            </div>
          ) : (
            <div className="sessions">
              {treinos.map((t) => (
                <TreinoCard key={t.id} treino={t} onExcluir={excluir} onRepetir={repetir} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
