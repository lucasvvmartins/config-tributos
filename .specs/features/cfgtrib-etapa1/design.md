# Design — CFGTRIB Etapa 1

**Feature:** cfgtrib-etapa1
**Created:** 2026-04-07
**Updated:** 2026-04-07 (v2 — revisado contra SX3 real)

---

## Architecture Overview

```
NFeParsed[]
    │
    ├─→ generatePerfisOperacao()    → PerfilOperacao[]
    ├─→ generatePerfisOrigemDestino() → PerfilOrigemDestino[]
    ├─→ generatePerfisProduto()     → PerfilProduto[]
    ├─→ generatePerfisParticipante() → PerfilParticipante[]
    │
    ├─→ generateRegrasBase()        → RegraBase[]
    ├─→ generateRegrasAliquota()    → RegraAliquota[]
    │
    └─→ generateRegrasCalculo()     → RegraCalculo[]
              │ (referencia perfis + regras base/alíquota acima)
              └─→ ordem: ICMS → IPI → PIS → COFINS → CBS → IBS
```

---

## Data Model (types.ts)

> **Nota v2:** Tipos revisados contra campos reais do SX3. Divergências da v1 corrigidas.
> A estrutura real do Protheus usa F20 como cabeçalho unificado de perfis (F20_TIPO
> determina qual tabela detalhe usar). Nesta aplicação web, mantemos interfaces
> separadas por tipo de perfil para clareza de código, mas os campos refletem as
> tabelas reais F21/F22/F23/F24.

### Perfis

```typescript
// F20_TIPO='04' + F24 (Perfil Produto)
export interface PerfilProduto {
  codigo: string;           // F20_CODIGO (ex: "PRF-PROD-001")
  descricao: string;        // F20_DESC
  produtos: Array<{
    codProd: string;        // F24_CDPROD — "TODOS" ou código específico
  }>;
}

// F20_TIPO='03' + F23 (Perfil Operação/CFOP)
export interface PerfilOperacao {
  codigo: string;           // F20_CODIGO (ex: "PRF-OP-001")
  descricao: string;        // F20_DESC
  cfops: Array<{
    cfop: string;           // F23_CFOP (ex: "5102")
    descricao: string;      // F23_DCFOP (preenchido por gatilho)
  }>;
}

// F20_TIPO='02' + F22 (Perfil Participante)
export interface PerfilParticipante {
  codigo: string;           // F20_CODIGO (ex: "PRF-PART-001")
  descricao: string;        // F20_DESC
  participantes: Array<{
    tipo: '1' | '2';        // F22_TPPART — 1=Fornecedor, 2=Cliente
    codPart: string;        // F22_CLIFOR — "TODOS" ou código
    loja: string;           // F22_LOJA — "ZZ" para todos
    razaoSocial?: string;   // F22_RAZSOC
  }>;
}

// F20_TIPO='01' + F21 (Perfil Origem/Destino)
export interface PerfilOrigemDestino {
  codigo: string;           // F20_CODIGO (ex: "PRF-OD-001")
  descricao: string;        // F20_DESC
  ufs: Array<{
    ufOrigem: string;       // F21_UFORI — "SP" ou código especial (000002=Todas)
    ufDestino: string;      // F21_UFDEST — "RJ" ou "*"
  }>;
}
```

### Regras Base, Alíquota, Escrituração

