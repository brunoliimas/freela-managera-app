export const swaggerSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Freela Manager API',
        version: '1.0.0',
        description: 'API para gerenciamento de projetos freelance, clientes, orçamentos, pagamentos e mais.',
    },
    servers: [{ url: '/api/v1' }],
    tags: [
        { name: 'Auth', description: 'Autenticação e perfil do usuário' },
        { name: 'Clientes', description: 'Gerenciamento de clientes' },
        { name: 'Projetos', description: 'Gerenciamento de projetos' },
        { name: 'Milestones', description: 'Marcos de projeto' },
        { name: 'Orçamentos', description: 'Gerenciamento de orçamentos' },
        { name: 'Solicitações', description: 'Solicitações de serviço' },
        { name: 'Pagamentos', description: 'Gerenciamento de pagamentos' },
        { name: 'Arquivos', description: 'Upload e gerenciamento de arquivos' },
        { name: 'Dashboard', description: 'Dados do dashboard' },
        { name: 'Relatórios', description: 'Relatórios financeiros' },
    ],
    components: {
        securitySchemes: {
            cookieAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'token',
                description: 'JWT token armazenado em cookie httpOnly',
            },
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    error: { type: 'string' },
                },
            },
            ValidationError: {
                type: 'object',
                properties: {
                    error: { type: 'string' },
                    details: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                campo: { type: 'string' },
                                mensagem: { type: 'string' },
                            },
                        },
                    },
                },
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    email: { type: 'string', format: 'email' },
                    name: { type: 'string' },
                    avatar: { type: 'string', nullable: true },
                    phone: { type: 'string', nullable: true },
                    company: { type: 'string', nullable: true },
                    bio: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            Cliente: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string', nullable: true },
                    company: { type: 'string', nullable: true },
                    cnpj: { type: 'string', nullable: true },
                    address: { type: 'string', nullable: true },
                    city: { type: 'string', nullable: true },
                    state: { type: 'string', nullable: true },
                    zipCode: { type: 'string', nullable: true },
                    notes: { type: 'string', nullable: true },
                    active: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            Projeto: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    clienteId: { type: 'string', format: 'uuid' },
                    number: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    value: { type: 'number' },
                    status: { type: 'string', enum: ['EM_ANDAMENTO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO'] },
                    progress: { type: 'integer', minimum: 0, maximum: 100 },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time', nullable: true },
                    completedAt: { type: 'string', format: 'date-time', nullable: true },
                    notes: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            Milestone: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    projetoId: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    order: { type: 'integer' },
                    completed: { type: 'boolean' },
                    completedAt: { type: 'string', format: 'date-time', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            Orcamento: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    clienteId: { type: 'string', format: 'uuid' },
                    number: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    value: { type: 'number' },
                    estimatedDays: { type: 'integer', nullable: true },
                    validUntil: { type: 'string', format: 'date-time', nullable: true },
                    status: { type: 'string', enum: ['AGUARDANDO', 'ENVIADO', 'APROVADO', 'RECUSADO', 'EXPIRADO'] },
                    notes: { type: 'string', nullable: true },
                    sentAt: { type: 'string', format: 'date-time', nullable: true },
                    approvedAt: { type: 'string', format: 'date-time', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            Solicitacao: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    clienteId: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    budget: { type: 'number', nullable: true },
                    deadline: { type: 'string', format: 'date-time', nullable: true },
                    status: { type: 'string', enum: ['NOVA', 'ANALISANDO', 'ORCAMENTO_ENVIADO', 'ARQUIVADA'] },
                    notes: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            Pagamento: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    projetoId: { type: 'string', format: 'uuid' },
                    description: { type: 'string' },
                    value: { type: 'number' },
                    dueDate: { type: 'string', format: 'date-time' },
                    paidAt: { type: 'string', format: 'date-time', nullable: true },
                    status: { type: 'string', enum: ['PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO'] },
                    method: { type: 'string', nullable: true },
                    notes: { type: 'string', nullable: true },
                    receipt: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            Arquivo: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    projetoId: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    url: { type: 'string' },
                    size: { type: 'integer' },
                    type: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
        },
    },
    security: [{ cookieAuth: [] }],
    paths: {
        // ==================== AUTH ====================
        '/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Registrar novo usuário',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'email', 'password'],
                                properties: {
                                    name: { type: 'string', minLength: 2 },
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string', minLength: 6 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Usuário registrado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
                    '400': { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login do usuário',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Login realizado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
                    '400': { description: 'Credenciais inválidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/auth/logout': {
            post: {
                tags: ['Auth'],
                summary: 'Logout do usuário',
                security: [],
                responses: {
                    '200': { description: 'Logout realizado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
                },
            },
        },
        '/auth/forgot-password': {
            post: {
                tags: ['Auth'],
                summary: 'Solicitar recuperação de senha',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Email de recuperação enviado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
                    '400': { description: 'Email não informado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/auth/reset-password': {
            post: {
                tags: ['Auth'],
                summary: 'Redefinir senha com token',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['token', 'password'],
                                properties: {
                                    token: { type: 'string' },
                                    password: { type: 'string', minLength: 6 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Senha redefinida', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
                    '400': { description: 'Token inválido ou expirado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/auth/profile': {
            get: {
                tags: ['Auth'],
                summary: 'Obter perfil do usuário autenticado',
                responses: {
                    '200': { description: 'Perfil do usuário', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
                },
            },
            put: {
                tags: ['Auth'],
                summary: 'Atualizar perfil do usuário',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    phone: { type: 'string' },
                                    company: { type: 'string' },
                                    bio: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Perfil atualizado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
                },
            },
        },

        // ==================== CLIENTES ====================
        '/clientes': {
            get: {
                tags: ['Clientes'],
                summary: 'Listar clientes',
                parameters: [
                    { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Buscar por nome, email ou empresa' },
                    { name: 'active', in: 'query', schema: { type: 'string', enum: ['true', 'false'] }, description: 'Filtrar por status ativo' },
                ],
                responses: {
                    '200': { description: 'Lista de clientes', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Cliente' } } } } },
                },
            },
            post: {
                tags: ['Clientes'],
                summary: 'Criar cliente',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'email'],
                                properties: {
                                    name: { type: 'string', minLength: 2 },
                                    email: { type: 'string', format: 'email' },
                                    phone: { type: 'string' },
                                    company: { type: 'string' },
                                    cnpj: { type: 'string' },
                                    address: { type: 'string' },
                                    city: { type: 'string' },
                                    state: { type: 'string' },
                                    zipCode: { type: 'string' },
                                    notes: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Cliente criado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, cliente: { $ref: '#/components/schemas/Cliente' } } } } } },
                    '400': { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
                },
            },
        },
        '/clientes/{id}': {
            get: {
                tags: ['Clientes'],
                summary: 'Obter cliente por ID',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': { description: 'Cliente encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Cliente' } } } },
                    '404': { description: 'Cliente não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
            put: {
                tags: ['Clientes'],
                summary: 'Atualizar cliente',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    email: { type: 'string', format: 'email' },
                                    phone: { type: 'string' },
                                    company: { type: 'string' },
                                    cnpj: { type: 'string' },
                                    address: { type: 'string' },
                                    city: { type: 'string' },
                                    state: { type: 'string' },
                                    zipCode: { type: 'string' },
                                    notes: { type: 'string' },
                                    active: { type: 'boolean' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Cliente atualizado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, cliente: { $ref: '#/components/schemas/Cliente' } } } } } },
                    '404': { description: 'Cliente não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
            delete: {
                tags: ['Clientes'],
                summary: 'Excluir cliente',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': { description: 'Cliente excluído', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
                    '400': { description: 'Cliente possui projetos/orçamentos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    '404': { description: 'Cliente não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },

        // ==================== PROJETOS ====================
        '/projetos': {
            get: {
                tags: ['Projetos'],
                summary: 'Listar projetos',
                parameters: [
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['EM_ANDAMENTO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO'] } },
                    { name: 'clienteId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                ],
                responses: {
                    '200': { description: 'Lista de projetos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Projeto' } } } } },
                },
            },
            post: {
                tags: ['Projetos'],
                summary: 'Criar projeto',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['clienteId', 'title', 'description', 'value'],
                                properties: {
                                    clienteId: { type: 'string', format: 'uuid' },
                                    title: { type: 'string', minLength: 3 },
                                    description: { type: 'string', minLength: 10 },
                                    value: { type: 'number', minimum: 0 },
                                    startDate: { type: 'string', format: 'date-time' },
                                    endDate: { type: 'string', format: 'date-time' },
                                    orcamentoId: { type: 'string', format: 'uuid' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Projeto criado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, projeto: { $ref: '#/components/schemas/Projeto' } } } } } },
                    '400': { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
                },
            },
        },
        '/projetos/from-orcamento': {
            post: {
                tags: ['Projetos'],
                summary: 'Criar projeto a partir de orçamento aprovado',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['orcamentoId'],
                                properties: {
                                    orcamentoId: { type: 'string', format: 'uuid' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Projeto criado a partir do orçamento', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, projeto: { $ref: '#/components/schemas/Projeto' } } } } } },
                    '400': { description: 'Orçamento não aprovado ou já convertido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    '404': { description: 'Orçamento não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/projetos/{id}': {
            get: {
                tags: ['Projetos'],
                summary: 'Obter projeto por ID',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': { description: 'Projeto encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Projeto' } } } },
                    '404': { description: 'Projeto não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
            put: {
                tags: ['Projetos'],
                summary: 'Atualizar projeto',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    value: { type: 'number' },
                                    startDate: { type: 'string', format: 'date-time' },
                                    endDate: { type: 'string', format: 'date-time' },
                                    status: { type: 'string', enum: ['EM_ANDAMENTO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO'] },
                                    progress: { type: 'integer', minimum: 0, maximum: 100 },
                                    notes: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Projeto atualizado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, projeto: { $ref: '#/components/schemas/Projeto' } } } } } },
                    '404': { description: 'Projeto não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
            delete: {
                tags: ['Projetos'],
                summary: 'Excluir projeto',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': { description: 'Projeto excluído', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
                    '404': { description: 'Projeto não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },

        // ==================== MILESTONES ====================
        '/projetos/{projetoId}/milestones': {
            get: {
                tags: ['Milestones'],
                summary: 'Listar milestones do projeto',
                parameters: [{ name: 'projetoId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': { description: 'Lista de milestones', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Milestone' } } } } },
                    '404': { description: 'Projeto não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
            post: {
                tags: ['Milestones'],
                summary: 'Criar milestone',
                parameters: [{ name: 'projetoId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['title'],
                                properties: {
                                    title: { type: 'string', minLength: 2 },
                                    description: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Milestone criado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, milestone: { $ref: '#/components/schemas/Milestone' } } } } } },
                    '400': { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    '404': { description: 'Projeto não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/projetos/{projetoId}/milestones/{id}': {
            put: {
                tags: ['Milestones'],
                summary: 'Atualizar milestone',
                parameters: [
                    { name: 'projetoId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
                    { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    completed: { type: 'boolean' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Milestone atualizado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, milestone: { $ref: '#/components/schemas/Milestone' } } } } } },
                    '404': { description: 'Milestone não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
            delete: {
                tags: ['Milestones'],
                summary: 'Excluir milestone',
                parameters: [
                    { name: 'projetoId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
                    { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
                ],
                responses: {
                    '200': { description: 'Milestone excluído', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
                    '404': { description: 'Milestone não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },

        // ==================== ORCAMENTOS ====================
        '/orcamentos': {
            get: {
                tags: ['Orçamentos'],
                summary: 'Listar orçamentos',
                parameters: [
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['AGUARDANDO', 'ENVIADO', 'APROVADO', 'RECUSADO', 'EXPIRADO'] } },
                    { name: 'clienteId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                ],
                responses: {
                    '200': { description: 'Lista de orçamentos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Orcamento' } } } } },
                },
            },
            post: {
                tags: ['Orçamentos'],
                summary: 'Criar orçamento',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['clienteId', 'title', 'description', 'value'],
                                properties: {
                                    clienteId: { type: 'string', format: 'uuid' },
                                    title: { type: 'string', minLength: 3 },
                                    description: { type: 'string', minLength: 10 },
                                    value: { type: 'number', minimum: 0 },
                                    estimatedDays: { type: 'integer' },
                                    validUntil: { type: 'string', format: 'date-time' },
                                    notes: { type: 'string' },
                                    solicitacaoId: { type: 'string', format: 'uuid' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Orçamento criado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, orcamento: { $ref: '#/components/schemas/Orcamento' } } } } } },
                    '400': { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
                    '404': { description: 'Cliente não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/orcamentos/{id}': {
            get: {
                tags: ['Orçamentos'],
                summary: 'Obter orçamento por ID',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': { description: 'Orçamento encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Orcamento' } } } },
                    '404': { description: 'Orçamento não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
            put: {
                tags: ['Orçamentos'],
                summary: 'Atualizar orçamento',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    value: { type: 'number' },
                                    estimatedDays: { type: 'integer' },
                                    validUntil: { type: 'string', format: 'date-time' },
                                    notes: { type: 'string' },
                                    status: { type: 'string', enum: ['AGUARDANDO', 'ENVIADO', 'APROVADO', 'RECUSADO', 'EXPIRADO'] },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Orçamento atualizado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, orcamento: { $ref: '#/components/schemas/Orcamento' } } } } } },
                    '404': { description: 'Orçamento não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
            delete: {
                tags: ['Orçamentos'],
                summary: 'Excluir orçamento',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': { description: 'Orçamento excluído', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
                    '400': { description: 'Orçamento possui projeto associado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    '404': { description: 'Orçamento não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/orcamentos/{id}/pdf': {
            get: {
                tags: ['Orçamentos'],
                summary: 'Gerar PDF do orçamento',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': { description: 'PDF do orçamento', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } },
                    '404': { description: 'Orçamento não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/orcamentos/{id}/enviar-email': {
            post: {
                tags: ['Orçamentos'],
                summary: 'Enviar orçamento por email',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': { description: 'Email enviado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
                    '404': { description: 'Orçamento não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    '500': { description: 'Erro ao enviar email', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },

        // ==================== SOLICITACOES ====================
        '/solicitacoes/solicitar': {
            post: {
                tags: ['Solicitações'],
                summary: 'Criar solicitação de serviço (público)',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['clienteId', 'title', 'description'],
                                properties: {
                                    clienteId: { type: 'string', format: 'uuid' },
                                    title: { type: 'string', minLength: 5 },
                                    description: { type: 'string', minLength: 20 },
                                    budget: { type: 'number', minimum: 0 },
                                    deadline: { type: 'string', format: 'date-time' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Solicitação criada', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, solicitacao: { $ref: '#/components/schemas/Solicitacao' } } } } } },
                    '400': { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
                    '404': { description: 'Cliente não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/solicitacoes/cliente/buscar-cnpj/{cnpj}': {
            get: {
                tags: ['Solicitações'],
                summary: 'Buscar cliente por CNPJ (público)',
                security: [],
                parameters: [{ name: 'cnpj', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    '200': { description: 'Cliente encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Cliente' } } } },
                    '400': { description: 'CNPJ não informado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    '404': { description: 'Cliente não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/solicitacoes/cliente/cadastrar': {
            post: {
                tags: ['Solicitações'],
                summary: 'Cadastrar cliente (público)',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'email', 'userId'],
                                properties: {
                                    name: { type: 'string', minLength: 2 },
                                    email: { type: 'string', format: 'email' },
                                    phone: { type: 'string' },
                                    company: { type: 'string' },
                                    cnpj: { type: 'string' },
                                    userId: { type: 'string', format: 'uuid' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Cliente cadastrado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, cliente: { $ref: '#/components/schemas/Cliente' } } } } } },
                    '400': { description: 'Dados inválidos ou email duplicado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    '404': { description: 'Freelancer não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/solicitacoes': {
            get: {
                tags: ['Solicitações'],
                summary: 'Listar solicitações',
                parameters: [
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['NOVA', 'ANALISANDO', 'ORCAMENTO_ENVIADO', 'ARQUIVADA'] } },
                ],
                responses: {
                    '200': { description: 'Lista de solicitações', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Solicitacao' } } } } },
                },
            },
        },
        '/solicitacoes/{id}': {
            get: {
                tags: ['Solicitações'],
                summary: 'Obter solicitação por ID',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': { description: 'Solicitação encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Solicitacao' } } } },
                    '404': { description: 'Solicitação não encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/solicitacoes/{id}/status': {
            patch: {
                tags: ['Solicitações'],
                summary: 'Atualizar status da solicitação',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['status'],
                                properties: {
                                    status: { type: 'string', enum: ['NOVA', 'ANALISANDO', 'ORCAMENTO_ENVIADO', 'ARQUIVADA'] },
                                    notes: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Status atualizado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, solicitacao: { $ref: '#/components/schemas/Solicitacao' } } } } } },
                    '404': { description: 'Solicitação não encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },

        // ==================== PAGAMENTOS ====================
        '/pagamentos': {
            get: {
                tags: ['Pagamentos'],
                summary: 'Listar pagamentos',
                parameters: [
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO'] } },
                    { name: 'projetoId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                ],
                responses: {
                    '200': { description: 'Lista de pagamentos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Pagamento' } } } } },
                },
            },
            post: {
                tags: ['Pagamentos'],
                summary: 'Criar pagamento',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['projetoId', 'description', 'value', 'dueDate'],
                                properties: {
                                    projetoId: { type: 'string', format: 'uuid' },
                                    description: { type: 'string', minLength: 3 },
                                    value: { type: 'number', minimum: 0 },
                                    dueDate: { type: 'string', format: 'date-time' },
                                    method: { type: 'string' },
                                    notes: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Pagamento criado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, pagamento: { $ref: '#/components/schemas/Pagamento' } } } } } },
                    '400': { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
                    '404': { description: 'Projeto não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/pagamentos/parcelas': {
            post: {
                tags: ['Pagamentos'],
                summary: 'Criar parcelas',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['projetoId', 'numeroParcelas', 'primeiroVencimento'],
                                properties: {
                                    projetoId: { type: 'string', format: 'uuid' },
                                    numeroParcelas: { type: 'integer', minimum: 2, maximum: 48 },
                                    primeiroVencimento: { type: 'string', format: 'date-time' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Parcelas criadas', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, count: { type: 'integer' } } } } } },
                    '400': { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
                    '404': { description: 'Projeto não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/pagamentos/resumo': {
            get: {
                tags: ['Pagamentos'],
                summary: 'Obter resumo financeiro',
                responses: {
                    '200': {
                        description: 'Resumo financeiro',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        totalRecebido: { type: 'number' },
                                        totalPendente: { type: 'number' },
                                        totalAtrasado: { type: 'number' },
                                        pagamentosProximos: { type: 'array', items: { $ref: '#/components/schemas/Pagamento' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/pagamentos/{id}': {
            get: {
                tags: ['Pagamentos'],
                summary: 'Obter pagamento por ID',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': { description: 'Pagamento encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Pagamento' } } } },
                    '404': { description: 'Pagamento não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
            put: {
                tags: ['Pagamentos'],
                summary: 'Atualizar pagamento',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    description: { type: 'string' },
                                    value: { type: 'number' },
                                    dueDate: { type: 'string', format: 'date-time' },
                                    status: { type: 'string', enum: ['PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO'] },
                                    method: { type: 'string' },
                                    notes: { type: 'string' },
                                    receipt: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Pagamento atualizado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, pagamento: { $ref: '#/components/schemas/Pagamento' } } } } } },
                    '404': { description: 'Pagamento não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
            delete: {
                tags: ['Pagamentos'],
                summary: 'Excluir pagamento',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': { description: 'Pagamento excluído', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
                    '404': { description: 'Pagamento não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/pagamentos/{id}/marcar-pago': {
            post: {
                tags: ['Pagamentos'],
                summary: 'Marcar pagamento como pago',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    method: { type: 'string' },
                                    notes: { type: 'string' },
                                    receipt: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Pagamento marcado como pago', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, pagamento: { $ref: '#/components/schemas/Pagamento' } } } } } },
                    '404': { description: 'Pagamento não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },

        // ==================== ARQUIVOS ====================
        '/arquivos': {
            get: {
                tags: ['Arquivos'],
                summary: 'Listar arquivos',
                parameters: [
                    { name: 'projetoId', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filtrar por projeto' },
                ],
                responses: {
                    '200': { description: 'Lista de arquivos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Arquivo' } } } } },
                },
            },
            post: {
                tags: ['Arquivos'],
                summary: 'Upload de arquivo',
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                required: ['file', 'projetoId'],
                                properties: {
                                    file: { type: 'string', format: 'binary' },
                                    projetoId: { type: 'string', format: 'uuid' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Arquivo enviado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, arquivo: { $ref: '#/components/schemas/Arquivo' } } } } } },
                    '400': { description: 'Arquivo ou projetoId não fornecido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    '404': { description: 'Projeto não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/arquivos/{id}': {
            get: {
                tags: ['Arquivos'],
                summary: 'Obter arquivo por ID',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': { description: 'Arquivo encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Arquivo' } } } },
                    '404': { description: 'Arquivo não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
            delete: {
                tags: ['Arquivos'],
                summary: 'Excluir arquivo',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': { description: 'Arquivo excluído', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
                    '404': { description: 'Arquivo não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },
        '/arquivos/{id}/download': {
            get: {
                tags: ['Arquivos'],
                summary: 'Download de arquivo',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': { description: 'Download do arquivo', content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } },
                    '404': { description: 'Arquivo não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                },
            },
        },

        // ==================== DASHBOARD ====================
        '/dashboard': {
            get: {
                tags: ['Dashboard'],
                summary: 'Obter dados do dashboard',
                responses: {
                    '200': {
                        description: 'Dados do dashboard',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        stats: {
                                            type: 'object',
                                            properties: {
                                                clientes: { type: 'object', properties: { total: { type: 'integer' }, ativos: { type: 'integer' } } },
                                                solicitacoes: { type: 'object', properties: { total: { type: 'integer' }, novas: { type: 'integer' } } },
                                                orcamentos: { type: 'object', properties: { total: { type: 'integer' }, enviados: { type: 'integer' }, aprovados: { type: 'integer' }, valorTotal: { type: 'number' } } },
                                                projetos: { type: 'object', properties: { total: { type: 'integer' }, emAndamento: { type: 'integer' }, concluidos: { type: 'integer' }, valorTotal: { type: 'number' }, valorAndamento: { type: 'number' }, valorConcluidos: { type: 'number' } } },
                                            },
                                        },
                                        recentes: {
                                            type: 'object',
                                            properties: {
                                                solicitacoes: { type: 'array', items: { $ref: '#/components/schemas/Solicitacao' } },
                                                orcamentos: { type: 'array', items: { $ref: '#/components/schemas/Orcamento' } },
                                                projetos: { type: 'array', items: { $ref: '#/components/schemas/Projeto' } },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },

        // ==================== RELATORIOS ====================
        '/relatorios/financeiro': {
            get: {
                tags: ['Relatórios'],
                summary: 'Relatório financeiro',
                parameters: [
                    { name: 'ano', in: 'query', schema: { type: 'integer' }, description: 'Ano do relatório (padrão: ano atual)' },
                    { name: 'mes', in: 'query', schema: { type: 'integer' }, description: 'Mês específico (opcional)' },
                ],
                responses: {
                    '200': {
                        description: 'Relatório financeiro',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        ano: { type: 'integer' },
                                        faturamentoMensal: { type: 'array', items: { type: 'object', properties: { mes: { type: 'integer' }, mesNome: { type: 'string' }, valor: { type: 'number' } } } },
                                        projetosPorStatus: { type: 'array', items: { type: 'object', properties: { status: { type: 'string' }, quantidade: { type: 'integer' } } } },
                                        topClientes: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, nome: { type: 'string' }, valor: { type: 'number' }, projetos: { type: 'integer' } } } },
                                        taxaConversao: { type: 'object', properties: { solicitacoes: { type: 'integer' }, orcamentos: { type: 'integer' }, projetos: { type: 'integer' }, solicitacaoParaOrcamento: { type: 'string' }, orcamentoParaProjeto: { type: 'string' } } },
                                        resumo: { type: 'object', properties: { totalRecebido: { type: 'number' }, totalAReceber: { type: 'number' }, ticketMedio: { type: 'number' }, projetosConcluidos: { type: 'integer' }, tempoMedioEntrega: { type: 'number' } } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/relatorios/comparacao-anual': {
            get: {
                tags: ['Relatórios'],
                summary: 'Comparação anual',
                responses: {
                    '200': {
                        description: 'Comparação entre anos',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        anoAtual: { type: 'object', properties: { ano: { type: 'integer' }, faturamento: { type: 'number' }, pagamentos: { type: 'number' } } },
                                        anoAnterior: { type: 'object', properties: { ano: { type: 'integer' }, faturamento: { type: 'number' }, pagamentos: { type: 'number' } } },
                                        crescimento: { type: 'number' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
