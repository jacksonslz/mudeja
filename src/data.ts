import { Client, InventoryItem, InventoryReport, NotificationLog, ServiceProvider, CatalogService, Contract, FinancialTransaction } from './types';

export const INITIAL_PROVIDERS: ServiceProvider[] = [
  {
    id: 'prov-1',
    name: 'José Carlos Santos',
    cpf: '432.543.123-55',
    cnh: '984532104-9',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', // standard high quality portrait
    address: 'Rua das Flores, 452 - Bairro Industrial, Guarulhos - SP',
    freightDestiny: 'Galpão Principal - Zona Leste, São Paulo - SP',
    freightValue: 1850.00,
    truckDetails: 'Volvo FH 460 - Placa GHT-8921 - Carreta Baú 3 Eixos',
    createdAt: '2026-06-25T14:20:00Z'
  },
  {
    id: 'prov-2',
    name: 'Marcos André Moreira',
    cpf: '211.564.321-88',
    cnh: '774531235-2',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    address: 'Av. Brasil, 9823 - Penha, Rio de Janeiro - RJ',
    freightDestiny: 'Galpão Secundário - Duque de Caxias - RJ',
    freightValue: 1200.00,
    truckDetails: 'Mercedes-Benz Accelo 1016 - Placa KJS-4011 - Baú Refrigerado',
    createdAt: '2026-06-25T15:10:00Z'
  }
];

export const INITIAL_SERVICES_CATALOG: CatalogService[] = [
  {
    id: 'srv-1',
    type: 'Transporte',
    name: 'Transporte Interestadual Especializado',
    description: 'Movimentação segura de bens e cargas pesadas entre estados com rastreamento integral via satélite e seguro contra sinistros.',
    price: 4.50,
    unit: 'por km rodado',
    status: 'Ativo'
  },
  {
    id: 'srv-2',
    type: 'Embalagem',
    name: 'Embalagem Técnica com Plástico Bolha e Caixas de Alta Densidade',
    description: 'Preparação física de móveis, eletrônicos e vidros com proteção antichoque, etiquetas e fitas de alta aderência para trânsito de longa distância.',
    price: 25.00,
    unit: 'por caixa montada',
    status: 'Ativo'
  },
  {
    id: 'srv-3',
    type: 'Armazenamento',
    name: 'Guarda-Móveis & Armazenamento em Galpão MobiInv',
    description: 'Locação de boxes privativos ou pallets protegidos em nossos galpões monitorados 24h, com seguro predial e vistorias semanais contra pragas e umidade.',
    price: 350.00,
    unit: 'por m³ / mês',
    status: 'Ativo'
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'Roberto Silva',
    email: 'roberto.silva@email.com',
    phone: '(11) 98765-4321',
    document: '123.456.789-00',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    companyName: 'Silva Advocacia & Associados',
    createdAt: '2026-05-10T14:30:00Z',
    status: 'Ativo',
    segment: 'Corporativo',
    notes: 'Cliente preferencial. Possui contrato ativo de guarda-móveis para o arquivo morto e móveis sobressalentes da filial Paulista.',
    interactions: [
      { id: 'int-1', type: 'Contato', description: 'Primeiro contato por telefone interessado em guarda-móveis', date: '2026-05-10T14:30:00Z' },
      { id: 'int-2', type: 'Vistoria', description: 'Vistoria realizada no escritório antigo para cubagem', date: '2026-05-15T10:00:00Z' },
      { id: 'int-3', type: 'Proposta', description: 'Enviada proposta comercial para contrato recorrente', date: '2026-05-18T16:00:00Z' },
      { id: 'int-4', type: 'Fechamento', description: 'Contrato assinado e primeiro faturamento emitido', date: '2026-05-20T11:00:00Z' }
    ]
  },
  {
    id: 'cli-2',
    name: 'Mariana Santos',
    email: 'mariana.santos@techsolutions.com',
    phone: '(21) 99888-7766',
    document: '12.345.678/0001-99',
    address: 'Rua Lauro Müller, 116 - Botafogo, Rio de Janeiro - RJ',
    companyName: 'TechSolutions Ltda',
    createdAt: '2026-06-01T09:15:00Z',
    status: 'Ativo',
    segment: 'Comercial',
    notes: 'Empresa de tecnologia em expansão rápida. Fez inventário fotográfico completo e laudo técnico para mudança de sede corporativa.',
    interactions: [
      { id: 'int-5', type: 'Contato', description: 'Solicitação de orçamento de inventário fotográfico via site', date: '2026-06-01T09:15:00Z' },
      { id: 'int-6', type: 'Reunião', description: 'Alinhamento das diretrizes de vistoria cautelar e laudo de entrega', date: '2026-06-05T14:00:00Z' },
      { id: 'int-7', type: 'Vistoria', description: 'Realização do inventário fotográfico de 2 salas de reunião corporativa', date: '2026-06-25T10:00:00Z' }
    ]
  },
  {
    id: 'cli-3',
    name: 'Carlos Oliveira',
    email: 'carlos.oliveira@cafeoriente.com.br',
    phone: '(31) 98111-2233',
    document: '98.765.432/0001-11',
    address: 'Av. Afonso Pena, 1500 - Centro, Belo Horizonte - MG',
    companyName: 'Café Oriente Gourmet',
    createdAt: '2026-06-15T11:00:00Z',
    status: 'Prospect',
    segment: 'Industrial',
    notes: 'Rede de cafeterias gourmet. Conversando sobre locação de boxes comerciais para estocagem e distribuição regional.',
    interactions: [
      { id: 'int-8', type: 'Contato', description: 'Lead recebido via WhatsApp demonstrando interesse em box comercial', date: '2026-06-15T11:00:00Z' },
      { id: 'int-9', type: 'Proposta', description: 'Enviada tabela de preços e metragens disponíveis para locação', date: '2026-06-17T09:00:00Z' }
    ]
  }
];

