import MinimalistPDF from "./MinimalistPDF";
import AcademicPDF from "./AcademicPDF";
import GithubPDF from "./GithubPDF";
import ClassicPDF from "./ClassicPDF";
import { getSafeTemplateId } from "../../../utils/templateRegistry";

const PDF_TEMPLATE_COMPONENTS = {
  minimalist: MinimalistPDF,
  academic: AcademicPDF,
  github: GithubPDF,
  classic: ClassicPDF,
};

/**
 * Возвращает PDF component по template id.
 * Fallback: MinimalistPDF.
 */
export function getPdfTemplateComponent(templateId) {
  const id = getSafeTemplateId(templateId);
  return PDF_TEMPLATE_COMPONENTS[id] || MinimalistPDF;
}
