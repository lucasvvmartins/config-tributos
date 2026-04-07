# Config Tributos — Assistente de Configuração CFGTRIB

**Vision:** Ferramenta web que analisa XMLs de NF-e e gera automaticamente as configurações necessárias para o Configurador de Tributos (FISA170) do Protheus TOTVS, eliminando a configuração manual e reduzindo erros fiscais.

**For:** Analistas fiscais e consultores Protheus responsáveis pela configuração tributária de empresas que utilizam Protheus 12.1.22.10+

**Solves:** A configuração manual do CFGTRIB é complexa (5 camadas: Cadastros → Perfis → Regras Base/Alíquota/Escrituração → Regra de Cálculo → Apuração), propensa a erros e consome horas de trabalho especializado. A ferramenta automatiza a geração dessas configurações a partir das operações reais da empresa.

## Goals

- Gerar Perfis (Produto, Operação, Participante, Origem/Destino) corretos a partir das NF-es
- Gerar Regras de Cálculo (F2B) com tributos ICMS, IPI, PIS, COFINS, CBS, IBS prontas para importação no Protheus
- Exportar configurações em formato compatível com importação no Protheus (CSV/TXT)

## Tech Stack

**Core:**
- Framework: React 19.2.4
- Language: TypeScript ~6.0.2
- Build: Vite 8.0.4 + SWC
- Styling: Tailwind CSS v4

**Key dependencies:**
- Lucide React (ícones)
- clsx + tailwind-merge (utilitário de classes)
- Vitest (testes — a instalar na Etapa 1)

## Scope

**v1 (Etapa 1) inclui:**
- Refatoração de `types.ts` com tipos CFGTRIB reais (Perfis + Regras F27/F28/CJ2/F2B)
- Atualização de `TESConfig` com todos os campos SF4 que permanecem na integração
- Engine gerando Perfis e Regras de Cálculo para: ICMS, IPI, PIS, COFINS, CBS (ID 000062), IBS (ID 000060)
- Nova aba "Configurador" na UI com sub-abas: Perfis | Regras Base | Regras Alíquota | Regras de Cálculo
- Status "Em Teste / Aprovada" (F2B_STATUS) nas regras
- Remoção/refatoração da aba "Regras de Estoque" (conceito legado, não existe no CFGTRIB)
- Configuração do Vitest + testes unitários para rules-engine.ts

**Explicitamente fora do escopo v1:**
- Regras por NCM complexas (MVA, Pauta, Ex-tarifário)
- Regras de Ajuste de Lançamento (CJ8/CJ9/CJA)
- Apuração (F2G/F2H/F2I)
- IndOp (IBS/CBS para NFS-e — regulatório posterior)
- Compartilhamento de tabelas multi-filial
- IRPF tabela progressiva, CIDE, FUNRURAL, IPM
- Integração com API do Protheus

## Constraints

- Aplicação 100% client-side (sem backend, sem API)
- Compatível com Protheus 12.1.2310+
- Deve manter compatibilidade com XMLs de NF-e já processados (não quebrar parser existente)
- IBS/CBS obrigatório nas regras geradas (vigência 2026)
