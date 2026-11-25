import { describe, expect, it } from 'vitest';
import { balancePaise, paidPaise, templates, totalPaise, type Order } from './model';

describe('order calculations', () => {
  it('keeps partial payments and totals in integer paise', () => {
    const order: Order = {
      id: 'order', customerId: 'customer', status: 'pending', orderDate: '2026-01-01', dueDate: '2026-01-08', notes: '',
      items: [{ id: 'item', garment: 'shirt', quantity: 2, unitPricePaise: 60525, measurements: { chest: 40.5 }, templateVersion: 1 }],
      payments: [{ id: 'payment', amountPaise: 2050, date: '2026-01-01', note: '' }],
    };
    expect(totalPaise(order)).toBe(121050);
    expect(paidPaise(order)).toBe(2050);
    expect(balancePaise(order)).toBe(119000);
  });
  it('preserves the verified shirt and pant fields', () => {
    expect(templates.map(template => template.fields.length)).toEqual([5, 4]);
  });
});
