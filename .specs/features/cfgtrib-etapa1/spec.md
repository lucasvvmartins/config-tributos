# Feature Spec — CFGTRIB Etapa 1

**Feature ID:** cfgtrib-etapa1
**Status:** Especificado
**Created:** 2026-04-07
**Complexity:** Large (multi-component, requer design + tasks)

---

## Context

O projeto atual gera configurações no modelo legado SF4/TES (MATA080). O Protheus 12.1.22.10+ usa o Configurador de Tributos FISA170 com arquitetura de 5 camadas. Esta feature refatora o modelo de dados e o engine para gerar configurações CFGTRIB reais.

**Documentação de referência (local em `/Users/lucasvieira/`):**
- `CFGTRIB - Configurador de Tributos - Linha Microsiga Protheus - TDN.pdf` (76p — visão geral completa)
- `CFGTRIB - Cadastro de Perfis do Configurador de Tributos - Boas Práticas*.pdf`
- `CFGTRIB - Cadastro de Regras de Cálculo no Configurador de Tributos - Boas Práticas*.pdf`
- `CFGTRIB - Campos que Permanecem no TES*.pdf`
- `CFGTRIB - Integração dos tributos legados com o Configurador de Tributos*.pdf`
- `CROSS Segmentos - TOTVS Backoffice Linha Protheus - FIS - Como configurar o cálculo do CBS_IBS*.pdf`
- `Downloads/CFGTRIB - Configurador de Tributos - Linha Microsiga Protheus - TDN.pdf`

---

## Requirements

### REQ-001 — Tipos CFGTRIB em types.ts

**O quê:** Adicionar interfaces TypeScript que representam as entidades do CFGTRIB real
**Por quê:** Sem tipos corretos, engine e UI divergem; exportação gera dados inválidos para o Protheus
**Critério de aceite:**
- `PerfilProduto` com campos: codigo, descricao, produtos (array de { codProd, origem })
- `PerfilOperacao` com campos: codigo, descricao, cfops (array), tiposOperacao (array), codigosServico (array)
- `PerfilParticipante` com campos: codigo, descricao, participantes (array de { tipo: 'C'|'F', codPart, loja })
- `PerfilOrigemDestino` com campos: codigo, descricao, ufs (array de { ufOrigem, ufDestino })
- `RegraBase` (F27) com campos: codigo, descricao, valorOrigem (01-11), formula?, reducaoBC?, adicoes?, deducoes?
- `RegraAliquota` (F28) com campos: codigo, descricao, valorOrigem (04|05|06), tipoAliquota ('1'|'2'), aliquota?, formula?, urf?
- `RegraEscrituracao` (CJ2) com campos: codigo, descricao, incidencia, cst, cstCct?, agregarTotal?, agregarDuplicata?
- `RegraCalculo` (F2B) com campos: codigo, descricao, tributo, idTotvs?, vigIni, vigFim, status ('1'|'2'), codBase, codAliquota, codEscrituracao?, formula, perfProduto, perfOperacao, perfParticipante, perfOrigemDestino
- `TESConfig` expandido com todos os campos SF4 que permanecem (ver REQ-002)
- Remover `StockRule` (conceito legado, não existe no CFGTRIB)
- Manter `FiscalRule` como alias/legado até ser totalmente substituída

**Tabelas Protheus relacionadas:** F20-F26 (Perfis), F27 (RegraBase), F28 (RegraAliquota), CJ2 (RegraEscrituracao), F2B (RegraCalculo)

---

### REQ-002 — TESConfig com campos SF4 de integração

**O quê:** Expandir `TESConfig` para incluir todos os campos SF4 que permanecem ativos para integração com o CFGTRIB
**Por quê:** Documentação TOTVS "Campos que Permanecem no TES" lista campos obrigatórios para que o CFGTRIB funcione corretamente
**Critério de aceite:**
TESConfig deve incluir os campos:
```
// Identificação
codTes, tipo ('E'|'S'), descricao, cfop, cfps?

// Movimentação
atualizaEstoque, entregaFutura, poderTerceiro, atualPrecCompra
matConsumo, ativoCIAP, atualizaAtivo, qtdZerada, vlrZerado
tipOperacao, finalidade, transferFilial

// PIS/COFINS (campos que permanecem)
cstPis, cstCofins, pisCofST
aliqPisMaj?, aliqCofMaj?
tabelaNatRec?, codNatRec?, grpNatRec?
calculaPisCof, creditaPisCof
reducaoBasePis?, reducaoBaseCof?
descontoPisZFM?, descontoCofZFM?
graPis?, graCof?

// Duplicata e financeiro
geraDuplicata, codPagamento?

// Outros
txtPadrao?, tesDevol?, tesPoder3?
```

---

### REQ-003 — Engine: geração de Perfis

