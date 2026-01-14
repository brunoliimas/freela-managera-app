# Estratégia de Testes - Freela Manager

## Visão Geral

Este documento descreve a estratégia de testes implementada para o projeto Freela Manager, um sistema de gerenciamento de projetos freelance.

## Estrutura do Projeto

O projeto é um monorepo com duas aplicações principais:
- **API** (Node.js + Express + Prisma)
- **Web** (Next.js + React)

## 🧪 Testes da API

### Configuração

- **Framework**: Jest
- **Linguagem**: TypeScript
- **Preset**: ts-jest
- **Localização**: `apps/api/src/__tests__/`

### Como Executar

```bash
cd apps/api
npm test                  # Executar todos os testes
npm run test:watch        # Modo watch
npm run test:coverage     # Gerar relatório de cobertura
```

### Estrutura de Testes

```
apps/api/src/
├── __tests__/
│   ├── controllers/
│   │   ├── auth.test.ts
│   │   ├── clientes.test.ts
│   │   ├── projetos.test.ts
│   │   └── pagamentos.test.ts
│   └── utils/
│       └── pdf-data.test.ts
├── controllers/
├── middlewares/
└── utils/
```

### Controllers Testados

✅ **auth.controller.ts** - 100% de cobertura
- Registro de usuários
- Login
- Perfil de usuário
- Atualização de perfil

✅ **clientes.controller.ts** - 100% de cobertura
- Listagem e filtros
- Criação, atualização e exclusão
- Validações de negócio

✅ **projetos.controller.ts** - 94.39% de cobertura
- CRUD de projetos
- Criação a partir de orçamentos
- Gerenciamento de status e progresso

✅ **pagamentos.controller.ts** - 96.96% de cobertura
- Gestão de pagamentos
- Criação de parcelas
- Resumo financeiro

### Padrões de Teste da API

```typescript
import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

// 1. Mocks
const mockPrismaClienteFindMany = jest.fn();
jest.mock('../../config/database', () => ({
    __esModule: true,
    default: {
        cliente: {
            findMany: mockPrismaClienteFindMany,
        },
    },
}));

// 2. Importar controller depois dos mocks
import { getClientes } from '../../controllers/clientes.controller';

// 3. Estrutura de testes
describe('Clientes Controller', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockRequest = {
            userId: 'user-123',
            query: {},
            params: {},
            body: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        jest.clearAllMocks();
    });

    describe('getClientes', () => {
        it('deve retornar lista de clientes do usuário', async () => {
            // Arrange
            mockPrismaClienteFindMany.mockResolvedValue([...]);

            // Act
            await getClientes(mockRequest as AuthRequest, mockResponse as Response);

            // Assert
            expect(mockPrismaClienteFindMany).toHaveBeenCalledWith({...});
            expect(mockResponse.json).toHaveBeenCalledWith([...]);
        });
    });
});
```

### Cobertura Atual da API

```
File                         | % Stmts | % Branch | % Funcs | % Lines
-----------------------------|---------|----------|---------|--------
All files                    |   32.86 |    40.39 |   31.11 |   32.58
controllers                  |   46.06 |     43.8 |      40 |   46.54
  auth.controller.ts         |     100 |      100 |     100 |     100
  clientes.controller.ts     |     100 |      100 |     100 |     100
  projetos.controller.ts     |      90 |    78.37 |     100 |   94.39
  pagamentos.controller.ts   |   96.96 |    87.71 |     100 |     100
```

**Total de Testes da API**: 102 testes passando

## 🎨 Testes do Frontend

### Configuração

- **Framework**: Jest
- **Testing Library**: React Testing Library
- **Ambiente**: jsdom
- **Integração**: next/jest

### Como Executar

```bash
cd apps/web
npm test                  # Executar todos os testes
npm run test:watch        # Modo watch
npm run test:coverage     # Gerar relatório de cobertura
```

### Estrutura de Testes

