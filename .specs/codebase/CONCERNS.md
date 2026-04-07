# Concerns

## [HIGH] TESConfig e tipos fiscais não refletem estrutura real do CFGTRIB

**Evidence:** `src/lib/types.ts` — `TESConfig` tem 9 campos simples (codTes, tipo, cfop...). A estrutura real do Protheus FISA170 requer: 4 Perfis (F20-F26), RegraBase (F27), RegraAliquota (F28), RegraEscrituracao (CJ2), RegraCalculo (F2B com ~15 campos), status Em Teste/Aprovada.

**Risk:** O engine gera configurações incompatíveis com o Protheus real — dados exportados não podem ser importados diretamente.

**Fix:** Refatorar `types.ts` com tipos CFGTRIB completos como parte da Etapa 1 (ver `features/cfgtrib-etapa1/spec.md`).

---

## [HIGH] Sem testes automatizados

**Evidence:** `package.json` não tem Vitest nem qualquer framework de teste. Nenhum arquivo `*.test.ts` existe.

**Risk:** Refatorações em `rules-engine.ts` (1298 linhas) sem cobertura de testes podem introduzir regressões silenciosas em regras fiscais críticas.

**Fix:** Instalar Vitest e criar testes unitários para `rules-engine.ts` como gate obrigatório na Etapa 1.

---

## [HIGH] `StockRule` é conceito legado SF4, não existe no CFGTRIB

**Evidence:** `src/lib/types.ts` — interface `StockRule` com campos `atualizaEstoque`, `geraDuplicata`, `poderTerceiro`. Esses campos pertencem ao TES legado (SF4/MATA080). No CFGTRIB (FISA170), controle de estoque não é gerenciado por regras de cálculo.

**Risk:** Aba "Regras de Estoque" em `MapeamentoPage.tsx` gera confusão — usuário Protheus moderno não encontrará essa configuração no CFGTRIB.

**Fix:** Remover `StockRule` ou refatorar como campos SF4 de integração (campos que permanecem no TES conforme documentação TOTVS).

---

## [MEDIUM] `FiscalRule` não reflete campos reais de regra fiscal

**Evidence:** `src/lib/types.ts` — `FiscalRule` tem apenas `pICMS`, `pIPI`, `pPIS`, `pCOFINS`. Regra real (F2B) requer: tributo, vigência, status, perfis (produto/operação/participante/origemDestino), fórmula de cálculo.

**Risk:** Dados exibidos na aba "Regras Fiscais" são incompletos para uso no Protheus.

**Fix:** Substituir por `RegraCalculo` com campos F2B completos na Etapa 1.

---

## [MEDIUM] CBS/IBS presentes no parser mas ausentes no engine

**Evidence:** `types.ts` tem `ImpostoIBSCBS` e `xml-parser.ts` parseia `ibscbs`. Mas `rules-engine.ts` não gera regras CBS/IBS — `generateTES()` e `generateFiscalRules()` ignoram esses campos.

**Risk:** XMLs com IBS/CBS (obrigatório a partir de 2026) são parseados corretamente mas não geram sugestões de configuração CFGTRIB.

**Fix:** Adicionar geração de regras CBS (ID 000062) e IBS (ID 000060) no engine na Etapa 1.

---

## [LOW] `rules-engine.ts` com 1298 linhas sem divisão modular

**Evidence:** Arquivo único com tabela CFOP (130+ entradas), tabela TPAG, sets de CFOPs, e todas as funções `generate*()`.

**Risk:** Difícil manutenção e teste. Qualquer alteração afeta todo o arquivo.

**Fix:** Considerar split em módulos na Etapa 2 (`cfop-table.ts`, `generators/`, etc.). Não bloqueia Etapa 1.

---

## [HIGH] Mapeamento v1.0 continha campos e tabelas fabricados

**Evidence:** Verificação contra SX3 real revelou que campos como `B1_TESSION`, `MV_TESSION`, `CDA_CODTRI`, `CDH_TPEXCE` não existem. A tabela CDA real é "Lançamentos documento fiscal", não Configurador de Tributos. SBZ é de estoque, não NCM fiscal.

**Risk:** Qualquer código baseado no mapeamento v1.0 referenciaria campos inexistentes — causando erros em runtime na fase ADVPL.

**Fix:** Mapeamento v2.0 já reescrito com verificação SX3 (07/04/2026). Regra: NUNCA referenciar campos sem verificar no sx30101.

---

## [MEDIUM] Design.md v1 tinha divergências com campos reais

**Evidence:** PerfilParticipante.tipo era 'C'|'F' (correto: '1'|'2'). RegraBase.adicoes/deducoes eram arrays (correto: campos individuais F27_DESCON/FRETE/SEGURO/DESPE). RegraAliquota.formula não existe (fórmulas ficam em CIN).

**Risk:** Tipos TypeScript gerariam dados incompatíveis com as tabelas reais do Protheus.

**Fix:** Design.md v2 revisado contra SX3 real (07/04/2026). Tabela de mapeamento campo→interface incluída.

---

## [LOW] Navegação por abas usa string literal sem type safety

**Evidence:** `TabNav.tsx` — array `tabs` com `id` como string. `App.tsx` compara `activeTab === "upload"` etc.

**Risk:** Typo em ID de aba causa aba em branco silenciosamente.

**Fix:** Extrair tipo `TabId = "upload" | "visao" | ...` em `types.ts`. Baixa prioridade.
