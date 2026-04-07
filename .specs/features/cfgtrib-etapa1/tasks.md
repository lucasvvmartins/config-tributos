# Tasks — CFGTRIB Etapa 1

**Feature:** cfgtrib-etapa1
**Created:** 2026-04-07
**Updated:** 2026-04-07 (v2 — alinhado com design.md v2 e SX3 real)
**Total tasks:** 9

> **IMPORTANTE para sub-agentes:** Ao implementar, consultar **design.md v2** como referência
> canônica para interfaces TypeScript. O design.md v2 contém tabela de mapeamento
> Campo Protheus → Interface TypeScript verificada contra o SX3 real.

---

## TASK-01 — Instalar e configurar Vitest

**Status:** pending
**Priority:** must-do first (gate para todas as tasks seguintes)
**Parallel:** não (pré-requisito)

**What:** Instalar Vitest e configurar ambiente de testes
**Where:**
- `package.json` (devDependencies)
- `vite.config.ts` (bloco test)
- `tsconfig.json` (types vitest/globals)

**Steps:**
1. `npm install -D vitest jsdom`
2. Adicionar ao `vite.config.ts`: `test: { environment: 'jsdom', globals: true }`
3. Adicionar ao `tsconfig.json` compilerOptions: `"types": ["vitest/globals"]`
4. Criar `src/lib/__tests__/` (pasta)
5. Criar `src/lib/__tests__/rules-engine.test.ts` com 1 teste smoke: `it('should be true', () => expect(true).toBe(true))`
6. Verificar: `npx vitest run` passa

**Done when:**
- `npx vitest run` executa sem erros
- `package.json` tem `vitest` em devDependencies

**Gate:** `npx vitest run`

---

## TASK-02 — Refatorar types.ts: novos tipos CFGTRIB

**Status:** pending
**Priority:** critical (bloqueia TASK-03 a TASK-07)
**Depends on:** TASK-01 (Vitest instalado para gate)
**Parallel:** não

**What:** Adicionar interfaces CFGTRIB conforme **design.md v2** (campos verificados contra SX3 real)
**Where:** `src/lib/types.ts`

**Steps:**
1. Adicionar `PerfilProduto` (F20+F24): codigo, descricao, produtos[{codProd}]
2. Adicionar `PerfilOperacao` (F20+F23): codigo, descricao, cfops[{cfop, descricao}]
3. Adicionar `PerfilParticipante` (F20+F22): codigo, descricao, participantes[{tipo:'1'|'2', codPart, loja, razaoSocial?}] — **'1'=Fornecedor, '2'=Cliente**
4. Adicionar `PerfilOrigemDestino` (F20+F21): codigo, descricao, ufs[{ufOrigem, ufDestino}]
5. Adicionar `ValorOrigemBase` ('01'-'11'), `ValorOrigemAliq` ('04'|'05'|'06')
6. Adicionar `RegraBase` (F27): campos individuais desconto/frete/seguro/despesas/icmsDesonerado/icmsRetido (não arrays)
7. Adicionar `RegraAliquota` (F28): sem campo formula (fórmulas ficam na CIN), com reducaoAliquota
8. Adicionar `RegraEscrituracao` (CJ2): incidencia, somaTotal, cstCab, cst, cstCct, cct, indOp, nlivro, incidenciaDevolucao
9. Adicionar `RegraCalculo` (F2B): com codBaseSecundaria, regraFinanceira, regraApuracao, tributoMajoracao
10. Expandir `TESConfig` com campos SF4 verificados (ver design.md v2 — inclui ICMS, IPI, PIS/COFINS, ISS, ICMS-ST, DIFAL)
11. Remover interface `StockRule`
12. Manter `FiscalRule` (ainda usada em MapeamentoPage — remoção na TASK-08)
13. Verificar: `npm run build` sem erros de tipo

> **IMPORTANTE:** Copiar interfaces exatamente do design.md v2. NÃO consultar spec.md v1 para campos.

**Done when:**
- `npm run build` passa (sem erros TypeScript)
- Todos os tipos listados no design.md v2 existem em types.ts
- `StockRule` removida
- `PerfilParticipante.tipo` usa '1'|'2' (não 'C'|'F')

**Gate:** `npm run build`

---

## TASK-03 — Engine: generatePerfis*

**Status:** pending
**Depends on:** TASK-02
**Parallel:** não (depende dos tipos)

**What:** Implementar as 4 funções de geração de Perfis no rules-engine.ts
**Where:** `src/lib/rules-engine.ts`

**Steps:**
1. Adicionar imports dos novos tipos (design.md v2) no topo do arquivo
2. Implementar `generatePerfisOperacao(nfs: NFeParsed[]): PerfilOperacao[]`
   - Agrupa CFOPs únicos das NF-es
   - Cria perfis com array de `{cfop, descricao}` (estrutura F23)
   - Perfis: "Operações Internas" (CFOPs 5xxx), "Interestaduais" (6xxx), "Entradas" (1xxx/2xxx), "Devoluções"
   - Para CBS/IBS: inclui perfil "000051 - TODOS OS CFOPS"
