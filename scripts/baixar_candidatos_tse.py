"""
Baixa os dados de "Candidatos" do Portal de Dados Abertos do TSE
(https://dadosabertos.tse.jus.br/dataset/?q=candidatos) para uma faixa de anos.

Os arquivos não ficam atrás de uma API de consulta: o portal (CKAN) só
aponta para arquivos .zip hospedados em cdn.tse.jus.br, com um padrão de
URL fixo por recurso e por ano. Este script baixa e extrai esses .zip
diretamente.

Uso:
    pip install requests

    # modo interativo: pergunta quais recursos e anos baixar
    python baixar_candidatos_tse.py

    # modo direto (sem perguntas)
    python baixar_candidatos_tse.py --recursos candidatos,bens_candidato --anos 2022,2024
    python baixar_candidatos_tse.py --recursos todos --anos todos

Se um recurso informado não estiver na lista conhecida (RECURSOS), o script
pergunta a URL (padrão com {ano}) para poder baixá-lo.

Resultado:
    dados/raw/candidatos/<ano>/<recurso>_<ano>.zip   (arquivo baixado)
    dados/raw/candidatos/<ano>/<recurso>_<ano>/       (conteúdo extraído)
"""

import argparse
import sys
import zipfile
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------

# Anos de eleição no escopo pedido (2016 até 2026, de 2 em 2 anos)
ANOS = [2026, 2024, 2022, 2020, 2018, 2016]

# Recursos disponíveis no dataset "Candidatos - <ano>" e o padrão de URL de
# cada um (confirmado direto na página do portal). Deixe em
# RECURSOS_SELECIONADOS apenas os que você quer baixar.
RECURSOS = {
    "candidatos": "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_{ano}.zip",
    "candidatos_complementar": "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand_complementar/consulta_cand_complementar_{ano}.zip",
    "bens_candidato": "https://cdn.tse.jus.br/estatistica/sead/odsele/bem_candidato/bem_candidato_{ano}.zip",
    "coligacoes": "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_coligacao/consulta_coligacao_{ano}.zip",
    "vagas": "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_vagas/consulta_vagas_{ano}.zip",
    "motivo_cassacao": "https://cdn.tse.jus.br/estatistica/sead/odsele/motivo_cassacao/motivo_cassacao_{ano}.zip",
    "redes_sociais": "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_{ano}.zip",
}

# Seleção padrão (usada como sugestão no modo interativo).
RECURSOS_SELECIONADOS = ["candidatos"]

DEST_DIR = Path("dados/raw/candidatos")
EXTRAIR_APOS_BAIXAR = True

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; TSE-DataDownloader/1.0)"}
TIMEOUT = 60

# ---------------------------------------------------------------------------
# Funções
# ---------------------------------------------------------------------------


