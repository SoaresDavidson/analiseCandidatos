"""Coleta dados abertos do TSE (cdn.tse.jus.br) para dados/raw/.

Uso:
    uv run scripts/coleta_tse.py                     # tudo
    uv run scripts/coleta_tse.py candidatos resultados
    uv run scripts/coleta_tse.py --force

Layout: dados/raw/<tema>/<ano>/<nome>_<ano>.zip + <nome>_<ano>/
(mesma convenção já usada em candidatos/).
"""

from __future__ import annotations

import sys

from coleta_comum import RAW, baixar_zip, executar, log

ANOS = [2016, 2018, 2020, 2022, 2024, 2026]
UF = "PI"
CDN = "https://cdn.tse.jus.br/estatistica/sead/odsele"

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
# 2016 ainda usa o formato antigo: um zip com candidatos e partidos juntos
PRESTACAO_CONTAS_2016 = {
    "prestacao_contas_final": "prestacao_contas/prestacao_contas_final_{ano}.zip",
}

RESULTADOS = {
    "votacao_candidato_munzona": "votacao_candidato_munzona/votacao_candidato_munzona_{ano}.zip",
    "votacao_partido_munzona": "votacao_partido_munzona/votacao_partido_munzona_{ano}.zip",
}

ABSTENCAO = {
    "comparecimento_abstencao": "perfil_comparecimento_abstencao/perfil_comparecimento_abstencao_{ano}.zip",
}


def _coletar_tema(tema: str, fontes: dict[str, str], force: bool) -> None:
    for ano in ANOS:
        log(f"[tse/{tema}/{ano}]")
        fontes_ano = PRESTACAO_CONTAS_2016 if tema == "prestacao_contas" and ano == 2016 else fontes
        for nome, caminho in fontes_ano.items():
            url = f"{CDN}/{caminho.format(ano=ano, br='_BR' if ano >= 2022 else '')}"
            baixar_zip(url, RAW / tema / str(ano) / f"{nome}_{ano}.zip", force)


def coletar_candidatos(force: bool) -> None:
    _coletar_tema("candidatos", CANDIDATOS, force)


def coletar_eleitorado(force: bool) -> None:
    _coletar_tema("eleitorado", ELEITORADO, force)


def coletar_prestacao_contas(force: bool) -> None:
    _coletar_tema("prestacao_contas", PRESTACAO_CONTAS, force)


def coletar_resultados(force: bool) -> None:
    _coletar_tema("resultados", RESULTADOS, force)


def coletar_abstencao(force: bool) -> None:
    _coletar_tema("abstencao", ABSTENCAO, force)


def coletar_proposta_governo(force: bool) -> None:
    log(f"[tse/proposta_governo/{UF}]")
    for ano in ANOS:
        url = f"{CDN}/proposta_governo/proposta_governo_{ano}_{UF}.zip"
        baixar_zip(url, RAW / "proposta_governo" / str(ano) / f"proposta_governo_{ano}_{UF}.zip", force)


def coletar_municipio_tse_ibge(force: bool) -> None:
    """Tabela de-para entre código de município do TSE e do IBGE."""
    log("[tse/municipio_tse_ibge]")
    baixar_zip(f"{CDN}/municipio_tse_ibge/municipio_tse_ibge.zip", RAW / "extras" / "municipio_tse_ibge.zip", force)


COLETORES = {
    "candidatos": coletar_candidatos,
    "eleitorado": coletar_eleitorado,
    "prestacao_contas": coletar_prestacao_contas,
    "resultados": coletar_resultados,
    "abstencao": coletar_abstencao,
    "proposta_governo": coletar_proposta_governo,
    "municipio_tse_ibge": coletar_municipio_tse_ibge,
}


def coletar(force: bool = False) -> None:
    for c in COLETORES.values():
        c(force)


if __name__ == "__main__":
    sys.exit(executar(COLETORES, __doc__))
