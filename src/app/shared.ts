import type { Data } from '../data/repository';
import type { Order } from '../domain/model';
export type Props = { data: Data; commit: (next: Data) => Promise<boolean> };
export const id = () => crypto.randomUUID();
export const day = () => new Date().toLocaleDateString('en-CA');
export function addDays(date: string, days: number): string {
  const [year, month, dayOfMonth] = date.split('-').map(Number);
  const value = new Date(year, month - 1, dayOfMonth + days);
  return value.toLocaleDateString('en-CA');
}
export const money = (p: number) => `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: p % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
export const visible = (o: Order) => o.status !== 'archived';
export const status = (o: Order) => o.status === 'archived' ? 'Archived' : o.status === 'completed' ? 'Delivered' : o.dueDate < day() ? 'Overdue' : 'On schedule';
export const wa = (phone: string, text: string) => `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
