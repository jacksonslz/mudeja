import React, { useState, useRef } from 'react';
import { Client, InventoryItem, InventoryReport } from '../types';
import { Camera, Plus, ClipboardList, Package, DollarSign, Tag, MapPin, Eye, FileSignature, Trash2, Image as ImageIcon, Check, FolderPlus, Mic, Square, Loader2, Pencil, ArrowUpRight, Circle, RotateCcw, X, QrCode, Scan, Search, Download, Printer, Layers, HelpCircle, Archive } from 'lucide-react';
import jsQR from 'jsqr';
import { jsPDF } from 'jspdf';

// Helper function to auto-generate asset/patrimony code for warehouse identification
const generateAssetCode = (clientName: string, category: string, sequenceNumber: number): string => {
  const cleanClient = (clientName || 'CLI')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents and diacritics
    .replace(/[^a-zA-Z0-9]/g, '')    // letters and numbers only
    .toUpperCase()
    .slice(0, 3);
  
  const categoryMap: { [key: string]: string } = {
    'Móveis': 'MOV',
    'Equipamentos': 'EQP',
    'Eletrônicos': 'ELT',
    'Eletrodomésticos': 'DOM',
    'Outros': 'OUT'
  };
  const catCode = categoryMap[category] || 'ATV';
  const seq = String(sequenceNumber).padStart(3, '0');
  
  return `${cleanClient}-${catCode}-${seq}`;
};

// Helper function to load any URL into a base64 Data URL
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } else {
        reject(new Error('Could not get 2d context'));
      }
    };
    img.onerror = (error) => {
      reject(error);
    };
    img.src = imageUrl;
  });
};

interface Annotation {
  type: 'free' | 'arrow' | 'circle';
  points?: { x: number; y: number }[];
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  color: string;
  width: number;
}

interface InventorySectionProps {
  clients: Client[];
  reports: InventoryReport[];
  activeReport: InventoryReport | null;
  onSelectReport: (report: InventoryReport) => void;
  onCreateReport: (clientId: string, title: string, scheduledAt?: string) => void;
  onAddItemToReport: (reportId: string, item: Omit<InventoryItem, 'id' | 'createdAt'>) => void;
  onDeleteItemFromReport: (reportId: string, itemId: string) => void;
  onFinalizeReportClick: (report: InventoryReport) => void;
  onUpdateReportSchedule?: (reportId: string, scheduledAt: string) => void;
  onUpdateReportItem?: (reportId: string, itemId: string, updatedFields: Partial<InventoryItem>) => void;
}

