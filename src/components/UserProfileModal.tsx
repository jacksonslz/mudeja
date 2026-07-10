import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  X, User, Building2, Shield, Upload, Check, RotateCcw, 
  Info, Sparkles, Palette, Mail, Phone, MapPin, Award
} from 'lucide-react';
import { formatCpfOrCnpj, validateCpfOrCnpj } from '../utils/validation';

export interface UserProfileData {
  userName: string;
  userRole: string;
  companyName: string;
  companyCnpj: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo: string; // Base64 image
  accentColor: 'blue' | 'orange' | 'emerald' | 'purple';
  showKpis: boolean;
}

interface UserProfileModalProps {
  onClose: () => void;
  onSave: (data: UserProfileData) => void;
  initialData: UserProfileData;
}

const PRESET_LOGOS = [
  { name: 'Shield Tech', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60' },
  { name: 'Minimal Gear', url: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=100&auto=format&fit=crop&q=60' },
  { name: 'Hexa Blue', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=100&auto=format&fit=crop&q=60' },
  { name: 'Vibrant Wave', url: 'https://images.unsplash.com/photo-1618005198143-e5283b519a7f?w=100&auto=format&fit=crop&q=60' }
];

export default function UserProfileModal({ onClose, onSave, initialData }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'admin'>('profile');
  const [formData, setFormData] = useState<UserProfileData>({ ...initialData });
  const [cnpjError, setCnpjError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string>(initialData.companyLogo || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpfOrCnpj(e.target.value);
    setFormData(prev => ({ ...prev, companyCnpj: formatted }));
    
    if (formatted) {
      const { isValid } = validateCpfOrCnpj(formatted);
      if (!isValid) {
        setCnpjError('CNPJ inválido');
      } else {
        setCnpjError('');
      }
    } else {
      setCnpjError('');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem do logotipo deve ter no máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setFormData(prev => ({ ...prev, companyLogo: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const selectPresetLogo = (url: string) => {
    setLogoPreview(url);
    setFormData(prev => ({ ...prev, companyLogo: url }));
  };

  const handleSave = () => {
    if (formData.companyCnpj) {
      const { isValid } = validateCpfOrCnpj(formData.companyCnpj);
      if (!isValid) {
        setCnpjError('Por favor, informe um CNPJ válido antes de salvar.');
        setActiveTab('company');
        return;
      }
    }
    onSave(formData);
    onClose();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearLogo = () => {
    setLogoPreview('');
    setFormData(prev => ({ ...prev, companyLogo: '' }));
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fade-in" id="user-profile-modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-white w-full max-w-2xl rounded-xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        id="user-profile-modal"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-400/25 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider">Perfil &amp; Identidade Visual</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Painel de Administração Local</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar"
            id="close-profile-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 flex items-center gap-2 border-b-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'profile' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-profile-btn"
          >
            <User className="w-3.5 h-3.5" />
            Usuário Administrador
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`px-4 py-3 flex items-center gap-2 border-b-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'company' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-company-btn"
          >
            <Building2 className="w-3.5 h-3.5" />
            Identidade da Empresa
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-3 flex items-center gap-2 border-b-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'admin' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-admin-btn"
          >
            <Palette className="w-3.5 h-3.5" />
            Preferências do Painel
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[60vh]">
          {activeTab === 'profile' && (
            <div className="space-y-5" id="profile-pane">
              {/* Profile Card Header */}
              <div className="flex items-center gap-5 bg-slate-50 p-4 border border-slate-200/80 rounded-xl shadow-2xs">
                <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-amber-500 rounded-full border border-white shadow-md flex items-center justify-center text-white text-xl font-black tracking-tighter">
                  {formData.userName ? formData.userName.substring(0, 2).toUpperCase() : 'JG'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">Conta Ativa</span>
                    <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">Master Admin</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 uppercase mt-1 tracking-tight">{formData.userName || 'JacksOnGuedy'}</h3>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{formData.userRole || 'Inspetor Lvl 3'}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" /> Nome do Administrador
                  </label>
                  <input
                    type="text"
                    value={formData.userName}
                    onChange={e => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    placeholder="Nome do usuário"
                    id="profile-name-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Award className="w-3 h-3 text-slate-400" /> Cargo ou Nível de Inspetor
                  </label>
                  <input
                    type="text"
                    value={formData.userRole}
                    onChange={e => setFormData(prev => ({ ...prev, userRole: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    placeholder="Cargo (ex: Inspetor Técnico Lvl 3)"
                    id="profile-role-input"
                  />
                </div>
              </div>

              {/* System privileges box */}
              <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-800">Privilégios Administrativos do Navegador</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Emissão e Assinatura Digital de Vistorias</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Cadastro Ilimitado de Clientes e Bens</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Backup e Persistência de Dados Local</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Acesso ao Painel Financeiro e Contratos</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="space-y-5" id="company-pane">
              {/* Company Logo Manager */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Logotipo Oficial da Empresa
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 border border-slate-200/80 rounded-xl shadow-2xs">
                  {/* Preview box */}
                  <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Logo empresa" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                        <button 
                          onClick={clearLogo}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold uppercase transition-opacity cursor-pointer"
                        >
                          Remover
                        </button>
                      </>
                    ) : (
                      <Building2 className="w-8 h-8 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <button
                        onClick={triggerFileInput}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" /> Enviar Logotipo (Max 2MB)
                      </button>
                      {logoPreview && (
                        <button
                          onClick={clearLogo}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                        >
                          Restaurar Padrão
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Recomendado: imagem quadrada ou horizontal com fundo transparente ou branco.</p>
                  </div>
                </div>

                {/* Preset suggestions */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Modelos de Logotipo Prontos (Premium)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_LOGOS.map((preset, i) => (
                      <button
                        key={i}
                        onClick={() => selectPresetLogo(preset.url)}
                        className={`p-2 border rounded-lg bg-white hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-2 text-left ${
                          logoPreview === preset.url ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-6 h-6 rounded-sm object-cover shrink-0" referrerPolicy="no-referrer" />
                        <span className="text-[9px] font-bold text-slate-700 uppercase tracking-tight truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Company Data Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Razão Social / Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    placeholder="MobiInv Pro LTDA"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> CNPJ da Empresa
                  </label>
                  <input
                    type="text"
                    value={formData.companyCnpj}
                    onChange={handleCnpjChange}
                    className={`w-full px-3 py-2.5 border rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white ${
                      cnpjError ? 'border-rose-400' : 'border-slate-200'
                    }`}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                  {cnpjError && (
                    <span className="text-[9px] text-rose-500 font-bold block uppercase tracking-wide">{cnpjError}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> E-mail Comercial
                  </label>
                  <input
                    type="email"
                    value={formData.companyEmail}
                    onChange={e => setFormData(prev => ({ ...prev, companyEmail: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    placeholder="contato@mobiinv.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Telefone Comercial
                  </label>
                  <input
                    type="text"
                    value={formData.companyPhone}
                    onChange={e => setFormData(prev => ({ ...prev, companyPhone: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    placeholder="(11) 98765-4321"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Endereço Sede
                  </label>
                  <input
                    type="text"
                    value={formData.companyAddress}
                    onChange={e => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="space-y-5" id="admin-pane">
              {/* Premium Color Accent selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" /> Cor de Destaque da Marca (Accent Color)
                </label>
                <p className="text-[10px] text-slate-400 font-medium">Selecione uma tonalidade para personalizar botões e detalhes do painel administrador.</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, accentColor: 'blue' }))}
                    className={`p-3.5 border rounded-xl bg-white hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                      formData.accentColor === 'blue' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-500 shadow-2xs"></div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-700">Azul Claro</span>
                  </button>

                  <button
                    onClick={() => setFormData(prev => ({ ...prev, accentColor: 'orange' }))}
                    className={`p-3.5 border rounded-xl bg-white hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                      formData.accentColor === 'orange' ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-orange-500 shadow-2xs"></div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-700">Laranja Solar</span>
                  </button>

                  <button
                    onClick={() => setFormData(prev => ({ ...prev, accentColor: 'emerald' }))}
                    className={`p-3.5 border rounded-xl bg-white hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                      formData.accentColor === 'emerald' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500 shadow-2xs"></div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-700">Esmeralda</span>
                  </button>

                  <button
                    onClick={() => setFormData(prev => ({ ...prev, accentColor: 'purple' }))}
                    className={`p-3.5 border rounded-xl bg-white hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                      formData.accentColor === 'purple' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-purple-500 shadow-2xs"></div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-700">Roxo Nobre</span>
                  </button>
                </div>
              </div>

              {/* Toggle features */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Visibilidade de Métricas
                </label>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-150 rounded-xl">
                  <div>
                    <h5 className="text-[11px] font-black uppercase text-slate-800">Visualizar Cards de KPI</h5>
                    <p className="text-[10px] text-slate-400 font-medium">Exibe ou oculta o resumo de patrimônio, ativos e laudos no topo do Painel.</p>
                  </div>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, showKpis: !prev.showKpis }))}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      formData.showKpis ? 'bg-blue-500' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-2xs ${
                      formData.showKpis ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Local Storage System Info */}
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">Armazenamento Local Criptografado</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  Seus dados de logotipo e empresa são salvos exclusivamente no seu navegador via <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">localStorage</code>. Isso garante total sigilo e conformidade com a LGPD. Os laudos gerados carregarão esses dados automaticamente.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            id="cancel-profile-modal-btn"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
            id="save-profile-modal-btn"
          >
            <Check className="w-4 h-4" /> Salvar Configurações
          </button>
        </div>
      </motion.div>
    </div>
  );
}
