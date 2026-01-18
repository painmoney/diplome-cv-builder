import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import MinimalistPDF from './templates/MinimalistPDF';
import AcademicPDF from './templates/AcademicPDF';
import GithubPDF from './templates/GithubPDF';

export const exportToPDF = async (resumeData, template = 'minimalist') => {
  try {
    let PDFTemplate;
    
    switch (template) {
      case 'academic':
        PDFTemplate = AcademicPDF;
        break;
      case 'github':
        PDFTemplate = GithubPDF;
        break;
      case 'minimalist':
      default:
        PDFTemplate = MinimalistPDF;
        break;
    }

    const blob = await pdf(<PDFTemplate data={resumeData} />).toBlob();
    const fileName = `${resumeData.profile?.name || 'resume'}_${Date.now()}.pdf`;
    saveAs(blob, fileName);
    
    return { success: true, message: 'PDF успешно сохранен!' };
  } catch (error) {
    console.error('PDF Export Error:', error);
    return { success: false, message: 'Ошибка при создании PDF' };
  }
};
