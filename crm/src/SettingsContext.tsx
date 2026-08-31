import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { AgencySettings, KanbanColumn } from './types';

interface SettingsContextType {
  settings: AgencySettings | null;
  updateSettings: (newSettings: Partial<AgencySettings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'new', label: 'Новые лиды', color: 'bg-slate-100 border-slate-200 text-slate-700', order: 0 },
  { id: 'need_cp', label: 'Подготовить КП', color: 'bg-amber-50 border-amber-200 text-amber-700', order: 1 },
  { id: 'cp_sent', label: 'КП отправлено', color: 'bg-blue-50 border-blue-200 text-blue-700', order: 2 },
  { id: 'contract_signed', label: 'В работе (Договор)', color: 'bg-indigo-50 border-indigo-200 text-indigo-700', order: 3 },
  { id: 'won', label: 'Успешно', color: 'bg-emerald-50 border-emerald-200 text-emerald-700', order: 4 }
];

const DEFAULT_CONTRACT_TEMPLATE = `
# ДОГОВОР НА ОКАЗАНИЕ УСЛУГ
г. Москва «__» ______ 20__ г.

{{agencyName}}, именуемое в дальнейшем «Исполнитель», в лице {{agencyDirector}}, действующего на основании Устава, с одной стороны, и
{{clientName}}, именуемое в дальнейшем «Заказчик», в лице {{clientDirector}}, с другой стороны, заключили настоящий договор о нижеследующем:

## 1. Предмет договора
1.1. Исполнитель обязуется оказать Заказчику услуги: **{{projectType}}**
1.2. Стоимость услуг составляет: **{{dealAmount}}**

## 2. Порядок сдачи-приемки
2.1. По завершении оказания услуг Исполнитель предоставляет Заказчику Акт сдачи-приемки.

## 3. Реквизиты и подписи сторон

**ИСПОЛНИТЕЛЬ:**
{{agencyName}}
ИНН: {{agencyInn}} / КПП: {{agencyKpp}}
ОГРН: {{agencyOgrn}}
Юр. адрес: {{agencyAddress}}
Р/С: {{agencyAccount}} в {{agencyBank}}
БИК: {{agencyBik}}
Директор: ________________ / {{agencyDirector}} /

**ЗАКАЗЧИК:**
{{clientName}}
ИНН: {{clientInn}} / КПП: {{clientKpp}}
ОГРН: {{clientOgrn}}
Юр. адрес: {{clientAddress}}
Р/С: {{clientAccount}} в {{clientBank}}
БИК: {{clientBik}}
Подписант: ________________ / {{clientDirector}} /
`;

const DEFAULT_ACT_TEMPLATE = `
# АКТ СДАЧИ-ПРИЕМКИ ВЫПОЛНЕННЫХ РАБОТ (УСЛУГ)
г. Москва «__» ______ 20__ г.

Мы, нижеподписавшиеся, представитель Исполнителя {{agencyDirector}}, с одной стороны, и представитель Заказчика {{clientDirector}}, с другой стороны, составили настоящий акт в том, что:
1. Исполнитель оказал услуги: **{{projectType}}**
2. Заказчик услуги принял. Претензий к качеству, объему и срокам оказания услуг не имеет.
3. Стоимость услуг составила: **{{dealAmount}}**

**ИСПОЛНИТЕЛЬ:**
{{agencyName}}
ИНН: {{agencyInn}}
Директор: ________________ / {{agencyDirector}} /

**ЗАКАЗЧИК:**
{{clientName}}
ИНН: {{clientInn}}
Подписант: ________________ / {{clientDirector}} /
`;

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/settings', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data) {
            // Need to parse kanbanColumns if it comes as string depending on mysql driver
            if (typeof data.kanbanColumns === 'string') {
                try { data.kanbanColumns = JSON.parse(data.kanbanColumns); } catch (e) {}
            }
            setSettings(data as AgencySettings);
            return;
          }
        }
        
        // Defaults
        const defaultSettings: AgencySettings = {
          agencyName: '',
          inn: '',
          kpp: '',
          ogrn: '',
          directorName: '',
          address: '',
          bankAccount: '',
          bankName: '',
          bik: '',
          contractTemplate: DEFAULT_CONTRACT_TEMPLATE.trim(),
          actTemplate: DEFAULT_ACT_TEMPLATE.trim(),
          kanbanColumns: DEFAULT_COLUMNS,
          geminiProxy: '',
        };
        try {
          await fetch('/api/settings', {
            method: 'PUT',
            headers: { 
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify(defaultSettings)
          });
        } catch (e) {
          console.warn("Could not save initial settings, likely offline", e);
        }
        setSettings(defaultSettings);
      } catch (error) {
        console.warn("Error fetching settings:", error);
        // Fallback gracefully so the app doesn't break
        setSettings({
            agencyName: '',
            inn: '',
            kpp: '',
            ogrn: '',
            directorName: '',
            address: '',
            bankAccount: '',
            bankName: '',
            bik: '',
            contractTemplate: DEFAULT_CONTRACT_TEMPLATE.trim(),
            actTemplate: DEFAULT_ACT_TEMPLATE.trim(),
            kanbanColumns: DEFAULT_COLUMNS,
            geminiProxy: '',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const updateSettings = async (newSettings: Partial<AgencySettings>) => {
    if (!user || !settings) return;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      const idToken = await user.getIdToken();
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(updated)
      });
    } catch (error) {
      console.warn("Error saving settings:", error);
      // rollback in a real app, but optimistic update for now
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
