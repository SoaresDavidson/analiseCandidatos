## 6. Sobre — ferramentas e metodologia

O projeto usa Python para coleta e inspeção; DuckDB para ler CSV, JSON e Parquet, criar views e executar consultas; e Jupyter para exploração e visualização. As dependências são gerenciadas com `uv`. Os dados eleitorais vêm do TSE; população, escolaridade, idade, PIB e malhas vêm do IBGE; o IDHM histórico do PNUD/Atlas Brasil é complementar.

A metodologia planejada segue cinco etapas: (1) obter os arquivos originais em `dados/raw/`; (2) inspecionar e registrar esquemas reais em `docs/esquemas.md`; (3) normalizar códigos, tipos, anos e os dois leiautes de contas em views de preparação; (4) carregar o núcleo relacional proposto pelo DER; (5) executar uma consulta por pergunta e apresentar resultados e limitações. No estado atual, já existem coleta, inspeção, notebooks de exploração, Parquet e views brutas; as tabelas normalizadas e as 12 consultas finais ainda estão planejadas.

Cuidados metodológicos: preservar o código TSE do município como texto; usar a ponte oficial TSE–IBGE; agregar as zonas eleitorais explicitamente ao nível municipal quando a pergunta pedir município; distinguir ausência de dado de valor zero; registrar o ano de cada indicador e a defasagem do IDHM; classificar origem de recursos e espectro partidário com critérios publicados.
