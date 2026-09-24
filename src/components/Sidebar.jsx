import { NavLink } from 'react-router-dom';
import { useRascunho } from '../context/RascunhoContext';

export default function Sidebar() {
  const { rascunho } = useRascunho();
  const emMontagem = rascunho.exercicios.length;

  const links = [
    { to: '/', label: 'Painel', end: true },
    { to: '/novo', label: 'Novo treino', badge: emMontagem || null },
    { to: '/exercicios', label: 'Banco de exercícios' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark">D</span>
        <div>
          <div className="sidebar__brand-name">Diário de</div>
          <div className="sidebar__brand-name sidebar__brand-name--accent">Treinos</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => 'sidebar__link' + (isActive ? ' sidebar__link--active' : '')}
          >
            {link.label}
            {link.badge && (
              <span className="sidebar__badge" title="Exercícios no treino em montagem">
                {link.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <p>MVP · Arquitetura de Software</p>
        <p>Pós-graduação em Engenharia de Software — PUC-Rio</p>
      </div>
    </aside>
  );
}
