import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, InventoryItem, InventoryReport, Invoice, Receipt, NotificationLog, ServiceProvider, CatalogService, Contract, FinancialTransaction } from './types';
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
import {
  INITIAL_CLIENTS,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_REPORTS,
  INITIAL_NOTIFICATION_LOGS,
  INITIAL_PROVIDERS,
  INITIAL_SERVICES_CATALOG,
  INITIAL_CONTRACTS,
  INITIAL_TRANSACTIONS
} from './data';
import CrmSection from './components/CrmSection';
import InventorySection from './components/InventorySection';
import ReportsSection from './components/ReportsSection';
import IntegrationsSection from './components/IntegrationsSection';
import ProvidersSection from './components/ProvidersSection';
import ContractsSection from './components/ContractsSection';
import FinanceSection from './components/FinanceSection';
import SignatureCanvas from './components/SignatureCanvas';
import UserProfileModal, { UserProfileData } from './components/UserProfileModal';
import {
  LayoutDashboard,
  Users,
  Camera,
  FileCheck,
  Bell,
  TrendingUp,
  DollarSign,
  Package,
  ShieldCheck,
  Plus,
  ArrowRight,
  Sparkles,
  Menu,
  X,
  Calendar,
  Clock,
  Lock,
  LogIn,
  LogOut,
  User,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  RefreshCw,
  Sun,
  Moon,
  Truck,
  FileText,
  AlertTriangle,
  Mail
} from 'lucide-react';