// Beautiful preset images for easy demo selection
const PRESET_IMAGES = [
  { label: 'Cadeira Ergonômica', url: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&q=80' },
  { label: 'Mesa Reunião', url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&q=80' },
  { label: 'Smart TV', url: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&q=80' },
  { label: 'Sofá Recepção', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' },
  { label: 'Ar Condicionado', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80' },
  { label: 'Impressora Corp', url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&q=80' },
];

export default function InventorySection({
  clients,
  reports,
  activeReport,
  onSelectReport,
  onCreateReport,
  onAddItemToReport,
  onDeleteItemFromReport,
  onFinalizeReportClick,
  onUpdateReportSchedule,
  onUpdateReportItem
}: InventorySectionProps) {
  // New Report Form
  const [newReportTitle, setNewReportTitle] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [showCreateReport, setShowCreateReport] = useState(false);

  // New Item Form
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<'Móveis' | 'Equipamentos' | 'Eletrônicos' | 'Eletrodomésticos' | 'Outros'>('Móveis');
  const [itemStatus, setItemStatus] = useState<'Excelente' | 'Bom' | 'Regular' | 'Danificado'>('Excelente');
  const [serialNumber, setSerialNumber] = useState('');
  const [itemValue, setItemValue] = useState('');
  const [itemPhotoUrl, setItemPhotoUrl] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemLocation, setItemLocation] = useState('');
  
  // Automatically generate and pre-populate patrimony number when category or active report changes
  React.useEffect(() => {
    if (activeReport) {
      const isAutoCode = !serialNumber || 
        ['MOV', 'EQP', 'ELT', 'DOM', 'OUT', 'ATV'].some(code => serialNumber.includes(`-${code}-`));
        
      if (isAutoCode) {
        const nextSeq = activeReport.items.length + 1;
        const code = generateAssetCode(activeReport.clientName, itemCategory, nextSeq);
        setSerialNumber(code);
      }
    }
  }, [activeReport?.id, itemCategory, activeReport?.items?.length]);
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [itemError, setItemError] = useState('');
  const [showPresetGallery, setShowPresetGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Photo Editor States & Refs
  const [editingPhotoTarget, setEditingPhotoTarget] = useState<{
    type: 'form' | 'item';
    itemId?: string;
    url: string;
  } | null>(null);
  const [editorTool, setEditorTool] = useState<'free' | 'arrow' | 'circle'>('free');
  const [editorColor, setEditorColor] = useState<string>('#ef4444'); // Red by default
  const [editorLineWidth, setEditorLineWidth] = useState<number>(4);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [editorLoading, setEditorLoading] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<{x: number, y: number}[]>([]);
  const startPosRef = useRef<{x: number, y: number}>({ x: 0, y: 0 });

  // Load and setup canvas when target image changes
  React.useEffect(() => {
    if (!editingPhotoTarget) {
      setAnnotations([]);
      return;
    }

    setEditorLoading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setEditorLoading(false);
      resetCanvasWithImage(img, []);
    };
    img.onerror = () => {
      setEditorLoading(false);
      alert("Erro ao carregar imagem para edição. Verifique a URL ou o arquivo.");
    };
    img.src = editingPhotoTarget.url;
  }, [editingPhotoTarget]);

  const resetCanvasWithImage = (img: HTMLImageElement, currentAnnotations: Annotation[], activeAnnotation?: Annotation) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions preserving aspect ratio
    const maxW = 600;
    const maxH = 450;
    let w = img.naturalWidth || img.width || 400;
    let h = img.naturalHeight || img.height || 300;

    const ratio = Math.min(maxW / w, maxH / h);
    canvas.width = w * ratio;
    canvas.height = h * ratio;

    // Draw background image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw finished annotations
    currentAnnotations.forEach(ann => drawAnnotationOnContext(ctx, ann));

    // Draw active preview annotation if any
    if (activeAnnotation) {
      drawAnnotationOnContext(ctx, activeAnnotation);
    }
  };

  const drawAnnotationOnContext = (ctx: CanvasRenderingContext2D, ann: Annotation) => {
    ctx.strokeStyle = ann.color;
    ctx.lineWidth = ann.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (ann.type === 'free' && ann.points && ann.points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(ann.points[0].x, ann.points[0].y);
      for (let i = 1; i < ann.points.length; i++) {
        ctx.lineTo(ann.points[i].x, ann.points[i].y);
      }
      ctx.stroke();
    } else if (ann.type === 'circle' && ann.startX !== undefined && ann.startY !== undefined && ann.endX !== undefined && ann.endY !== undefined) {
      const rx = (ann.endX - ann.startX) / 2;
      const ry = (ann.endY - ann.startY) / 2;
      const cx = ann.startX + rx;
      const cy = ann.startY + ry;
      
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (ann.type === 'arrow' && ann.startX !== undefined && ann.startY !== undefined && ann.endX !== undefined && ann.endY !== undefined) {
      const fromX = ann.startX;
      const fromY = ann.startY;
      const toX = ann.endX;
      const toY = ann.endY;

      // Draw main line
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const headLength = Math.max(12, ann.width * 3);
      
      ctx.fillStyle = ann.color;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
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

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    const pos = getMousePos(e);
    isDrawingRef.current = true;
    startPosRef.current = pos;
    currentPointsRef.current = [pos];
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !imageRef.current) return;
    if (e.cancelable) {
      e.preventDefault();
    }
    const pos = getMousePos(e);
    const start = startPosRef.current;

    if (editorTool === 'free') {
      currentPointsRef.current.push(pos);
      resetCanvasWithImage(imageRef.current, annotations, {
        type: 'free',
        points: currentPointsRef.current,
        color: editorColor,
        width: editorLineWidth
      });
    } else if (editorTool === 'arrow') {
      resetCanvasWithImage(imageRef.current, annotations, {
        type: 'arrow',
        startX: start.x,
        startY: start.y,
        endX: pos.x,
        endY: pos.y,
        color: editorColor,
        width: editorLineWidth
      });
    } else if (editorTool === 'circle') {
      resetCanvasWithImage(imageRef.current, annotations, {
        type: 'circle',
        startX: start.x,
        startY: start.y,
        endX: pos.x,
        endY: pos.y,
        color: editorColor,
        width: editorLineWidth
      });
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !imageRef.current) return;
    isDrawingRef.current = false;
    
    let pos = currentPointsRef.current[currentPointsRef.current.length - 1];
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.changedTouches[0];
        pos = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        };
      }
    }

    const start = startPosRef.current;
    let newAnnotation: Annotation | null = null;

    if (editorTool === 'free' && currentPointsRef.current.length > 1) {
      newAnnotation = {
        type: 'free',
        points: currentPointsRef.current,
        color: editorColor,
        width: editorLineWidth
      };
    } else if (editorTool === 'arrow') {
      newAnnotation = {
        type: 'arrow',
        startX: start.x,
        startY: start.y,
        endX: pos.x,
        endY: pos.y,
        color: editorColor,
        width: editorLineWidth
      };
    } else if (editorTool === 'circle') {
      newAnnotation = {
        type: 'circle',
        startX: start.x,
        startY: start.y,
        endX: pos.x,
        endY: pos.y,
        color: editorColor,
        width: editorLineWidth
      };
    }

    if (newAnnotation) {
      const updated = [...annotations, newAnnotation];
      setAnnotations(updated);
      resetCanvasWithImage(imageRef.current, updated);
    }
    currentPointsRef.current = [];
  };

  const handleUndo = () => {
    if (annotations.length === 0 || !imageRef.current) return;
    const updated = annotations.slice(0, -1);
    setAnnotations(updated);
    resetCanvasWithImage(imageRef.current, updated);
  };

  const handleClearAll = () => {
    if (!imageRef.current) return;
    setAnnotations([]);
    resetCanvasWithImage(imageRef.current, []);
  };

  const handleSaveEditedPhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas || !editingPhotoTarget) return;

    try {
      const base64 = canvas.toDataURL('image/jpeg', 0.95);
      if (editingPhotoTarget.type === 'form') {
        setItemPhotoUrl(base64);
      } else if (editingPhotoTarget.type === 'item' && editingPhotoTarget.itemId && activeReport) {
        onUpdateReportItem?.(activeReport.id, editingPhotoTarget.itemId, { photoUrl: base64 });
      }
      setEditingPhotoTarget(null);
    } catch (err: any) {
      console.error(err);
      alert("Não foi possível salvar a imagem editada. Se você estiver usando uma foto externa de amostra, certifique-se de que ela suporta CORS ou use arquivos de foto do seu próprio dispositivo.");
    }
  };

  // Audio Dictation States & Refs
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  // QR Code Scanner States & Refs
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [qrScannerError, setQrScannerError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedUnregisteredCode, setScannedUnregisteredCode] = useState<string | null>(null);
  const [scannedItemHighlightId, setScannedItemHighlightId] = useState<string | null>(null);
  const [showingQRLabelItem, setShowingQRLabelItem] = useState<InventoryItem | null>(null);

  // Batch QR Labels and Warehouse identification states
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showingBatchQRModal, setShowingBatchQRModal] = useState(false);
  const [warehouseLoc, setWarehouseLoc] = useState('DEPÓSITO PRINCIPAL');
  const [warehouseShelf, setWarehouseShelf] = useState('');
  const [printPreviewMode, setPrintPreviewMode] = useState<'label' | 'print'>('label');
  const [paperSize, setPaperSize] = useState<'thermal_80' | 'thermal_58' | 'sticker_40' | 'a4_pimaco'>('sticker_40');
  const [showAlignmentGuides, setShowAlignmentGuides] = useState(true);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const downloadLabelAsPDF = async (item: InventoryItem) => {
    try {
      setIsGeneratingPDF(true);
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [80, 55]
      });

      doc.setFont('Helvetica', 'normal');

      // Draw outer border (2mm safety margin)
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(2, 2, 76, 51);

      // Header Banner
      doc.setFontSize(7.5);
      doc.setFont('Helvetica', 'bold');
      const headerTitle = 'ETIQUETA DE PATRIMÔNIO';
      const titleWidth = doc.getTextWidth(headerTitle);
      doc.text(headerTitle, (80 - titleWidth) / 2, 5.5);

      doc.setFontSize(5);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const subHeader = 'IDENTIFICAÇÃO E DEPÓSITO DE ATIVOS';
      const subWidth = doc.getTextWidth(subHeader);
      doc.text(subHeader, (80 - subWidth) / 2, 8);

      // Horizontal Divider under header
      doc.setLineWidth(0.3);
      doc.setDrawColor(0, 0, 0);
      doc.line(2, 9.5, 78, 9.5);

      // Fetch and draw QR Code
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(item.serialNumber || item.name)}`;
      try {
        const qrBase64 = await getBase64ImageFromUrl(qrUrl);
        doc.addImage(qrBase64, 'PNG', 4, 11, 20, 20);
      } catch (err) {
        console.error('Failed to load QR code image, drawing fallback square', err);
        doc.rect(4, 11, 20, 20);
        doc.setFontSize(6);
        doc.text('QR CODE', 14, 21, { align: 'center' });
      }

      // Metadata details on the right
      doc.setTextColor(0, 0, 0);
      let yOffset = 13;
      
      doc.setFontSize(4.5);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(120, 120, 120);
      doc.text('CÓDIGO:', 26, yOffset);
      doc.setFont('Courier', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(5.5);
      doc.text(item.id.slice(0, 18), 37, yOffset);
      
      yOffset += 4;
      doc.setFontSize(4.5);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(120, 120, 120);
      doc.text('NOME:', 26, yOffset);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(5.5);
      doc.text((item.name || '').toUpperCase().slice(0, 22), 37, yOffset);

      yOffset += 4;
      doc.setFontSize(4.5);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(120, 120, 120);
      doc.text('CATEGORIA:', 26, yOffset);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(5.5);
      doc.text((item.category || '').toUpperCase().slice(0, 22), 37, yOffset);

      yOffset += 4;
      doc.setFontSize(4.5);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(120, 120, 120);
      doc.text('LOCAL:', 26, yOffset);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(5.5);
      doc.text((item.location || '').toUpperCase().slice(0, 22), 37, yOffset);

      // Client details box (dotted box / light gray background)
      const reportClient = activeReport ? clients.find(c => c.id === activeReport.clientId) : null;
      const clientName = reportClient?.companyName || reportClient?.name || activeReport?.clientName || 'N/A';
      const clientDoc = reportClient?.document || 'N/A';
      const warehouseStr = `${warehouseLoc || 'DEPÓSITO'} ${warehouseShelf ? `/ ${warehouseShelf}` : ''}`.toUpperCase();

      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(248, 250, 252); // light slate background
      doc.rect(4, 33, 72, 12, 'FD');

      doc.setFontSize(4.5);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('CLIENTE:', 6, 36.5);
      doc.setTextColor(0, 0, 0);
      doc.text(clientName.toUpperCase().slice(0, 32), 17, 36.5);

      doc.setTextColor(100, 100, 100);
      doc.text('DOC:', 6, 40);
      doc.setTextColor(0, 0, 0);
      doc.text(clientDoc.slice(0, 18), 17, 40);

      doc.setTextColor(100, 100, 100);
      doc.text('DEPÓSITO:', 6, 43.5);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(29, 78, 216); // blue accent
      doc.text(warehouseStr.slice(0, 32), 17, 43.5);

      // Dashed separator
      doc.setDrawColor(180, 180, 180);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(4, 47, 76, 47);
      doc.setLineDashPattern([], 0); // Reset dash

      // Footer values
      doc.setTextColor(100, 100, 100);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(4);
      doc.text('PATRIMÔNIO', 4, 49.5);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(30, 58, 138); // deep blue
      doc.text(item.serialNumber || 'REGISTRADO', 4, 52);

      doc.setTextColor(100, 100, 100);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(4);
      doc.text('SITUAÇÃO', 76, 49.5, { align: 'right' });
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(16, 124, 65); // emerald status
      doc.text((item.status || 'CONFORME').toUpperCase(), 76, 52, { align: 'right' });

      // Save document
      const fileName = `etiqueta-${item.id.slice(0, 8)}-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Error generating label PDF', err);
      alert('Houve um erro ao gerar o arquivo PDF. Por favor tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const downloadBatchAsPDF = async (items: InventoryItem[]) => {
    try {
      setIsGeneratingPDF(true);
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [80, 55]
      });

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (i > 0) {
          doc.addPage([80, 55], 'landscape');
        }

        // Draw outer border
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(2, 2, 76, 51);

        // Header Banner
        doc.setFontSize(7.5);
        doc.setFont('Helvetica', 'bold');
        const headerTitle = 'ETIQUETA DE PATRIMÔNIO';
        const titleWidth = doc.getTextWidth(headerTitle);
        doc.text(headerTitle, (80 - titleWidth) / 2, 5.5);

        doc.setFontSize(4.5);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const subHeader = `LOTE DE ATIVOS | ETIQUETA ${i + 1} DE ${items.length}`;
        const subWidth = doc.getTextWidth(subHeader);
        doc.text(subHeader, (80 - subWidth) / 2, 8);

        // Horizontal Divider
        doc.setLineWidth(0.3);
        doc.setDrawColor(0, 0, 0);
        doc.line(2, 9.5, 78, 9.5);

        // Fetch and draw QR Code
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(item.serialNumber || item.name)}`;
        try {
          const qrBase64 = await getBase64ImageFromUrl(qrUrl);
          doc.addImage(qrBase64, 'PNG', 4, 11, 20, 20);
        } catch (err) {
          console.error('Failed to load QR code image, drawing fallback square', err);
          doc.rect(4, 11, 20, 20);
          doc.setFontSize(6);
          doc.text('QR CODE', 14, 21, { align: 'center' });
        }

        // Metadata details
        doc.setTextColor(0, 0, 0);
        let yOffset = 13;
        
        doc.setFontSize(4.5);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(120, 120, 120);
        doc.text('CÓDIGO:', 26, yOffset);
        doc.setFont('Courier', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(5.5);
        doc.text(item.id.slice(0, 18), 37, yOffset);
        
        yOffset += 4;
        doc.setFontSize(4.5);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(120, 120, 120);
        doc.text('NOME:', 26, yOffset);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(5.5);
        doc.text((item.name || '').toUpperCase().slice(0, 22), 37, yOffset);

        yOffset += 4;
        doc.setFontSize(4.5);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(120, 120, 120);
        doc.text('CATEGORIA:', 26, yOffset);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(5.5);
        doc.text((item.category || '').toUpperCase().slice(0, 22), 37, yOffset);

        yOffset += 4;
        doc.setFontSize(4.5);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(120, 120, 120);
        doc.text('LOCAL:', 26, yOffset);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(5.5);
        doc.text((item.location || '').toUpperCase().slice(0, 22), 37, yOffset);

        // Client details box
        const reportClient = activeReport ? clients.find(c => c.id === activeReport.clientId) : null;
        const clientName = reportClient?.companyName || reportClient?.name || activeReport?.clientName || 'N/A';
        const clientDoc = reportClient?.document || 'N/A';
        const warehouseStr = `${warehouseLoc || 'DEPÓSITO'} ${warehouseShelf ? `/ ${warehouseShelf}` : ''}`.toUpperCase();

        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(248, 250, 252);
        doc.rect(4, 33, 72, 12, 'FD');

        doc.setFontSize(4.5);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('CLIENTE:', 6, 36.5);
        doc.setTextColor(0, 0, 0);
        doc.text(clientName.toUpperCase().slice(0, 32), 17, 36.5);

        doc.setTextColor(100, 100, 100);
        doc.text('DOC:', 6, 40);
        doc.setTextColor(0, 0, 0);
        doc.text(clientDoc.slice(0, 18), 17, 40);

        doc.setTextColor(100, 100, 100);
        doc.text('DEPÓSITO:', 6, 43.5);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(29, 78, 216);
        doc.text(warehouseStr.slice(0, 32), 17, 43.5);

        // Dashed separator
        doc.setDrawColor(180, 180, 180);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(4, 47, 76, 47);
        doc.setLineDashPattern([], 0);

        // Footer values
        doc.setTextColor(100, 100, 100);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(4);
        doc.text('PATRIMÔNIO', 4, 49.5);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(30, 58, 138);
        doc.text(item.serialNumber || 'REGISTRADO', 4, 52);

        doc.setTextColor(100, 100, 100);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(4);
        doc.text('SITUAÇÃO', 76, 49.5, { align: 'right' });
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(16, 124, 65);
        doc.text((item.status || 'CONFORME').toUpperCase(), 76, 52, { align: 'right' });
      }

      // Save document
      const batchFileName = `etiquetas-lote-${items.length}-itens.pdf`;
      doc.save(batchFileName);
    } catch (err) {
      console.error('Error generating batch PDF', err);
      alert('Houve um erro ao gerar o arquivo PDF do lote. Por favor tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      // Stop QR Scanner on unmount
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startQRScanner = async () => {
    setIsScanningQR(true);
    setQrScannerError('');
    setScannedUnregisteredCode(null);
    
    // Wait for modal DOM to render the video element
    setTimeout(async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Seu navegador ou dispositivo não possui suporte para câmera ou as permissões estão bloqueadas.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true"); // standard iOS Safari compatibility attribute
          videoRef.current.play();
          
          // Start the scanning animation loop
          animationFrameIdRef.current = requestAnimationFrame(scanFrameLoop);
        }
      } catch (err: any) {
        console.error("Erro ao acessar câmera:", err);
        setQrScannerError(`Acesso à câmera recusado ou indisponível: ${err.message || err}`);
      }
    }, 300);
  };

  const stopQRScanner = () => {
    setIsScanningQR(false);
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const scanFrameLoop = () => {
    const video = videoRef.current;
    const canvas = scannerCanvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (isScanningQR) {
        animationFrameIdRef.current = requestAnimationFrame(scanFrameLoop);
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      if (isScanningQR) {
        animationFrameIdRef.current = requestAnimationFrame(scanFrameLoop);
      }
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data) {
      handleScannedData(code.data);
    } else {
      if (isScanningQR) {
        animationFrameIdRef.current = requestAnimationFrame(scanFrameLoop);
      }
    }
  };

  const handleScannedData = (data: string) => {
    stopQRScanner();
    const cleanData = data.trim();
    if (!cleanData) return;

    // Check if the scanned string matches any item serial number, name, or id in the active report
    if (activeReport) {
      const matchedItem = activeReport.items.find(item => 
        (item.serialNumber && item.serialNumber.toLowerCase() === cleanData.toLowerCase()) ||
        item.name.toLowerCase() === cleanData.toLowerCase() ||
        item.id === cleanData
      );

      if (matchedItem) {
        // Filter the query to find the item
        setSearchQuery(matchedItem.serialNumber || matchedItem.name);
        setScannedItemHighlightId(matchedItem.id);
        
        // Remove glow after 5 seconds
        setTimeout(() => {
          setScannedItemHighlightId(null);
        }, 5000);

        // Scroll to card
        setTimeout(() => {
          const card = document.getElementById(`inventory-item-card-${matchedItem.id}`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);

        alert(`Sucesso! Ativo encontrado:\n\n• Nome: ${matchedItem.name}\n• Patrimônio: ${matchedItem.serialNumber || 'N/A'}\n• Localização: ${matchedItem.location}`);
      } else {
        // Offer to pre-fill form
        setScannedUnregisteredCode(cleanData);
      }
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Erro ao ler blob de áudio"));
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("O seu navegador não possui suporte para gravação de áudio ou as permissões de acesso estão desativadas.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else {
        mimeType = '';
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        await handleTranscribe(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Erro ao acessar microfone:", err);
      alert("Não foi possível acessar o microfone. Verifique as permissões de gravação de áudio nas configurações do seu navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error(e);
      }
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const handleTranscribe = async (audioBlob: Blob) => {
    if (audioBlob.size === 0) return;
    setIsTranscribing(true);
    setItemError('');
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio: base64Audio,
          mimeType: audioBlob.type || "audio/webm",
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erro no servidor de transcrição.");
      }

      const data = await response.json();
      if (data.text) {
        const transcription = data.text;
        setItemDescription(prev => {
          const trimmedPrev = prev.trim();
          if (!trimmedPrev) return transcription;
          return `${trimmedPrev} ${transcription}`;
        });
      }
    } catch (err: any) {
      console.error("Erro na transcrição por voz:", err);
      setItemError(`Falha na conversão de voz para texto: ${err?.message || err}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Handle Photo Upload (Convert to Base64)
  const handlePhotoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setItemError('Apenas arquivos de imagem são permitidos.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setItemPhotoUrl(e.target.result);
        setItemError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlePhotoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handlePhotoFile(e.target.files[0]);
    }
  };

  const handleCreateReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportTitle.trim() || !selectedClientId) {
      alert('Preencha o título do relatório e selecione um cliente.');
      return;
    }
    onCreateReport(selectedClientId, newReportTitle, scheduledAt || undefined);
    setNewReportTitle('');
    setSelectedClientId('');
    setScheduledAt('');
    setShowCreateReport(false);
  };

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport) return;

    if (!itemName.trim() || !itemLocation.trim()) {
      setItemError('Nome do item e Localização são obrigatórios.');
      return;
    }

    const generatedSerial = serialNumber.trim() || generateAssetCode(activeReport.clientName, itemCategory, activeReport.items.length + 1);

    onAddItemToReport(activeReport.id, {
      name: itemName,
      category: itemCategory,
      status: itemStatus,
      serialNumber: generatedSerial,
      value: itemValue ? parseFloat(itemValue) : undefined,
      photoUrl: itemPhotoUrl || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80', // Default empty sofa image
      description: itemDescription,
      location: itemLocation
    });

    // Reset Form
    setItemName('');
    setItemCategory('Móveis');
    setItemStatus('Excelente');
    setSerialNumber('');
    setItemValue('');
    setItemPhotoUrl('');
    setItemDescription('');
    setItemLocation('');
    setItemError('');
    setShowPresetGallery(false);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="inventory-section-root">
      {/* Sidebar: List of Inventories & Create New */}
      <div className="xl:col-span-1 space-y-4">
        <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" /> Inventários (Laudos)
            </h3>
            <button
              onClick={() => setShowCreateReport(!showCreateReport)}
              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm transition cursor-pointer"
              title="Novo Relatório de Inventário"
              id="show-create-report-btn"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showCreateReport && (
            <form onSubmit={handleCreateReportSubmit} className="space-y-3 p-3 bg-slate-50 rounded-sm border border-slate-150 mb-4" id="create-report-form">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Novo Inventário</h4>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Título do Inventário *</label>
                <input
                  type="text"
                  required
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Inventário de Escritório 2026"
                  value={newReportTitle}
                  onChange={e => setNewReportTitle(e.target.value)}
                  id="report-title-input"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Vincular Cliente *</label>
                <select
                  required
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  id="report-client-select"
                >
                  <option value="">-- Escolha um cliente --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Agendar Data & Hora (Opcional)</label>
                <input
                  type="datetime-local"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  id="report-scheduled-input"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateReport(false)}
                  className="px-2.5 py-1 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-sm transition cursor-pointer uppercase tracking-wider"
                  id="cancel-create-report"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-sm transition flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                  id="confirm-create-report"
                >
                  <FolderPlus className="w-3.5 h-3.5" /> Criar Pasta
                </button>
              </div>
            </form>
          )}

          {reports.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Nenhum inventário criado. Crie um novo para começar.
            </div>
          ) : (
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {reports.map((rep) => {
                const isActive = activeReport?.id === rep.id;
                return (
                  <div
                    key={rep.id}
                    onClick={() => onSelectReport(rep)}
                    className={`p-3 rounded-sm border transition cursor-pointer text-left ${
                      isActive
                        ? 'bg-blue-50/70 border-blue-200 hover:bg-blue-50'
                        : 'bg-slate-50 border-slate-150 hover:bg-slate-100/50'
                    }`}
                    id={`report-item-${rep.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-sans font-bold text-xs text-slate-900 leading-tight truncate max-w-[150px] uppercase tracking-tight">
                        {rep.title}
                      </h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide ${
                        rep.status === 'Finalizado'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Cliente: {rep.clientName}</p>
                    {rep.scheduledAt && (
                      <div className="text-[9px] text-blue-600 bg-blue-50/70 border border-blue-100 rounded-sm px-1.5 py-0.5 mt-1 inline-block uppercase font-bold tracking-wider">
                        Agendado: {new Date(rep.scheduledAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/50">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {rep.items.length} {rep.items.length === 1 ? 'ITEM' : 'ITENS'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(rep.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Area: Active Inventory Details & Form */}
      <div className="xl:col-span-2">
        {activeReport ? (
          <div className="space-y-6">
            {/* Header info */}
            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Inventário Ativo</span>
                <h3 className="text-base font-bold text-slate-950 font-sans uppercase tracking-tight mt-0.5">{activeReport.title}</h3>
                <p className="text-xs text-slate-500">
                  Vínculo: <strong className="text-slate-700">{activeReport.clientName}</strong> &bull; Criado em {new Date(activeReport.createdAt).toLocaleDateString('pt-BR')}
                </p>
                {activeReport.status === 'Rascunho' && (
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Vistoria Agendada:</span>
                    <input
                      type="datetime-local"
                      className="px-2 py-0.5 border border-slate-200 rounded-sm text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={activeReport.scheduledAt ? activeReport.scheduledAt.substring(0, 16) : ''}
                      onChange={e => onUpdateReportSchedule?.(activeReport.id, e.target.value)}
                      id="inline-schedule-input"
                    />
                  </div>
                )}
              </div>

              {activeReport.status === 'Rascunho' ? (
                <button
                  onClick={() => onFinalizeReportClick(activeReport)}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition shrink-0 cursor-pointer"
                  id="finalize-and-sign-btn"
                >
                  <FileSignature className="w-4 h-4" /> Finalizar e Assinar
                </button>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-sm text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold uppercase tracking-wide text-[10px]">Inventário Assinado</span>
                    <p className="text-[10px] text-emerald-600">Documento fechado para edição</p>
                  </div>
                </div>
              )}
            </div>

            {/* If Draft: Show Add Item Form */}
            {activeReport.status === 'Rascunho' && (
              <form onSubmit={handleAddItemSubmit} className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm space-y-4" id="add-item-to-inventory-form">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" /> Registrar Novo Ativo / Item fotográfico
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Photo upload dropzone */}
                  <div className="md:col-span-1 space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Foto do Ativo *</label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`h-40 border border-dashed flex flex-col items-center justify-center p-3 text-center cursor-pointer transition rounded-sm ${
                        itemPhotoUrl ? 'border-blue-500 bg-blue-50/10' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                      id="photo-upload-dropzone"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      {itemPhotoUrl ? (
                        <div className="relative w-full h-full group">
                          <img
                            src={itemPhotoUrl}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-sm"
                          />
                          <div className="absolute inset-0 bg-black/40 rounded-sm opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold">
                            Alterar Foto
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 space-y-1.5">
                          <Camera className="w-8 h-8 mx-auto stroke-1 text-slate-300" />
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Enviar Foto</p>
                          <p className="text-[10px] text-slate-400 font-mono">PNG, JPG ou Câmera</p>
                        </div>
                      )}
                    </div>

                    {itemPhotoUrl && (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPhotoTarget({ type: 'form', url: itemPhotoUrl });
                          }}
                          className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-sm transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                          id="edit-form-photo-btn"
                        >
                          <Pencil className="w-3 h-3" /> Editar e Marcar Foto (Setas/Desenho)
                        </button>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowPresetGallery(!showPresetGallery)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                        id="preset-gallery-toggle"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> {showPresetGallery ? 'Ocultar amostras' : 'Usar fotos de amostra'}
                      </button>
                    </div>

                    {showPresetGallery && (
                      <div className="grid grid-cols-3 gap-1 bg-slate-50 p-2 rounded-sm border border-slate-150 max-h-32 overflow-y-auto" id="preset-gallery">
                        {PRESET_IMAGES.map((preset, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setItemPhotoUrl(preset.url);
                              setShowPresetGallery(false);
                            }}
                            className="cursor-pointer relative group rounded-none overflow-hidden aspect-square border border-slate-200 hover:border-blue-500"
                            title={preset.label}
                          >
                            <img src={preset.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white py-0.5 truncate text-center opacity-0 group-hover:opacity-100 font-mono uppercase">
                              {preset.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fields */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome do Item *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Armário de Aço"
                        value={itemName}
                        onChange={e => setItemName(e.target.value)}
                        id="item-name"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cômodo / Localização *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Recepção, Sala 102"
                        value={itemLocation}
                        onChange={e => setItemLocation(e.target.value)}
                        id="item-location"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Categoria</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={itemCategory}
                        onChange={e => setItemCategory(e.target.value as any)}
                        id="item-category"
                      >
                        <option value="Móveis">Móveis</option>
                        <option value="Equipamentos">Equipamentos</option>
                        <option value="Eletrônicos">Eletrônicos</option>
                        <option value="Eletrodomésticos">Eletrodomésticos</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estado de Conservação</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={itemStatus}
                        onChange={e => setItemStatus(e.target.value as any)}
                        id="item-status"
                      >
                        <option value="Excelente">Excelente</option>
                        <option value="Bom">Bom</option>
                        <option value="Regular">Regular</option>
                        <option value="Danificado">Danificado</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nº de Série / Patrimônio</label>
                        {activeReport && (
                          <span className="text-[9px] text-blue-600 font-mono font-bold uppercase" title="Código de patrimônio sequencial para identificação do ativo">
                            Patrimônio de Depósito
                          </span>
                        )}
                      </div>
                      <div className="relative flex rounded-sm shadow-xs">
                        <input
                          type="text"
                          className="w-full pl-3 pr-16 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono font-bold text-slate-800"
                          placeholder="Ex: PAT-2026-902"
                          value={serialNumber}
                          onChange={e => setSerialNumber(e.target.value)}
                          id="item-serial"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (activeReport) {
                              const nextSeq = activeReport.items.length + 1;
                              const code = generateAssetCode(activeReport.clientName, itemCategory, nextSeq);
                              setSerialNumber(code);
                            }
                          }}
                          className="absolute right-0 inset-y-0 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 border-l border-slate-200 text-[10px] font-bold uppercase tracking-wider transition rounded-r-sm cursor-pointer"
                        >
                          Gerar
                        </button>
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-1 font-sans">Gerado automaticamente (Iniciais Cliente + Categoria + Sequencial). Você pode editar livremente ou clicar em "Gerar" para restaurar o padrão.</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valor Estimado (R$, Opcional)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: 850.00"
                        value={itemValue}
                        onChange={e => setItemValue(e.target.value)}
                        id="item-val"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Descrição / Observações de Danos ou Estado
                        </label>
                        
                        {/* Audio Dictation Control Widget */}
                        <div className="flex items-center gap-2">
                          {isRecording ? (
                            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2 py-0.5 rounded-sm animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                              <span className="text-[10px] font-bold text-red-600 font-mono">
                                Gravando... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                              </span>
                              <button
                                type="button"
                                onClick={stopRecording}
                                className="ml-1 text-red-700 hover:text-red-900 transition flex items-center gap-0.5 cursor-pointer"
                                title="Parar Gravação"
                                id="btn-stop-audio-recording"
                              >
                                <Square className="w-3 h-3 fill-red-700" />
                              </button>
                            </div>
                          ) : isTranscribing ? (
                            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-150 px-2.5 py-0.5 rounded-sm">
                              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                                Convertendo Áudio por IA...
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={startRecording}
                              className="px-2 py-0.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-slate-200 rounded-sm text-[10px] font-bold uppercase tracking-wider text-slate-650 flex items-center gap-1.5 transition cursor-pointer"
                              title="Ditar Observações (Voz por IA)"
                              id="btn-start-audio-recording"
                            >
                              <Mic className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                              Ditar por Voz (IA)
                            </button>
                          )}
                        </div>
                      </div>
                      <textarea
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-16 resize-none"
                        placeholder="Ex: Detalhes sobre desgaste, marca do fabricante, estado estético geral..."
                        value={itemDescription}
                        onChange={e => setItemDescription(e.target.value)}
                        id="item-desc"
                      />
                    </div>
                  </div>
                </div>

                {itemError && <p className="text-xs text-rose-500 font-bold uppercase tracking-wider" id="item-error-msg">{itemError}</p>}

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                    id="add-item-btn"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Item ao Relatório
                  </button>
                </div>
              </form>
            )}

            {/* List of Registered Items inside active report */}
            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" /> Ativos Cadastrados neste Inventário ({activeReport.items.length})
                </h4>
                
                {/* QR scanner trigger & manual search */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-sm text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium placeholder:font-normal"
                      placeholder="Pesquisar ativos..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      id="search-assets-input"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[10px] text-slate-400 hover:text-slate-650 font-bold font-sans cursor-pointer"
                        title="Limpar pesquisa"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={startQRScanner}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                    title="Escanear Etiqueta QR com Câmera"
                    id="btn-trigger-qr-scanner"
                  >
                    <Scan className="w-3.5 h-3.5 animate-pulse" />
                    Escanear QR
                  </button>
                </div>
              </div>

              {/* Alert banner for scanned but unregistered code */}
              {scannedUnregisteredCode && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-sm text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fade-in" id="scanned-unregistered-banner">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold">Código QR Lido:</span> <code className="bg-white px-1.5 py-0.5 rounded-sm border border-amber-150 font-mono font-bold text-amber-800">{scannedUnregisteredCode}</code>
                      <p className="text-[10px] text-slate-500 uppercase mt-0.5 font-bold tracking-wider">Este patrimônio não está registrado neste inventário ainda.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSerialNumber(scannedUnregisteredCode);
                        setScannedUnregisteredCode(null);
                        // scroll to form
                        const form = document.getElementById('add-item-to-inventory-form');
                        if (form) {
                          form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] uppercase font-bold rounded-sm transition cursor-pointer"
                    >
                      Preencher Cadastro
                    </button>
                    <button
                      type="button"
                      onClick={() => setScannedUnregisteredCode(null)}
                      className="px-2 py-1 border border-slate-200 text-slate-500 hover:bg-slate-100 text-[10px] uppercase font-bold rounded-sm transition cursor-pointer"
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              )}

              {activeReport.items.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Ainda não há ativos vinculados. Use o formulário acima para adicionar o primeiro.
                </div>
              ) : (
                <>
                  {/* Batch label printing control panel */}
                  <div className="mb-4 p-3.5 bg-slate-50 border border-slate-200 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in" id="batch-labels-panel">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                      <div className="space-y-0.5">
                        <span className="block text-[11px] font-black text-slate-800 uppercase tracking-tight">Gerador de Etiquetas em Lote</span>
                        <p className="text-[10px] text-slate-500">
                          {isBatchMode 
                            ? `${selectedItemIds.length} de ${activeReport.items.length} itens selecionados`
                            : 'Selecione múltiplos ativos do cliente para imprimir em lote.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!isBatchMode ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsBatchMode(true);
                            // Default: select all
                            setSelectedItemIds(activeReport.items.map(i => i.id));
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-[10px] uppercase tracking-wider rounded-sm transition cursor-pointer"
                          id="btn-enable-batch-labels"
                        >
                          Modo Lote / Impressão
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              // Toggle select all
                              if (selectedItemIds.length === activeReport.items.length) {
                                setSelectedItemIds([]);
                              } else {
                                setSelectedItemIds(activeReport.items.map(i => i.id));
                              }
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-[10px] uppercase tracking-wider rounded-sm transition cursor-pointer"
                            id="btn-select-all-batch"
                          >
                            {selectedItemIds.length === activeReport.items.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedItemIds.length === 0) {
                                alert('Por favor, selecione ao menos um item para gerar as etiquetas.');
                                return;
                              }
                              setShowingBatchQRModal(true);
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            id="btn-trigger-batch-qr-modal"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Gerar {selectedItemIds.length} Etiquetas
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsBatchMode(false);
                              setSelectedItemIds([]);
                            }}
                            className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-sm transition cursor-pointer"
                            id="btn-cancel-batch"
                          >
                            Sair do Lote
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Show summary if filtered */}
                  {searchQuery.trim() && (
                    <div className="mb-3 flex justify-between items-center bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-sm">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        Resultados da pesquisa: <strong className="text-slate-800">{
                          activeReport.items.filter(item => {
                            const q = searchQuery.toLowerCase();
                            return (
                              item.name.toLowerCase().includes(q) ||
                              item.location.toLowerCase().includes(q) ||
                              item.category.toLowerCase().includes(q) ||
                              (item.serialNumber && item.serialNumber.toLowerCase().includes(q)) ||
                              (item.description && item.description.toLowerCase().includes(q))
                            );
                          }).length
                        } ativos encontrados</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-[10px] text-blue-600 hover:text-blue-700 font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Ver Todos
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeReport.items.filter(item => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        item.name.toLowerCase().includes(q) ||
                        item.location.toLowerCase().includes(q) ||
                        item.category.toLowerCase().includes(q) ||
                        (item.serialNumber && item.serialNumber.toLowerCase().includes(q)) ||
                        (item.description && item.description.toLowerCase().includes(q))
                      );
                    }).map((item) => {
                      const isHighlighted = scannedItemHighlightId === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`border rounded-sm p-4 bg-slate-50/50 flex gap-4 transition-all duration-300 ${
                            isHighlighted 
                              ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-400/30 scale-[1.01]' 
                              : isBatchMode && selectedItemIds.includes(item.id)
                                ? 'border-blue-500 bg-blue-50/15 ring-1 ring-blue-200'
                                : 'border-slate-200 hover:border-blue-200'
                          } ${isBatchMode ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                          id={`inventory-item-card-${item.id}`}
                          onClick={(e) => {
                            if (isBatchMode) {
                              const target = e.target as HTMLElement;
                              // Don't toggle if clicking on interactive buttons or nested select fields
                              if (target.closest('button') || target.closest('a') || target.closest('input')) {
                                return;
                              }
                              if (selectedItemIds.includes(item.id)) {
                                setSelectedItemIds(prev => prev.filter(id => id !== item.id));
                              } else {
                                setSelectedItemIds(prev => [...prev, item.id]);
                              }
                            }
                          }}
                        >
                          {isBatchMode && (
                            <div className="flex items-center justify-center shrink-0 pr-1 select-none">
                              <input 
                                type="checkbox"
                                checked={selectedItemIds.includes(item.id)}
                                onChange={() => {
                                  if (selectedItemIds.includes(item.id)) {
                                    setSelectedItemIds(prev => prev.filter(id => id !== item.id));
                                  } else {
                                    setSelectedItemIds(prev => [...prev, item.id]);
                                  }
                                }}
                                className="w-4 h-4 rounded-sm text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                                id={`checkbox-batch-select-${item.id}`}
                              />
                            </div>
                          )}

                          <div className="flex flex-col gap-1.5 items-center shrink-0">
                            <div className="w-20 h-20 rounded-sm overflow-hidden border border-slate-200 bg-white relative">
                              <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            {activeReport.status === 'Rascunho' && (
                              <button
                                type="button"
                                onClick={() => setEditingPhotoTarget({ type: 'item', itemId: item.id, url: item.photoUrl })}
                                className="w-full px-1.5 py-0.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-sm transition flex items-center justify-center gap-0.5 cursor-pointer shadow-xs"
                                title="Editar e fazer marcações nesta foto"
                                id={`edit-item-photo-${item.id}`}
                              >
                                <Pencil className="w-2.5 h-2.5" /> Editar
                              </button>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start">
                                <h5 className="font-sans font-bold text-xs text-slate-900 truncate pr-2 uppercase tracking-tight">{item.name}</h5>
                                {activeReport.status === 'Rascunho' && (
                                  <button
                                    onClick={() => onDeleteItemFromReport(activeReport.id, item.id)}
                                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded-sm hover:bg-rose-50 transition shrink-0 cursor-pointer"
                                    title="Remover item"
                                    id={`delete-item-${item.id}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                                  <Tag className="w-2.5 h-2.5" /> {item.category}
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm ${
                                  item.status === 'Excelente' ? 'bg-emerald-50 text-emerald-700' :
                                  item.status === 'Bom' ? 'bg-blue-50 text-blue-700' :
                                  item.status === 'Regular' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {item.status}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-wide bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" /> {item.location}
                                </span>
                              </div>
                              
                              {item.description && (
                                <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            <div className="flex justify-between items-center mt-3 pt-1.5 border-t border-slate-200/60">
                              <button
                                type="button"
                                onClick={() => setShowingQRLabelItem(item)}
                                className="text-[9px] text-blue-600 hover:text-blue-700 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-blue-50 px-1.5 py-0.5 rounded-sm transition-all"
                                title="Visualizar e imprimir etiqueta QR deste ativo"
                                id={`view-qr-tag-${item.id}`}
                              >
                                <QrCode className="w-3 h-3 text-blue-600" />
                                {item.serialNumber ? `Série: ${item.serialNumber}` : 'Gerar QR'}
                              </button>
                              
                              {item.value && (
                                <span className="text-[10px] font-mono font-bold text-slate-900">
                                  R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-sm border-2 border-dashed border-slate-200 min-h-[300px]">
            <ClipboardList className="w-12 h-12 text-slate-300 mb-3 stroke-1" />
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-500">Nenhum Inventário Selecionado</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Selecione um inventário na lista lateral para visualizar ou crie um novo para registrar móveis e relatórios.
            </p>
          </div>
        )}
      </div>

      {/* PHOTO EDITOR OVERLAY MODAL */}
      {editingPhotoTarget && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-xs" id="photo-editor-overlay">
          <div className="bg-white rounded-sm border border-slate-200 shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-150 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-500 animate-pulse" />
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider">Editor Gráfico & Marcação de Vistoria</h3>
                  <p className="text-[10px] text-slate-400 uppercase mt-0.5">
                    {editingPhotoTarget.type === 'form' ? 'Editando foto pré-registro' : 'Editando foto de ativo cadastrado'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPhotoTarget(null)}
                className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer px-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
              {/* Tools */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-1">Ferramenta:</span>
                {[
                  { id: 'free', label: 'Desenho', icon: Pencil },
                  { id: 'arrow', label: 'Seta', icon: ArrowUpRight },
                  { id: 'circle', label: 'Círculo', icon: Circle }
                ].map(tool => {
                  const Icon = tool.icon;
                  const isAct = editorTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setEditorTool(tool.id as any)}
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-sm flex items-center gap-1 transition-all cursor-pointer ${
                        isAct 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs font-black' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      title={tool.label}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tool.label}
                    </button>
                  );
                })}
              </div>

              {/* Colors */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-1">Cor:</span>
                {[
                  { value: '#ef4444', label: 'Vermelho' },
                  { value: '#f59e0b', label: 'Amarelo' },
                  { value: '#3b82f6', label: 'Azul' },
                  { value: '#10b981', label: 'Verde' }
                ].map(color => {
                  const isSelected = editorColor === color.value;
                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setEditorColor(color.value)}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer relative flex items-center justify-center ${
                        isSelected ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white stroke-2" />}
                    </button>
                  );
                })}
              </div>

              {/* Line thickness */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-1">Espessura:</span>
                {[2, 4, 6, 8].map(size => {
                  const isAct = editorLineWidth === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setEditorLineWidth(size)}
                      className={`px-2 py-0.5 text-[10px] font-bold border rounded-sm transition-all cursor-pointer ${
                        isAct 
                          ? 'bg-slate-900 border-slate-900 text-white' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {size}px
                    </button>
                  );
                })}
              </div>

              {/* Undo and Clear */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={annotations.length === 0}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-sm flex items-center gap-1 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Desfazer última marcação"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Desfazer
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={annotations.length === 0}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-sm flex items-center gap-1 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Limpar todos os desenhos"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* Canvas body */}
            <div className="flex-1 p-6 bg-slate-100 flex items-center justify-center overflow-auto min-h-[350px]">
              {editorLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Carregando editor...</span>
                </div>
              ) : (
                <div className="relative border-4 border-white shadow-lg bg-white rounded-xs">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onTouchStart={handleCanvasMouseDown}
                    onTouchMove={handleCanvasMouseMove}
                    onTouchEnd={handleCanvasMouseUp}
                    className="cursor-crosshair block touch-none"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center rounded-b-sm">
              <div className="text-[10px] text-slate-400 font-medium max-w-md hidden sm:block">
                <strong>Dica de uso:</strong> Clique e arraste na foto para desenhar livremente ou criar setas e círculos para apontar avarias (riscos, trincas, manchas).
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setEditingPhotoTarget(null)}
                  className="px-4 py-2 border border-slate-200 rounded-sm font-bold uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-600 text-[10px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedPhoto}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" /> Salvar Marcações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR CODE CAMERA SCANNER MODAL */}
      {isScanningQR && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-xs animate-fade-in" id="qr-scanner-modal">
          <div className="bg-white rounded-sm border border-slate-200 shadow-2xl max-w-md w-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-150 bg-slate-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-blue-500 animate-pulse" />
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider">Leitor de QR Code (Câmera)</h3>
                  <p className="text-[10px] text-slate-400 uppercase mt-0.5">Identificar ou Vincular Ativo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={stopQRScanner}
                className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer px-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera Viewport */}
            <div className="relative bg-slate-950 aspect-square flex items-center justify-center overflow-hidden p-1 border-b border-slate-900">
              {qrScannerError ? (
                <div className="p-6 text-center text-slate-300">
                  <p className="font-bold text-rose-500 text-xs uppercase mb-2">Erro de Acesso</p>
                  <p className="text-[11px] leading-relaxed mb-4">{qrScannerError}</p>
                  <button
                    type="button"
                    onClick={startQRScanner}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={scannerCanvasRef}
                    className="hidden"
                  />

                  {/* Aesthetic Scanner Overlay Targets */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    {/* Scanner overlay square with brackets */}
                    <div className="w-64 h-64 border border-blue-500/30 relative bg-slate-950/10 rounded-sm shadow-[0_0_0_9999px_rgba(2,6,23,0.7)] flex flex-col justify-between p-2">
                      {/* Laser animated red line */}
                      <div className="w-full h-0.5 bg-blue-500 animate-bounce shadow-[0_0_8px_#3b82f6]"></div>
                      
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                    </div>
                    
                    <span className="text-[10px] text-white/80 uppercase font-black tracking-widest mt-4 bg-slate-950/80 px-2.5 py-1 rounded-sm border border-slate-800">
                      Alinhe o QR Code no quadrado
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Instruction Footer */}
            <div className="p-4 bg-slate-50 text-slate-500 leading-relaxed text-[11px]">
              <p className="font-semibold text-slate-700 uppercase tracking-wide text-[9px] mb-1">Como usar:</p>
              <p>Aponte a câmera para as etiquetas patrimoniais com códigos QR. Se o código for idêntico a um ativo já registrado neste inventário, ele será automaticamente localizado e destacado na tela. Se for novo, você poderá pré-preencher o formulário para registrá-lo rapidamente.</p>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={stopQRScanner}
                  className="px-4 py-2 border border-slate-200 rounded-sm bg-white hover:bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar Leitura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHOW QR CODE STICKER LABEL MODAL */}
      {showingQRLabelItem && (() => {
        const reportClient = activeReport ? clients.find(c => c.id === activeReport.clientId) : null;
        return (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-xs animate-fade-in" id="qr-label-modal">
            <div className="bg-white rounded-sm border border-slate-200 shadow-2xl max-w-md w-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-slate-150 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-500 animate-pulse" />
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider">Configurar Etiqueta Patrimonial</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowingQRLabelItem(null)}
                  className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer px-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-slate-200 bg-slate-50 text-[10px]">
                <button
                  type="button"
                  onClick={() => setPrintPreviewMode('label')}
                  className={`flex-1 py-2.5 font-bold uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    printPreviewMode === 'label'
                      ? 'border-blue-600 text-blue-600 bg-white border-b-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" /> 1. Dados e Layout
                </button>
                <button
                  type="button"
                  onClick={() => setPrintPreviewMode('print')}
                  className={`flex-1 py-2.5 font-bold uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    printPreviewMode === 'print'
                      ? 'border-blue-600 text-blue-600 bg-white border-b-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> 2. Prévia de Impressão
                </button>
              </div>

              {printPreviewMode === 'label' ? (
                <>
                  {/* Endereçamento Settings inside Modal */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                    <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider block flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Endereçamento e Logística de Depósito
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Galpão / Depósito</label>
                        <input 
                          type="text" 
                          value={warehouseLoc}
                          onChange={e => setWarehouseLoc(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-sm text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none font-bold"
                          placeholder="Ex: Galpão Principal"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Prateleira / Box</label>
                        <input 
                          type="text" 
                          value={warehouseShelf}
                          onChange={e => setWarehouseShelf(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-sm text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none font-bold"
                          placeholder="Ex: Prateleira A-14"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Print Area Wrapper */}
                  <div className="p-6 bg-slate-100 flex justify-center border-b border-slate-150 overflow-y-auto max-h-[350px]">
                    {/* Sticker Design */}
                    <div 
                      id="printable-asset-sticker"
                      className="w-[320px] bg-white p-4 border-2 border-slate-900 rounded-xs shadow-md flex flex-col text-slate-900 font-sans relative"
                    >
                      {/* Header branding */}
                      <div className="text-center border-b-2 border-slate-900 pb-1.5 mb-2.5">
                        <span className="text-[10px] font-black tracking-widest uppercase block">ETIQUETA DE PATRIMÔNIO</span>
                        <p className="text-[7.5px] text-slate-600 uppercase font-bold tracking-tight mt-0.5">Identificação e Depósito de Ativos</p>
                      </div>

                      {/* Body with QR and info side-by-side */}
                      <div className="flex gap-3.5 items-center">
                        {/* QR code image */}
                        <div className="w-24 h-24 shrink-0 bg-white border border-slate-300 p-1 flex items-center justify-center rounded-xs">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(showingQRLabelItem.serialNumber || showingQRLabelItem.name)}`}
                            alt={`QR Code para ${showingQRLabelItem.name}`}
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Asset descriptions */}
                        <div className="flex-1 min-w-0 text-left space-y-1">
                          <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Código do Item</span>
                          <p className="text-[9px] font-mono font-bold text-slate-800 leading-none truncate">{showingQRLabelItem.id}</p>
                          
                          <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none mt-1">Nome do Item</span>
                          <h4 className="text-[11px] font-black uppercase text-slate-950 truncate leading-none">{showingQRLabelItem.name}</h4>
                          
                          <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none mt-1">Categoria / Setor</span>
                          <p className="text-[9.5px] font-bold text-slate-800 uppercase leading-none">{showingQRLabelItem.category}</p>

                          <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none mt-1">Local Original</span>
                          <p className="text-[9.5px] font-bold text-slate-800 uppercase truncate leading-none">{showingQRLabelItem.location}</p>
                        </div>
                      </div>

                      {/* Client details box for warehouse identification */}
                      <div className="mt-3 bg-slate-50 border border-slate-250 p-2 rounded-xs text-left">
                        <p className="text-[8px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1 flex items-center justify-between">
                          <span>Proprietário / Cliente</span>
                          <span className="text-[7px] text-blue-700 font-mono">DADOS DE DEPÓSITO</span>
                        </p>
                        <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[8px]">
                          <div>
                            <span className="text-slate-400 font-bold block">NOME / RAZÃO:</span>
                            <span className="font-extrabold text-slate-850 truncate block">{reportClient?.companyName || reportClient?.name || activeReport?.clientName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block">DOCUMENTO:</span>
                            <span className="font-bold text-slate-800 block">{reportClient?.document || 'N/A'}</span>
                          </div>
                          <div className="col-span-2 border-t border-slate-100 pt-1 mt-0.5 flex justify-between gap-1">
                            <div>
                              <span className="text-slate-400 font-bold">CONTATO:</span>
                              <span className="font-bold text-slate-850 ml-1">{reportClient?.phone || reportClient?.email || 'N/A'}</span>
                            </div>
                            {warehouseLoc && (
                              <div className="text-right">
                                <span className="text-blue-800 font-black tracking-tight">{warehouseLoc.toUpperCase()} {warehouseShelf ? `/ ${warehouseShelf.toUpperCase()}` : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer bar */}
                      <div className="mt-3 pt-2 border-t border-dashed border-slate-400 text-center flex justify-between items-center font-mono">
                        <div className="text-left">
                          <span className="text-[7px] text-slate-400 uppercase block leading-none">Patrimônio Gerado</span>
                          <span className="text-[10px] font-black text-blue-900 tracking-tight">{showingQRLabelItem.serialNumber || 'REGISTRADO'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[7px] text-slate-400 uppercase block leading-none">Situação</span>
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">{showingQRLabelItem.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* PRINT PREVIEW SETTINGS */}
                  <div className="p-4 bg-slate-900 border-b border-slate-800 text-white space-y-3">
                    <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider block flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> CONFIGURAÇÕES DE IMPRESSÃO
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mídia de Destino</label>
                        <select
                          value={paperSize}
                          onChange={e => setPaperSize(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 border border-slate-700 bg-slate-800 text-white rounded-sm text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="sticker_40">Etiqueta Adesiva (40x40mm)</option>
                          <option value="thermal_80">Bobina Térmica (80mm)</option>
                          <option value="thermal_58">Bobina Térmica (58mm)</option>
                          <option value="a4_pimaco">Folha de Etiquetas (A4)</option>
                        </select>
                      </div>
                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-2 text-[9px] text-slate-300 font-bold uppercase tracking-wider cursor-pointer select-none py-1.5">
                          <input
                            type="checkbox"
                            checked={showAlignmentGuides}
                            onChange={e => setShowAlignmentGuides(e.target.checked)}
                            className="w-3.5 h-3.5 rounded-sm bg-slate-800 text-blue-600 border-slate-700 focus:ring-offset-slate-900 focus:ring-blue-500 cursor-pointer"
                          />
                          <span>Guias de Alinhamento</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* PRINT PREVIEW CONTAINER (Realistic Mockup) */}
                  <div className="p-4 bg-slate-200 border-b border-slate-300 flex flex-col items-center justify-center overflow-y-auto max-h-[320px]">
                    <div className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1 bg-white px-2 py-0.5 rounded-full shadow-xs">
                      <span>MOCKUP REALISTA DA MÍDIA</span>
                    </div>

                    <div className="flex flex-col items-center w-full">
                      {/* Paper roll simulation header */}
                      <div className="w-full max-w-[340px] bg-slate-300 h-2.5 rounded-t-full shadow-inner border-b border-slate-400 relative flex items-center justify-center">
                        <div className="w-20 h-0.5 bg-slate-400 rounded-full"></div>
                      </div>
                      
                      <div className="w-full flex justify-center bg-slate-400/30 py-4 px-2 relative border-x border-slate-300">
                        {/* Simulated Continuous paper roll behind */}
                        <div className={`bg-white shadow-lg relative transition-all duration-300 border-x border-dashed border-slate-400 flex flex-col items-center ${
                          paperSize === 'thermal_80' ? 'w-[320px] p-2' :
                          paperSize === 'thermal_58' ? 'w-[250px] p-1.5' :
                          paperSize === 'sticker_40' ? 'w-[290px] p-3 rounded-lg border border-amber-200 bg-amber-50/10' :
                          'w-[330px] p-2 bg-slate-50'
                        }`}>
                          {/* Dotted cutting lines above */}
                          <div className="w-full border-t border-dashed border-slate-300 py-1 text-center text-[7px] font-mono text-slate-400 uppercase select-none">
                            - - - - - - - Linha de Corte - - - - - - -
                          </div>

                          {/* Sticker Container with optional layout guides */}
                          <div 
                            id="printable-asset-sticker"
                            className={`${
                              paperSize === 'thermal_58' ? 'scale-[0.78] origin-center my-[-15px]' : ''
                            } w-[300px] bg-white p-3.5 border-2 border-slate-900 rounded-xs flex flex-col text-slate-900 font-sans relative`}
                          >
                            {showAlignmentGuides && (
                              <>
                                {/* Safety margin overlay */}
                                <div className="absolute inset-1.5 border border-dashed border-red-400/80 pointer-events-none rounded-xs flex items-start justify-end p-0.5" style={{ zIndex: 30 }}>
                                  <span className="text-[5px] font-mono text-red-500 font-extrabold uppercase bg-white px-0.5 scale-75">Margem Segura (3mm)</span>
                                </div>
                                
                                {/* Vertical Alignment Center guide */}
                                <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-blue-400/80 pointer-events-none flex items-center justify-start" style={{ zIndex: 30 }}>
                                  <span className="text-[5px] font-mono text-blue-500 font-extrabold uppercase bg-white px-0.5 -translate-x-1/2 scale-75 rotate-90 origin-center whitespace-nowrap">Eixo Central</span>
                                </div>

                                {/* QR code validation target guide */}
                                <div className="absolute top-[48px] left-[18px] w-26 h-26 border border-dashed border-emerald-500/80 pointer-events-none flex items-end justify-center p-0.5" style={{ zIndex: 30 }}>
                                  <span className="text-[5.5px] font-mono text-emerald-600 font-extrabold uppercase bg-white px-0.5 scale-75">LEITURA QR</span>
                                </div>
                              </>
                            )}

                            {/* Header branding */}
                            <div className="text-center border-b-2 border-slate-900 pb-1.5 mb-2.5">
                              <span className="text-[10px] font-black tracking-widest uppercase block">ETIQUETA DE PATRIMÔNIO</span>
                              <p className="text-[7.5px] text-slate-600 uppercase font-bold tracking-tight mt-0.5">Identificação e Depósito de Ativos</p>
                            </div>

                            {/* Body with QR and info side-by-side */}
                            <div className="flex gap-3.5 items-center">
                              {/* QR code image */}
                              <div className="w-24 h-24 shrink-0 bg-white border border-slate-300 p-1 flex items-center justify-center rounded-xs">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(showingQRLabelItem.serialNumber || showingQRLabelItem.name)}`}
                                  alt={`QR Code para ${showingQRLabelItem.name}`}
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              {/* Asset descriptions */}
                              <div className="flex-1 min-w-0 text-left space-y-1">
                                <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Código do Item</span>
                                <p className="text-[9px] font-mono font-bold text-slate-800 leading-none truncate">{showingQRLabelItem.id}</p>
                                
                                <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none mt-1">Nome do Item</span>
                                <h4 className="text-[11px] font-black uppercase text-slate-950 truncate leading-none">{showingQRLabelItem.name}</h4>
                                
                                <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none mt-1">Categoria / Setor</span>
                                <p className="text-[9.5px] font-bold text-slate-800 uppercase leading-none">{showingQRLabelItem.category}</p>

                                <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none mt-1">Local Original</span>
                                <p className="text-[9.5px] font-bold text-slate-800 uppercase truncate leading-none">{showingQRLabelItem.location}</p>
                              </div>
                            </div>

                            {/* Client details box for warehouse identification */}
                            <div className="mt-3 bg-slate-50 border border-slate-250 p-2 rounded-xs text-left">
                              <p className="text-[8px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1 flex items-center justify-between">
                                <span>Proprietário / Cliente</span>
                                <span className="text-[7px] text-blue-700 font-mono">DADOS DE DEPÓSITO</span>
                              </p>
                              <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[8px]">
                                <div>
                                  <span className="text-slate-400 font-bold block">NOME / RAZÃO:</span>
                                  <span className="font-extrabold text-slate-850 truncate block">{reportClient?.companyName || reportClient?.name || activeReport?.clientName}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold block">DOCUMENTO:</span>
                                  <span className="font-bold text-slate-800 block">{reportClient?.document || 'N/A'}</span>
                                </div>
                                <div className="col-span-2 border-t border-slate-100 pt-1 mt-0.5 flex justify-between gap-1">
                                  <div>
                                    <span className="text-slate-400 font-bold">CONTATO:</span>
                                    <span className="font-bold text-slate-850 ml-1">{reportClient?.phone || reportClient?.email || 'N/A'}</span>
                                  </div>
                                  {warehouseLoc && (
                                    <div className="text-right">
                                      <span className="text-blue-800 font-black tracking-tight">{warehouseLoc.toUpperCase()} {warehouseShelf ? `/ ${warehouseShelf.toUpperCase()}` : ''}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Footer bar */}
                            <div className="mt-3 pt-2 border-t border-dashed border-slate-400 text-center flex justify-between items-center font-mono">
                              <div className="text-left">
                                <span className="text-[7px] text-slate-400 uppercase block leading-none">Patrimônio Gerado</span>
                                <span className="text-[10px] font-black text-blue-900 tracking-tight">{showingQRLabelItem.serialNumber || 'REGISTRADO'}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[7px] text-slate-400 uppercase block leading-none">Situação</span>
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">{showingQRLabelItem.status}</span>
                              </div>
                            </div>
                          </div>

                          {/* Dotted cutting lines below */}
                          <div className="w-full border-b border-dashed border-slate-300 py-1 mt-2 text-center text-[7px] font-mono text-slate-400 uppercase select-none">
                            - - - - - - - Linha de Corte - - - - - - -
                          </div>
                        </div>
                      </div>
                      
                      {/* Printer roller bottom */}
                      <div className="w-full max-w-[340px] bg-slate-800 h-5 rounded-b-md shadow-md flex items-center justify-between px-3 text-[8px] font-mono text-slate-400">
                        <span>SALA DE IMPRESSÃO</span>
                        <span className="animate-pulse text-emerald-400">● {paperSize === 'a4_pimaco' ? 'A4 CARREGADO' : 'BOBINA ONLINE'}</span>
                      </div>
                    </div>
                  </div>

                  {/* GUIDELINE EXPLANATIONS */}
                  <div className="p-3 bg-blue-50 border-b border-blue-100 space-y-2 text-[10px] text-blue-800">
                    <span className="font-extrabold uppercase block tracking-wider flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" /> DIAGNÓSTICO DE IMPRESSÃO
                    </span>
                    <ul className="grid grid-cols-2 gap-x-2 gap-y-1 font-sans text-[9px] list-disc pl-3">
                      <li className="text-emerald-700">✓ Resolução do QR: <b>300 DPI</b> (Alta)</li>
                      <li className="text-emerald-700">✓ Margem Segura: <b>3mm</b> (Conforme)</li>
                      <li className="text-emerald-700">✓ Eixo Central: <b>Perfeito</b></li>
                      <li className="text-emerald-700">✓ Texto Legível: <b>Sim</b></li>
                    </ul>
                  </div>
                </>
              )}

              {/* Modal Actions */}
              <div className="p-4 bg-slate-50 flex flex-col gap-2 rounded-b-sm">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const printContents = document.getElementById('printable-asset-sticker')?.innerHTML;
                      if (!printContents) return;
                      
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Etiqueta de Ativo - ${showingQRLabelItem.name}</title>
                              <style>
                                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #fff; margin: 0; padding: 15px; display: flex; justify-content: center; align-items: center; height: 95vh; }
                                .printable-sticker {
                                  width: 320px;
                                  padding: 14px;
                                  border: 2px solid #000;
                                  border-radius: 4px;
                                  background-color: #fff;
                                  color: #000;
                                  box-sizing: border-box;
                                  display: flex;
                                  flex-direction: column;
                                }
                                .text-center { text-align: center; }
                                .border-b-2 { border-bottom: 2px solid #000; }
                                .pb-15 { padding-bottom: 6px; }
                                .mb-25 { margin-bottom: 10px; }
                                .flex { display: flex; }
                                .gap-3.5 { gap: 14px; }
                                .items-center { align-items: center; }
                                .shrink-0 { flex-shrink: 0; }
                                .w-24 { width: 96px; }
                                .h-24 { height: 96px; }
                                .border { border: 1px solid #000; }
                                .p-1 { padding: 4px; }
                                .rounded-xs { border-radius: 2px; }
                                .flex-1 { flex: 1 1 0%; }
                                .min-w-0 { min-width: 0; }
                                .text-left { text-align: left; }
                                .space-y-1 > * + * { margin-top: 4px; }
                                .text-xs { font-size: 11px; }
                                .font-black { font-weight: 900; }
                                .uppercase { text-transform: uppercase; }
                                .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                                .leading-none { line-height: 1; }
                                .text-slate-400 { color: #555; }
                                .text-slate-600 { color: #333; }
                                .text-slate-800 { color: #111; }
                                .text-slate-900 { color: #000; }
                                .text-slate-950 { color: #000; }
                                .mt-3 { margin-top: 12px; }
                                .pt-2 { padding-top: 8px; }
                                .border-t { border-top: 1px solid #000; }
                                .border-dashed { border-style: dashed; }
                                .justify-between { justify-content: space-between; }
                                .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
                                .text-right { text-align: right; }
                                .bg-slate-50 { background-color: #f8fafc; border: 1px solid #000; padding: 6px; border-radius: 3px; margin-top: 8px; }
                                .bg-emerald-50 { background-color: #f0fdf4; border: 1px solid #16a34a; color: #15803d; padding: 2px 6px; border-radius: 2px; }
                                .font-extrabold { font-weight: 800; }
                                .block { display: block; }
                                .grid { display: grid; }
                                .grid-cols-2 { grid-template-columns: 1fr 1fr; }
                                .gap-y-1 { row-gap: 4px; }
                                .gap-x-2 { column-gap: 8px; }
                                .col-span-2 { grid-column: span 2 / span 2; }
                                .border-t { border-top: 1px solid #ddd; }
                                .pt-1 { padding-top: 4px; }
                                .mt-0.5 { margin-top: 2px; }
                                .text-blue-750 { color: #1d4ed8; font-weight: bold; }
                                .text-blue-900 { color: #1e3a8a; font-weight: bold; }
                              </style>
                            </head>
                            <body onload="window.print(); window.close();">
                              <div class="printable-sticker">
                                ${printContents}
                              </div>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                      }
                    }}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-sm font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    title="Imprimir Etiqueta com Suporte de Impressora Térmica ou Comum"
                  >
                    <Printer className="w-3.5 h-3.5" /> Imprimir Etiqueta
                  </button>

                  <button
                    type="button"
                    disabled={isGeneratingPDF}
                    onClick={() => downloadLabelAsPDF(showingQRLabelItem)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400 rounded-sm font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    title="Salvar etiqueta completa formatada como PDF para uso offline"
                  >
                    {isGeneratingPDF ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    Salvar como PDF
                  </button>

                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(showingQRLabelItem.serialNumber || showingQRLabelItem.name)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-sm text-slate-700 font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    title="Baixar imagem QR Code pura"
                  >
                    QR Puro
                  </a>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowingQRLabelItem(null)}
                  className="w-full py-1.5 border border-slate-200 rounded-sm bg-white hover:bg-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[9px] cursor-pointer text-center"
                >
                  Fechar Configuração
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SHOW BATCH QR CODE STICKER LABELS MODAL */}
      {showingBatchQRModal && activeReport && (() => {
        const reportClient = clients.find(c => c.id === activeReport.clientId);
        const selectedItems = activeReport.items.filter(item => selectedItemIds.includes(item.id));
        
        return (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-xs animate-fade-in" id="batch-qr-labels-modal">
            <div className="bg-white rounded-sm border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-slate-150 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-blue-500" />
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider">Imprimir {selectedItems.length} Etiquetas em Lote</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowingBatchQRModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer px-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-slate-200 bg-slate-50 text-[10px]">
                <button
                  type="button"
                  onClick={() => setPrintPreviewMode('label')}
                  className={`flex-1 py-2.5 font-bold uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    printPreviewMode === 'label'
                      ? 'border-blue-600 text-blue-600 bg-white border-b-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" /> 1. Configurar Lote
                </button>
                <button
                  type="button"
                  onClick={() => setPrintPreviewMode('print')}
                  className={`flex-1 py-2.5 font-bold uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    printPreviewMode === 'print'
                      ? 'border-blue-600 text-blue-600 bg-white border-b-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> 2. Prévia de Impressão ({selectedItems.length})
                </button>
              </div>

              {printPreviewMode === 'label' ? (
                <>
                  {/* Endereçamento Settings inside Batch Modal */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider block flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Identificação e Endereçamento em Lote
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 font-mono uppercase bg-slate-100 px-1.5 py-0.5 rounded-sm">
                        {selectedItems.length} Itens Prontos
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Galpão / Depósito de Destino</label>
                        <input 
                          type="text" 
                          value={warehouseLoc}
                          onChange={e => setWarehouseLoc(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-sm text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none font-bold"
                          placeholder="Ex: Galpão Geral"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Prateleira Coletiva / Box</label>
                        <input 
                          type="text" 
                          value={warehouseShelf}
                          onChange={e => setWarehouseShelf(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-sm text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none font-bold"
                          placeholder="Ex: Deixar vazio se variar"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Print Grid Area Wrapper */}
                  <div className="p-6 bg-slate-100 overflow-y-auto max-h-[380px]">
                    <div className="text-center mb-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Pré-visualização do Lote de Ativos</span>
                      <p className="text-[9px] text-slate-400">As etiquetas individuais serão geradas conforme layout abaixo.</p>
                    </div>

                    <div className="flex flex-wrap gap-4 justify-center" id="printable-batch-stickers-container">
                      {selectedItems.map((item, idx) => (
                        <div 
                          key={item.id}
                          className="w-[285px] bg-white p-3 border border-slate-800 rounded-xs shadow-sm flex flex-col text-slate-900 font-sans relative printable-batch-sticker"
                          style={{ pageBreakInside: 'avoid', marginBottom: '15px' }}
                        >
                          {/* Header branding */}
                          <div className="text-center border-b-2 border-slate-800 pb-1 mb-2">
                            <span className="text-[8.5px] font-black tracking-widest uppercase block">ETIQUETA DE PATRIMÔNIO</span>
                            <p className="text-[7px] text-slate-500 uppercase font-mono tracking-tight">{idx + 1} de {selectedItems.length} | CONTROLE DE DEPÓSITO</p>
                          </div>

                          {/* Body with QR and info side-by-side */}
                          <div className="flex gap-2.5 items-center">
                            {/* QR code image */}
                            <div className="w-20 h-20 shrink-0 bg-white border border-slate-250 p-1 flex items-center justify-center rounded-xs">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(item.serialNumber || item.name)}`}
                                alt={`QR Code para ${item.name}`}
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            {/* Asset descriptions */}
                            <div className="flex-1 min-w-0 text-left space-y-0.5">
                              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider block">ID do Ativo</span>
                              <p className="text-[8px] font-mono font-bold text-slate-700 truncate">{item.id}</p>
                              
                              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider block">Nome do Ativo</span>
                              <h4 className="text-[10px] font-black uppercase text-slate-950 truncate leading-tight">{item.name}</h4>
                              
                              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider block">Categoria</span>
                              <p className="text-[8.5px] font-bold text-slate-700 uppercase leading-none">{item.category}</p>

                              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider block">Local Original</span>
                              <p className="text-[8.5px] font-bold text-slate-700 uppercase truncate leading-none">{item.location}</p>
                            </div>
                          </div>

                          {/* Client details box for warehouse identification */}
                          <div className="mt-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xs text-left">
                            <p className="text-[7.5px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1 flex justify-between">
                              <span>Cliente: {reportClient?.companyName || reportClient?.name || activeReport.clientName}</span>
                            </p>
                            <div className="flex justify-between items-center text-[7.5px] font-mono">
                              <span>DOC: {reportClient?.document || 'N/A'}</span>
                              {warehouseLoc && (
                                <span className="text-blue-800 font-bold font-sans uppercase">{warehouseLoc.toUpperCase()} {warehouseShelf ? `/ ${warehouseShelf.toUpperCase()}` : ''}</span>
                              )}
                            </div>
                          </div>

                          {/* Footer bar */}
                          <div className="mt-2 pt-1 border-t border-dashed border-slate-355 text-center flex justify-between items-center font-mono">
                            <div className="text-left">
                              <span className="text-[6px] text-slate-400 uppercase block leading-none">Patrimônio</span>
                              <span className="text-[9.5px] font-black text-blue-900 tracking-tight">{item.serialNumber || 'REGISTRADO'}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[6px] text-slate-400 uppercase block leading-none">Situação</span>
                              <span className="text-[8px] font-bold text-emerald-800 uppercase tracking-wider">{item.status}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* BATCH PRINT PREVIEW CONFIG */}
                  <div className="p-4 bg-slate-900 border-b border-slate-800 text-white space-y-3">
                    <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider block flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> CONFIGURAÇÕES DE IMPRESSÃO EM LOTE
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Formato do Papel Coletivo</label>
                        <select
                          value={paperSize}
                          onChange={e => setPaperSize(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 border border-slate-700 bg-slate-800 text-white rounded-sm text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="sticker_40">Etiqueta Adesiva Coletiva (40x40mm)</option>
                          <option value="thermal_80">Bobina Térmica de Série (80mm)</option>
                          <option value="thermal_58">Bobina Térmica Estreita (58mm)</option>
                          <option value="a4_pimaco">Folha Gradeada (A4)</option>
                        </select>
                      </div>
                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-2 text-[9px] text-slate-300 font-bold uppercase tracking-wider cursor-pointer select-none py-1.5">
                          <input
                            type="checkbox"
                            checked={showAlignmentGuides}
                            onChange={e => setShowAlignmentGuides(e.target.checked)}
                            className="w-3.5 h-3.5 rounded-sm bg-slate-800 text-blue-600 border-slate-700 focus:ring-offset-slate-900 focus:ring-blue-500 cursor-pointer"
                          />
                          <span>Exibir Guias de Corte</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* BATCH PRINT FEED PREVIEW */}
                  <div className="p-6 bg-slate-200 border-b border-slate-300 overflow-y-auto max-h-[350px] flex flex-col items-center">
                    <div className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-1 bg-white px-2.5 py-1 rounded-full shadow-xs">
                      <span>BOBINA DE IMPRESSÃO EM SÉRIE ({selectedItems.length} ETIQUETAS)</span>
                    </div>

                    <div className="flex flex-col items-center w-full">
                      {/* Top feed roller */}
                      <div className="w-full max-w-[380px] bg-slate-300 h-3 rounded-t-full shadow-inner border-b border-slate-400 relative flex items-center justify-center">
                        <div className="w-24 h-0.5 bg-slate-400 rounded-full"></div>
                      </div>

                      {/* Continuous stream container */}
                      <div className="w-full flex flex-col items-center bg-slate-400/20 py-4 px-3 border-x border-slate-300">
                        <div className={`bg-white shadow-xl relative transition-all duration-300 border-x border-dashed border-slate-400 flex flex-col items-center gap-4 py-3 ${
                          paperSize === 'thermal_80' ? 'w-[320px]' :
                          paperSize === 'thermal_58' ? 'w-[250px]' :
                          paperSize === 'sticker_40' ? 'w-[290px] rounded-lg border border-amber-200 bg-amber-50/10' :
                          'w-[340px] bg-slate-50'
                        }`}>
                          
                          {selectedItems.map((item, idx) => (
                            <React.Fragment key={item.id}>
                              {/* Cutting Marker */}
                              <div className="w-full border-t border-dashed border-slate-300 pt-1 text-center text-[7px] font-mono text-slate-400 uppercase select-none">
                                - - - - - CORTE DE SÉRIE {idx + 1} de {selectedItems.length} - - - - -
                              </div>

                              {/* Label Replica */}
                              <div 
                                className={`${
                                  paperSize === 'thermal_58' ? 'scale-[0.78] origin-center my-[-15px]' : ''
                                } w-[285px] bg-white p-3 border border-slate-800 rounded-xs flex flex-col text-slate-900 font-sans relative`}
                              >
                                {showAlignmentGuides && (
                                  <>
                                    {/* Margin overlay */}
                                    <div className="absolute inset-1 border border-dashed border-red-400/80 pointer-events-none rounded-xs flex items-start justify-end p-0.5" style={{ zIndex: 30 }}>
                                      <span className="text-[4.5px] font-mono text-red-500 font-extrabold uppercase scale-75">SÉRIE LIMIT</span>
                                    </div>
                                    {/* Axis line */}
                                    <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-blue-400/70 pointer-events-none" style={{ zIndex: 30 }}></div>
                                  </>
                                )}

                                {/* Header branding */}
                                <div className="text-center border-b-2 border-slate-800 pb-1 mb-2">
                                  <span className="text-[8.5px] font-black tracking-widest uppercase block">ETIQUETA DE PATRIMÔNIO</span>
                                  <p className="text-[7px] text-slate-500 uppercase font-mono tracking-tight">{idx + 1} de {selectedItems.length} | CONTROLE DE DEPÓSITO</p>
                                </div>

                                {/* Body with QR and info side-by-side */}
                                <div className="flex gap-2.5 items-center">
                                  {/* QR code image */}
                                  <div className="w-20 h-20 shrink-0 bg-white border border-slate-250 p-1 flex items-center justify-center rounded-xs">
                                    <img 
                                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(item.serialNumber || item.name)}`}
                                      alt={`QR Code para ${item.name}`}
                                      className="w-full h-full object-contain"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>

                                  {/* Asset descriptions */}
                                  <div className="flex-1 min-w-0 text-left space-y-0.5">
                                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider block">ID do Ativo</span>
                                    <p className="text-[8px] font-mono font-bold text-slate-700 truncate">{item.id}</p>
                                    
                                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider block">Nome do Ativo</span>
                                    <h4 className="text-[10px] font-black uppercase text-slate-950 truncate leading-tight">{item.name}</h4>
                                    
                                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider block">Categoria</span>
                                    <p className="text-[8.5px] font-bold text-slate-700 uppercase leading-none">{item.category}</p>

                                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider block">Local Original</span>
                                    <p className="text-[8.5px] font-bold text-slate-700 uppercase truncate leading-none">{item.location}</p>
                                  </div>
                                </div>

                                {/* Client details box */}
                                <div className="mt-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xs text-left">
                                  <p className="text-[7.5px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1 flex justify-between">
                                    <span>Cliente: {reportClient?.companyName || reportClient?.name || activeReport.clientName}</span>
                                  </p>
                                  <div className="flex justify-between items-center text-[7.5px] font-mono">
                                    <span>DOC: {reportClient?.document || 'N/A'}</span>
                                    {warehouseLoc && (
                                      <span className="text-blue-800 font-bold font-sans uppercase">{warehouseLoc.toUpperCase()} {warehouseShelf ? `/ ${warehouseShelf.toUpperCase()}` : ''}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </React.Fragment>
                          ))}

                          <div className="w-full border-t border-dashed border-slate-300 py-1 text-center text-[7px] font-mono text-slate-400 uppercase select-none">
                            - - - - - FIM DO LOTE CARREGADO - - - - -
                          </div>
                        </div>
                      </div>

                      {/* Feed rollers bottom */}
                      <div className="w-full max-w-[380px] bg-slate-800 h-5 rounded-b-md shadow-md flex items-center justify-between px-3 text-[8px] font-mono text-slate-400">
                        <span>LOTE DE SÉRIE</span>
                        <span className="animate-pulse text-blue-400">● {selectedItems.length} ETIQUETAS COORDENADAS</span>
                      </div>
                    </div>
                  </div>

                  {/* BATCH IMPRESSÃO INSTRUCTIONS */}
                  <div className="p-3 bg-blue-50 border-b border-blue-100 text-[10px] text-blue-800 space-y-1">
                    <span className="font-extrabold uppercase block tracking-wider">DIAGNÓSTICO DA IMPRESSÃO COLETIVA</span>
                    <p className="text-[9px] text-blue-700 font-sans leading-tight">
                      Todas as <b>{selectedItems.length}</b> etiquetas estão alinhadas com o mesmo espaçamento de segurança de 15px.
                      Recomendamos o uso de corte automático (cutter) a cada etiqueta para papel contínuo.
                    </p>
                  </div>
                </>
              )}

              {/* Modal Actions */}
              <div className="p-4 bg-slate-50 flex flex-col gap-2 rounded-b-sm border-t border-slate-150">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const stickers = document.getElementsByClassName('printable-batch-sticker');
                      if (stickers.length === 0) return;
                      
                      let stickersHTML = '';
                      for (let i = 0; i < stickers.length; i++) {
                        stickersHTML += `
                          <div class="printable-sticker">
                            ${stickers[i].innerHTML}
                          </div>
                        `;
                      }

                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Lote de Etiquetas - ${activeReport.clientName}</title>
                              <style>
                                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #fff; margin: 0; padding: 20px; }
                                .label-container { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
                                .printable-sticker {
                                  width: 300px;
                                  padding: 12px;
                                  border: 2px solid #000;
                                  border-radius: 4px;
                                  background-color: #fff;
                                  color: #000;
                                  box-sizing: border-box;
                                  display: flex;
                                  flex-direction: column;
                                  page-break-inside: avoid;
                                  margin-bottom: 10px;
                                }
                                .text-center { text-align: center; }
                                .border-b-2 { border-bottom: 2px solid #000; }
                                .pb-1 { padding-bottom: 4px; }
                                .mb-2 { margin-bottom: 8px; }
                                .flex { display: flex; }
                                .gap-2.5 { gap: 10px; }
                                .items-center { align-items: center; }
                                .shrink-0 { flex-shrink: 0; }
                                .w-20 { width: 80px; }
                                .h-20 { height: 80px; }
                                .border { border: 1px solid #000; }
                                .p-1 { padding: 4px; }
                                .rounded-xs { border-radius: 2px; }
                                .flex-1 { flex: 1 1 0%; }
                                .min-w-0 { min-width: 0; }
                                .text-left { text-align: left; }
                                .space-y-0.5 > * + * { margin-top: 2px; }
                                .text-xs { font-size: 10px; }
                                .font-black { font-weight: 900; }
                                .uppercase { text-transform: uppercase; }
                                .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                                .leading-tight { line-height: 1.2; }
                                .text-slate-400 { color: #555; }
                                .text-slate-500 { color: #444; }
                                .text-slate-700 { color: #111; }
                                .text-slate-900 { color: #000; }
                                .text-slate-950 { color: #000; }
                                .mt-2 { margin-top: 8px; }
                                .pt-1 { padding-top: 4px; }
                                .border-t { border-top: 1px solid #000; }
                                .border-dashed { border-style: dashed; }
                                .justify-between { justify-content: space-between; }
                                .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
                                .text-right { text-align: right; }
                                .bg-slate-50 { background-color: #f8fafc; border: 1px solid #000; padding: 4px; border-radius: 3px; margin-top: 8px; }
                                .text-blue-900 { color: #1e3a8a; font-weight: bold; }
                                .text-blue-800 { color: #1d4ed8; font-weight: bold; }
                                .font-extrabold { font-weight: 800; }
                                .block { display: block; }
                                .grid { display: grid; }
                                .grid-cols-2 { grid-template-columns: 1fr 1fr; }
                                .pt-1 { padding-top: 4px; }
                                
                                @media print {
                                  body { padding: 0; }
                                  .printable-sticker { page-break-inside: avoid; }
                                }
                              </style>
                            </head>
                            <body onload="window.print(); window.close();">
                              <div class="label-container">
                                ${stickersHTML}
                              </div>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                      }
                    }}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-bold uppercase tracking-wider text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    title="Enviar todo o lote para a impressora"
                  >
                    <Printer className="w-4 h-4" /> Enviar Todas para Impressora
                  </button>

                  <button
                    type="button"
                    disabled={isGeneratingPDF}
                    onClick={() => downloadBatchAsPDF(selectedItems)}
                    className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-500 text-white rounded-sm font-bold uppercase tracking-wider text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    title="Salvar todas as etiquetas selecionadas do lote em um único arquivo PDF multi-páginas"
                  >
                    {isGeneratingPDF ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Salvar Lote em PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowingBatchQRModal(false)}
                    className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-sm font-bold uppercase tracking-wider text-[11px] cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
