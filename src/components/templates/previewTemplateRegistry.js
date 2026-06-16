import MinimalistTemplate from "./MinimalistTemplate";
import AcademicTemplate from "./AcademicTemplate";
import GithubTemplate from "./GithubTemplate";
import { getSafeTemplateId } from "../../utils/templateRegistry";

const PREVIEW_TEMPLATE_COMPONENTS = {
  minimalist: MinimalistTemplate,
  academic: AcademicTemplate,
  github: GithubTemplate,
};

/**
 * Возвращает Preview component по template id.
 * Fallback: MinimalistTemplate.
 */
export function getPreviewTemplateComponent(templateId) {
  const id = getSafeTemplateId(templateId);
  return PREVIEW_TEMPLATE_COMPONENTS[id] || MinimalistTemplate;
}
