export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string; // CPF or CNPJ
  address: string;
  companyName?: string;
  createdAt: string;
  status?: 'Lead' | 'Prospect' | 'Ativo' | 'Inativo';
  segment?: 'Residencial' | 'Comercial' | 'Industrial' | 'Corporativo';
  notes?: string;
  interactions?: Array<{
    id: string;
    type: 'Contato' | 'Reunião' | 'Vistoria' | 'Proposta' | 'Fechamento';
    description: string;
    date: string;
  }>;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Móveis' | 'Equipamentos' | 'Eletrônicos' | 'Eletrodomésticos' | 'Outros';
  status: 'Excelente' | 'Bom' | 'Regular' | 'Danificado';
  serialNumber?: string;
  value?: number;
  photoUrl: string; // Base64 or mock placeholder URL
  description: string;
  location: string; // e.g. "Sala de Reunião", "Cozinha"
  createdAt: string;
}

export interface InventoryReport {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  items: InventoryItem[];
  status: 'Rascunho' | 'Finalizado';
  signature?: {
    signedByName: string;
    signedByDocument: string;
    signatureDataUrl: string; // Base64 canvas drawing
    signedAt: string;
  };
  providerSignature?: {
    signedByName: string;
    signedByDocument: string;
    signatureDataUrl: string; // Base64 canvas drawing
    signedAt: string;
  };
  invoiceId?: string;
  receiptId?: string;
  createdAt: string;
  finalizedAt?: string;
  scheduledAt?: string; // Scheduled date and time for future surveys/inventories
}

export interface Invoice {
  id: string;
  reportId: string;
  clientId: string;
  clientName: string;
  itemsCount: number;
  totalValue: number;
  issueDate: string;
  status: 'Emitida' | 'Paga' | 'Cancelada';
  taxValue: number;
}

export interface Receipt {
  id: string;
  reportId: string;
  clientId: string;
  clientName: string;
  totalValue: number;
  paymentMethod: 'Pix' | 'Boleto' | 'Cartão' | 'Dinheiro';
  issueDate: string;
  notes?: string;
}

export interface NotificationLog {
  id: string;
  type: 'WhatsApp' | 'E-mail' | 'Push';
  recipient: string;
  message: string;
  status: 'Enviado' | 'Pendente' | 'Falha';
  sentAt: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  cpf: string;
  cnh: string;
  photoUrl: string;
  address: string;
  freightDestiny?: string;
  freightValue?: number;
  truckDetails?: string; // Brand, model, license plate, size, etc.
  createdAt: string;
}

export interface CatalogService {
  id: string;
  type: 'Transporte' | 'Embalagem' | 'Armazenamento' | 'Outros';
  name: string;
  description: string;
  price: number;
  unit: string; // e.g. "por km", "por caixa", "por m² / mês"
  status: 'Ativo' | 'Inativo';
}

export interface Contract {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  value: number;
  startDate: string;
  endDate: string;
  billingCycle: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
  status: 'Ativo' | 'Vencido' | 'Cancelado' | 'Suspenso';
  billingStatus: 'Em dia' | 'Pendente' | 'Atrasado';
  renewedCount: number;
  autoRenew: boolean;
  notificationsSent: {
    tenDays?: boolean;
    fiveDays?: boolean;
    twoDays?: boolean;
  };
  createdAt: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'Receita' | 'Despesa';
  category: 'Laudos/Vistorias' | 'Contratos' | 'Armazenagem' | 'Transporte' | 'Impostos' | 'Aluguel' | 'Salários' | 'Marketing' | 'Infraestrutura/Software' | 'Manutenção' | 'Outros';
  amount: number;
  date: string;
  description: string;
  status: 'Pago' | 'Pendente' | 'Atrasado';
  paymentMethod: 'Pix' | 'Boleto' | 'Cartão' | 'Dinheiro' | 'Transferência';
  referenceId?: string; // e.g. invoiceId, contractId, providerId
  referenceName?: string; // Client Name or Provider Name
}