export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 'item-1',
    name: 'Cadeira de Escritório Ergonômica',
    category: 'Móveis',
    status: 'Excelente',
    serialNumber: 'CAD-ERG-0982',
    value: 1250.00,
    photoUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&q=80',
    description: 'Cadeira ergonômica com regulagem de altura, braços 3D e apoio lombar ajustável. Revestimento em mesh.',
    location: 'Sala de Reunião Principal',
    createdAt: '2026-06-25T10:00:00Z',
  },
  {
    id: 'item-2',
    name: 'Mesa de Reunião em Madeira Maciça',
    category: 'Móveis',
    status: 'Bom',
    serialNumber: 'MES-REU-402',
    value: 4800.00,
    photoUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&q=80',
    description: 'Mesa retangular para 8 pessoas, madeira nobre com canais centrais embutidos para passagem de cabos e conectividade.',
    location: 'Sala de Reunião Principal',
    createdAt: '2026-06-25T10:15:00Z',
  },
  {
    id: 'item-3',
    name: 'Ar Condicionado Split 18.000 BTUs',
    category: 'Equipamentos',
    status: 'Regular',
    serialNumber: 'AC-SPLIT-99211',
    value: 2900.00,
    photoUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80',
    description: 'Aparelho de ar condicionado inverter, marca LG, funcionando porém necessitando de limpeza periódica de filtros.',
    location: 'Sala de TI',
    createdAt: '2026-06-25T10:30:00Z',
  },
  {
    id: 'item-4',
    name: 'Smart TV 55" 4K UHD LG',
    category: 'Eletrônicos',
    status: 'Excelente',
    serialNumber: 'TV-LG-55-9081',
    value: 3400.00,
    photoUrl: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&q=80',
    description: 'Televisor smart utilizado para apresentações corporativas, instalado em painel de MDF sob medida.',
    location: 'Sala de Reunião Principal',
    createdAt: '2026-06-25T10:45:00Z',
  },
  {
    id: 'item-5',
    name: 'Sofá de Recepção em Couro Sintético',
    category: 'Móveis',
    status: 'Bom',
    serialNumber: 'SOF-REC-02',
    value: 3100.00,
    photoUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
    description: 'Sofá de 3 lugares na cor preta, ideal para recepção de clientes. Sem rasgos ou avarias expressivas.',
    location: 'Recepção',
    createdAt: '2026-06-25T11:00:00Z',
  }
];

