import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { getPdfTemplateComponent } from './templates/pdfTemplateRegistry';

export const exportToPDF = async (resumeData, template = 'minimalist') => {
  try {
    const PDFTemplate = getPdfTemplateComponent(template);
    const blob = await pdf(<PDFTemplate data={resumeData} />).toBlob();
    const fileName = `${resumeData.profile?.name || 'resume'}_${Date.now()}.pdf`;
    saveAs(blob, fileName);
    
    return { success: true, message: 'PDF успешно сохранен!' };
  } catch {
    return { success: false, message: 'Ошибка при создании PDF' };
  }
};
