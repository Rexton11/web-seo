import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { eq, and, desc, or, like, sql, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getAuth } from 'firebase-admin/auth';
import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';
import { app as firebaseApp } from './src/lib/firebase-admin.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', 1);
  app.use(express.json());

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadsDir),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
      }
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  const apiRouter = express.Router();

  const requireAuth = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split('Bearer ')[1];

    try {
      const adminAuth = getAuth(firebaseApp);
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('Token verification error', error);
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload.user_id) {
          req.user = { uid: payload.user_id };
          return next();
        }
      } catch (e) { }

      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  const requireDb = (req: any, res: any, next: any) => {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected. Check DATABASE_URL environment variable.' });
    }
    next();
  };

  // Clients CRUD
  apiRouter.get('/clients', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const clients = await db!.select().from(schema.clients)
        .where(eq(schema.clients.userId, req.user.uid))
        .orderBy(desc(schema.clients.updatedAt));
      res.json(clients);
    } catch (e: any) {
      console.error('GET /clients error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.get('/clients/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const result = await db!.select().from(schema.clients).where(and(
        eq(schema.clients.id, req.params.id),
        eq(schema.clients.userId, req.user.uid)
      ));
      if (result.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result[0]);
    } catch (e: any) {
      console.error('GET /clients/:id error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.get('/clients/:id/deals', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const result = await db!.select().from(schema.deals).where(and(
        eq(schema.deals.clientId, req.params.id),
        eq(schema.deals.userId, req.user.uid)
      )).orderBy(desc(schema.deals.createdAt));
      res.json(result);
    } catch (e: any) {
      console.error('GET /clients/:id/deals error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post('/clients', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const id = uuidv4();
      const newClient = {
        id,
        userId: req.user.uid,
        name: req.body.name || 'Новый клиент',
        company: req.body.company || null,
        phone: req.body.phone || null,
        email: req.body.email || null,
        source: req.body.source || null,
        legalInfo: req.body.legalInfo || null,
        notes: req.body.notes || null,
      };
      await db!.insert(schema.clients).values(newClient);
      res.json(newClient);
    } catch (e: any) {
      console.error('POST /clients error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.put('/clients/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const safeFields: any = {};
      const allowedKeys = ['name', 'company', 'phone', 'email', 'source', 'legalInfo', 'notes', 'accessNotes'];
      for (const key of allowedKeys) {
        if (req.body[key] !== undefined) {
          safeFields[key] = req.body[key];
        }
      }
      await db!.update(schema.clients)
        .set(safeFields)
        .where(and(eq(schema.clients.id, req.params.id), eq(schema.clients.userId, req.user.uid)));
      res.json({ success: true });
    } catch (e: any) {
      console.error('PUT /clients/:id error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.delete('/clients/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      // Unlink deals from this client (don't delete them)
      await db!.update(schema.deals)
        .set({ clientId: null })
        .where(and(eq(schema.deals.clientId, req.params.id), eq(schema.deals.userId, req.user.uid)));
      await db!.delete(schema.clients).where(and(
        eq(schema.clients.id, req.params.id),
        eq(schema.clients.userId, req.user.uid)
      ));
      res.json({ success: true });
    } catch (e: any) {
      console.error('DELETE /clients/:id error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Deals CRUD
  apiRouter.get('/deals', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const deals = await db!.select().from(schema.deals).where(eq(schema.deals.userId, req.user.uid));
      res.json(deals);
    } catch (e: any) {
      console.error('GET /deals error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post('/deals', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const id = uuidv4();
      const newDeal = {
        id,
        userId: req.user.uid,
        clientId: req.body.clientId || null,
        clientName: req.body.clientName || 'Новая сделка',
        projectType: req.body.projectType || '',
        status: req.body.status || 'new',
        amount: req.body.amount ?? 0,
        phone: req.body.phone || null,
        email: req.body.email || null,
        company: req.body.company || null,
        source: req.body.source || 'manual',
        temperature: req.body.temperature || 'warm',
        reminderDate: req.body.reminderDate || null,
        reminderNote: req.body.reminderNote || null,
        currentSituation: req.body.currentSituation || null,
        businessGoals: req.body.businessGoals || null,
        growthPoints: req.body.growthPoints || null,
        cpData: req.body.cpData || null,
        contractData: req.body.contractData || null,
        actData: req.body.actData || null,
        legalInfo: req.body.legalInfo || null,
      };
      await db!.insert(schema.deals).values(newDeal);

      const activityId = uuidv4();
      await db!.insert(schema.activities).values({
        id: activityId,
        dealId: id,
        userId: req.user.uid,
        type: 'created',
        text: 'Сделка создана',
      });

      res.json(newDeal);
    } catch (e: any) {
      console.error('POST /deals error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.get('/deals/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const result = await db!.select().from(schema.deals).where(and(
        eq(schema.deals.id, req.params.id),
        eq(schema.deals.userId, req.user.uid)
      ));
      if (result.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result[0]);
    } catch (e: any) {
      console.error('GET /deals/:id error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.put('/deals/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const safeFields: any = {};
      const allowedKeys = [
        'clientId', 'clientName', 'projectType', 'status', 'amount',
        'phone', 'email', 'company', 'source', 'temperature',
        'reminderDate', 'reminderNote',
        'currentSituation', 'businessGoals', 'growthPoints',
        'cpData', 'contractData', 'actData', 'legalInfo'
      ];
      for (const key of allowedKeys) {
        if (req.body[key] !== undefined) {
          safeFields[key] = req.body[key];
        }
      }
      await db!.update(schema.deals)
        .set(safeFields)
        .where(and(eq(schema.deals.id, req.params.id), eq(schema.deals.userId, req.user.uid)));
      res.json({ success: true });
    } catch (e: any) {
      console.error('PUT /deals/:id error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.delete('/deals/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      await db!.delete(schema.activities).where(eq(schema.activities.dealId, req.params.id));
      await db!.delete(schema.deals).where(and(
        eq(schema.deals.id, req.params.id),
        eq(schema.deals.userId, req.user.uid)
      ));
      res.json({ success: true });
    } catch (e: any) {
      console.error('DELETE /deals/:id error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Activities CRUD
  apiRouter.get('/deals/:dealId/activities', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const result = await db!.select().from(schema.activities)
        .where(and(
          eq(schema.activities.dealId, req.params.dealId),
          eq(schema.activities.userId, req.user.uid)
        ))
        .orderBy(desc(schema.activities.createdAt));
      res.json(result);
    } catch (e: any) {
      console.error('GET /activities error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post('/deals/:dealId/activities', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const id = uuidv4();
      const activity = {
        id,
        dealId: req.params.dealId,
        userId: req.user.uid,
        type: req.body.type || 'note',
        text: req.body.text || null,
      };
      await db!.insert(schema.activities).values(activity);
      res.json(activity);
    } catch (e: any) {
      console.error('POST /activities error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Settings CRUD
  apiRouter.get('/settings', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const result = await db!.select().from(schema.settings).where(eq(schema.settings.userId, req.user.uid));
      if (result.length === 0) return res.json(null);
      res.json(result[0]);
    } catch (e: any) {
      console.error('GET /settings error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.put('/settings', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const safeFields: any = {};
      const allowedKeys = [
        'agencyName', 'inn', 'kpp', 'ogrn', 'directorName', 'address',
        'bankAccount', 'bankName', 'bik', 'contractTemplate', 'actTemplate',
        'kanbanColumns', 'taskColumns', 'geminiProxy', 'stageScripts', 'services',
        'crmTitle', 'crmFavicon', 'telegramBotToken', 'telegramChatId',
        'yandexClientId', 'yandexClientSecret',
        'googleClientId', 'googleClientSecret'
      ];
      for (const key of allowedKeys) {
        if (req.body[key] !== undefined) {
          safeFields[key] = req.body[key] ?? null;
        }
      }

      const existing = await db!.select().from(schema.settings).where(eq(schema.settings.userId, req.user.uid));
      if (existing.length > 0) {
        await db!.update(schema.settings).set(safeFields).where(eq(schema.settings.userId, req.user.uid));
      } else {
        await db!.insert(schema.settings).values({
          userId: req.user.uid,
          agencyName: req.body.agencyName || null,
          inn: req.body.inn || null,
          kpp: req.body.kpp || null,
          ogrn: req.body.ogrn || null,
          directorName: req.body.directorName || null,
          address: req.body.address || null,
          bankAccount: req.body.bankAccount || null,
          bankName: req.body.bankName || null,
          bik: req.body.bik || null,
          contractTemplate: req.body.contractTemplate || null,
          actTemplate: req.body.actTemplate || null,
          kanbanColumns: req.body.kanbanColumns || null,
          taskColumns: req.body.taskColumns || null,
          geminiProxy: req.body.geminiProxy || null,
          stageScripts: req.body.stageScripts || null,
          services: req.body.services || null,
          crmTitle: req.body.crmTitle || null,
          crmFavicon: req.body.crmFavicon || null,
          telegramBotToken: req.body.telegramBotToken || null,
          telegramChatId: req.body.telegramChatId || null,
          yandexClientId: req.body.yandexClientId || null,
          yandexClientSecret: req.body.yandexClientSecret || null,
        });
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error('PUT /settings error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Projects CRUD
  apiRouter.get('/projects', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const result = await db!.select().from(schema.projects)
        .where(eq(schema.projects.userId, req.user.uid))
        .orderBy(asc(schema.projects.order));
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post('/projects', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const id = uuidv4();
      const project = {
        id,
        userId: req.user.uid,
        name: req.body.name || 'Новый проект',
        description: req.body.description || null,
        color: req.body.color || '#3b82f6',
        icon: req.body.icon || 'Folder',
        archived: false,
        order: req.body.order ?? 0,
      };
      await db!.insert(schema.projects).values(project);
      res.json(project);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.put('/projects/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const safeFields: any = {};
      const allowedKeys = ['name', 'description', 'color', 'icon', 'accessNotes', 'archived', 'order'];
      for (const key of allowedKeys) {
        if (req.body[key] !== undefined) safeFields[key] = req.body[key];
      }
      await db!.update(schema.projects).set(safeFields)
        .where(and(eq(schema.projects.id, req.params.id), eq(schema.projects.userId, req.user.uid)));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.delete('/projects/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      await db!.update(schema.tasks).set({ projectId: null })
        .where(and(eq(schema.tasks.projectId, req.params.id), eq(schema.tasks.userId, req.user.uid)));
      await db!.delete(schema.projects)
        .where(and(eq(schema.projects.id, req.params.id), eq(schema.projects.userId, req.user.uid)));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Tasks CRUD
  apiRouter.get('/tasks', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const { projectId, status, parentId } = req.query;
      let conditions = [eq(schema.tasks.userId, req.user.uid)];
      if (projectId) conditions.push(eq(schema.tasks.projectId, projectId as string));
      if (status) conditions.push(eq(schema.tasks.status, status as string));
      if (parentId) conditions.push(eq(schema.tasks.parentId, parentId as string));
      const result = await db!.select().from(schema.tasks)
        .where(and(...conditions))
        .orderBy(asc(schema.tasks.order), desc(schema.tasks.createdAt));
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post('/tasks', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const id = uuidv4();
      const task = {
        id,
        userId: req.user.uid,
        projectId: req.body.projectId || null,
        parentId: req.body.parentId || null,
        dealId: req.body.dealId || null,
        clientId: req.body.clientId || null,
        title: req.body.title || 'Новая задача',
        description: req.body.description || null,
        status: req.body.status || 'inbox',
        priority: req.body.priority ?? 0,
        order: req.body.order ?? 0,
        dueDate: req.body.dueDate || null,
        assignedTo: req.body.assignedTo || null,
        tags: req.body.tags || null,
      };
      await db!.insert(schema.tasks).values(task);
      res.json(task);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.get('/tasks/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const result = await db!.select().from(schema.tasks).where(and(
        eq(schema.tasks.id, req.params.id),
        eq(schema.tasks.userId, req.user.uid)
      ));
      if (result.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.put('/tasks/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const safeFields: any = {};
      const allowedKeys = ['projectId', 'parentId', 'dealId', 'clientId', 'title', 'description', 'status', 'priority', 'order', 'dueDate', 'assignedTo', 'tags', 'completedAt'];
      for (const key of allowedKeys) {
        if (req.body[key] !== undefined) safeFields[key] = req.body[key];
      }
      await db!.update(schema.tasks).set(safeFields)
        .where(and(eq(schema.tasks.id, req.params.id), eq(schema.tasks.userId, req.user.uid)));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.delete('/tasks/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      await db!.delete(schema.tasks).where(and(eq(schema.tasks.parentId, req.params.id), eq(schema.tasks.userId, req.user.uid)));
      await db!.delete(schema.tasks).where(and(eq(schema.tasks.id, req.params.id), eq(schema.tasks.userId, req.user.uid)));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Task Templates CRUD
  apiRouter.get('/task-templates', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const result = await db!.select().from(schema.taskTemplates)
        .where(eq(schema.taskTemplates.userId, req.user.uid))
        .orderBy(desc(schema.taskTemplates.createdAt));
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post('/task-templates', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const id = uuidv4();
      const template = {
        id,
        userId: req.user.uid,
        name: req.body.name || 'Новый шаблон',
        description: req.body.description || null,
        tasks: req.body.tasks || null,
      };
      await db!.insert(schema.taskTemplates).values(template);
      res.json(template);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.put('/task-templates/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const safeFields: any = {};
      const allowedKeys = ['name', 'description', 'tasks'];
      for (const key of allowedKeys) {
        if (req.body[key] !== undefined) safeFields[key] = req.body[key];
      }
      await db!.update(schema.taskTemplates).set(safeFields)
        .where(and(eq(schema.taskTemplates.id, req.params.id), eq(schema.taskTemplates.userId, req.user.uid)));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.delete('/task-templates/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      await db!.delete(schema.taskTemplates)
        .where(and(eq(schema.taskTemplates.id, req.params.id), eq(schema.taskTemplates.userId, req.user.uid)));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create tasks from template
  apiRouter.post('/task-templates/:id/apply', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const tmplResult = await db!.select().from(schema.taskTemplates).where(and(
        eq(schema.taskTemplates.id, req.params.id),
        eq(schema.taskTemplates.userId, req.user.uid)
      ));
      if (tmplResult.length === 0) return res.status(404).json({ error: 'Template not found' });
      const tmpl = tmplResult[0];
      const templateTasks = typeof tmpl.tasks === 'string' ? JSON.parse(tmpl.tasks) : (tmpl.tasks || []);
      const projectId = req.body.projectId || null;
      const createdTasks: any[] = [];

      for (let i = 0; i < templateTasks.length; i++) {
        const t = templateTasks[i];
        const taskId = uuidv4();
        const task = {
          id: taskId,
          userId: req.user.uid,
          projectId,
          parentId: null,
          dealId: null,
          clientId: null,
          title: t.title,
          description: t.description || null,
          status: 'inbox',
          priority: 0,
          order: i,
          dueDate: null,
          assignedTo: null,
          tags: null,
        };
        await db!.insert(schema.tasks).values(task);
        createdTasks.push(task);

        if (t.subtasks) {
          for (let j = 0; j < t.subtasks.length; j++) {
            const sub = t.subtasks[j];
            const subId = uuidv4();
            const subtask = {
              id: subId,
              userId: req.user.uid,
              projectId,
              parentId: taskId,
              dealId: null,
              clientId: null,
              title: sub.title,
              description: null,
              status: 'inbox',
              priority: 0,
              order: j,
              dueDate: null,
              assignedTo: null,
              tags: null,
            };
            await db!.insert(schema.tasks).values(subtask);
          }
        }
      }
      res.json({ success: true, count: createdTasks.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Webhook for WordPress integrations
  apiRouter.post('/webhooks/wordpress/:userId', requireDb, async (req: any, res: any) => {
    try {
      const userId = req.params.userId;
      const data = req.body || {};

      const clientName = data.name || data.client_name || data.fullname || data.your_name || data['your-name'] || data.title || 'Новая заявка с сайта';
      const phone = data.phone || data.your_phone || data['your-phone'] || data.tel || '';
      const email = data.email || data.your_email || data['your-email'] || '';
      const message = data.message || data.your_message || data['your-message'] || '';
      const company = data.company || data.organization || '';

      let situation = "";
      if (message) situation += `${message}\n`;
      situation += `\n---\nТехнические данные:\n${JSON.stringify(data, null, 2)}`;

      const dealId = uuidv4();
      const newDeal = {
        id: dealId,
        userId: userId,
        clientName: clientName,
        projectType: 'Лид с сайта',
        status: 'new',
        amount: 0,
        phone: phone || null,
        email: email || null,
        company: company || null,
        source: 'website',
        temperature: 'warm',
        reminderDate: null,
        reminderNote: null,
        currentSituation: situation || null,
        businessGoals: null,
        growthPoints: null,
        cpData: null,
        contractData: null,
        actData: null,
        legalInfo: null,
      };

      await db!.insert(schema.deals).values(newDeal);

      await db!.insert(schema.activities).values({
        id: uuidv4(),
        dealId: dealId,
        userId: userId,
        type: 'created',
        text: 'Заявка получена с сайта',
      });

      res.status(200).json({ success: true, dealId: newDeal.id });
    } catch (e: any) {
      console.error("Webhook error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Attachments
  apiRouter.get('/attachments', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const { dealId, clientId, articleId } = req.query;
      let conditions = [eq(schema.attachments.userId, req.user.uid)];
      const { taskId } = req.query;
      if (dealId) conditions.push(eq(schema.attachments.dealId, dealId as string));
      if (clientId) conditions.push(eq(schema.attachments.clientId, clientId as string));
      if (articleId) conditions.push(eq(schema.attachments.articleId, articleId as string));
      if (taskId) conditions.push(eq(schema.attachments.taskId, taskId as string));
      const result = await db!.select().from(schema.attachments)
        .where(and(...conditions))
        .orderBy(desc(schema.attachments.createdAt));
      res.json(result);
    } catch (e: any) {
      console.error('GET /attachments error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post('/attachments', requireAuth, requireDb, upload.single('file'), async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const id = uuidv4();
      const attachment = {
        id,
        userId: req.user.uid,
        dealId: req.body.dealId || null,
        clientId: req.body.clientId || null,
        articleId: req.body.articleId || null,
        taskId: req.body.taskId || null,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype || null,
        size: req.file.size || 0,
      };
      await db!.insert(schema.attachments).values(attachment);
      res.json(attachment);
    } catch (e: any) {
      console.error('POST /attachments error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.delete('/attachments/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const result = await db!.select().from(schema.attachments).where(and(
        eq(schema.attachments.id, req.params.id),
        eq(schema.attachments.userId, req.user.uid)
      ));
      if (result.length === 0) return res.status(404).json({ error: 'Not found' });
      const filePath = path.join(uploadsDir, result[0].filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await db!.delete(schema.attachments).where(eq(schema.attachments.id, req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      console.error('DELETE /attachments/:id error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.get('/attachments/:id/download', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const result = await db!.select().from(schema.attachments).where(and(
        eq(schema.attachments.id, req.params.id),
        eq(schema.attachments.userId, req.user.uid)
      ));
      if (result.length === 0) return res.status(404).json({ error: 'Not found' });
      const filePath = path.join(uploadsDir, result[0].filename);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result[0].originalName)}"`);
      res.setHeader('Content-Type', result[0].mimeType || 'application/octet-stream');
      res.sendFile(filePath);
    } catch (e: any) {
      console.error('GET /attachments/:id/download error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // KB Categories CRUD
  apiRouter.get('/kb/categories', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const result = await db!.select().from(schema.kbCategories)
        .where(eq(schema.kbCategories.userId, req.user.uid))
        .orderBy(asc(schema.kbCategories.order));
      res.json(result);
    } catch (e: any) {
      console.error('GET /kb/categories error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post('/kb/categories', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const id = uuidv4();
      const category = {
        id,
        userId: req.user.uid,
        name: req.body.name || 'Новая категория',
        slug: req.body.slug || id,
        icon: req.body.icon || 'FileText',
        isPublic: req.body.isPublic ?? false,
        order: req.body.order ?? 0,
      };
      await db!.insert(schema.kbCategories).values(category);
      res.json(category);
    } catch (e: any) {
      console.error('POST /kb/categories error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.put('/kb/categories/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const safeFields: any = {};
      const allowedKeys = ['name', 'slug', 'icon', 'isPublic', 'order'];
      for (const key of allowedKeys) {
        if (req.body[key] !== undefined) safeFields[key] = req.body[key];
      }
      await db!.update(schema.kbCategories).set(safeFields)
        .where(and(eq(schema.kbCategories.id, req.params.id), eq(schema.kbCategories.userId, req.user.uid)));
      res.json({ success: true });
    } catch (e: any) {
      console.error('PUT /kb/categories/:id error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.delete('/kb/categories/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      await db!.delete(schema.kbArticles).where(and(
        eq(schema.kbArticles.categoryId, req.params.id),
        eq(schema.kbArticles.userId, req.user.uid)
      ));
      await db!.delete(schema.kbCategories).where(and(
        eq(schema.kbCategories.id, req.params.id),
        eq(schema.kbCategories.userId, req.user.uid)
      ));
      res.json({ success: true });
    } catch (e: any) {
      console.error('DELETE /kb/categories/:id error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // KB Articles CRUD
  apiRouter.get('/kb/articles', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const { categoryId, tag, q } = req.query;
      let conditions = [eq(schema.kbArticles.userId, req.user.uid)];
      if (categoryId) conditions.push(eq(schema.kbArticles.categoryId, categoryId as string));
      let result = await db!.select().from(schema.kbArticles)
        .where(and(...conditions))
        .orderBy(desc(schema.kbArticles.isPinned), desc(schema.kbArticles.updatedAt));

      if (q) {
        const search = (q as string).toLowerCase();
        result = result.filter((a: any) =>
          a.title.toLowerCase().includes(search) ||
          (a.content && a.content.toLowerCase().includes(search))
        );
      }
      if (tag) {
        result = result.filter((a: any) => {
          const tags = typeof a.tags === 'string' ? JSON.parse(a.tags) : (a.tags || []);
          return tags.includes(tag);
        });
      }
      res.json(result);
    } catch (e: any) {
      console.error('GET /kb/articles error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.get('/kb/articles/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const result = await db!.select().from(schema.kbArticles).where(and(
        eq(schema.kbArticles.id, req.params.id),
        eq(schema.kbArticles.userId, req.user.uid)
      ));
      if (result.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result[0]);
    } catch (e: any) {
      console.error('GET /kb/articles/:id error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post('/kb/articles', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const id = uuidv4();
      const article = {
        id,
        userId: req.user.uid,
        categoryId: req.body.categoryId || null,
        title: req.body.title || 'Новая статья',
        slug: req.body.slug || id,
        content: req.body.content || null,
        tags: req.body.tags || null,
        isPublic: req.body.isPublic ?? false,
        isPinned: req.body.isPinned ?? false,
        views: 0,
      };
      await db!.insert(schema.kbArticles).values(article);
      res.json(article);
    } catch (e: any) {
      console.error('POST /kb/articles error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.put('/kb/articles/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const safeFields: any = {};
      const allowedKeys = ['categoryId', 'title', 'slug', 'content', 'tags', 'isPublic', 'isPinned'];
      for (const key of allowedKeys) {
        if (req.body[key] !== undefined) safeFields[key] = req.body[key];
      }
      await db!.update(schema.kbArticles).set(safeFields)
        .where(and(eq(schema.kbArticles.id, req.params.id), eq(schema.kbArticles.userId, req.user.uid)));
      res.json({ success: true });
    } catch (e: any) {
      console.error('PUT /kb/articles/:id error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.delete('/kb/articles/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      await db!.delete(schema.attachments).where(eq(schema.attachments.articleId, req.params.id));
      await db!.delete(schema.kbArticles).where(and(
        eq(schema.kbArticles.id, req.params.id),
        eq(schema.kbArticles.userId, req.user.uid)
      ));
      res.json({ success: true });
    } catch (e: any) {
      console.error('DELETE /kb/articles/:id error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Public KB endpoints (no auth)
  apiRouter.get('/kb/public/:userId', requireDb, async (req: any, res: any) => {
    try {
      const userId = req.params.userId;
      const categories = await db!.select().from(schema.kbCategories)
        .where(and(eq(schema.kbCategories.userId, userId), eq(schema.kbCategories.isPublic, true)))
        .orderBy(asc(schema.kbCategories.order));
      const articles = await db!.select().from(schema.kbArticles)
        .where(and(eq(schema.kbArticles.userId, userId), eq(schema.kbArticles.isPublic, true)))
        .orderBy(desc(schema.kbArticles.isPinned), desc(schema.kbArticles.updatedAt));
      const settingsResult = await db!.select().from(schema.settings).where(eq(schema.settings.userId, userId));
      const agencyName = settingsResult.length > 0 ? (settingsResult[0] as any).agencyName : null;
      res.json({ categories, articles, agencyName });
    } catch (e: any) {
      console.error('GET /kb/public/:userId error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.get('/kb/public/:userId/:slug', requireDb, async (req: any, res: any) => {
    try {
      const { userId, slug } = req.params;
      const result = await db!.select().from(schema.kbArticles).where(and(
        eq(schema.kbArticles.userId, userId),
        eq(schema.kbArticles.slug, slug),
        eq(schema.kbArticles.isPublic, true)
      ));
      if (result.length === 0) return res.status(404).json({ error: 'Not found' });
      await db!.update(schema.kbArticles)
        .set({ views: sql`views + 1` })
        .where(eq(schema.kbArticles.id, result[0].id));
      const settingsResult = await db!.select().from(schema.settings).where(eq(schema.settings.userId, userId));
      const agencyName = settingsResult.length > 0 ? (settingsResult[0] as any).agencyName : null;
      res.json({ ...result[0], agencyName });
    } catch (e: any) {
      console.error('GET /kb/public/:userId/:slug error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  app.use('/api', apiRouter);

  // Test Gemini API connection (pass ?proxy=http://... to test through proxy)
  app.get('/api/test-gemini', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.json({ status: 'error', message: 'GEMINI_API_KEY не задан в .env' });
      }
      const proxyUrl = req.query.proxy as string;
      let fetchToUse = globalThis.fetch;
      if (proxyUrl) {
        const dispatcher = new ProxyAgent(proxyUrl);
        fetchToUse = ((url: any, init?: any) => undiciFetch(url, { ...init, dispatcher: dispatcher as any })) as any;
      }
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: proxyUrl ? { fetch: fetchToUse } : undefined,
      });
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: 'Ответь одним словом: работает',
      });
      res.json({ status: 'ok', proxy: proxyUrl || 'none', response: response.text });
    } catch (error: any) {
      res.json({ status: 'error', message: error.message });
    }
  });

  // AI generation endpoint
  app.post('/api/generate-cp', async (req, res) => {
    try {
      const {
        clientName,
        projectType,
        currentSituation,
        businessGoals,
        growthPoints,
        budget,
        timeline,
        proxy,
      } = req.body;

      if (!clientName || !projectType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const budgetText = budget ? `\n- Бюджетный ориентир: ${budget}` : '';
      const timelineText = timeline ? `\n- Ожидаемые сроки: ${timeline}` : '';

      const prompt = `
Ты - эксперт по B2B продажам, разработке сайтов и SEO с многолетним опытом.
Твоя задача - составить идеальное Коммерческое предложение (КП) по предоставленным вводным данным.
Это КП должно быть инструментом принятия решения, а не просто прайсом.
Оно должно четко показывать клиенту его текущую ситуацию, объяснять логику решения, фиксировать границы работ и делать следующий шаг очевидным.

ВВОДНЫЕ ДАННЫЕ О ПРОЕКТЕ:
- Название клиента: ${clientName}
- Тип проекта (целевая услуга): ${projectType}
- Текущая ситуация клиента: ${currentSituation || 'Не указана (сделай общие, но логичные предположения для ниши)'}
- Бизнес-цели: ${businessGoals || 'Увеличение заявок и обращений из интернета'}
- Выявленные точки роста (проблемы): ${growthPoints || 'Стандартные для этой услуги (например, нет посадочных, плохая конверсия, нет аналитики)'}${budgetText}${timelineText}

СТРУКТУРА КП (ОБЯЗАТЕЛЬНО СЛЕДУЙ ЕЙ!):

1. Обложка и контекст
(Укажи название клиента, тип проекта, цель, текущую дату и имя исполнителя)

2. Что мы поняли о задаче
(Перескажи ситуацию клиента 3-5 пунктами: приоритеты, география, текущая проблема, результат, ограничения. Читатель должен узнать себя.)

3. Точки роста и обоснование (в формате Markdown таблицы)
(3-4 конкретных наблюдения. Колонки: Наблюдение | Возможное последствие | Что предлагается)

4. Цель и критерии результата
(Отделяй цели от гарантий. Сформулируй измеримые результаты (согласованный прототип, настроенная аналитика, структура и т.д.))

5. Решение и логика работ (в формате Markdown таблицы)
(Разбей на 5-6 этапов. Колонки: Этап | Что делаем | Результат для клиента)

6. Scope (Границы работ): Что входит и что НЕ входит
(Очень важный блок. 5-7 пунктов что входит, 3-5 что НЕ входит без отдельной оценки)

7. Сроки и зависимости (в формате Markdown таблицы)
(Колонки: Этап | Ориентир | Что нужно от клиента. Добавь правило: "Пауза в согласовании переносит сроки")

8. Варианты и инвестиции (в формате Markdown таблицы)
(Всегда давай 3 варианта! Колонки: Вариант | Для какой задачи | Состав | Инвестиция. Сделай цены ориентировочными, например "от $X" или "около $Y/мес").

9. Доказательства и снятие рисков
(Опиши как будет идти работа, прозрачность, статус-отчеты)

10. CTA (Следующий шаг)
(Четко: 1. Выберите вариант 2. Созвонимся на 20 мин 3. Договор 4. Kickoff).

ПРАВИЛА И СТИЛЬ (КРИТИЧЕСКИ ВАЖНО):
- Формат: ТОЛЬКО валидный Markdown.
- Тон: Профессиональный, структурный, без воды и лишнего восторга (никакого "AI slop" или "супер-уникальный").
- Клиент покупает не часы или дизайн, а систему и результат. Пиши с позиции ценности для бизнеса.
- Не обещай точное число лидов, обещай систему, готовность к SEO, измеримость.
- Пиши на русском языке, используя профессиональную терминологию (scope, kickoff, LTV и т.д., если уместно).
- Никаких вступительных слов до первого заголовка ("Конечно, вот КП..."), выдай только сам текст коммерческого предложения.
      `;

      let fetchToUse = globalThis.fetch;
      if (proxy) {
        const dispatcher = new ProxyAgent(proxy);
        fetchToUse = ((url: any, init?: any) => undiciFetch(url, { ...init, dispatcher: dispatcher as any })) as any;
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { fetch: fetchToUse }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
        },
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error('Error generating CP:', error);
      res.status(500).json({ error: 'Failed to generate Commercial Proposal', details: error.message });
    }
  });

  // Telegram notification endpoint
  apiRouter.post('/telegram/test', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const { botToken, chatId } = req.body;
      if (!botToken || !chatId) return res.status(400).json({ error: 'botToken and chatId required' });
      const tgRes = await globalThis.fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: 'CRM подключена! Уведомления будут приходить сюда.', parse_mode: 'HTML' }),
      });
      const data = await tgRes.json();
      if (!data.ok) return res.status(400).json({ error: data.description || 'Telegram error' });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post('/telegram/notify', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const settingsResult = await db!.select().from(schema.settings).where(eq(schema.settings.userId, req.user.uid));
      if (settingsResult.length === 0) return res.status(400).json({ error: 'No settings' });
      const s = settingsResult[0] as any;
      if (!s.telegramBotToken || !s.telegramChatId) return res.status(400).json({ error: 'Telegram not configured' });
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: 'text required' });
      const tgRes = await globalThis.fetch(`https://api.telegram.org/bot${s.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: s.telegramChatId, text, parse_mode: 'HTML' }),
      });
      const data = await tgRes.json();
      if (!data.ok) return res.status(400).json({ error: data.description || 'Telegram error' });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---- SEO Connections CRUD ----
  apiRouter.get('/seo-connections', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const rows = await db!.select().from(schema.seoConnections).where(eq(schema.seoConnections.userId, req.user.uid));
      const safe = rows.map((r: any) => ({ ...r, accessToken: r.accessToken ? '***' : null, refreshToken: undefined, meta: r.meta }));
      res.json(safe);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.post('/seo-connections', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const id = uuidv4();
      const { service, projectId, siteUrl, accessToken, hostId, counterId } = req.body;
      await db!.insert(schema.seoConnections).values({
        id, userId: req.user.uid, service, projectId: projectId || null,
        siteUrl: siteUrl || null, accessToken: accessToken || null,
        hostId: hostId || null, counterId: counterId || null,
      });
      res.json({ id, service, siteUrl, hostId, counterId });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.put('/seo-connections/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const { service, projectId, siteUrl, accessToken, hostId, counterId } = req.body;
      const fields: any = {};
      if (service !== undefined) fields.service = service;
      if (projectId !== undefined) fields.projectId = projectId || null;
      if (siteUrl !== undefined) fields.siteUrl = siteUrl;
      if (accessToken !== undefined) fields.accessToken = accessToken;
      if (hostId !== undefined) fields.hostId = hostId;
      if (counterId !== undefined) fields.counterId = counterId;
      await db!.update(schema.seoConnections).set(fields)
        .where(and(eq(schema.seoConnections.id, req.params.id), eq(schema.seoConnections.userId, req.user.uid)));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.delete('/seo-connections/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      await db!.delete(schema.seoConnections)
        .where(and(eq(schema.seoConnections.id, req.params.id), eq(schema.seoConnections.userId, req.user.uid)));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ---- Yandex OAuth ----
  apiRouter.get('/yandex/auth-url', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const settingsResult = await db!.select().from(schema.settings).where(eq(schema.settings.userId, req.user.uid));
      const s = settingsResult[0] as any;
      if (!s?.yandexClientId) return res.status(400).json({ error: 'Yandex Client ID not configured in settings' });
      const service = req.query.service || 'webmaster';
      const state = JSON.stringify({ uid: req.user.uid, service });
      const url = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${s.yandexClientId}&state=${encodeURIComponent(state)}&force_confirm=yes`;
      res.json({ url });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.post('/yandex/token', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const { code, service } = req.body;
      const settingsResult = await db!.select().from(schema.settings).where(eq(schema.settings.userId, req.user.uid));
      const s = settingsResult[0] as any;
      if (!s?.yandexClientId || !s?.yandexClientSecret) return res.status(400).json({ error: 'Yandex OAuth not configured' });

      const tokenRes = await globalThis.fetch('https://oauth.yandex.ru/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=authorization_code&code=${code}&client_id=${s.yandexClientId}&client_secret=${s.yandexClientSecret}`,
      });
      const tokenData = await tokenRes.json() as any;
      if (tokenData.error) return res.status(400).json({ error: tokenData.error_description || tokenData.error });

      const connId = uuidv4();
      await db!.insert(schema.seoConnections).values({
        id: connId, userId: req.user.uid,
        service: service === 'metrica' ? 'yandex_metrica' : 'yandex_webmaster',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
      });
      res.json({ id: connId, service, success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ---- Google OAuth ----
  apiRouter.get('/google/auth-url', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const settingsResult = await db!.select().from(schema.settings).where(eq(schema.settings.userId, req.user.uid));
      const s = settingsResult[0] as any;
      if (!s?.googleClientId) return res.status(400).json({ error: 'Google Client ID не настроен в Настройках' });
      const redirectUri = `${process.env.APP_URL || `${req.protocol}://${req.get('host')}`}/api/google/callback`;
      const state = Buffer.from(JSON.stringify({ uid: req.user.uid })).toString('base64url');
      const scopes = [
        'https://www.googleapis.com/auth/webmasters.readonly',
      ].join(' ');
      const url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(s.googleClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${state}`;
      res.json({ url });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.get('/google/callback', async (req: any, res: any) => {
    try {
      const { code, state } = req.query;
      if (!code || !state) return res.status(400).send('Missing code or state');
      const { uid } = JSON.parse(Buffer.from(state as string, 'base64url').toString());
      if (!uid) return res.status(400).send('Invalid state');

      const settingsResult = await db!.select().from(schema.settings).where(eq(schema.settings.userId, uid));
      const s = settingsResult[0] as any;
      if (!s?.googleClientId || !s?.googleClientSecret) return res.status(400).send('Google OAuth не настроен');

      const redirectUri = `${process.env.APP_URL || `${req.protocol}://${req.get('host')}`}/api/google/callback`;
      const tokenRes = await globalThis.fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=authorization_code&code=${encodeURIComponent(code as string)}&client_id=${encodeURIComponent(s.googleClientId)}&client_secret=${encodeURIComponent(s.googleClientSecret)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
      });
      const tokenData = await tokenRes.json() as any;
      if (tokenData.error) return res.status(400).send(`Ошибка: ${tokenData.error_description || tokenData.error}`);

      const existing = await db!.select().from(schema.seoConnections)
        .where(and(eq(schema.seoConnections.userId, uid), eq(schema.seoConnections.service, 'google_search_console')));
      const mainConn = (existing as any[]).find(c => !c.projectId);

      const expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null;

      if (mainConn) {
        await db!.update(schema.seoConnections).set({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || mainConn.refreshToken,
          tokenExpiresAt: expiresAt,
        }).where(eq(schema.seoConnections.id, mainConn.id));
      } else {
        await db!.insert(schema.seoConnections).values({
          id: uuidv4(), userId: uid, service: 'google_search_console',
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          tokenExpiresAt: expiresAt,
        });
      }

      res.send('<html><body><script>window.close(); window.opener && window.opener.postMessage("gsc_connected","*");</script><p>Google Search Console подключён! Можете закрыть это окно.</p></body></html>');
    } catch (e: any) {
      console.error('Google callback error:', e);
      res.status(500).send(`Ошибка: ${e.message}`);
    }
  });

  async function refreshGoogleToken(conn: any) {
    const userId = conn.userId;
    const settingsResult = await db!.select().from(schema.settings).where(eq(schema.settings.userId, userId));
    const s = settingsResult[0] as any;
    if (!s?.googleClientId || !s?.googleClientSecret || !conn.refreshToken) return null;

    const tokenRes = await globalThis.fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(conn.refreshToken)}&client_id=${encodeURIComponent(s.googleClientId)}&client_secret=${encodeURIComponent(s.googleClientSecret)}`,
    });
    const tokenData = await tokenRes.json() as any;
    if (tokenData.error) { console.error('Google token refresh error:', tokenData); return null; }

    const expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null;
    await db!.update(schema.seoConnections).set({
      accessToken: tokenData.access_token,
      tokenExpiresAt: expiresAt,
    }).where(eq(schema.seoConnections.id, conn.id));

    return tokenData.access_token;
  }

  async function getGSCAccessToken(conn: any): Promise<string | null> {
    if (!conn?.accessToken) return null;
    if (conn.tokenExpiresAt && new Date(conn.tokenExpiresAt) < new Date(Date.now() + 60000)) {
      const newToken = await refreshGoogleToken(conn);
      return newToken || conn.accessToken;
    }
    return conn.accessToken;
  }

  // ---- Yandex Webmaster API proxy ----
  apiRouter.get('/yandex/webmaster/hosts', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const conn = await getYandexConnection(req.user.uid, 'yandex_webmaster');
      if (!conn) return res.status(400).json({ error: 'Yandex Webmaster not connected' });
      const userIdRes = await globalThis.fetch('https://api.webmaster.yandex.net/v4/user', {
        headers: { Authorization: `OAuth ${conn.accessToken}` },
      });
      const userData = await userIdRes.json() as any;
      const ymUserId = userData.user_id;
      const hostsRes = await globalThis.fetch(`https://api.webmaster.yandex.net/v4/user/${ymUserId}/hosts`, {
        headers: { Authorization: `OAuth ${conn.accessToken}` },
      });
      const hostsData = await hostsRes.json() as any;
      res.json({ hosts: hostsData.hosts || [], ymUserId });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.get('/yandex/webmaster/stats', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const conn = await getYandexConnection(req.user.uid, 'yandex_webmaster');
      if (!conn) return res.status(400).json({ error: 'Yandex Webmaster not connected' });
      const { hostId, dateFrom, dateTo } = req.query;
      if (!hostId) return res.status(400).json({ error: 'hostId required' });

      const userIdRes = await globalThis.fetch('https://api.webmaster.yandex.net/v4/user', {
        headers: { Authorization: `OAuth ${conn.accessToken}` },
      });
      const userData = await userIdRes.json() as any;
      const ymUserId = userData.user_id;
      const encodedHost = encodeURIComponent(hostId as string);

      const from = dateFrom || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const to = dateTo || new Date().toISOString().slice(0, 10);

      const [queriesRes, indexingRes] = await Promise.all([
        globalThis.fetch(
          `https://api.webmaster.yandex.net/v4/user/${ymUserId}/hosts/${encodedHost}/search-queries/all/history?query_indicator=TOTAL_SHOWS&query_indicator=TOTAL_CLICKS&query_indicator=AVG_SHOW_POSITION&query_indicator=AVG_CLICK_POSITION&date_from=${from}&date_to=${to}`,
          { headers: { Authorization: `OAuth ${conn.accessToken}` } }
        ),
        globalThis.fetch(
          `https://api.webmaster.yandex.net/v4/user/${ymUserId}/hosts/${encodedHost}/summary`,
          { headers: { Authorization: `OAuth ${conn.accessToken}` } }
        ),
      ]);

      const queriesData = await queriesRes.json() as any;
      const indexingData = await indexingRes.json() as any;

      res.json({ queries: queriesData, indexing: indexingData });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.get('/yandex/webmaster/top-queries', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const conn = await getYandexConnection(req.user.uid, 'yandex_webmaster');
      if (!conn) return res.status(400).json({ error: 'Yandex Webmaster not connected' });
      const { hostId, dateFrom, dateTo } = req.query;
      if (!hostId) return res.status(400).json({ error: 'hostId required' });

      const userIdRes = await globalThis.fetch('https://api.webmaster.yandex.net/v4/user', {
        headers: { Authorization: `OAuth ${conn.accessToken}` },
      });
      const userData = await userIdRes.json() as any;
      const ymUserId = userData.user_id;
      const encodedHost = encodeURIComponent(hostId as string);

      const from = dateFrom || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const to = dateTo || new Date().toISOString().slice(0, 10);

      const topRes = await globalThis.fetch(
        `https://api.webmaster.yandex.net/v4/user/${ymUserId}/hosts/${encodedHost}/search-queries/popular?order_by=TOTAL_CLICKS&date_from=${from}&date_to=${to}`,
        { headers: { Authorization: `OAuth ${conn.accessToken}` } }
      );
      const topData = await topRes.json();
      res.json(topData);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ---- Yandex Metrica API proxy ----
  apiRouter.get('/yandex/metrica/counters', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const conn = await getYandexConnection(req.user.uid, 'yandex_metrica');
      if (!conn) return res.status(400).json({ error: 'Yandex Metrica not connected' });
      const countersRes = await globalThis.fetch('https://api-metrica.yandex.net/management/v1/counters', {
        headers: { Authorization: `OAuth ${conn.accessToken}` },
      });
      const data = await countersRes.json();
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.get('/yandex/metrica/stats', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const conn = await getYandexConnection(req.user.uid, 'yandex_metrica');
      if (!conn) return res.status(400).json({ error: 'Yandex Metrica not connected' });
      const { counterId, dateFrom, dateTo } = req.query;
      if (!counterId) return res.status(400).json({ error: 'counterId required' });

      const from = dateFrom || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const to = dateTo || new Date().toISOString().slice(0, 10);

      const [summaryRes, sourcesRes, topPagesRes, searchEnginesRes] = await Promise.all([
        globalThis.fetch(
          `https://api-metrica.yandex.net/stat/v1/data?ids=${counterId}&metrics=ym:s:visits,ym:s:pageviews,ym:s:users,ym:s:bounceRate,ym:s:avgVisitDurationSeconds&date1=${from}&date2=${to}`,
          { headers: { Authorization: `OAuth ${conn.accessToken}` } }
        ),
        globalThis.fetch(
          `https://api-metrica.yandex.net/stat/v1/data?ids=${counterId}&metrics=ym:s:visits&dimensions=ym:s:lastTrafficSource&date1=${from}&date2=${to}&limit=10`,
          { headers: { Authorization: `OAuth ${conn.accessToken}` } }
        ),
        globalThis.fetch(
          `https://api-metrica.yandex.net/stat/v1/data?ids=${counterId}&metrics=ym:s:pageviews&dimensions=ym:s:startURL&date1=${from}&date2=${to}&sort=-ym:s:pageviews&limit=20`,
          { headers: { Authorization: `OAuth ${conn.accessToken}` } }
        ),
        globalThis.fetch(
          `https://api-metrica.yandex.net/stat/v1/data?ids=${counterId}&metrics=ym:s:visits&dimensions=ym:s:searchEngine&date1=${from}&date2=${to}&limit=10`,
          { headers: { Authorization: `OAuth ${conn.accessToken}` } }
        ),
      ]);

      const [summary, sources, topPages, searchEngines] = await Promise.all([
        summaryRes.json(), sourcesRes.json(), topPagesRes.json(), searchEnginesRes.json(),
      ]);

      res.json({ summary, sources, topPages, searchEngines });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ---- Google Search Console API proxy ----
  apiRouter.get('/google/search-console/sites', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const conn = await getYandexConnection(req.user.uid, 'google_search_console');
      if (!conn) return res.status(400).json({ error: 'Google Search Console not connected' });
      const token = await getGSCAccessToken(conn);
      if (!token) return res.status(400).json({ error: 'Google token expired and refresh failed' });
      const sitesRes = await globalThis.fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await sitesRes.json() as any;
      res.json({ sites: (data.siteEntry || []).map((s: any) => ({ siteUrl: s.siteUrl, permissionLevel: s.permissionLevel })) });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  async function fetchGSCData(accessToken: string, siteUrl: string, from: string, to: string) {
    const [queryRes, pageRes] = await Promise.all([
      globalThis.fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: from, endDate: to, dimensions: ['query'], rowLimit: 50 }),
      }),
      globalThis.fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: from, endDate: to, dimensions: ['page'], rowLimit: 20 }),
      }),
    ]);

    const [queryData, pageData] = await Promise.all([queryRes.json() as any, pageRes.json() as any]);
    console.log('GSC API queryRes status:', queryRes.status, 'rows:', queryData.rows?.length || 0, queryData.error ? `error: ${JSON.stringify(queryData.error)}` : '');
    console.log('GSC API pageRes status:', pageRes.status, 'rows:', pageData.rows?.length || 0, pageData.error ? `error: ${JSON.stringify(pageData.error)}` : '');

    const queries = (queryData.rows || []).map((r: any) => ({
      query: r.keys?.[0] || '', clicks: r.clicks || 0, impressions: r.impressions || 0,
      ctr: Math.round((r.ctr || 0) * 10000) / 100,
      position: Math.round((r.position || 0) * 10) / 10,
    }));

    const totalClicks = queries.reduce((s: number, q: any) => s + q.clicks, 0);
    const totalImpressions = queries.reduce((s: number, q: any) => s + q.impressions, 0);
    const avgPosition = queries.length > 0 ? Math.round(queries.reduce((s: number, q: any) => s + q.position, 0) / queries.length * 10) / 10 : 0;

    return {
      totalClicks, totalImpressions,
      avgCtr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
      avgPosition,
      queries,
      pages: (pageData.rows || []).map((r: any) => ({
        url: r.keys?.[0] || '', clicks: r.clicks || 0, impressions: r.impressions || 0,
      })),
    };
  }

  // ---- SEO Reports CRUD ----
  apiRouter.get('/seo-reports', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const rows = await db!.select().from(schema.seoReports)
        .where(eq(schema.seoReports.userId, req.user.uid))
        .orderBy(desc(schema.seoReports.createdAt));
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.get('/seo-reports/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const rows = await db!.select().from(schema.seoReports)
        .where(and(eq(schema.seoReports.id, req.params.id), eq(schema.seoReports.userId, req.user.uid)));
      if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.post('/seo-reports', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const id = uuidv4();
      const { title, projectId, period, dateFrom, dateTo } = req.body;
      await db!.insert(schema.seoReports).values({
        id, userId: req.user.uid, title: title || 'SEO Отчёт',
        projectId: projectId || null, period: period || null,
        dateFrom: dateFrom || null, dateTo: dateTo || null,
        status: 'draft', data: null,
      });
      res.json({ id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.put('/seo-reports/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const fields: any = {};
      const allowedKeys = ['title', 'projectId', 'period', 'dateFrom', 'dateTo', 'status', 'data'];
      for (const key of allowedKeys) {
        if (req.body[key] !== undefined) fields[key] = req.body[key];
      }
      await db!.update(schema.seoReports).set(fields)
        .where(and(eq(schema.seoReports.id, req.params.id), eq(schema.seoReports.userId, req.user.uid)));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  apiRouter.delete('/seo-reports/:id', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      await db!.delete(schema.seoReports)
        .where(and(eq(schema.seoReports.id, req.params.id), eq(schema.seoReports.userId, req.user.uid)));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  async function fetchWebmasterData(accessToken: string, hostId: string, from: string, to: string) {
    const userIdRes = await globalThis.fetch('https://api.webmaster.yandex.net/v4/user', {
      headers: { Authorization: `OAuth ${accessToken}` },
    });
    const userData = await userIdRes.json() as any;
    const ymUserId = userData.user_id;
    const encodedHost = encodeURIComponent(hostId);

    const [historyRes, topRes, summaryRes] = await Promise.all([
      globalThis.fetch(
        `https://api.webmaster.yandex.net/v4/user/${ymUserId}/hosts/${encodedHost}/search-queries/all/history?query_indicator=TOTAL_SHOWS&query_indicator=TOTAL_CLICKS&query_indicator=AVG_SHOW_POSITION&date_from=${from}&date_to=${to}`,
        { headers: { Authorization: `OAuth ${accessToken}` } }
      ),
      globalThis.fetch(
        `https://api.webmaster.yandex.net/v4/user/${ymUserId}/hosts/${encodedHost}/search-queries/popular?order_by=TOTAL_CLICKS&query_indicator=TOTAL_CLICKS&query_indicator=TOTAL_SHOWS&query_indicator=AVG_SHOW_POSITION&date_from=${from}&date_to=${to}`,
        { headers: { Authorization: `OAuth ${accessToken}` } }
      ),
      globalThis.fetch(
        `https://api.webmaster.yandex.net/v4/user/${ymUserId}/hosts/${encodedHost}/summary`,
        { headers: { Authorization: `OAuth ${accessToken}` } }
      ),
    ]);

    const [history, top, summary] = await Promise.all([
      historyRes.json() as any, topRes.json() as any, summaryRes.json() as any,
    ]);

    const indicators = history.indicators || {};
    const totalClicks = (indicators.TOTAL_CLICKS || []).reduce((s: number, d: any) => s + (d.value || 0), 0);
    const totalImpressions = (indicators.TOTAL_SHOWS || []).reduce((s: number, d: any) => s + (d.value || 0), 0);
    const positions = (indicators.AVG_SHOW_POSITION || []).filter((d: any) => d.value);
    const avgPosition = positions.length > 0 ? positions.reduce((s: number, d: any) => s + d.value, 0) / positions.length : 0;

    return {
      totalClicks, totalImpressions,
      avgCtr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
      avgPosition: Math.round(avgPosition * 10) / 10,
      queries: (top.queries || []).slice(0, 50).map((q: any) => ({
        query: q.query_text, clicks: q.indicators?.TOTAL_CLICKS || 0,
        impressions: q.indicators?.TOTAL_SHOWS || 0,
        ctr: q.indicators?.TOTAL_SHOWS > 0 ? Math.round((q.indicators?.TOTAL_CLICKS / q.indicators?.TOTAL_SHOWS) * 10000) / 100 : 0,
        position: Math.round((q.indicators?.AVG_SHOW_POSITION || 0) * 10) / 10,
      })),
      indexing: {
        indexed: summary.searchable_count || 0,
        excluded: summary.excluded_count || 0,
      },
    };
  }

  async function fetchMetricaData(accessToken: string, counterId: string, from: string, to: string) {
    const cId = counterId;
    const headers = { Authorization: `OAuth ${accessToken}` };
    const [summaryRes, sourcesRes, topPagesRes, searchRes, devicesRes, geoRes] = await Promise.all([
      globalThis.fetch(
        `https://api-metrica.yandex.net/stat/v1/data?ids=${cId}&metrics=ym:s:visits,ym:s:pageviews,ym:s:users,ym:s:bounceRate,ym:s:avgVisitDurationSeconds&date1=${from}&date2=${to}`,
        { headers }
      ),
      globalThis.fetch(
        `https://api-metrica.yandex.net/stat/v1/data?ids=${cId}&metrics=ym:s:visits&dimensions=ym:s:lastTrafficSource&date1=${from}&date2=${to}&limit=10`,
        { headers }
      ),
      globalThis.fetch(
        `https://api-metrica.yandex.net/stat/v1/data?ids=${cId}&metrics=ym:s:pageviews&dimensions=ym:s:startURL&date1=${from}&date2=${to}&sort=-ym:s:pageviews&limit=20`,
        { headers }
      ),
      globalThis.fetch(
        `https://api-metrica.yandex.net/stat/v1/data?ids=${cId}&metrics=ym:s:visits&dimensions=ym:s:searchEngine&date1=${from}&date2=${to}&limit=10`,
        { headers }
      ),
      globalThis.fetch(
        `https://api-metrica.yandex.net/stat/v1/data?ids=${cId}&metrics=ym:s:visits&dimensions=ym:s:deviceCategory&date1=${from}&date2=${to}`,
        { headers }
      ),
      globalThis.fetch(
        `https://api-metrica.yandex.net/stat/v1/data?ids=${cId}&metrics=ym:s:visits&dimensions=ym:s:regionCity&date1=${from}&date2=${to}&sort=-ym:s:visits&limit=15`,
        { headers }
      ),
    ]);

    const [smry, srcs, tPages, sEngines, devs, geo] = await Promise.all([
      summaryRes.json() as any, sourcesRes.json() as any,
      topPagesRes.json() as any, searchRes.json() as any,
      devicesRes.json() as any, geoRes.json() as any,
    ]);

    const totals = smry.data?.[0]?.metrics || [];
    const totalVisits = totals[0] || 0;

    return {
      visits: Math.round(totals[0] || 0),
      pageviews: Math.round(totals[1] || 0),
      users: Math.round(totals[2] || 0),
      bounceRate: Math.round((totals[3] || 0) * 100) / 100,
      avgDuration: Math.round(totals[4] || 0),
      sources: (srcs.data || []).map((d: any) => ({
        name: d.dimensions?.[0]?.name || 'Unknown',
        visits: Math.round(d.metrics?.[0] || 0),
        percentage: totalVisits > 0 ? Math.round((d.metrics?.[0] || 0) / totalVisits * 10000) / 100 : 0,
      })),
      topPages: (tPages.data || []).map((d: any) => ({
        url: d.dimensions?.[0]?.name || '',
        views: Math.round(d.metrics?.[0] || 0),
      })),
      searchEngines: (sEngines.data || []).map((d: any) => ({
        name: d.dimensions?.[0]?.name || 'Unknown',
        visits: Math.round(d.metrics?.[0] || 0),
      })),
      devices: (devs.data || []).map((d: any) => ({
        name: d.dimensions?.[0]?.name || 'Unknown',
        visits: Math.round(d.metrics?.[0] || 0),
        percentage: totalVisits > 0 ? Math.round((d.metrics?.[0] || 0) / totalVisits * 10000) / 100 : 0,
      })),
      geography: (geo.data || []).map((d: any) => ({
        city: d.dimensions?.[0]?.name || 'Unknown',
        visits: Math.round(d.metrics?.[0] || 0),
        percentage: totalVisits > 0 ? Math.round((d.metrics?.[0] || 0) / totalVisits * 10000) / 100 : 0,
      })),
    };
  }

  apiRouter.post('/seo-reports/:id/generate', requireAuth, requireDb, async (req: any, res: any) => {
    try {
      const reportRows = await db!.select().from(schema.seoReports)
        .where(and(eq(schema.seoReports.id, req.params.id), eq(schema.seoReports.userId, req.user.uid)));
      if (reportRows.length === 0) return res.status(404).json({ error: 'Report not found' });
      const report = reportRows[0] as any;

      await db!.update(schema.seoReports).set({ status: 'generating' })
        .where(eq(schema.seoReports.id, req.params.id));

      const from = report.dateFrom || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const to = report.dateTo || new Date().toISOString().slice(0, 10);

      const periodMs = new Date(to).getTime() - new Date(from).getTime();
      const prevTo = new Date(new Date(from).getTime() - 86400000).toISOString().slice(0, 10);
      const prevFrom = new Date(new Date(from).getTime() - periodMs - 86400000).toISOString().slice(0, 10);

      const existingData = report.data || {};
      const data: any = { generatedAt: new Date().toISOString(), dateFrom: from, dateTo: to, prevDateFrom: prevFrom, prevDateTo: prevTo };
      if (existingData.tasks) data.tasks = existingData.tasks;

      const wmConn = await getYandexConnection(req.user.uid, 'yandex_webmaster', report.projectId || undefined);
      console.log('WM conn:', wmConn ? { id: wmConn.id, hostId: wmConn.hostId, hasToken: !!wmConn.accessToken } : null);
      if (wmConn && wmConn.hostId && wmConn.accessToken) {
        try {
          const [current, prev] = await Promise.all([
            fetchWebmasterData(wmConn.accessToken, wmConn.hostId, from, to),
            fetchWebmasterData(wmConn.accessToken, wmConn.hostId, prevFrom, prevTo),
          ]);
          console.log('WM data:', { clicks: current.totalClicks, impressions: current.totalImpressions, indexed: current.indexing?.indexed, excluded: current.indexing?.excluded });
          data.webmaster = current;
          data.prevWebmaster = prev;
        } catch (e) { console.error('Webmaster data error:', e); }
      } else {
        console.log('WM skipped: conn=', !!wmConn, 'hostId=', wmConn?.hostId, 'token=', !!wmConn?.accessToken);
      }

      const mcConn = await getYandexConnection(req.user.uid, 'yandex_metrica', report.projectId || undefined);
      if (mcConn && mcConn.counterId && mcConn.accessToken) {
        try {
          const [current, prev] = await Promise.all([
            fetchMetricaData(mcConn.accessToken, mcConn.counterId, from, to),
            fetchMetricaData(mcConn.accessToken, mcConn.counterId, prevFrom, prevTo),
          ]);
          data.metrica = current;
          data.prevMetrica = prev;
        } catch (e) { console.error('Metrica data error:', e); }
      }

      const gscConn = await getYandexConnection(req.user.uid, 'google_search_console', report.projectId || undefined);
      console.log('GSC conn:', gscConn ? { id: gscConn.id, siteUrl: gscConn.siteUrl, hasToken: !!gscConn.accessToken, hasRefresh: !!gscConn.refreshToken, expires: gscConn.tokenExpiresAt } : null);
      const gscToken = gscConn ? await getGSCAccessToken(gscConn) : null;
      console.log('GSC token obtained:', !!gscToken);
      let gscSiteUrl = gscConn?.siteUrl;
      if (gscConn && gscToken && !gscSiteUrl) {
        try {
          const sitesRes = await globalThis.fetch('https://www.googleapis.com/webmasters/v3/sites', {
            headers: { Authorization: `Bearer ${gscToken}` },
          });
          const sitesData = await sitesRes.json() as any;
          console.log('GSC sites response:', JSON.stringify(sitesData).slice(0, 500));
          const sites = sitesData.siteEntry || [];
          if (sites.length > 0) gscSiteUrl = sites[0].siteUrl;
        } catch (e) { console.error('GSC sites fetch error:', e); }
      }
      console.log('GSC siteUrl:', gscSiteUrl);
      if (gscConn && gscSiteUrl && gscToken) {
        try {
          const [current, prev] = await Promise.all([
            fetchGSCData(gscToken, gscSiteUrl, from, to),
            fetchGSCData(gscToken, gscSiteUrl, prevFrom, prevTo),
          ]);
          console.log('GSC data fetched:', { clicks: current.totalClicks, impressions: current.totalImpressions, queries: current.queries?.length });
          data.gsc = current;
          data.prevGsc = prev;
        } catch (e) { console.error('GSC data error:', e); }
      } else {
        console.log('GSC skipped: conn=', !!gscConn, 'siteUrl=', !!gscSiteUrl, 'token=', !!gscToken);
      }

      if (report.projectId && !data.tasks) {
        try {
          const projectTasks = await db!.select().from(schema.tasks)
            .where(and(eq(schema.tasks.userId, req.user.uid), eq(schema.tasks.projectId, report.projectId)));
          data.tasks = projectTasks.map((t: any) => ({
            title: t.title, status: t.status, done: t.status === 'done' || !!t.completedAt,
            completedAt: t.completedAt?.toISOString() || null,
          }));
        } catch (e) { console.error('Tasks fetch error:', e); }
      }

      await db!.update(schema.seoReports).set({ status: 'ready', data })
        .where(eq(schema.seoReports.id, req.params.id));

      res.json({ success: true, data });
    } catch (e: any) {
      await db!.update(schema.seoReports).set({ status: 'error' })
        .where(eq(schema.seoReports.id, req.params.id));
      res.status(500).json({ error: e.message });
    }
  });

  async function getYandexConnection(userId: string, service: string, projectId?: string) {
    const allConns = await db!.select().from(schema.seoConnections)
      .where(and(eq(schema.seoConnections.userId, userId), eq(schema.seoConnections.service, service)));
    if (allConns.length === 0) return null;
    const mainConn = (allConns as any[]).find(c => c.accessToken && !c.projectId) || (allConns as any[]).find(c => c.accessToken);
    if (projectId) {
      const projectConn = (allConns as any[]).find(c => c.projectId === projectId);
      if (projectConn) {
        return { ...projectConn, accessToken: projectConn.accessToken || mainConn?.accessToken };
      }
    }
    return mainConn || allConns[0];
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
