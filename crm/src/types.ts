export interface CPFormData {
  clientName: string;
  projectType: string;
  currentSituation: string;
  businessGoals: string;
  growthPoints: string;
  budget?: string;
  timeline?: string;
}

export interface GenerateResponse {
  result: string;
}

export interface KanbanColumn {
  id: string;
  label: string;
  color: string;
  order: number;
}

export interface AgencySettings {
  agencyName: string;
  inn: string;
  kpp: string;
  ogrn: string;
  directorName: string;
  address: string;
  bankAccount: string;
  bankName: string;
  bik: string;
  contractTemplate: string;
  actTemplate: string;
  kanbanColumns: KanbanColumn[];
  geminiProxy?: string;
}

export interface Deal {
  id: string;
  userId: string;
  clientName: string;
  projectType: string;
  status: string;
  amount: number;
  createdAt: number;
  updatedAt: number;
  currentSituation: string;
  businessGoals: string;
  growthPoints: string;
  cpData?: string; // Markdown text of CP
  contractData?: string; // Markdown text of Contract
  actData?: string; // Markdown text of Act
  legalInfo?: {
    companyName: string;
    inn: string;
    kpp: string;
    ogrn: string;
    directorName: string;
    address: string;
    bankAccount: string;
    bankName: string;
    bik: string;
  };
}
