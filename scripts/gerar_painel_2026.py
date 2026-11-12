"""Gera os dados da aba "2026" do app React: web/public/dados/e2026.json.

A aba mostra, para a eleição geral de 2026, a mesma conta de cada pergunta do painel, ao lado
da eleição geral anterior (2022). As outras páginas seguem só até 2024 (macro ano_divulgado,
sql/00_limpeza.sql): 2026 fica nesta aba à parte.

Lê o banco (dados/processed/tse.duckdb), depois de coletar e carregar 2026:

    uv run python -m scripts.coleta.coleta_tse recorte_remoto --uf <as 27>
    uv run python -m scripts.coleta.coleta_ibge ipca
    uv run python scripts/carregar_staging.py

Uso:
    uv run python -m scripts.gerar_painel_2026
"""

from __future__ import annotations

import os
from datetime import date
from pathlib import Path

import duckdb

from scripts.painel_web import UFS_BR, gravar

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "dados" / "processed" / "tse.duckdb"
ANOS = [2022, 2026]
# governador, senador, deputado federal e deputado estadual (o distrital do DF entra como estadual)
CARGOS = [3, 5, 6, 7]
CANAIS = ["IMPRESSO", "RUA", "RADIO E TV", "ADESIVO", "DIGITAL", "JINGLE", "CARRO DE SOM", "JORNAL E REVISTA"]
NOME_CARGO = {
    "GOVERNADOR": 3,
    "SENADOR": 5,
    "DEPUTADO FEDERAL": 6,
    "DEPUTADO ESTADUAL": 7,
    "DEPUTADO DISTRITAL": 7,
}

# as candidaturas que foram a voto, com o cargo já juntando estadual e distrital
SQL_BASE = """
CREATE OR REPLACE TEMP VIEW cand AS
SELECT
    c.id_candidatura, c.ano, c.sg_ue AS sg_uf, c.sq_candidato, c.nr_titulo_eleitoral, c.nr_partido,
    CASE WHEN c.cd_cargo = 8 THEN 7 ELSE c.cd_cargo END AS cd_cargo,
    c.fl_eleito, c.nr_idade_eleicao, c.ds_genero, c.cd_grau_instrucao
FROM modelo.candidatura AS c
WHERE c.ano IN (2018, 2022, 2026) AND c.cd_cargo IN (3, 5, 6, 7, 8) AND c.ds_sit_tot_turno IS NOT NULL
"""


def uf_idx(uf: str | None) -> int:
    """Posição da UF em `ufs`; -1 é o país."""
    return -1 if uf is None else UFS_BR.index(uf)


def num(x: object, casas: int = 1) -> float | None:
    return None if x is None else round(float(x), casas)