**O quê:** `rules-engine.ts` deve exportar funções que geram os 4 tipos de Perfil a partir de `NFeParsed[]`
**Por quê:** Perfis são a primeira camada do CFGTRIB — sem eles, regras de cálculo não podem ser vinculadas
**Critério de aceite:**
- `generatePerfisOperacao(nfs)` → `PerfilOperacao[]` — agrupa CFOPs únicos em perfis por tipo de operação (interna/interestadual/exterior/devolução)
- `generatePerfisOrigemDestino(nfs)` → `PerfilOrigemDestino[]` — cria perfis UF origem × UF destino a partir das NF-es
- `generatePerfisProduto(nfs)` → `PerfilProduto[]` — agrupa produtos por NCM/tipo
- `generatePerfisParticipante(nfs)` → `PerfilParticipante[]` — cria perfil "TODOS" + perfis específicos por tipo (contribuinte/não-contribuinte)
- Para CBS/IBS: sempre gerar perfil "TODOS" (todos produtos, todos CFOPs 000051, todos participantes, todas UFs 000002)

---

### REQ-004 — Engine: geração de Regras Base e Alíquota

**O quê:** Funções que geram `RegraBase[]` (F27) e `RegraAliquota[]` (F28) para cada tributo
**Por quê:** São pré-requisitos para a `RegraCalculo` (F2B). Devem ser geradas antes.
**Critério de aceite:**
- `generateRegrasBase(nfs)` → `RegraBase[]`
  - ICMS: valorOrigem=01 (Valor Mercadoria)
  - IPI: valorOrigem=01 (Valor Mercadoria)  
  - PIS: valorOrigem=01 com fórmula de exclusão do ICMS quando aplicável
  - COFINS: valorOrigem=01 com fórmula de exclusão do ICMS quando aplicável
  - CBS: valorOrigem=11 (Fórmula Manual) → `(O:VAL_MERCADORIA + O:FRETE + O:SEGURO + O:DESPESAS) - (O:DESCONTO + VAL:{codPIS} + VAL:{codCOFINS} + VAL:{codICMS})`
  - IBS: mesma fórmula da CBS
- `generateRegrasAliquota(nfs)` → `RegraAliquota[]`
  - Tributos legados: valorOrigem=04 (Alíquota Manual) com alíquota extraída das NF-es
  - CBS: valorOrigem=04, alíquota=0.9, tipoAliquota='1'
  - IBS: valorOrigem=04, alíquota=0.1, tipoAliquota='1'

---

### REQ-005 — Engine: geração de Regras de Cálculo F2B

**O quê:** Função que gera `RegraCalculo[]` (F2B) completas, vinculando tributo + perfis + regras base/alíquota
**Por quê:** É o produto final do CFGTRIB — o que o analista vai cadastrar no Protheus
**Critério de aceite:**
- `generateRegrasCalculo(nfs)` → `RegraCalculo[]`
- Tributos gerados (nesta ordem): ICMS (ID 000021) → IPI (ID 000022) → PIS (ID 000015) → COFINS (ID 000016) → CBS (ID 000062) → IBS (ID 000060)
- Cada regra tem: vigIni='01/01/2026', vigFim='31/12/2049', status='1' (Em Teste)
- Fórmula padrão: `O:BASE_{tributo} * O:ALIQ_{tributo} / 100`
- CBS e IBS: fórmula referencia VAL:{codPIS} + VAL:{codCOFINS} + VAL:{codICMS} na base
- Perfis CBS/IBS: produto=TODOS, operacao=000051, participante=TODOS, origemdestino=000002
- Cada regra vincula os perfis gerados pelo REQ-003 e as regras base/alíquota do REQ-004

---

### REQ-006 — UI: Nova aba "Configurador"

**O quê:** Adicionar aba "Configurador" ao `TabNav` e criar `ConfiguradorPage.tsx`
**Por quê:** Usuário precisa visualizar as configurações CFGTRIB geradas separadamente das análises fiscais
**Critério de aceite:**
- Nova aba entre "Mapeamento Protheus" e "Sugestões"
- Sub-abas: Perfis | Regras Base | Regras Alíquota | Regras de Cálculo
- Cada sub-aba exibe DataTable com os dados gerados
- Regras de Cálculo mostram badge de status: "Em Teste" (amarelo) | "Aprovada" (verde)
- Aba "Regras de Estoque" em MapeamentoPage removida ou renomeada para "Campos SF4"

---

### REQ-007 — Vitest configurado com testes unitários

**O quê:** Instalar Vitest e criar testes para as funções do engine
**Por quê:** Rules-engine será refatorado — sem testes, risco alto de regressão em regras fiscais
**Critério de aceite:**
- `npm install -D vitest @testing-library/react jsdom` executado
- `vite.config.ts` com bloco `test: { environment: 'jsdom', globals: true }`
- `tsconfig.json` com `"types": ["vitest/globals"]`
- Arquivo `src/lib/__tests__/rules-engine.test.ts` com testes para:
  - `generateTES()` — verifica tipo E/S por tpNF
  - `generateRegrasCalculo()` — verifica ordem ICMS→IPI→PIS→COFINS→CBS→IBS
  - `generateRegrasCalculo()` — verifica que CBS tem alíquota 0.9 e IBS 0.1
  - `generatePerfisOperacao()` — verifica agrupamento de CFOPs
- `npm run test` (ou `npx vitest run`) passa sem erros

---

## Out of Scope

- Regras por NCM (MVA, Pauta) — Etapa 2
- Regras de Ajuste de Lançamento (CJ8/CJ9) — Etapa 3
- Apuração (F2G/F2H/F2I) — Etapa 3
- IndOp para NFS-e — Etapa 3
- Importação CSV no Protheus — pode ser adicionado na Etapa 1 como bônus se houver tempo
