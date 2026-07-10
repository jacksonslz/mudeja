import React, { useState } from 'react';
import { Client } from '../types';
import { 
  Search, 
  Plus, 
  UserPlus, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  CheckCircle, 
  Trash2, 
  AlertCircle, 
  X, 
  Edit, 
  Tag, 
  History, 
  TrendingUp, 
  Activity, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Award
} from 'lucide-react';
import { formatCpfOrCnpj, validateCpfOrCnpj } from '../utils/validation';

interface CrmSectionProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onDeleteClient: (id: string) => void;
  onUpdateClient?: (id: string, updatedFields: Partial<Client>) => void;
  onSelectClient?: (client: Client) => void;
}

export default function CrmSection({ 
  clients, 
  onAddClient, 
  onDeleteClient, 
  onUpdateClient, 
  onSelectClient 
}: CrmSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Pipeline filter state ('all' or 'Lead' | 'Prospect' | 'Ativo' | 'Inativo')
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');
  
  // Expanded client state for timeline & notes logging
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // New Client Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [document, setDocument] = useState('');
  const [address, setAddress] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [status, setStatus] = useState<Client['status']>('Lead');
  const [segment, setSegment] = useState<Client['segment']>('Comercial');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Editing Client Form states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDocument, setEditDocument] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editStatus, setEditStatus] = useState<Client['status']>('Lead');
  const [editSegment, setEditSegment] = useState<Client['segment']>('Comercial');
  const [editNotes, setEditNotes] = useState('');
  const [editFormError, setEditFormError] = useState('');

  // New Interaction Form states (per client expanded card)
  const [interactionType, setInteractionType] = useState<'Contato' | 'Reunião' | 'Vistoria' | 'Proposta' | 'Fechamento'>('Contato');
  const [interactionDesc, setInteractionDesc] = useState('');

  // Calculate Pipeline statistics
  const pipelineStats = React.useMemo(() => {
    const stats = { Lead: 0, Prospect: 0, Ativo: 0, Inativo: 0 };
    clients.forEach(c => {
      const s = c.status || 'Lead';
      if (stats[s] !== undefined) stats[s]++;
    });
    return stats;
  }, [clients]);

  // Filtering Logic
  const filteredClients = clients.filter(c => {
    // Pipeline Category Filter
    if (pipelineFilter !== 'all') {
      const clientStatus = c.status || 'Lead';
      if (clientStatus !== pipelineFilter) return false;
    }

    const cleanSearch = searchTerm.toLowerCase().trim();
    if (!cleanSearch) return true;
    
    // Name or company name search
    if (c.name.toLowerCase().includes(cleanSearch)) return true;
    if (c.companyName && c.companyName.toLowerCase().includes(cleanSearch)) return true;
    
    // Email or phone search
    if (c.email.toLowerCase().includes(cleanSearch)) return true;
    if (c.phone.includes(cleanSearch)) return true;
    
    // Segment or status search
    if (c.status && c.status.toLowerCase().includes(cleanSearch)) return true;
    if (c.segment && c.segment.toLowerCase().includes(cleanSearch)) return true;
    
    // Document match
    const searchDigits = cleanSearch.replace(/\D/g, '');
    const docDigits = c.document.replace(/\D/g, '');
    if (c.document.includes(cleanSearch)) return true;
    if (searchDigits && docDigits.includes(searchDigits)) return true;
    
    return false;
  });

  const { isValid: isDocValid, type: docType } = validateCpfOrCnpj(document);
  const showDocWarning = document.replace(/\D/g, '').length > 0 && !isDocValid;

  const { isValid: isEditDocValid, type: editDocType } = validateCpfOrCnpj(editDocument);
  const showEditDocWarning = editDocument.replace(/\D/g, '').length > 0 && !isEditDocValid;

  // Handle Create Client
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !document || !address) {
      setFormError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    const { isValid } = validateCpfOrCnpj(document);
    if (!isValid) {
      setFormError('O documento CPF ou CNPJ informado é inválido. Por favor, verifique os dígitos.');
      return;
    }

    onAddClient({
      name,
      email,
      phone,
      document,
      address,
      companyName: companyName || undefined,
      status: status || 'Lead',
      segment: segment || 'Comercial',
      notes: notes || undefined,
      interactions: [
        {
          id: `int-${Date.now()}`,
          type: 'Contato',
          description: 'Registro inicial e cadastro do cliente no sistema de CRM.',
          date: new Date().toISOString()
        }
      ]
    });

    // Reset Form
    setName('');
    setEmail('');
    setPhone('');
    setDocument('');
    setAddress('');
    setCompanyName('');
    setStatus('Lead');
    setSegment('Comercial');
    setNotes('');
    setFormError('');
    setIsAdding(false);
  };

  // Setup client for editing
  const handleStartEdit = (client: Client) => {
    setEditingClient(client);
    setEditName(client.name);
    setEditEmail(client.email);
    setEditPhone(client.phone);
    setEditDocument(client.document);
    setEditAddress(client.address);
    setEditCompanyName(client.companyName || '');
    setEditStatus(client.status || 'Lead');
    setEditSegment(client.segment || 'Comercial');
    setEditNotes(client.notes || '');
    setEditFormError('');
  };

  // Handle Save Edited Client
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !onUpdateClient) return;

    if (!editName || !editEmail || !editPhone || !editDocument || !editAddress) {
      setEditFormError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    const { isValid } = validateCpfOrCnpj(editDocument);
    if (!isValid) {
      setEditFormError('O documento CPF ou CNPJ informado é inválido. Por favor, verifique os dígitos.');
      return;
    }

    onUpdateClient(editingClient.id, {
      name: editName,
      email: editEmail,
      phone: editPhone,
      document: editDocument,
      address: editAddress,
      companyName: editCompanyName || undefined,
      status: editStatus,
      segment: editSegment,
      notes: editNotes || undefined
    });

    setEditingClient(null);
  };

  // Handle Add Interaction Event
  const handleAddInteraction = (clientId: string) => {
    if (!interactionDesc.trim() || !onUpdateClient) return;

    const targetClient = clients.find(c => c.id === clientId);
    if (!targetClient) return;

    const newInteraction = {
      id: `int-${Date.now()}`,
      type: interactionType,
      description: interactionDesc,
      date: new Date().toISOString()
    };

    const currentInteractions = targetClient.interactions || [];
    onUpdateClient(clientId, {
      interactions: [...currentInteractions, newInteraction]
    });

    // Clear description fields
    setInteractionDesc('');
  };

  // Save quick notes updates
  const handleUpdateNotes = (clientId: string, updatedNotes: string) => {
    if (onUpdateClient) {
      onUpdateClient(clientId, { notes: updatedNotes });
    }
  };

  return (
    <div className="space-y-6" id="crm-section-root">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">CRM &amp; Funil de Relacionamento</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Controle a carteira de contatos, gerencie as etapas de negociação e acesse o histórico operacional</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingClient(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
            isAdding 
              ? 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
          }`}
          id="toggle-add-client-btn"
        >
          {isAdding ? 'Voltar para Lista' : <><UserPlus className="w-4 h-4" /> Novo Cliente</>}
        </button>
      </div>

      {/* PIPELINE STAGES OVERVIEW */}
      {!isAdding && !editingClient && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="crm-pipeline-overview">
          {/* Stage: Lead */}
          <div 
            onClick={() => setPipelineFilter(pipelineFilter === 'Lead' ? 'all' : 'Lead')}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
              pipelineFilter === 'Lead'
                ? 'bg-amber-50/50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800 ring-2 ring-amber-400'
                : 'bg-white border-slate-200/80 hover:border-amber-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Etapa 1: Leads</span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">{pipelineStats.Lead}</span>
            </div>
            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-2">Captação</h4>
            <div className="w-full bg-slate-100 dark:bg-slate-850 h-1 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${clients.length > 0 ? (pipelineStats.Lead / clients.length) * 100 : 0}%` }}></div>
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 block uppercase tracking-wider font-semibold">Clique para filtrar</span>
          </div>

          {/* Stage: Prospect */}
          <div 
            onClick={() => setPipelineFilter(pipelineFilter === 'Prospect' ? 'all' : 'Prospect')}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
              pipelineFilter === 'Prospect'
                ? 'bg-blue-50/50 border-blue-300 dark:bg-blue-950/20 dark:border-blue-800 ring-2 ring-blue-400'
                : 'bg-white border-slate-200/80 hover:border-blue-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Etapa 2: Prospects</span>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">{pipelineStats.Prospect}</span>
            </div>
            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-2">Negociação</h4>
            <div className="w-full bg-slate-100 dark:bg-slate-850 h-1 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-blue-400 h-full rounded-full" style={{ width: `${clients.length > 0 ? (pipelineStats.Prospect / clients.length) * 100 : 0}%` }}></div>
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 block uppercase tracking-wider font-semibold">Clique para filtrar</span>
          </div>

          {/* Stage: Ativo */}
          <div 
            onClick={() => setPipelineFilter(pipelineFilter === 'Ativo' ? 'all' : 'Ativo')}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
              pipelineFilter === 'Ativo'
                ? 'bg-emerald-50/50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-800 ring-2 ring-emerald-400'
                : 'bg-white border-slate-200/80 hover:border-emerald-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Etapa 3: Ativos</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{pipelineStats.Ativo}</span>
            </div>
            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-2">Fidelizados</h4>
            <div className="w-full bg-slate-100 dark:bg-slate-850 h-1 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${clients.length > 0 ? (pipelineStats.Ativo / clients.length) * 100 : 0}%` }}></div>
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 block uppercase tracking-wider font-semibold">Clique para filtrar</span>
          </div>

          {/* Stage: Inativo */}
          <div 
            onClick={() => setPipelineFilter(pipelineFilter === 'Inativo' ? 'all' : 'Inativo')}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
              pipelineFilter === 'Inativo'
                ? 'bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700 ring-2 ring-slate-400'
                : 'bg-white border-slate-200/80 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Etapa 4: Inativos</span>
              <span className="text-lg font-black text-slate-600 dark:text-slate-400 font-mono">{pipelineStats.Inativo}</span>
            </div>
            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-2">Inativos / Perdidos</h4>
            <div className="w-full bg-slate-100 dark:bg-slate-850 h-1 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-slate-400 h-full rounded-full" style={{ width: `${clients.length > 0 ? (pipelineStats.Inativo / clients.length) * 100 : 0}%` }}></div>
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 block uppercase tracking-wider font-semibold">Clique para filtrar</span>
          </div>
        </div>
      )}

      {/* FORM: CREATE NEW CLIENT */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 shadow-md max-w-4xl" id="add-client-form">
          <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <UserPlus className="w-4 h-4 text-blue-600" /> Registrar Ficha Cadastral do Cliente
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome Completo / Razão Social *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Ex: Roberto da Silva"
                value={name}
                onChange={e => setName(e.target.value)}
                id="client-name"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome Fantasia / Empresa (Opcional)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Ex: Silva Advocacia Ltda"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                id="client-company"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">E-mail de Contato *</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="email@cliente.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                id="client-email"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Telefone (WhatsApp) *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                id="client-phone"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">CPF ou CNPJ *</label>
                {document.replace(/\D/g, '').length > 0 && (
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                    isDocValid 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' 
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 animate-pulse'
                  }`}>
                    {isDocValid ? `${docType} Válido` : 'Documento Inválido'}
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                className={`w-full px-3 py-2 border rounded-sm text-xs bg-white dark:bg-slate-950 dark:text-slate-300 focus:outline-none focus:ring-1 transition-colors ${
                  showDocWarning 
                    ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/10' 
                    : isDocValid && document.replace(/\D/g, '').length > 0
                    ? 'border-emerald-500 focus:ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500'
                }`}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={document}
                onChange={e => setDocument(formatCpfOrCnpj(e.target.value))}
                id="client-document"
              />
              {showDocWarning && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-600 font-bold uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Dígitos verificadores do documento inválidos</span>
                </div>
              )}
            </div>

            {/* Segment */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Segmento</label>
              <select
                value={segment}
                onChange={e => setSegment(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Residencial">Residencial (Pessoa Física)</option>
                <option value="Comercial">Comercial (Escritórios / Lojas)</option>
                <option value="Industrial">Industrial (Fábricas / Galpões)</option>
                <option value="Corporativo">Corporativo (Grandes Empresas / Redes)</option>
              </select>
            </div>

            {/* Funnel Stage */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estágio de Relacionamento (Funil)</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Lead">Lead (Apenas Contato Inicial)</option>
                <option value="Prospect">Prospect (Conversa / Proposta Ativa)</option>
                <option value="Ativo">Ativo (Cliente Fidelizado)</option>
                <option value="Inativo">Inativo (Sem Atividade / Perdido)</option>
              </select>
            </div>

            {/* Address */}
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Endereço Completo de Cobrança / Sede *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                value={address}
                onChange={e => setAddress(e.target.value)}
                id="client-address"
              />
            </div>

            {/* Internal notes */}
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Observações Internas Iniciais</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 h-20"
                placeholder="Ex: Cliente prefere contato prioritário via WhatsApp..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-rose-500 mb-4 font-bold uppercase tracking-wider" id="form-error">{formError}</p>
          )}

          <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-sm transition cursor-pointer"
              id="cancel-add-client"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              id="save-client-btn"
            >
              <CheckCircle className="w-4 h-4" /> Salvar Cadastro
            </button>
          </div>
        </form>
      )}

      {/* FORM: EDIT CLIENT (MODAL STYLE OVERLAY FOR HIGH-FIDELITY) */}
      {editingClient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 shadow-xl max-w-2xl w-full" id="edit-client-form">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600" /> Editar Ficha Cadastral: {editingClient.name}
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingClient(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome Fantasia / Empresa (Opcional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none"
                  value={editCompanyName}
                  onChange={e => setEditCompanyName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">E-mail de Contato *</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Telefone (WhatsApp) *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">CPF ou CNPJ *</label>
                  {editDocument.replace(/\D/g, '').length > 0 && (
                    <span className="text-[9px] font-bold uppercase text-slate-500">
                      {isEditDocValid ? `${editDocType} Válido` : 'Documento Inválido'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none"
                  value={editDocument}
                  onChange={e => setEditDocument(formatCpfOrCnpj(e.target.value))}
                />
              </div>

              {/* Segment */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Segmento</label>
                <select
                  value={editSegment}
                  onChange={e => setEditSegment(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none"
                >
                  <option value="Residencial">Residencial</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Corporativo">Corporativo</option>
                </select>
              </div>

              {/* Funnel Stage */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estágio de Relacionamento (Funil)</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none"
                >
                  <option value="Lead">Lead</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Endereço Completo de Cobrança / Sede *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Observações Internas</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm text-xs focus:outline-none h-16"
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                />
              </div>
            </div>

            {editFormError && (
              <p className="text-xs text-rose-500 mb-4 font-bold uppercase tracking-wider">{editFormError}</p>
            )}

            <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-sm transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" /> Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEARCH AND CONTROL BAR */}
      {!isAdding && !editingClient && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-sm border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF/CNPJ, e-mail, status ou segmento..."
                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                id="crm-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors flex items-center justify-center"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {pipelineFilter !== 'all' && (
                <button
                  onClick={() => setPipelineFilter('all')}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 uppercase tracking-widest border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-sm flex items-center gap-1 bg-white dark:bg-slate-900"
                >
                  Limpar Filtro Funil ({pipelineFilter}) <X className="w-3 h-3 text-rose-500" />
                </button>
              )}
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 bg-white dark:bg-slate-900 px-3 py-2 rounded-sm border border-slate-150 dark:border-slate-800 shadow-2xs">
                <span>Resultados:</span>
                <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded-xs font-mono font-black">
                  {filteredClients.length}
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>Total: {clients.length}</span>
              </div>
            </div>
          </div>

          {/* CUSTOMERS LISTING GRID */}
          {filteredClients.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-sm border-2 border-dashed border-slate-200 dark:border-slate-800">
              <UserPlus className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2 animate-bounce" />
              <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">Nenhum cliente cadastrado ou encontrado.</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Experimente remover os termos da pesquisa ou cadastre um novo cliente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4" id="crm-clients-list">
              {filteredClients.map((client) => {
                const isExpanded = expandedClientId === client.id;
                
                // Status Color Styling
                const statusStyles = {
                  Lead: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
                  Prospect: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
                  Ativo: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
                  Inativo: 'bg-slate-100 text-slate-600 border-slate-250 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-750'
                };
                const clientStatus = client.status || 'Lead';

                // Segment Color Styling
                const segmentStyles = {
                  Residencial: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30',
                  Comercial: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30',
                  Industrial: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30',
                  Corporativo: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30'
                };
                const clientSegment = client.segment || 'Comercial';

                return (
                  <div
                    key={client.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden"
                    id={`client-card-${client.id}`}
                  >
                    {/* PRIMARY INFO RAIL */}
                    <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 
                            className="font-sans font-black text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer text-sm uppercase tracking-tight" 
                            onClick={() => onSelectClient?.(client)}
                          >
                            {client.name}
                          </h4>

                          {/* Company name badge */}
                          {client.companyName && (
                            <span className="inline-block px-2 py-0.5 bg-blue-50/50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 text-[9px] font-extrabold uppercase tracking-widest rounded-sm border border-blue-100 dark:border-blue-900/40">
                              {client.companyName}
                            </span>
                          )}

                          {/* Lifecycle Status Badge */}
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-sm ${statusStyles[clientStatus]}`}>
                            {clientStatus === 'Lead' ? 'Lead' : clientStatus === 'Prospect' ? 'Em Negociação' : clientStatus === 'Ativo' ? 'Fidelizado (Ativo)' : 'Inativo'}
                          </span>

                          {/* Segment Badge */}
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-sm ${segmentStyles[clientSegment]}`}>
                            {clientSegment}
                          </span>
                        </div>

                        {/* Summary fields row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1.5 gap-x-4 mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{client.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono">{client.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono">Doc: {formatCpfOrCnpj(client.document)}</span>
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS ROW */}
                      <div className="flex items-center gap-2 w-full md:w-auto shrink-0 border-t border-slate-50 md:border-t-0 pt-3 md:pt-0">
                        {onSelectClient && (
                          <button
                            onClick={() => onSelectClient(client)}
                            className="flex-1 md:flex-none px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-sm text-[11px] font-bold uppercase tracking-widest transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                            id={`select-client-${client.id}`}
                          >
                            Nova Vistoria &rarr;
                          </button>
                        )}
                        {onUpdateClient && (
                          <button
                            onClick={() => handleStartEdit(client)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-sm transition cursor-pointer"
                            title="Editar dados"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteClient(client.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 border border-slate-150 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-sm transition cursor-pointer"
                          title="Remover cliente"
                          id={`delete-client-${client.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-150 dark:border-slate-800 rounded-sm flex items-center justify-center cursor-pointer"
                          title={isExpanded ? 'Esconder Histórico CRM' : 'Visualizar Linha do Tempo e Notas'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED CRM SUB-PANEL (CRM Timeline & Internal Notes Logger) */}
                    {isExpanded && (
                      <div className="bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-850 p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Column 1: Client Profile Details & Internal Notes */}
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5" /> Perfil &amp; Observações Internas
                          </h5>
                          
                          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-2xs">
                            <div className="space-y-1">
                              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Endereço de Correspondência:</span>
                              <span className="block text-xs text-slate-700 dark:text-slate-300 font-medium leading-normal">{client.address}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Data de Cadastro:</span>
                              <span className="block text-xs text-slate-700 dark:text-slate-300 font-medium">{new Date(client.createdAt).toLocaleString('pt-BR')}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Observações do Cliente (Editável):</span>
                              <textarea
                                defaultValue={client.notes || ''}
                                onBlur={(e) => handleUpdateNotes(client.id, e.target.value)}
                                placeholder="Clique aqui para digitar e salve clicando fora do campo de texto..."
                                className="w-full text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-sm p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 h-24 placeholder-slate-400"
                              />
                              <span className="block text-[8px] text-slate-400 font-medium italic mt-0.5">As observações acima são salvas automaticamente ao clicar fora.</span>
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Timeline of Interactions / Activity History */}
                        <div className="lg:col-span-2 space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <History className="w-3.5 h-3.5" /> Histórico de Relacionamento (Atividades)
                            </h5>
                            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded-sm">
                              Interações: {client.interactions?.length || 0}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            {/* Interactive timeline events list */}
                            <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 max-h-72 overflow-y-auto space-y-4 shadow-2xs">
                              {!client.interactions || client.interactions.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                  <Activity className="w-7 h-7 mx-auto text-slate-300 mb-1" />
                                  <p className="text-[10px] uppercase font-bold tracking-wider">Nenhuma atividade registrada.</p>
                                </div>
                              ) : (
                                <div className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-4">
                                  {client.interactions.slice().reverse().map((event, idx) => {
                                    const eventIcons = {
                                      Contato: '📞',
                                      Reunião: '🤝',
                                      Vistoria: '📷',
                                      Proposta: '📄',
                                      Fechamento: '🏆'
                                    };
                                    return (
                                      <div key={event.id} className="relative">
                                        {/* Point */}
                                        <span className="absolute -left-[25px] top-0.5 w-4 h-4 bg-white dark:bg-slate-900 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-[9px] shadow-2xs">
                                          {eventIcons[event.type] || '💬'}
                                        </span>
                                        <div className="space-y-0.5">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-bold text-slate-850 dark:text-slate-200 uppercase tracking-tight">
                                              {event.type}
                                            </span>
                                            <span className="text-[9px] font-mono text-slate-400">
                                              {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          </div>
                                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                            {event.description}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Activity Event Logger Form */}
                            <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3">
                              <h6 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Registrar Nova Ação / Evento</h6>
                              
                              {/* Interaction type */}
                              <div>
                                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tipo do Evento:</label>
                                <select
                                  value={interactionType}
                                  onChange={e => setInteractionType(e.target.value as any)}
                                  className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm focus:outline-none"
                                >
                                  <option value="Contato">Contato (Telefone/WhatsApp/E-mail)</option>
                                  <option value="Reunião">Reunião (Alinhamento / Visita)</option>
                                  <option value="Vistoria">Vistoria Realizada / Agendada</option>
                                  <option value="Proposta">Proposta Comercial Enviada</option>
                                  <option value="Fechamento">Fechamento de Negócio / Contrato</option>
                                </select>
                              </div>

                              {/* Interaction description */}
                              <div>
                                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Descrição da Atividade:</label>
                                <textarea
                                  value={interactionDesc}
                                  onChange={e => setInteractionDesc(e.target.value)}
                                  placeholder="Digite um resumo detalhado do que foi acordado com o cliente..."
                                  className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-300 rounded-sm h-16 focus:outline-none placeholder-slate-400"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleAddInteraction(client.id)}
                                disabled={!interactionDesc.trim()}
                                className="w-full py-2 bg-slate-900 hover:bg-slate-850 dark:bg-slate-100 dark:text-slate-900 text-white font-bold text-[10px] uppercase tracking-wider rounded-sm transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> Logar Atividade
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
