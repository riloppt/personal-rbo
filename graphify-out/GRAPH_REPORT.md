# Graph Report - C:/Users/sergiohenriques/GitHub/personal-rbo  (2026-05-24)

## Corpus Check
- Corpus is ~34,089 words - fits in a single context window. You may not need a graph.

## Summary
- 225 nodes · 766 edges · 14 communities (13 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Core App Shell & Navigation|Core App Shell & Navigation]]
- [[_COMMUNITY_Contracts & Equipment Management|Contracts & Equipment Management]]
- [[_COMMUNITY_Client Detail & Service Components|Client Detail & Service Components]]
- [[_COMMUNITY_Client & Credentials Management|Client & Credentials Management]]
- [[_COMMUNITY_Contract Reports & Email Delivery|Contract Reports & Email Delivery]]
- [[_COMMUNITY_Auth, Security & Deployment Config|Auth, Security & Deployment Config]]
- [[_COMMUNITY_NPM Dependencies|NPM Dependencies]]
- [[_COMMUNITY_Email Edge Function|Email Edge Function]]
- [[_COMMUNITY_Admin Edge Function|Admin Edge Function]]
- [[_COMMUNITY_Resend Email Edge Function|Resend Email Edge Function]]
- [[_COMMUNITY_Vercel Deployment Config|Vercel Deployment Config]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 81 edges
2. `sb` - 26 edges
3. `Icon()` - 25 edges
4. `Btn()` - 20 edges
5. `Card()` - 19 edges
6. `Loading()` - 17 edges
7. `Input()` - 15 edges
8. `fmtDate()` - 15 edges
9. `Badge()` - 14 edges
10. `Modal()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Login Vault Standalone Page` --semantically_similar_to--> `App Entry HTML (index.html)`  [INFERRED] [semantically similar]
  public/login-vault.html → index.html
- `Content Security Policy` --references--> `Cloudflare Turnstile Script`  [EXTRACTED]
  vercel.json → index.html
- `Supabase Client (Vault)` --implements--> `Supabase Auth System`  [EXTRACTED]
  public/login-vault.html → package.json
- `Confirm Signup Email Template` --implements--> `Supabase Auth System`  [EXTRACTED]
  supabase/email-templates/confirm-signup.html → package.json
- `SPA Catch-All Rewrite` --rationale_for--> `React Router DOM v7`  [INFERRED]
  vercel.json → package.json

## Hyperedges (group relationships)
- **Supabase Authentication Flow** — concept_supabase_auth, loginvault_supabase_client, confirmsignup_email, confirmsignup_confirmation_url [INFERRED 0.90]
- **SPA Deployment Stack (Vite + React + Vercel)** — packagejson_personal_rbo, verceljson_config, indexhtml_entry, indexhtml_main_jsx [INFERRED 0.90]
- **Security Layer: CSP + Turnstile + HSTS** — verceljson_csp, indexhtml_turnstile, verceljson_config [EXTRACTED 0.95]

## Communities (14 total, 1 thin omitted)

### Community 0 - "Core App Shell & Navigation"
Cohesion: 0.11
Nodes (17): AccessDenied(), LoginScreen(), BottomNav(), getInitials(), Sidebar(), sb, App(), navItems (+9 more)

### Community 1 - "Contracts & Equipment Management"
Cohesion: 0.16
Nodes (18): Contratos(), CategoriasCredenciaisPanel(), Avatar(), getInitials(), UtilizadoresPanel(), EquipamentoDetalhe(), Equipamentos(), useSortable() (+10 more)

### Community 2 - "Client Detail & Service Components"
Cohesion: 0.25
Nodes (15): ClienteDetalhe(), EquipamentosPanel(), AssistenciaModal(), calcCredits(), fmtDuration(), buildNewTicketEmail(), Btn(), CopyBtn() (+7 more)

### Community 3 - "Client & Credentials Management"
Cohesion: 0.11
Nodes (19): ContactosPanel(), CredenciaisPanel(), ClientesPage(), DefinicaoPanel(), Definicoes(), GeraisPanel(), NotificacaoCard(), NotificacoesPanel() (+11 more)

### Community 4 - "Contract Reports & Email Delivery"
Cohesion: 0.12
Nodes (19): ContratoDetalhe(), EmailConfirmModal(), EmailReportBtn(), buildPeriodReportHtml(), buildReportHtml(), sendEmailResend(), buildLowCreditsEmail(), buildTicketEstadoEmail() (+11 more)

### Community 5 - "Auth, Security & Deployment Config"
Cohesion: 0.10
Nodes (25): RBO Rilop BackOffice Application, Supabase Auth System, RBO Brand Identity in Email, Supabase ConfirmationURL Template Variable, Confirm Signup Email Template, App Entry HTML (index.html), src/main.jsx Entry Point, Cloudflare Turnstile Script (+17 more)

### Community 6 - "NPM Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, react, react-dom, react-router-dom, @supabase/supabase-js, devDependencies, vite, @vitejs/plugin-react (+8 more)

### Community 7 - "Email Edge Function"
Cohesion: 0.22
Nodes (6): ALLOWED_ORIGINS, cc, emailBody, fd, resendKey, sb

### Community 8 - "Admin Edge Function"
Cohesion: 0.40
Nodes (3): ALLOWED_ORIGINS, sbAdmin, sbAnon

### Community 9 - "Resend Email Edge Function"
Cohesion: 0.40
Nodes (3): ALLOWED_ORIGINS, body, resendKey

### Community 10 - "Vercel Deployment Config"
Cohesion: 0.50
Nodes (3): headers, outputDirectory, rewrites

## Knowledge Gaps
- **45 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+40 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Client & Credentials Management` to `Core App Shell & Navigation`, `Contracts & Equipment Management`, `Client Detail & Service Components`, `Contract Reports & Email Delivery`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Why does `sb` connect `Core App Shell & Navigation` to `Contracts & Equipment Management`, `Client Detail & Service Components`, `Client & Credentials Management`, `Contract Reports & Email Delivery`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `fmtDate()` connect `Contract Reports & Email Delivery` to `Contracts & Equipment Management`, `Client Detail & Service Components`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _46 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core App Shell & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.11088709677419355 - nodes in this community are weakly interconnected._
- **Should `Client & Credentials Management` be split into smaller, more focused modules?**
  _Cohesion score 0.11397849462365592 - nodes in this community are weakly interconnected._
- **Should `Contract Reports & Email Delivery` be split into smaller, more focused modules?**
  _Cohesion score 0.1206896551724138 - nodes in this community are weakly interconnected._