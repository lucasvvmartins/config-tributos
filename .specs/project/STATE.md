# Project State

**Last updated:** 2026-04-07
**Current phase:** Especificação completa — pronto para execução
**Next action:** Nova conversa → executar TASK-01 a TASK-09 de `.specs/features/cfgtrib-etapa1/tasks.md`

### Session Handoff
**Sessão anterior:** Pesquisa e documentação (esta sessão)
**O que foi feito:**
1. Mapeamento v2.0 reescrito do zero com verificação contra SX3/SX6/SX7/SX9 reais
2. design.md v2 revisado — 9 divergências de tipos corrigidas contra campos reais
3. spec.md v2 — REQs alinhados com design v2
4. tasks.md v2 — Steps alinhados, notas para sub-agentes
5. 40+ tabelas CFGTRIB mapeadas (lista oficial TOTVS verificada)
6. Regras Financeiras documentadas (20 tabelas FKK/FKL/etc.)
7. 14 decisões registradas, 6 lições aprendidas
8. Referências: 75 PDFs config + 44 PDFs extra + planilhas de implementação real

**Para a próxima sessão:**
- Carregar: `STATE.md` + `design.md` v2 + `tasks.md` v2
- Executar TASK-01 a TASK-09 na ordem do dependency graph
- TASK-06 e TASK-07 podem rodar em paralelo [P]
- Gate final: `npm run lint && npm run build && npx vitest run`
- A documentação é auto-suficiente — não depende do contexto desta conversa

---

## Decisions

### DEC-001 — Usar Spec-Driven Development (SDD)
**Date:** 2026-04-07
**Decision:** Adotar skill `tlc-spec-driven` antes de qualquer implementação da Etapa 1
**Reason:** Tipos CFGTRIB são complexos (5 camadas) e errar o contrato de tipos propaga bugs em cascata por todo o projeto
**Impact:** Criar documentos .specs/ antes de tocar em código

### DEC-002 — Vitest como framework de testes
**Date:** 2026-04-07
**Decision:** Vitest (não Jest) por integração nativa com Vite
**Reason:** Zero config adicional, API compatível com Jest, suporte a ESM nativo
**Impact:** Instalar como parte da Etapa 1 antes de refatorar rules-engine

### DEC-003 — Remover StockRule, manter campos SF4 de integração
**Date:** 2026-04-07
**Decision:** `StockRule` será removida. Campos SF4 que permanecem (F4_DUPLIC, F4_ESTOQUE, etc.) serão modelados em `TESConfig` expandido
**Reason:** `StockRule` não existe no CFGTRIB. Os campos SF4 de integração são listados na documentação TOTVS "Campos que Permanecem no TES"
**Impact:** Aba "Regras de Estoque" será removida do MapeamentoPage

### DEC-004 — Ordem de geração CBS/IBS
**Date:** 2026-04-07
**Decision:** CBS (ID 000062) e IBS (ID 000060) sempre gerados DEPOIS de ICMS, PIS e COFINS
**Reason:** Fórmula base CBS/IBS referencia VAL:Pxxxxx + VAL:Cxxxxx + VAL:Ixxxxx (valores calculados pelos outros tributos). Dependência de ordem confirmada na documentação Central TOTVS.
**Impact:** Engine deve gerar regras na ordem: ICMS → IPI → PIS → COFINS → CBS → IBS

### DEC-005 — Alíquotas CBS/IBS para 2026
**Date:** 2026-04-07
**Decision:** CBS Federal = 0,9% | IBS Estadual = 0,1% (alíquotas iniciais de transição)
**Reason:** Confirmado na documentação "Como configurar CBS/IBS no Configurador de Tributos" (Central TOTVS, jan/2026)
**Impact:** Engine usa essas alíquotas como padrão, permitindo override manual

### DEC-006 — Perfis padrão para CBS/IBS
**Date:** 2026-04-07
**Decision:** Usar perfis de abrangência total para CBS/IBS: todos produtos, todos CFOPs (000051), todos participantes, todas UFs (000002)
**Reason:** CBS/IBS incide sobre todas as operações — sem exceção por produto/participante na carga inicial
**Impact:** Engine gera perfis "TODOS" para CBS/IBS automaticamente