export default function App() {
  // Application State with LocalStorage fallbacks
  const [clients, setClients] = useState<Client[]>(() => {
    const stored = localStorage.getItem('mobiinv_clients');
    return stored ? JSON.parse(stored) : INITIAL_CLIENTS;
  });

  const [reports, setReports] = useState<InventoryReport[]>(() => {
    const stored = localStorage.getItem('mobiinv_reports');
    return stored ? JSON.parse(stored) : INITIAL_REPORTS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const stored = localStorage.getItem('mobiinv_invoices');
    if (stored) return JSON.parse(stored);
    
    // Default initial invoice
    return [
      {
        id: 'NF-2026-004',
        reportId: 'rep-1',
        clientId: 'cli-2',
        clientName: 'Mariana Santos',
        itemsCount: 2,
        totalValue: 6050.00,
        issueDate: '2026-06-25T13:30:00Z',
        status: 'Emitida',
        taxValue: 302.50
      }
    ];
  });

  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const stored = localStorage.getItem('mobiinv_receipts');
    if (stored) return JSON.parse(stored);

    // Default initial receipt
    return [
      {
        id: 'REC-90111',
        reportId: 'rep-1',
        clientId: 'cli-2',
        clientName: 'Mariana Santos',
        totalValue: 6050.00,
        paymentMethod: 'Pix',
        issueDate: '2026-06-25T13:31:00Z',
        notes: 'Laudo assinado e pago integralmente via transferência Pix.'
      }
    ];
  });

  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() => {
    const stored = localStorage.getItem('mobiinv_logs');
    return stored ? JSON.parse(stored) : INITIAL_NOTIFICATION_LOGS;
  });

  const [providers, setProviders] = useState<ServiceProvider[]>(() => {
    const stored = localStorage.getItem('mobiinv_providers');
    return stored ? JSON.parse(stored) : INITIAL_PROVIDERS;
  });

  const [services, setServices] = useState<CatalogService[]>(() => {
    const stored = localStorage.getItem('mobiinv_services');
    return stored ? JSON.parse(stored) : INITIAL_SERVICES_CATALOG;
  });

  const [contracts, setContracts] = useState<Contract[]>(() => {
    const stored = localStorage.getItem('mobiinv_contracts');
    return stored ? JSON.parse(stored) : INITIAL_CONTRACTS;
  });

  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    const stored = localStorage.getItem('mobiinv_transactions');
    return stored ? JSON.parse(stored) : INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    localStorage.setItem('mobiinv_transactions', JSON.stringify(transactions));
  }, [transactions]);


  // UI state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('mobiinv_logged_in') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState('admin@mobiinv.com');
  const [loginPassword, setLoginPassword] = useState('123456');
  const [loginError, setLoginError] = useState('');

  // User Profile and Identity state
  const [userProfile, setUserProfile] = useState<UserProfileData>(() => {
    const stored = localStorage.getItem('mobiinv_user_profile');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored user profile:', e);
      }
    }
    return {
      userName: 'JacksOnGuedy',
      userRole: 'Inspetor Lvl 3',
      companyName: 'MobiInv Pro',
      companyCnpj: '12.345.678/0001-90',
      companyAddress: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
      companyPhone: '(11) 98765-4321',
      companyEmail: 'contato@mobiinv.com',
      companyLogo: '',
      accentColor: 'blue',
      showKpis: true,
    };
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('mobiinv_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  const activeAccent = useMemo(() => {
    const accentColors = {
      blue: {
        text: 'text-blue-500 dark:text-blue-400',
        bg: 'bg-blue-500',
        hoverBg: 'hover:bg-blue-600',
        border: 'border-blue-500',
        lightBg: 'bg-blue-50 dark:bg-blue-950/30',
        badge: 'bg-blue-500/10 border-blue-400/20 text-blue-400',
      },
      orange: {
        text: 'text-orange-500 dark:text-orange-400',
        bg: 'bg-orange-500',
        hoverBg: 'hover:bg-orange-600',
        border: 'border-orange-500',
        lightBg: 'bg-orange-50 dark:bg-orange-950/30',
        badge: 'bg-orange-500/10 border-orange-400/20 text-orange-400',
      },
      emerald: {
        text: 'text-emerald-500 dark:text-emerald-400',
        bg: 'bg-emerald-500',
        hoverBg: 'hover:bg-emerald-600',
        border: 'border-emerald-500',
        lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
        badge: 'bg-emerald-500/10 border-emerald-400/20 text-emerald-400',
      },
      purple: {
        text: 'text-purple-500 dark:text-purple-400',
        bg: 'bg-purple-500',
        hoverBg: 'hover:bg-purple-600',
        border: 'border-purple-500',
        lightBg: 'bg-purple-50 dark:bg-purple-950/30',
        badge: 'bg-purple-500/10 border-purple-400/20 text-purple-400',
      },
    };
    return accentColors[userProfile.accentColor] || accentColors.blue;
  }, [userProfile.accentColor]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'crm' | 'inventory' | 'reports' | 'integrations' | 'providers' | 'contracts' | 'finance'>('dashboard');
  const [activeReport, setActiveReport] = useState<InventoryReport | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Dark/Light Theme state & synchronization
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('mobiinv_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mobiinv_theme', theme);
  }, [theme]);
  
  // Connectivity & Offline simulation state
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof window !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState<boolean>(false);
  const [prevOnline, setPrevOnline] = useState<boolean>(true);

  // Monitor real physical network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor transition from offline to online to perform automated synchronization
  useEffect(() => {
    if (isOnline && !prevOnline) {
      setIsSyncing(true);
      setShowSyncSuccess(false);

      // Log a sync log
      const syncLog: NotificationLog = {
        id: `log-${Date.now()}`,
        type: 'Push',
        recipient: 'Servidor Central',
        message: 'Detector de conexão reestabelecida. Todos os relatórios locais, laudos, fotos de vistoria e faturamentos salvos no LocalStorage foram sincronizados com sucesso.',
        status: 'Enviado',
        sentAt: new Date().toISOString()
      };
      setNotificationLogs(prev => [...prev, syncLog]);

      const timer = setTimeout(() => {
        setIsSyncing(false);
        setShowSyncSuccess(true);
        const hideTimer = setTimeout(() => {
          setShowSyncSuccess(false);
        }, 4000);
        return () => clearTimeout(hideTimer);
      }, 2500);

      return () => clearTimeout(timer);
    }
    setPrevOnline(isOnline);
  }, [isOnline, prevOnline]);

  // Signature Modal state
  const [signingReport, setSigningReport] = useState<InventoryReport | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('mobiinv_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('mobiinv_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('mobiinv_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('mobiinv_receipts', JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem('mobiinv_logs', JSON.stringify(notificationLogs));
  }, [notificationLogs]);

  useEffect(() => {
    localStorage.setItem('mobiinv_providers', JSON.stringify(providers));
  }, [providers]);

  useEffect(() => {
    localStorage.setItem('mobiinv_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('mobiinv_contracts', JSON.stringify(contracts));
  }, [contracts]);

  // Handlers for Service Providers (Prestadores / Motoristas)
  const handleAddProvider = (p: Omit<ServiceProvider, 'id' | 'createdAt'>) => {
    const newProv: ServiceProvider = {
      ...p,
      id: `prov-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setProviders(prev => [newProv, ...prev]);
  };

  const handleUpdateProvider = (id: string, updated: Partial<ServiceProvider>) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  const handleDeleteProvider = (id: string) => {
    setProviders(prev => prev.filter(p => p.id !== id));
  };

  // Handlers for Services Catalog
  const handleAddService = (s: Omit<CatalogService, 'id'>) => {
    const newSrv: CatalogService = {
      ...s,
      id: `srv-${Date.now()}`
    };
    setServices(prev => [...prev, newSrv]);
  };

  const handleUpdateService = (id: string, updated: Partial<CatalogService>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  };

  const handleDeleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  // Handlers for Contracts
  const handleAddContract = (c: Omit<Contract, 'id' | 'renewedCount' | 'notificationsSent' | 'createdAt'>) => {
    const newContract: Contract = {
      ...c,
      id: `cont-${Date.now()}`,
      renewedCount: 0,
      notificationsSent: { tenDays: false, fiveDays: false, twoDays: false },
      createdAt: new Date().toISOString()
    };
    setContracts(prev => [newContract, ...prev]);

    // Create a notification log
    const client = clients.find(cl => cl.id === c.clientId);
    const newLog: NotificationLog = {
      id: `log-${Date.now()}`,
      type: 'E-mail',
      recipient: client ? client.email : 'cliente@email.com',
      message: `Novo contrato registrado: "${c.title}". Valor: R$ ${c.value.toFixed(2)}. Início: ${c.startDate} | Vencimento: ${c.endDate}.`,
      status: 'Enviado',
      sentAt: new Date().toISOString()
    };
    setNotificationLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateContract = (id: string, updated: Partial<Contract>) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const handleDeleteContract = (id: string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
  };

  const handleRenewContract = (id: string, newEndDate: string, newValue?: number) => {
    const contractToRenew = contracts.find(c => c.id === id);
    if (!contractToRenew) return;

    setContracts(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: 'Ativo' as const,
          endDate: newEndDate,
          value: newValue !== undefined ? newValue : c.value,
          renewedCount: c.renewedCount + 1,
          notificationsSent: { tenDays: false, fiveDays: false, twoDays: false } // Reset warning flags on renewal
        };
      }
      return c;
    }));

    // Log the renewal event in notifications
    const client = clients.find(cl => cl.id === contractToRenew.clientId);
    const newLog: NotificationLog = {
      id: `log-${Date.now()}`,
      type: 'WhatsApp',
      recipient: client ? client.phone : '(11) 99999-9999',
      message: `Contrato de "${contractToRenew.title}" RENOVADO com sucesso até ${newEndDate}. Obrigado pela parceria!`,
      status: 'Enviado',
      sentAt: new Date().toISOString()
    };
    setNotificationLogs(prev => [newLog, ...prev]);
  };

  const handleTriggerContractNotification = (id: string, daysBefore: 10 | 5 | 2, type: 'WhatsApp' | 'E-mail' | 'Push', customMessage?: string) => {
    const contract = contracts.find(c => c.id === id);
    if (!contract) return;

    // Update contract state to track that this notification was sent
    setContracts(prev => prev.map(c => {
      if (c.id === id) {
        const currentSent = c.notificationsSent || {};
        let updatedSent = { ...currentSent };
        if (daysBefore === 10) updatedSent.tenDays = true;
        if (daysBefore === 5) updatedSent.fiveDays = true;
        if (daysBefore === 2) updatedSent.twoDays = true;
        return { ...c, notificationsSent: updatedSent };
      }
      return c;
    }));

    // Generate real notification log
    const client = clients.find(cl => cl.id === contract.clientId);
    const recipient = type === 'E-mail' 
      ? (client ? client.email : 'cliente@email.com') 
      : (client ? client.phone : '(11) 99999-9999');

    const message = customMessage || `Aviso Automático (${daysBefore} dias para vencimento): Olá ${contract.clientName}, lembramos que o seu contrato "${contract.title}" vencerá em breve no dia ${contract.endDate}. Por favor, entre em contato para alinhar os termos de renovação.`;

    const newLog: NotificationLog = {
      id: `log-${Date.now()}`,
      type,
      recipient,
      message,
      status: 'Enviado',
      sentAt: new Date().toISOString()
    };
    setNotificationLogs(prev => [newLog, ...prev]);
  };

  // Handler: CRM add client
  const handleAddClient = (newClientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...newClientData,
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setClients(prev => [newClient, ...prev]);
  };

  // Handler: CRM update client
  const handleUpdateClient = (id: string, updatedFields: Partial<Client>) => {
    setClients(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, ...updatedFields };
      }
      return c;
    }));
  };

  // Handler: CRM delete client
  const handleDeleteClient = (id: string) => {
    if (confirm('Tem certeza que deseja remover este cliente? Todos os laudos permanecerão vinculados pelo nome histórico.')) {
      setClients(prev => prev.filter(c => c.id !== id));
    }
  };

  // Handler: Add Financial Transaction
  const handleAddTransaction = (newTxData: Omit<FinancialTransaction, 'id'>) => {
    const newTx: FinancialTransaction = {
      ...newTxData,
      id: `TR-${Math.floor(100 + Math.random() * 900)}`,
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  // Handler: Update Transaction Status
  const handleUpdateTransactionStatus = (id: string, status: 'Pago' | 'Pendente' | 'Atrasado') => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  // Handler: Delete Transaction
  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Handler: Sync documents with transaction ledger
  const handleSyncWithDocuments = () => {
    let syncedCount = 0;
    const newTxList: FinancialTransaction[] = [];

    // 1. Sync from Receipts (as Pago)
    receipts.forEach(rec => {
      const exists = transactions.some(t => t.referenceId === rec.id) || newTxList.some(t => t.referenceId === rec.id);
      if (!exists) {
        newTxList.push({
          id: `TR-R${Math.floor(100 + Math.random() * 900)}`,
          type: 'Receita',
          category: 'Laudos/Vistorias',
          amount: rec.totalValue,
          date: rec.issueDate.split('T')[0],
          description: `Recibo Liquidado s/ Vistoria - Ref: ${rec.id}`,
          status: 'Pago',
          paymentMethod: (rec.paymentMethod as any) || 'Pix',
          referenceId: rec.id,
          referenceName: rec.clientName
        });
        syncedCount++;
      }
    });

    // 2. Sync from Invoices (as Pending or Pago)
    invoices.forEach(inv => {
      const exists = transactions.some(t => t.referenceId === inv.id) || newTxList.some(t => t.referenceId === inv.id);
      if (!exists) {
        newTxList.push({
          id: `TR-I${Math.floor(100 + Math.random() * 900)}`,
          type: 'Receita',
          category: 'Laudos/Vistorias',
          amount: inv.totalValue,
          date: inv.issueDate.split('T')[0],
          description: `Nota Fiscal Emitida s/ Vistoria - NF ${inv.id}`,
          status: inv.status === 'Quitada' ? 'Pago' : 'Pendente',
          paymentMethod: 'Boleto',
          referenceId: inv.id,
          referenceName: inv.clientName
        });
        syncedCount++;
      }
    });

    // 3. Sync from Contracts (as Pending/Pago based on billingStatus)
    contracts.forEach(cont => {
      const exists = transactions.some(t => t.referenceId === cont.id) || newTxList.some(t => t.referenceId === cont.id);
      if (!exists) {
        newTxList.push({
          id: `TR-C${Math.floor(100 + Math.random() * 900)}`,
          type: 'Receita',
          category: 'Contratos',
          amount: cont.value,
          date: cont.startDate,
          description: `Mensalidade Proporcional Contrato: ${cont.title}`,
          status: cont.billingStatus === 'Em dia' ? 'Pago' : cont.billingStatus === 'Pendente' ? 'Pendente' : 'Atrasado',
          paymentMethod: 'Pix',
          referenceId: cont.id,
          referenceName: cont.clientName
        });
        syncedCount++;
      }
    });

    if (newTxList.length > 0) {
      setTransactions(prev => [...newTxList, ...prev]);
    }

    // Push notification to logs
    const syncLog: NotificationLog = {
      id: `log-${Date.now()}`,
      type: 'Push',
      recipient: userProfile.userName,
      message: `Conciliação de Documentos finalizada: ${syncedCount} novos lançamentos financeiros identificados e importados para o Livro Razão.`,
      status: 'Enviado',
      sentAt: new Date().toISOString()
    };
    setNotificationLogs(prev => [syncLog, ...prev]);
  };


  // Handler: Select client from CRM to start inventory
  const handleSelectClientForInventory = (client: Client) => {
    // Open a prompt or auto-create a folder
    const defaultTitle = `Laudo de Vistoria - ${client.name} (${new Date().toLocaleDateString('pt-BR')})`;
    handleCreateReport(client.id, defaultTitle);
    setActiveTab('inventory');
  };

  // Handler: Create new inventory report folder
  const handleCreateReport = (clientId: string, title: string, scheduledAt?: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const newReport: InventoryReport = {
      id: `rep-${Date.now()}`,
      title,
      clientId: client.id,
      clientName: client.name,
      items: [],
      status: 'Rascunho',
      createdAt: new Date().toISOString(),
      scheduledAt: scheduledAt || undefined
    };

    setReports(prev => [newReport, ...prev]);
    setActiveReport(newReport);
  };

  // Handler: Update report scheduled date and time
  const handleUpdateReportSchedule = (reportId: string, scheduledAt: string) => {
    setReports(prev => prev.map(rep => {
      if (rep.id === reportId) {
        const updated = { ...rep, scheduledAt: scheduledAt || undefined };
        if (activeReport?.id === reportId) {
          setActiveReport(updated);
        }
        return updated;
      }
      return rep;
    }));
  };

  // Handler: Update active report item fields (including after photo annotation editing)
  const handleUpdateReportItem = (reportId: string, itemId: string, updatedFields: Partial<InventoryItem>) => {
    setReports(prev => prev.map(rep => {
      if (rep.id === reportId) {
        const updatedItems = rep.items.map(item => {
          if (item.id === itemId) {
            return { ...item, ...updatedFields };
          }
          return item;
        });
        const updated = { ...rep, items: updatedItems };
        if (activeReport?.id === reportId) {
          setActiveReport(updated);
        }
        return updated;
      }
      return rep;
    }));
  };

  // Handler: Add items into active report
  const handleAddItemToReport = (reportId: string, itemData: Omit<InventoryItem, 'id' | 'createdAt'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `item-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setReports(prev => prev.map(rep => {
      if (rep.id === reportId) {
        const updatedItems = [...rep.items, newItem];
        const updated = { ...rep, items: updatedItems };
        // Sync active report view
        if (activeReport?.id === reportId) {
          setActiveReport(updated);
        }
        return updated;
      }
      return rep;
    }));
  };

  // Handler: Delete item from report
  const handleDeleteItemFromReport = (reportId: string, itemId: string) => {
    setReports(prev => prev.map(rep => {
      if (rep.id === reportId) {
        const updatedItems = rep.items.filter(item => item.id !== itemId);
        const updated = { ...rep, items: updatedItems };
        if (activeReport?.id === reportId) {
          setActiveReport(updated);
        }
        return updated;
      }
      return rep;
    }));
  };

  // Handler: Save digital signature and close/finalize report
  const handleSaveSignature = (
    clientSig: { name: string; document: string; signatureDataUrl: string },
    providerSig: { name: string; document: string; signatureDataUrl: string }
  ) => {
    if (!signingReport) return;

    const updatedReports = reports.map(rep => {
      if (rep.id === signingReport.id) {
        return {
          ...rep,
          status: 'Finalizado' as const,
          finalizedAt: new Date().toISOString(),
          signature: {
            signedByName: clientSig.name,
            signedByDocument: clientSig.document,
            signatureDataUrl: clientSig.signatureDataUrl,
            signedAt: new Date().toISOString()
          },
          providerSignature: {
            signedByName: providerSig.name,
            signedByDocument: providerSig.document,
            signatureDataUrl: providerSig.signatureDataUrl,
            signedAt: new Date().toISOString()
          }
        };
      }
      return rep;
    });

    setReports(updatedReports);
    
    // Automatically pre-select this updated report in active view
    const updated = updatedReports.find(r => r.id === signingReport.id) || null;
    setActiveReport(updated);
    setSigningReport(null);

    // Trigger local feedback alert
    alert('Inventário assinado e finalizado digitalmente! Nota Fiscal e Recibo prontos para emissão em Relatórios.');
    setActiveTab('reports');
  };

  // Handler: Emit simulated invoice
  const handleEmitInvoice = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const totalVal = report.items.reduce((acc, item) => acc + (item.value || 0), 0);
    // Custom simulated billing value: base service is 8% of assets value or minimum R$ 350
    const calculatedBilling = Math.max(totalVal * 0.08, 350.00);

    const newInvoice: Invoice = {
      id: `NF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      reportId: report.id,
      clientId: report.clientId,
      clientName: report.clientName,
      itemsCount: report.items.length,
      totalValue: calculatedBilling,
      issueDate: new Date().toISOString(),
      status: 'Emitida',
      taxValue: calculatedBilling * 0.05 // 5% ISS
    };

    setInvoices(prev => [newInvoice, ...prev]);

    // Push Notification Log
    const newLog: NotificationLog = {
      id: `log-${Date.now()}`,
      type: 'E-mail',
      recipient: report.clientName,
      message: `A Nota Fiscal Eletrônica Nº ${newInvoice.id} de R$ ${newInvoice.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi gerada e enviada para faturamento de sua vistoria patrimonial.`,
      status: 'Enviado',
      sentAt: new Date().toISOString()
    };
    setNotificationLogs(prev => [...prev, newLog]);
  };

  // Handler: Emit simulated receipt
  const handleEmitReceipt = (reportId: string, paymentMethod: 'Pix' | 'Boleto' | 'Cartão' | 'Dinheiro', notes?: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const totalVal = report.items.reduce((acc, item) => acc + (item.value || 0), 0);
    const calculatedBilling = Math.max(totalVal * 0.08, 350.00);

    const newReceipt: Receipt = {
      id: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
      reportId: report.id,
      clientId: report.clientId,
      clientName: report.clientName,
      totalValue: calculatedBilling,
      paymentMethod,
      issueDate: new Date().toISOString(),
      notes
    };

    setReceipts(prev => [newReceipt, ...prev]);

    // Push Notification Log
    const newLog: NotificationLog = {
      id: `log-${Date.now()}`,
      type: 'WhatsApp',
      recipient: report.clientName,
      message: `Olá! Confirmamos o recebimento via ${paymentMethod}. Seu recibo Nº ${newReceipt.id} de R$ ${newReceipt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} já está emitido.`,
      status: 'Enviado',
      sentAt: new Date().toISOString()
    };
    setNotificationLogs(prev => [...prev, newLog]);
  };

  // Handler: Generic notification log dispatch
  const handleTriggerNotification = (logData: Omit<NotificationLog, 'id' | 'sentAt'>) => {
    const newLog: NotificationLog = {
      ...logData,
      id: `log-${Date.now()}`,
      sentAt: new Date().toISOString()
    };
    setNotificationLogs(prev => [...prev, newLog]);
  };

  // Handler: Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Por favor, preencha todos os campos.');
      return;
    }
    if (loginPassword.length < 6) {
      setLoginError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    localStorage.setItem('mobiinv_logged_in', 'true');
    setIsLoggedIn(true);
    setLoginError('');
  };

  // Handler: Logout
  const handleLogout = () => {
    localStorage.removeItem('mobiinv_logged_in');
    setIsLoggedIn(false);
  };

  // Calculations for KPI Metrics
  const totalAssetsCount = reports.reduce((acc, r) => acc + r.items.length, 0);
  const totalAssetValue = reports.reduce((acc, r) => {
    return acc + r.items.reduce((sub, item) => sub + (item.value || 0), 0);
  }, 0);
  const pendingSignaturesCount = reports.filter(r => r.status === 'Rascunho').length;

  // Process monthly data for value evolution chart
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyValues: { [key: string]: number } = {};
    
    months.forEach(m => {
      monthlyValues[m] = 0;
    });

    reports.forEach(rep => {
      if (!rep.createdAt) return;
      const date = new Date(rep.createdAt);
      if (isNaN(date.getTime())) return;
      
      const monthIndex = date.getMonth();
      const monthName = months[monthIndex];
      
      const reportValue = rep.items.reduce((sum, item) => sum + (item.value || 0), 0);
      monthlyValues[monthName] += reportValue;
    });

    const currentMonthIndex = new Date().getMonth();
    // Return months array sliced up to currentMonthIndex + 1 (or at least 7 months for a nice plot)
    return months.map((month) => ({
      name: month,
      'Valor Total (R$)': monthlyValues[month],
    })).slice(0, Math.max(currentMonthIndex + 2, 7));
  }, [reports]);

  // Process data for finalized vs pending charts
  const statusData = useMemo(() => {
    const finalized = reports.filter(r => r.status === 'Finalizado').length;
    const pending = reports.filter(r => r.status === 'Rascunho').length;
    return [
      { name: 'Finalizados', value: finalized, color: '#2563eb' },
      { name: 'Pendentes', value: pending, color: '#f59e0b' },
    ];
  }, [reports]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-900 border-0 sm:border-8 border-slate-200" id="login-wrapper">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-sm shadow-xl p-8 space-y-6" id="login-card">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-sm bg-blue-50 border border-blue-100 flex items-center justify-center" id="login-logo-icon">
              <ShieldCheck className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              Mobi<span className="text-blue-500">Inv</span> <span className="text-amber-500">Pro</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Gestão de Ativos &amp; CRM de Vistorias
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-form">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-sm font-semibold" id="login-error-message">
                {loginError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mail de Acesso</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-medium">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="exemplo@mobiinv.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  id="login-email-input"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Senha Secreta</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-medium">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  id="login-password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
              id="login-submit-btn"
            >
              Entrar no Sistema <LogIn className="w-4 h-4" />
            </button>
          </form>

          {/* Dica / Info */}
          <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-sm text-[11px] text-slate-500 leading-relaxed space-y-1" id="login-tip-box">
            <p className="font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5 text-[9px]">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Acesso de Demonstração
            </p>
            <p>
              O sistema está pronto para uso. Utilize as credenciais pré-configuradas acima ou insira qualquer outra combinação com pelo menos 6 caracteres na senha.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 border-0 sm:border-8 border-slate-200" id="app-wrapper">
      {/* CONNECTIVITY ALERT BANNERS */}
      {!isOnline && (
        <div className="bg-amber-500 text-white px-4 sm:px-8 py-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider shadow-md sticky top-0 z-50 border-b border-amber-600 print:hidden animate-in slide-in-from-top duration-300" id="offline-alert-bar">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <WifiOff className="w-4 h-4 animate-bounce" />
            <span>Modo Offline Ativo — Trabalhando de forma local</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-[9px] text-amber-100 bg-amber-600/50 px-2 py-0.5 rounded-sm font-semibold">
              Seus dados estão 100% protegidos e salvos no cache (LocalStorage)!
            </span>
            <button 
              onClick={() => setIsOnline(true)}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-amber-700 rounded-sm text-[10px] font-black uppercase tracking-wider transition shadow-sm cursor-pointer"
              id="offline-simulate-online-btn"
            >
              Simular Conexão
            </button>
          </div>
        </div>
      )}

      {isSyncing && (
        <div className="bg-blue-600 text-white px-4 sm:px-8 py-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider shadow-md sticky top-0 z-50 border-b border-blue-700 print:hidden animate-in slide-in-from-top duration-300" id="sync-alert-bar">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Sincronizando dados locais com o servidor central...</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-24 bg-blue-800 rounded-full h-1.5 overflow-hidden hidden sm:block">
              <div className="bg-white h-1.5 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
            <span className="text-[10px] text-blue-100">Enviando atualizações</span>
          </div>
        </div>
      )}

      {showSyncSuccess && (
        <div className="bg-emerald-600 text-white px-4 sm:px-8 py-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider shadow-md sticky top-0 z-50 border-b border-emerald-700 print:hidden animate-in slide-in-from-top duration-300" id="sync-success-bar">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-4 h-4 animate-pulse" />
            <span>✓ Todos os dados locais foram sincronizados com sucesso com o servidor central!</span>
          </div>
          <button 
            onClick={() => setShowSyncSuccess(false)}
            className="text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP CONTROL HEADER SECTION */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-[var(--connectivity-banner-height,0px)] z-40 print:hidden" id="main-header">
        <div className="flex items-center gap-2 sm:gap-6">
          {/* Burger menu button on mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-sm hover:bg-slate-100 transition cursor-pointer"
            id="mobile-menu-toggle-btn"
            aria-label="Alternar Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="md:hidden flex items-center gap-2 shrink-0">
            {userProfile.companyLogo ? (
              <img src={userProfile.companyLogo} alt="Logo" className="h-6 w-auto max-w-[60px] object-contain" referrerPolicy="no-referrer" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-blue-500" />
            )}
            <h1 className="text-xs font-black tracking-tight uppercase text-slate-900 truncate max-w-[110px]">
              {userProfile.companyName}
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-3 sm:gap-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sessão: #INV-2026-902</span>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full inline-block ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span> Status: {isOnline ? 'Ativo' : 'Offline'}
            </span>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            
            {/* Connectivity Simulation Button */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-2 py-0.5 border rounded-sm text-[9px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer ${
                isOnline 
                  ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700' 
                  : 'bg-amber-100 border-amber-200 text-amber-700 hover:bg-amber-200'
              }`}
              title="Simular conexão offline/online"
              id="simulate-connectivity-btn"
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-500" /> Desconectar
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-500" /> Conectar
                </>
              )}
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 sm:gap-2 items-center">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-2xs"
            title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
            id="theme-toggle-btn"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
            )}
          </button>
          
          <button 
            onClick={() => alert('Rascunho salvo no navegador!')} 
            className="px-2.5 sm:px-4 py-2 border border-slate-200 rounded-lg text-[10px] sm:text-xs font-bold hover:bg-slate-50 uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
          >
            <span className="sm:hidden">Salvar</span>
            <span className="hidden sm:inline">Salvar Rascunho</span>
          </button>
          <button 
            onClick={() => {
              setActiveTab('reports');
              setIsMobileMenuOpen(false);
            }} 
            className="px-2.5 sm:px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:bg-slate-850 transition-colors cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <span className="sm:hidden">Laudos</span>
            <span className="hidden sm:inline">Ver Relatórios</span>
          </button>
        </div>
      </header>

      {/* CORE APPLICATION CONTAINER */}
      <div className="flex-1 flex flex-col md:flex-row relative" id="core-split-container">
        {/* SIDEBAR NAVIGATION */}
        <aside className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex w-full md:w-64 bg-slate-900 text-slate-300 shrink-0 flex-col print:hidden border-r border-slate-800 absolute md:relative left-0 top-0 z-30 h-[calc(100vh-4rem)] md:h-auto`} id="sidebar-navigation">
          <div className="p-6 border-b border-slate-800 hidden md:flex items-center gap-3">
            {userProfile.companyLogo ? (
              <img src={userProfile.companyLogo} alt="Logo" className="h-8 max-w-[80px] object-contain rounded-sm" referrerPolicy="no-referrer" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-tight uppercase text-white truncate max-w-[140px]">{userProfile.companyName}</h1>
              <p className="text-[8px] opacity-50 uppercase tracking-[1px] mt-0.5">Gestão de Ativos & CRM</p>
            </div>
          </div>
          
          <nav className="flex-1 py-6 flex flex-col gap-1.5 bg-slate-900">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setIsMobileMenuOpen(false);
              }}
              className={`px-6 py-3.5 flex items-center gap-4.5 cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 text-left border-l-4 ${
                activeTab === 'dashboard'
                  ? 'border-blue-400 bg-slate-800 text-white shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
              id="nav-dashboard-btn"
            >
              <LayoutDashboard className={`w-4 h-4 transition-colors ${activeTab === 'dashboard' ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              Painel Geral
            </button>

            <button
              onClick={() => {
                setActiveTab('crm');
                setIsMobileMenuOpen(false);
              }}
              className={`px-6 py-3.5 flex items-center gap-4.5 cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 text-left border-l-4 ${
                activeTab === 'crm'
                  ? 'border-blue-400 bg-slate-800 text-white shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
              id="nav-crm-btn"
            >
              <Users className={`w-4 h-4 transition-colors ${activeTab === 'crm' ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              Clientes &amp; CRM
            </button>

            <button
              onClick={() => {
                setActiveTab('inventory');
                setIsMobileMenuOpen(false);
              }}
              className={`px-6 py-3.5 flex items-center gap-4.5 cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 text-left border-l-4 ${
                activeTab === 'inventory'
                  ? 'border-blue-400 bg-slate-800 text-white shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
              id="nav-inventory-btn"
            >
              <Package className={`w-4 h-4 transition-colors ${activeTab === 'inventory' ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              Inventário
            </button>

            <button
              onClick={() => {
                setActiveTab('reports');
                setIsMobileMenuOpen(false);
              }}
              className={`px-6 py-3.5 flex items-center gap-4.5 cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 text-left border-l-4 ${
                activeTab === 'reports'
                  ? 'border-blue-400 bg-slate-800 text-white shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
              id="nav-reports-btn"
            >
              <FileCheck className={`w-4 h-4 transition-colors ${activeTab === 'reports' ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              Laudos &amp; Faturas
            </button>

            <button
              onClick={() => {
                setActiveTab('integrations');
                setIsMobileMenuOpen(false);
              }}
              className={`px-6 py-3.5 flex items-center gap-4.5 cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 text-left border-l-4 ${
                activeTab === 'integrations'
                  ? 'border-blue-400 bg-slate-800 text-white shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
              id="nav-integrations-btn"
            >
              <Bell className={`w-4 h-4 transition-colors ${activeTab === 'integrations' ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              Notificações
            </button>

            <button
              onClick={() => {
                setActiveTab('providers');
                setIsMobileMenuOpen(false);
              }}
              className={`px-6 py-3.5 flex items-center gap-4.5 cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 text-left border-l-4 ${
                activeTab === 'providers'
                  ? 'border-blue-400 bg-slate-800 text-white shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
              id="nav-providers-btn"
            >
              <Truck className={`w-4 h-4 transition-colors ${activeTab === 'providers' ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              Prestadores &amp; Serviços
            </button>

            <button
              onClick={() => {
                setActiveTab('contracts');
                setIsMobileMenuOpen(false);
              }}
              className={`px-6 py-3.5 flex items-center gap-4.5 cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 text-left border-l-4 ${
                activeTab === 'contracts'
                  ? 'border-blue-400 bg-slate-800 text-white shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
              id="nav-contracts-btn"
            >
              <DollarSign className={`w-4 h-4 transition-colors ${activeTab === 'contracts' ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              Contratos &amp; Cobrança
            </button>

            <button
              onClick={() => {
                setActiveTab('finance');
                setIsMobileMenuOpen(false);
              }}
              className={`px-6 py-3.5 flex items-center gap-4.5 cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 text-left border-l-4 ${
                activeTab === 'finance'
                  ? 'border-emerald-400 bg-slate-800 text-white shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
              id="nav-finance-btn"
            >
              <DollarSign className={`w-4 h-4 transition-colors ${activeTab === 'finance' ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              Financeiro Geral
              <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 uppercase rounded-sm shrink-0">Novo</span>
            </button>
          </nav>

          {/* User widget at the bottom */}
          <div className="p-6 bg-slate-950/50 mt-auto border-t border-slate-800 flex flex-col gap-3">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="group flex items-center gap-3 text-left cursor-pointer hover:bg-slate-800/40 p-2 -mx-2 rounded-lg transition-all text-slate-300 hover:text-white"
              id="sidebar-profile-setting-btn"
              title="Configurar Perfil e Logo da Empresa"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-500 to-amber-500 border border-slate-700 flex items-center justify-center font-black text-white shrink-0 group-hover:scale-105 transition-transform">
                {userProfile.userName ? userProfile.userName.substring(0, 2).toUpperCase() : 'JG'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold uppercase truncate group-hover:text-blue-400 transition-colors">
                    {userProfile.userName}
                  </p>
                  <Sparkles className="w-3 h-3 text-amber-400 group-hover:animate-pulse shrink-0" />
                </div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest truncate">{userProfile.userRole}</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
              id="sidebar-logout-btn"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair da Conta
            </button>
          </div>
        </aside>

        {/* WORKSPACE AREA */}
        <div className="flex-1 bg-slate-50 overflow-y-auto" id="workspace-scroll-container">
          <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6" id="workspace-main">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.995 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="w-full space-y-6"
              >
                {/* TAB 1: DASHBOARD */}
                {activeTab === 'dashboard' && (
            <div className="space-y-6" id="dashboard-tab">
              {/* Welcome banner */}
              <div className={`bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-l-4 ${activeAccent.border} p-6 sm:p-8 text-white relative overflow-hidden shadow-lg rounded-xl`}>
                <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute left-1/3 bottom-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
                <div className="relative z-10 space-y-2 max-w-2xl">
                  <span className="px-2.5 py-0.5 bg-blue-500/15 border border-blue-400/30 text-blue-300 text-[10px] font-bold tracking-widest uppercase rounded-full inline-flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" /> Sistema Inteligente Ativo
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black font-sans uppercase tracking-tight">Bem-vindo ao MobiInv, {userProfile.userName}!</h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                    Faça o controle fotográfico de móveis, eletrônicos e maquinários. Cadastre clientes, emita Notas Fiscais, recibos e colete assinaturas de ciência instantaneamente.
                  </p>
                </div>
              </div>

              {/* METRIC CARDS / KPIS */}
              {userProfile.showKpis && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="kpi-metrics-grid">
                  <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between group">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Clientes CRM</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block tracking-tight">{clients.length}</span>
                    </div>
                    <div className="p-3 bg-gradient-to-tr from-blue-50 to-blue-100/60 text-blue-600 border border-blue-100 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-2xs">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between group">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ativos Registrados</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block tracking-tight">{totalAssetsCount}</span>
                    </div>
                    <div className="p-3 bg-gradient-to-tr from-blue-50 to-blue-100/60 text-blue-600 border border-blue-100 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-2xs">
                      <Package className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between group">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Laudos Pendentes</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block tracking-tight">{pendingSignaturesCount}</span>
                    </div>
                    <div className="p-3 bg-gradient-to-tr from-amber-50 to-amber-100/60 text-amber-600 border border-amber-100 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-2xs">
                      <FileCheck className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between group">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Valor Patrimonial</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block tracking-tight">R$ {totalAssetValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="p-3 bg-gradient-to-tr from-emerald-50 to-emerald-100/60 text-emerald-600 border border-emerald-100 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-2xs">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              )}

              {/* CHARTS / VISUALIZATIONS SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-section">
                {/* Monthly Value Evolution Chart */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-300 space-y-4 flex flex-col justify-between" id="chart-value-evolution-card">
                  <div>
                    <h3 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                      <TrendingUp className="w-4 h-4 text-blue-500" /> Evolução Mensal do Valor Total dos Bens (R$)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wide font-semibold">
                      Valor acumulado de bens cadastrados em vistorias mês a mês
                    </p>
                  </div>
                  
                  <div className="h-64 w-full mt-4" id="value-evolution-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={monthlyData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `R$ ${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                        />
                        <Tooltip 
                          contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor Total']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="Valor Total (R$)" 
                          stroke="#0ea5e9" 
                          strokeWidth={2.5}
                          fillOpacity={1} 
                          fill="url(#colorValor)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Finalized vs Pending Reports Chart */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-300 space-y-4 flex flex-col justify-between" id="chart-reports-status-card">
                  <div>
                    <h3 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                      <FileCheck className="w-4 h-4 text-blue-500" /> Status dos Laudos &amp; Vistorias
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wide font-semibold">
                      Proporção de laudos finalizados versus em rascunho (pendentes)
                    </p>
                  </div>

                  <div className="h-44 w-full relative flex items-center justify-center mt-2" id="reports-status-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          formatter={(value) => [`${value} laudo(s)`, 'Quantidade']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Inner counter */}
                    <div className="absolute text-center">
                      <span className="block text-2xl font-black text-slate-900 leading-none">
                        {reports.length}
                      </span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">
                        Laudos
                      </span>
                    </div>
                  </div>

                  {/* Status Legends */}
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                    {statusData.map((status, idx) => {
                      const totalReports = reports.length;
                      const percentage = totalReports > 0 ? Math.round((status.value / totalReports) * 100) : 0;
                      return (
                        <div key={status.name} className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-center shadow-2xs hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-1.5 justify-center mb-0.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }}></span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider truncate">{status.name}</span>
                          </div>
                          <span className="text-sm font-black text-slate-800 block">{status.value} <span className="text-[10px] text-slate-400 font-normal">({percentage}%)</span></span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* INTERACTIVE WIZARD CARD & RECENT LISTS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Wizard Shortcut */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs hover:shadow-md transition-all duration-300 space-y-4">
                  <h3 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                    <TrendingUp className="w-4 h-4 text-blue-500" /> Fluxo de Trabalho Recomendado
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4.5 bg-slate-50 border border-slate-150/60 rounded-xl space-y-2.5 flex flex-col justify-between hover:bg-slate-100/50 hover:border-slate-300 transition-all duration-300 shadow-2xs">
                      <div>
                        <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black text-xs mb-2 shadow-2xs">1</div>
                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Cadastre o Cliente</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Adicione os dados fiscais e de contato do tomador do laudo.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('crm')}
                        className="text-[10px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-3 uppercase tracking-wider text-left cursor-pointer transition-colors"
                      >
                        Ir para CRM &rarr;
                      </button>
                    </div>

                    <div className="p-4.5 bg-slate-50 border border-slate-150/60 rounded-xl space-y-2.5 flex flex-col justify-between hover:bg-slate-100/50 hover:border-slate-300 transition-all duration-300 shadow-2xs">
                      <div>
                        <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black text-xs mb-2 shadow-2xs">2</div>
                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Registre as Fotos</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Abra o inventário e faça upload das fotos de bens e número de série.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('inventory')}
                        className="text-[10px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-3 uppercase tracking-wider text-left cursor-pointer transition-colors"
                      >
                        Vistoriar móveis &rarr;
                      </button>
                    </div>

                    <div className="p-4.5 bg-slate-50 border border-slate-150/60 rounded-xl space-y-2.5 flex flex-col justify-between hover:bg-slate-100/50 hover:border-slate-300 transition-all duration-300 shadow-2xs">
                      <div>
                        <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black text-xs mb-2 shadow-2xs">3</div>
                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Assine e Fature</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Colete assinatura digital, emita nota fiscal e mande para o WhatsApp.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('reports')}
                        className="text-[10px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-3 uppercase tracking-wider text-left cursor-pointer transition-colors"
                      >
                        Faturar e Assinar &rarr;
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Info status card */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Atalho Rápido</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Inicie imediatamente uma simulação de inventário para o cliente mais recente da base.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 mt-4">
                    <button
                      onClick={() => {
                        if (clients.length > 0) {
                          handleSelectClientForInventory(clients[0]);
                        } else {
                          setActiveTab('crm');
                        }
                      }}
                      className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-850 text-white font-black text-xs rounded-lg flex items-center justify-center gap-2 uppercase tracking-widest transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-xs"
                      id="dashboard-start-fast-btn"
                    >
                      <Plus className="w-4 h-4" /> Criar Laudo Fotográfico
                    </button>
                  </div>
                </div>
              </div>

              {/* SCHEDULED TASKS SECTION */}
              <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm space-y-4" id="dashboard-scheduled-tasks-card">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-sans font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" /> Agenda de Vistorias &amp; Tarefas Futuras
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-sm">
                    {reports.filter(r => r.scheduledAt && r.status === 'Rascunho').length} Pendentes
                  </span>
                </div>

                {reports.filter(r => r.scheduledAt && r.status === 'Rascunho').length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    Nenhuma vistoria agendada no momento. Crie ou agende um inventário para começar.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reports
                      .filter(r => r.scheduledAt && r.status === 'Rascunho')
                      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
                      .map(task => {
                        const taskDate = new Date(task.scheduledAt!);
                        const isOverdue = taskDate.getTime() < Date.now();
                        return (
                          <div 
                            key={task.id} 
                            className={`p-4 rounded-sm border transition flex flex-col justify-between h-44 ${
                              isOverdue 
                                ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300' 
                                : 'bg-slate-50 border-slate-150 hover:border-slate-200'
                            }`}
                            id={`dashboard-task-${task.id}`}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide shrink-0 ${
                                  isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {isOverdue ? 'Atrasado' : 'Agendado'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 uppercase truncate">
                                  {task.id}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-tight mt-2 line-clamp-2">
                                {task.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                                Cliente: {task.clientName}
                              </p>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-200/60 flex justify-between items-center">
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[11px] font-bold font-mono">
                                  {taskDate.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setActiveReport(task);
                                  setActiveTab('inventory');
                                }}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
                              >
                                Vistoriar <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CRM */}
          {activeTab === 'crm' && (
            <CrmSection
              clients={clients}
              onAddClient={handleAddClient}
              onDeleteClient={handleDeleteClient}
              onUpdateClient={handleUpdateClient}
              onSelectClient={handleSelectClientForInventory}
            />
          )}

          {/* TAB 3: INVENTORY */}
          {activeTab === 'inventory' && (
            <InventorySection
              clients={clients}
              reports={reports}
              activeReport={activeReport}
              onSelectReport={setActiveReport}
              onCreateReport={handleCreateReport}
              onAddItemToReport={handleAddItemToReport}
              onDeleteItemFromReport={handleDeleteItemFromReport}
              onFinalizeReportClick={(rep) => setSigningReport(rep)}
              onUpdateReportSchedule={handleUpdateReportSchedule}
              onUpdateReportItem={handleUpdateReportItem}
            />
          )}

          {/* TAB 4: REPORTS */}
          {activeTab === 'reports' && (
            <ReportsSection
              reports={reports}
              invoices={invoices}
              receipts={receipts}
              clients={clients}
              onEmitInvoice={handleEmitInvoice}
              onEmitReceipt={handleEmitReceipt}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {/* TAB 5: INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <IntegrationsSection
              finalizedReports={reports.filter(r => r.status === 'Finalizado')}
              notificationLogs={notificationLogs}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {/* TAB 6: PROVIDERS & SERVICES */}
          {activeTab === 'providers' && (
            <ProvidersSection
              providers={providers}
              onAddProvider={handleAddProvider}
              onUpdateProvider={handleUpdateProvider}
              onDeleteProvider={handleDeleteProvider}
              services={services}
              onAddService={handleAddService}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
            />
          )}

          {/* TAB 7: CONTRACTS & BILLING */}
          {activeTab === 'contracts' && (
            <ContractsSection
              contracts={contracts}
              clients={clients}
              onAddContract={handleAddContract}
              onUpdateContract={handleUpdateContract}
              onDeleteContract={handleDeleteContract}
              onRenewContract={handleRenewContract}
              onTriggerContractNotification={handleTriggerContractNotification}
            />
          )}

          {/* TAB 8: FINANCIAL MODULE */}
          {activeTab === 'finance' && (
            <FinanceSection
              transactions={transactions}
              clients={clients}
              invoices={invoices}
              receipts={receipts}
              contracts={contracts}
              onAddTransaction={handleAddTransaction}
              onUpdateTransactionStatus={handleUpdateTransactionStatus}
              onDeleteTransaction={handleDeleteTransaction}
              onSyncWithDocuments={handleSyncWithDocuments}
              accentColorClass={activeAccent.text}
            />
          )}
              </motion.div>
            </AnimatePresence>
          </main>
      </div>
    </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-400 print:hidden" id="main-footer">
        MobiInv &copy; 2026 &bull; Controle Patrimonial Seguro com Assinatura Digital de Ciência e CRM Integrado.
      </footer>

      {/* OVERLAY SIGNATURE MODAL */}
      {signingReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 print:hidden" id="signature-modal-overlay">
          <SignatureCanvas
            onSave={handleSaveSignature}
            onCancel={() => setSigningReport(null)}
            initialClientName={signingReport.clientName}
            initialClientDocument={clients.find(c => c.id === signingReport.clientId)?.document || ''}
            providersList={providers}
          />
        </div>
      )}

      {/* USER PROFILE & LOGO MODAL */}
      {isProfileModalOpen && (
        <UserProfileModal
          onClose={() => setIsProfileModalOpen(false)}
          initialData={userProfile}
          onSave={(data) => {
            setUserProfile(data);
            setIsProfileModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
