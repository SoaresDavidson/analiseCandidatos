// TODO: portar a ficha (modo so=1) de docs/candidatos-painel para React.
export default function FichaEleito({ ano, sq, aoFechar }: { ano: number; sq: number; aoFechar: () => void }) {
  return (
    <div className="p-6">
      Ficha {ano}-{sq} <button type="button" onClick={aoFechar}>Fechar</button>
    </div>
  );
}