export const INITIAL_REPORTS: InventoryReport[] = [
  {
    id: 'rep-1',
    title: 'Inventário Geral de Ativos da Recepção & Reuniões',
    clientId: 'cli-2',
    clientName: 'Mariana Santos',
    items: [
      {
        id: 'item-1',
        name: 'Cadeira de Escritório Ergonômica',
        category: 'Móveis',
        status: 'Excelente',
        serialNumber: 'CAD-ERG-0982',
        value: 1250.00,
        photoUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&q=80',
        description: 'Cadeira ergonômica com regulagem de altura, braços 3D e apoio lombar ajustável. Revestimento em mesh.',
        location: 'Sala de Reunião Principal',
        createdAt: '2026-06-25T10:00:00Z',
      },
      {
        id: 'item-2',
        name: 'Mesa de Reunião em Madeira Maciça',
        category: 'Móveis',
        status: 'Bom',
        serialNumber: 'MES-REU-402',
        value: 4800.00,
        photoUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&q=80',
        description: 'Mesa retangular para 8 pessoas, madeira nobre com canais centrais embutidos para passagem de cabos e conectividade.',
        location: 'Sala de Reunião Principal',
        createdAt: '2026-06-25T10:15:00Z',
      }
    ],
    status: 'Rascunho',
    createdAt: '2026-06-25T11:30:00Z',
  },
  {
    id: 'rep-scheduled-1',
    title: 'Vistoria e Inventário de Entrada - Sala Comercial 304',
    clientId: 'cli-1',
    clientName: 'Roberto Silva',
    items: [],
    status: 'Rascunho',
    createdAt: '2026-06-25T15:00:00Z',
    scheduledAt: '2026-06-28T10:00:00', // Future task 1
  },
  {
    id: 'rep-scheduled-2',
    title: 'Laudo de Entrega e Conferência de Equipamentos de TI',
    clientId: 'cli-3',
    clientName: 'Carlos Oliveira',
    items: [],
    status: 'Rascunho',
    createdAt: '2026-06-25T16:15:00Z',
    scheduledAt: '2026-07-02T14:30:00', // Future task 2
  }
];

export const INITIAL_NOTIFICATION_LOGS: NotificationLog[] = [
  {
    id: 'log-1',
    type: 'WhatsApp',
    recipient: '(11) 98765-4321',
    message: 'Olá Roberto, seu relatório de inventário está disponível para visualização e assinatura. Acesse pelo link: https://inv-foto.app/r/rep-1',
    status: 'Enviado',
    sentAt: '2026-06-25T12:00:00Z',
  },
  {
    id: 'log-2',
    type: 'E-mail',
    recipient: 'mariana.santos@techsolutions.com',
    message: 'Inventário Finalizado com Sucesso - Foi gerada a Nota Fiscal Nº NF-2026-004 e Recibo. Verifique os anexos.',
    status: 'Enviado',
    sentAt: '2026-06-25T13:30:00Z',
  }
];

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'cont-1',
    clientId: 'cli-1',
    clientName: 'Roberto Silva',
    title: 'Contrato de Armazenagem e Guarda-Móveis Dedicado',
    value: 2450.00,
    startDate: '2026-01-10',
    endDate: '2026-07-05', // Expiring in 10 days
    billingCycle: 'Mensal',
    status: 'Ativo',
    billingStatus: 'Em dia',
    renewedCount: 0,
    autoRenew: true,
    notificationsSent: {
      tenDays: false,
      fiveDays: false,
      twoDays: false
    },
    createdAt: '2026-01-10T10:00:00Z'
  },
  {
    id: 'cont-2',
    clientId: 'cli-2',
    clientName: 'Mariana Santos',
    title: 'Prestação de Serviços Continuados de Logística Reversa',
    value: 5800.00,
    startDate: '2025-07-01',
    endDate: '2026-06-30', // Expiring in 5 days
    billingCycle: 'Mensal',
    status: 'Ativo',
    billingStatus: 'Pendente',
    renewedCount: 1,
    autoRenew: false,
    notificationsSent: {
      tenDays: true,
      fiveDays: false,
      twoDays: false
    },
    createdAt: '2025-07-01T08:30:00Z'
  },
  {
    id: 'cont-3',
    clientId: 'cli-3',
    clientName: 'Carlos Oliveira',
    title: 'Locação de Box Comercial e Distribuição de Cargas',
    value: 3900.00,
    startDate: '2025-07-01',
    endDate: '2026-06-27', // Expiring in 2 days
    billingCycle: 'Mensal',
    status: 'Ativo',
    billingStatus: 'Atrasado',
    renewedCount: 2,
    autoRenew: true,
    notificationsSent: {
      tenDays: true,
      fiveDays: true,
      twoDays: false
    },
    createdAt: '2025-07-01T14:15:00Z'
  },
  {
    id: 'cont-4',
    clientId: 'cli-1',
    clientName: 'Roberto Silva',
    title: 'Contrato de Logística e Montagem de Showrooms',
    value: 12000.00,
    startDate: '2026-06-01',
    endDate: '2027-06-01', // Future expiration
    billingCycle: 'Anual',
    status: 'Ativo',
    billingStatus: 'Em dia',
    renewedCount: 0,
    autoRenew: true,
    notificationsSent: {
      tenDays: false,
      fiveDays: false,
      twoDays: false
    },
    createdAt: '2026-06-01T09:00:00Z'
  }
];

