/** Estado de carga/erro dos dados de um painel. */
export function Carregando({ erro }: { erro?: Error | null }) {
  return (
    <div className="mx-auto max-w-pagina px-5 py-10 text-texto-2" role={erro ? "alert" : "status"}>
      {erro ? `Não foi possível carregar os dados: ${erro.message}` : "Carregando os dados…"}
    </div>
  );
}
