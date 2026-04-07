# Tech Stack

**Analyzed:** 2026-04-07

## Core

- Framework: React 19.2.4
- Language: TypeScript ~6.0.2
- Runtime: Node.js v24.14.1 (via nvm)
- Package manager: npm 11.12.1
- Build tool: Vite 8.0.4

## Frontend

- UI Framework: React 19 (sem Next.js, SPA pura)
- Styling: Tailwind CSS v4.2.2 (via @tailwindcss/vite, sem tailwind.config.js)
- State Management: React Context + useState (useAppStore via AppContext)
- Component library: Lucide React ^1.7.0 (ícones)
- CSS utilities: clsx ^2.1.1 + tailwind-merge ^3.5.0 → função `cn()`

## Compiler / Plugins

- @vitejs/plugin-react-swc ^4.3.0 (SWC, não Babel)
- lovable-tagger ^1.1.13 (apenas em development mode — plugin de dev, não define plataforma de deploy)
- @tailwindcss/vite ^4.2.2

## Deploy

- Estratégia: SPA estática hospedada em domínio próprio (sem dependência de Lovable)
- Opções: Vercel / Netlify / S3+CloudFront / VPS próprio
- Build output: `dist/` (Vite padrão)

## Testing

- Unit: **não configurado** (Vitest a instalar — ver CONCERNS.md)
- Integration: não configurado
- E2E: não configurado

## Development Tools

- ESLint 9.39.4 com typescript-eslint 8.58.0
- eslint-plugin-react-hooks 7.0.1
- eslint-plugin-react-refresh 0.5.2
- Path alias: `@/` → `./src/`

## External Services

- Nenhum — aplicação 100% local/offline, sem APIs externas
