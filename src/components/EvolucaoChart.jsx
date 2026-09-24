import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { exerciciosApi } from '../api/treinosApi';
import { cores, tick, tooltipBox } from './chartTheme';
import { formatarData, formatarDiaMes } from '../utils/datas';

function Dica({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div style={tooltipBox}>
      <div style={{ color: cores.texto }}>{formatarData(p.data)}</div>
      <div>Melhor série: {p.melhor_serie}</div>
    </div>
  );
}

/** Progressão da carga máxima de um exercício ao longo do tempo. */
export default function EvolucaoChart({ nomes, atualizadoEm }) {
  const [selecionado, setSelecionado] = useState('');
  const [pontos, setPontos] = useState([]);
  const [erro, setErro] = useState('');

  const nome = nomes.includes(selecionado) ? selecionado : nomes[0] || '';

  useEffect(() => {
    if (!nome) return;
    setErro('');
    exerciciosApi
      .evolucao(nome)
      .then(setPontos)
      .catch((e) => {
        setPontos([]);
        setErro(e.message);
      });
  }, [nome, atualizadoEm]);

  if (nomes.length === 0) {
    return <p className="muted">Registre um treino para acompanhar a evolução das cargas.</p>;
  }

  const primeiro = pontos[0]?.carga_maxima_kg ?? 0;
  const ultimo = pontos[pontos.length - 1]?.carga_maxima_kg ?? 0;
  const delta = ultimo - primeiro;
  const dados = pontos.map((p) => ({ ...p, rotulo: formatarDiaMes(p.data) }));

  return (
    <>
      <div className="evolution__head">
        <select
          className="select-inline"
          value={nome}
          onChange={(e) => setSelecionado(e.target.value)}
          aria-label="Exercício"
        >
          {nomes.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        {pontos.length > 1 && (
          <span className={'evolution__delta' + (delta > 0 ? ' evolution__delta--up' : '')}>
            {delta > 0 ? '+' : ''}
            {delta.toLocaleString('pt-BR')} kg desde {formatarData(pontos[0].data)}
          </span>
        )}
      </div>

      {erro && <p className="muted">{erro}</p>}

      {pontos.length === 1 ? (
        <p className="muted">
          {nome} foi registrado em apenas um dia até agora ({pontos[0].melhor_serie}). A linha de
  evolução aparece quando houver treinos com esse exercício em datas diferentes.
        </p>
      ) : (
        pontos.length > 1 && (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dados} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={cores.grid} vertical={false} />
              <XAxis dataKey="rotulo" tick={tick} axisLine={{ stroke: cores.eixo }} tickLine={false} />
              <YAxis
                tick={tick}
                axisLine={false}
                tickLine={false}
                width={48}
                domain={['dataMin - 5', 'dataMax + 5']}
                unit=" kg"
              />
              <Tooltip content={<Dica />} cursor={{ stroke: cores.eixo }} />
              <Line
                type="monotone"
                dataKey="carga_maxima_kg"
                stroke={cores.accent}
                strokeWidth={2}
                dot={{ r: 4, fill: cores.accent, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )
      )}
    </>
  );
}