def baixar_arquivo(url: str, destino: Path) -> bool:
    """Baixa um arquivo com streaming, mostrando progresso. Pula se já existe."""
    if destino.exists():
        print(f"  [já existe] {destino.name}")
        return True

    try:
        with requests.get(url, headers=HEADERS, stream=True, timeout=TIMEOUT) as r:
            r.raise_for_status()
            total = int(r.headers.get("content-length", 0))
            baixado = 0
            destino.parent.mkdir(parents=True, exist_ok=True)
            tmp = destino.with_suffix(destino.suffix + ".part")
            with open(tmp, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        baixado += len(chunk)
                        if total:
                            pct = baixado / total * 100
                            print(f"\r  baixando {destino.name}: {pct:5.1f}%", end="", flush=True)
            tmp.rename(destino)
            print()
        return True
    except requests.exceptions.HTTPError as e:
        # 404 costuma significar que o recurso não existe para aquele ano
        print(f"\n  [erro] {url} -> {e}")
        return False
    except requests.exceptions.RequestException as e:
        print(f"\n  [erro de rede] {url} -> {e}")
        return False


def extrair_zip(caminho_zip: Path, pasta_destino: Path) -> None:
    try:
        with zipfile.ZipFile(caminho_zip, "r") as z:
            z.extractall(pasta_destino)
        print(f"  extraído em {pasta_destino}")
    except zipfile.BadZipFile:
        print(f"  [erro] {caminho_zip.name} não é um .zip válido (download incompleto?)")


# ---------------------------------------------------------------------------
# Interface de linha de comando
# ---------------------------------------------------------------------------

TODOS = "todos"


def _split_lista(texto: str) -> list[str]:
    """Separa por vírgula/espaço e remove vazios."""
    return [t for t in texto.replace(",", " ").split() if t]


def perguntar_url_recurso(recurso: str) -> str | None:
    """Recurso não está em RECURSOS: pede ao usuário a URL (com {ano})."""
    print(f"\n  Recurso '{recurso}' não está na lista conhecida.")
    print("  Informe a URL do .zip usando {ano} no lugar do ano, por exemplo:")
    print("  https://cdn.tse.jus.br/estatistica/sead/odsele/xxx/xxx_{ano}.zip")
    while True:
        url = input("  URL (vazio para ignorar este recurso): ").strip()
        if not url:
            return None
        if "{ano}" not in url:
            print("  A URL precisa conter {ano}.")
            continue
        return url


def resolver_recursos(nomes: list[str], interativo: bool) -> list[str]:
    """Valida nomes; para desconhecidos pergunta a URL (ou avisa e ignora)."""
    if any(n.lower() == TODOS for n in nomes):
        return list(RECURSOS)

    selecionados = []
    for nome in nomes:
        if nome.isdigit():
            idx = int(nome) - 1
            chaves = list(RECURSOS)
            if 0 <= idx < len(chaves):
                nome = chaves[idx]
            else:
                print(f"  [aviso] número fora da lista: {nome}")
                continue
        if nome not in RECURSOS:
            url = perguntar_url_recurso(nome) if interativo else None
            if not url:
                print(f"  [aviso] recurso ignorado: {nome}")
                continue
            RECURSOS[nome] = url
        if nome not in selecionados:
            selecionados.append(nome)
    return selecionados


def resolver_anos(valores: list[str]) -> list[int]:
    if any(v.lower() == TODOS for v in valores):
        return list(ANOS)
    anos = []
    for v in valores:
        if not v.isdigit():
            print(f"  [aviso] ano inválido: {v}")
            continue
        ano = int(v)
        if ano not in ANOS:
            print(f"  [aviso] {ano} não está na lista de anos conhecidos {ANOS}; será tentado mesmo assim")
        if ano not in anos:
            anos.append(ano)
    return anos


def escolher_recursos_interativo() -> list[str]:
    print("\nRecursos disponíveis:")
    for i, (nome, url) in enumerate(RECURSOS.items(), start=1):
        print(f"  {i}. {nome:<25} {url}")
    print(f"  {TODOS:<28} (baixa todos acima)")
    print("  Você também pode digitar um nome novo; a URL será pedida.")
    padrao = ",".join(RECURSOS_SELECIONADOS)
    while True:
        resp = input(f"\nEscolha (números ou nomes, separados por vírgula) [{padrao}]: ").strip()
        nomes = _split_lista(resp) or list(RECURSOS_SELECIONADOS)
        selecionados = resolver_recursos(nomes, interativo=True)
        if selecionados:
            return selecionados
        print("  Nenhum recurso válido selecionado, tente de novo.")


def escolher_anos_interativo() -> list[int]:
    print(f"\nAnos disponíveis: {', '.join(map(str, ANOS))}  ({TODOS} = todos)")
    while True:
        resp = input(f"Escolha os anos [{TODOS}]: ").strip()
        anos = resolver_anos(_split_lista(resp) or [TODOS])
        if anos:
            return anos
        print("  Nenhum ano válido, tente de novo.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Baixa dados de Candidatos do Portal de Dados Abertos do TSE.",
    )
    parser.add_argument(
        "--recursos",
        help=f"nomes separados por vírgula, ou '{TODOS}'. Sem este argumento o script pergunta.",
    )
    parser.add_argument(
        "--anos",
        help=f"anos separados por vírgula, ou '{TODOS}'. Sem este argumento o script pergunta.",
    )
    parser.add_argument(
        "--listar", action="store_true", help="só lista os recursos conhecidos e sai"
    )
    parser.add_argument(
        "--nao-extrair", action="store_true", help="não extrai os .zip após baixar"
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.listar:
        for nome, url in RECURSOS.items():
            print(f"{nome:<25} {url}")
        return

    if args.recursos:
        recursos = resolver_recursos(_split_lista(args.recursos), interativo=sys.stdin.isatty())
    else:
        recursos = escolher_recursos_interativo()
    if not recursos:
        print("Nenhum recurso válido selecionado.")
        sys.exit(2)

    anos = resolver_anos(_split_lista(args.anos)) if args.anos else escolher_anos_interativo()
    if not anos:
        print("Nenhum ano válido selecionado.")
        sys.exit(2)

    extrair = EXTRAIR_APOS_BAIXAR and not args.nao_extrair

    print(f"\nRecursos: {', '.join(recursos)}")
    print(f"Anos:     {', '.join(map(str, anos))}")
    print(f"Destino:  {DEST_DIR}")

    falhas = []

    for ano in anos:
        print(f"\n=== Ano {ano} ===")
        pasta_ano = DEST_DIR / str(ano)
        pasta_ano.mkdir(parents=True, exist_ok=True)

        for recurso in recursos:
            template = RECURSOS[recurso]

            url = template.format(ano=ano)
            nome_arquivo = f"{recurso}_{ano}.zip"
            zip_path = pasta_ano / nome_arquivo

            ok = baixar_arquivo(url, zip_path)
            if not ok:
                falhas.append((ano, recurso))
                continue

            if extrair:
                pasta_extraida = pasta_ano / nome_arquivo.replace(".zip", "")
                extrair_zip(zip_path, pasta_extraida)

    print("\n" + "=" * 50)
    if falhas:
        print(f"Concluído com falhas em: {falhas}")
        print("Anos sem dataset publicado (ex.: eleição ainda não realizada)")
        print("costumam falhar com erro 404 — isso é esperado, não é bug.")
        sys.exit(1)
    else:
        print("Concluído sem falhas.")


if __name__ == "__main__":
    main()
