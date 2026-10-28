# RBO — Rilop BackOffice · Manual do Projeto

> Documento de passagem de testemunho. Objetivo: qualquer pessoa (ou agente de IA) consegue perceber, operar e evoluir o RBO só com este ficheiro e o repositório.
>
> **Última revisão:** 2026-10-28 · **Regra:** sempre que se altera a base de dados, uma edge function, variáveis de ambiente ou alojamento, atualiza-se este ficheiro no mesmo PR.
>
> Campos marcados com **⚠️ A CONFIRMAR** são informação que não está no código e que o responsável atual deve preencher.

## Índice

1. [Visão geral](#1-visão-geral)
2. [Onde está alojado](#2-onde-está-alojado)
3. [Setup local e variáveis de ambiente](#3-setup-local-e-variáveis-de-ambiente)
4. [Estrutura de ficheiros](#4-estrutura-de-ficheiros)
5. [Frontend: arquitetura e convenções](#5-frontend-arquitetura-e-convenções)
6. [Base de dados](#6-base-de-dados)
7. [Autenticação, permissões e segurança](#7-autenticação-permissões-e-segurança)
8. [Edge functions](#8-edge-functions)
9. [Fluxos de negócio](#9-fluxos-de-negócio)
10. [Emails e notificações](#10-emails-e-notificações)
11. [Deploy](#11-deploy)
12. [Runbook operacional](#12-runbook-operacional)
13. [Dívida técnica e pontos de atenção](#13-dívida-técnica-e-pontos-de-atenção)

---

## 1. Visão geral

O **RBO** é o backoffice interno da **Rilop – Informática e Comunicação, Lda** para gerir:

- **Clientes**, os seus contactos, equipamentos e credenciais de acesso (routers, servidores, contas…);
- **Contratos** de assistência baseados em **créditos** (1 crédito = 15 minutos de trabalho);
- **Tickets** de assistência, incluindo pedidos submetidos por clientes num **formulário público** (`/pedido`);
- **Movimentos** (carregamentos de créditos e assistências realizadas) e relatórios por email.

**Stack**

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite 5 (SPA, JavaScript, sem TypeScript) |
| Routing | `react-router-dom` 7 — apenas duas rotas; a navegação interna é por estado (ver §5) |
| Estilos | Inline styles + tema JS próprio (`src/theme`), sem CSS framework |
| Backend | Supabase: Postgres + Auth + Storage + Edge Functions (Deno) |
| Email | Resend (sempre via edge function) |
| Anti-spam | Cloudflare Turnstile no formulário público |
| Alojamento | Vercel (frontend estático) |

Não há servidor próprio: o frontend fala diretamente com o Supabase (protegido por RLS) e, para operações privilegiadas, com edge functions.

---

## 2. Onde está alojado

| Serviço | Para quê | Onde | Dono da conta |
|---|---|---|---|
| **GitHub** | Código | `https://github.com/riloppt/personal-rbo` | ⚠️ A CONFIRMAR |
| **Vercel** | Frontend | Produção: `https://rbo-gules.vercel.app` (URL usada nos emails). **Não** está na equipa Vercel pessoal `sergiohenriques-gi` | ⚠️ A CONFIRMAR (conta/equipa) |
| **Supabase** | BD, Auth, Storage, Edge Functions | Projeto ⚠️ A CONFIRMAR (ref `xxxx` em `https://xxxx.supabase.co`) | ⚠️ A CONFIRMAR |
| **Resend** | Envio de email | Remetente `noreply@rilop.pt` (domínio `rilop.pt` verificado no Resend) | ⚠️ A CONFIRMAR |
| **Cloudflare Turnstile** | Captcha invisível em `/pedido` | Widget associado ao domínio de produção | ⚠️ A CONFIRMAR |
| **DNS `rilop.pt`** | Registos SPF/DKIM do Resend | ⚠️ A CONFIRMAR (registrar/DNS) | ⚠️ A CONFIRMAR |

> Ao herdar o projeto, o primeiro passo é garantir acesso de administrador a **todas** estas contas. Sem acesso ao Supabase e ao Vercel não é possível operar o RBO.

---

## 3. Setup local e variáveis de ambiente

### Requisitos
- Node.js 18+ (testado com Node 24) e npm.
- Opcional: [Supabase CLI](https://supabase.com/docs/guides/cli) para gerir edge functions e fazer dumps da BD.

### Arrancar
```bash
npm install
cp .env.example .env.local   # preencher valores (ver tabela)
npm run dev                  # http://localhost:5173
npm run build                # gera dist/
npm run preview              # serve dist/ localmente
```

Não existe ambiente de staging: **o desenvolvimento local liga à BD de produção**. Cuidado com dados de teste.

### Variáveis do frontend (`.env.local` e Vercel → Settings → Environment Variables)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave anon (pública por natureza — vai no bundle; a segurança vem do RLS) |
| `VITE_TURNSTILE_SITE_KEY` | Não | Site key do Turnstile. Sem ela o widget não aparece e o submit falha na verificação do servidor |

> Tudo o que começa por `VITE_` fica **público** no JavaScript. Nunca colocar segredos com este prefixo.

### Secrets das edge functions (Supabase → Edge Functions → Secrets)

| Secret | Usado por | Descrição |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | todas | Injetados automaticamente pelo Supabase |
| `RESEND_API_KEY` | `send-email`, `public-ticket-form` | Chave da API Resend |
| `TURNSTILE_SECRET_KEY` | `public-ticket-form` | Secret key do Turnstile |
| `ALLOWED_ORIGINS` | todas | Origens CORS permitidas, separadas por vírgula (ex.: `https://rbo-gules.vercel.app,http://localhost:5173`). Se faltar a origem, o browser bloqueia a chamada |

---

## 4. Estrutura de ficheiros

```
personal-rbo/
├── index.html                  # Shell HTML; carrega o script do Turnstile
├── vite.config.js
├── vercel.json                 # Rewrites SPA + headers de segurança (CSP, HSTS…)
├── .env.example                # Modelo de variáveis de ambiente
├── manuals/instructions.md     # Este manual
├── graphify-out/               # Grafo de conhecimento gerado (ferramenta graphify). Não é usado pela app
├── supabase/
│   ├── email-templates/confirm-signup.html   # Template do email de confirmação (copiado para Auth → Email Templates)
│   └── functions/              # Edge functions (Deno) — ver §8
│       ├── create-user/
│       ├── public-ticket-form/
│       └── send-email/
└── src/
    ├── main.jsx                # Router: /pedido → TicketPublico; /* → App
    ├── App.jsx                 # Shell autenticado: sessão, perfil, tema, navegação, guards
    ├── lib/
    │   ├── supabase.js         # Cliente Supabase (sb)
    │   ├── permissions.js      # Admin fixo + checkPermission
    │   └── email.js            # sendEmailResend → edge function send-email
    ├── theme/                  # Paletas claro/escuro × 6 cores de destaque; ThemeCtx/useTheme
    ├── components/
    │   ├── layout/             # Sidebar (desktop), BottomNav (mobile)
    │   ├── shared/CrudPage.jsx # Página genérica de lista/edição
    │   └── ui/                 # Btn, Card, Modal, Table, Input, Select, Badge, Icon, …
    ├── hooks/useSortable.js    # Ordenação de tabelas
    ├── utils/
    │   ├── formatters.js       # fmtDate, máscaras de telefone/NIF/código postal
    │   └── helpers.js          # qrUrl, escHtml
    ├── features/email/         # Templates HTML de email, relatórios e modal de confirmação de envio
    └── pages/
        ├── Dashboard.jsx       # KPIs e últimas assistências
        ├── Assistencias.jsx    # Vista global de movimentos tipo assistência
        ├── Clientes/           # Lista + detalhe (contactos, equipamentos, credenciais)
        ├── Contratos/          # Lista + detalhe (movimentos, saldo, relatórios)
        ├── Tickets/            # Lista, detalhe, novo ticket, estados (helpers.js), impressão
        ├── Equipamentos/       # Lista global + detalhe + credenciais de equipamento
        ├── Definicoes/         # Utilizadores, técnicos, permissões, notificações, listas auxiliares
        ├── TicketPublico/      # Formulário público /pedido
        └── auth/               # LoginScreen, AccessDenied
```

---

## 5. Frontend: arquitetura e convenções

- **Navegação por estado, não por URL.** `App.jsx` guarda `page` em `useState` e renderiza `pages[page]`. Os URLs não mudam ao navegar e não há deep links (refresh → Dashboard). Para abrir uma página com filtro usa-se `navigate(id, params)`; a página recebe `params` como `initialFilter`.
- **Rotas reais**: só `/pedido` (público) e `/*` (app). O `vercel.json` reescreve tudo para `index.html`.
- **Acesso a dados**: cada página chama `sb.from(...)` diretamente; não há camada de serviços nem cache. Após mutações, a página volta a chamar o seu `load()`.
- **Tema**: `buildTheme(accent, darkMode)` produz um objeto de cores; os componentes usam `useTheme()` e estilos inline. Preferências (`dark_mode`, `accent`) são guardadas em `rbo_profiles`.
- **Responsivo**: `isMobile` (< 768 px) troca Sidebar por BottomNav e tabelas por cards.
- **Idioma**: UI e nomes de domínio em português (`clientes`, `contratos`, `movimentos`); algumas tabelas mais recentes em inglês (`rbo_client_equipment`, `rbo_credential_categories`). Comentários mistos PT/EN.
- **HTML gerado como string** (emails, relatórios, ficha de impressão): qualquer valor vindo do utilizador — sobretudo do formulário público — **tem de passar por `escHtml`** (`src/utils/helpers.js`).
- **Sem testes automáticos** nem lint configurados. Validação mínima: `npm run build`.

---

## 6. Base de dados

Postgres do Supabase, schema `public`. Todas as tabelas têm prefixo `rbo_`, PK `id bigint` (exceto `rbo_profiles`, `uuid`, e `rbo_definicoes_globais`, PK `chave`) e `created_at timestamptz default now()`.

> **O schema não está versionado em migrations.** Esta secção foi gerada a partir do catálogo em 2026-10-28. Para obter um schema executável: `supabase db dump --schema-only -f supabase/schema.sql` (ver §12).

### 6.1 Diagrama de relações

```
auth.users ──1:1── rbo_profiles ──┬── rbo_tecnicos.profile_id
                                  ├── rbo_tickets.tecnico_id
                                  └── rbo_ticket_historico.alterado_por_id

rbo_clientes ──┬── rbo_client_contacts       (CASCADE)
               ├── rbo_client_credentials    (CASCADE)
               ├── rbo_client_equipment      (CASCADE) ── rbo_equipment_credentials (CASCADE)
               │        └── tipo_id → rbo_equipment_types
               ├── rbo_contratos ── tipologia_id → rbo_tipologias
               │        └── rbo_movimentos ── tecnico_id → rbo_tecnicos
               │                          ├── local_id → rbo_locais
               │                          └── equipment_id → rbo_client_equipment
               ├── rbo_tickets ── contrato_id, equipamento_id, movimento_id
               │        └── rbo_ticket_historico (CASCADE)
               └── tecnico_resp_id → rbo_tecnicos

Tabelas de configuração: rbo_permissions, rbo_notificacoes_config, rbo_definicoes_globais,
rbo_tipologias, rbo_locais, rbo_credential_categories, rbo_equipment_types
```

FKs para tabelas auxiliares usam `ON DELETE SET NULL`; filhos diretos de cliente/equipamento/ticket usam `CASCADE` — **apagar um cliente apaga contactos, credenciais e equipamentos**, mas os contratos ficam órfãos (`cliente_id = null`).

### 6.2 Tabelas

**Pessoas e acessos**

| Tabela | Colunas relevantes | Notas |
|---|---|---|
| `rbo_profiles` | `id uuid` (= `auth.users.id`), `email`, `nome`, `ativo`, `is_tecnico`, `is_supervisor`, `dark_mode`, `accent`, `avatar_url` | Perfil de cada utilizador da app. Só `ativo = true` entra |
| `rbo_tecnicos` | `nome`, `email`, `telefone`, `ativo`, `profile_id uuid` (opcional) | Lista de técnicos para movimentos e clientes. Pode ter técnicos **sem login** (`profile_id null`). Utilizadores com `is_tecnico` são sincronizados aqui pelo `UtilizadoresPanel` |
| `rbo_permissions` | `chave` (unique), `label`, `descricao`, `ativo_supervisor`, `ativo_normal` | Matriz de permissões por perfil. Hoje só é usada `access_definicoes` |

**Clientes**

| Tabela | Colunas relevantes | Notas |
|---|---|---|
| `rbo_clientes` | `nome`, `nif`, `morada`, `localidade`, `cp`, `gps`, `telefone`, `telemovel`, `email`, `observacoes`, `consumidor_final`, `ativo`, `tecnico_resp_id → rbo_tecnicos` | `tecnico_id uuid → rbo_profiles` é **legado** (não usado no código) |
| `rbo_client_contacts` | `cliente_id`, `nome`, `cargo`, `email`, `telefone`, `telemovel` | |
| `rbo_client_credentials` | `cliente_id`, `categoria` (texto livre = nome de `rbo_credential_categories`), `url_ip`, `utilizador`, `password`, `notas`, `ordem` | **Passwords em texto simples** (ver §13) |
| `rbo_client_equipment` | `cliente_id`, `tipo_id`, `descricao`, `num_serie` (**unique**), `localizacao`, `ip`, `notas`, `ativo` | |
| `rbo_equipment_credentials` | `equipment_id`, `label`, `utilizador`, `password` | **Passwords em texto simples** |

**Contratos e créditos**

| Tabela | Colunas relevantes | Notas |
|---|---|---|
| `rbo_contratos` | `cliente_id`, `tipologia_id`, `data_contrato`, `ativo`, `notificacao_creditos_enviada_em` | O saldo **não é guardado**: é a soma de `rbo_movimentos.creditos` |
| `rbo_movimentos` | `contrato_id`, `tipo` (`credito` \| `assistencia`), `data`, `hora_inicio`/`hora_fim` (texto), `creditos int`, `descritivo`, `tecnico_id → rbo_tecnicos`, `local_id`, `equipment_id`, `relatorio_enviado_em` | Créditos positivos = carregamento; negativos = consumo. `profile_tecnico_id` é **legado** |
| `rbo_tipologias` | `nome`, `ativo` | Tipos de contrato |
| `rbo_locais` | `nome`, `ativo` | Locais de assistência. O fecho de tickets procura um local cujo nome contenha "rilop" |

**Tickets**

| Tabela | Colunas relevantes | Notas |
|---|---|---|
| `rbo_tickets` | `tipo` (`publico` \| `manual`), `estado` (ver §9.2), `cliente_id`, `equipamento_id`, `contrato_id`, `tecnico_id → rbo_profiles`, `nome_empresa`, `nome_pessoa`, `email_cliente`, `telefone_cliente`, `descricao_problema`, `notas_internas`, `data_inicio`, `hora_inicio`, `data_fim`, `hora_fim`, `duracao_minutos`, `movimento_id`, `solicitado_backup` | `tipo` e `estado` têm `CHECK` constraints. Atenção: aqui `tecnico_id` aponta para **perfis**, nos movimentos aponta para **rbo_tecnicos** |
| `rbo_ticket_historico` | `ticket_id`, `estado_anterior`, `estado_novo`, `alterado_por_id`, `nota` | Log de mudanças de estado |

**Configuração**

| Tabela | Conteúdo |
|---|---|
| `rbo_notificacoes_config` | Uma linha por `evento` (unique): `ticket_novo`, `ticket_estado`, `creditos_baixos`. Campos `ativa`, `destinatario_principal`, `destinatarios text[]`, `enviar_cliente` |
| `rbo_definicoes_globais` | Chave/valor. Conhecida: `creditos_limiar_alerta` |
| `rbo_credential_categories`, `rbo_equipment_types` | Listas auxiliares (`nome`, `ativo`) |

### 6.3 Funções e triggers

| Objeto | O que faz |
|---|---|
| `handle_new_user()` + trigger `on_auth_user_created` em `auth.users` | Cria `rbo_profiles` com `ativo = false` para cada novo utilizador Auth |
| `rbo_is_active_user()` | `true` se `auth.uid()` tem perfil ativo. Base de todas as políticas RLS |
| `rbo_can_manage_users()` | Espelha `checkPermission(…, 'access_definicoes')` no SQL (admin fixo incluído) |
| `rbo_guard_profile()` + trigger em `rbo_profiles` | Impede alterar `ativo`, `is_supervisor` ou `email` de perfis sem `rbo_can_manage_users()` |

### 6.4 RLS

RLS ativo em todas as tabelas. Política única por tabela: **`"active users"` — `FOR ALL TO authenticated USING/CHECK rbo_is_active_user()`**. O role `anon` não tem acesso a nenhuma tabela; o formulário público escreve via edge function com service role.

Implicação: qualquer utilizador ativo pode ler/escrever **tudo** (incluindo credenciais). As permissões finas existem só na UI (ver §7).

### 6.5 Storage

Bucket **`photos`** (público): avatares de utilizadores. Leitura pública; upload/update para `authenticated`.

### 6.6 Extensões instaladas
`pgcrypto`, `uuid-ossp`, `supabase_vault`, `pg_stat_statements`, `plpgsql`.

---

## 7. Autenticação, permissões e segurança

### Autenticação
- Email + password (`signInWithPassword`). Não há "esqueci-me da password" na UI — reset feito pelo dashboard Supabase (§12).
- Após login, `App.jsx` carrega `rbo_profiles` e `rbo_permissions`. Sem perfil ou com `ativo = false` → ecrã **Acesso negado**.
- O signup Auth tem de estar ligado porque a criação de utilizadores usa `auth.signUp` (§9.5); a confirmação por email deve manter-se **ligada** (ver §13).

### Níveis de utilizador
| Nível | Como se define | Acesso |
|---|---|---|
| **Admin** | Email igual a `ADMIN_EMAIL` (hardcoded em `src/lib/permissions.js`, `supabase/functions/create-user` e `rbo_can_manage_users()`) | Tudo; gere permissões |
| **Supervisor** | `rbo_profiles.is_supervisor` | Coluna `ativo_supervisor` de `rbo_permissions`; gere permissões |
| **Normal** | resto | Coluna `ativo_normal` |

Permissão existente: `access_definicoes` (ver/usar a página Definições, incluindo criar utilizadores).

> ⚠️ Ao passar o projeto, **mudar o `ADMIN_EMAIL` nos três sítios** (ou promover o novo responsável a supervisor).

### Camadas de proteção
1. **RLS** — só utilizadores ativos acedem a dados (§6.4).
2. **Trigger `rbo_guard_profile`** — impede auto-promoção.
3. **Edge functions** — validam quem chama (§8).
4. **`vercel.json`** — CSP restritiva (só Supabase, Turnstile e Google Fonts), HSTS, `X-Frame-Options: DENY`. Ao adicionar um serviço externo é preciso atualizar a CSP.
5. **Turnstile** no formulário público.

---

## 8. Edge functions

Código em `supabase/functions/`, runtime Deno. **Não são publicadas automaticamente** — ver §11.

| Função | Chamada por | Autorização | O que faz |
|---|---|---|---|
| `create-user` | Definições → Utilizadores | Perfil ativo com `access_definicoes` (ou admin) | Upsert em `rbo_profiles` com `ativo = true` (service role) |
| `send-email` | Todos os envios de email do frontend (`src/lib/email.js`) | Utilizador ativo (`rbo_is_active_user`) | Envia via Resend como `Rilop <noreply@rilop.pt>`. Aceita destinatários em array ou separados por `;`/`,` |
| `public-ticket-form` | `/pedido` (sem login) | Token Turnstile válido | Cria ticket `publico`/`submetido`, regista histórico e envia email `ticket_novo` diretamente pelo Resend |

Todas aplicam CORS a partir de `ALLOWED_ORIGINS`. Logs: Supabase → Edge Functions → *função* → Logs.

---

## 9. Fluxos de negócio

### 9.1 Créditos e contratos
- Um contrato tem saldo = `Σ rbo_movimentos.creditos`.
- **Carregar créditos**: no detalhe do contrato, "Adicionar Créditos" cria movimento `tipo = credito` (positivo) e limpa `notificacao_creditos_enviada_em`.
- **Registar assistência**: movimento `tipo = assistencia` com créditos negativos, técnico, local, equipamento e horas.
- **Conversão**: `créditos = -ceil(minutos / 15)` (`calcularCreditos` em `TicketDetalhe.jsx`).
- **Alerta de créditos baixos**: após um movimento, se o saldo ficar abaixo de `creditos_limiar_alerta` e o evento `creditos_baixos` estiver ativo, abre-se um modal para enviar email ao cliente; o envio regista `notificacao_creditos_enviada_em`.
- **Relatórios**: por movimento (marca `relatorio_enviado_em`) e por período; podem ser enviados por email ou abertos para impressão/PDF.

### 9.2 Ciclo de vida de um ticket

Estados e transições permitidas (`src/pages/Tickets/helpers.js` + `CHECK` na BD):

| De | Pode passar a |
|---|---|
| `submetido` | `pendente`, `cancelado` |
| `pendente` | `atribuido`, `cancelado` |
| `atribuido` | `em_curso`, `pendente`, `cancelado` |
| `em_curso` | `aguarda_cliente`, `concluido`, `cancelado` |
| `aguarda_cliente` | `em_curso`, `concluido`, `cancelado` |
| `concluido` | `reaberto` |
| `reaberto` | `em_curso`, `concluido`, `cancelado` |
| `cancelado` | — (final) |

Ao alterar estados, mudar **todos estes sítios**: `TRANSICOES`/`ESTADOS` em `helpers.js` e o `CHECK rbo_tickets_estado_check` na BD (e o mapa duplicado em `templates/ticketEstadoEmail.js`).

- **Origem**: `publico` (formulário `/pedido`) ou `manual` (criado na app).
- **Triagem**: um ticket público chega como `submetido` com dados livres (empresa, pessoa…); na triagem associa-se a um cliente/equipamento/contrato existente (ou cria-se) e passa a `pendente`.
- **Atribuição**: escolher técnico (perfil com `is_tecnico`) → `atribuido`.
- **Conclusão**: exige data início, data fim e duração. Se o ticket tiver contrato com saldo > 0, oferece descontar créditos: cria um movimento `assistencia` (local "Rilop…", técnico mapeado via `rbo_tecnicos.profile_id`) e liga-o em `rbo_tickets.movimento_id`.
- Cada mudança de estado grava `rbo_ticket_historico` e dispara o email `ticket_estado` (se ativo).
- **Ficha de assistência**: botão de impressão gera duas vias (cliente e Rilop).

### 9.3 Formulário público `/pedido`
Página sem login → Turnstile invisível → `public-ticket-form` → ticket `submetido` + email para a equipa. Configurar destinatários em Definições → Notificações → *Novo ticket*.

### 9.4 Credenciais
Por cliente (agrupadas por categoria, com pesquisa e botão copiar) e por equipamento. Categorias geridas em Definições.

### 9.5 Criação de utilizadores
Definições → Utilizadores → Novo:
1. `auth.signUp` cria o utilizador Auth → trigger cria perfil **inativo**.
2. `create-user` ativa o perfil e grava nome/`is_tecnico`.
3. Se técnico, cria/atualiza registo em `rbo_tecnicos`.
4. O utilizador recebe email de confirmação (template em `supabase/email-templates/confirm-signup.html`) e só consegue entrar após confirmar.

---

## 10. Emails e notificações

| Evento (`rbo_notificacoes_config.evento`) | Quando | Destinatários | Template |
|---|---|---|---|
| `ticket_novo` | Ticket criado (público ou manual) | `destinatario_principal` + `destinatarios` em CC | `public-ticket-form` (inline) / `features/email/templates/newTicketEmail.js` |
| `ticket_estado` | Mudança para `atribuido`, `em_curso`, `aguarda_cliente`, `reaberto`, `concluido` ou `cancelado` | Cliente (se `enviar_cliente`) com `destinatarios` em CC; sem cliente, o 1.º de `destinatarios` | `templates/ticketEstadoEmail.js` |
| `creditos_baixos` | Saldo abaixo do limiar (confirmação manual num modal) | Email do cliente; `destinatarios` em BCC | `templates/lowCreditsEmail.js` |
| — | Relatórios de contrato/movimento (manual) | Escolhidos no modal | `features/email/reportHtml.js` |

Todos usam o remetente `Rilop <noreply@rilop.pt>`. Se os emails deixarem de sair, ver §12.

---

## 11. Deploy

### Frontend (Vercel)
- Git integration: push/merge em `main` → deploy de produção; outros branches → preview.
- Build: `vite build` → `dist/` (definido em `vercel.json`).
- Variáveis em Vercel → Settings → Environment Variables (§3). Alterar uma variável exige novo deploy.

### Edge functions (manual)
Não há CI. Depois de alterar `supabase/functions/*`:
- **Dashboard**: Supabase → Edge Functions → *função* → editar código → Deploy (colar o conteúdo de `index.ts`); **ou**
- **CLI**: `supabase functions deploy <nome> --project-ref <ref>`.

> O repositório é a fonte de verdade: nunca editar só no dashboard sem refletir no Git.

### Base de dados
Sem migrations. Alterações são feitas no SQL Editor; **documentar aqui (§6) e, idealmente, guardar o SQL num ficheiro `supabase/migrations/AAAAMMDD_descricao.sql`**.

### Git
Branches `feat/…` ou `fix/…` → PR para `main`. Não fazer push direto para `main`.

---

## 12. Runbook operacional

**Criar utilizador** → §9.5. **Desativar**: Definições → Utilizadores → toggle ativo (não apaga dados; não é possível desativar a própria conta).

**Reset de password de um utilizador** → Supabase → Authentication → Users → *utilizador* → Send password recovery. (Quem tem acesso a Definições pode mudar a própria password em Definições → Utilizadores → editar o seu perfil.)

**Mudar o administrador** → alterar `ADMIN_EMAIL` em `src/lib/permissions.js`, `supabase/functions/create-user/index.ts` e na função SQL `rbo_can_manage_users()`; publicar frontend e edge function.

**Emails não chegam**
1. Definições → Notificações: evento ativo e destinatários preenchidos?
2. Supabase → Edge Functions → `send-email` / `public-ticket-form` → Logs (`[send-email] Resend error`).
3. Resend dashboard → Logs / estado do domínio `rilop.pt` (DNS SPF/DKIM).
4. Secret `RESEND_API_KEY` válido? (rodar se necessário).

**Formulário `/pedido` falha** → verificar `VITE_TURNSTILE_SITE_KEY` (Vercel), `TURNSTILE_SECRET_KEY` (Supabase), domínio autorizado no widget Cloudflare e `ALLOWED_ORIGINS`.

**Erro CORS numa edge function** → adicionar a origem a `ALLOWED_ORIGINS`.

**Rodar chaves**
- Resend / Turnstile: gerar nova chave no serviço → atualizar secret no Supabase (e `VITE_TURNSTILE_SITE_KEY` no Vercel se for a site key) → redeploy.
- Supabase anon/service role: Supabase → Settings → API → regenerar → atualizar Vercel → redeploy frontend. As edge functions recebem as novas automaticamente.

**Backup / schema da BD**
```bash
supabase login
supabase link --project-ref <ref>
supabase db dump --schema-only -f supabase/schema.sql   # estrutura
supabase db dump --data-only   -f backup-data.sql       # dados (NÃO commitar — contém credenciais)
```
Backups automáticos: ver plano em Supabase → Database → Backups.

**Auditar o schema rapidamente** → query de catálogo usada para gerar §6: tabelas/colunas (`pg_attribute`), constraints (`pg_constraint`), políticas (`pg_policies`), funções (`pg_get_functiondef`), triggers (`pg_trigger`).

**Ver quem tem acesso** → `select email, ativo, is_supervisor, is_tecnico from rbo_profiles order by email;`

---

## 13. Dívida técnica e pontos de atenção

Ordenado por prioridade.

1. **Passwords de clientes em texto simples** (`rbo_client_credentials.password`, `rbo_equipment_credentials.password`). Qualquer utilizador ativo, backup ou fuga da BD expõe-nas. Solução: cifrar com Supabase Vault (`supabase_vault`, já instalado) ou `pgcrypto`, decifrando só ao mostrar.
2. **Permissões só na UI.** O RLS distingue apenas ativo/inativo; um utilizador normal pode, via API, ler/alterar qualquer tabela (incluindo `rbo_permissions`). Se houver utilizadores com menos confiança, mover as regras para RLS.
3. **Schema sem migrations.** Gerar `supabase/schema.sql` (§12) e passar a versionar alterações.
4. **Admin hardcoded por email** em três sítios. Considerar uma coluna `is_admin`.
5. **Criação de utilizadores via `signUp` no cliente** obriga o signup público a estar ligado (qualquer pessoa pode criar conta Auth, embora fique inativa). Se a confirmação de email for desligada, o `signUp` troca a sessão do admin pela do novo utilizador e a criação falha. Melhor: criar o utilizador dentro de `create-user` com `auth.admin.createUser` e desligar o signup.
6. **Dois conceitos de técnico**: `rbo_profiles.is_tecnico` (tickets) vs `rbo_tecnicos` (movimentos, clientes), ligados por `profile_id`. Colunas legadas por remover: `rbo_clientes.tecnico_id`, `rbo_movimentos.profile_tecnico_id`.
7. **Operações não atómicas.** Fechar um ticket faz vários `update`/`insert` sequenciais a partir do browser; uma falha a meio deixa estado inconsistente. Candidato a função SQL (RPC).
8. **Saldo calculado no cliente**, somando todos os movimentos a cada vista. OK com o volume atual; criar view/RPC se crescer.
9. **Sem testes, lint ou CI.**
10. **Navegação sem URLs** — não há deep links nem botão "voltar" do browser.
11. **HTML gerado por string.** Os relatórios (`reportHtml.js`) ainda interpolam dados de clientes sem `escHtml` (dados introduzidos por utilizadores internos — risco baixo, mas convém uniformizar).
12. **URL de produção hardcoded** (`https://rbo-gules.vercel.app`) no email da função `public-ticket-form`.
13. **Sem ambiente de staging** — dev local usa a BD de produção.

### Histórico de segurança
- **2026-10-28** — Auditoria: políticas `allow all` (acesso anónimo total) substituídas por `active users`; perfis novos passam a nascer inativos; trigger anti-auto-promoção; `create-user` e `send-email` passam a validar quem chama; escape de HTML nos dados do formulário público (XSS na ficha de impressão). Recomenda-se verificar em Auth → Users se existem contas desconhecidas criadas antes desta data.
