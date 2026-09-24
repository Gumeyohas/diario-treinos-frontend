import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { cores, tick, tooltipBox } from './chartTheme';
import { formatarDiaMes, formatarKg } from '../utils/datas';

function Dica({ active, payload }) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div style={tooltipBox}>
      <div style={{ color: cores.texto }}>Semana de {formatarDiaMes(s.semana_inicio)}</div>
      {s.quantidade_treinos === 0 ? (
        <div>Nenhum treino</div>
      ) : (
        <>
          <div>{formatarKg(s.volume_total_kg)} de volume</div>
          <div>
            {s.quantidade_treinos} treino(s) · {s.total_series} séries
          </div>
        </>
      )}
    </div>
  );
}

/** Volume (séries × reps × carga) por semana. Semanas sem treino aparecem zeradas. */
export default function VolumeChart({ resumo }) {
  const dados = resumo.map((s) => ({ ...s, rotulo: formatarDiaMes(s.semana_inicio) }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={dados} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={cores.grid} vertical={false} />
        <XAxis dataKey="rotulo" tick={tick} axisLine={{ stroke: cores.eixo }} tickLine={false} />
        <YAxis
          tick={tick}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
        />
        <Tooltip cursor={{ fill: 'rgba(200,255,77,0.06)' }} content={<Dica />} />
        <Bar dataKey="volume_total_kg" fill={cores.accent} radius={[3, 3, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
