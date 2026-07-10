import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  DollarSign, 
  Calendar, 
  Mail, 
  FileText, 
  Edit2, 
  Bell, 
  Send,
  Sparkles,
  TrendingUp,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Copy,
  Settings
} from 'lucide-react';
import { Contract, Client } from '../types';

interface ContractsSectionProps {
  contracts: Contract[];
  clients: Client[];
  onAddContract: (c: Omit<Contract, 'id' | 'renewedCount' | 'notificationsSent' | 'createdAt'>) => void;
  onUpdateContract: (id: string, updated: Partial<Contract>) => void;
  onDeleteContract: (id: string) => void;
  onRenewContract: (id: string, newEndDate: string, newValue?: number) => void;
  onTriggerContractNotification: (id: string, daysBefore: 10 | 5 | 2, type: 'WhatsApp' | 'E-mail' | 'Push', customMessage?: string) => void;
}

export default function ContractsSection({
  contracts,
  clients,
  onAddContract,
  onUpdateContract,
  onDeleteContract,
  onRenewContract,
  onTriggerContractNotification
}: ContractsSectionProps) {
  // UI states
  const [innerTab, setInnerTab] = useState<'list' | 'create' | 'notifications' | 'templates'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Create Form State
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [billingCycle, setBillingCycle] = useState<'Mensal' | 'Trimestral' | 'Semestral' | 'Anual'>('Mensal');
  const [autoRenew, setAutoRenew] = useState(true);
  const [billingStatus, setBillingStatus] = useState<'Em dia' | 'Pendente' | 'Atrasado'>('Em dia');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Renewal Modal/Form State
  const [renewingContractId, setRenewingContractId] = useState<string | null>(null);
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewValue, setRenewValue] = useState('');
  const [renewError, setRenewError] = useState('');

  // Templates State
  const [templates, setTemplates] = useState<{
    draft: string;
    tenDays: string;
    fiveDays: string;
    twoDays: string;
  }>(() => {
    const stored = localStorage.getItem('mobiinv_contract_templates');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Fallback
      }
    }
    return {
      draft: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE LOGÍSTICA

Contratante: {CLIENTE_NOME}
Documento: {CLIENTE_DOCUMENTO}
Endereço: {CLIENTE_ENDERECO}
E-mail: {CLIENTE_EMAIL}

Objeto: {CONTRATO_TITULO}
Identificador do Contrato: {CONTRATO_ID}

Vigência: De {INICIO_DATA} até {VENCIMENTO_DATA}
Ciclo de Faturamento: {CICLO_COBRANCA}

Valor Recorrente: {VALOR}

As partes elegem o foro da comarca da sede da Contratada para dirimir quaisquer dúvidas decorrentes deste instrumento.`,
      tenDays: `Prezado(a) {CLIENTE_NOME},

Gostaríamos de informar que o seu contrato "{CONTRATO_TITULO}" (ID: {CONTRATO_ID}) está próximo do vencimento, previsto para {VENCIMENTO_DATA} ({DIAS_RESTANTES} dias restantes).

Valor recorrente atual: {VALOR} ({CICLO_COBRANCA}).

Para garantir a continuidade dos serviços, solicitamos que entre em contato para alinhar os termos de renovação.`,
      fiveDays: `Olá, {CLIENTE_NOME}!

Passando para lembrar que faltam apenas {DIAS_RESTANTES} dias para o vencimento do seu contrato "{CONTRATO_TITULO}". A data limite de vigência é {VENCIMENTO_DATA}.

Deseja renovar o seu plano no valor de {VALOR}? Responda a esta mensagem ou ligue para nós para confirmar.`,
      twoDays: `⚠️ ALERTA DE VENCIMENTO IMINENTE - {CLIENTE_NOME}

O contrato "{CONTRATO_TITULO}" vencerá em {DIAS_RESTANTES} dias (em {VENCIMENTO_DATA}).

Caso a renovação não seja formalizada até a data limite, os serviços poderão ser suspensos temporariamente e multas de atraso no faturamento {CICLO_COBRANCA} poderão ser geradas. Evite transtornos!`
    };
  });

  const [templateSuccessMessage, setTemplateSuccessMessage] = useState('');

  // Template Preview / Generation Modal State
  const [previewingContractId, setPreviewingContractId] = useState<string | null>(null);
  const [previewTemplateType, setPreviewTemplateType] = useState<'draft' | 'tenDays' | 'fiveDays' | 'twoDays'>('draft');
  const [previewEditedText, setPreviewEditedText] = useState('');
  const [copied, setCopied] = useState(false);

  // Quick stats calculation
  const stats = React.useMemo(() => {
    const totalCount = contracts.length;
    const activeCount = contracts.filter(c => c.status === 'Ativo').length;
    
    // Total monthly recurring revenue
    const mrr = contracts.reduce((sum, c) => {
      if (c.status !== 'Ativo') return sum;
      let multiplier = 1;
      if (c.billingCycle === 'Trimestral') multiplier = 1 / 3;
      else if (c.billingCycle === 'Semestral') multiplier = 1 / 6;
      else if (c.billingCycle === 'Anual') multiplier = 1 / 12;
      return sum + (c.value * multiplier);
    }, 0);

    // Filter contracts expiring within 15 days
    const expiringSoonCount = contracts.filter(c => {
      if (c.status !== 'Ativo') return false;
      const days = getDaysRemaining(c.endDate);
      return days >= 0 && days <= 15;
    }).length;

    // Billing alerts
    const pendingBilling = contracts.filter(c => c.billingStatus !== 'Em dia').length;

    return { totalCount, activeCount, mrr, expiringSoonCount, pendingBilling };
  }, [contracts]);

  // Helper: Replace contract/client placeholders dynamically in templates
  const renderTemplate = (text: string, contract: Contract) => {
    const client = clients.find(cl => cl.id === contract.clientId);
    const daysRemaining = getDaysRemaining(contract.endDate);
    
    const placeholders: Record<string, string> = {
      '{CLIENTE_NOME}': contract.clientName || '',
      '{CLIENTE_DOCUMENTO}': client?.document || 'N/A',
      '{CLIENTE_EMAIL}': client?.email || 'N/A',
      '{CLIENTE_TELEFONE}': client?.phone || 'N/A',
      '{CLIENTE_ENDERECO}': client?.address || 'N/A',
      '{CONTRATO_ID}': contract.id || '',
      '{CONTRATO_TITULO}': contract.title || '',
      '{VALOR}': `R$ ${contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      '{VENCIMENTO_DATA}': contract.endDate ? new Date(contract.endDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A',
      '{INICIO_DATA}': contract.startDate ? new Date(contract.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A',
      '{CICLO_COBRANCA}': contract.billingCycle || 'Mensal',
      '{DIAS_RESTANTES}': daysRemaining >= 0 ? String(daysRemaining) : '0'
    };

    let rendered = text;
    Object.entries(placeholders).forEach(([key, value]) => {
      rendered = rendered.split(key).join(value);
    });
    return rendered;
  };

  // Helper: calculate days remaining
  function getDaysRemaining(endDateStr: string): number {
    const end = new Date(endDateStr + 'T23:59:59');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Handle create submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setFormError('Por favor, selecione um cliente.');
      return;
    }
    if (!title.trim()) {
      setFormError('Por favor, digite o título/objeto do contrato.');
      return;
    }
    if (!value || isNaN(Number(value))) {
      setFormError('Por favor, digite um valor numérico válido.');
      return;
    }
    if (!startDate) {
      setFormError('Selecione a data de início.');
      return;
    }
    if (!endDate) {
      setFormError('Selecione a data de término.');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setFormError('A data de término deve ser posterior à data de início.');
      return;
    }

    const selectedClient = clients.find(cl => cl.id === clientId);
    if (!selectedClient) {
      setFormError('Cliente não encontrado.');
      return;
    }

    onAddContract({
      clientId,
      clientName: selectedClient.name,
      title,
      value: Number(value),
      startDate,
      endDate,
      billingCycle,
      status: 'Ativo',
      billingStatus,
      autoRenew
    });

    // Reset Form
    setClientId('');
    setTitle('');
    setValue('');
    setStartDate('');
    setEndDate('');
    setBillingCycle('Mensal');
    setAutoRenew(true);
    setBillingStatus('Em dia');
    setFormError('');
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 3000);
  };

  // Handle Renew Submission
  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingContractId) return;
    if (!renewEndDate) {
      setRenewError('Insira a nova data de término.');
      return;
    }

    const target = contracts.find(c => c.id === renewingContractId);
    if (target && new Date(renewEndDate) <= new Date(target.endDate)) {
      setRenewError('A nova data de término deve ser posterior ao vencimento atual.');
      return;
    }

    onRenewContract(
      renewingContractId,
      renewEndDate,
      renewValue ? Number(renewValue) : undefined
    );

    setRenewingContractId(null);
    setRenewEndDate('');
    setRenewValue('');
    setRenewError('');
  };

  // Filtered contracts list
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const days = getDaysRemaining(c.endDate);
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && c.status === 'Ativo';
    if (statusFilter === 'expiring') return matchesSearch && c.status === 'Ativo' && days >= 0 && days <= 15;
    if (statusFilter === 'expired') return matchesSearch && (c.status === 'Vencido' || days < 0);
    if (statusFilter === 'billing_alert') return matchesSearch && c.billingStatus !== 'Em dia';
    return matchesSearch;
  });

  return (
    <div className="space-y-6" id="contracts-section-container">
      {/* Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-sm border border-slate-800" id="contracts-header-banner">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-wider rounded-sm">Recorrência</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider rounded-sm">Automação</span>
          </div>
          <h2 className="font-sans font-bold text-lg uppercase tracking-wider">Gestão de Contratos e Cobrança</h2>
          <p className="text-xs text-slate-400 max-w-xl mt-1">
            Gerencie contratos recorrentes, configure renovações e ative notificações automáticas de vencimento enviadas aos clientes com 10, 5 e 2 dias de antecedência.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setInnerTab('create')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
            id="contracts-create-shortcut-btn"
          >
            <Plus className="w-4 h-4" /> Novo Contrato
          </button>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="contracts-stats-grid">
        <div className="bg-white border border-slate-200 p-4 rounded-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contratos Ativos</span>
            <span className="text-xl font-extrabold text-slate-900 mt-1 block">
              {stats.activeCount} <span className="text-xs font-normal text-slate-400">de {stats.totalCount}</span>
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-sm">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">MRR (Faturamento Mensal)</span>
            <span className="text-xl font-extrabold text-emerald-600 mt-1 block">
              R$ {stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Expira em breve (&lt; 15 dias)</span>
            <span className="text-xl font-extrabold text-amber-600 mt-1 block">
              {stats.expiringSoonCount}
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Alertas de Cobrança</span>
            <span className="text-xl font-extrabold text-rose-600 mt-1 block">
              {stats.pendingBilling}
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-sm">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* INTERNAL NAVIGATION TABS */}
      <div className="flex border-b border-slate-200" id="contracts-inner-tabs">
        <button
          onClick={() => setInnerTab('list')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            innerTab === 'list' 
              ? 'border-blue-600 text-blue-600 bg-blue-50/20' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
          id="contracts-tab-list"
        >
          Lista de Contratos ({filteredContracts.length})
        </button>
        <button
          onClick={() => setInnerTab('create')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            innerTab === 'create' 
              ? 'border-blue-600 text-blue-600 bg-blue-50/20' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
          id="contracts-tab-create"
        >
          Gerar Novo Contrato
        </button>
        <button
          onClick={() => setInnerTab('notifications')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            innerTab === 'notifications' 
              ? 'border-blue-600 text-blue-600 bg-blue-50/20' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
          id="contracts-tab-notifications"
        >
          Automação de Avisos (10, 5, 2 dias)
        </button>
        <button
          onClick={() => setInnerTab('templates')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            innerTab === 'templates' 
              ? 'border-blue-600 text-blue-600 bg-blue-50/20' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
          id="contracts-tab-templates"
        >
          Modelos de Texto / Templates
        </button>
      </div>

      {/* RENDER INNER TABS */}

      {/* TAB 1: CONTRACTS LIST */}
      {innerTab === 'list' && (
        <div className="space-y-4" id="contracts-list-panel">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 border border-slate-200 rounded-sm justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, título ou ID..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 text-xs rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                id="contracts-search-input"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  className="px-2 py-2 border border-slate-200 text-xs rounded-sm text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  id="contracts-filter-dropdown"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativos</option>
                  <option value="expiring">Vencendo em breve (&lt; 15 dias)</option>
                  <option value="expired">Vencidos</option>
                  <option value="billing_alert">Problemas de Cobrança</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contracts Table */}
          {filteredContracts.length === 0 ? (
            <div className="bg-white border border-slate-200 py-12 px-4 text-center rounded-sm text-slate-450">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-sans font-bold text-sm uppercase text-slate-700 tracking-wider">Nenhum contrato encontrado</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tente ajustar os termos da sua busca ou filtros, ou crie um novo contrato.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 bg-white rounded-sm" id="contracts-table-wrapper">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    <th className="p-4">Contrato / Cliente</th>
                    <th className="p-4">Vigência</th>
                    <th className="p-4 text-right">Valor Recorrente</th>
                    <th className="p-4 text-center">Faturamento</th>
                    <th className="p-4 text-center">Auto-Renovação</th>
                    <th className="p-4 text-center">Status Vencimento</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredContracts.map(contract => {
                    const daysRemaining = getDaysRemaining(contract.endDate);
                    const isOverdue = daysRemaining < 0;
                    
                    let billingStatusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    if (contract.billingStatus === 'Pendente') billingStatusColor = 'bg-amber-50 text-amber-700 border-amber-200';
                    if (contract.billingStatus === 'Atrasado') billingStatusColor = 'bg-rose-50 text-rose-700 border-rose-200';

                    return (
                      <tr key={contract.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{contract.title}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5 uppercase">
                            <span>ID: {contract.id}</span>
                            <span>&bull;</span>
                            <span className="font-medium text-slate-600">Cliente: {contract.clientName}</span>
                          </div>
                          {contract.renewedCount > 0 && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 font-bold uppercase rounded-sm border border-blue-100">
                              <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" /> Renovado {contract.renewedCount}x
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{new Date(contract.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                          <div className="text-[10px] text-slate-400 uppercase">Até {new Date(contract.endDate + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                        </td>
                        <td className="p-4 text-right font-bold text-slate-950">
                          R$ {contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <div className="text-[9px] text-slate-400 font-normal uppercase tracking-wider">{contract.billingCycle}</div>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              // Cycle through billing status for quick test
                              const nextStatus: Record<typeof contract.billingStatus, typeof contract.billingStatus> = {
                                'Em dia': 'Pendente',
                                'Pendente': 'Atrasado',
                                'Atrasado': 'Em dia'
                              };
                              onUpdateContract(contract.id, { billingStatus: nextStatus[contract.billingStatus] });
                            }}
                            className={`px-2 py-1 rounded-sm border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition hover:brightness-95 inline-block ${billingStatusColor}`}
                            title="Clique para alternar o status de cobrança"
                          >
                            {contract.billingStatus}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => onUpdateContract(contract.id, { autoRenew: !contract.autoRenew })}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-sm border transition uppercase tracking-wider cursor-pointer ${
                              contract.autoRenew 
                                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {contract.autoRenew ? 'Sim (Ativa)' : 'Não (Inativa)'}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          {isOverdue ? (
                            <span className="px-2 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-sm font-bold text-[10px] uppercase tracking-wide inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Vencido ({Math.abs(daysRemaining)}d)
                            </span>
                          ) : daysRemaining <= 15 ? (
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-sm font-bold text-[10px] uppercase tracking-wide inline-flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> Vence em {daysRemaining}d
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-sm font-bold text-[10px] uppercase tracking-wide inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Ativo ({daysRemaining}d)
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setPreviewingContractId(contract.id);
                                setPreviewTemplateType('draft');
                                setPreviewEditedText(renderTemplate(templates.draft, contract));
                                setCopied(false);
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-sm transition cursor-pointer"
                              title="Gerar Documento / Notificação"
                            >
                              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                            </button>
                            <button
                              onClick={() => {
                                setRenewingContractId(contract.id);
                                // Suggest next end date by adding e.g. 6 months
                                const nextDate = new Date(contract.endDate);
                                nextDate.setMonth(nextDate.getMonth() + 6);
                                setRenewEndDate(nextDate.toISOString().split('T')[0]);
                                setRenewValue(contract.value.toString());
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-sm transition cursor-pointer"
                              title="Renovar Contrato"
                            >
                              <RefreshCw className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Tem certeza de que deseja excluir este contrato permanentemente?')) {
                                  onDeleteContract(contract.id);
                                }
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-sm transition cursor-pointer"
                              title="Excluir Contrato"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE CONTRACT FORM */}
      {innerTab === 'create' && (
        <div className="bg-white border border-slate-200 p-6 rounded-sm max-w-xl mx-auto" id="contracts-create-form-wrapper">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Plus className="w-5 h-5 text-blue-600" />
            <h3 className="font-sans font-bold text-sm uppercase text-slate-900 tracking-wider">
              Registrar Novo Contrato Recorrente
            </h3>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Cliente Associado *
              </label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                id="form-client-select"
              >
                <option value="">Selecione o Cliente contratante...</option>
                {clients.map(cl => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name} ({cl.companyName || 'Pessoa Física'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Título ou Objeto do Contrato *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Ex: Contrato Mensal de Guarda-Móveis Box 12"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                id="form-title-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Valor do Contrato (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="1500.00"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    id="form-value-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Ciclo de Faturamento / Recorrência *
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as any)}
                  id="form-billingcycle-select"
                >
                  <option value="Mensal">Mensal</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Semestral">Semestral</option>
                  <option value="Anual">Anual</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Data de Início *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  id="form-startdate-input"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Data de Vencimento / Término *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  id="form-enddate-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="form-autorenew-checkbox"
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded-sm cursor-pointer"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                />
                <label htmlFor="form-autorenew-checkbox" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                  Renovação Automática Ativa
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Status de Cobrança Inicial
                </label>
                <select
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={billingStatus}
                  onChange={(e) => setBillingStatus(e.target.value as any)}
                  id="form-billingstatus-select"
                >
                  <option value="Em dia">Em dia (Faturado / Pago)</option>
                  <option value="Pendente">Pendente de pagamento</option>
                  <option value="Atrasado">Inadimplente (Atrasado)</option>
                </select>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-sm font-bold uppercase tracking-wide">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-sm font-bold uppercase tracking-wide flex items-center gap-2">
                <Check className="w-4 h-4" /> Contrato criado com sucesso e notificações de faturamento enviadas!
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 transition font-bold text-xs uppercase tracking-wider text-white rounded-sm flex items-center justify-center gap-1.5 cursor-pointer"
                id="form-submit-btn"
              >
                <Check className="w-4 h-4" /> Registrar Contrato
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: AUTOMATIC NOTIFICATION SYSTEMS & SIMULATION */}
      {innerTab === 'notifications' && (
        <div className="space-y-6" id="contracts-notifications-panel">
          {/* Conceptual / Documentation Block */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-sm">
            <h3 className="font-sans font-bold text-sm uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Como funciona o Sistema de Alertas Automáticos de Vencimento?
            </h3>
            <p className="text-xs text-slate-650 mt-2 leading-relaxed">
              Para evitar esquecimentos e garantir a continuidade dos serviços ou faturamento, nossa plataforma monitora ativamente as datas de término dos contratos. O sistema dispara alertas automáticos e de cobrança diretamente aos canais do cliente com a seguinte regra:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white border border-slate-200 p-3 rounded-sm flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
                  10d
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">10 Dias Antes</h4>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase">E-mail Formal</p>
                  <p className="text-[11px] text-slate-600 mt-1">Primeiro aviso amigável sugerindo agendamento para renovação.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded-sm flex gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold text-xs">
                  5d
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">5 Dias Antes</h4>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase">WhatsApp Direto</p>
                  <p className="text-[11px] text-slate-600 mt-1">Aviso interativo via WhatsApp para confirmação de interesse.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded-sm flex gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 font-bold text-xs">
                  2d
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">2 Dias Antes</h4>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase">WhatsApp Urgente & Push</p>
                  <p className="text-[11px] text-slate-600 mt-1">Alerta crítico sobre interrupção de serviços e faturamento de multa.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Dashboard */}
          <div className="bg-white border border-slate-200 p-5 rounded-sm">
            <h3 className="font-sans font-bold text-sm uppercase text-slate-900 tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-4.5 h-4.5 text-blue-600" />
              Painel de Simulação de Disparo Automático (Disparo em Tempo Real)
            </h3>
            <p className="text-xs text-slate-500 mb-4 uppercase">
              Selecione o contrato abaixo para testar o envio simulado de cada notificação. Os logs serão registrados na aba principal de notificações!
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    <th className="p-3">Contrato / Cliente</th>
                    <th className="p-3">Data Fim</th>
                    <th className="p-3">Prazo Restante</th>
                    <th className="p-3 text-center">Status 10 Dias</th>
                    <th className="p-3 text-center">Status 5 Dias</th>
                    <th className="p-3 text-center">Status 2 Dias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contracts.filter(c => c.status === 'Ativo').map(c => {
                    const days = getDaysRemaining(c.endDate);
                    const sent = c.notificationsSent || {};

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/40">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{c.title}</div>
                          <div className="text-[10px] text-slate-500 uppercase">{c.clientName}</div>
                        </td>
                        <td className="p-3 font-medium text-slate-600">
                          {new Date(c.endDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3">
                          {days < 0 ? (
                            <span className="text-rose-600 font-bold uppercase">Expirado ({Math.abs(days)}d atrás)</span>
                          ) : (
                            <span className="text-slate-700 font-bold">{days} dias restantes</span>
                          )}
                        </td>
                        
                        {/* 10 Days simulation */}
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase border ${
                              sent.tenDays 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}>
                              {sent.tenDays ? 'Disparado' : 'Pendente'}
                            </span>
                            <button
                              onClick={() => onTriggerContractNotification(c.id, 10, 'E-mail', renderTemplate(templates.tenDays, c))}
                              className="text-[9px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 flex items-center gap-0.5 mt-1 transition cursor-pointer"
                              id={`trigger-10d-${c.id}`}
                            >
                              <Send className="w-2.5 h-2.5" /> Forçar Disparo
                            </button>
                          </div>
                        </td>

                        {/* 5 Days simulation */}
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase border ${
                              sent.fiveDays 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}>
                              {sent.fiveDays ? 'Disparado' : 'Pendente'}
                            </span>
                            <button
                              onClick={() => onTriggerContractNotification(c.id, 5, 'WhatsApp', renderTemplate(templates.fiveDays, c))}
                              className="text-[9px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 flex items-center gap-0.5 mt-1 transition cursor-pointer"
                              id={`trigger-5d-${c.id}`}
                            >
                              <Send className="w-2.5 h-2.5" /> Forçar Disparo
                            </button>
                          </div>
                        </td>

                        {/* 2 Days simulation */}
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase border ${
                              sent.twoDays 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}>
                              {sent.twoDays ? 'Disparado' : 'Pendente'}
                            </span>
                            <button
                              onClick={() => onTriggerContractNotification(c.id, 2, 'WhatsApp', renderTemplate(templates.twoDays, c))}
                              className="text-[9px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 flex items-center gap-0.5 mt-1 transition cursor-pointer"
                              id={`trigger-2d-${c.id}`}
                            >
                              <Send className="w-2.5 h-2.5" /> Forçar Disparo
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONTRACTS TEXT TEMPLATES */}
      {innerTab === 'templates' && (
        <div className="space-y-6" id="contracts-templates-panel">
          {/* Header Description */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-sm">
            <h3 className="font-sans font-bold text-sm uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600 animate-spin-slow" />
              Modelos de Contratos e Notificações de Cobrança
            </h3>
            <p className="text-xs text-slate-650 mt-2 leading-relaxed font-medium">
              Customize os textos padrões utilizados para formalizar novos contratos e para enviar avisos de cobrança automáticos antes do vencimento. Use placeholders dinâmicos que serão substituídos em tempo real pelas informações reais do cliente ou contrato ao gerar documentos ou e-mails.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Middle Column - Editor */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Edit2 className="w-4 h-4 text-blue-600" />
                    Editor de Modelos Padrão
                  </h4>
                  {templateSuccessMessage && (
                    <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] uppercase font-bold rounded-sm flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> {templateSuccessMessage}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Minuta de Contrato */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>1. Minuta de Contrato Principal</span>
                      <span className="text-slate-400 font-normal">Visualizado ao clicar em "Gerar Documento"</span>
                    </label>
                    <textarea
                      rows={6}
                      className="w-full p-3 border border-slate-200 rounded-sm font-mono text-[11px] bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                      value={templates.draft}
                      onChange={(e) => setTemplates(prev => ({ ...prev, draft: e.target.value }))}
                      placeholder="Escreva a minuta padrão do contrato..."
                    />
                  </div>

                  {/* Lembrete 10 Dias */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>2. Mensagem de Alerta - 10 Dias Antes (E-mail)</span>
                      <span className="text-blue-500 font-bold">10d</span>
                    </label>
                    <textarea
                      rows={4}
                      className="w-full p-3 border border-slate-200 rounded-sm font-mono text-[11px] bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                      value={templates.tenDays}
                      onChange={(e) => setTemplates(prev => ({ ...prev, tenDays: e.target.value }))}
                      placeholder="Escreva a mensagem de alerta para 10 dias..."
                    />
                  </div>

                  {/* Lembrete 5 Dias */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>3. Mensagem de Alerta - 5 Dias Antes (WhatsApp)</span>
                      <span className="text-amber-500 font-bold">5d</span>
                    </label>
                    <textarea
                      rows={4}
                      className="w-full p-3 border border-slate-200 rounded-sm font-mono text-[11px] bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                      value={templates.fiveDays}
                      onChange={(e) => setTemplates(prev => ({ ...prev, fiveDays: e.target.value }))}
                      placeholder="Escreva a mensagem de alerta para 5 dias..."
                    />
                  </div>

                  {/* Lembrete 2 Dias */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>4. Mensagem de Alerta - 2 Dias Antes (WhatsApp/Push)</span>
                      <span className="text-rose-500 font-bold">2d</span>
                    </label>
                    <textarea
                      rows={4}
                      className="w-full p-3 border border-slate-200 rounded-sm font-mono text-[11px] bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                      value={templates.twoDays}
                      onChange={(e) => setTemplates(prev => ({ ...prev, twoDays: e.target.value }))}
                      placeholder="Escreva a mensagem de alerta para 2 dias..."
                    />
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => {
                      localStorage.setItem('mobiinv_contract_templates', JSON.stringify(templates));
                      setTemplateSuccessMessage('Modelos salvos!');
                      setTimeout(() => setTemplateSuccessMessage(''), 3000);
                    }}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 transition font-bold text-xs uppercase tracking-wider text-white rounded-sm flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Check className="w-4 h-4" /> Salvar Configurações de Modelos
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Placeholders Reference Sheet */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-xs">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-100 pb-2">
                  Tags e Placeholders Disponíveis
                </h4>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                  Copie e cole estas tags nos seus templates para que as informações sejam preenchidas dinamicamente pelo sistema:
                </p>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dados do Cliente</span>
                    <div className="space-y-1.5">
                      {[
                        { tag: '{CLIENTE_NOME}', desc: 'Nome completo do cliente' },
                        { tag: '{CLIENTE_DOCUMENTO}', desc: 'CPF ou CNPJ cadastrado' },
                        { tag: '{CLIENTE_EMAIL}', desc: 'E-mail para cobrança/avisos' },
                        { tag: '{CLIENTE_TELEFONE}', desc: 'Número para contato telefônico' },
                        { tag: '{CLIENTE_ENDERECO}', desc: 'Endereço registrado' }
                      ].map(item => (
                        <div key={item.tag} className="flex items-center justify-between gap-1 text-[11px] border-b border-slate-50 pb-1.5">
                          <code className="text-blue-600 font-mono font-bold bg-blue-50/50 px-1 rounded-sm select-all">{item.tag}</code>
                          <span className="text-slate-500 text-right">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dados do Contrato</span>
                    <div className="space-y-1.5">
                      {[
                        { tag: '{CONTRATO_ID}', desc: 'Código identificador único' },
                        { tag: '{CONTRATO_TITULO}', desc: 'Título ou objeto contratual' },
                        { tag: '{VALOR}', desc: 'Valor recorrente (R$ 0,00)' },
                        { tag: '{INICIO_DATA}', desc: 'Data de início da vigência' },
                        { tag: '{VENCIMENTO_DATA}', desc: 'Data limite de vencimento' },
                        { tag: '{CICLO_COBRANCA}', desc: 'Ciclo: Mensal, Anual, etc.' },
                        { tag: '{DIAS_RESTANTES}', desc: 'Contagem regressiva de dias' }
                      ].map(item => (
                        <div key={item.tag} className="flex items-center justify-between gap-1 text-[11px] border-b border-slate-50 pb-1.5">
                          <code className="text-amber-600 font-mono font-bold bg-amber-50/50 px-1 rounded-sm select-all">{item.tag}</code>
                          <span className="text-slate-500 text-right">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-sm mt-5 text-[11px] text-blue-800 leading-relaxed font-medium">
                  <strong>💡 Dica de Utilização:</strong> Ao clicar no botão de <Sparkles className="w-3.5 h-3.5 text-amber-500 inline mx-0.5" /> <strong>Estrela (Gerar)</strong> na lista de contratos, você poderá pré-visualizar a substituição dessas tags em tempo real para qualquer contrato individual!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY / MODAL: GENERATE & PREVIEW TEMPLATE */}
      {previewingContractId && (() => {
        const contract = contracts.find(c => c.id === previewingContractId);
        if (!contract) return null;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-xs" id="preview-template-modal-overlay">
            <div className="bg-white rounded-sm border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  <div>
                    <h3 className="font-sans font-bold text-xs uppercase tracking-wider">
                      Gerador e Editor de Documento Dinâmico
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                      Contrato: <span className="text-white font-bold">{contract.title}</span> &bull; Cliente: <span className="text-white font-bold">{contract.clientName}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewingContractId(null)}
                  className="text-slate-400 hover:text-white transition font-bold text-base cursor-pointer px-2"
                >
                  &times;
                </button>
              </div>

              {/* Sub-tab Selection inside Modal */}
              <div className="flex border-b border-slate-200 bg-slate-50 px-4 overflow-x-auto">
                {[
                  { key: 'draft', label: 'Minuta de Contrato', icon: FileText },
                  { key: 'tenDays', label: 'Alerta 10d (E-mail)', icon: Mail },
                  { key: 'fiveDays', label: 'Alerta 5d (WhatsApp)', icon: Bell },
                  { key: 'twoDays', label: 'Alerta 2d (Crítico)', icon: AlertTriangle }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = previewTemplateType === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setPreviewTemplateType(tab.key as any);
                        const rawText = templates[tab.key as keyof typeof templates];
                        setPreviewEditedText(renderTemplate(rawText, contract));
                        setCopied(false);
                      }}
                      className={`px-3 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        isActive 
                          ? 'border-blue-600 text-blue-600 bg-white font-black' 
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Modal Body */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Texto do Documento Gerado (Editável antes de enviar/copiar)
                    </span>
                    {copied && (
                      <span className="text-[9px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded-sm">
                        Copiado para a Área de Transferência!
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={10}
                    className="w-full p-4 border border-slate-200 rounded-sm font-mono text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white leading-relaxed resize-none shadow-inner"
                    value={previewEditedText}
                    onChange={(e) => setPreviewEditedText(e.target.value)}
                  />
                </div>

                {/* Substituted parameters checklist inside the card */}
                <div className="bg-slate-50 p-3 rounded-sm border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Metadados Substituídos para este Contrato
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                    <div className="bg-white p-1.5 border border-slate-100 rounded-xs">
                      <span className="text-slate-400 uppercase block text-[8px]">ID Contrato</span>
                      <strong className="text-slate-800 font-mono truncate block">{contract.id}</strong>
                    </div>
                    <div className="bg-white p-1.5 border border-slate-100 rounded-xs">
                      <span className="text-slate-400 uppercase block text-[8px]">Valor</span>
                      <strong className="text-emerald-600 font-bold block">R$ {contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div className="bg-white p-1.5 border border-slate-100 rounded-xs">
                      <span className="text-slate-400 uppercase block text-[8px]">Vencimento</span>
                      <strong className="text-slate-800 block">{new Date(contract.endDate + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
                    </div>
                    <div className="bg-white p-1.5 border border-slate-100 rounded-xs">
                      <span className="text-slate-400 uppercase block text-[8px]">Ciclo</span>
                      <strong className="text-slate-800 block">{contract.billingCycle}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-150 flex flex-col sm:flex-row justify-between gap-2 rounded-b-sm">
                <button
                  onClick={() => setPreviewingContractId(null)}
                  className="px-4 py-2 border border-slate-200 rounded-sm font-bold uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-600 text-[10px] cursor-pointer"
                >
                  Fechar
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(previewEditedText);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch (err) {
                        alert('Erro ao copiar texto. Por favor, copie manualmente.');
                      }
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-sm font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar Texto
                  </button>

                  {/* If alert template is selected, allow instant notification trigger with this edited text! */}
                  {previewTemplateType !== 'draft' && (
                    <button
                      onClick={() => {
                        const daysBefore = previewTemplateType === 'tenDays' ? 10 : previewTemplateType === 'fiveDays' ? 5 : 2;
                        const channel = previewTemplateType === 'tenDays' ? 'E-mail' : 'WhatsApp';
                        onTriggerContractNotification(contract.id, daysBefore, channel, previewEditedText);
                        alert(`Notificação de Alerta (${daysBefore} dias) disparada com sucesso utilizando o texto customizado! Verifique o log na aba de Notificações.`);
                        setPreviewingContractId(null);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" /> Enviar Notificação
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* OVERLAY / MODAL: RENEW CONTRACT */}
      {renewingContractId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" id="renew-contract-modal-overlay">
          <div className="bg-white rounded-sm border border-slate-200 shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin-slow" />
              <div>
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">
                  Renovar Vigência de Contrato
                </h3>
                <p className="text-[9px] text-slate-500 uppercase tracking-wide">
                  Contrato: {contracts.find(c => c.id === renewingContractId)?.title}
                </p>
              </div>
            </div>

            <form onSubmit={handleRenewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nova Data de Vencimento *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={renewEndDate}
                  onChange={(e) => setRenewEndDate(e.target.value)}
                  id="renew-end-date"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Ajustar Valor Mensal (Opcional - Em Branco para Manter)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-sm text-xs bg-white text-slate-900 focus:outline-none"
                    placeholder={contracts.find(c => c.id === renewingContractId)?.value.toString()}
                    value={renewValue}
                    onChange={(e) => setRenewValue(e.target.value)}
                    id="renew-value"
                  />
                </div>
              </div>

              {renewError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] uppercase rounded-sm">
                  {renewError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRenewingContractId(null);
                    setRenewEndDate('');
                    setRenewValue('');
                    setRenewError('');
                  }}
                  className="flex-1 py-2 px-3 border border-slate-200 rounded-sm font-bold uppercase tracking-wider hover:bg-slate-55 bg-slate-100 text-slate-600 text-[10px] cursor-pointer"
                  id="cancel-renew-btn"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 transition rounded-sm text-white font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                  id="confirm-renew-btn"
                >
                  Confirmar Renovação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
