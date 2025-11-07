import {
  prepareDadosParaPDF,
  validarOrcamentoParaPDF,
  formatarEmpresaData,
  formatarClienteData,
} from '../../utils/pdf-data';

describe('PDF Data Utils', () => {
  describe('validarOrcamentoParaPDF', () => {
    it('deve validar orçamento completo', () => {
      const orcamento = {
        id: '1',
        number: 'ORC-001',
        title: 'Website',
        description: 'Site institucional',
        value: 5000,
        cliente: {
          name: 'João',
          email: 'joao@email.com',
        },
        user: {
          name: 'Sua Empresa',
          email: 'contato@empresa.com',
        },
        createdAt: new Date(),
      };

      expect(() => validarOrcamentoParaPDF(orcamento as any)).not.toThrow();
    });

    it('deve lançar erro se não tiver título', () => {
      const orcamento = {
        id: '1',
        number: 'ORC-001',
        title: '',
        description: 'Descrição',
        value: 5000,
        cliente: { name: 'João', email: 'joao@email.com' },
        user: { name: 'Empresa', email: 'empresa@email.com' },
        createdAt: new Date(),
      };

      expect(() => validarOrcamentoParaPDF(orcamento as any)).toThrow(
        'Título do orçamento é obrigatório'
      );
    });

    it('deve lançar erro se não tiver descrição', () => {
      const orcamento = {
        title: 'Título',
        description: '',
        value: 5000,
        cliente: { name: 'João', email: 'joao@email.com' },
        user: { name: 'Empresa', email: 'empresa@email.com' },
      };

      expect(() => validarOrcamentoParaPDF(orcamento as any)).toThrow(
        'Descrição do orçamento é obrigatória'
      );
    });

    it('deve lançar erro se valor for zero', () => {
      const orcamento = {
        title: 'Título',
        description: 'Desc',
        value: 0,
        cliente: { name: 'João', email: 'joao@email.com' },
        user: { name: 'Empresa', email: 'empresa@email.com' },
      };

      expect(() => validarOrcamentoParaPDF(orcamento as any)).toThrow(
        'Valor do orçamento deve ser maior que zero'
      );
    });

    it('deve lançar erro se não tiver cliente', () => {
      const orcamento = {
        title: 'Título',
        description: 'Desc',
        value: 5000,
        cliente: null,
        user: { name: 'Empresa', email: 'empresa@email.com' },
      };

      expect(() => validarOrcamentoParaPDF(orcamento as any)).toThrow(
        'Dados do cliente são obrigatórios'
      );
    });
  });

  describe('formatarEmpresaData', () => {
    it('deve formatar dados completos da empresa', () => {
      const user = {
        name: 'João Silva',
        company: 'João Silva MEI',
        email: 'contato@joaosilva.com',
        phone: '11999999999',
        cnpj: '12.345.678/0001-90',
      };

      const resultado = formatarEmpresaData(user as any);

      expect(resultado).toEqual({
        name: 'João Silva MEI',
        email: 'contato@joaosilva.com',
        phone: '11999999999',
        cnpj: '12.345.678/0001-90',
        address: undefined,
      });
    });

    it('deve usar name se não tiver company', () => {
      const user = {
        name: 'João Silva',
        company: null,
        email: 'joao@email.com',
      };

      const resultado = formatarEmpresaData(user as any);

      expect(resultado.name).toBe('João Silva');
    });

    it('deve retornar undefined para campos opcionais vazios', () => {
      const user = {
        name: 'Empresa',
        email: 'email@empresa.com',
        phone: null,
        cnpj: null,
      };

      const resultado = formatarEmpresaData(user as any);

      expect(resultado.phone).toBeUndefined();
      expect(resultado.cnpj).toBeUndefined();
    });
  });

  describe('formatarClienteData', () => {
    it('deve formatar dados completos do cliente', () => {
      const cliente = {
        name: 'Maria Santos',
        email: 'maria@email.com',
        phone: '11988888888',
        company: 'Maria Santos Ltda',
        cnpj: '98.765.432/0001-10',
      };

      const resultado = formatarClienteData(cliente as any);

      expect(resultado).toEqual({
        name: 'Maria Santos',
        email: 'maria@email.com',
        phone: '11988888888',
        company: 'Maria Santos Ltda',
        cnpj: '98.765.432/0001-10',
      });
    });

    it('deve retornar undefined para campos opcionais', () => {
      const cliente = {
        name: 'João',
        email: 'joao@email.com',
        phone: null,
        company: null,
        cnpj: null,
      };

      const resultado = formatarClienteData(cliente as any);

      expect(resultado.phone).toBeUndefined();
      expect(resultado.company).toBeUndefined();
      expect(resultado.cnpj).toBeUndefined();
    });
  });

  describe('prepareDadosParaPDF', () => {
    it('deve preparar todos os dados corretamente', () => {
      const orcamento = {
        id: '1',
        number: 'ORC-001',
        title: 'Website Institucional',
        description: 'Desenvolvimento de site completo',
        value: 10000,
        estimatedDays: 30,
        validUntil: new Date('2025-12-31'),
        createdAt: new Date('2025-11-01'),
        cliente: {
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '11999999999',
          company: 'João Silva Ltda',
          cnpj: '12.345.678/0001-90',
        },
        user: {
          name: 'Sua Empresa',
          company: 'Sua Empresa Ltda',
          email: 'contato@empresa.com',
          phone: '11988888888',
          cnpj: '98.765.432/0001-10',
        },
      };

      const resultado = prepareDadosParaPDF(orcamento as any);

      expect(resultado.number).toBe('ORC-001');
      expect(resultado.title).toBe('Website Institucional');
      expect(resultado.value).toBe(10000);
      expect(resultado.cliente.name).toBe('João Silva');
      expect(resultado.empresa.name).toBe('Sua Empresa Ltda');
    });

    it('deve lançar erro se validação falhar', () => {
      const orcamento = {
        title: '',
        description: 'Desc',
        value: 5000,
      };

      expect(() => prepareDadosParaPDF(orcamento as any)).toThrow();
    });

    it('deve converter Decimal para number', () => {
      const orcamento = {
        number: 'ORC-001',
        title: 'Título',
        description: 'Desc',
        value: { toNumber: () => 5000 }, // Mock do Prisma Decimal
        cliente: { name: 'Cliente', email: 'cliente@email.com' },
        user: { name: 'Empresa', email: 'empresa@email.com' },
        createdAt: new Date(),
      };

      const resultado = prepareDadosParaPDF(orcamento as any);

      expect(typeof resultado.value).toBe('number');
      expect(resultado.value).toBe(5000);
    });
  });
});