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
  geminiProxy: varchar('gemini_proxy', { length: 255 }),
  stageScripts: json('stage_scripts'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const deals = mysqlTable('deals', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
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

export const activities = mysqlTable('activities', {
  id: varchar('id', { length: 255 }).primaryKey(),
  dealId: varchar('deal_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  text: text('text'),
  createdAt: timestamp('created_at').defaultNow(),
});
