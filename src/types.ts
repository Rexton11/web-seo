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
  yandexClientId?: string;
  yandexClientSecret?: string;
  googleClientId?: string;
  googleClientSecret?: string;
}

export interface SeoConnection {
  id: string;
  userId: string;
  projectId?: string;
  service: 'yandex_webmaster' | 'yandex_metrica';
  siteUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  hostId?: string;
  counterId?: string;
  meta?: any;
  createdAt: string;
  updatedAt: string;
}

export interface SeoReport {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  period?: string;
  dateFrom?: string;
  dateTo?: string;
  status: 'draft' | 'generating' | 'ready' | 'error';
  data?: SeoReportData;
  createdAt: string;
  updatedAt: string;
}

export interface SeoReportData {
  webmaster?: {
    totalClicks?: number;
    totalImpressions?: number;
    avgCtr?: number;
    avgPosition?: number;
    queries?: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
    pages?: { url: string; clicks: number; impressions: number }[];
    indexing?: { indexed: number; excluded: number };
  };
  metrica?: {
    visits?: number;
    pageviews?: number;
    users?: number;
    bounceRate?: number;
    avgDuration?: number;
    sources?: { name: string; visits: number; percentage: number }[];
    topPages?: { url: string; views: number }[];
    searchEngines?: { name: string; visits: number }[];
    geography?: { country: string; visits: number }[];
  };
  tasks?: { title: string; status: string; completedAt?: string }[];
  generatedAt?: string;
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
