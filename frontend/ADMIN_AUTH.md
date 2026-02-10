# 🧣 Scarf Store - Frontend Admin & Auth

## Páginas Implementadas

### 1. **Página de Login** (`/login`)
Sistema de autenticação baseado em sessões HTTP com tokens CSRF.

**Funcionalidades:**
- ✅ Validação de email e senha
- ✅ Armazenamento de tokens CSRF no localStorage
- ✅ Armazenamento de dados do usuário
- ✅ Redirect automático se já autenticado
- ✅ Mensagens de erro amigáveis em português

**URL:** http://localhost:3001/login

**Credenciais de teste:**
```
Email: admin@scarfstore.com
Senha: admin123
```

---

### 2. **Admin Dashboard** (`/admin/dashboard`)
Interface administrativa protegida para gerenciar produtos.

**Funcionalidades:**
- ✅ Verificação de autenticação (ProtectedRoute)
- ✅ Verificação de role admin
- ✅ Logout com limpeza de tokens
- ✅ Abas para diferentes seções
- ✅ Display do nome do usuário logado

**URL:** http://localhost:3001/admin/dashboard

---

## Componentes Criados

### **ProtectedRoute**
Componente wrapper que protege rotas requerendo autenticação e role específico.

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <YourComponent />
    </ProtectedRoute>
  )
}
```

**Comportamento:**
- Verifica se usuário está autenticado
- Verifica role do usuário (admin/user)
- Redireciona para login se não autenticado
- Redireciona para home se role inválido
- Mostra loading enquanto verifica

---

### **ProductStockList**
Tabela interativa para gerenciar estoque de produtos.

**Funcionalidades:**
- ✅ Listagem de todos os produtos
- ✅ Edição rápida de estoque via modal
- ✅ Deleção de produtos com confirmação
- ✅ Status visual do estoque (verde, amarelo, vermelho)
- ✅ Status de ativação do produto
- ✅ Estados de carregamento e erro

**Ações disponíveis:**
- **Editar estoque:** Clique no botão ✏️
- **Deletar produto:** Clique no botão 🗑️

---

### **CreateProductForm**
Formulário completo para criar novos produtos.

**Campos:**
- SKU (obrigatório)
- Nome do Produto (obrigatório)
- Descrição Curta (obrigatório)
- Descrição Longa
- Preço em R$ (obrigatório)
- Desconto em % (0-100)
- Estoque (obrigatório)
- Cor
- Material
- Instruções de Cuidado
- Checkboxes:
  - ✅ Destaque
  - ✅ Novo
  - ✅ Ativo

**Funcionalidades:**
- ✅ Validação de campos obrigatórios
- ✅ Validação de valores numéricos
- ✅ Mensagens de erro inline
- ✅ Botão para limpar formulário
- ✅ Loading state durante submissão
- ✅ Mensagens de sucesso/erro

---

## Hook de Autenticação

### **useAuth()**
Hook customizado para gerenciar estado de autenticação.

```typescript
import { useAuth } from '@/lib/use-auth'

export function MyComponent() {
  const {
    user,
    csrfToken,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout
  } = useAuth()

  // usar no componente...
}
```

**Retorno:**
```typescript
{
  user: User | null,           // Dados do usuário autenticado
  csrfToken: string | null,    // Token CSRF armazenado
  isAuthenticated: boolean,     // Se usuário está autenticado
  isLoading: boolean,           // Se está processando
  error: string | null,         // Mensagem de erro
  login: (credentials) => Promise<{success, error}>,  // Função de login
  logout: () => Promise<{success}>  // Função de logout
}
```

**Armazenamento:**
- CSRF Token: localStorage `scarf_csrf_token`
- Dados do usuário: localStorage `scarf_user`
- Restaura automaticamente ao carregar página

---

## Integração com API Backend

### **Fluxo de Autenticação**

1. **Login Request:**
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@scarfstore.com",
  "password": "admin123"
}
```

2. **Login Response:**
```json
{
  "user": {
    "id": 1,
    "email": "admin@scarfstore.com",
    "username": "admin",
    "full_name": "Administrator",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "csrf_token": "eyJ..."
}
```

3. **Armazenamento:**
- CSRF Token é armazenado em localStorage
- Usuário é armazenado em localStorage
- Cookies de sessão são mantidos automaticamente

### **Requisições Autenticadas**

O APIClient envia automaticamente:
- **Header**: `X-CSRF-Token: <token>` (para POST, PUT, DELETE)
- **Cookies**: Automaticamente via `credentials: 'include'`

```typescript
// Exemplo de requisição POST com proteção CSRF
await apiClient.post('/api/v1/admin/products', {
  name: "Novo Produto",
  price: 99.99
})
// Automaticamente inclui:
// - X-CSRF-Token header
// - Cookies de sessão
// - Content-Type: application/json
```