3. Implementar `generatePerfisOrigemDestino(nfs: NFeParsed[]): PerfilOrigemDestino[]`
   - Extrai pares UF origem × UF destino únicos (estrutura F21)
   - Adiciona perfil "000002 - Todas as UFS"
4. Implementar `generatePerfisProduto(nfs: NFeParsed[]): PerfilProduto[]`
   - Agrupa produtos por NCM com array de `{codProd}` (estrutura F24)
   - Adiciona perfil "TODOS" para CBS/IBS
5. Implementar `generatePerfisParticipante(nfs: NFeParsed[]): PerfilParticipante[]`
   - Perfil "TODOS" (tipo='1'+'2', codPart=TODOS, loja=ZZ) — **tipo '1'=Fornecedor, '2'=Cliente**
   - Perfil por tipo de participante se identificável (estrutura F22)
6. Exportar todas as funções

**Done when:**
- 4 funções exportadas em rules-engine.ts
- `npm run build` passa

**Gate:** `npm run build && npx vitest run`

---

## TASK-04 — Engine: generateRegrasBase e generateRegrasAliquota

**Status:** pending
**Depends on:** TASK-03
**Parallel:** não

**What:** Implementar geração de RegraBase[] e RegraAliquota[] para todos os tributos
**Where:** `src/lib/rules-engine.ts`

**Steps:**
1. Implementar `generateRegrasBase(nfs: NFeParsed[]): RegraBase[]`
   - ICMS: valorOrigem='01', ações individuais (desconto/frete/seguro/despesas) conforme cenário
   - IPI: valorOrigem='01'
   - PIS: valorOrigem='01', verificar se NF-es têm exclusão ICMS (CST PIS 01/02) → fórmula via CIN
   - COFINS: idem PIS
   - CBS: valorOrigem='11' (Fórmula Manual), fórmula gravada via CIN (ver design.md v2 seção CBS/IBS Formula)
   - IBS: idem CBS
   - **NOTA:** Campos são individuais (desconto, frete, seguro, despesas, icmsDesonerado, icmsRetido), NÃO arrays
2. Implementar `generateRegrasAliquota(nfs: NFeParsed[]): RegraAliquota[]`
   - Para cada alíquota única extraída das NF-es: criar RegraAliquota
   - CBS: aliquota=0.9, tipoAliquota='1', valorOrigem='04'
   - IBS: aliquota=0.1, tipoAliquota='1', valorOrigem='04'
   - **NOTA:** F28 não tem campo formula. Fórmulas de alíquota ficam na tabela CIN (fora do escopo Etapa 1)
3. Exportar ambas as funções

**Done when:**
- 2 funções exportadas
- CBS tem alíquota 0.9, IBS tem 0.1
- `npm run build` passa

**Gate:** `npm run build && npx vitest run`

---

## TASK-05 — Engine: generateRegrasCalculo

**Status:** pending
**Depends on:** TASK-04
**Parallel:** não

**What:** Implementar `generateRegrasCalculo(nfs)` que gera RegrasCalculo[] F2B completas
**Where:** `src/lib/rules-engine.ts`

**Steps:**
1. Implementar `generateRegrasCalculo(nfs: NFeParsed[]): RegraCalculo[]`
2. Gerar na ordem: ICMS (000021) → IPI (000022) → PIS (000015) → COFINS (000016) → CBS (000062) → IBS (000060)
3. Cada regra: vigIni='01/01/2026', vigFim='31/12/2049', status='1'
4. Vincular: codBase, codAliquota gerados pelas funções anteriores
5. Fórmula CBS/IBS: usar VAL:{codPIS} e VAL:{codCOFINS} dos códigos gerados no mesmo array
6. Exportar função

**Done when:**
- Função exportada
- Array resultante tem regras na ordem correta
- CBS e IBS referenciam corretamente PIS, COFINS, ICMS
- `npm run build` passa

**Gate:** `npm run build && npx vitest run`

---

## TASK-06 — Testes unitários rules-engine

**Status:** pending
**Depends on:** TASK-05
**Parallel:** não

**What:** Escrever testes unitários para as funções do engine
**Where:** `src/lib/__tests__/rules-engine.test.ts`

**Steps:**
1. Criar helper `mockNFe(overrides)` para gerar NFeParsed mínima
2. Testar `generateTES()`:
   - NF de saída (tpNF='1') → TES com tipo='S'
   - NF de entrada (tpNF='0') → TES com tipo='E'
3. Testar `generateRegrasCalculo()`:
   - Verifica ordem: códigos gerados contêm ICMS antes de CBS
   - CBS tem idTotvs='000062' e alíquota=0.9 na RegraAliquota correspondente
   - IBS tem idTotvs='000060' e alíquota=0.1
4. Testar `generatePerfisOperacao()`:
   - CFOPs 5xxx geram perfil de saída
   - CFOPs 6xxx geram perfil interestadual
