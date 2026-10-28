# CLAUDE.md

Toda a documentação do projeto está em `manuals/instructions.md` — ler antes de alterar código.

## Regra de manutenção

**Regra:** sempre que se altera a base de dados, uma edge function, variáveis de ambiente ou alojamento, atualizar o ficheiro `manuals/instructions.md`.

- Base de dados inclui tabelas, colunas, constraints, RLS, funções, triggers e storage → §6 e §7.
- Edge function → §8 (e §3 se mudar secrets).
- Variáveis de ambiente/secrets → §3.
- Alojamento/deploy → §2 e §11.
- Atualizar a data de "Última revisão" no topo do manual e fazer a alteração no mesmo commit/PR.

## Convenções

- Branches `feat/…` ou `fix/…`, PR para `main`; nunca push direto para `main`.
- Valores do utilizador interpolados em HTML (emails, relatórios, impressão) passam por `escHtml` (`src/utils/helpers.js`).
- Edge functions não são publicadas pelo merge — publicar manualmente no Supabase.
- Validação mínima antes de commit: `npm run build`.
