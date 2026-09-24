import { createContext, useContext, useEffect, useState } from 'react';
import { hojeIso } from '../utils/datas';

/**
 * Treino "em montagem": mantido fora do formulário para que o usuário possa
 * ir ao Banco de exercícios, adicionar itens e voltar sem perder nada.
 * Salvo no localStorage para sobreviver a um recarregamento da página
 * (útil para ir registrando durante o treino, pelo celular).
 */
const RascunhoContext = createContext(null);
const CHAVE = 'diario-treinos:rascunho';

export const exercicioVazio = () => ({
  nome: '',
  grupo_muscular: '',
  series: 3,
  repeticoes: 10,
  carga_kg: '',
});

export const rascunhoVazio = () => ({
  nome: '',
  data: hojeIso(),
  observacoes: '',
  exercicios: [],
});

function carregar() {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo ? JSON.parse(salvo) : rascunhoVazio();
  } catch {
    return rascunhoVazio();
  }
}

export function RascunhoProvider({ children }) {
  const [rascunho, setRascunho] = useState(carregar);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(rascunho));
    } catch {
      /* armazenamento indisponível: segue só em memória */
    }
  }, [rascunho]);

  function adicionarExercicio(ex) {
    setRascunho((r) => ({ ...r, exercicios: [...r.exercicios, { ...exercicioVazio(), ...ex }] }));
  }

  function limpar() {
    setRascunho(rascunhoVazio());
  }

  /** Copia um treino já feito para o rascunho, com a data de hoje. */
  function repetirTreino(treino) {
    setRascunho({
      nome: treino.nome,
      data: hojeIso(),
      observacoes: '',
      exercicios: treino.exercicios.map(({ nome, grupo_muscular, series, repeticoes, carga_kg }) => ({
        nome, grupo_muscular, series, repeticoes, carga_kg,
      })),
    });
  }

  return (
    <RascunhoContext.Provider
      value={{ rascunho, setRascunho, adicionarExercicio, limpar, repetirTreino }}
    >
      {children}
    </RascunhoContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRascunho() {
  return useContext(RascunhoContext);
}
