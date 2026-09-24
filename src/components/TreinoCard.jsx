import { useState } from 'react';
import { Link } from 'react-router-dom';
import { diaDaSemana, formatarData, formatarKg } from '../utils/datas';

export default function TreinoCard({ treino, onExcluir, onRepetir }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className={'session' + (aberto ? ' session--open' : '')}>
      <button
        className="session__summary"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
      >
        <span className="session__date">
          <span className="session__weekday">{diaDaSemana(treino.data)}</span>
          {formatarData(treino.data)}
        </span>
        <span className="session__main">
          <span className="session__name">{treino.nome}</span>
          <span className="session__groups">{treino.grupos_musculares.join(' / ')}</span>
        </span>
        <span className="session__metric">
          <strong>{treino.exercicios.length}</strong> exercícios
        </span>
        <span className="session__metric">
          <strong>{treino.total_series}</strong> séries
        </span>
        <span className="session__metric">
          <strong>{formatarKg(treino.volume_total_kg)}</strong>
        </span>
        <span className="session__chevron" aria-hidden="true">
          ›
        </span>
      </button>

      {aberto && (
        <div className="session__detail">
          <table className="sets">
            <thead>
              <tr>
                <th>Exercício</th>
                <th>Grupo</th>
                <th>Séries × reps</th>
                <th>Carga</th>
                <th>Volume</th>
              </tr>
            </thead>
            <tbody>
              {treino.exercicios.map((ex) => (
                <tr key={ex.id}>
                  <td className="sets__name">{ex.nome}</td>
                  <td className="muted">{ex.grupo_muscular}</td>
                  <td>
                    {ex.series} × {ex.repeticoes}
                  </td>
                  <td>{ex.carga_kg ? `${ex.carga_kg.toLocaleString('pt-BR')} kg` : '—'}</td>
                  <td className="muted">{ex.volume_kg ? formatarKg(ex.volume_kg) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {treino.observacoes && <p className="session__notes">{treino.observacoes}</p>}

          <div className="session__actions">
            <button className="btn btn--primary btn--small" onClick={() => onRepetir(treino)}>
              Repetir este treino
            </button>
            <Link to={`/editar/${treino.id}`} className="btn btn--ghost btn--small">
              Editar
            </Link>
            <button className="btn btn--danger btn--small" onClick={() => onExcluir(treino)}>
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
