"""Exporta as três páginas do DER como SVG editável com fundo branco."""

from pathlib import Path
from subprocess import run
from tempfile import TemporaryDirectory
from xml.etree import ElementTree


DIAGRAMS = Path(__file__).resolve().parents[1] / "docs" / "dossie" / "diagramas"
EXPORTS = (
    ("der-geral.drawio", 1, "der-geral.drawio.svg"),
    ("der-geral-separado.drawio", 1, "der-geral-relacoes.drawio.svg"),
    ("der-geral-separado.drawio", 2, "der-geral-atributos.drawio.svg"),
)


def white_svg(svg: str) -> str:
    start = svg.find("<svg")
    end = svg.find(">", start)
    if start < 0 or end < 0:
        raise ValueError("Exportação SVG sem elemento raiz")

    root = ElementTree.fromstring(svg)
    if not root.tag.endswith("}svg") or not root.get("content"):
        raise ValueError("Exportação SVG sem dados editáveis do draw.io")

    opening = svg[start : end + 1]
    previous_style = root.get("style")
    style = 'style="background: #ffffff; background-color: #ffffff; color-scheme: light;"'
    if previous_style is None:
        opening = opening[:-1] + " " + style + ">"
    else:
        opening = opening.replace(f'style="{previous_style}"', style, 1)

    background = '<rect x="0" y="0" width="100%" height="100%" fill="#ffffff"/>'
    return svg[:start] + opening + background + svg[end + 1 :]


def main() -> None:
    with TemporaryDirectory() as temp_dir:
        for source, page, output in EXPORTS:
            temporary = Path(temp_dir) / output
            run(
                [
                    "rtk", "drawio", "--export", "--format", "svg", "--embed-diagram",
                    "--page-index", str(page), "--output", str(temporary), str(DIAGRAMS / source),
                ],
                check=True,
            )
            result = white_svg(temporary.read_text(encoding="utf-8"))
            ElementTree.fromstring(result)
            (DIAGRAMS / output).write_text(result, encoding="utf-8")
            print(f"SVG atualizado: {DIAGRAMS / output}")


if __name__ == "__main__":
    main()
