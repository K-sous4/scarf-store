# Auditoria de Segurança — Scarf Store

**Referência:** ISO/IEC TS 19249:2017 — *Information technology — Security techniques — Catalogue of architectural and design principles for secure products, systems and applications*

**Escopo:** backend FastAPI, frontend Next.js, infraestrutura Render / Vercel / Neon / Upstash  
**Data:** 8 de junho de 2026  
**Método:** análise estática de código e inspeção de headers HTTP em produção

> A norma não impõe certificação. Ela cataloga princípios arquiteturais e de design para avaliar se um sistema suporta as propriedades de segurança desejadas.

---

## Resumo executivo

| Dimensão | Avaliação |
|----------|-----------|
| Autenticação / autorização na API | Boa |
| Separação de domínios (loja vs admin) | Parcial |
| Minimização de superfície de ataque | Melhorando |
| Gestão de segredos | Insuficiente |
| **Conformidade global ISO 19249** | **Parcial** |

---

## Legenda de status

| Status | Significado |
|--------|-------------|
| **Conforme** | Princípio atendido de forma consistente |
| **Parcial** | Implementado com lacunas relevantes |
| **Não conforme** | Gap significativo ou ausência do controle |

---

## 1. Princípios arquiteturais (Seção 4)

### 4.2 Separação de domínios — **Parcial**

| Item | Detalhe |
|------|---------|
| Conforme | Rotas admin com `get_current_admin`; cliente usa `/orders/me`; proxy Vercel isola browser do Render |
| Gap | Papel `admin` único concentra finanças, estoque, usuários e entregas |
| Evidência | `backend/api/v1/dependencies.py`, `frontend/src/middleware.ts` |

### 4.3 Camadas (Layering) — **Parcial**

| Item | Detalhe |
|------|---------|
| Conforme | Vercel → proxy Next → API FastAPI → Neon/Redis; validação Pydantic na API |
| Gap | Middleware Next verifica apenas presença do cookie `session_id`, não valida sessão no servidor |
| Evidência | `frontend/src/middleware.ts`, `frontend/src/app/api/v1/[...path]/route.ts` |

### 4.4 Encapsulamento — **Parcial**

| Item | Detalhe |
|------|---------|
| Conforme | `ProductPublicResponse` e `OrderCustomerResponse` limitam campos expostos |
| Gap | Respostas admin ainda carregam PII completa; histórico de JSON bruto no frontend |
| Evidência | `backend/api/v1/schemas/product.py`, `backend/api/v1/schemas/order.py`, `frontend/src/lib/api-mappers.ts` |

### 4.5 Redundância — **Parcial**

| Item | Detalhe |
|------|---------|
| Conforme | Neon e Upstash gerenciados; endpoint `/health` |
| Gap | Redis é ponto único de falha para sessões; health check não valida DB/Redis |
| Evidência | `backend/main.py`, `backend/services/session.py` |

### 4.6 Virtualização — **N/A**

Não aplicável diretamente (SaaS gerenciado: Render, Vercel, Neon, Upstash).

---

## 2. Princípios de design (Seção 5)

### 5.2.1 Privilégio mínimo — **Parcial**

| Camada | Status |
|--------|--------|
| API backend | Rotas sensíveis exigem `get_current_admin` |
| Frontend | Fetches admin condicionados ao `role === "admin"` |
| Cookie `user_role` | Legível por JavaScript (`httponly=False`) — apenas UX, aumenta superfície |

### 5.2.2 Minimização da superfície de ataque — **Parcial**

| Controle | Status |
|----------|--------|
| OpenAPI/docs desligados em produção | Implementado |
| Headers `server`, `x-render-origin-server`, `rndr-id` filtrados | Implementado |
| API pública sem `cost`, `sku`, estoque interno | Implementado |
| `poweredByHeader: false` no Next.js | Implementado |
| CSP / HSTS / Permissions-Policy | Pendente |
| Token de reset na query string | Pendente |
| Código JWT não utilizado | Pendente (remover) |

### 5.2.3 Validação centralizada de parâmetros — **Parcial**

| Item | Detalhe |
|------|---------|
| Conforme | Pydantic em auth, users, orders; upload com limite de tamanho e MIME |
| Gap | `POST /products/{id}/stock` aceita `dict` cru; upload não valida magic bytes |

### 5.2.4 Serviços de segurança centralizados — **Parcial**

| Item | Detalhe |
|------|---------|
| Conforme | `get_current_user` / `get_current_admin`, sessão Redis, `AuditLoggingMiddleware`, `SecurityHeadersMiddleware` |
| Gap | Rate limit apenas em login (username) e reset de senha; sem limite global por IP |

### 5.2.5 Tratamento de erros (fail secure) — **Parcial**

| Item | Detalhe |
|------|---------|
| Conforme | Sessão inválida → 401; não-admin → 403; mensagens genéricas no login |
| Gap | Redis indisponível → app inicia e auth falha silenciosamente; `ALLOWED_ORIGINS=*` com `credentials=True` é arriscado |

---

## 3. Propriedades de segurança

### 3.1 Confidencialidade — **Parcial**

