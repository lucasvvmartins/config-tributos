# Project Structure

**Root:** `/Users/lucasvieira/projects/config-tributos`

## Directory Tree

```
config-tributos/
├── .specs/                    # Documentação SDD (spec-driven)
│   ├── project/               # Visão, roadmap, estado do projeto
│   ├── codebase/              # Mapeamento brownfield
│   └── features/              # Especificações por feature
├── public/                    # Assets públicos
├── src/
│   ├── assets/                # Imagens e SVGs
│   ├── components/
│   │   ├── layout/            # Header, StatsBar, TabNav
│   │   └── ui/                # Badge, Card, DataTable
│   ├── hooks/
│   │   └── useAppStore.tsx    # Estado global (Context + useState)
│   ├── lib/
│   │   ├── types.ts           # Todas as interfaces TypeScript
│   │   ├── rules-engine.ts    # Motor de regras fiscais (1298 linhas)
│   │   ├── xml-parser.ts      # Parser NF-e XML v4.00
│   │   └── utils.ts           # cn(), formatCurrency(), formatDate(), truncate()
│   ├── pages/
│   │   ├── UploadPage.tsx     # Aba: upload de XMLs
│   │   ├── VisaoPage.tsx      # Aba: visão geral / dashboard
│   │   ├── AnalisePage.tsx    # Aba: análise fiscal detalhada
│   │   ├── MapeamentoPage.tsx # Aba: mapeamento Protheus (TES, regras, perfis)
│   │   ├── SugestoesPage.tsx  # Aba: sugestões por severidade
│   │   └── PrwPage.tsx        # Aba: geração de código PRW ADVPL
│   ├── App.tsx                # Roteamento por abas
│   ├── main.tsx               # Entry point + AppProvider
│   └── index.css              # Global CSS + Tailwind imports
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .gitignore
```

## Module Organization

### `src/lib/` — Lógica de negócio pura
**Purpose:** Sem dependências React; testável isoladamente
**Key files:**
- `types.ts` — contratos de dados de toda a aplicação
- `rules-engine.ts` — todas as funções `generate*()` + tabela CFOP_DESC
- `xml-parser.ts` — `parseNFe()` com suporte namespace NF-e
- `utils.ts` — helpers de formatação e CSS

### `src/hooks/` — Estado global
**Purpose:** Orquestração parse + engine + estado React
**Key files:** `useAppStore.tsx` — único store, expõe AppState + AppActions

### `src/pages/` — Views por aba
**Purpose:** Cada page corresponde a uma aba do TabNav
**Pattern:** Consume `useAppStore()`, sem lógica de negócio própria

### `src/components/` — UI reutilizável
**Purpose:** Componentes sem estado de domínio
**layout/:** componentes estruturais da página
**ui/:** primitivos de UI genéricos

## Where Things Live

**Tipos TypeScript:**
- Definição: `src/lib/types.ts`
- Consumo: importado em todos os outros módulos

**Lógica fiscal:**
- Regras: `src/lib/rules-engine.ts`
- Parse XML: `src/lib/xml-parser.ts`

**Navegação:**
- Definição das abas: `src/components/layout/TabNav.tsx` (array `tabs`)
- Controle de aba ativa: `useAppStore.tsx` → `activeTab` + `setActiveTab()`
- Renderização condicional: `src/App.tsx`

**Configuração Vite:**
- `vite.config.ts` — plugin-react-swc, tailwindcss, lovable-tagger, host "::", port 8080, dedupe