---

## Fluxos de Uso

### **Fluxo de Login**

1. Usuário acessa `/login`
2. Insere email e senha
3. Sistema valida credenciais no backend
4. Backend retorna usuário + CSRF token
5. Frontend armazena em localStorage
6. Redireciona para `/admin/dashboard`

### **Fluxo de Criar Produto**

1. Usuário acessa `/admin/dashboard`
2. Clica na aba "Criar Produto"
3. Preenche formulário
4. Clica "Criar Produto"
5. Frontend valida dados
6. Envia POST para `/api/v1/admin/products`
7. Inclui CSRF token automaticamente
8. Mostra mensagem de sucesso/erro

### **Fluxo de Editar Estoque**

1. Usuário acessa `/admin/dashboard`
2. Clica na aba "Gerenciar Estoque"
3. Clica no botão ✏️ de um produto
4. Modal abre com campo de estoque
5. Usuário altera valor
6. Clica "Salvar"
7. Frontend envia PUT com novo estoque
8. Inclui CSRF token automaticamente

### **Fluxo de Logout**

1. Usuário clica "Sair"
2. Frontend chama POST `/api/v1/auth/logout`
3. Backend invalida sessão
4. Frontend limpa localStorage
5. Redireciona para `/login`

---

## Testes

### **Rodando Testes de Integração**

```bash
bash /home/k-sous4/Projects/scarf-store/test-integration.sh
```

Este script testa:
1. Login e obtenção de CSRF token
2. Criação de novo produto
3. Listagem de produtos
4. Obtenção de detalhes do produto

---

## Estrutura de Arquivos Criados

```
frontend/
├── src/
│   ├── app/
│   │   ├── login/
│   │   │   └── page.tsx              ✅ Página de login
│   │   └── admin/
│   │       └── dashboard/
│   │           └── page.tsx          ✅ Admin dashboard
│   │
│   ├── lib/
│   │   └── use-auth.ts               ✅ Hook de autenticação
│   │
│   └── components/
│       ├── ProtectedRoute.tsx        ✅ Wrapper de rotas protegidas
│       ├── ProductStockList.tsx      ✅ Gerenciamento de estoque
│       └── CreateProductForm.tsx     ✅ Formulário de criação
│
└── test-integration.sh               ✅ Script de testes
```

---

## Melhorias Realizadas no APIClient

### **Antes:**
```typescript
// Sem suporte a CSRF token
// Sem retry logic
// Sem timeout
```

### **Depois:**
```typescript
// ✅ Adiciona X-CSRF-Token automaticamente
// ✅ Retry logic (3 tentativas por padrão)
// ✅ Timeout de 30 segundos
// ✅ Inclui cookies de sessão (credentials: 'include')
// ✅ Tratamento de erro melhorado
```

---

## Variáveis de Ambiente

### `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## URLs e Endpoints

| Página/Função | URL |
|---|---|
| Login | http://localhost:3001/login |
| Admin Dashboard | http://localhost:3001/admin/dashboard |
| Home (pública) | http://localhost:3001 |

| Endpoint | Método | Descrição |
|---|---|---|
| `/api/v1/auth/login` | POST | Login de usuário |
| `/api/v1/auth/logout` | POST | Logout de usuário |
| `/api/v1/admin/products` | POST | Criar produto |
| `/api/v1/admin/products/{id}` | PUT | Atualizar produto |
| `/api/v1/admin/products/{id}` | DELETE | Deletar produto |

---

## Próximos Passos (Opcional)

- [ ] Página de edição de produto (edit form)
- [ ] Dashboard com estatísticas
- [ ] Busca e filtros avançados de produtos
- [ ] Carrinho de compras
- [ ] Sistema de checkout
- [ ] Gestão de usuários
- [ ] Gestão de pedidos
- [ ] Confirmação por email
- [ ] Recuperação de senha
- [ ] Two-factor authentication

---

## Troubleshooting

### **Erro: "Acesso não autorizado"**
- Verifique se o CSRF token está sendo enviado
- Verifique se os cookies de sessão estão sendo mantidos
- Tente fazer logout e login novamente

### **Erro: "Token expirado"**
- O backend atualiza o token automaticamente a cada requisição
- Se o erro persistir, faça login novamente

### **Formulário não submete**
- Verifique se há mensagens de validação em vermelho
- Preencha todos os campos obrigatórios
- Verifique o console do navegador para erros

### **Tabela de estoque não carrega**
- Verifique se o backend está rodando
- Verifique se há produtos cadastrados
- Verifique o console para erros de fetch

---

**Desenvolvido com ❤️ para Scarf Store**
