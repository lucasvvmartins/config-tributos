# Project State

**Last updated:** 2026-04-07
**Current phase:** Especificação da Etapa 1 (SDD — tlc-spec-driven)
**Next action:** Criar spec.md + design.md + tasks.md da feature cfgtrib-etapa1

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

---

## Blockers

Nenhum blocker ativo.

---

## Lessons Learned

### LESS-001 — Documentação CFGTRIB disponível localmente
**Date:** 2026-04-07
**Lesson:** 76+ PDFs da documentação CFGTRIB (TDN + Central TOTVS) estão em `/Users/lucasvieira/` e Downloads/. Incluem exemplos práticos de cada cálculo.
**Apply:** Sempre consultar os PDFs locais antes de assumir comportamento do Protheus

### LESS-002 — pdfplumber disponível para extração de PDFs
**Date:** 2026-04-07
**Lesson:** `python3 -c "import pdfplumber"` funciona após `pip3 install pdfplumber`. Útil para ler PDFs programaticamente.
**Apply:** Usar quando precisar ler documentação PDF em sessões futuras

### LESS-003 — nvm não carregado automaticamente no shell
**Date:** 2026-04-07
**Lesson:** Node.js instalado via nvm não está no PATH padrão. Requer `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"` ou `.zshrc` configurado.
**Apply:** `.zshrc` já criado com a configuração correta. Novos terminais devem funcionar automaticamente.

---

## Deferred Ideas

- **Simulador de operação:** Dado um produto + CFOP + UF, simular qual regra de cálculo seria aplicada (similar ao Simulador do Protheus FISA170)
- **Importação direta no Protheus:** Via API REST do Protheus (requer backend — Etapa futura)
- **Validação de regras em cadeia:** Alertar quando regra CBS/IBS referencia tributos ainda não configurados
- **Compartilhamento multi-filial:** Suporte a cenário onde filiais têm regras diferentes

---

## Preferences

- Respostas concisas, sem reintrodução de contexto já conhecido
- Commits atômicos por feature
- Português para comentários de código e documentação do projeto
