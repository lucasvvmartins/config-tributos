# Design — CFGTRIB Etapa 1

**Feature:** cfgtrib-etapa1
**Created:** 2026-04-07

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

### Perfis

```typescript
export interface PerfilProduto {
  codigo: string;           // ex: "PRF-PROD-001"
  descricao: string;
  produtos: Array<{
    codProd: string;        // "TODOS" ou código específico
    origem: string;         // "0"-"8" (origem ICMS) ou "*" (todas)
  }>;
}

export interface PerfilOperacao {
  codigo: string;           // ex: "PRF-OP-001"
  descricao: string;
  cfops: string[];          // ["5102", "5403", ...]
  tiposOperacao: string[];  // tipos de operação Protheus
  codigosServico: string[]; // códigos ISS (vazio se não serviço)
}

export interface PerfilParticipante {
  codigo: string;           // ex: "PRF-PART-001"
  descricao: string;
  participantes: Array<{
    tipo: 'C' | 'F';        // Cliente ou Fornecedor
    codPart: string;        // "TODOS" ou código específico
    loja: string;           // "ZZ" para todos ou loja específica
  }>;
}

export interface PerfilOrigemDestino {
  codigo: string;           // ex: "PRF-OD-001"
  descricao: string;
  ufs: Array<{
    ufOrigem: string;       // "SP" ou "*" (todas)
    ufDestino: string;      // "RJ" ou "*" (todas)
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

export interface RegraBase {
  codigo: string;           // ex: "BASE-ICMS-001"
  descricao: string;
  valorOrigem: ValorOrigemBase;
  formula?: string;         // preenchido quando valorOrigem='11'
  reducaoBC?: number;       // percentual de redução (0-100)
  adicoes?: string[];       // operandos a adicionar
  deducoes?: string[];      // operandos a deduzir
  unidMedida?: string;      // para cálculo por quantidade/pauta
}

export interface RegraAliquota {
  codigo: string;           // ex: "ALIQ-ICMS-12"
  descricao: string;
  valorOrigem: ValorOrigemAliq;
  tipoAliquota: '1' | '2'; // 1=Percentual, 2=Unidade de Medida
  aliquota?: number;        // preenchido quando valorOrigem='04'
  formula?: string;         // preenchido quando valorOrigem='06'
  urf?: string;             // código URF quando valorOrigem='05'
}

export interface RegraEscrituracao {
  codigo: string;           // ex: "ESC-ICMS-TRIB"
  descricao: string;
  incidencia: string;       // "1"-"8" (1=Tributado, 2=Isento, etc.)
  cst: string;
  cstCct?: string;          // Código Classificação Tributária (IBS/CBS)
  agregarTotal?: boolean;
  agregarDuplicata?: boolean;
  indOp?: string;           // Indicador de Operação (IndOp para IBS/CBS)
}
```

### Regra de Cálculo F2B

```typescript
export interface RegraCalculo {
  codigo: string;           // ex: "TG-ICMS-001"
  descricao: string;
  tributo: string;          // código do tributo no CFGTRIB
  idTotvs?: string;         // ex: "000021" para ICMS
  vigIni: string;           // "01/01/2026"
  vigFim: string;           // "31/12/2049"
  status: '1' | '2';       // 1=Em Teste, 2=Aprovada
  codBase: string;          // ref para RegraBase.codigo
  codAliquota: string;      // ref para RegraAliquota.codigo
  codEscrituracao?: string; // ref para RegraEscrituracao.codigo
  formula: string;          // fórmula de cálculo
  perfProduto: string;      // ref para PerfilProduto.codigo
  perfOperacao: string;     // ref para PerfilOperacao.codigo
  perfParticipante: string; // ref para PerfilParticipante.codigo
  perfOrigemDestino: string;// ref para PerfilOrigemDestino.codigo
}
```

### TESConfig expandido

```typescript
export interface TESConfig {
  // Identificação
  codTes: string;
  tipo: 'E' | 'S';
  descricao: string;
  cfop: string;
  cfps?: string;            // Código Fiscal Prestação de Serviço
  count: number;

  // Movimentação (F4_*)
  atualizaEstoque: boolean; // F4_ESTOQUE
  geraDuplicata: boolean;   // F4_DUPLIC
  entregaFutura: boolean;   // F4_EFUTUR
  poderTerceiro: boolean;   // F4_PODER3
  atualPrecCompra: boolean; // F4_UPRC
  matConsumo: boolean;      // F4_CONSUMO
  ativoCIAP: boolean;       // F4_CIAP
  atualizaAtivo: boolean;   // F4_ATUATF
  qtdZerada: boolean;       // F4_QTDZERO
  vlrZerado: boolean;       // F4_VLRZERO
  finalidade?: string;      // F4_FINALID
  tipOperacao?: string;     // F4_TIPOPER

  // PIS/COFINS (campos que permanecem no TES)
  cstPis?: string;          // F4_CSTPIS
  cstCofins?: string;       // F4_CSTCOF
  pisCofST?: string;        // F4_PSCFST
  aliqPisMaj?: number;      // F4_MALQPIS
  aliqCofMaj?: number;      // F4_MALQCOF
  tabelaNatRec?: string;    // F4_TNATREC
  codNatRec?: string;       // F4_CNATREC
  grpNatRec?: string;       // F4_GRPNATR
  calculaPisCof?: boolean;  // F4_PISCOF
  creditaPisCof?: boolean;  // F4_PISCRED
  reducaoBasePis?: number;  // F4_BASEPIS
  reducaoBaseCof?: number;  // F4_BASECOF
  descontoPisZFM?: boolean; // F4_PISDSZF
  descontoCofZFM?: boolean; // F4_COFDSZF
  graPis?: boolean;         // F4_AGRPIS
  graCof?: boolean;         // F4_AGRCOF

  // Financeiro
  codPagamento?: string;    // F4_CODPAG

  // Referências
  tesDevol?: string;        // F4_TESDV
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
Base CBS/IBS:
( O:VAL_MERCADORIA + O:FRETE + O:SEGURO + O:DESPESAS )
- ( O:DESCONTO + VAL:{codPIS} + VAL:{codCOFINS} + VAL:{codICMS} )

Onde {codPIS}, {codCOFINS}, {codICMS} são os códigos das RegraCalculo
geradas para esses tributos na mesma execução do engine.
```

---

## Files to Create/Modify

| Ação    | Arquivo                                    | Notas                                  |
|---------|--------------------------------------------|----------------------------------------|
| Modify  | `src/lib/types.ts`                         | Adicionar 8 novos interfaces, expandir TESConfig, remover StockRule |
| Modify  | `src/lib/rules-engine.ts`                  | Adicionar 7 novas funções generate*    |
| Modify  | `src/hooks/useAppStore.tsx`                | Adicionar 7 novos campos ao state      |
| Modify  | `src/components/layout/TabNav.tsx`         | Adicionar aba Configurador             |
| Modify  | `src/App.tsx`                              | Renderizar ConfiguradorPage            |
| Create  | `src/pages/ConfiguradorPage.tsx`           | Nova página CFGTRIB                    |
| Modify  | `src/pages/MapeamentoPage.tsx`             | Remover aba Estoque, atualizar tipos   |
| Modify  | `vite.config.ts`                           | Adicionar bloco test: { environment: 'jsdom', globals: true } |
| Modify  | `tsconfig.json`                            | Adicionar vitest/globals em types      |
| Create  | `src/lib/__tests__/rules-engine.test.ts`   | Testes unitários do engine             |
