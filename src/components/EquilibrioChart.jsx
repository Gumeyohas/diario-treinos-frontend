import { GRUPOS_MUSCULARES } from '../api/wgerApi';

/**
 * Média de séries por semana em cada grupo muscular nas últimas N semanas.
 * Todos os grupos aparecem, inclusive os zerados, para evidenciar o que está
 * sendo negligenciado.
 */
export default function EquilibrioChart({ resumo, semanas = 4 }) {
  const recorte = resumo.slice(-semanas);
  const totais = {};
  for (const s of recorte) {
    for (const [grupo, series] of Object.entries(s.series_por_grupo)) {
      totais[grupo] = (totais[grupo] || 0) + series;
    }
  }

  const grupos = GRUPOS_MUSCULARES.map((g) => g.label);
  for (const g of Object.keys(totais)) if (!grupos.includes(g)) grupos.push(g);

  const linhas = grupos
    .map((g) => ({ grupo: g, media: (totais[g] || 0) / recorte.length }))
    .sort((a, b) => b.media - a.media);
  const maximo = Math.max(...linhas.map((l) => l.media), 1);

  return (
    <div className="balance">
      {linhas.map((l) => (
        <div className="balance__row" key={l.grupo}>
          <span className={'balance__label' + (l.media === 0 ? ' balance__label--zero' : '')}>
            {l.grupo}
          </span>
          <div className="balance__track">
            <div className="balance__bar" style={{ width: `${(l.media / maximo) * 100}%` }} />
          </div>
          <span className="balance__value">{l.media === 0 ? '—' : l.media.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}
