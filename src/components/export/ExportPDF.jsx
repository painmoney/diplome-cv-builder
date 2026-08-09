import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { getPdfTemplateComponent } from './templates/pdfTemplateRegistry';
import { prepareResumeDataForPdf } from '../../utils/pdfImage';

export const exportToPDF = async (resumeData, template = 'minimalist') => {
  try {
    const PDFTemplate = getPdfTemplateComponent(template);
    const { data, photoOmitted } = await prepareResumeDataForPdf(resumeData);
    const blob = await pdf(<PDFTemplate data={data} />).toBlob();
    const fileName = `${resumeData.profile?.name || 'resume'}_${Date.now()}.pdf`;
    saveAs(blob, fileName);
    
    return {
      success: true,
      message: photoOmitted
        ? 'PDF сохранён, но фото не удалось загрузить'
        : 'PDF успешно сохранен!',
    };
  } catch {
    return { success: false, message: 'Ошибка при создании PDF' };
  }
};
