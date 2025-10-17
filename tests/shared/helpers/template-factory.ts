import { Template, TemplateStatus, TemplateType } from './types';

export const TemplateFactory = {
  createEmailTemplate: (id: string, clientId: string): Template => {
    return TemplateFactory.create(id, clientId, TemplateType.EMAIL, {
      id,
      templateType: TemplateType.EMAIL,
      subject: '',
    });
  },

  createSmsTemplate: (id: string, clientId: string): Template => {
    return TemplateFactory.create(id, clientId, TemplateType.SMS, {
      id,
      templateType: TemplateType.SMS,
    });
  },

  createNhsAppTemplate: (id: string, clientId: string): Template => {
    return TemplateFactory.create(id, clientId, TemplateType.NHS_APP, {
      templateType: TemplateType.NHS_APP,
    });
  },

  create: (
    id: string,
    clientId: string,
    templateType: TemplateType,
    template: Partial<Template>
  ): Template => {
    return {
      id,
      owner: `CLIENT#${clientId}`,
      templateType,
      clientId,
      templateStatus: TemplateStatus.NOT_YET_SUBMITTED,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: '',
      message: '',
      ...template,
    };
  },
};
