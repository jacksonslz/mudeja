import React, { useRef, useState, useEffect } from 'react';
import { Check, Trash2, Edit2, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { ServiceProvider } from '../types';

interface SignatureCanvasProps {
  onSave: (
    clientSig: { name: string; document: string; signatureDataUrl: string },
    providerSig: { name: string; document: string; signatureDataUrl: string }
  ) => void;
  onCancel: () => void;
  initialClientName?: string;
  initialClientDocument?: string;
  providersList: ServiceProvider[];
}

export default function SignatureCanvas({
  onSave,
  onCancel,
  initialClientName = '',
  initialClientDocument = '',
  providersList = []
}: SignatureCanvasProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Client States
  const clientCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [clientName, setClientName] = useState(initialClientName);
  const [clientDocument, setClientDocument] = useState(initialClientDocument);
  const [clientHasDrawn, setClientHasDrawn] = useState(false);

  // Step 2: Provider States
  const providerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('manual');
  const [providerName, setProviderName] = useState('');
  const [providerDocument, setProviderDocument] = useState('');
  const [providerHasDrawn, setProviderHasDrawn] = useState(false);

  // Canvas initialization and resizing
  useEffect(() => {
    const canvas = step === 1 ? clientCanvasRef.current : providerCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize canvas if it hasn't been sized yet
    if (canvas.width <= 0 || canvas.height <= 0 || !canvas.getAttribute('data-initialized')) {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a'; // slate-900
      ctx.lineWidth = 2.5;
      canvas.setAttribute('data-initialized', 'true');
    }
  }, [step]);

  // Handle dropdown selection change for Service Provider
  const handleProviderSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProviderId(val);
    setError('');

    if (val === 'manual') {
      setProviderName('');
      setProviderDocument('');
    } else {
      const found = providersList.find(p => p.id === val);
      if (found) {
        setProviderName(found.name);
        setProviderDocument(found.cpf);
      }
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = step === 1 ? clientCanvasRef.current : providerCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = step === 1 ? clientCanvasRef.current : providerCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    if (step === 1) {
      setClientHasDrawn(true);
    } else {
      setProviderHasDrawn(true);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = step === 1 ? clientCanvasRef.current : providerCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (step === 1) {
      setClientHasDrawn(false);
    } else {
      setProviderHasDrawn(false);
    }
    setError('');
  };

  // Step 1: Advance to Step 2
  const handleNextStep = () => {
    if (!clientName.trim()) {
      setError('Por favor, informe o nome do cliente.');
      return;
    }
    if (!clientDocument.trim()) {
      setError('Por favor, informe o CPF ou CNPJ do cliente.');
      return;
    }
    if (!clientHasDrawn) {
      setError('Por favor, faça a assinatura do cliente no campo de desenho.');
      return;
    }

    setError('');
    setStep(2);
  };

  // Step 2: Finalize Signatures
  const handleFinalizeSignatures = () => {
    if (!providerName.trim()) {
      setError('Por favor, informe o nome do prestador/motorista.');
      return;
    }
    if (!providerDocument.trim()) {
      setError('Por favor, informe o CPF do prestador/motorista.');
      return;
    }
    if (!providerHasDrawn) {
      setError('Por favor, faça a assinatura do prestador/motorista no campo de desenho.');
      return;
    }

    const clientCanvas = clientCanvasRef.current;
    const providerCanvas = providerCanvasRef.current;
    if (!clientCanvas || !providerCanvas) return;

    const clientSignatureDataUrl = clientCanvas.toDataURL('image/png');
    const providerSignatureDataUrl = providerCanvas.toDataURL('image/png');

    onSave(
      {
        name: clientName,
        document: clientDocument,
        signatureDataUrl: clientSignatureDataUrl
      },
      {
        name: providerName,
        document: providerDocument,
        signatureDataUrl: providerSignatureDataUrl
      }
    );
  };

  return (
    <div className="bg-white rounded-sm border border-slate-200 shadow-lg p-6 max-w-lg w-full mx-auto" id="signature-wizard-modal">
      
      {/* Header with step indicator */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">
              Assinatura Digital de Retirada
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">
              {step === 1 ? 'Etapa 1 de 2: Ciência do Cliente' : 'Etapa 2 de 2: Retirada pelo Motorista'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
          <span className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
        </div>
      </div>

      {/* STEP 1: CLIENT SIGNATURE */}
      <div className={step === 1 ? 'block space-y-4' : 'hidden space-y-4'} id="signature-step-1">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Nome Completo do Cliente / Contratante *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nome do cliente que concede ciência"
            value={clientName}
            onChange={(e) => {
              setClientName(e.target.value);
              setError('');
            }}
            id="client-name-input"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            CPF ou CNPJ do Cliente *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="000.000.000-00 ou 00.000.000/0001-00"
            value={clientDocument}
            onChange={(e) => {
              setClientDocument(e.target.value);
              setError('');
            }}
            id="client-document-input"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Assinatura do Cliente (Desenhe abaixo) *
            </label>
            <button
              type="button"
              onClick={clearCanvas}
              className="text-[10px] text-rose-500 hover:text-rose-600 flex items-center gap-1 font-bold uppercase tracking-wider cursor-pointer"
              id="clear-client-sig-btn"
            >
              <Trash2 className="w-3.5 h-3.5" /> Limpar
            </button>
          </div>
          <div className="relative border border-dashed border-slate-300 bg-slate-50 overflow-hidden h-40 cursor-crosshair rounded-sm">
            <canvas
              ref={clientCanvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="absolute inset-0 w-full h-full"
              id="client-signature-canvas"
            />
            {!clientHasDrawn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
                <Edit2 className="w-5 h-5 mb-1 animate-pulse text-slate-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Desenhe a assinatura aqui</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider" id="step1-error-msg">{error}</p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-sm uppercase tracking-wider transition cursor-pointer"
            id="cancel-step1-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleNextStep}
            className="flex-1 py-2 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-sm uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
            id="next-step-btn"
          >
            Avançar <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* STEP 2: PROVIDER SIGNATURE */}
      <div className={step === 2 ? 'block space-y-4' : 'hidden space-y-4'} id="signature-step-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Selecionar Motorista / Prestador cadastrado
          </label>
          <select
            className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={selectedProviderId}
            onChange={handleProviderSelectChange}
            id="provider-select-dropdown"
          >
            <option value="manual">Preencher manualmente...</option>
            {providersList.map(prov => (
              <option key={prov.id} value={prov.id}>
                {prov.name} ({prov.truckDetails || 'Sem veículo cadastrado'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Nome do Motorista / Prestador *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nome de quem está retirando os bens"
            value={providerName}
            onChange={(e) => {
              setProviderName(e.target.value);
              setError('');
            }}
            id="provider-name-input"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            CPF do Motorista / Prestador *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="000.000.000-00"
            value={providerDocument}
            onChange={(e) => {
              setProviderDocument(e.target.value);
              setError('');
            }}
            id="provider-document-input"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Assinatura do Motorista (Desenhe abaixo) *
            </label>
            <button
              type="button"
              onClick={clearCanvas}
              className="text-[10px] text-rose-500 hover:text-rose-600 flex items-center gap-1 font-bold uppercase tracking-wider cursor-pointer"
              id="clear-provider-sig-btn"
            >
              <Trash2 className="w-3.5 h-3.5" /> Limpar
            </button>
          </div>
          <div className="relative border border-dashed border-slate-300 bg-slate-50 overflow-hidden h-40 cursor-crosshair rounded-sm">
            <canvas
              ref={providerCanvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="absolute inset-0 w-full h-full"
              id="provider-signature-canvas"
            />
            {!providerHasDrawn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
                <Edit2 className="w-5 h-5 mb-1 animate-pulse text-slate-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Desenhe a assinatura aqui</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider" id="step2-error-msg">{error}</p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setError('');
              setStep(1);
            }}
            className="flex-1 py-2 px-4 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-sm uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
            id="prev-step-btn"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <button
            type="button"
            onClick={handleFinalizeSignatures}
            className="flex-1 py-2 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-sm uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
            id="confirm-all-signatures-btn"
          >
            <Check className="w-4 h-4" /> Finalizar e Assinar
          </button>
        </div>
      </div>
    </div>
  );
}
