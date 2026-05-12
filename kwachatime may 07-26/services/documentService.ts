
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = async (htmlContent: string, filename: string, options: { width?: number; height?: number; className?: string } = {}) => {
  const container = document.createElement('div');
  container.className = options.className || '';
  container.style.width = options.width ? `${options.width}mm` : '210mm'; // Default A4 width
  container.style.padding = '10mm';
  container.style.backgroundColor = 'white';
  container.style.fontFamily = '"Inter", sans-serif';
  container.innerHTML = htmlContent;
  
  // To ensure it's not visible but rendered
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  try {
    // Ensure fonts are loaded
    await document.fonts.ready;
    
    const canvas = await html2canvas(container, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: options.width ? [options.width, options.height || (canvas.height * options.width / canvas.width)] : 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    document.body.removeChild(container);
    
    return pdf.output('blob');
  } catch (error) {
    console.error('PDF generation failed', error);
    document.body.removeChild(container);
    throw error;
  }
};

export const generatePOSPrintFormat = async (htmlContent: string) => {
  // POS printers are typically 58mm (2.25 inches) or 80mm (3 inches)
  // Topwise T3 usually has a 58mm printer
  return generatePDF(htmlContent, 'pos_print.pdf', { width: 58 });
};