export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: 'TR-001',
    type: 'Receita',
    category: 'Laudos/Vistorias',
    amount: 6050.00,
    date: '2026-06-25',
    description: 'Vistoria Geral de Ativos Corporativos e Laudo Técnico de Entrada',
    status: 'Pago',
    paymentMethod: 'Pix',
    referenceId: 'rep-1',
    referenceName: 'Mariana Santos'
  },
  {
    id: 'TR-002',
    type: 'Receita',
    category: 'Contratos',
    amount: 2450.00,
    date: '2026-06-10',
    description: 'Mensalidade Contrato de Armazenagem e Guarda-Móveis Dedicado',
    status: 'Pago',
    paymentMethod: 'Transferência',
    referenceId: 'cont-1',
    referenceName: 'Roberto Silva'
  },
  {
    id: 'TR-003',
    type: 'Receita',
    category: 'Contratos',
    amount: 3900.00,
    date: '2026-06-27',
    description: 'Mensalidade Locação de Box Comercial e Distribuição de Cargas',
    status: 'Atrasado',
    paymentMethod: 'Boleto',
    referenceId: 'cont-3',
    referenceName: 'Carlos Oliveira'
  },
  {
    id: 'TR-004',
    type: 'Despesa',
    category: 'Transporte',
    amount: 1850.00,
    date: '2026-06-25',
    description: 'Frete e Carreto Baú 3 Eixos - Distribuição São Paulo',
    status: 'Pago',
    paymentMethod: 'Transferência',
    referenceId: 'prov-1',
    referenceName: 'José Carlos Santos'
  },
  {
    id: 'TR-005',
    type: 'Despesa',
    category: 'Aluguel',
    amount: 4500.00,
    date: '2026-06-05',
    description: 'Aluguel Mensal Galpão Logístico de Guarda-Móveis',
    status: 'Pago',
    paymentMethod: 'Boleto'
  },
  {
    id: 'TR-006',
    type: 'Despesa',
    category: 'Infraestrutura/Software',
    amount: 350.00,
    date: '2026-06-12',
    description: 'Assinatura Mensal Software CRM e Infraestrutura Cloud (Vercel/Firebase)',
    status: 'Pago',
    paymentMethod: 'Cartão'
  },
  {
    id: 'TR-007',
    type: 'Despesa',
    category: 'Impostos',
    amount: 302.50,
    date: '2026-06-25',
    description: 'Imposto DAS Simples Nacional - Retido s/ Nota NF-2026-004',
    status: 'Pago',
    paymentMethod: 'Pix',
    referenceId: 'NF-2026-004',
    referenceName: 'Mariana Santos'
  },
  {
    id: 'TR-008',
    type: 'Despesa',
    category: 'Marketing',
    amount: 600.00,
    date: '2026-06-15',
    description: 'Campanha Tráfego Pago Google Ads & Meta Ads para Captação de Clientes',
    status: 'Pago',
    paymentMethod: 'Cartão'
  },
  {
    id: 'TR-009',
    type: 'Receita',
    category: 'Contratos',
    amount: 5800.00,
    date: '2026-06-30',
    description: 'Mensalidade Prestação de Serviços Continuados de Logística Reversa',
    status: 'Pendente',
    paymentMethod: 'Boleto',
    referenceId: 'cont-2',
    referenceName: 'Mariana Santos'
  },
  {
    id: 'TR-010',
    type: 'Despesa',
    category: 'Salários',
    amount: 3200.00,
    date: '2026-06-30',
    description: 'Honorários Mensais Inspetores de Campo e Vistoriadores',
    status: 'Pago',
    paymentMethod: 'Pix'
  }
];