```
apps/web/src/
├── components/
│   └── ui/
│       ├── __tests__/
│       │   └── button.test.tsx
│       └── button.tsx
└── ...
```

### Componentes Testados

✅ **Button** - 100% de cobertura
- Renderização básica
- Variantes (default, destructive, outline, ghost, link)
- Tamanhos (sm, default, lg, icon)
- Estados (disabled)
- Eventos (onClick)
- Props customizadas

### Padrões de Teste do Frontend

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button', () => {
  it('deve renderizar o botão com texto', () => {
    // Arrange & Act
    render(<Button>Clique aqui</Button>)

    // Assert
    expect(screen.getByRole('button', { name: 'Clique aqui' }))
      .toBeInTheDocument()
  })

  it('deve chamar onClick quando clicado', async () => {
    // Arrange
    const handleClick = jest.fn()
    const user = userEvent.setup()
    render(<Button onClick={handleClick}>Clique</Button>)

    // Act
    await user.click(screen.getByRole('button'))

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

**Total de Testes do Frontend**: 14 testes passando

## 📋 Próximos Passos

### Controllers Pendentes (API)

- [ ] milestones.controller.ts
- [ ] dashboard.controller.ts
- [ ] orcamentos.controller.ts
- [ ] relatorios.controller.ts
- [ ] solicitacoes.controller.ts
- [ ] arquivos.controller.ts

### Componentes Prioritários (Frontend)

- [ ] Form components (Input, Select, Textarea, Checkbox)
- [ ] Card, Dialog, Alert Dialog
- [ ] Componentes de negócio (clientes, projetos, pagamentos)
- [ ] Hooks customizados
- [ ] Páginas (testes de integração)

### Testes de Integração

- [ ] Fluxos completos de usuário
- [ ] Testes E2E com Playwright/Cypress
- [ ] Testes de API com supertest

### Melhorias Contínuas

- [ ] Aumentar cobertura para 80%+
- [ ] Adicionar testes de performance
- [ ] Implementar CI/CD com execução de testes
- [ ] Adicionar badges de cobertura no README

## 🛠️ Ferramentas e Dependências

### API
```json
{
  "jest": "^30.2.0",
  "ts-jest": "^29.4.5",
  "supertest": "^7.1.4",
  "@types/jest": "^30.0.0",
  "@types/supertest": "^6.0.3"
}
```

### Frontend
```json
{
  "jest": "^30.2.0",
  "jest-environment-jsdom": "^30.2.0",
  "@testing-library/react": "^16.3.1",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/user-event": "^14.6.1"
}
```

## 📚 Recursos e Referências

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Next.js Testing](https://nextjs.org/docs/testing)

## 🤝 Contribuindo

Ao adicionar novos recursos:

1. **Escreva testes primeiro** (TDD quando possível)
2. **Mantenha cobertura alta** (mínimo 80% para código novo)
3. **Siga os padrões** estabelecidos nos testes existentes
4. **Teste casos de erro** além dos casos de sucesso
5. **Use nomes descritivos** que expliquem o que está sendo testado

## 📊 Status Atual

### Resumo Geral

- ✅ **116 testes** passando (102 API + 14 Frontend)
- ✅ **4 controllers da API** com alta cobertura (>90%)
- ✅ **1 componente do Frontend** totalmente testado
- ✅ **Jest configurado** em ambas as aplicações
- ✅ **Scripts de teste** prontos para uso
- ✅ **Relatórios de cobertura** funcionando

### Cobertura por Camada

| Camada | Cobertura | Status |
|--------|-----------|--------|
| Controllers (API) | 46.06% | 🟡 Em progresso |
| Utils (API) | 17.69% | 🟡 Em progresso |
| Componentes UI (Web) | Inicial | 🟢 Iniciado |
| Hooks (Web) | 0% | ⚪ Não iniciado |
| Páginas (Web) | 0% | ⚪ Não iniciado |

---

**Última atualização**: Janeiro 2026