### DEC-007 — Clientes greenfield (implementação do zero)
**Date:** 2026-04-07
**Decision:** Todos os clientes que serão testados são newname — Protheus implementado do zero na versão mais atual
**Reason:** Elimina preocupações com legado CDA, versões antigas, e coexistência de configuradores
**Impact:** Sem necessidade de verificar versão mínima ou migração de dados. CFGTRIB é o único configurador ativo.

### DEC-008 — SX3 como fonte de verdade para campos Protheus
**Date:** 2026-04-07
**Decision:** Todo campo ou parâmetro documentado deve existir no SX3/SX6 real exportado do Protheus
**Reason:** Mapeamento v1.0 continha campos fabricados (B1_TESSION, MV_TESSION, etc.) que não existem no dicionário real
**Impact:** Mapeamento v2.0 reescrito integralmente com verificação SX3. Nenhum campo não-verificado.

### DEC-009 — CDA/CDH não são o Configurador de Tributos
**Date:** 2026-04-07
**Decision:** As tabelas CDA/CDH no SX3 real são "Lançamentos documento fiscal" e "Histórico fiscal", NÃO o Configurador de Tributos
**Reason:** Mapeamento v1.0 documentava CDA/CDH como FISA170 com campos fabricados (CDA_CODTRI, CDA_TPTRIB, CDH_TPEXCE, etc.)
**Impact:** O CFGTRIB real usa F20/F21/F22/F23 (Perfis) + F27/F28 (Base/Alíquota) + CJ2 (Escrituração) + F2B (Regras) + CIN (Incidências)

### DEC-010 — Exportação JSON como contrato de integração web → ADVPL
**Date:** 2026-04-07
**Decision:** A ferramenta web exporta JSON estruturado com as regras geradas. O programa ADVPL lê e aplica — não recalcula.
**Reason:** Evitar divergência de lógica entre TypeScript (web) e ADVPL (Protheus). O analista valida na web, ADVPL aplica exatamente o que foi validado.
**Impact:** Exportação JSON/CSV não é bônus — é o contrato de integração entre as duas fases do projeto.

### DEC-012 — Formato de exportação: planilha CFGTRIB simplificada
**Date:** 2026-04-07
**Decision:** A ferramenta web exportará Excel no mesmo formato de abas da planilha de apoio TOTVS (Perfil Produto, Perfil Operação, Perfil Participantes, Regra Base, Alíquota, Escrituração, Regra de Cálculo), porém com linguagem simplificada para analistas não-fiscais. Valores já preenchidos pela engine, descrições expandidas em português claro, sem códigos internos expostos.
**Reason:** Analistas Protheus comuns não são especialistas fiscais. A planilha original usa termos como "Valor Origem 01", "CIN_TREGRA", "Incidência 1-Tributado" que são incompreensíveis sem conhecimento fiscal. A ferramenta existe justamente para eliminar essa dependência.
**Impact:** Engine gera dados já traduzidos. Cada aba terá colunas descritivas adicionais. O JSON de integração com ADVPL mantém códigos internos, mas a planilha para o analista mostra a versão humanizada.

### DEC-013 — Referência de implementação real disponível (cliente Agenor)
**Date:** 2026-04-07
**Decision:** A planilha preenchida do cliente Agenor (`Estrutura/NAO COMPARTILHAR COM CLIENTE - estrutura fisa170 AgenorTabelas preenchidas.xlsx`) será usada como referência para validar a engine — comparando output da ferramenta com configuração real implementada.
**Reason:** Ter um caso real com TES, perfis, regras base/alíquota/escrituração/cálculo preenchidos permite testar se a engine gera resultados compatíveis com o que um analista fiscal configuraria manualmente.
**Impact:** Não expor dados do cliente na ferramenta. Usar apenas como fixture de teste e validação.

### DEC-014 — Tabelas IndOp e cClassTrib IBS/CBS como dados de referência
**Date:** 2026-04-07
**Decision:** Os anexos IndOp (AnexoVII — 35 registros) e cClassTrib (Nov/2025 — ~1000 registros) serão incorporados como tabelas de referência na engine para geração automática de CJ2_INDOP, CJ2_CSTCCT, CJ2_CCT para tributos IBS/CBS.
**Reason:** São tabelas oficiais da reforma tributária. Sem elas, o analista teria que consultar a LC 214/25 manualmente para cada operação.
**Impact:** Etapa 1 usa valores padrão simples. Etapa 2+ pode incorporar a correlação NBS × IndOp × cClassTrib para serviços.

