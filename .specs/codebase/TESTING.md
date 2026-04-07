# Testing Infrastructure

## Test Frameworks

**Unit/Integration:** Vitest — **NÃO CONFIGURADO** (a instalar na Etapa 1)
**E2E:** não planejado
**Coverage:** não configurado

## Instalação necessária

```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

Adicionar ao `vite.config.ts`:
```ts
test: {
  environment: 'jsdom',
  globals: true,
}
```

Adicionar ao `tsconfig.json` (compilerOptions):
```json
"types": ["vitest/globals"]
```

## Test Organization

**Location:** `src/lib/__tests__/` (a criar)
**Naming:** `[modulo].test.ts`
**Structure:** describe por função, it/test por cenário

## Testing Patterns

### Unit Tests — Rules Engine (PRIORITÁRIO)
**Approach:** Testar funções puras com dados mockados de NFeParsed
**Location:** `src/lib/__tests__/rules-engine.test.ts`
**Pattern:**
```ts
describe('generateTES', () => {
  it('gera TES de saída para CFOP 5102', () => {
    const nfs = [mockNFe({ cfop: '5102', tpNF: '1' })]
    const result = generateTES(nfs)
    expect(result[0].tipo).toBe('S')
    expect(result[0].cfop).toBe('5102')
  })
})
```

### Unit Tests — XML Parser
**Approach:** Testar com strings XML reais ou mockadas
**Location:** `src/lib/__tests__/xml-parser.test.ts`

### Component Tests
**Approach:** Apenas para lógica de UI crítica (filtros, ordenação)
**Location:** `src/components/__tests__/` (quando necessário)

## Test Coverage Matrix

| Code Layer        | Required Test Type | Location Pattern                    | Run Command         |
|-------------------|--------------------|-------------------------------------|---------------------|
| rules-engine.ts   | unit               | src/lib/__tests__/rules-engine.test.ts | npx vitest run   |
| xml-parser.ts     | unit               | src/lib/__tests__/xml-parser.test.ts   | npx vitest run   |
| types.ts          | none               | N/A (tipos apenas)                  | N/A                 |
| utils.ts          | unit (opcional)    | src/lib/__tests__/utils.test.ts        | npx vitest run   |
| Pages             | none               | N/A (sem lógica de negócio)         | N/A                 |
| Components UI     | none               | N/A (visuais)                       | N/A                 |

## Parallelism Assessment

| Test Type | Parallel-Safe? | Isolation Model             | Evidence                        |
|-----------|----------------|-----------------------------|---------------------------------|
| unit      | Sim            | Funções puras, sem I/O      | rules-engine.ts sem side effects |

## Gate Check Commands

| Gate Level | When to Use                    | Command                              |
|------------|--------------------------------|--------------------------------------|
| Quick      | Após edição em lib/            | `npx vitest run`                     |
| Full       | Após feature completa          | `npm run build && npx vitest run`    |
| Build      | Antes de commit/push           | `npm run lint && npm run build`      |
