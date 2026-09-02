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

export interface ServiceType {
  id: string;
  name: string;
  cpTemplate?: string;
}

export interface Attachment {
  id: string;
  userId: string;
  dealId?: string;
  clientId?: string;
  articleId?: string;
  taskId?: string;
  filename: string;
  originalName: string;
  mimeType?: string;
  size: number;
  createdAt: string;
}

export interface KBCategory {
  id: string;
  userId: string;
  name: string;
  slug: string;
  icon?: string;
  isPublic: boolean;
  order: number;
  createdAt: string;
}

export interface KBArticle {
  id: string;
  userId: string;
  categoryId?: string;
  title: string;
  slug: string;
  content: string;
  tags: string[];
  isPublic: boolean;
  isPinned: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  accessNotes?: string;
  archived: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  projectId?: string;
  parentId?: string;
  dealId?: string;
  clientId?: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  order: number;
  dueDate?: string;
  assignedTo?: string;
  tags: string[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  subtasks?: Task[];
}

export interface TaskTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  tasks: { title: string; description?: string; subtasks?: { title: string }[] }[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskColumn {
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
  taskColumns?: TaskColumn[];
  geminiProxy?: string;
  stageScripts?: StageScript[];
  services?: ServiceType[];
  crmTitle?: string;
  crmFavicon?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
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
  accessNotes?: string;
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