### DEC-011 — Fase ADVPL: tela customizada com validação item a item
**Date:** 2026-04-07
**Decision:** Programa ADVPL será tela customizada (não modifica telas nativas) que importa XML, exibe sugestões, e ao confirmar aplica nas tabelas CFGTRIB
**Reason:** Não modificar telas nativas garante compatibilidade com upgrades TOTVS
**Impact:** Necessário mapear funções públicas da FISA170 para gravação programática antes de implementar

---

## Blockers

Nenhum blocker ativo.

---

## Lessons Learned

### LESS-001 — Documentação CFGTRIB disponível localmente
**Date:** 2026-04-07
**Lesson:** 75 PDFs da documentação CFGTRIB (TDN + Central TOTVS) estão em `/Users/lucasvieira/Documentacao Config/`. Dicionários SX em `/Users/lucasvieira/Documentacao Tabelas/`.
**Apply:** Sempre consultar os PDFs locais e SXs antes de assumir comportamento do Protheus

### LESS-004 — Mapeamento v1.0 continha campos fabricados
**Date:** 2026-04-07
**Lesson:** O mapeamento-rotinas.md v1.0 foi gerado por modelo sem verificação contra SX3 real. Campos como B1_TESSION, MV_TESSION, CDA_CODTRI, CDH_TPEXCE, BZ_CSTPIS não existem. A tabela SBZ é de estoque (não NCM fiscal).
**Apply:** NUNCA documentar campos sem verificar no SX3. Todo campo deve ter linha correspondente no sx30101.

### LESS-005 — F20 é tabela cabecalho unificada de perfis
**Date:** 2026-04-07
**Lesson:** No CFGTRIB real, F20 é a tabela cabecalho de TODOS os perfis. O campo F20_TIPO (01/02/03/04) determina qual tabela detalhe usar (F21/F22/F23/F24). Isso difere do design.md atual que tem tipos separados.
**Apply:** O design.md precisa ser revisado — PerfilProduto, PerfilOperacao, etc. devem refletir a estrutura F20+F2x real.

### LESS-002 — pdfplumber disponível para extração de PDFs
**Date:** 2026-04-07
**Lesson:** `python3 -c "import pdfplumber"` funciona após `pip3 install pdfplumber`. Útil para ler PDFs programaticamente.
**Apply:** Usar quando precisar ler documentação PDF em sessões futuras

### LESS-003 — nvm não carregado automaticamente no shell
**Date:** 2026-04-07
**Lesson:** Node.js instalado via nvm não está no PATH padrão. Requer `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"` ou `.zshrc` configurado.
**Apply:** `.zshrc` já criado com a configuração correta. Novos terminais devem funcionar automaticamente.

### LESS-006 — Lista oficial TOTVS de tabelas CFGTRIB como checklist
**Date:** 2026-04-07
**Lesson:** O documento "Quais tabelas fazem parte do Configurador de Tributos?" (Central TOTVS, nov/2025) lista 40 tabelas oficiais. Comparar com o mapeamento revelou 6 tabelas faltantes (F2A, F2F, F2K, F2L, F2M, F2N, CJL). Nenhuma impacta Etapa 1 (são de apuração/financeiro), mas F2F e F2N são relevantes para a fase ADVPL.
**Apply:** Sempre cruzar mapeamento com listas oficiais TOTVS antes de considerar completo. Documento em `Documentacao Extra/`.

---

## Deferred Ideas

- **Simulador de operação:** Dado um produto + CFOP + UF, simular qual regra de cálculo seria aplicada (similar ao Simulador do Protheus FISA170)
- **Importação direta no Protheus:** Via API REST do Protheus (requer backend — Etapa futura)
- **Validação de regras em cadeia:** Alertar quando regra CBS/IBS referencia tributos ainda não configurados
- **Compartilhamento multi-filial:** Suporte a cenário onde filiais têm regras diferentes
- **Exportação Excel (DEC-012):** Feature separada pós-Etapa 1 — formato planilha de apoio TOTVS simplificado
- **Regras Financeiras (motor de retenções):** Tabelas FKK/FKL/FKN/FKO/FKP mapeadas, implementação na Etapa 3

---

## Preferences

- Respostas concisas, sem reintrodução de contexto já conhecido
- Commits atômicos por feature
- Português para comentários de código e documentação do projeto
