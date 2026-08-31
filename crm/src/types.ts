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

export interface StageScript {
  stageId: string;
  script: string;
}

export interface Activity {
  id: string;
  dealId: string;
  userId: string;
  type: 'call' | 'email_sent' | 'meeting' | 'cp_sent' | 'note' | 'status_change' | 'created' | 'reminder';
  text: string;
  createdAt: string;
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
  stageScripts?: StageScript[];
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  source?: string;
  notes?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  userId: string;
  clientId?: string;
  clientName: string;
  projectType: string;
  status: string;
  amount: number;
  phone?: string;
  email?: string;
  company?: string;
  source?: string;
  temperature?: 'hot' | 'warm' | 'cold';
  reminderDate?: string;
  reminderNote?: string;
  createdAt: string;
  updatedAt: string;
  currentSituation: string;
  businessGoals: string;
  growthPoints: string;
  cpData?: string;
  contractData?: string;
  actData?: string;
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
