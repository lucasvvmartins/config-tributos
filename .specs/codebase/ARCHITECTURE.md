# Architecture

**Pattern:** SPA modular — camadas separadas: Parser → Engine → Store → UI

## High-Level Structure

```
XML Files (upload)
      ↓
xml-parser.ts       → NFeParsed[]
      ↓
rules-engine.ts     → TES[], FiscalRule[], FinancialRule[], StockRule[], etc.
      ↓
useAppStore.tsx     → AppContext (estado global)
      ↓
Pages / Components  → leitura do store, renderização
```

## Identified Patterns

### Parser Layer
**Location:** `src/lib/xml-parser.ts`
**Purpose:** Transforma XML bruto de NF-e v4.00 em objetos TypeScript tipados
**Implementation:** DOMParser com suporte a namespace `http://www.portalfiscal.inf.br/nfe` e fallback sem namespace
**Example:** `parseNFe(xml: string): NFeParsed | null`

### Rules Engine Layer
**Location:** `src/lib/rules-engine.ts` (1298 linhas)
**Purpose:** Recebe `NFeParsed[]` e gera sugestões de configuração para o Protheus
**Implementation:** Funções puras exportadas, sem side effects
**Funções exportadas:**
- `generateTES(nfs)` → `TESConfig[]`
- `generateFiscalRules(nfs)` → `FiscalRule[]`
- `generateFinancialRules(nfs)` → `FinancialRule[]`
- `generateStockRules(nfs)` → `StockRule[]`
- `generateProfiles(nfs)` → `FiscalProfile[]`
- `generateProducts(nfs)` → `ProductInfo[]`
- `generateSuggestions(nfs)` → `Suggestion[]`
- `generateParticipantes(nfs)` → `Participante[]`
- `generateOperations(nfs)` → `OperationType[]`
- `getCfopDescription(cfop)` → `string`

### Global State Layer
**Location:** `src/hooks/useAppStore.tsx`
**Purpose:** Context Provider que orquestra parse + engine e expõe estado para toda a árvore
**Implementation:** `createContext` + `useState` + `useCallback`. AppProvider envolve toda a app em `main.tsx`
**Trigger principal:** `processFiles()` — lê arquivos, parseia, roda engine, atualiza estado

### Page Layer
**Location:** `src/pages/`
**Purpose:** Cada aba é uma page independente que consome `useAppStore()`
**Páginas:**
- `UploadPage` — seleção de arquivos XML entrada/saída
- `VisaoPage` — dashboard com stats, produtos, participantes
- `AnalisePage` — tabela detalhada de todas as NF-es
- `MapeamentoPage` — abas TES / Regras Fiscais / Financeiras / Estoque / Perfis / Produtos
- `SugestoesPage` — lista de sugestões por severidade
- `PrwPage` — geração de código PRW ADVPL

### Component Layer
**Location:** `src/components/`
**Purpose:** Componentes reutilizáveis de UI
- `layout/Header.tsx` — cabeçalho fixo
- `layout/StatsBar.tsx` — barra de estatísticas resumidas
- `layout/TabNav.tsx` — navegação entre abas
- `ui/Badge.tsx` — badge colorido com variantes
- `ui/Card.tsx` — card com título e conteúdo
- `ui/DataTable.tsx` — tabela genérica com ordenação

## Data Flow

### Upload → Processamento
1. Usuário arrasta XMLs em `UploadPage`
2. `addFiles()` adiciona ao estado
3. Usuário clica "Processar" → `processFiles()` é chamado
4. Para cada arquivo: `readFile()` → `parseNFe()` → `NFeParsed`
5. Engine roda todas as `generate*()` com o array de NFes
6. Estado atualizado → UI reage automaticamente

### Navegação por Abas
- `TabNav` chama `setActiveTab(tab.id)`
- `App.tsx` renderiza a page correspondente condicionalmente

## Code Organization

**Approach:** Feature-layer hybrid
- `src/lib/` — lógica de negócio pura (sem React)
- `src/hooks/` — estado global
- `src/components/` — componentes reutilizáveis
- `src/pages/` — views por aba
- `src/assets/` — recursos estáticos