5. Verificar: `npx vitest run` passa com todos os testes verdes

**Done when:**
- Mínimo 6 testes passando
- Nenhum teste falhando
- `npx vitest run` retorna verde

**Gate:** `npx vitest run`

---

## TASK-07 — AppStore: adicionar novos estados

**Status:** pending
**Depends on:** TASK-05
**Parallel:** pode rodar com TASK-06 [P]

**What:** Atualizar useAppStore.tsx para incluir os novos dados CFGTRIB no estado global
**Where:** `src/hooks/useAppStore.tsx`

**Steps:**
1. Adicionar ao `AppState`:
   - `perfisOperacao: PerfilOperacao[]`
   - `perfisOrigemDestino: PerfilOrigemDestino[]`
   - `perfisProduto: PerfilProduto[]`
   - `perfisParticipante: PerfilParticipante[]`
   - `regrasBase: RegraBase[]`
   - `regrasAliquota: RegraAliquota[]`
   - `regrasCalculo: RegraCalculo[]`
2. Inicializar com arrays vazios no `useState`
3. Adicionar ao `clearFiles()` (reset para arrays vazios)
4. Adicionar ao `processFiles()` as 7 chamadas ao engine
5. Remover `stockRules` do state (TASK-08 finaliza isso)

**Done when:**
- `npm run build` passa sem erros de tipo
- Todos os 7 novos campos no AppState

**Gate:** `npm run build`

---

## TASK-08 — UI: ConfiguradorPage + atualizar MapeamentoPage

**Status:** pending
**Depends on:** TASK-07
**Parallel:** não

**What:** Criar ConfiguradorPage e atualizar MapeamentoPage removendo aba Estoque
**Where:**
- `src/pages/ConfiguradorPage.tsx` (criar)
- `src/pages/MapeamentoPage.tsx` (modificar)
- `src/components/layout/TabNav.tsx` (modificar)
- `src/App.tsx` (modificar)

**Steps:**
1. Criar `ConfiguradorPage.tsx` com sub-abas:
   - "Perfis" → 4 sub-abas: Produto / Operação / Participante / Origem-Destino
   - "Regras Base" → DataTable de RegraBase
   - "Regras Alíquota" → DataTable de RegraAliquota
   - "Regras de Cálculo" → DataTable de RegraCalculo com badge status (Em Teste=amarelo, Aprovada=verde)
2. Adicionar aba em `TabNav.tsx`: `{ id: "configurador", label: "Configurador CFGTRIB", icon: Settings2 }`
3. Adicionar renderização em `App.tsx`: `{activeTab === "configurador" && <ConfiguradorPage />}`
4. Em `MapeamentoPage.tsx`:
   - Remover sub-aba `{ id: "estoque", ... }`
   - Renomear sub-aba "fiscal" para "Campos SF4" (ou remover se já não faz sentido)
   - Atualizar imports para não importar `StockRule`

**Done when:**
- Aba "Configurador CFGTRIB" aparece no TabNav
- Sub-abas de Perfis e Regras renderizam os dados do store
- Aba "Regras de Estoque" removida do MapeamentoPage
- `npm run build` passa

**Gate:** `npm run build && npx vitest run`

---

## TASK-09 — Commit e verificação final

**Status:** pending
**Depends on:** TASK-08
**Parallel:** não

**What:** Gate check final, commit atômico e push
**Where:** git

**Steps:**
1. `npm run lint` — zero warnings/errors
2. `npm run build` — build sem erros
3. `npx vitest run` — todos os testes verdes
4. `git add -p` — revisar cada mudança
5. Commit: `feat: implementar tipos e engine CFGTRIB Etapa 1 (Perfis + Regras F2B + CBS/IBS)`
6. `git push origin main`

**Done when:**
- Commit criado com mensagem descritiva
- Pipeline verde (lint + build + tests)

**Gate:** `npm run lint && npm run build && npx vitest run`

---

## Dependency Graph

```
TASK-01 (Vitest)
    └─→ TASK-02 (types.ts)
            └─→ TASK-03 (generatePerfis)
                    └─→ TASK-04 (generateRegrasBase/Aliquota)
                            └─→ TASK-05 (generateRegrasCalculo)
                                    ├─→ TASK-06 (testes) [P]
                                    └─→ TASK-07 (AppStore) [P]
                                                └─→ TASK-08 (UI)
                                                        └─→ TASK-09 (commit)
```

**[P]** = pode rodar em paralelo com outra task marcada [P]

---

## Progress Tracker

| Task    | Status  | Gate              |
|---------|---------|-------------------|
| TASK-01 | pending | vitest run        |
| TASK-02 | pending | npm run build     |
| TASK-03 | pending | build + vitest    |
| TASK-04 | pending | build + vitest    |
| TASK-05 | pending | build + vitest    |
| TASK-06 | pending | vitest run        |
| TASK-07 | pending | npm run build     |
| TASK-08 | pending | build + vitest    |
| TASK-09 | pending | lint+build+vitest |
