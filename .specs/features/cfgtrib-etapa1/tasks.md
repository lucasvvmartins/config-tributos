# Tasks — CFGTRIB Etapa 1

**Feature:** cfgtrib-etapa1
**Created:** 2026-04-07
**Total tasks:** 9

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

**What:** Adicionar interfaces CFGTRIB e expandir TESConfig conforme design.md
**Where:** `src/lib/types.ts`

**Steps:**
1. Adicionar `PerfilProduto`, `PerfilOperacao`, `PerfilParticipante`, `PerfilOrigemDestino`
2. Adicionar `ValorOrigemBase`, `ValorOrigemAliq` (type unions)
3. Adicionar `RegraBase`, `RegraAliquota`, `RegraEscrituracao`
4. Adicionar `RegraCalculo`
5. Expandir `TESConfig` com todos os campos SF4 (ver design.md seção TESConfig)
6. Remover interface `StockRule`
7. Manter `FiscalRule` (ainda usada em MapeamentoPage — remoção na TASK-08)
8. Verificar: `npm run build` sem erros de tipo

**Done when:**
- `npm run build` passa (sem erros TypeScript)
- Todos os tipos listados no design.md existem em types.ts
- `StockRule` removida

**Gate:** `npm run build`

---

## TASK-03 — Engine: generatePerfis*

**Status:** pending
**Depends on:** TASK-02
**Parallel:** não (depende dos tipos)

**What:** Implementar as 4 funções de geração de Perfis no rules-engine.ts
**Where:** `src/lib/rules-engine.ts`

**Steps:**
1. Adicionar imports dos novos tipos no topo do arquivo
2. Implementar `generatePerfisOperacao(nfs: NFeParsed[]): PerfilOperacao[]`
   - Agrupa CFOPs únicos
   - Cria perfis: "Operações Internas" (CFOPs 5xxx), "Operações Interestaduais" (6xxx), "Entradas" (1xxx/2xxx), "Devoluções"
   - Para CBS/IBS: inclui perfil "000051 - TODOS OS CFOPS"
3. Implementar `generatePerfisOrigemDestino(nfs: NFeParsed[]): PerfilOrigemDestino[]`
   - Extrai pares UF origem × UF destino únicos das NF-es
   - Adiciona perfil "000002 - Todas as UFS"
4. Implementar `generatePerfisProduto(nfs: NFeParsed[]): PerfilProduto[]`
   - Agrupa produtos por NCM
   - Adiciona perfil "TODOS" para CBS/IBS
5. Implementar `generatePerfisParticipante(nfs: NFeParsed[]): PerfilParticipante[]`
   - Perfil "TODOS" (tipo C+F, codPart=TODOS, loja=ZZ)
   - Perfil por tipo de participante se identificável
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
   - ICMS: valorOrigem='01', sem fórmula
   - IPI: valorOrigem='01', sem fórmula
   - PIS: valorOrigem='01', verificar se NF-es têm exclusão ICMS (CST PIS 01/02)
   - COFINS: idem PIS
   - CBS: valorOrigem='11', fórmula com operandos legados (ver design.md)
   - IBS: idem CBS
2. Implementar `generateRegrasAliquota(nfs: NFeParsed[]): RegraAliquota[]`
   - Para cada alíquota única extraída das NF-es: criar RegraAliquota
   - CBS: aliquota=0.9, tipoAliquota='1'
   - IBS: aliquota=0.1, tipoAliquota='1'
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