| Controle | Status |
|----------|--------|
| Senhas com bcrypt (12 rounds) | Conforme |
| Cookie de sessão HttpOnly | Conforme |
| Schemas públicos reduzidos | Conforme |
| `.env` versionado no Git | **Não conforme** |
| `SECRET_KEY` / `admin123` fracos em defaults | **Não conforme** |
| `SQLAlchemy echo=True` em todos ambientes | **Não conforme** |
| Redis TLS com `ssl.CERT_NONE` | Parcial |

### 3.2 Integridade — **Parcial**

| Controle | Status |
|----------|--------|
| ORM SQLAlchemy parametrizado | Conforme |
| Validação de pedidos, estoque e termos | Conforme |
| Upload com whitelist MIME + limite 5 MB | Parcial |
| Senha admin default em produção | **Não conforme** |

### 3.3 Autenticidade — **Parcial**

| Controle | Status |
|----------|--------|
| Sessões UUID no Redis | Conforme |
| Invalidação de sessão após troca de senha | Conforme |
| MFA | Ausente |
| Política de senha (mín. 6 caracteres) | Fraca |

### 3.4 Responsabilização (Accountability) — **Parcial**

| Controle | Status |
|----------|--------|
| `audit_logs` com IP, user-agent, user_id | Conforme |
| `paid_by_admin_id`, `delivered_by_admin_id` em pedidos | Conforme |
| Política de retenção de logs | Ausente |
| Log de negócio separado (ex.: confirmação de pagamento) | Ausente |

### 3.5 Disponibilidade — **Parcial**

| Controle | Status |
|----------|--------|
| Expiração automática de pedidos pendentes | Conforme |
| Health check `/health` | Parcial (superficial) |
| Rate limiting global na API | Ausente |

### 3.6 Privacidade — **Parcial**

| Controle | Status |
|----------|--------|
| `OrderCustomerResponse` sem PII redundante | Conforme |
| `ProductPublicResponse` sem custo/SKU | Conforme |
| PIX público em `/payment-settings/public` | Intencional |
| Estoque numérico no catálogo | Aceito (UX) |
| Política de privacidade / LGPD documentada | Ausente |

### 3.7 Resiliência — **Parcial**

| Controle | Status |
|----------|--------|
| Rate limit login e reset de senha | Conforme |
| Proteção credential stuffing distribuído | Ausente |
| Fallback se Redis cair | Ausente |

### 3.8 Não-repúdio — **Parcial**

| Controle | Status |
|----------|--------|
| IDs de admin em ações de pagamento/entrega | Conforme |
| Logs imutáveis / assinados | Ausente |

---

## 4. Proteções web específicas

| Ameaça | Status | Notas |
|--------|--------|-------|
| XSS | Conforme (com ressalvas) | React escapa HTML; sem `dangerouslySetInnerHTML`; falta CSP |
| CSRF | Parcial | `SameSite=lax` + same-origin proxy; sem token CSRF explícito |
| CORS | Parcial | Origens configuráveis; methods/headers muito permissivos |
| Open redirect | Conforme | `frontend/src/lib/safe-redirect.ts` |

---

## 5. Achados prioritários

| Prioridade | Achado | Ação recomendada |
|------------|--------|------------------|
| **P0** | `.env` commitado com `SECRET_KEY` e `admin123` | Remover do histórico Git; rotacionar segredos |
| **P0** | Credenciais em `.env.render` (local, gitignored) | Rotacionar se expostas; usar secret manager Render |
| **P1** | Admin produção com senha default | Senha forte + troca obrigatória no 1º login |
| **P1** | Redis TLS com `ssl.CERT_NONE` | Habilitar verificação de certificado |
| **P1** | `echo=True` no SQLAlchemy | `echo=False` em `release` |
| **P2** | Sem CSP e HSTS | Adicionar em `next.config.ts` e middleware backend |
| **P2** | Middleware Next não valida sessão | Validar via `/auth/profile` no edge |
| **P3** | Separação de funções inexistente | Papéis `finance` / `fulfillment` / `superadmin` |

---

## 6. Remediações implementadas neste ciclo

- `ProductPublicResponse` / `OrderCustomerResponse` — minimização de dados na API
- `SecurityHeadersMiddleware` — remoção de headers que expõem stack
- Proxy Next.js filtra `x-render-origin-server`, `rndr-id`, `server`
- `poweredByHeader: false` + headers de segurança no Next.js
- OpenAPI/docs desabilitados fora de `development`
- `/health` e `/ping` sem `environment`/`mode` em produção
- `api-mappers.ts` — estado React sem campos internos
- Fetches admin condicionados ao role no frontend
- Middleware bloqueia rotas admin quando `user_role !== "admin"`
- Testes: `test_public_api.py`, `test_security_headers.py`

---

## 7. Próximos passos sugeridos

1. Segredos e senha admin (P0/P1)
2. Deploy das correções deste PR
3. CSP, HSTS, `echo=False`, Redis TLS verificado
4. Validação de sessão no middleware Next
5. RBAC e separação de funções (médio prazo)

---

## 8. Referências

- [ISO/IEC TS 19249:2017](https://www.iso.org/standard/64140.html)
- OWASP ASVS (complementar)
- LGPD — Lei nº 13.709/2018 (privacidade)

---

*Documento gerado a partir de auditoria estática. Não substitui pentest, scan de dependências ou avaliação formal Common Criteria (ISO/IEC 15408).*
