import { z } from 'zod';
import { balancePaise, type Customer, type Order, type ShopSettings } from '../domain/model';
import { validateMeasurements } from '../domain/validation';

const customer = z.object({ id: z.string().min(1), name: z.string().trim().min(2), phone: z.string().regex(/^\d{10}$/) });
const item = z.object({ id: z.string().min(1), garment: z.enum(['shirt', 'pant']), quantity: z.number().int().min(1).max(50), unitPricePaise: z.number().int().nonnegative(), measurements: z.record(z.string(), z.number().positive().lt(100)), templateVersion: z.number().int().positive(), preset: z.object({ id: z.string(), garment: z.enum(['shirt', 'pant']), version: z.number(), specifications: z.array(z.object({ fieldId: z.string(), value: z.union([z.string(), z.number()]) })) }).optional() });
const payment = z.object({ id: z.string().min(1), amountPaise: z.number().int().positive(), date: z.iso.date(), note: z.string() });
const order = z.object({ id: z.string().min(1), customerId: z.string().min(1), status: z.enum(['pending', 'completed', 'archived']), archivedFrom: z.enum(['pending', 'completed']).optional(), orderDate: z.iso.date(), dueDate: z.iso.date(), notes: z.string(), items: z.array(item).min(1), payments: z.array(payment) });
const schema = z.object({ version: z.literal(1), customers: z.array(customer), orders: z.array(order), settings: z.object({ theme: z.enum(['light', 'dark']), language: z.enum(['en', 'mr', 'hi']) }) }).superRefine((data, ctx) => {
  const ids = new Set(data.customers.map(c => c.id));
  if (ids.size !== data.customers.length || new Set(data.orders.map(o => o.id)).size !== data.orders.length) ctx.addIssue({ code: 'custom', message: 'Duplicate record identifiers' });
  data.orders.forEach(o => {
    if (!ids.has(o.customerId) || o.dueDate < o.orderDate || balancePaise(o) < 0 || !Number.isSafeInteger(balancePaise(o)) || o.items.some(i => !Number.isSafeInteger(i.unitPricePaise) || !Number.isSafeInteger(i.unitPricePaise * i.quantity) || !validateMeasurements(i.garment, i.measurements)) || o.payments.some(p => !Number.isSafeInteger(p.amountPaise)) || new Set(o.items.map(i => i.id)).size !== o.items.length || new Set(o.payments.map(p => p.id)).size !== o.payments.length) ctx.addIssue({ code: 'custom', message: 'Invalid order, measurements, identifiers or balance' });
  });
});
export type Data = z.infer<typeof schema>;
export const STORAGE_KEY = 'smart-tailoring-v2-dev-v1';
export interface Repository { load(): Promise<Data>; save(data: Data): Promise<Data> }
export class LocalRepository implements Repository {
  private lastRead: string | null = null;
  constructor(private storage: Storage = localStorage) {}
  async load(): Promise<Data> {
    let raw: string | null;
    try { raw = this.storage.getItem(STORAGE_KEY); } catch { throw new Error('Cannot read browser storage. Your data has not been changed.'); }
    this.lastRead = raw;
    if (raw === null) return { version: 1, customers: [], orders: [], settings: { theme: 'light', language: 'en' } };
    try { return schema.parse(JSON.parse(raw)); } catch { throw new Error('Stored demo data is invalid. It has been preserved; do not clear browser storage.'); }
  }
  async save(data: Data): Promise<Data> {
    const valid = schema.parse(data);
    try { if (this.storage.getItem(STORAGE_KEY) !== this.lastRead) throw new Error('Data changed in another tab. Reload before saving.'); } catch (error) { if (error instanceof Error && error.message.startsWith('Data changed')) throw error; throw new Error('Cannot check browser storage.'); }
    const serialized = JSON.stringify(valid);
    try { this.storage.setItem(STORAGE_KEY, serialized); this.lastRead = serialized; } catch { throw new Error('Save failed. Check browser storage and try again.'); }
    return valid;
  }
}
export type { Customer, Order, ShopSettings };