```typescript
export type ValorOrigemBase = '01'|'02'|'03'|'08'|'09'|'10'|'11';
// 01=Valor Mercadoria, 02=Quantidade, 03=Valor Contábil,
// 08=Valor Frete, 09=Valor Duplicata, 10=Valor Total Item, 11=Fórmula Manual

export type ValorOrigemAliq = '04'|'05'|'06';
// 04=Alíquota Manual, 05=URF, 06=Fórmula Manual

// Tabela F27 — Regra de Base de Cálculo
export interface RegraBase {
  codigo: string;           // F27_CODIGO (ex: "BASE-ICMS-001")
  descricao: string;        // F27_DESC
  valorOrigem: ValorOrigemBase; // F27_VALORI
  // Ações por componente (S=Soma, D=Deduz, N=Não considera)
  desconto?: string;        // F27_DESCON
  frete?: string;           // F27_FRETE
  seguro?: string;          // F27_SEGURO
  despesas?: string;        // F27_DESPE
  icmsDesonerado?: string;  // F27_ICMDES
  icmsRetido?: string;      // F27_ICMRET
  reducaoBC?: number;       // F27_REDBAS (0-100)
  tipoReducao?: string;     // F27_TPRED
  unidMedida?: string;      // F27_UM
}

// Tabela F28 — Regra de Alíquota
export interface RegraAliquota {
  codigo: string;           // F28_CODIGO (ex: "ALIQ-ICMS-12")
  descricao: string;        // F28_DESC
  valorOrigem: ValorOrigemAliq; // F28_VALORI
  tipoAliquota: '1' | '2'; // F28_TPALIQ — 1=Percentual, 2=Unid.Medida
  aliquota?: number;        // F28_ALIQ (quando valorOrigem='04')
  urf?: string;             // F28_URF (quando valorOrigem='05')
  reducaoAliquota?: number; // F28_REDALI
}

// Tabela CJ2 — Regra de Escrituração
export interface RegraEscrituracao {
  codigo: string;           // CJ2_CODIGO (ex: "ESC-ICMS-TRIB")
  descricao: string;        // CJ2_DESCR
  incidencia: string;       // CJ2_INCIDE (valores dinâmicos)
  somaTotal?: string;       // CJ2_STOTNF (valores dinâmicos)
  percDiferimento?: number; // CJ2_PERDIF
  cstCab?: string;          // CJ2_CSTCAB (FK para tabela CJ0)
  cst: string;              // CJ2_CST
  // Campos IBS/CBS
  cstCct?: string;          // CJ2_CSTCCT — Classificação Tributária IBS/CBS
  cct?: string;             // CJ2_CCT — CCT IBS/CBS (obrigatório)
  cctVigencia?: string;     // CJ2_CCTVIG — Data inicial vigência CCT
  indOp?: string;           // CJ2_INDOP — Indicador de Operação
  nlivro?: string;          // CJ2_NLIVRO (1-9)
  incidenciaReducao?: string; // CJ2_IREDBS (1=Isento, 2=Outros)
  cstDevolucao?: string;    // CJ2_CSTDEV
  incidenciaDevolucao?: string; // CJ2_INCDEV (1-7)
}
```

### Regra de Cálculo F2B

```typescript
// Tabela F2B — Regra Tributária (tabela central do CFGTRIB)
export interface RegraCalculo {
  // Identificação
  codigo: string;           // F2B_REGRA (ex: "TG-ICMS-001")
  descricao: string;        // F2B_DESC
  tributo: string;          // F2B_TRIB — código do tributo (FK para F2E)
  idTotvs?: string;         // ID no F2E (ex: "000021" para ICMS)
  // Vigência e Status
  vigIni: string;           // F2B_VIGINI — "01/01/2026" (tipo Date no Protheus)
  vigFim: string;           // F2B_VIGFIM — "31/12/2049"
  status: '1' | '2';       // F2B_STATUS — 1=Em Teste, 2=Aprovada
  // Regras vinculadas
  codBase: string;          // F2B_RBASE — FK para F27_CODIGO
  codBaseSecundaria?: string; // F2B_RBASES — base secundária
  codAliquota: string;      // F2B_RALIQ — FK para F28_CODIGO
  codEscrituracao?: string; // F2B_CODESC — FK para CJ2_CODIGO
  // Perfis vinculados
  perfProduto: string;      // F2B_PERFPR — FK para F20_CODIGO (tipo 04)
  perfOperacao: string;     // F2B_PERFOP — FK para F20_CODIGO (tipo 03)
  perfParticipante: string; // F2B_PERFPA — FK para F20_CODIGO (tipo 02)
  perfOrigemDestino: string;// F2B_PEROD — FK para F20_CODIGO (tipo 01)
  // Campos adicionais
  arredondamento?: string;  // F2B_RND
  regraFinanceira?: string; // F2B_RFIN
  regraApuracao?: string;   // F2B_RAPUR
  tributoMajoracao?: string;// F2B_TRBMAJ (auto-ref F2B_REGRA)
  origemRegra?: string;     // F2B_ORIGEM
  tipoRegra?: string;       // F2B_TPREGR
  // Min/Max
  valorMinimo?: number;     // F2B_VLRMIN
  valorMaximo?: number;     // F2B_VLRMAX
  operadorMinimo?: string;  // F2B_OPRMIN (FK para CIN_CODIGO)
  operadorMaximo?: string;  // F2B_OPRMAX (FK para CIN_CODIGO)
}
```

### TESConfig expandido

