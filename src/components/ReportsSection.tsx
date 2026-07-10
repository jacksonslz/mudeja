import React, { useState, useEffect } from 'react';
import { InventoryReport, Invoice, Receipt, Client, NotificationLog } from '../types';
import { 
  FileText, 
  Printer, 
  ShieldCheck, 
  Receipt as ReceiptIcon, 
  FileSpreadsheet, 
  FileDown, 
  CheckCircle, 
  ChevronRight, 
  X,
  Mail,
  Send,
  MessageSquare,
  Sparkles,
  TrendingUp,
  FileCheck,
  Eye,
  Minimize2
} from 'lucide-react';
import { generateReportPDF } from '../utils/pdfGenerator';

interface ReportsSectionProps {
  reports: InventoryReport[];
  invoices: Invoice[];
  receipts: Receipt[];
  clients?: Client[];
  onEmitInvoice: (reportId: string) => void;
  onEmitReceipt: (reportId: string, paymentMethod: 'Pix' | 'Boleto' | 'Cartão' | 'Dinheiro', notes?: string) => void;
  onTriggerNotification?: (log: Omit<NotificationLog, 'id' | 'sentAt'>) => void;
}

export default function ReportsSection({
  reports,
  invoices,
  receipts,
  clients = [],
  onEmitInvoice,
  onEmitReceipt,
  onTriggerNotification
}: ReportsSectionProps) {
  const [selectedReport, setSelectedReport] = useState<InventoryReport | null>(null);
  const [activeTab, setActiveTab] = useState<'laudo' | 'nf' | 'recibo'>('laudo');

  // Load local user profile for company info
  const companyProfile = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('mobiinv_user_profile');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      companyName: 'MOBI-INV SOLUTIONS LTDA',
      companyCnpj: '12.345.678/0001-90',
      companyEmail: 'suporte@mobiinv.com.br',
      companyPhone: '(11) 4004-0000',
      companyAddress: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
      companyLogo: '',
    };
  }, []);
  
  // Receipt emit config state
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Boleto' | 'Cartão' | 'Dinheiro'>('Pix');
  const [receiptNotes, setReceiptNotes] = useState('Serviço de vistoria técnica e inventariamento fotográfico de bens patrimoniais executado com sucesso.');

  // Sending and PDF Generation UI State
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showSendPanel, setShowSendPanel] = useState(false);
  const [sendChannel, setSendChannel] = useState<'E-mail' | 'WhatsApp'>('E-mail');
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendNotes, setSendNotes] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStep, setSendStep] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);

  // Fullscreen Presentation Mode State
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Sync recipient pre-fill on report select or channel change
  useEffect(() => {
    if (selectedReport) {
      const client = clients.find(c => c.id === selectedReport.clientId);
      if (client) {
        setSendRecipient(sendChannel === 'E-mail' ? client.email : client.phone);
      } else {
        setSendRecipient('');
      }
      setSendNotes(`Prezado(a) ${selectedReport.clientName},\n\nEncaminhamos em anexo o Laudo Técnico de Vistoria e Inventário de Bens da unidade "${selectedReport.title}".\n\nEste laudo foi devidamente homologado e assinado digitalmente para sua conferência.\n\nAtenciosamente,\nMobiInv Gestão Patrimonial`);
      setSendSuccess(false);
      setIsSending(false);
      setIsPresentationMode(false);
    }
  }, [selectedReport, sendChannel, clients]);

  const finalizedReports = reports.filter(r => r.status === 'Finalizado');

  // Related Invoice and Receipt for the selected report
  const currentInvoice = selectedReport ? invoices.find(i => i.reportId === selectedReport.id) : null;
  const currentReceipt = selectedReport ? receipts.find(r => r.reportId === selectedReport.id) : null;

  // Calculate sum of active report values
  const calculateTotalValue = (report: InventoryReport) => {
    return report.items.reduce((sum, item) => sum + (item.value || 0), 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!selectedReport) return;
    setIsGeneratingPDF(true);
    try {
      await generateReportPDF(selectedReport);
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao gerar o PDF do laudo.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendPDF = () => {
    if (!selectedReport) return;
    if (!sendRecipient) {
      alert('Por favor, insira o contato do destinatário.');
      return;
    }

    setIsSending(true);
    setSendSuccess(false);
    setSendStep('Inicializando motor de geração de PDF...');

    setTimeout(() => {
      setSendStep('Estruturando assinaturas e cabeçalhos digitais...');
      
      setTimeout(() => {
        setSendStep(`Enviando arquivo anexado para o canal ${sendChannel}...`);
        
        setTimeout(() => {
          setIsSending(false);
          setSendSuccess(true);
          
          if (onTriggerNotification) {
            onTriggerNotification({
              type: sendChannel,
              recipient: selectedReport.clientName,
              message: `[LAUDO OFICIAL] Enviado com sucesso via ${sendChannel} para: ${sendRecipient}. Ref: "${selectedReport.title}"`,
              status: 'Enviado'
            });
          }
        }, 1200);
      }, 1000);
    }, 1000);
  };

  return (
    <div className="space-y-6" id="reports-section-root">
      <div>
        <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-900">Relatórios & Documentação</h2>
        <p className="text-xs text-slate-500">Visualize laudos finalizados, emita Notas Fiscais, recibos e verifique as assinaturas de ciência.</p>
      </div>

      {selectedReport ? (
        <div className="space-y-4" id="report-detail-panel">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm flex flex-wrap gap-2 justify-between items-center print:hidden">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-sm">
              <button
                onClick={() => setActiveTab('laudo')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
                  activeTab === 'laudo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                id="tab-laudo-btn"
              >
                Laudo Fotográfico
              </button>
              <button
                onClick={() => setActiveTab('nf')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
                  activeTab === 'nf' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                id="tab-nf-btn"
              >
                Nota Fiscal (NF-e)
              </button>
              <button
                onClick={() => setActiveTab('recibo')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
                  activeTab === 'recibo' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                id="tab-recibo-btn"
              >
                Recibo de Quitação
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className={`px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-sm`}
                id="download-pdf-btn"
              >
                <FileDown className={`w-3.5 h-3.5 ${isGeneratingPDF ? 'animate-bounce' : ''}`} /> 
                {isGeneratingPDF ? 'Gerando PDF...' : 'Gerar PDF Oficial'}
              </button>

              <button
                onClick={() => setIsPresentationMode(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                id="view-presentation-btn"
              >
                <Eye className="w-3.5 h-3.5 animate-pulse" /> 
                Apresentação (Modo Foco)
              </button>
              
              <button
                onClick={() => {
                  setShowSendPanel(!showSendPanel);
                  setSendSuccess(false);
                }}
                className={`px-3.5 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer border ${
                  showSendPanel 
                    ? 'bg-slate-200 border-slate-300 text-slate-800' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                }`}
                id="toggle-send-panel-btn"
              >
                <Mail className="w-3.5 h-3.5" /> Enviar Laudo
              </button>

              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                id="print-doc-btn"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir
              </button>
              
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-sm hover:bg-slate-100 transition cursor-pointer"
                id="close-report-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Collapsible PDF Transmission Panel */}
          {showSendPanel && (
            <div className="bg-slate-50 border border-slate-200 rounded-sm p-5 shadow-sm space-y-4 print:hidden animate-in fade-in slide-in-from-top-2 duration-250" id="pdf-send-transmission-panel">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                <h4 className="font-sans font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" /> Transmissão Direta do Laudo Finalizado
                </h4>
                <button 
                  onClick={() => setShowSendPanel(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isSending ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-3" id="send-loading-state">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin"></div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide animate-pulse">{sendStep}</p>
                </div>
              ) : sendSuccess ? (
                <div className="py-6 text-center space-y-3 bg-emerald-50 border border-emerald-100 rounded-sm" id="send-success-state">
                  <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h5 className="font-sans font-bold text-emerald-800 text-xs uppercase tracking-wider">Documento Enviado com Sucesso!</h5>
                    <p className="text-[11px] text-emerald-600 mt-1 uppercase font-semibold">
                      O laudo foi indexado no canal {sendChannel} para {sendRecipient}.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setSendSuccess(false)}
                      className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-sm text-[9px] font-bold uppercase tracking-wider text-slate-650"
                    >
                      Enviar para outro contato
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="send-form-inputs">
                  <div className="space-y-3 md:col-span-1">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Canal de Transmissão</label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSendChannel('E-mail')}
                          className={`flex-1 py-1.5 border rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                            sendChannel === 'E-mail'
                              ? 'bg-blue-50 border-blue-200 text-blue-700 font-extrabold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5" /> E-mail
                        </button>
                        <button
                          type="button"
                          onClick={() => setSendChannel('WhatsApp')}
                          className={`flex-1 py-1.5 border rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                            sendChannel === 'WhatsApp'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-extrabold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        {sendChannel === 'E-mail' ? 'Endereço de E-mail' : 'Número do Celular'}
                      </label>
                      <input
                        type="text"
                        placeholder={sendChannel === 'E-mail' ? 'cliente@dominio.com' : '(11) 99999-9999'}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium font-mono"
                        value={sendRecipient}
                        onChange={e => setSendRecipient(e.target.value)}
                        id="transmission-recipient-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 md:col-span-2 flex flex-col justify-between">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mensagem de Acompanhamento</label>
                      <textarea
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none leading-relaxed"
                        value={sendNotes}
                        onChange={e => setSendNotes(e.target.value)}
                        id="transmission-notes-input"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/40">
                      <button
                        type="button"
                        onClick={() => setShowSendPanel(false)}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-sm text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSendPDF}
                        className={`px-4 py-1.5 text-white rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                          sendChannel === 'E-mail' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                        id="send-final-pdf-btn"
                      >
                        Enviar Laudo Assinado <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MAIN DOCUMENT WRAPPER (Printable) */}
          <div className={isPresentationMode 
            ? "fixed inset-0 bg-slate-900/95 z-50 overflow-y-auto p-4 sm:p-12 print:relative print:p-0 print:bg-white print:z-auto" 
            : "bg-white border border-slate-200 rounded-sm p-8 shadow-sm max-w-4xl mx-auto print:border-none print:shadow-none print:p-0"
          }>
            {isPresentationMode && (
              <div className="max-w-4xl w-full mx-auto bg-slate-800 border border-slate-700 rounded-sm p-4 shadow-xl flex justify-between items-center mb-6 text-white print:hidden animate-in slide-in-from-top duration-300" id="presentation-toolbar">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-blue-600/20 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-blue-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-sans font-black text-xs uppercase tracking-wider text-white">Modo de Apresentação de Laudo</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Visualização limpa e focada para assinatura do cliente</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <FileDown className="w-3.5 h-3.5" /> {isGeneratingPDF ? 'Gerando...' : 'Baixar PDF'}
                  </button>
                  <button
                    onClick={() => setIsPresentationMode(false)}
                    className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-650 text-slate-100 rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer border border-slate-600"
                  >
                    <Minimize2 className="w-3.5 h-3.5" /> Sair da Apresentação
                  </button>
                </div>
              </div>
            )}

            <div className={isPresentationMode 
              ? "bg-white border border-slate-350 rounded-sm p-8 sm:p-12 shadow-2xl max-w-4xl mx-auto text-slate-900" 
              : ""
            }>
            {/* TAB 1: LAUDO FOTOGRÁFICO */}
            {activeTab === 'laudo' && (
              <div className="space-y-8" id="laudo-print-area">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Laudo Técnico Patrimonial</span>
                    <h1 className="text-base font-extrabold text-slate-900 uppercase tracking-tight mt-1">{selectedReport.title}</h1>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {selectedReport.id}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p className="font-sans font-bold text-[10px] uppercase tracking-wider text-slate-900">MOBI-INV GESTÃO</p>
                    <p className="text-[10px] uppercase">São Paulo, Brasil</p>
                    <p className="text-[10px] font-mono">DATA: {new Date(selectedReport.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {/* Client Info */}
                <div className="bg-slate-50 p-4 rounded-sm border border-slate-150 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Dados do Cliente</h4>
                    <p><span className="text-slate-500">Nome:</span> <strong className="text-slate-700 uppercase">{selectedReport.clientName}</strong></p>
                    <p><span className="text-slate-500">Identificação:</span> <span className="font-mono">{selectedReport.clientId}</span></p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Resumo da Vistoria</h4>
                    <p><span className="text-slate-500">Total de Ativos:</span> <span className="font-mono">{selectedReport.items.length} ITENS CATALOGADOS</span></p>
                    <p><span className="text-slate-500">Valor Estimado:</span> <strong className="text-slate-850 font-mono">R$ {calculateTotalValue(selectedReport).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></p>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-6">
                  <h3 className="font-sans font-bold text-[10px] uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">Ativos Catalogados com Fotos</h3>
                  
                  <div className="space-y-6">
                    {selectedReport.items.map((item, index) => (
                      <div key={item.id} className="flex flex-col md:flex-row gap-6 border border-slate-200 rounded-sm p-4 bg-slate-50/20 page-break-inside-avoid">
                        <div className="w-full md:w-44 h-44 rounded-sm overflow-hidden border border-slate-200 bg-white shrink-0">
                          <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] font-bold font-mono text-slate-400">#{(index + 1).toString().padStart(3, '0')}</span>
                              <h4 className="font-sans font-bold text-xs uppercase text-slate-900 tracking-tight">{item.name}</h4>
                            </div>
                            {item.value && (
                              <span className="text-xs font-mono font-bold text-slate-800">
                                R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div className="bg-white border border-slate-150 p-2 rounded-sm">
                              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Categoria</span>
                              <span className="font-semibold text-slate-700 uppercase text-[10px]">{item.category}</span>
                            </div>
                            <div className="bg-white border border-slate-150 p-2 rounded-sm">
                              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Estado</span>
                              <span className={`font-bold uppercase text-[10px] ${
                                item.status === 'Excelente' ? 'text-emerald-600' :
                                item.status === 'Bom' ? 'text-blue-600' :
                                item.status === 'Regular' ? 'text-amber-600' : 'text-rose-600'
                              }`}>{item.status}</span>
                            </div>
                            <div className="bg-white border border-slate-150 p-2 rounded-sm col-span-2">
                              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Cômodo / Localização</span>
                              <span className="font-semibold text-slate-700 uppercase text-[10px] truncate block">{item.location}</span>
                            </div>
                          </div>

                          {item.description && (
                            <div className="text-xs text-slate-600 bg-white border border-slate-150 p-3 rounded-sm leading-relaxed">
                              <strong className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Observações do Estado:</strong>
                              {item.description}
                            </div>
                          )}

                          <div className="text-[10px] font-mono text-slate-400 uppercase">
                            Número de Série: {item.serialNumber || 'NÃO CONSTA'} &bull; Registro: {new Date(item.createdAt).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Digital Signatures */}
                {(selectedReport.signature || selectedReport.providerSignature) && (
                  <div className="border-t border-slate-200 pt-8 mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto page-break-inside-avoid" id="laudo-signatures-container">
                    
                    {/* Client Signature */}
                    {selectedReport.signature ? (
                      <div className="flex flex-col items-center text-center border border-slate-100 dark:border-slate-800 p-4 rounded-sm bg-slate-50/50 dark:bg-slate-900/10" id="client-signature-box">
                        <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 mb-2 tracking-wider">Assinatura do Cliente / Contratante</p>
                        <div className="w-full h-24 border border-slate-200 rounded-sm bg-white flex items-center justify-center overflow-hidden mb-3">
                          <img
                            src={selectedReport.signature.signatureDataUrl}
                            alt="Assinatura Digital do Cliente"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                          <ShieldCheck className="w-4 h-4" />
                          <span className="text-[10px] font-bold tracking-widest uppercase">Assinado Digitalmente</span>
                        </div>
                        <p className="font-sans font-bold text-xs uppercase text-slate-900 dark:text-white">{selectedReport.signature.signedByName}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Documento: {selectedReport.signature.signedByDocument}</p>
                        <p className="text-[9px] font-mono text-slate-400 mt-1 uppercase">
                          Ciência outorgada em {new Date(selectedReport.signature.signedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-700 p-6 rounded-sm text-center h-full text-slate-450 bg-slate-50/30 min-h-[160px]" id="client-signature-pending">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Aguardando Assinatura do Cliente</p>
                      </div>
                    )}

                    {/* Service Provider / Driver Signature */}
                    {selectedReport.providerSignature ? (
                      <div className="flex flex-col items-center text-center border border-slate-100 dark:border-slate-800 p-4 rounded-sm bg-slate-50/50 dark:bg-slate-900/10" id="provider-signature-box">
                        <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 mb-2 tracking-wider">Assinatura do Prestador / Motorista</p>
                        <div className="w-full h-24 border border-slate-200 rounded-sm bg-white flex items-center justify-center overflow-hidden mb-3">
                          <img
                            src={selectedReport.providerSignature.signatureDataUrl}
                            alt="Assinatura Digital do Prestador"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                          <ShieldCheck className="w-4 h-4" />
                          <span className="text-[10px] font-bold tracking-widest uppercase">Assinado Digitalmente</span>
                        </div>
                        <p className="font-sans font-bold text-xs uppercase text-slate-900 dark:text-white">{selectedReport.providerSignature.signedByName}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Documento: {selectedReport.providerSignature.signedByDocument}</p>
                        <p className="text-[9px] font-mono text-slate-400 mt-1 uppercase">
                          Retirada outorgada em {new Date(selectedReport.providerSignature.signedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-700 p-6 rounded-sm text-center h-full text-slate-450 bg-slate-50/30 min-h-[160px]" id="provider-signature-pending">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Aguardando Retirada pelo Motorista</p>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}

            {/* TAB 2: NOTA FISCAL */}
            {activeTab === 'nf' && (
              <div className="space-y-6" id="nf-print-area">
                {currentInvoice ? (
                  <div className="border-4 border-slate-900 rounded-sm p-6 space-y-6">
                    {/* Invoice header */}
                    <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
                      <div className="text-[10px] font-mono uppercase text-slate-700">
                        <p className="font-bold text-slate-900">MOBI-INV SERVIÇOS S.A.</p>
                        <p>CNPJ: 12.345.678/0001-00</p>
                        <p>Insc. Municipal: 9.876.543-2</p>
                        <p>Rua de Negócios, 99 - São Paulo, SP</p>
                      </div>
                      <div className="text-center border-2 border-slate-900 p-3 rounded-sm bg-slate-50">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Nota Fiscal Eletrônica</span>
                        <span className="block text-[10px] font-bold text-slate-600 uppercase font-mono">NFS-e</span>
                        <span className="block text-xs font-mono font-bold text-blue-600">Nº {currentInvoice.id}</span>
                      </div>
                    </div>

                    {/* Prestadors and Tomadors details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b-2 border-slate-900 pb-4 text-xs">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Prestador do Serviço</span>
                        <p className="font-bold uppercase text-slate-900">{companyProfile.companyName || 'MobiInv Digital Solutions'}</p>
                        {companyProfile.companyCnpj && <p>CNPJ: {companyProfile.companyCnpj}</p>}
                        <p>E-mail: {companyProfile.companyEmail || 'suporte@mobiinv.com.br'}</p>
                        <p>Tel: {companyProfile.companyPhone || '(11) 4004-0000'}</p>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tomador do Serviço (Cliente)</span>
                        <p className="font-bold uppercase text-slate-900">{currentInvoice.clientName}</p>
                        <p>Identificador: <span className="font-mono">{selectedReport.clientId}</span></p>
                        <p>Vinculado ao Laudo: {selectedReport.title}</p>
                      </div>
                    </div>

                    {/* Service Description */}
                    <div className="space-y-2 border-b-2 border-slate-900 pb-4">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Descrição dos Serviços</span>
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono text-[10px]">
                            <th className="py-1">Serviço / Item</th>
                            <th className="py-1 text-center">Quant. Ativos</th>
                            <th className="py-1 text-right">Valor Vistoriado</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-2">
                              <p className="font-bold uppercase text-slate-900 text-xs">Execução de Laudo Fotográfico Patrimonial</p>
                              <p className="text-[10px] text-slate-500">Vistoria física, classificação, registro de números de série e fotografia de bens patrimoniais.</p>
                            </td>
                            <td className="py-2 text-center font-mono">{currentInvoice.itemsCount}</td>
                            <td className="py-2 text-right font-mono">R$ {calculateTotalValue(selectedReport).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Calculations */}
                    <div className="flex justify-end text-xs">
                      <div className="w-64 space-y-1 bg-slate-50 p-4 rounded-sm border border-slate-200">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 uppercase tracking-tight">Valor dos Serviços:</span>
                          <span className="font-bold font-mono">R$ {currentInvoice.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 uppercase tracking-tight">Alíquota ISS (5%):</span>
                          <span className="font-mono">R$ {currentInvoice.taxValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                          <span>Total Líquido:</span>
                          <span className="text-blue-600 font-mono">R$ {currentInvoice.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Verification info */}
                    <div className="text-[9px] font-mono text-slate-400 border-t border-slate-200 pt-4 text-center uppercase">
                      <p>Código de Autenticidade Digital: <strong className="text-slate-600">A589-BC99-D112-E889</strong></p>
                      <p className="mt-0.5">Esta nota fiscal foi simulada e gerada com sucesso sob o respaldo regulatório municipal.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4 bg-slate-50 rounded-sm border border-dashed border-slate-350">
                    <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
                    <div>
                      <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800">Nenhuma Nota Fiscal Emitida</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        Deseja oficializar e gerar a Nota Fiscal Eletrônica de prestação de serviços para este inventário?
                      </p>
                    </div>
                    <button
                      onClick={() => onEmitInvoice(selectedReport.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                      id="emit-invoice-btn"
                    >
                      Gerar Nota Fiscal Eletrônica
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: RECIBO DE QUITAÇÃO */}
            {activeTab === 'recibo' && (
              <div className="space-y-6" id="recibo-print-area">
                {currentReceipt ? (
                  <div className="border border-emerald-200 bg-emerald-50/10 rounded-sm p-8 space-y-6">
                    <div className="flex justify-between items-center border-b border-emerald-100 pb-4">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <ReceiptIcon className="w-6 h-6" />
                        <h3 className="font-sans font-bold text-xs uppercase tracking-wider">Recibo de Quitação</h3>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-sm uppercase">
                        Nº {currentReceipt.id}
                      </span>
                    </div>

                    <div className="space-y-4 text-xs text-slate-700 leading-relaxed text-justify">
                      <p>
                        Recebemos de <strong className="text-slate-950 uppercase">{currentReceipt.clientName}</strong> o valor de{' '}
                        <strong className="text-slate-950 font-mono">
                          R$ {currentReceipt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </strong>{' '}
                        referente ao serviço prestado de inventariamento, catalogação fotográfica e registro patrimonial de{' '}
                        {selectedReport.items.length} ativos, atestados no laudo técnico <strong className="text-slate-950">"{selectedReport.title}"</strong>.
                      </p>

                      {currentReceipt.notes && (
                        <div className="bg-white border border-emerald-100 p-3 rounded-sm text-xs text-slate-600">
                          <span className="font-bold text-slate-700 block mb-0.5 uppercase tracking-wide text-[9px]">Observações adicionais:</span>
                          {currentReceipt.notes}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 bg-emerald-50/40 p-4 rounded-sm text-xs">
                        <div>
                          <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Forma de Pagamento</span>
                          <span className="font-bold text-emerald-800 uppercase text-xs">{currentReceipt.paymentMethod}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Data de Emissão</span>
                          <span className="font-bold text-slate-800 font-mono text-xs">
                            {new Date(currentReceipt.issueDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-6 text-center text-xs text-slate-500 space-y-1">
                      <div className="w-48 border-b border-slate-300 mx-auto h-8 mb-2"></div>
                      <p className="font-sans font-bold text-[10px] uppercase tracking-wider text-slate-700">{companyProfile.companyName ? companyProfile.companyName.toUpperCase() : 'MOBI-INV SOLUTIONS LTDA'}</p>
                      <p className="uppercase text-[9px]">Documento emitido eletronicamente para fins de comprovação e quitação.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-sm p-6 max-w-xl mx-auto space-y-4">
                    <div className="flex items-center gap-2.5 text-emerald-600 mb-2">
                      <ReceiptIcon className="w-5 h-5" />
                      <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">Configurar Recibo</h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Método de Pagamento</label>
                        <select
                          className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value as any)}
                          id="receipt-payment-method"
                        >
                          <option value="Pix">Pix</option>
                          <option value="Boleto">Boleto Bancário</option>
                          <option value="Cartão">Cartão de Crédito</option>
                          <option value="Dinheiro">Dinheiro</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notas / Descrição do Recibo</label>
                        <textarea
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 h-20 resize-none"
                          value={receiptNotes}
                          onChange={e => setReceiptNotes(e.target.value)}
                          id="receipt-notes-input"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-150">
                      <button
                        onClick={() => onEmitReceipt(selectedReport.id, paymentMethod, receiptNotes)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                        id="generate-receipt-btn"
                      >
                        Gerar Recibo de Pagamento
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="finalized-reports-grid">
          {finalizedReports.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-sm border-2 border-dashed border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2 stroke-1" />
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Não há laudos finalizados</p>
              <p className="text-slate-400 text-[10px] uppercase mt-1">Conclua e assine um inventário para exibi-lo aqui.</p>
            </div>
          ) : (
            finalizedReports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white border border-slate-200 hover:border-blue-500 rounded-sm p-5 shadow-sm transition flex flex-col justify-between"
                id={`finalized-report-card-${rep.id}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">Relatório Concluído</span>
                    <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-sm">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                  </div>
                  <h4 className="font-sans font-bold text-xs uppercase tracking-tight text-slate-900 leading-tight mb-1">{rep.title}</h4>
                  <p className="text-xs text-slate-500">Cliente: {rep.clientName}</p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] uppercase bg-slate-50 p-2.5 rounded-sm border border-slate-150">
                    <div>
                      <span className="text-slate-400 block font-bold text-[9px] tracking-wide">Catalogado:</span>
                      <strong className="text-slate-700 font-mono">{rep.items.length} ITENS</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[9px] tracking-wide">Assinado por:</span>
                      <strong className="text-slate-700 truncate block" title={rep.signature?.signedByName}>
                        {rep.signature?.signedByName}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">
                    DATA: {rep.finalizedAt ? new Date(rep.finalizedAt).toLocaleDateString('pt-BR') : ''}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedReport(rep);
                      setActiveTab('laudo');
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                    id={`view-report-detail-${rep.id}`}
                  >
                    Visualizar <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

