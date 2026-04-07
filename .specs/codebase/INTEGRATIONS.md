# External Integrations

## Resumo

**Aplicação 100% local/offline.** Não há integrações com APIs externas, serviços de autenticação, bancos de dados remotos ou webhooks.

## Processamento de Arquivos

**Tipo:** File API nativa do browser
**Purpose:** Leitura de arquivos XML NF-e enviados pelo usuário
**Implementation:** `FileReader.readAsText()` em `useAppStore.tsx`
**Autenticação:** N/A — processamento client-side

## Lovable Tagger

**Service:** lovable-tagger ^1.1.13
**Purpose:** Plugin de desenvolvimento para rastreamento de componentes no Lovable.dev
**Implementation:** Ativo apenas em `mode === "development"` no `vite.config.ts`
**Impact:** Zero em produção (tree-shaken pelo Vite)

## Futuras integrações planejadas (Roadmap)

- Nenhuma integração externa planejada para Etapa 1 ou Etapa 2
- Eventual exportação de CSV/TXT para importação no Protheus (local, sem API)
