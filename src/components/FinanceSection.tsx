import React, { useState, useMemo } from 'react';
import { FinancialTransaction, Client, Invoice, Receipt, Contract } from '../types';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Filter, 
  RefreshCw, 
  X, 
  Info,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

interface FinanceSectionProps {
  transactions: FinancialTransaction[];
  clients: Client[];
  invoices: Invoice[];
  receipts: Receipt[];
  contracts: Contract[];
  onAddTransaction: (transaction: Omit<FinancialTransaction, 'id'>) => void;
  onUpdateTransactionStatus: (id: string, status: 'Pago' | 'Pendente' | 'Atrasado') => void;
  onDeleteTransaction: (id: string) => void;
  onSyncWithDocuments: () => void;
  accentColorClass: string;
}

export default function FinanceSection({
  transactions,
  clients,
  invoices,
  receipts,
  contracts,
  onAddTransaction,
  onUpdateTransactionStatus,
  onDeleteTransaction,
  onSyncWithDocuments,
  accentColorClass
}: FinanceSectionProps) {
  // Search & Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Receita' | 'Despesa'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pago' | 'Pendente' | 'Atrasado'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Adding New Transaction State
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<'Receita' | 'Despesa'>('Receita');
  const [newCategory, setNewCategory] = useState<FinancialTransaction['category']>('Laudos/Vistorias');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDescription, setNewDescription] = useState('');
  const [newStatus, setNewStatus] = useState<'Pago' | 'Pendente' | 'Atrasado'>('Pago');
  const [newPaymentMethod, setNewPaymentMethod] = useState<FinancialTransaction['paymentMethod']>('Pix');
  const [selectedReference, setSelectedReference] = useState('');
  const [formError, setFormError] = useState('');

  // Notifications/Sync Simulation
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');

  // Available categories based on transaction type
  const categories = {
    Receita: ['Laudos/Vistorias', 'Contratos', 'Armazenagem', 'Transporte', 'Outros'],
    Despesa: ['Transporte', 'Impostos', 'Aluguel', 'Salários', 'Marketing', 'Infraestrutura/Software', 'Manutenção', 'Outros']
  };

  // 1. DYNAMIC CALCULATIONS & METRICS
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let pendingReceivables = 0;
    let pendingPayables = 0;

    transactions.forEach(t => {
      const value = Number(t.amount) || 0;
      if (t.type === 'Receita') {
        if (t.status === 'Pago') {
          totalIncome += value;
        } else {
          pendingReceivables += value;
        }
      } else if (t.type === 'Despesa') {
        if (t.status === 'Pago') {
          totalExpense += value;
        } else {
          pendingPayables += value;
        }
      }
    });

    const netProfit = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      netProfit,
      pendingReceivables,
      pendingPayables
    };
  }, [transactions]);

  // 2. CHART DATA PREPARATION
  // Group by Category for Pie Chart (Expenses)
  const categoryData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'Despesa' && t.status === 'Pago')
      .forEach(t => {
        counts[t.category] = (counts[t.category] || 0) + t.amount;
      });

    const colors = [
      '#ef4444', // Red for Transporte/Expenses
      '#f97316', // Orange
      '#f59e0b', // Amber
      '#10b981', // Emerald
      '#6366f1', // Indigo
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#64748b'  // Slate
    ];

    return Object.keys(counts).map((cat, i) => ({
      name: cat,
      value: counts[cat],
      color: colors[i % colors.length]
    }));
  }, [transactions]);

  // Cash Flow History (Area Chart)
  // Group by Date (or Month)
  const cashFlowHistory = useMemo(() => {
    const dates: { [key: string]: { receita: number; despesa: number } } = {};
    
    // Sort transactions by date ascending
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    
    sorted.forEach(t => {
      // Format to DD/MM
      let label = t.date;
      try {
        const d = new Date(t.date);
        label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      } catch (e) {}

      if (!dates[label]) {
        dates[label] = { receita: 0, despesa: 0 };
      }
      
      if (t.status === 'Pago') {
        if (t.type === 'Receita') {
          dates[label].receita += t.amount;
        } else {
          dates[label].despesa += t.amount;
        }
      }
    });

    return Object.keys(dates).map(date => ({
      date,
      Receitas: dates[date].receita,
      Despesas: dates[date].despesa,
      Saldo: dates[date].receita - dates[date].despesa
    }));
  }, [transactions]);

  // 3. FILTERING TRANSACTIONS
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Type Filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      
      // Status Filter
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      
      // Category Filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      
      // Search Term
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const descMatch = t.description.toLowerCase().includes(term);
        const catMatch = t.category.toLowerCase().includes(term);
        const refMatch = t.referenceName && t.referenceName.toLowerCase().includes(term);
        const valMatch = t.amount.toString().includes(term);
        return descMatch || catMatch || refMatch || valMatch;
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date)); // Latest first
  }, [transactions, searchTerm, typeFilter, statusFilter, categoryFilter]);

  // Unique categories in current transaction list for filtering dropdown
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => cats.add(t.category));
    return Array.from(cats);
  }, [transactions]);

  // Submit new transaction
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || isNaN(Number(newAmount)) || Number(newAmount) <= 0) {
      setFormError('Por favor, digite um valor monetário válido maior que zero.');
      return;
    }
    if (!newDescription.trim()) {
      setFormError('Por favor, forneça uma descrição curta para identificar a transação.');
      return;
    }

    let refName = '';
    if (selectedReference) {
      const foundClient = clients.find(c => c.id === selectedReference);
      if (foundClient) {
        refName = foundClient.name;
      } else {
        refName = selectedReference; // fallback custom text
      }
    }

    onAddTransaction({
      type: newType,
      category: newCategory,
      amount: Number(newAmount),
      date: newDate,
      description: newDescription,
      status: newStatus,
      paymentMethod: newPaymentMethod,
      referenceId: selectedReference || undefined,
      referenceName: refName || undefined
    });

    // Reset Form
    setNewAmount('');
    setNewDescription('');
    setSelectedReference('');
    setFormError('');
    setIsAdding(false);
  };

  const handleDocumentSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      onSyncWithDocuments();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-6" id="finance-section-root">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">Módulo Financeiro Geral</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Controle completo de caixa, receitas, despesas, contas a pagar e receber integrados à operação</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDocumentSync}
            disabled={syncStatus === 'syncing'}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 dark:text-slate-300 rounded-sm text-[11px] font-bold uppercase tracking-wider transition hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            title="Importar faturamento emitido e despesas de prestadores"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            {syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'success' ? 'Sincronizado!' : 'Importar Doc. Faturamento'}
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              isAdding 
                ? 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
            }`}
          >
            {isAdding ? 'Voltar para Fluxo' : <><Plus className="w-4 h-4" /> Nova Lançamento</>}
          </button>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="finance-metrics-grid">
        {/* Total Incomes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Receitas Recebidas</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1.5 block tracking-tight">
                R$ {metrics.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-0.5 mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" /> Entradas quitadas
          </span>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Despesas Pagas</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1.5 block tracking-tight">
                R$ {metrics.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider flex items-center gap-0.5 mt-2">
            <ArrowDownRight className="w-3.5 h-3.5" /> Saídas quitadas
          </span>
        </div>

        {/* Caixa Líquido / Saldo */}
        <div className={`border rounded-xl p-4 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all flex flex-col justify-between group ${
          metrics.netProfit >= 0 
            ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/40' 
            : 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Saldo de Caixa</span>
              <span className={`text-xl font-black mt-1.5 block tracking-tight ${
                metrics.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
              }`}>
                R$ {metrics.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`p-2 rounded-lg group-hover:scale-110 transition-transform ${
              metrics.netProfit >= 0 
                ? 'bg-emerald-100/60 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' 
                : 'bg-rose-100/60 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
            }`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5 mt-2 text-slate-500 dark:text-slate-400">
            Fluxo Operacional Líquido
          </span>
        </div>

        {/* Contas a Receber (Receitas Pendentes/Atrasadas) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Contas a Receber</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1.5 block tracking-tight text-amber-600 dark:text-amber-400">
                R$ {metrics.pendingReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 rounded-lg group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-2">
            Previsão faturamento futuro
          </span>
        </div>

        {/* Contas a Pagar (Despesas Pendentes) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Contas a Pagar</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1.5 block tracking-tight text-blue-600 dark:text-blue-400">
                R$ {metrics.pendingPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 rounded-lg group-hover:scale-110 transition-transform">
              <Filter className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-2">
            Compromissos pendentes
          </span>
        </div>
      </div>

      {/* FORM: NEW TRANSACTION */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 shadow-md max-w-4xl" id="add-transaction-form">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Registrar Nova Transação Financeira
            </h3>
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Type Switcher */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo de Transação</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-sm border border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setNewType('Receita');
                    setNewCategory('Laudos/Vistorias');
                  }}
                  className={`py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition ${
                    newType === 'Receita'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewType('Despesa');
                    setNewCategory('Transporte');
                  }}
                  className={`py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition ${
                    newType === 'Despesa'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  Despesa
                </button>
              </div>
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Categoria</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {categories[newType].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valor Financeiro (R$) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data do Lançamento</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
              />
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status da Transação</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Pago">Quitada (Pago)</option>
                <option value="Pendente">Pendente / Contas a receber/pagar</option>
                <option value="Atrasado">Vencido e Atrasado</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Forma de Pagamento</label>
              <select
                value={newPaymentMethod}
                onChange={e => setNewPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Pix">Transferência Pix</option>
                <option value="Boleto">Boleto Bancário</option>
                <option value="Cartão">Cartão de Crédito/Débito</option>
                <option value="Transferência">TED / DOC Bancário</option>
                <option value="Dinheiro">Dinheiro em Espécie</option>
              </select>
            </div>

            {/* Client / Provider Reference */}
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vincular Cliente CRM (Opcional)</label>
              <select
                value={selectedReference}
                onChange={e => setSelectedReference(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Não vincular a cliente</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição Curta do Lançamento *</label>
              <input
                type="text"
                required
                placeholder="Ex: Compra de suprimentos, Faturamento de contrato mensal..."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-rose-500 mb-4 font-bold uppercase tracking-wider">{formError}</p>
          )}

          <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-sm transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 rounded-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle className="w-4 h-4" /> Registrar Lançamento
            </button>
          </div>
        </form>
      )}

      {/* CHARTS GRAPHICS PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="finance-charts-grid">
        {/* Chart 1: Cash Flow Area */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Fluxo de Caixa Recorrente (Realizado)
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Visão temporal de receitas vs despesas quitadas</p>
          </div>
          
          <div className="h-64 mt-4 text-[10px]">
            {cashFlowHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 uppercase tracking-wider font-bold">
                Sem dados de fluxo suficientes no momento.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                    </linearGradient>
                    <linearGradient id="colorDe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="opacity-40" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    formatter={(val) => [`R$ ${Number(val).toFixed(2)}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRe)" />
                  <Area type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDe)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Category Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-600" /> Distribuição de Despesas Quitadas
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Distribuição do dinheiro investido por categoria</p>
          </div>

          <div className="h-44 flex items-center justify-center relative mt-4">
            {categoryData.length === 0 ? (
              <div className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                Nenhuma despesa quitada registrada.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                      formatter={(val) => `R$ ${Number(val).toLocaleString('pt-BR')}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Inner label */}
                <div className="absolute text-center">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Desembolso</span>
                  <span className="block text-base font-black text-slate-900 dark:text-white mt-0.5">
                    R$ {metrics.totalExpense.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Pie Chart Legend List */}
          <div className="space-y-1 mt-3 border-t border-slate-100 dark:border-slate-800 pt-3 text-[10px] max-h-24 overflow-y-auto">
            {categoryData.map(cat => (
              <div key={cat.name} className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                  <span className="font-bold uppercase truncate">{cat.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-300">
                  R$ {cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILTER PANEL AND SEARCH */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-sm flex flex-col md:flex-row gap-4 items-center justify-between shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descrição, valor, cliente ou categoria..."
            className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Filter Type */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-sm">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tipo:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none focus:ring-0"
            >
              <option value="all">Todos</option>
              <option value="Receita">Receitas (+)</option>
              <option value="Despesa">Despesas (-)</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-sm">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none"
            >
              <option value="all">Todos</option>
              <option value="Pago">Quitado (Pago)</option>
              <option value="Pendente">Pendente</option>
              <option value="Atrasado">Atrasado</option>
            </select>
          </div>

          {/* Filter Category */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-sm">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Categoria:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none"
            >
              <option value="all">Todas</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* LEDGER TRANSACTION TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm overflow-hidden" id="finance-ledger-table-card">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Livro Razão / Extrato de Operações
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-850 dark:text-slate-400 px-2 py-0.5 rounded-sm">
            Lançamentos: {filteredTransactions.length} filtrados
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center">
            <Info className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-xs uppercase font-bold tracking-wider">Nenhuma transação encontrada para os filtros atuais.</p>
            <p className="text-[11px] text-slate-400 mt-1">Limpe os filtros de busca para visualizar o histórico completo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-150 dark:border-slate-850">
                  <th className="py-3 px-5">ID / Código</th>
                  <th className="py-3 px-5">Data</th>
                  <th className="py-3 px-5">Descrição / Cliente</th>
                  <th className="py-3 px-5">Categoria</th>
                  <th className="py-3 px-5 text-center">Método</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Valor Líquido</th>
                  <th className="py-3 px-5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredTransactions.map(t => {
                  const isReceita = t.type === 'Receita';
                  return (
                    <tr 
                      key={t.id} 
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-950/30 transition-colors"
                      id={`transaction-row-${t.id}`}
                    >
                      {/* ID */}
                      <td className="py-3.5 px-5 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        {t.id}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-5 font-mono whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>

                      {/* Description / Reference */}
                      <td className="py-3.5 px-5 max-w-xs md:max-w-md">
                        <p className="font-bold text-slate-900 dark:text-white truncate" title={t.description}>
                          {t.description}
                        </p>
                        {t.referenceName && (
                          <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            <Building className="w-3 h-3" /> {t.referenceName}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {t.category}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-5 text-center font-bold text-slate-500 dark:text-slate-400 text-[11px]">
                        {t.paymentMethod}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 text-center">
                        <select
                          value={t.status}
                          onChange={(e) => onUpdateTransactionStatus(t.id, e.target.value as any)}
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded-sm cursor-pointer border-0 focus:ring-1 focus:ring-blue-500 outline-none ${
                            t.status === 'Pago'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                              : t.status === 'Pendente'
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          <option value="Pago">Pago</option>
                          <option value="Pendente">Pendente</option>
                          <option value="Atrasado">Atrasado</option>
                        </select>
                      </td>

                      {/* Net Amount */}
                      <td className={`py-3.5 px-5 text-right font-mono font-black text-xs whitespace-nowrap ${
                        isReceita ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isReceita ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {t.status !== 'Pago' && (
                            <button
                              onClick={() => onUpdateTransactionStatus(t.id, 'Pago')}
                              className="text-emerald-500 hover:text-emerald-600 p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xs transition-colors"
                              title="Marcar como Liquidado/Pago"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteTransaction(t.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xs transition-colors"
                            title="Deletar lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* DYNAMIC METRIC INSIGHT PANEL */}
      <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-3 items-start sm:items-center">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Auditoria e Conciliação Operacional</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              O sistema calcula automaticamente as receitas com base em <strong>Contratos Ativos</strong> e <strong>Laudos de Vistoria Finalizados</strong> para auditar e sugerir lançamentos pendentes.
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-2xs">
          Margem de Lucro Realizada:{' '}
          <span className="text-emerald-600 font-black">
            {metrics.totalIncome > 0 ? `${Math.round((metrics.netProfit / metrics.totalIncome) * 100)}%` : '0%'}
          </span>
        </div>
      </div>
    </div>
  );
}
