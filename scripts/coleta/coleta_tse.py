"""Coleta dados abertos do TSE (cdn.tse.jus.br) para dados/raw/.

Uso:
    uv run python -m scripts.coleta.coleta_tse                     # tudo
    uv run python -m scripts.coleta.coleta_tse candidatos resultados
    uv run python -m scripts.coleta.coleta_tse --force
    uv run python -m scripts.coleta.coleta_tse --uf PI,CE           # só essas UFs

Layout: dados/raw/<tema>/<ano>/<nome>_<ano>.zip + <nome>_<ano>/
(mesma convenção já usada em candidatos/).
"""

from __future__ import annotations

import sys

from scripts.coleta.coleta_comum import RAW, UFS, Ufs, baixar_zip, executar, log

ANOS = [2016, 2018, 2020, 2022, 2024, 2026]
CDN = "https://cdn.tse.jus.br/estatistica/sead/odsele"

# Nos zips quebrados por UF o arquivo _BRASIL é a concatenação EXATA de todas as
# UFs — conferido em detalhe_votacao_munzona 2020: 12.630 linhas e 5.568
# municípios distintos dos dois lados. Extrair os dois dobra o disco à toa, então
# todo tema extrai só o recorte pedido em --uf (padrão: o _BRASIL).

# Q8 (doação de PJ) precisa de 2014: o STF derrubou a doação empresarial em
# setembro de 2015 (ADI 4650), então a eleição de 2016 já foi sem PJ.
ANOS_PRESTACAO = [2014, *ANOS]

# Q12 (linha do tempo do político) pede o maior período possível. Só o cadastro de
# candidatos volta tão longe, e é o arquivo mais leve do TSE. NR_CPF_CANDIDATO
# existe desde 2002, então dá para ligar a mesma pessoa entre eleições por CPF.
ANOS_HISTORICO = [2002, 2004, 2006, 2008, 2010, 2012, 2014]
HISTORICO = {"candidatos": "consulta_cand/consulta_cand_{ano}.zip"}

# nome local -> caminho no CDN (os nomes locais seguem o que já existe em candidatos/)
CANDIDATOS = {
    "candidatos": "consulta_cand/consulta_cand_{ano}.zip",
    "candidatos_complementar": "consulta_cand_complementar/consulta_cand_complementar_{ano}.zip",
    "bens_candidato": "bem_candidato/bem_candidato_{ano}.zip",
    "coligacoes": "consulta_coligacao/consulta_coligacao_{ano}.zip",
    "vagas": "consulta_vagas/consulta_vagas_{ano}.zip",
    "motivo_cassacao": "motivo_cassacao/motivo_cassacao_{ano}.zip",
    # até 2020 um zip nacional; de 2022 em diante é por UF, com BR agregando tudo
    "redes_sociais": "consulta_cand/rede_social_candidato_{ano}{br}.zip",
}

ELEITORADO = {
    "perfil_eleitorado": "perfil_eleitorado/perfil_eleitorado_{ano}.zip",
    "eleitorado_local_votacao": "eleitorado_locais_votacao/eleitorado_local_votacao_{ano}.zip",
}

PRESTACAO_CONTAS = {
    "prestacao_contas_candidatos": "prestacao_contas/prestacao_de_contas_eleitorais_candidatos_{ano}.zip",
    "prestacao_contas_orgaos_partidarios": "prestacao_contas/prestacao_de_contas_eleitorais_orgaos_partidarios_{ano}.zip",
    "fefc_fp": "fefc_fp/fefc_fp_{ano}.zip",  # só a partir de 2020
}
# Até 2016 é o formato antigo: um zip com candidatos e partidos juntos, em .txt e
# com as colunas em português. E o nome do arquivo muda de ano para ano — 2014 é
# `prestacao_final`, sem o `_contas_`. Não existe template que sirva para os dois.
PRESTACAO_CONTAS_POR_ANO = {
    2014: {"prestacao_contas_final": "prestacao_contas/prestacao_final_2014.zip"},
    2016: {
        "prestacao_contas_final": "prestacao_contas/prestacao_contas_final_2016.zip"
    },
}

