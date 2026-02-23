# Scarf Store - Frontend

Uma aplicação Next.js 16 moderna para gerenciar e visualizar uma loja de lenços premium.

## 🎯 Características

- ✅ **App Router Next.js 13+** - Estrutura moderna e escalável
- ✅ **TypeScript** - Type-safety total
- ✅ **Tailwind CSS v4** - Estilização rápida e responsiva
- ✅ **Autenticação JWT** - Com persistência de sessão
- ✅ **React 19** - Latest version
- ✅ **ESLint** - Code quality
- ✅ **Error Boundary** - Tratamento de erros robusto

## 📋 Pré-requisitos

- **Node.js** 18.17+ ou **npm** 9+
- **Backend em execução** (veja `.env` para configurar URL)

## 🚀 Quick Start

### 1. Instalação

```bash
# Instalar dependências
npm install
```

### 2. Configurar Variáveis de Ambiente

Verificar `.env` na raiz com:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Development

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Abrir em http://localhost:3000
```

O servidor reinicia automaticamente ao editar arquivos.

### 4. Build para Produção

```bash
# Build otimizado
npm run build

# Executar em produção
npm start
```

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── app/                    # App Router (Next.js routing)
│   │   ├── layout.tsx          # Root layout com ErrorBoundary
│   │   ├── page.tsx            # Página de login (default)
│   │   ├── globals.css         # Estilos globais
│   │   ├── admin/dashboard/    # Dashboard admin (protegido)
│   │   ├── home/               # Página inicial autenticada
│   │   ├── login/              # Página de login alternativa
│   │   └── api/                # Configurações de API
│   ├── components/             # Componentes reutilizáveis
│   │   ├── Header.tsx          # Navegação principal
│   │   ├── Footer.tsx          # Rodapé
│   │   ├── ProductCard.tsx     # Card de produto
│   │   ├── ProductGrid.tsx     # Grid de produtos
│   │   ├── ErrorBoundary.tsx   # Error boundary
│   │   ├── LoadingSkeletons.tsx # Componentes de loading
│   │   └── index.ts            # Barrel exports
│   ├── lib/                    # Utilitários e hooks
│   │   ├── api-client.ts       # Cliente HTTP centralizado
│   │   ├── use-auth.ts         # Hook de autenticação
│   │   └── hooks.ts            # Custom hooks adicionais
│   ├── types/                  # Type definitions
│   │   └── index.ts            # Tipos compartilhados
│   └── config/                 # Configurações
│       └── index.ts            # Config centralizada
├── public/                     # Arquivos estáticos
├── package.json
├── tsconfig.json
├── next.config.js              # Configuração Next.js
├── tailwind.config.ts          # Configuração Tailwind
├── eslint.config.mjs           # Configuração ESLint
└── README.md
```

## 🔐 Autenticação

O projeto usa autenticação baseada em **tokens JWT** com cookies.

### Login

```tsx
import { useAuth } from '@/lib/use-auth'

export default function LoginForm() {
  const { login, error, isLoading } = useAuth()
  
  const handleSubmit = async (username: string, password: string) => {
    const result = await login({ username, password })
    if (result.success) {
      router.push('/home') // Redirecionar para dashboard
    }
  }
}
```

### Verificar Autenticação

```tsx
import { useAuth } from '@/lib/use-auth'

export default function ProtectedComponent() {
  const { isAuthenticated, user, isLoading } = useAuth()
  
  if (isLoading) return <div>Carregando...</div>
  
  if (!isAuthenticated) return <div>Acesso negado</div>
  
  return <Dashboard user={user} />
}
```

### Logout

```tsx
const { logout } = useAuth()

const handleLogout = async () => {
  await logout()
  router.push('/')
}
```

## 🌐 Variáveis de Ambiente

As variáveis são definidas em `.env` na raiz do projeto:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_API_RETRIES=3
```

**Nota:** Variáveis com prefixo `NEXT_PUBLIC_` são expostas ao frontend.

## 📦 Dependências Principais

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| next | 16.1.6 | Framework principal |
| react | 19.2.3 | Biblioteca UI |
| typescript | ^5 | Type safety |
| tailwindcss | ^4 | Estilização |
| eslint | ^9 | Code linting |

## 🧪 Linting & Code Quality

```bash
# Executar ESLint
npm run lint
```

Usa config Next.js automática com TypeScript.

## ⚙️ Scripts Disponíveis

```bash
npm run dev        # Iniciar dev server
npm run build      # Build otimizado
npm start          # Executar build
npm run lint       # Executar ESLint
```

## 📊 Performance & Otimizações

- ✅ **React Strict Mode** ativado (detecção de bugs)
- ✅ **Image Optimization** com Next.js Image
- ✅ **Code Splitting** automático por rota
- ✅ **CSS Purging** com Tailwind
- ✅ **Console Removal** em produção

## 🛡️ Segurança

- ✅ CSRF protection via tokens
- ✅ Session management com cookies
- ✅ Type-safe API calls com TypeScript
- ✅ Error boundaries para evitar crashes
- ✅ Validação de dados com Zod

## 🐛 Troubleshooting

### "API não conecta"

```bash
# 1. Verificar se backend está rodando
curl http://localhost:8000/health

# 2. Verificar variável de ambiente
echo $NEXT_PUBLIC_API_URL  # Deve ser http://localhost:8000

# 3. Verificar .env
cat .env
```

### "Session expirou ou erro de autenticação"

```bash
# Limpar armazenamento local:
# 1. Dev Tools > Application > Storage > Clear All
# 2. Fazer login novamente
```

### "Erro de build"

```bash
# Limpar cache e reconstruir
rm -rf .next
npm run build
```

## 📚 Recursos Úteis

- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Guide](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org)
- [Tailwind CSS Docs](https://tailwindcss.com)

## 🤝 Contributing

1. Criar branch: `git checkout -b feature/descricao`
2. Commit: `git commit -m "feat: descrição"`
3. Push: `git push origin feature/descricao`
4. Abrir Pull Request

## 📝 Convenções de Código

- **Components**: PascalCase (`ProductCard.tsx`)
- **Hooks/Functions**: camelCase (`useAuth.ts`)
- **Type Safety**: Sempre usar TypeScript (sem `any`)
- **Path Aliases**: Use `@/` (ex: `@/components/Button`)
- **Documentation**: JSDoc para componentes complexos

## 📄 Licença

Proprietary - Scarf Store © 2026
