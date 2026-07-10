import React, { useState, useEffect } from 'react';
import { InventoryReport, NotificationLog } from '../types';
import { Send, MessageSquare, Mail, Bell, ShieldAlert, CheckCircle, RefreshCw, Eye, ListFilter, Settings, AlertTriangle, BellOff, Info, Check } from 'lucide-react';

interface IntegrationsSectionProps {
  finalizedReports: InventoryReport[];
  notificationLogs: NotificationLog[];
  onTriggerNotification: (log: Omit<NotificationLog, 'id' | 'sentAt'>) => void;
}

export default function IntegrationsSection({
  finalizedReports,
  notificationLogs,
  onTriggerNotification
}: IntegrationsSectionProps) {
  const [selectedReportId, setSelectedReportId] = useState('');
  const [activeChannel, setActiveChannel] = useState<'WhatsApp' | 'E-mail' | 'Push'>('WhatsApp');

  // Push Permission & Preferences States
  const [pushPermission, setPushPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const simulated = localStorage.getItem('mobiinv_simulated_push_permission');
      if (simulated) return simulated;
      return Notification.permission;
    }
    return 'default';
  });

  const [prefContractExpiry, setPrefContractExpiry] = useState<boolean>(() => {
    const saved = localStorage.getItem('mobiinv_pref_contract_expiry');
    return saved === null ? true : saved === 'true';
  });

  const [prefReportCompletion, setPrefReportCompletion] = useState<boolean>(() => {
    const saved = localStorage.getItem('mobiinv_pref_report_completion');
    return saved === null ? true : saved === 'true';
  });

  const [prefNewSchedule, setPrefNewSchedule] = useState<boolean>(() => {
    const saved = localStorage.getItem('mobiinv_pref_new_schedule');
    return saved === null ? true : saved === 'true';
  });

  const [prefSystemAlerts, setPrefSystemAlerts] = useState<boolean>(() => {
    const saved = localStorage.getItem('mobiinv_pref_system_alerts');
    return saved === null ? false : saved === 'true';
  });

  const [notificationSuccessMessage, setNotificationSuccessMessage] = useState<string | null>(null);

  // Sync Preferences to LocalStorage
  useEffect(() => {
    localStorage.setItem('mobiinv_pref_contract_expiry', String(prefContractExpiry));
  }, [prefContractExpiry]);

  useEffect(() => {
    localStorage.setItem('mobiinv_pref_report_completion', String(prefReportCompletion));
  }, [prefReportCompletion]);

  useEffect(() => {
    localStorage.setItem('mobiinv_pref_new_schedule', String(prefNewSchedule));
  }, [prefNewSchedule]);

  useEffect(() => {
    localStorage.setItem('mobiinv_pref_system_alerts', String(prefSystemAlerts));
  }, [prefSystemAlerts]);

  // Request native/simulated permission
  const requestBrowserPushPermission = () => {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) {
      alert('Seu navegador não possui suporte nativo para Web Push Notifications.');
      return;
    }

    Notification.requestPermission().then(permission => {
      setPushPermission(permission);
      localStorage.setItem('mobiinv_simulated_push_permission', permission);
      if (permission === 'granted') {
        new Notification('MobiInv Pro', {
          body: 'Notificações Web Push configuradas com sucesso!',
          icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
        });
      }
    }).catch(() => {
      // Browsers block requestPermission inside sandboxed iframes without permission flags
      // We perform a simulated fallback permission state so the user can test the UI perfectly
      const fallback = 'simulated_granted';
      setPushPermission(fallback);
      localStorage.setItem('mobiinv_simulated_push_permission', fallback);
      alert('Nota: Devido a restrições de sandbox do navegador no iframe de desenvolvimento, a permissão nativa foi simulada como "Permitida". Você pode testar e configurar as preferências normalmente!');
    });
  };

  const handleToggleSimulatedPermission = () => {
    let next: string;
    if (pushPermission === 'granted' || pushPermission === 'simulated_granted') {
      next = 'denied';
    } else if (pushPermission === 'denied' || pushPermission === 'simulated_denied') {
      next = 'default';
    } else {
      next = 'simulated_granted';
    }
    setPushPermission(next);
    localStorage.setItem('mobiinv_simulated_push_permission', next);
  };

  const handleTestNotification = (type: 'contract' | 'report') => {
    const isGranted = pushPermission === 'granted' || pushPermission === 'simulated_granted';
    if (!isGranted) {
      alert('Por favor, ative a permissão de notificações push no painel antes de realizar o teste.');
      return;
    }

    let title = '';
    let message = '';

    if (type === 'contract') {
      if (!prefContractExpiry) {
        alert('As notificações para vencimento de contrato estão desativadas em suas preferências!');
        return;
      }
      title = '⚠️ Contrato de Cliente Vencendo';
      message = 'O contrato nº CONT-2026-89 com Mariana Santos vence em 10 dias. Toque para gerenciar renovação.';
    } else {
      if (!prefReportCompletion) {
        alert('As notificações para finalização de laudo estão desativadas em suas preferências!');
        return;
      }
      title = '✓ Laudo de Vistoria Finalizado';
      message = 'O laudo técnico "Laudo Fotográfico Apartamento 101" foi assinado e concluído.';
    }

    // Try sending native notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
        });
      } catch (err) {
        console.warn('Native notification failed, logging simulated instead.', err);
      }
    }

    // Trigger system notification log
    onTriggerNotification({
      type: 'Push',
      recipient: 'Meu Dispositivo (Web Push)',
      message: `[Web Push Alert] ${title}: ${message}`,
      status: 'Enviado'
    });

    setNotificationSuccessMessage(`Notificação do tipo "${type === 'contract' ? 'Vencimento de Contrato' : 'Finalização de Laudo'}" disparada! Verifique o histórico de disparos.`);
    setTimeout(() => setNotificationSuccessMessage(null), 5000);
  };
  
  // Custom templates
  const [waTemplate, setWaTemplate] = useState('Olá {nome_cliente}, seu Laudo de Inventário "{titulo_laudo}" está finalizado e assinado por você! Confira o relatório completo e o recibo de quitação anexo.');
  const [emailTemplate, setEmailTemplate] = useState('Prezado(a) {nome_cliente},\n\nConfirmamos a conclusão e a assinatura digital de ciência do inventário fotográfico "{titulo_laudo}".\n\nA Nota Fiscal Eletrônica e o Recibo correspondentes foram emitidos e encontram-se registrados para conformidade fiscal.\n\nAgradecemos a preferência.\n\nAtenciosamente,\nEquipe de Gestão Patrimonial.');
  const [pushTemplate, setPushTemplate] = useState('Inventário finalizado para {nome_cliente}: {titulo_laudo}!');

  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  const selectedReport = finalizedReports.find(r => r.id === selectedReportId) || (finalizedReports.length > 0 ? finalizedReports[0] : null);

  // Replace placeholders helper
  const renderTemplate = (text: string, report: InventoryReport | null) => {
    if (!report) return text.replace(/{nome_cliente}/g, 'Cliente').replace(/{titulo_laudo}/g, 'Inventário Exemplo');
    return text
      .replace(/{nome_cliente}/g, report.clientName)
      .replace(/{titulo_laudo}/g, report.title)
      .replace(/{id_laudo}/g, report.id);
  };

  const handleSendWhatsApp = () => {
    if (!selectedReport) {
      alert('Selecione um relatório finalizado para simular o envio.');
      return;
    }

    // Try to find client phone number, or ask for one
    const clientPhone = '5511999999999'; // Mock or default
    const formattedMessage = encodeURIComponent(renderTemplate(waTemplate, selectedReport));
    const waUrl = `https://wa.me/${clientPhone}?text=${formattedMessage}`;

    // Add notification log
    onTriggerNotification({
      type: 'WhatsApp',
      recipient: selectedReport.clientName,
      message: renderTemplate(waTemplate, selectedReport),
      status: 'Enviado'
    });

    setSimulationStatus('WhatsApp acionado! Abrindo redirecionamento oficial...');
    setTimeout(() => {
      window.open(waUrl, '_blank');
      setSimulationStatus(null);
    }, 1500);
  };

  const handleSendEmail = () => {
    if (!selectedReport) {
      alert('Selecione um relatório finalizado para simular o envio.');
      return;
    }

    // Add notification log
    onTriggerNotification({
      type: 'E-mail',
      recipient: `${selectedReport.clientName} (e-mail)`,
      message: renderTemplate(emailTemplate, selectedReport),
      status: 'Enviado'
    });

    setSimulationStatus('Simulando envio de e-mail seguro com anexo de Nota Fiscal e PDF...');
    setTimeout(() => {
      setSimulationStatus('E-mail enviado com sucesso para o cliente!');
      setTimeout(() => setSimulationStatus(null), 3000);
    }, 2000);
  };

  const handleSendPush = () => {
    if (!selectedReport) {
      alert('Selecione um relatório finalizado para simular o envio.');
      return;
    }

    // Add notification log
    onTriggerNotification({
      type: 'Push',
      recipient: 'Dispositivo do Cliente',
      message: renderTemplate(pushTemplate, selectedReport),
      status: 'Enviado'
    });

    // Native Web Notification trigger if granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('MobiInv Push', {
        body: renderTemplate(pushTemplate, selectedReport),
        icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('MobiInv Push', {
            body: renderTemplate(pushTemplate, selectedReport)
          });
        }
      });
    }

    setSimulationStatus('Disparando notificação Push no navegador...');
    setTimeout(() => {
      setSimulationStatus('Notificação enviada com sucesso!');
      setTimeout(() => setSimulationStatus(null), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6" id="integrations-section-root">
      <div>
        <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-900">Integração de Notificações</h2>
        <p className="text-xs text-slate-500">
          Dispare mensagens automáticas, compartilhe laudos via WhatsApp, envie e-mails de faturamento ou envie pushes de conformidade.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Template & dispatch control */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-sm p-6 shadow-sm space-y-6">
          <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600" /> Central de Disparo de Documentos
          </h3>

          {finalizedReports.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Não há relatórios concluídos para envio de notificações. Vá em "Inventários" e finalize um laudo técnico.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select report */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Escolher Laudo de Ciência para Notificar</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedReportId}
                  onChange={e => setSelectedReportId(e.target.value)}
                  id="select-report-notification"
                >
                  <option value="">-- Escolha um laudo finalizado --</option>
                  {finalizedReports.map(r => (
                    <option key={r.id} value={r.id}>{r.title} ({r.clientName})</option>
                  ))}
                </select>
              </div>

              {/* Selector channel */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setActiveChannel('WhatsApp')}
                  className={`py-3 px-4 rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex flex-col items-center gap-1.5 border cursor-pointer ${
                    activeChannel === 'WhatsApp'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50 border-slate-150 hover:bg-slate-100 text-slate-600'
                  }`}
                  id="btn-whatsapp-channel"
                >
                  <MessageSquare className="w-5 h-5" />
                  WhatsApp Link
                </button>
                <button
                  onClick={() => setActiveChannel('E-mail')}
                  className={`py-3 px-4 rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex flex-col items-center gap-1.5 border cursor-pointer ${
                    activeChannel === 'E-mail'
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-slate-50 border-slate-150 hover:bg-slate-100 text-slate-600'
                  }`}
                  id="btn-email-channel"
                >
                  <Mail className="w-5 h-5" />
                  E-mail Seguro
                </button>
                <button
                  onClick={() => setActiveChannel('Push')}
                  className={`py-3 px-4 rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex flex-col items-center gap-1.5 border cursor-pointer ${
                    activeChannel === 'Push'
                      ? 'bg-sky-50 border-sky-200 text-sky-800'
                      : 'bg-slate-50 border-slate-150 hover:bg-slate-100 text-slate-600'
                  }`}
                  id="btn-push-channel"
                >
                  <Bell className="w-5 h-5" />
                  Push Notification
                </button>
              </div>

              {/* Template Editor */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Modelo da Mensagem</span>
                  <span className="text-[9px] font-mono text-slate-400">VAR: &#123;nome_cliente&#125;, &#123;titulo_laudo&#125;</span>
                </div>

                {activeChannel === 'WhatsApp' && (
                  <textarea
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-24 font-mono"
                    value={waTemplate}
                    onChange={e => setWaTemplate(e.target.value)}
                    id="wa-template-textarea"
                  />
                )}

                {activeChannel === 'E-mail' && (
                  <textarea
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-32 font-mono"
                    value={emailTemplate}
                    onChange={e => setEmailTemplate(e.target.value)}
                    id="email-template-textarea"
                  />
                )}

                {activeChannel === 'Push' && (
                  <textarea
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-16 font-mono"
                    value={pushTemplate}
                    onChange={e => setPushTemplate(e.target.value)}
                    id="push-template-textarea"
                  />
                )}

                {/* Preview block */}
                <div className="bg-white border border-slate-200 p-3 rounded-sm">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prévia Real da Mensagem</span>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {activeChannel === 'WhatsApp' && renderTemplate(waTemplate, selectedReport)}
                    {activeChannel === 'E-mail' && renderTemplate(emailTemplate, selectedReport)}
                    {activeChannel === 'Push' && renderTemplate(pushTemplate, selectedReport)}
                  </p>
                </div>
              </div>

              {/* Status and Trigger buttons */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-xs text-blue-600 font-semibold italic">
                  {simulationStatus && (
                    <span className="flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {simulationStatus}
                    </span>
                  )}
                </div>

                <div className="w-full sm:w-auto flex gap-2">
                  {activeChannel === 'WhatsApp' && (
                    <button
                      onClick={handleSendWhatsApp}
                      className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                      id="send-wa-trigger"
                    >
                      <MessageSquare className="w-4 h-4" /> Abrir no WhatsApp
                    </button>
                  )}

                  {activeChannel === 'E-mail' && (
                    <button
                      onClick={handleSendEmail}
                      className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                      id="send-email-trigger"
                    >
                      <Mail className="w-4 h-4" /> Disparar E-mail
                    </button>
                  )}

                  {activeChannel === 'Push' && (
                    <button
                      onClick={handleSendPush}
                      className="w-full sm:w-auto px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                      id="send-push-trigger"
                    >
                      <Bell className="w-4 h-4" /> Enviar Push
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Dispatch Log / History */}
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm flex flex-col h-[520px]">
          <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2 mb-4 shrink-0">
            <ListFilter className="w-4 h-4 text-blue-600" /> Histórico de Disparos
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {notificationLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Nenhum disparo registrado nesta sessão.
              </div>
            ) : (
              [...notificationLogs].reverse().map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 border border-slate-150 rounded-sm space-y-1.5 animate-fade-in" id={`log-item-${log.id}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                      log.type === 'WhatsApp' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                      log.type === 'E-mail' ? 'bg-blue-50 text-blue-800 border border-blue-100' :
                      'bg-sky-50 text-sky-800 border border-sky-100'
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {new Date(log.sentAt).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-700 font-bold uppercase tracking-tight">Destino: {log.recipient}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-3 leading-relaxed bg-white border border-slate-150 p-2 rounded-sm font-mono">
                    {log.message}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold uppercase justify-end tracking-wider">
                    <CheckCircle className="w-3 h-3" /> Enviado
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Web Push Permission and Alerter Preferences Setup Card */}
      <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-sm p-6 shadow-sm space-y-6" id="push-preferences-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div className="space-y-1">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-sky-600" /> Configurações de Web Push Notifications (Alertas do Navegador)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gerencie as permissões do sistema para disparar alertas visuais em tempo real diretamente na área de trabalho ou dispositivo móvel.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Status indicator */}
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Permissão:</span>
            {(pushPermission === 'granted' || pushPermission === 'simulated_granted') ? (
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-150 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 animate-fade-in">
                <Check className="w-3.5 h-3.5" /> Ativa / Permitida
              </span>
            ) : (pushPermission === 'denied' || pushPermission === 'simulated_denied') ? (
              <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-150 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <BellOff className="w-3.5 h-3.5" /> Bloqueada
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5 animate-pulse" /> Não Solicitada
              </span>
            )}

            {/* Simulated Override Switch for developer tests */}
            <button
              onClick={handleToggleSimulatedPermission}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-sm border border-slate-200 dark:border-slate-700 text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer"
              title="Alternar estado de permissão simulado para testes rápidos no ambiente sandbox."
              id="btn-override-push-permission"
            >
              Simular Alternância
            </button>
          </div>
        </div>

        {/* Info Box about service workers and browser permissions */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 p-4 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-3 items-start max-w-2xl">
            <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">Ativação Instantânea das Notificações</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                As notificações Push utilizam as APIs nativas do navegador para assegurar que você receba atualizações urgentes mesmo trabalhando em outras abas do navegador ou com o painel em segundo plano.
              </p>
            </div>
          </div>

          <button
            onClick={requestBrowserPushPermission}
            className={`px-5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0 shadow-sm flex items-center gap-2 ${
              (pushPermission === 'granted' || pushPermission === 'simulated_granted')
                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-850 cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                : 'bg-sky-600 hover:bg-sky-700 text-white border border-sky-600 hover:border-sky-700'
            }`}
            disabled={(pushPermission === 'granted' || pushPermission === 'simulated_granted')}
            id="btn-request-browser-notification-permission"
          >
            <Bell className="w-4 h-4" />
            {(pushPermission === 'granted' || pushPermission === 'simulated_granted')
              ? 'Permissão Concedida'
              : 'Solicitar Permissão no Navegador'
            }
          </button>
        </div>

        {/* Alerts Preferences Configuration Grid */}
        <div className="space-y-4">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Selecione quais tipos de alertas deseja receber</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card option: Vencimento de Contrato */}
              <label 
                className={`p-4 border rounded-sm flex items-start gap-3 transition-all cursor-pointer ${
                  prefContractExpiry 
                    ? 'bg-blue-50/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/60' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
                id="label-pref-contract-expiry"
              >
                <input 
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded-sm border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer animate-none"
                  checked={prefContractExpiry}
                  onChange={e => setPrefContractExpiry(e.target.checked)}
                />
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Alertas de Vencimento de Contrato
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    Receba avisos automáticos antes do término de qualquer contrato comercial ativo para planejar renovações oportunas.
                  </span>
                </div>
              </label>

              {/* Card option: Finalização de Laudo */}
              <label 
                className={`p-4 border rounded-sm flex items-start gap-3 transition-all cursor-pointer ${
                  prefReportCompletion 
                    ? 'bg-blue-50/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/60' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
                id="label-pref-report-completion"
              >
                <input 
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded-sm border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer animate-none"
                  checked={prefReportCompletion}
                  onChange={e => setPrefReportCompletion(e.target.checked)}
                />
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Alertas de Finalização de Laudo
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    Seja alertado no exato instante em que um laudo de vistoria de ativos for finalizado e assinado digitalmente pelas partes.
                  </span>
                </div>
              </label>

              {/* Card option: Agendamento de Vistorias */}
              <label 
                className={`p-4 border rounded-sm flex items-start gap-3 transition-all cursor-pointer ${
                  prefNewSchedule 
                    ? 'bg-blue-50/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/60' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
                id="label-pref-new-schedule"
              >
                <input 
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded-sm border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer animate-none"
                  checked={prefNewSchedule}
                  onChange={e => setPrefNewSchedule(e.target.checked)}
                />
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-sky-500 shrink-0" /> Vistorias Agendadas para o Dia
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    Lembretes diários no início do expediente com o cronograma de inspeções e vistorias agendadas para o dia atual.
                  </span>
                </div>
              </label>

              {/* Card option: Notificações de Segurança */}
              <label 
                className={`p-4 border rounded-sm flex items-start gap-3 transition-all cursor-pointer ${
                  prefSystemAlerts 
                    ? 'bg-blue-50/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/60' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
                id="label-pref-system-alerts"
              >
                <input 
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded-sm border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer animate-none"
                  checked={prefSystemAlerts}
                  onChange={e => setPrefSystemAlerts(e.target.checked)}
                />
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-purple-500 shrink-0" /> Atualizações e Alertas do Sistema
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    Receba avisos sobre novidades na plataforma, sincronização em nuvem e manutenções agendadas no sistema.
                  </span>
                </div>
              </label>

            </div>
          </div>

          {/* Test area */}
          <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700 p-4 rounded-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                🧪 Área de Simulação e Testes Web Push
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">Dispara eventos instantâneos para fins de auditoria</span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handleTestNotification('contract')}
                className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
                  prefContractExpiry && (pushPermission === 'granted' || pushPermission === 'simulated_granted')
                    ? 'bg-white dark:bg-slate-850 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-850 cursor-not-allowed'
                }`}
                disabled={!prefContractExpiry || !(pushPermission === 'granted' || pushPermission === 'simulated_granted')}
                id="btn-test-contract-expiry-push"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Testar Alerta de Vencimento
              </button>

              <button
                onClick={() => handleTestNotification('report')}
                className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
                  prefReportCompletion && (pushPermission === 'granted' || pushPermission === 'simulated_granted')
                    ? 'bg-white dark:bg-slate-850 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-850 cursor-not-allowed'
                }`}
                disabled={!prefReportCompletion || !(pushPermission === 'granted' || pushPermission === 'simulated_granted')}
                id="btn-test-report-completion-push"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Testar Alerta de Finalização de Laudo
              </button>
            </div>

            {notificationSuccessMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 animate-fade-in animate-pulse" id="test-success-toast">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{notificationSuccessMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

