import minimalistTemplate from '../templates/minimalist.json';
import academicTemplate from '../templates/academic.json';
import githubTemplate from '../templates/github.json';

export const templates = {
  minimalist: minimalistTemplate,
  academic: academicTemplate,
  github: githubTemplate
};

export const getTemplateData = (templateName) => {
  return templates[templateName]?.defaultData || templates.minimalist.defaultData;
};

export const getTemplateStyle = (templateName) => {
  return templates[templateName]?.style || templates.minimalist.style;
};

export const getTemplateInfo = (templateName) => {
  const template = templates[templateName] || templates.minimalist;
  return {
    name: template.name,
    description: template.description,
    template: template.template
  };
};

export const getAllTemplates = () => {
  return Object.keys(templates).map(key => ({
    id: key,
    name: templates[key].name,
    description: templates[key].description,
    preview: templates[key].style
  }));
};