```typescript
// Tabela SF4 — campos verificados no SX3 real (287 campos totais, aqui os relevantes)
export interface TESConfig {
  // Identificação
  codTes: string;           // F4_CODIGO
  tipo: 'E' | 'S';         // F4_TIPO
  descricao: string;        // F4_TEXTO
  cfop: string;             // F4_CF
  cfps?: string;            // F4_CFPS
  count: number;            // contagem de NF-es (campo da aplicação, não SF4)

  // Movimentação
  atualizaEstoque: string;  // F4_ESTOQUE (S/N)
  geraDuplicata: string;    // F4_DUPLIC (S/N)
  entregaFutura: string;    // F4_EFUTUR (0/1/2/3)
  poderTerceiro: string;    // F4_PODER3 (R/D/N)
  atualPrecCompra: string;  // F4_UPRC (S/N)
  matConsumo: string;       // F4_CONSUMO (S/N/O)
  ativoCIAP: string;        // F4_CIAP (S/N)
  atualizaAtivo: string;    // F4_ATUATF (S/N)
  qtdZerada: string;        // F4_QTDZERO (1/2)
  vlrZerado: string;        // F4_VLRZERO (1/2)
  finalidade?: string;      // F4_FINALID
  tipOperacao?: string;     // F4_TIPOPER

  // ICMS
  calculaIcms: string;      // F4_ICM (S/N)
  creditaIcms: string;      // F4_CREDICM (S/N)
  livroIcms: string;        // F4_LFICM (T/I/O/N/Z/B)
  sitTribIcms?: string;     // F4_SITTRIB
  reducaoBaseIcms?: number; // F4_BASEICM
  icmsDiferido?: string;    // F4_ICMSDIF (1-7)
  percIcmsDif?: number;     // F4_PICMDIF
  calculaDifal?: string;    // F4_DIFAL (1/2)

  // IPI
  calculaIpi: string;       // F4_IPI (S/N/R)
  creditaIpi: string;       // F4_CREDIPI (S/N)
  livroIpi: string;         // F4_LFIPI (T/I/O/N/Z/P)
  reducaoBaseIpi?: number;  // F4_BASEIPI
  destacaIpi?: string;      // F4_DESTACA (S/N)

  // PIS/COFINS (campos que permanecem no TES)
  pisCofins: string;        // F4_PISCOF (1/2/3/4)
  creditaPisCof: string;    // F4_PISCRED (1/2/3/4/5)
  cstPis?: string;          // F4_CSTPIS
  cstCofins?: string;       // F4_CSTCOF
  reducaoBasePis?: number;  // F4_BASEPIS
  reducaoBaseCof?: number;  // F4_BASECOF
  aliqPisMaj?: number;      // F4_MALQPIS
  aliqCofMaj?: number;      // F4_MALQCOF
  pisCofST?: string;        // F4_PSCFST (1/2/3/4)
  agrPis?: string;          // F4_AGRPIS (1/2/P/D)
  agrCof?: string;          // F4_AGRCOF (1/2/C/D)
  pisZonaFranca?: string;   // F4_PISDSZF (1/2)
  cofZonaFranca?: string;   // F4_COFDSZF (1/2)
  tabelaNatRec?: string;    // F4_TNATREC
  codNatRec?: string;       // F4_CNATREC
  grpNatRec?: string;       // F4_GRPNATR

  // ISS
  calculaIss?: string;      // F4_ISS (S/N)
  livroIss?: string;        // F4_LFISS (T/I/O/N)
  retemIss?: string;        // F4_RETISS (S/N)

  // ICMS-ST
  baseIcmsST?: string;      // F4_STDESC (1/2)
  redIcmsST?: number;       // F4_BSICMST
  creditaIcmsST?: string;   // F4_CREDST (1/2/3/4)

  // Financeiro
  codPagamento?: string;    // F4_CODPAG

  // Referências
  tesDevol?: string;        // F4_TESDV
  tesPoder3?: string;       // F4_TESP3
  csosn?: string;           // F4_CSOSN
  bonificacao?: string;     // F4_BONIF (S/N)
}
```

---

## AppStore Changes (useAppStore.tsx)

Adicionar ao `AppState`:
```typescript
perfisOperacao: PerfilOperacao[];
perfisOrigemDestino: PerfilOrigemDestino[];
perfisProduto: PerfilProduto[];
perfisParticipante: PerfilParticipante[];
regrasBase: RegraBase[];
regrasAliquota: RegraAliquota[];
regrasCalculo: RegraCalculo[];
```

Adicionar ao `processFiles()`:
```typescript
perfisOperacao: engine.generatePerfisOperacao(allNFs),
perfisOrigemDestino: engine.generatePerfisOrigemDestino(allNFs),
perfisProduto: engine.generatePerfisProduto(allNFs),
perfisParticipante: engine.generatePerfisParticipante(allNFs),
regrasBase: engine.generateRegrasBase(allNFs),
regrasAliquota: engine.generateRegrasAliquota(allNFs),
regrasCalculo: engine.generateRegrasCalculo(allNFs),
```

---

## UI Changes

### TabNav (src/components/layout/TabNav.tsx)
Adicionar aba:
```typescript
{ id: "configurador", label: "Configurador CFGTRIB", icon: Settings2 }
```
Posição: entre "mapeamento" e "sugestoes"

