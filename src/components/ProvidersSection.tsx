import React, { useState } from 'react';
import { ServiceProvider, CatalogService } from '../types';
import { 
  Truck, 
  UserCheck, 
  MapPin, 
  DollarSign, 
  Package, 
  Home, 
  Plus, 
  Trash2, 
  Edit, 
  ShieldAlert, 
  FileText, 
  Check, 
  Users, 
  Layers, 
  Search, 
  Building2, 
  Eye, 
  EyeOff,
  User,
  Archive,
  Wrench,
  AlertCircle
} from 'lucide-react';
import { formatCpfOrCnpj, validateCpfOrCnpj } from '../utils/validation';

interface ProvidersSectionProps {
  providers: ServiceProvider[];
  onAddProvider: (provider: Omit<ServiceProvider, 'id' | 'createdAt'>) => void;
  onUpdateProvider: (id: string, provider: Partial<ServiceProvider>) => void;
  onDeleteProvider: (id: string) => void;
  services: CatalogService[];
  onAddService: (service: Omit<CatalogService, 'id'>) => void;
  onUpdateService: (id: string, service: Partial<CatalogService>) => void;
  onDeleteService: (id: string) => void;
}

export default function ProvidersSection({
  providers,
  onAddProvider,
  onUpdateProvider,
  onDeleteProvider,
  services,
  onAddService,
  onUpdateService,
  onDeleteService
}: ProvidersSectionProps) {
  // Tabs for Sub-sections
  const [subTab, setSubTab] = useState<'providers' | 'services'>('providers');

  // Search States
  const [searchProvider, setSearchProvider] = useState('');
  const [searchService, setSearchService] = useState('');

  // Form states for Provider
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  const [pCpf, setPCpf] = useState('');
  const [pCnh, setPCnh] = useState('');
  const [pAddress, setPAddress] = useState('');
  const [pPhotoUrl, setPPhotoUrl] = useState('');
  const [pFreightDestiny, setPFreightDestiny] = useState('');
  const [pFreightValue, setPFreightValue] = useState('');
  const [pTruckDetails, setPTruckDetails] = useState('');
  const [providerFormError, setProviderFormError] = useState('');

  // Form states for Catalog Service
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [sName, setSName] = useState('');
  const [sType, setSType] = useState<'Transporte' | 'Embalagem' | 'Armazenamento' | 'Outros'>('Transporte');
  const [sDescription, setSDescription] = useState('');
  const [sPrice, setSPrice] = useState('');
  const [sUnit, setSUnit] = useState('por km rodado');
  const [sStatus, setSStatus] = useState<'Ativo' | 'Inativo'>('Ativo');

  // Random avatar list to easily select for mock photos
  const mockAvatars = [
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  ];

  const handleOpenAddProvider = () => {
    setEditingProviderId(null);
    setPName('');
    setPCpf('');
    setPCnh('');
    setPAddress('');
    setPPhotoUrl(mockAvatars[Math.floor(Math.random() * mockAvatars.length)]);
    setPFreightDestiny('');
    setPFreightValue('');
    setPTruckDetails('');
    setProviderFormError('');
    setShowProviderForm(true);
  };

  const handleOpenEditProvider = (p: ServiceProvider) => {
    setEditingProviderId(p.id);
    setPName(p.name);
    setPCpf(p.cpf);
    setPCnh(p.cnh);
    setPAddress(p.address);
    setPPhotoUrl(p.photoUrl);
    setPFreightDestiny(p.freightDestiny || '');
    setPFreightValue(p.freightValue?.toString() || '');
    setPTruckDetails(p.truckDetails || '');
    setProviderFormError('');
    setShowProviderForm(true);
  };

  const handleSaveProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pCpf || !pCnh || !pAddress) {
      setProviderFormError('Por favor, preencha todos os campos obrigatórios (Nome, CPF/CNPJ, CNH e Endereço).');
      return;
    }

    const { isValid } = validateCpfOrCnpj(pCpf);
    if (!isValid) {
      setProviderFormError('O documento CPF ou CNPJ informado é inválido. Por favor, verifique os dígitos.');
      return;
    }

    const payload = {
      name: pName,
      cpf: pCpf,
      cnh: pCnh,
      photoUrl: pPhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      address: pAddress,
      freightDestiny: pFreightDestiny || undefined,
      freightValue: pFreightValue ? parseFloat(pFreightValue) : undefined,
      truckDetails: pTruckDetails || undefined
    };

    if (editingProviderId) {
      onUpdateProvider(editingProviderId, payload);
    } else {
      onAddProvider(payload);
    }

    setShowProviderForm(false);
  };

  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setSName('');
    setSType('Transporte');
    setSDescription('');
    setSPrice('');
    setSUnit('por km rodado');
    setSStatus('Ativo');
    setShowServiceForm(true);
  };

  const handleOpenEditService = (s: CatalogService) => {
    setEditingServiceId(s.id);
    setSName(s.name);
    setSType(s.type);
    setSDescription(s.description);
    setSPrice(s.price.toString());
    setSUnit(s.unit);
    setSStatus(s.status);
    setShowServiceForm(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName || !sPrice || !sDescription) {
      alert('Por favor, preencha todos os campos (Nome, Descrição e Preço).');
      return;
    }

    const payload = {
      name: sName,
      type: sType,
      description: sDescription,
      price: parseFloat(sPrice),
      unit: sUnit,
      status: sStatus
    };

    if (editingServiceId) {
      onUpdateService(editingServiceId, payload);
    } else {
      onAddService(payload);
    }

    setShowServiceForm(false);
  };

  // Filter lists based on search
  const filteredProviders = providers.filter(p => 
    p.name.toLowerCase().includes(searchProvider.toLowerCase()) ||
    p.cpf.includes(searchProvider) ||
    (p.freightDestiny && p.freightDestiny.toLowerCase().includes(searchProvider.toLowerCase()))
  );

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchService.toLowerCase()) ||
    s.type.toLowerCase().includes(searchService.toLowerCase()) ||
    s.description.toLowerCase().includes(searchService.toLowerCase())
  );

  const { isValid: isPCpfValid, type: pCpfType } = validateCpfOrCnpj(pCpf);
  const showPCpfWarning = pCpf.replace(/\D/g, '').length > 0 && !isPCpfValid;

  return (
    <div className="space-y-6" id="providers-section-root">
      
      {/* HEADER BAR AND SUB-TABS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Prestadores & Serviços do Galpão
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">
            Gestão operacional de fretes, dados de motoristas e catálogo corporativo
          </p>
        </div>

        <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-sm border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setSubTab('providers')}
            className={`px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              subTab === 'providers'
                ? 'bg-blue-600 text-white font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Prestadores / Motoristas ({providers.length})
          </button>
          <button
            onClick={() => setSubTab('services')}
            className={`px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              subTab === 'services'
                ? 'bg-blue-600 text-white font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Catálogo de Serviços ({services.length})
          </button>
        </div>
      </div>

      {/* SECTION 1: PROVIDERS & MOTORISTAS */}
      {subTab === 'providers' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* SEARCH AND ADD ACTION BAR */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Filtrar por nome, CPF ou destino..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-sm text-xs bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                value={searchProvider}
                onChange={e => setSearchProvider(e.target.value)}
              />
            </div>

            {!showProviderForm && (
              <button
                onClick={handleOpenAddProvider}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                id="add-new-provider-btn"
              >
                <Plus className="w-4 h-4" /> Cadastrar Prestador / Motorista
              </button>
            )}
          </div>

          {/* ADD / EDIT PROVIDER COLLAPSIBLE FORM */}
          {showProviderForm && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6 shadow-sm space-y-4 animate-in slide-in-from-top duration-350">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4.5 h-4.5 text-blue-600" />
                  {editingProviderId ? 'Editar Cadastro do Prestador' : 'Novo Cadastro de Prestador / Motorista / Freelancer'}
                </h3>
                <button 
                  onClick={() => setShowProviderForm(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                >
                  Fechar [X]
                </button>
              </div>

              <form onSubmit={handleSaveProvider} className="space-y-4">
                
                {/* Driver Photo and Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1 space-y-2 flex flex-col items-center justify-center border-r border-dashed border-slate-200 dark:border-slate-700 pr-4">
                    <img 
                      src={pPhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                      alt="Foto de Perfil" 
                      className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 shadow-md referrer-policy='no-referrer'"
                    />
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center">Foto do Prestador</label>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {mockAvatars.map((av, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setPPhotoUrl(av)}
                          className="w-6 h-6 rounded-full overflow-hidden border border-slate-300 hover:border-blue-600 transition"
                        >
                          <img src={av} className="w-full h-full object-cover" alt="" />
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="URL customizada da foto"
                      className="w-full px-2 py-1 border border-slate-200 rounded-sm text-[10px] text-center"
                      value={pPhotoUrl}
                      onChange={e => setPPhotoUrl(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nome do motorista ou freelancer"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-sm text-xs bg-white dark:bg-slate-800"
                        value={pName}
                        onChange={e => setPName(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documento CPF ou CNPJ *</label>
                        {pCpf.replace(/\D/g, '').length > 0 && (
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                            isPCpfValid 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse'
                          }`}>
                            {isPCpfValid ? `${pCpfType} Válido` : 'Inválido'}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        className={`w-full px-3 py-2 border rounded-sm text-xs bg-white dark:bg-slate-800 font-mono focus:outline-none focus:ring-1 transition-colors ${
                          showPCpfWarning
                            ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/10 dark:bg-rose-950/10'
                            : isPCpfValid && pCpf.replace(/\D/g, '').length > 0
                            ? 'border-emerald-500 focus:ring-emerald-500 focus:border-emerald-500'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        value={pCpf}
                        onChange={e => setPCpf(formatCpfOrCnpj(e.target.value))}
                      />
                      {showPCpfWarning && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Dígitos verificadores do documento inválidos</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Número de Registro CNH *</label>
                      <input
                        type="text"
                        required
                        placeholder="000000000-0"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-sm text-xs bg-white dark:bg-slate-800 font-mono"
                        value={pCnh}
                        onChange={e => setPCnh(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Endereço Residencial Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Rua, Número, Bairro, Cidade - UF"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-sm text-xs bg-white dark:bg-slate-800"
                        value={pAddress}
                        onChange={e => setPAddress(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Freight / Truck Logistics Details */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-sm border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Dados de Operação Logística e Caminhão (Opcional)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dados do Caminhão (Modelo / Placa)</label>
                      <input
                        type="text"
                        placeholder="Ex: Scania R450 - Placa ABC1234"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-sm text-xs bg-white dark:bg-slate-800"
                        value={pTruckDetails}
                        onChange={e => setPTruckDetails(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Destino do Frete</label>
                      <input
                        type="text"
                        placeholder="Ex: Galpão Central de Armazenamento - SP"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-sm text-xs bg-white dark:bg-slate-800"
                        value={pFreightDestiny}
                        onChange={e => setPFreightDestiny(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valor Contratado do Frete (R$)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs font-mono">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-sm text-xs bg-white dark:bg-slate-800 font-mono"
                          value={pFreightValue}
                          onChange={e => setPFreightValue(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {providerFormError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-2" id="provider-form-error">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{providerFormError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowProviderForm(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-sm text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                  >
                    {editingProviderId ? 'Salvar Alterações' : 'Concluir Cadastro'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LIST OF PROVIDERS CARDS */}
          {filteredProviders.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-12 text-center" id="no-providers-placeholder">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Nenhum prestador de serviços ou motorista encontrado.</p>
              <p className="text-xs text-slate-400 mt-1">Experimente remover os filtros de busca ou cadastre um novo prestador para iniciar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" id="providers-cards-grid">
              {filteredProviders.map(p => (
                <div 
                  key={p.id} 
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-xs overflow-hidden flex flex-col md:flex-row transition hover:shadow-md border-l-4 border-l-blue-600"
                  id={`provider-card-${p.id}`}
                >
                  {/* Photo Section */}
                  <div className="md:w-1/3 bg-slate-50 dark:bg-slate-900/55 p-5 flex flex-col items-center justify-center text-center border-r border-slate-100 dark:border-slate-700">
                    <img 
                      src={p.photoUrl} 
                      alt={p.name} 
                      className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600 shadow-sm mb-3 referrer-policy='no-referrer'" 
                    />
                    <h4 className="font-sans font-bold text-slate-900 dark:text-white text-sm tracking-tight">{p.name}</h4>
                    <span className="text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider mt-1.5">
                      Motorista / Prestador
                    </span>
                  </div>

                  {/* Details Section */}
                  <div className="md:w-2/3 p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Documentos Pessoais</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-medium">CPF/CNPJ: <strong className="font-mono">{formatCpfOrCnpj(p.cpf)}</strong></span>
                            <span className="font-medium">CNH: <strong className="font-mono">{p.cnh}</strong></span>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 print:hidden">
                          <button
                            onClick={() => handleOpenEditProvider(p)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-sm transition"
                            title="Editar cadastro"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja mesmo remover o prestador ${p.name}?`)) {
                                onDeleteProvider(p.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-sm transition"
                            title="Excluir cadastro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> Endereço Residencial
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{p.address}</p>
                      </div>

                      {/* Freight & Truck specific details if registered */}
                      {(p.truckDetails || p.freightDestiny || p.freightValue) && (
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-sm border border-slate-100 dark:border-slate-700 text-xs space-y-2">
                          <div className="flex items-center gap-1.5 font-bold text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            <Truck className="w-3.5 h-3.5" /> Logística de Frete & Caminhão
                          </div>
                          {p.truckDetails && (
                            <p className="text-slate-600 dark:text-slate-300">
                              Veículo: <strong className="text-slate-800 dark:text-slate-200">{p.truckDetails}</strong>
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                            <div>
                              <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-extrabold">Destino do Frete</span>
                              <span className="text-slate-700 dark:text-slate-300 font-semibold">{p.freightDestiny || 'Não Definido'}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-extrabold">Valor do Frete</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-black font-mono">
                                {p.freightValue ? `R$ ${p.freightValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/D'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>Registrado em: {new Date(p.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black">
                        <Check className="w-3.5 h-3.5" /> Homologado
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: SERVICES CATALOG */}
      {subTab === 'services' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* SEARCH AND ADD ACTION BAR */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Filtrar serviços por nome, tipo ou descrição..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-sm text-xs bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                value={searchService}
                onChange={e => setSearchService(e.target.value)}
              />
            </div>

            {!showServiceForm && (
              <button
                onClick={handleOpenAddService}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                id="add-new-service-btn"
              >
                <Plus className="w-4 h-4" /> Novo Item de Catálogo
              </button>
            )}
          </div>

          {/* ADD / EDIT CATALOG SERVICE COLLAPSIBLE FORM */}
          {showServiceForm && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6 shadow-sm space-y-4 animate-in slide-in-from-top duration-350">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4.5 h-4.5 text-blue-600" />
                  {editingServiceId ? 'Editar Item do Catálogo' : 'Inserir Novo Serviço de Galpão / Logística'}
                </h3>
                <button 
                  onClick={() => setShowServiceForm(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                >
                  Fechar [X]
                </button>
              </div>

              <form onSubmit={handleSaveService} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome do Serviço *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Transporte em Caminhão Baú ou Armazenamento"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-sm text-xs bg-white dark:bg-slate-800"
                    value={sName}
                    onChange={e => setSName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo de Serviço *</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-sm text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100"
                    value={sType}
                    onChange={e => setSType(e.target.value as any)}
                  >
                    <option value="Transporte">Transporte (Frete, Logística de trânsito)</option>
                    <option value="Embalagem">Embalagem (Proteção antichoque, caixas, fitas)</option>
                    <option value="Armazenamento">Armazenamento (Galpão, Box, Guarda-Móveis)</option>
                    <option value="Outros">Outros Serviços Adjacentes</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição Comercial Detalhada *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Destaque as características físicas, seguros, acomodações e garantias incluídas neste serviço comercial."
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-sm text-xs bg-white dark:bg-slate-800 leading-relaxed"
                    value={sDescription}
                    onChange={e => setSDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Preço Cobrado (R$) *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs font-mono">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0,00"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-sm text-xs bg-white dark:bg-slate-800 font-mono"
                      value={sPrice}
                      onChange={e => setSPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unidade de Cobrança *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: por km rodado, por caixa, por m³ / mês, serviço único"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-sm text-xs bg-white dark:bg-slate-800"
                    value={sUnit}
                    onChange={e => setSUnit(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status de Disponibilidade</label>
                  <div className="flex gap-4 items-center h-8">
                    <label className="inline-flex items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        className="form-radio text-blue-600 focus:ring-blue-500 mr-1.5"
                        name="status"
                        checked={sStatus === 'Ativo'}
                        onChange={() => setSStatus('Ativo')}
                      />
                      Ativo no Catálogo
                    </label>
                    <label className="inline-flex items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        className="form-radio text-rose-600 focus:ring-rose-500 mr-1.5"
                        name="status"
                        checked={sStatus === 'Inativo'}
                        onChange={() => setSStatus('Inativo')}
                      />
                      Inativo / Pausado
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowServiceForm(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-sm text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                  >
                    {editingServiceId ? 'Salvar Serviço' : 'Cadastrar Serviço'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LIST OF SERVICES IN GRID */}
          {filteredServices.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-12 text-center" id="no-services-placeholder">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Nenhum serviço catalogado nesta categoria.</p>
              <p className="text-xs text-slate-400 mt-1">Gere novos serviços ou remova filtros para conferir o catálogo patrimonial.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="services-catalog-grid">
              {filteredServices.map(s => {
                // Determine icon and color based on service type
                const isTransport = s.type === 'Transporte';
                const isPackaging = s.type === 'Embalagem';
                const isStorage = s.type === 'Armazenamento';

                return (
                  <div 
                    key={s.id}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition relative group"
                    id={`service-card-${s.id}`}
                  >
                    {/* Status Badge */}
                    <span className={`absolute top-4 right-4 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ${
                      s.status === 'Ativo' 
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {s.status}
                    </span>

                    <div className="space-y-2.5">
                      {/* Icon & Category */}
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-sm ${
                          isTransport ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' :
                          isPackaging ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
                          isStorage ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' :
                          'bg-slate-100 dark:bg-slate-900 text-slate-600'
                        }`}>
                          {isTransport && <Truck className="w-5 h-5" />}
                          {isPackaging && <Package className="w-5 h-5" />}
                          {isStorage && <Building2 className="w-5 h-5" />}
                          {!isTransport && !isPackaging && !isStorage && <Wrench className="w-5 h-5" />}
                        </div>
                        <div>
                          <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">{s.type}</span>
                          <h4 className="font-sans font-bold text-slate-950 dark:text-white text-xs uppercase tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {s.name}
                          </h4>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-3">
                        {s.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-end justify-between">
                      <div>
                        <span className="block text-[8px] text-slate-400 uppercase tracking-widest font-extrabold">Preço do Serviço</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold">R$</span>
                          <span className="text-slate-950 dark:text-white font-black text-base font-mono">
                            {s.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase">/ {s.unit}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity print:hidden">
                        <button
                          onClick={() => handleOpenEditService(s)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-sm transition"
                          title="Editar serviço"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente excluir o serviço "${s.name}" do catálogo?`)) {
                              onDeleteService(s.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-sm transition"
                          title="Excluir serviço"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DECORATIVE BLUEPRINT ASSURANCE BOX */}
          <div className="bg-blue-50/50 dark:bg-blue-950/15 border border-blue-100 dark:border-blue-900/40 rounded-sm p-4 text-xs text-blue-800 dark:text-blue-300 flex gap-3 leading-relaxed">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px]">Garantia Operacional MobiInv</p>
              <p className="mt-0.5 uppercase font-medium text-[9px]">
                Todos os serviços cadastrados no catálogo contam com cobertura de seguro predial, cobertura contra sinistros de transporte rodoviário e são integrados diretamente ao preenchimento de faturas, orçamentos e relatórios técnicos finais.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
