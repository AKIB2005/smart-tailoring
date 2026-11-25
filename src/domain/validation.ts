import { z } from 'zod';
import { templates, type GarmentType } from './model';

export const customerSchema = z.object({ name: z.string().trim().min(2, 'Enter a name'), phone: z.string().regex(/^\d{10}$/, 'Enter a 10-digit phone number') });
export function parseMeasurement(value: string): number | null {
  const text = value.trim();
  const fraction = /^(?:(\d+)\s+)?(\d+)\/(\d+)$/.exec(text);
  const n = fraction ? Number(fraction[1] || 0) + Number(fraction[2]) / Number(fraction[3]) : Number(text);
  return text && Number.isFinite(n) && n > 0 && n < 100 ? n : null;
}
export function validateMeasurements(garment: GarmentType, values: Record<string, number>): boolean {
  return templates.find(t => t.garment === garment)!.fields.every(field => Number.isFinite(values[field.id]) && values[field.id] > 0 && values[field.id] < 100);
}
export function parseRupees(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, decimals = ''] = value.trim().split('.');
  const result = Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
  return Number.isSafeInteger(result) ? result : null;
}
