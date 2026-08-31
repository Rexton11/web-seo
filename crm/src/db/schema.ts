import { mysqlTable, varchar, text, int, timestamp, json } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(), // Firebase Auth UID
  email: varchar('email', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const settings = mysqlTable('settings', {
  userId: varchar('user_id', { length: 255 }).primaryKey(), // One setting per user
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
  kanbanColumns: json('kanban_columns'), // Store as JSON array
  geminiProxy: varchar('gemini_proxy', { length: 255 }),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const deals = mysqlTable('deals', {
  id: varchar('id', { length: 255 }).primaryKey(), // UUID
  userId: varchar('user_id', { length: 255 }).notNull(),
  clientName: varchar('client_name', { length: 255 }).notNull(),
  projectType: varchar('project_type', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  amount: int('amount').default(0),
  currentSituation: text('current_situation'),
  businessGoals: text('business_goals'),
  growthPoints: text('growth_points'),
  cpData: text('cp_data'),
  contractData: text('contract_data'),
  actData: text('act_data'),
  legalInfo: json('legal_info'), // JSON object
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
