# 🧪 Guia Rápido de Testes

## Status Atual

✅ **116 testes** implementados e passando
- 🔧 **API (Backend)**: 102 testes
- 🎨 **Web (Frontend)**: 14 testes

## Executar Testes

### API (Backend)

```bash
# Executar todos os testes
npm test

# Executar em modo watch (desenvolvimento)
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

### Web (Frontend)

```bash
# Acessar o diretório do frontend
cd apps/web

# Executar todos os testes
npm test

# Executar em modo watch
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

## Executar Todos os Testes do Projeto

```bash
# A partir da raiz do projeto
npm test
```

## Cobertura Atual

### API (Backend)

| Controller | Cobertura | Testes |
|-----------|-----------|--------|
| auth.controller.ts | 100% | ✅ 29 testes |
| clientes.controller.ts | 100% | ✅ 20 testes |
| projetos.controller.ts | 94.39% | ✅ 23 testes |
| pagamentos.controller.ts | 96.96% | ✅ 29 testes |
| pdf-data.ts | 90.9% | ✅ 1 teste |

**Total**: 102 testes passando

### Web (Frontend)

| Componente | Cobertura | Testes |
|-----------|-----------|--------|
| Button | 100% | ✅ 14 testes |

**Total**: 14 testes passando

## Estrutura de Testes

```
freela-managera-app/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   └── __tests__/
│   │   │       ├── controllers/
│   │   │       │   ├── auth.test.ts
│   │   │       │   ├── clientes.test.ts
│   │   │       │   ├── projetos.test.ts
│   │   │       │   └── pagamentos.test.ts
│   │   │       └── utils/
│   │   │           └── pdf-data.test.ts
│   │   ├── jest.config.js
│   │   └── package.json
│   │
│   └── web/
│       ├── src/
│       │   └── components/
│       │       └── ui/
│       │           └── __tests__/
│       │               └── button.test.tsx
│       ├── jest.config.js
│       ├── jest.setup.js
│       └── package.json
│
├── TESTING.md           # Documentação completa de testes
└── README_TESTS.md      # Este arquivo (guia rápido)
```

## Relatórios de Cobertura

Após executar `npm run test:coverage`, os relatórios estarão disponíveis em:

- **API**: `apps/api/coverage/`
- **Web**: `apps/web/coverage/`

Abra o arquivo `coverage/lcov-report/index.html` no navegador para visualizar o relatório detalhado.

## Adicionar Novos Testes

### Para Controllers da API

1. Crie um arquivo em `apps/api/src/__tests__/controllers/`
2. Siga o padrão dos testes existentes
3. Execute `npm test` para validar

Exemplo:
```typescript
import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

describe('Meu Controller', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockRequest = { userId: 'user-123', body: {} };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    it('deve fazer algo', async () => {
        // Arrange
        // Act
        // Assert
    });
});
```

### Para Componentes do Frontend

1. Crie um diretório `__tests__` ao lado do componente
2. Crie o arquivo de teste com sufixo `.test.tsx`
3. Execute `npm test` para validar

Exemplo:
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MeuComponente } from '../meu-componente'

describe('MeuComponente', () => {
  it('deve renderizar corretamente', () => {
    render(<MeuComponente />)
    expect(screen.getByText('Texto')).toBeInTheDocument()
  })
})
```

## CI/CD

Os testes podem ser integrados ao CI/CD adicionando aos workflows:

```yaml
# .github/workflows/tests.yml
- name: Run API Tests
  run: npm test

- name: Run Frontend Tests
  run: cd apps/web && npm test
```

## Próximos Passos

Consulte [TESTING.md](./TESTING.md) para:
- Lista completa de controllers pendentes
- Padrões e boas práticas
- Estratégia de testes detalhada
- Roadmap de cobertura

---

**Documentação completa**: [TESTING.md](./TESTING.md)
