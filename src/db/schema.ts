import { mysqlTable, varchar, text, int, timestamp, json, boolean } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const settings = mysqlTable('settings', {
  userId: varchar('user_id', { length: 255 }).primaryKey(),
  agencyName: varchar('agency_name', { length: 255 }),
  inn: varchar('inn', { length: 50 }),
  kpp: varchar('kpp', { length: 50 }),
  ogrn: varchar('ogrn', { length: 50 }),
  directorName: varchar('director_name', { length: 255 }),
  address: text('address'),
  bankAccount: varchar('bank_account', { length: 50 }),
  bankName: varchar('bank_name', { length: 255 }),
  bik: varchar('bik', { length: 50 }),
  contractTemplate: text('contract_template'),
  actTemplate: text('act_template'),
  kanbanColumns: json('kanban_columns'),
  taskColumns: json('task_columns'),
  geminiProxy: varchar('gemini_proxy', { length: 255 }),
  stageScripts: json('stage_scripts'),
  services: json('services'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const clients = mysqlTable('clients', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }),
  phone: varchar('phone', { length: 100 }),
  email: varchar('email', { length: 255 }),
  source: varchar('source', { length: 100 }),
  legalInfo: json('legal_info'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const deals = mysqlTable('deals', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  clientId: varchar('client_id', { length: 255 }),
  clientName: varchar('client_name', { length: 255 }).notNull(),
  projectType: varchar('project_type', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  amount: int('amount').default(0),
  phone: varchar('phone', { length: 100 }),
  email: varchar('email', { length: 255 }),
  company: varchar('company', { length: 255 }),
  source: varchar('source', { length: 100 }),
  temperature: varchar('temperature', { length: 20 }),
  reminderDate: varchar('reminder_date', { length: 50 }),
  reminderNote: varchar('reminder_note', { length: 500 }),
  currentSituation: text('current_situation'),
  businessGoals: text('business_goals'),
  growthPoints: text('growth_points'),
  cpData: text('cp_data'),
  contractData: text('contract_data'),
  actData: text('act_data'),
  legalInfo: json('legal_info'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const attachments = mysqlTable('attachments', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  dealId: varchar('deal_id', { length: 255 }),
  clientId: varchar('client_id', { length: 255 }),
  articleId: varchar('article_id', { length: 255 }),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 500 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  size: int('size').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const kbCategories = mysqlTable('kb_categories', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 50 }),
  isPublic: boolean('is_public').default(false),
  order: int('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const kbArticles = mysqlTable('kb_articles', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  categoryId: varchar('category_id', { length: 255 }),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull(),
  content: text('content'),
  tags: json('tags'),
  isPublic: boolean('is_public').default(false),
  isPinned: boolean('is_pinned').default(false),
  views: int('views').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const projects = mysqlTable('projects', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 50 }).default('#3b82f6'),
  icon: varchar('icon', { length: 50 }).default('Folder'),
  archived: boolean('archived').default(false),
  order: int('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const tasks = mysqlTable('tasks', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  projectId: varchar('project_id', { length: 255 }),
  parentId: varchar('parent_id', { length: 255 }),
  dealId: varchar('deal_id', { length: 255 }),
  clientId: varchar('client_id', { length: 255 }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('inbox'),
  priority: int('priority').default(0),
  order: int('order').default(0),
  dueDate: varchar('due_date', { length: 50 }),
  assignedTo: varchar('assigned_to', { length: 255 }),
  tags: json('tags'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const taskTemplates = mysqlTable('task_templates', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  tasks: json('tasks'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const activities = mysqlTable('activities', {
  id: varchar('id', { length: 255 }).primaryKey(),
  dealId: varchar('deal_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  text: text('text'),
  createdAt: timestamp('created_at').defaultNow(),
});