RESULTADOS = {
    "votacao_candidato_munzona": "votacao_candidato_munzona/votacao_candidato_munzona_{ano}.zip",
    "votacao_partido_munzona": "votacao_partido_munzona/votacao_partido_munzona_{ano}.zip",
    # abstenção e brancos/nulos/válidos POR CARGO (Q3). O grupo Comparecimento e
    # Abstenção não substitui: lá o grão é o perfil do eleitor e não tem cargo.
    "detalhe_votacao_munzona": "detalhe_votacao_munzona/detalhe_votacao_munzona_{ano}.zip",
}

ABSTENCAO = {
    "comparecimento_abstencao": "perfil_comparecimento_abstencao/perfil_comparecimento_abstencao_{ano}.zip",
}


def _coletar_tema(
    tema: str,
    fontes: dict[str, str],
    force: bool,
    ufs: Ufs,
    anos: list[int] | None = None,
    por_ano: dict[int, dict[str, str]] | None = None,
) -> None:
    for ano in anos or ANOS:
        log(f"[tse/{tema}/{ano}]")
        for nome, caminho in (por_ano or {}).get(ano, fontes).items():
            url = f"{CDN}/{caminho.format(ano=ano, br='_BR' if ano >= 2022 else '')}"
            baixar_zip(
                url,
                RAW / tema / str(ano) / f"{nome}_{ano}.zip",
                force,
                ufs,
            )


def coletar_candidatos(force: bool, ufs: Ufs) -> None:
    _coletar_tema("candidatos", CANDIDATOS, force, ufs)


def coletar_historico(force: bool, ufs: Ufs) -> None:
    """Só consulta_cand de 2002 a 2014, para a linha do tempo da Q12."""
    _coletar_tema("candidatos", HISTORICO, force, ufs, anos=ANOS_HISTORICO)


def coletar_eleitorado(force: bool, ufs: Ufs) -> None:
    _coletar_tema("eleitorado", ELEITORADO, force, ufs)


def coletar_prestacao_contas(force: bool, ufs: Ufs) -> None:
    # O nacional ocupa ~21 GB em disco; só o PI, poucas centenas de MB.
    _coletar_tema(
        "prestacao_contas",
        PRESTACAO_CONTAS,
        force,
        ufs,
        anos=ANOS_PRESTACAO,
        por_ano=PRESTACAO_CONTAS_POR_ANO,
    )


def coletar_resultados(force: bool, ufs: Ufs) -> None:
    _coletar_tema("resultados", RESULTADOS, force, ufs)


def coletar_abstencao(force: bool, ufs: Ufs) -> None:
    _coletar_tema("abstencao", ABSTENCAO, force, ufs)


def coletar_proposta_governo(force: bool, ufs: Ufs) -> None:
    """Um zip por UF; não há nacional. BR (presidente) só existe em ano de eleição geral.

    No país todo são ~27 zips por ano — só o de SP em 2024 tem 1,4 GB.
    """
    for uf in ufs or [*UFS, "BR"]:
        log(f"[tse/proposta_governo/{uf}]")
        for ano in ANOS:
            nome = f"proposta_governo_{ano}_{uf}.zip"
            baixar_zip(
                f"{CDN}/proposta_governo/{nome}",
                RAW / "proposta_governo" / str(ano) / nome,
                force,
            )


def coletar_municipio_tse_ibge(force: bool, _ufs: Ufs) -> None:
    """Tabela de-para entre código de município do TSE e do IBGE."""
    log("[tse/municipio_tse_ibge]")
    baixar_zip(
        f"{CDN}/municipio_tse_ibge/municipio_tse_ibge.zip",
        RAW / "extras" / "municipio_tse_ibge.zip",
        force,
    )


COLETORES = {
    "candidatos": coletar_candidatos,
    "historico": coletar_historico,
    "eleitorado": coletar_eleitorado,
    "prestacao_contas": coletar_prestacao_contas,
    "resultados": coletar_resultados,
    "abstencao": coletar_abstencao,
    "proposta_governo": coletar_proposta_governo,
    "municipio_tse_ibge": coletar_municipio_tse_ibge,
}


def coletar(force: bool = False, ufs: Ufs = None) -> None:
    """Um coletor que falhe não impede os outros; o erro é relatado no fim."""
    falhas = []
    for nome, c in COLETORES.items():
        try:
            c(force, ufs)
        except Exception as e:
            falhas.append(f"{nome} ({e})")
            log(f"  ERRO em {nome}: {e}")
    if falhas:
        raise RuntimeError(", ".join(falhas))


if __name__ == "__main__":
    sys.exit(executar(COLETORES, __doc__))
