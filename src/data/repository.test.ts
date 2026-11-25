import { describe, expect, it } from 'vitest';
import { LocalRepository, STORAGE_KEY } from './repository';
import { parseMeasurement, parseRupees, validateMeasurements } from '../domain/validation';

function storage(initial: Record<string,string> = {}): Storage {
  const values = new Map(Object.entries(initial));
  return { get length() { return values.size; }, clear: () => values.clear(), getItem: key => values.get(key) ?? null, key: index => [...values.keys()][index] ?? null, removeItem: key => { values.delete(key); }, setItem: (key,value) => { values.set(key,value); } };
}
describe('local data', () => {
  it('rejects a stale tab instead of overwriting a saved order or payment', async () => {
    const store = storage(); const first = new LocalRepository(store); const second = new LocalRepository(store);
    const a = await first.load(); const b = await second.load();
    await first.save({ ...a, customers: [{ id: 'c', name: 'Synthetic Person', phone: '9999999999' }] });
    await expect(second.save(b)).rejects.toThrow('another tab');
    expect((await first.load()).customers).toHaveLength(1);
  });
  it('does not touch legacy data and preserves independent customers', async () => {
    const store = storage({ 'smart-tailoring-demo-v1': 'legacy' }); const repo = new LocalRepository(store); const data = await repo.load();
    await repo.save({ ...data, customers: [{ id: 'one', name: 'Synthetic Example', phone: '9999999999' }] });
    expect((await repo.load()).customers).toHaveLength(1); expect(store.getItem('smart-tailoring-demo-v1')).toBe('legacy');
  });
  it('preserves malformed data without reseeding', async () => { const store = storage({ [STORAGE_KEY]: '{bad' }); await expect(new LocalRepository(store).load()).rejects.toThrow('invalid'); expect(store.getItem(STORAGE_KEY)).toBe('{bad'); });
  it('reports storage write failure', async () => { const store = storage(); store.setItem = () => { throw new Error('quota'); }; const repo = new LocalRepository(store); await expect(repo.save(await repo.load())).rejects.toThrow('Save failed'); });
  it('persists independent customer and immutable measurement snapshots through archive and restore', async () => {
    const store = storage(); const repo = new LocalRepository(store); const data = await repo.load();
    const customer = { id: 'c', name: 'Synthetic Person', phone: '9999999999' };
    const original = { id: 'o', customerId: 'c', status: 'completed' as const, orderDate: '2026-01-01', dueDate: '2026-01-02', notes: '', items: [{ id: 'i', garment: 'shirt' as const, quantity: 1, unitPricePaise: 60000, templateVersion: 1, measurements: { collar: 15.5, shoulder: 17, chest: 40, length: 29, sleeve: 25 } }], payments: [{ id: 'p', amountPaise: 10025, date: '2026-01-01', note: 'Advance' }] };
    await repo.save({ ...data, customers: [customer], orders: [original] });
    const archived = { ...original, status: 'archived' as const, archivedFrom: 'completed' as const };
    await repo.save({ ...data, customers: [customer], orders: [archived] });
    const loaded = await new LocalRepository(store).load();
    expect(loaded.customers).toEqual([customer]); expect(loaded.orders[0].items[0].measurements.collar).toBe(15.5);
    const restored = { ...loaded.orders[0], status: loaded.orders[0].archivedFrom!, archivedFrom: undefined };
    await repo.save({ ...loaded, orders: [restored] }); expect((await repo.load()).orders[0].status).toBe('completed');
  });
  it('rejects duplicated order IDs, payment IDs and overpayments', async () => {
    const repo = new LocalRepository(storage()); const data = await repo.load();
    const c = { id: 'c', name: 'Demo Person', phone: '9999999999' };
    const o = { id: 'o', customerId: 'c', status: 'pending' as const, orderDate: '2026-01-01', dueDate: '2026-01-02', notes: '', items: [{ id: 'i', garment: 'pant' as const, quantity: 1, unitPricePaise: 1000, templateVersion: 1, measurements: { waist: 30, length: 40, thigh: 20, bottom: 15 } }], payments: [{ id: 'p', amountPaise: 500, date: '2026-01-01', note: '' }] };
    await expect(repo.save({ ...data, customers: [c], orders: [o, o] })).rejects.toThrow();
    await expect(repo.save({ ...data, customers: [c], orders: [{ ...o, payments: [...o.payments, ...o.payments] }] })).rejects.toThrow();
    await expect(repo.save({ ...data, customers: [c], orders: [{ ...o, payments: [{ ...o.payments[0], amountPaise: 1001 }] }] })).rejects.toThrow();
  });
});
describe('input validation', () => {
  it('parses fractions and validates required fields', () => { expect(parseMeasurement('15 1/2')).toBe(15.5); expect(parseMeasurement('1/0')).toBeNull(); expect(validateMeasurements('shirt', { chest: 40 })).toBe(false); });
  it('parses rupees without floating point arithmetic', () => { expect(parseRupees('10.05')).toBe(1005); expect(parseRupees('1.234')).toBeNull(); });
});
