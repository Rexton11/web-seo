import 'dotenv/config';
import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getAuth } from 'firebase-admin/auth';
import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';
import { app as firebaseApp } from './src/lib/firebase-admin.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
        'clientName', 'projectType', 'status', 'amount',
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
        'kanbanColumns', 'geminiProxy', 'stageScripts'
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
          geminiProxy: req.body.geminiProxy || null,
          stageScripts: req.body.stageScripts || null,
        });
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error('PUT /settings error:', e);
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

  app.use('/api', apiRouter);

  // Test Gemini API connection
  app.get('/api/test-gemini', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.json({ status: 'error', message: 'GEMINI_API_KEY не задан в .env' });
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: 'Ответь одним словом: работает',
      });
      res.json({ status: 'ok', response: response.text });
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
