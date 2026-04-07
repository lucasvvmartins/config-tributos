# Roadmap

## Etapa 1 — Fundação CFGTRIB (ATUAL)

**Status:** Especificação em andamento
**Objetivo:** Substituir o modelo legado SF4/TES por tipos e engine alinhados com o CFGTRIB real

### Features
- [ ] FEAT-01: Refatorar `types.ts` com tipos CFGTRIB completos
- [ ] FEAT-02: Instalar e configurar Vitest
- [ ] FEAT-03: Testes unitários para rules-engine (cobertura dos geradores principais)
- [ ] FEAT-04: Atualizar engine para gerar Perfis reais (F20-F26)
- [ ] FEAT-05: Atualizar engine para gerar Regras Base (F27) e Alíquota (F28)
- [ ] FEAT-06: Atualizar engine para gerar Regras de Cálculo F2B (ICMS, IPI, PIS, COFINS, CBS, IBS)
- [ ] FEAT-07: Nova aba "Configurador" com sub-abas Perfis / Regras
- [ ] FEAT-08: Remover aba "Regras de Estoque" / refatorar campos SF4 de integração
- [ ] FEAT-09: Exportação CSV no formato F2B

---

## Etapa 2 — Regras Avançadas

**Status:** Planejado
**Objetivo:** Suporte a cenários tributários complexos

### Features
- [ ] Regras por NCM (MVA, Pauta, Ex-tarifário)
- [ ] ICMS-ST completo com MVA e Pauta
- [ ] DIFAL base dupla e base simples
- [ ] Redução de base de cálculo
- [ ] Diferimento total e parcial
- [ ] Crédito presumido de ICMS
- [ ] Fundo de combate à pobreza (FECP)
- [ ] Zona Franca de Manaus (ZFM)

---

## Etapa 3 — Tributos Especiais

**Status:** Planejado
**Objetivo:** Tributos menos comuns e obrigações acessórias

### Features
- [ ] INSS sobre folha e serviços
- [ ] IRPF tabela progressiva
- [ ] CIDE
- [ ] FUNRURAL
- [ ] ISS por código de serviço municipal
- [ ] Regras de Ajuste de Lançamento (SPED C195/C197)
- [ ] Apuração (F2G/F2H/F2I)
- [ ] IndOp para NFS-e (IBS/CBS)
