import createCollectTemplate from "./collect.js";
import createDodgeTemplate from "./dodge.js";

// reaction 템플릿을 추가할 때 여기에만 등록하면 된다.
const TEMPLATE_FACTORIES = {
  collect: createCollectTemplate,
  dodge: createDodgeTemplate,
};

export function createTemplate(templateId) {
  const factory = TEMPLATE_FACTORIES[templateId];
  if (!factory) throw new Error(`Unknown template: ${templateId}`);
  return factory();
}
