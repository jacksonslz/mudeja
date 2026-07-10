import { jsPDF } from 'jspdf';
import { InventoryReport } from '../types';

// Helper to convert an image URL to Base64 (fails gracefully if blocked by CORS)
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string | null> => {
  if (!imageUrl) return null;
  // If it's already a base64 data URL, return it
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`CORS or connection issue when fetching image: ${imageUrl}. Drawing placeholder instead.`);
    return null;
  }
};

export const generateReportPDF = async (report: InventoryReport) => {
  // Create jsPDF instance (A4 size: 210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let currentPage = 1;

  // Header & Footer Helpers
  const drawPageHeader = (pageNum: number) => {
    // Top colored block
    doc.setFillColor(15, 23, 42); // Dark slate (#0f172a)
    doc.rect(0, 0, 210, 18, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("MOBI-INV PRO  |  GESTÃO PATRIMONIAL", 15, 11);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("RELATÓRIO TÉCNICO DE VISTORIA", 195, 11, { align: "right" });
  };

  const drawPageFooter = (pageNum: number) => {
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, 282, 195, 282);
    
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("MobiInv Pro - Todos os direitos reservados. Chave de Autenticação: A589-BC99-D112", 15, 288);
    doc.text(`Página ${pageNum}`, 195, 288, { align: "right" });
  };

  // Draw first page header
  drawPageHeader(currentPage);
  drawPageFooter(currentPage);

  let y = 30; // Vertical position in mm

  // Read local company profile
  let companyName = "MOBI-INV GESTÃO DE ATIVOS";
  let companyDetails = "Laudos Técnicos, Vistoria Cautelar, Inventários e Controle Patrimonial";
  let companyContact = "Contato: suporte@mobiinv.com.br  |  São Paulo - SP";
  let companyLogoRaw = null;

  try {
    const stored = localStorage.getItem('mobiinv_user_profile');
    if (stored) {
      const profile = JSON.parse(stored);
      if (profile.companyName) {
        companyName = profile.companyName.toUpperCase();
      }
      if (profile.companyCnpj) {
        companyDetails = `CNPJ: ${profile.companyCnpj}  |  Endereço: ${profile.companyAddress || 'N/A'}`;
      }
      if (profile.companyEmail || profile.companyPhone) {
        companyContact = `Contato: ${profile.companyEmail || ''}  |  Tel: ${profile.companyPhone || ''}`;
      }
      if (profile.companyLogo) {
        companyLogoRaw = profile.companyLogo;
      }
    }
  } catch (e) {
    console.error('Error reading company profile for PDF:', e);
  }

  // Company Header / Brand Block
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(companyName, 15, y);
  
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(companyDetails, 15, y + 5);
  doc.text(companyContact, 15, y + 9);

  if (companyLogoRaw) {
    try {
      const base64Logo = await getBase64ImageFromUrl(companyLogoRaw);
      if (base64Logo) {
        doc.addImage(base64Logo, 'JPEG', 160, y - 4, 35, 14);
      }
    } catch (logoErr) {
      console.warn("Failed to add company logo to PDF:", logoErr);
    }
  }
  
  y += 18;

  // Title of the Report
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(15, y, 180, 16, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.rect(15, y, 180, 16, 'S');

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`DOCUMENTO: ${report.title.toUpperCase()}`, 18, y + 6);
  
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont("helvetica", "mono");
  doc.setFontSize(7);
  doc.text(`ID DO LAUDO: ${report.id}`, 18, y + 11);
  
  const createdDate = report.createdAt ? new Date(report.createdAt).toLocaleDateString('pt-BR') : 'N/A';
  const finalizedDate = report.finalizedAt ? new Date(report.finalizedAt).toLocaleDateString('pt-BR') : 'N/A';
  
  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Finalizado em: ${finalizedDate}`, 192, y + 9, { align: 'right' });

  y += 24;

  // Client Details Section
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(15, y, 180, 22, 'F');
  
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("METADADOS E INFORMAÇÕES DO CLIENTE", 18, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Cliente Associado: ${report.clientName}`, 18, y + 11);
  doc.text(`Identificador do Cliente: ${report.clientId}`, 18, y + 16);

  // Stats on the right side of client card
  const totalValue = report.items.reduce((sum, item) => sum + (item.value || 0), 0);
  doc.setFont("helvetica", "bold");
  doc.text(`Total de Bens: ${report.items.length} itens`, 130, y + 11);
  doc.text(`Valor Estimado: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 130, y + 16);

  y += 32;

  // Section: Items Catalog
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("BENS PATRIMONIAIS CATALOGADOS", 15, y);
  
  doc.setDrawColor(37, 99, 235); // Blue-600 line divider
  doc.setLineWidth(0.5);
  doc.line(15, y + 2, 195, y + 2);
  doc.setLineWidth(0.1); // restore default line width

  y += 8;

  // Iterate over items and display them
  for (let idx = 0; idx < report.items.length; idx++) {
    const item = report.items[idx];

    // Check if we have enough space for the item box (we need about 55mm to draw a complete card without weird cuts)
    if (y + 55 > 275) {
      doc.addPage();
      currentPage++;
      drawPageHeader(currentPage);
      drawPageFooter(currentPage);
      y = 30; // Reset y
    }

    // Outer card background
    doc.setFillColor(250, 250, 250); // clear off-white
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.rect(15, y, 180, 48, 'F');
    doc.rect(15, y, 180, 48, 'S');

    // Load and add photo if available, or draw placeholder
    const imgX = 18;
    const imgY = y + 4;
    const imgW = 40;
    const imgH = 40;

    let base64Photo = null;
    if (item.photoUrl) {
      base64Photo = await getBase64ImageFromUrl(item.photoUrl);
    }

    if (base64Photo) {
      try {
        doc.addImage(base64Photo, 'JPEG', imgX, imgY, imgW, imgH);
      } catch (e) {
        console.error("Error embedding photo into PDF", e);
        // Fallback placeholder rectangle
        doc.setFillColor(241, 245, 249);
        doc.rect(imgX, imgY, imgW, imgH, 'F');
        doc.rect(imgX, imgY, imgW, imgH, 'S');
        doc.setTextColor(148, 163, 184);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text("FOTO DO BEM", imgX + 20, imgY + 22, { align: 'center' });
      }
    } else {
      // Fallback placeholder rectangle
      doc.setFillColor(241, 245, 249);
      doc.rect(imgX, imgY, imgW, imgH, 'F');
      doc.rect(imgX, imgY, imgW, imgH, 'S');
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("FOTO INDISPONÍVEL", imgX + 20, imgY + 22, { align: 'center' });
    }

    // Item Details (Right of the photo)
    const textX = 64;
    
    // Index and Title
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(`#${(idx + 1).toString().padStart(3, '0')}`, textX, y + 7);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(item.name.toUpperCase(), textX + 8, y + 7);

    // Value
    if (item.value) {
      doc.setTextColor(37, 99, 235); // Blue-600
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 190, y + 7, { align: 'right' });
    }

    // Grid details: Categoria, Estado, Localização
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(241, 245, 249);
    
    // Grid item 1: Categoria
    doc.rect(textX, y + 11, 38, 9, 'F');
    doc.rect(textX, y + 11, 38, 9, 'S');
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text("CATEGORIA", textX + 2, y + 14);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(item.category.toUpperCase(), textX + 2, y + 18);

    // Grid item 2: Estado
    doc.rect(textX + 41, y + 11, 25, 9, 'F');
    doc.rect(textX + 41, y + 11, 25, 9, 'S');
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text("ESTADO", textX + 43, y + 14);
    
    // Set color based on status
    if (item.status === 'Excelente') doc.setTextColor(16, 185, 129); // emerald-500
    else if (item.status === 'Bom') doc.setTextColor(37, 99, 235); // blue-600
    else if (item.status === 'Regular') doc.setTextColor(245, 158, 11); // amber-500
    else doc.setTextColor(239, 68, 68); // rose-500
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(item.status.toUpperCase(), textX + 43, y + 18);

    // Grid item 3: Localização
    doc.rect(textX + 69, y + 11, 58, 9, 'F');
    doc.rect(textX + 69, y + 11, 58, 9, 'S');
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text("CÔMODO / LOCALIZAÇÃO", textX + 71, y + 14);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    const croppedLocation = item.location.length > 28 ? `${item.location.substring(0, 25)}...` : item.location;
    doc.text(croppedLocation.toUpperCase(), textX + 71, y + 18);

    // Observações / Descrição do Estado
    doc.setFillColor(255, 255, 255);
    doc.rect(textX, y + 22, 127, 16, 'F');
    doc.rect(textX, y + 22, 127, 16, 'S');
    
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text("OBSERVAÇÕES DO ESTADO DE CONSERVAÇÃO", textX + 2, y + 25);
    
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const rawDesc = item.description || 'Nenhuma observação reportada para este ativo.';
    const splitDesc = doc.splitTextToSize(rawDesc, 123);
    doc.text(splitDesc, textX + 2, y + 29);

    // Serial & Creation Date info
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "mono");
    doc.setFontSize(6.5);
    const serialText = `Nº SÉRIE: ${item.serialNumber || 'NÃO CONSTA'}`;
    const dateText = `REGISTRO: ${new Date(item.createdAt).toLocaleString('pt-BR')}`;
    doc.text(`${serialText}   |   ${dateText}`, textX, y + 42);

    y += 54;
  }

  // Signature Block
  if (report.signature || report.providerSignature) {
    // Check space for signature (we need about 65mm)
    if (y + 65 > 275) {
      doc.addPage();
      currentPage++;
      drawPageHeader(currentPage);
      drawPageFooter(currentPage);
      y = 30; // Reset y
    }

    y += 5;
    
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y, 195, y); // divider line
    
    y += 8;

    // Left Signature: Client
    if (report.signature) {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, y, 85, 32, 'F');
      doc.rect(15, y, 85, 32, 'S');

      if (report.signature.signatureDataUrl) {
        try {
          doc.addImage(report.signature.signatureDataUrl, 'PNG', 20, y + 2, 75, 22);
        } catch (err) {
          console.error("Error drawing signature image in PDF", err);
          doc.setTextColor(148, 163, 184);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.text("[Assinatura Digital Armazenada]", 57.5, y + 16, { align: 'center' });
        }
      }

      y += 36;

      // Verification Seals & Labels for Client
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("✓ ASSINADO DIGITALMENTE (CLIENTE)", 57.5, y, { align: 'center' });

      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(report.signature.signedByName.toUpperCase(), 57.5, y + 5, { align: 'center' });

      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(`Documento: ${report.signature.signedByDocument}`, 57.5, y + 9, { align: 'center' });
      doc.setFont("helvetica", "mono");
      doc.setFontSize(6.5);
      doc.text(`Data/Hora: ${new Date(report.signature.signedAt).toLocaleString('pt-BR')}`, 57.5, y + 13, { align: 'center' });
      
      y -= 36; // return y for side-by-side
    } else {
      doc.setFillColor(254, 242, 242); // red-50
      doc.setDrawColor(254, 202, 202); // red-200
      doc.rect(15, y, 85, 32, 'F');
      doc.rect(15, y, 85, 32, 'S');

      y += 36;
      doc.setTextColor(239, 68, 68); // red-500
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("AGUARDANDO ASSINATURA", 57.5, y, { align: 'center' });
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("Cliente / Contratante", 57.5, y + 5, { align: 'center' });
      
      y -= 36;
    }

    // Right Signature: Provider / Driver
    if (report.providerSignature) {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240);
      doc.rect(110, y, 85, 32, 'F');
      doc.rect(110, y, 85, 32, 'S');

      if (report.providerSignature.signatureDataUrl) {
        try {
          doc.addImage(report.providerSignature.signatureDataUrl, 'PNG', 115, y + 2, 75, 22);
        } catch (err) {
          console.error("Error drawing signature image in PDF", err);
          doc.setTextColor(148, 163, 184);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.text("[Assinatura Digital Armazenada]", 152.5, y + 16, { align: 'center' });
        }
      }

      y += 36;

      // Verification Seals & Labels for Provider
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("✓ ASSINADO DIGITALMENTE (PRESTADOR)", 152.5, y, { align: 'center' });

      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(report.providerSignature.signedByName.toUpperCase(), 152.5, y + 5, { align: 'center' });

      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(`Documento: ${report.providerSignature.signedByDocument}`, 152.5, y + 9, { align: 'center' });
      doc.setFont("helvetica", "mono");
      doc.setFontSize(6.5);
      doc.text(`Data/Hora: ${new Date(report.providerSignature.signedAt).toLocaleString('pt-BR')}`, 152.5, y + 13, { align: 'center' });
    } else {
      doc.setFillColor(254, 242, 242); // red-50
      doc.setDrawColor(254, 202, 202); // red-200
      doc.rect(110, y, 85, 32, 'F');
      doc.rect(110, y, 85, 32, 'S');

      y += 36;
      doc.setTextColor(239, 68, 68); // red-500
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("AGUARDANDO ASSINATURA", 152.5, y, { align: 'center' });
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("Prestador / Motorista", 152.5, y + 5, { align: 'center' });
    }

    y += 20;
  }

  // Trigger Save / Download
  const fileName = `laudo_vistoria_${report.id}.pdf`;
  doc.save(fileName);
};