### App.tsx
Adicionar:
```tsx
{activeTab === "configurador" && <ConfiguradorPage />}
```

### Nova ConfiguradorPage (src/pages/ConfiguradorPage.tsx)
Sub-abas:
1. **Perfis** — 4 sub-sub-abas: Produto | Operação | Participante | Origem/Destino
2. **Regras Base** — DataTable de RegraBase[]
3. **Regras Alíquota** — DataTable de RegraAliquota[]
4. **Regras de Cálculo** — DataTable de RegraCalculo[] com badge status

### MapeamentoPage (src/pages/MapeamentoPage.tsx)
- Remover sub-aba "estoque" (id: "estoque")
- Renomear sub-aba "fiscal" para "Campos SF4" (mostra TESConfig expandido)
- Atualizar imports para novos tipos

---

## ID Generation Strategy

Códigos gerados automaticamente com prefixos fixos:
- Perfis: `PRF-OP-{seq}`, `PRF-OD-{seq}`, `PRF-PROD-{seq}`, `PRF-PART-{seq}`
- Regras Base: `BASE-{TRIBUTO}-{seq}` (ex: `BASE-ICMS-001`)
- Regras Alíquota: `ALIQ-{TRIBUTO}-{aliq}` (ex: `ALIQ-ICMS-12`)
- Regras Cálculo: `TG-{TRIBUTO}-{seq}` (ex: `TG-ICMS-001`, `TG-CBS-001`)

Sequência baseada em índice do array gerado (zero-padded 3 dígitos).

---

## CBS/IBS Formula Template

```
Base CBS/IBS (F27_VALORI='11' — Fórmula Manual):
( O:VAL_MERCADORIA + O:FRETE + O:SEGURO + O:DESPESAS )
- ( O:DESCONTO + VAL:{codPIS} + VAL:{codCOFINS} + VAL:{codICMS} )

Onde {codPIS}, {codCOFINS}, {codICMS} são os códigos das RegraCalculo
geradas para esses tributos na mesma execução do engine.

Fórmula é gravada em CIN_FORMUL vinculada à F27 via CIN_IREGRA (CIN_TREGRA='1').
```

---

## Mapeamento Campos Reais → Interfaces TypeScript

| Campo Protheus | Interface TS | Campo TS | Nota |
|---|---|---|---|
| F20_CODIGO | Todos os Perfis | codigo | Cabeçalho unificado |
| F20_DESC | Todos os Perfis | descricao | |
| F20_TIPO | (implícito) | — | 01=OD, 02=Part, 03=Op, 04=Prod |
| F22_TPPART | PerfilParticipante | tipo | '1'=Forn, '2'=Cli (NÃO 'C'/'F') |
| F23_CFOP | PerfilOperacao | cfops[].cfop | |
| F27_DESCON/FRETE/SEGURO/DESPE | RegraBase | desconto/frete/seguro/despesas | Campos individuais (não arrays) |
| F28_REDALI | RegraAliquota | reducaoAliquota | Novo na v2 |
| CJ2_CSTCCT | RegraEscrituracao | cstCct | Campo CBS/IBS |
| CJ2_CCT | RegraEscrituracao | cct | Obrigatório para CBS/IBS |
| CJ2_INDOP | RegraEscrituracao | indOp | Indicador de Operação |
| F2B_RBASES | RegraCalculo | codBaseSecundaria | Novo na v2 |
| F2B_STATUS | RegraCalculo | status | '1'=Em Teste, '2'=Aprovada |
| F4_DIFAL | TESConfig | calculaDifal | Novo na v2 |

---

## Files to Create/Modify

| Ação    | Arquivo                                    | Notas                                  |
|---------|--------------------------------------------|----------------------------------------|
| Modify  | `src/lib/types.ts`                         | Adicionar interfaces revisadas v2, expandir TESConfig, remover StockRule |
| Modify  | `src/lib/rules-engine.ts`                  | Adicionar 7 novas funções generate*    |
| Modify  | `src/hooks/useAppStore.tsx`                | Adicionar 7 novos campos ao state      |
| Modify  | `src/components/layout/TabNav.tsx`         | Adicionar aba Configurador             |
| Modify  | `src/App.tsx`                              | Renderizar ConfiguradorPage            |
| Create  | `src/pages/ConfiguradorPage.tsx`           | Nova página CFGTRIB                    |
| Modify  | `src/pages/MapeamentoPage.tsx`             | Remover aba Estoque, atualizar tipos   |
| Modify  | `vite.config.ts`                           | Adicionar bloco test: { environment: 'jsdom', globals: true } |
| Modify  | `tsconfig.json`                            | Adicionar vitest/globals em types      |
| Create  | `src/lib/__tests__/rules-engine.test.ts`   | Testes unitários do engine             |
