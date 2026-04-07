# Code Conventions

## Naming Conventions

**Files:**
- Components: PascalCase → `Header.tsx`, `DataTable.tsx`, `TabNav.tsx`
- Pages: PascalCase + sufixo `Page` → `UploadPage.tsx`, `MapeamentoPage.tsx`
- Lib/utils: camelCase → `rules-engine.ts`, `xml-parser.ts`, `utils.ts`
- Hooks: camelCase + prefixo `use` → `useAppStore.tsx`

**Functions/Methods:**
- Engine functions: `generate` + PascalCase substantivo → `generateTES()`, `generateFiscalRules()`
- Handlers: `handle` + ação → `handleDrop`, `handleSubmit`
- Helpers locais: camelCase descritivo → `getCfopDescription()`, `formatCurrency()`

**Variables:**
- camelCase para variáveis e props
- UPPER_SNAKE_CASE para constantes lookup → `CFOP_DESC`, `TPAG_DESC`
- `prev` para parâmetro de setState callbacks

**Types/Interfaces:**
- PascalCase sem prefixo `I` → `NFeParsed`, `TESConfig`, `ItemNFe`
- Sufixo descritivo do domínio → `ImpostoICMS`, `ImpostoPISCOFINS`

## Code Organization

**Import ordering (observado):**
1. React e hooks do React
2. Hooks da aplicação (`@/hooks/`)
3. Utilitários e lib (`@/lib/`)
4. Componentes (`@/components/`)
5. Tipos (com `import type`)

**Exemplo de `AnalisePage.tsx`:**
```ts
import { useState, useMemo } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getCfopDescription } from "@/lib/rules-engine";
import { Badge } from "@/components/ui/Badge";
import type { NFeParsed } from "@/lib/types";
```

**File structure dentro de page:**
1. Constantes e helpers locais (fora do componente)
2. Componente principal (função default export)
3. Sem sub-componentes em arquivo separado para componentes pequenos

## Type Safety

**Approach:** TypeScript strict, `import type` separado de `import`
**Interfaces:** sempre interface (não type alias) para shapes de dados
**Nullability:** `| null` explícito, não `undefined` (ex: `ImpostoII | null`)
**Enums:** string literals union preferidos → `"entrada" | "saida"`, `"info" | "warning" | "success" | "error"`

## Styling

**Approach:** Tailwind utility classes direto no JSX
**Conditional classes:** sempre via `cn()` (clsx + tailwind-merge)
**Variáveis CSS:** cores customizadas inline com Tailwind v4 (`bg-[#0f1729]`, `border-[#1e293b]`)
**Dark theme:** app inteiramente dark — background `#0a0f1e`, cards `#0f1729`, borders `#1e293b`

## Error Handling

**Pattern:** try/catch apenas em `processFiles()` (boundary de I/O)
**Funções de engine:** sem throws — retornam arrays vazios em caso de dados inválidos
**Parser:** retorna `null` se XML inválido

## Comments

**Style:** JSDoc no topo de arquivos lib para descrever propósito
**Inline:** apenas onde a lógica fiscal não é óbvia
**Exemplo:**
```ts
/**
 * rules-engine.ts
 * Motor de regras fiscais para configuracao de tributos brasileiros no Protheus.
 */
```
