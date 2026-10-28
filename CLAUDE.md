# CLAUDE.md

Toda a documentação do projeto está em `manuals/instructions.md` — ler antes de alterar código.

## Regra de manutenção

Sempre que uma alteração tocar em **base de dados** (tabelas, colunas, RLS, funções, triggers), **edge functions**, **variáveis de ambiente/secrets**, **alojamento/deploy** ou **fluxos de negócio** (estados de ticket, créditos, notificações), atualizar a secção correspondente de `manuals/instructions.md` no mesmo commit/PR.

## Convenções

- Branches `feat/…` ou `fix/…`, PR para `main`; nunca push direto para `main`.
- Valores do utilizador interpolados em HTML (emails, relatórios, impressão) passam por `escHtml` (`src/utils/helpers.js`).
- Edge functions não são publicadas pelo merge — publicar manualmente no Supabase.
- Validação mínima antes de commit: `npm run build`.
