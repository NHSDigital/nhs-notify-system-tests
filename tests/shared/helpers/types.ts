export enum TemplateType {
  NHS_APP = 'NHS_APP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  LETTER = 'LETTER',
}

export enum TemplateStatus {
  NOT_YET_SUBMITTED = 'NOT_YET_SUBMITTED',
  SUBMITTED = 'SUBMITTED',
}

export type Template = {
  clientId: string;
  createdAt: string;
  id: string;
  message: string;
  name: string;
  owner: string;
  subject?: string;
  templateStatus: TemplateStatus;
  templateType: TemplateType;
  updatedAt: string;
  version: number;
};