def main() -> None:
    os.chdir(RAIZ)
    con = duckdb.connect(str(BANCO), read_only=True)
    con.execute(SQL_BASE)
    grupos = "GROUP BY GROUPING SETS ((ano, sg_uf, cd_cargo), (ano, cd_cargo))"

    # quem disputou e quem venceu: quantos, com faculdade, idade e mulheres (Q4, Q6)
    perfil = [
        [ano, uf_idx(uf), cargo, int(n), int(e), int(ns), int(es), num(ic), num(ie), int(nm), int(em)]
        for ano, uf, cargo, n, e, ns, es, ic, ie, nm, em in con.execute(
            f"""SELECT ano, sg_uf, cd_cargo, count(*), count(*) FILTER (WHERE fl_eleito),
                       count(*) FILTER (WHERE cd_grau_instrucao = 8),
                       count(*) FILTER (WHERE cd_grau_instrucao = 8 AND fl_eleito),
                       avg(nr_idade_eleicao) FILTER (WHERE nr_idade_eleicao BETWEEN 18 AND 100),
                       avg(nr_idade_eleicao) FILTER (WHERE fl_eleito AND nr_idade_eleicao BETWEEN 18 AND 100),
                       count(*) FILTER (WHERE ds_genero = 'FEMININO'),
                       count(*) FILTER (WHERE ds_genero = 'FEMININO' AND fl_eleito)
                FROM cand WHERE ano IN (2022, 2026) {grupos} ORDER BY 1, 2 NULLS FIRST, 3"""
        ).fetchall()
    ]

    # custo da cadeira (Q1): despesa de todos os candidatos ÷ vagas, em reais de 2024 quando há IPCA
    custo = [
        [ano, uf_idx(uf), cargo, int(vagas), round(float(desp)), num(fator, 4)]
        for ano, uf, cargo, vagas, desp, fator in con.execute(
            """SELECT q.ano, q.sg_uf, CASE WHEN q.cd_cargo = 8 THEN 7 ELSE q.cd_cargo END AS cargo,
                      sum(q.qt_vaga), sum(q.vr_despesa), any_value(i.fator_2024)
               FROM q1_custo_cargo AS q LEFT JOIN q10_ipca AS i ON q.ano = i.ano
               WHERE q.ano IN (2022, 2026) AND q.cd_cargo IN (3, 5, 6, 7, 8)
               GROUP BY GROUPING SETS ((q.ano, q.sg_uf, cargo), (q.ano, cargo)) ORDER BY 1, 2 NULLS FIRST, 3"""
        ).fetchall()
    ]

    # fundo público (Q8): depende quem teve metade ou mais da receita paga com dinheiro público
    fundo = [
        [ano, uf_idx(uf), NOME_CARGO[cargo], int(np_), int(ep), int(no), int(eo)]
        for ano, uf, cargo, np_, ep, no, eo in con.execute(
            """SELECT ano, sg_uf, ds_cargo,
                      count(*) FILTER (WHERE 2 * vr_publico >= vr_total),
                      count(*) FILTER (WHERE 2 * vr_publico >= vr_total AND fl_eleito),
                      count(*) FILTER (WHERE 2 * vr_publico < vr_total),
                      count(*) FILTER (WHERE 2 * vr_publico < vr_total AND fl_eleito)
               FROM mart_q8
               WHERE ano IN (2022, 2026) AND ds_sit_tot_turno IS NOT NULL AND vr_total > 0
                 AND ds_cargo IN ('GOVERNADOR', 'SENADOR', 'DEPUTADO FEDERAL', 'DEPUTADO ESTADUAL', 'DEPUTADO DISTRITAL')
               GROUP BY GROUPING SETS ((ano, sg_uf, ds_cargo), (ano, ds_cargo)) ORDER BY 1, 2 NULLS FIRST, 3"""
        ).fetchall()
    ]
    # o distrital soma no estadual
    juntos: dict[tuple, list] = {}
    for ano, u, cargo, *v in fundo:
        alvo = juntos.setdefault((ano, u, cargo), [0, 0, 0, 0])
        for k, x in enumerate(v):
            alvo[k] += x
    fundo = [[*k, *v] for k, v in sorted(juntos.items())]

    # patrimônio (Q2): quem declarou bens vai em 5 grupos do mesmo tamanho (no país, por cargo e eleição);
    # 0 = não declarou nenhum bem
    patrimonio = [
        [ano, uf_idx(uf), cargo, quinto, int(n), int(e)]
        for ano, uf, cargo, quinto, n, e in con.execute(
            """WITH bens AS (
                    SELECT id_candidatura, sum(vr_bem) AS vr FROM modelo.bem_candidato GROUP BY 1
                ),
                q AS (
                    SELECT c.ano, c.sg_uf, c.cd_cargo, c.fl_eleito,
                           CASE WHEN coalesce(b.vr, 0) <= 0 THEN 0
                                ELSE ntile(5) OVER (PARTITION BY c.ano, c.cd_cargo, coalesce(b.vr, 0) > 0 ORDER BY b.vr)
                           END AS quinto
                    FROM cand AS c LEFT JOIN bens AS b USING (id_candidatura)
                    WHERE c.ano IN (2022, 2026)
                )
                SELECT ano, sg_uf, cd_cargo, quinto, count(*), count(*) FILTER (WHERE fl_eleito)
                FROM q GROUP BY GROUPING SETS ((ano, sg_uf, cd_cargo, quinto), (ano, cd_cargo, quinto))
                ORDER BY 1, 2 NULLS FIRST, 3, 4"""
        ).fetchall()
    ]

    # propaganda (Q9): valor por tipo de gasto
    canais: dict[tuple, list] = {}
    for ano, uf, cargo, canal, vr in con.execute(
        """SELECT ano, sg_uf, ds_cargo, ds_canal, sum(vr_despesa)
           FROM mart_q9
           WHERE ano IN (2022, 2026)
             AND ds_cargo IN ('GOVERNADOR', 'SENADOR', 'DEPUTADO FEDERAL', 'DEPUTADO ESTADUAL', 'DEPUTADO DISTRITAL')
           GROUP BY GROUPING SETS ((ano, sg_uf, ds_cargo, ds_canal), (ano, ds_cargo, ds_canal))"""
    ).fetchall():
        alvo = canais.setdefault((ano, uf_idx(uf), NOME_CARGO[cargo]), [0] * len(CANAIS))
        alvo[CANAIS.index(canal)] += round(float(vr))
    propaganda = [[*k, v] for k, v in sorted(canais.items())]

    # voto de legenda (Q5): eleitos que só entraram por causa dele, nos cargos proporcionais
    legenda = [
        [ano, uf_idx(uf), cargo, int(e), int(el), int(vn), int(vl)]
        for ano, uf, cargo, e, el, vn, vl in con.execute(
            """SELECT ano, sg_uf, CASE WHEN cd_cargo = 8 THEN 7 ELSE cd_cargo END AS cargo,
                      sum(qt_eleitos), sum(qt_eleitos_legenda), sum(qt_votos_nominais), sum(qt_votos_legenda)
               FROM q5_partido WHERE ano IN (2022, 2026) AND cd_cargo IN (6, 7, 8)
               GROUP BY GROUPING SETS ((ano, sg_uf, cargo), (ano, cargo)) ORDER BY 1, 2 NULLS FIRST, 3"""
        ).fetchall()
    ]

    # viés (Q7): a nota média do voto para deputado federal, com a régua de 2018 nos três anos
    vies = [
        [ano, uf_idx(uf), num(nota, 2), num(pc, 1)]
        for ano, uf, nota, pc in con.execute(
            """WITH v AS (
                   SELECT c.ano, c.sg_uf, f.vl_ideologia AS nota, sum(x.qt_votos_nominais) AS votos
                   FROM modelo.votacao_candidato_municipio AS x
                   INNER JOIN cand AS c USING (id_candidatura)
                   INNER JOIN modelo.partido AS p ON c.ano = p.ano AND c.nr_partido = p.nr_partido
                   LEFT JOIN q7_nota_rodada2018 AS f ON p.sg_partido = f.sg_partido_tse
                   WHERE x.nr_turno = 1 AND c.cd_cargo = 6
                   GROUP BY ALL
               )
               SELECT ano, sg_uf, sum(votos * nota) / nullif(sum(votos) FILTER (WHERE nota IS NOT NULL), 0),
                      100.0 * sum(votos) FILTER (WHERE nota IS NOT NULL) / nullif(sum(votos), 0)
               FROM v GROUP BY GROUPING SETS ((ano, sg_uf), (ano)) ORDER BY 1, 2 NULLS FIRST"""
        ).fetchall()
    ]

    # reeleição (Q10): dos eleitos no ciclo anterior do cargo, quantos tentaram de novo e quantos venceram.
    # A linha "2026" compara com quem se elegeu em 2022 (senador: 2018); a "2022", com 2018 (senador: 2014).
    reeleicao = [
        [ano, uf_idx(uf), cargo, int(e), int(t), int(r)]
        for ano, uf, cargo, e, t, r in con.execute(
            """SELECT ano + CASE WHEN cd_cargo = 5 THEN 8 ELSE 4 END AS ano_da_volta, sg_uf,
                      CASE WHEN cd_cargo = 8 THEN 7 ELSE cd_cargo END AS cargo,
                      sum(qt_eleitos), sum(qt_tentaram_reeleicao), sum(qt_reeleitos)
               FROM q10_sobrevivencia
               WHERE cd_cargo IN (3, 5, 6, 7, 8) AND ano + CASE WHEN cd_cargo = 5 THEN 8 ELSE 4 END IN (2022, 2026)
               GROUP BY GROUPING SETS ((ano_da_volta, sg_uf, cargo), (ano_da_volta, cargo))
               ORDER BY 1, 2 NULLS FIRST, 3"""
        ).fetchall()
    ]

    # o que há de cada coisa em 2026, para a página dizer o que ainda falta
    tem = {
        "resultado": con.execute(
            "SELECT count(*) FILTER (WHERE ds_sit_tot_turno = '2º TURNO') FROM modelo.candidatura WHERE ano = 2026"
        ).fetchone()[0]
        == 0,
        "contas": con.execute("SELECT count(*) FROM mart_q8 WHERE ano = 2026").fetchone()[0],
        "votos": con.execute(
            "SELECT count(*) FROM modelo.votacao_candidato_municipio AS v INNER JOIN cand AS c USING (id_candidatura) WHERE c.ano = 2026"
        ).fetchone()[0],
    }
    con.close()

    gravar(
        "e2026.json",
        {
            "ufs": UFS_BR,
            "anos": ANOS,
            "cargos": CARGOS,
            "canais": CANAIS,
            "coleta": date.today().isoformat(),
            "tem": tem,
            "perfil": perfil,
            "custo": custo,
            "fundo": fundo,
            "patrimonio": patrimonio,
            "propaganda": propaganda,
            "legenda": legenda,
            "vies": vies,
            "reeleicao": reeleicao,
        },
    )


if __name__ == "__main__":
    main()
