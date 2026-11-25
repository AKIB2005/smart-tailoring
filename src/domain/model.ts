export type GarmentType = 'shirt' | 'pant';
export type OrderStatus = 'pending' | 'completed' | 'archived';

export interface Customer { id: string; name: string; phone: string }
export interface MeasurementField { id: string; label: string; unit: 'in'; required: boolean }
export interface MeasurementTemplate { id: string; garment: GarmentType; version: number; fields: MeasurementField[] }
export interface MeasurementProfile { id: string; customerId: string; templateId: string; values: Record<string, number> }
export interface PresetSpecification { fieldId: string; value: string | number }
export interface GarmentPreset { id: string; garment: GarmentType; version: number; specifications: PresetSpecification[] }
export interface OrderItem { id: string; garment: GarmentType; quantity: number; unitPricePaise: number; measurements: Record<string, number>; templateVersion: number; preset?: GarmentPreset }
export interface Payment { id: string; amountPaise: number; date: string; note: string }
export interface Order { id: string; customerId: string; status: OrderStatus; archivedFrom?: 'pending' | 'completed'; orderDate: string; dueDate: string; notes: string; items: OrderItem[]; payments: Payment[] }
export interface ShopSettings { theme: 'light' | 'dark'; language: 'en' | 'mr' | 'hi' }

const fields = (labels: string[]): MeasurementField[] => labels.map(label => ({ id: label.toLowerCase(), label, unit: 'in', required: true }));
export const templates: MeasurementTemplate[] = [
  { id: 'shirt-v1', garment: 'shirt', version: 1, fields: fields(['Collar', 'Shoulder', 'Chest', 'Length', 'Sleeve']) },
  { id: 'pant-v1', garment: 'pant', version: 1, fields: fields(['Waist', 'Length', 'Thigh', 'Bottom']) },
];

export const totalPaise = (order: Order): number => order.items.reduce((sum, item) => sum + item.quantity * item.unitPricePaise, 0);
export const paidPaise = (order: Order): number => order.payments.reduce((sum, payment) => sum + payment.amountPaise, 0);
export const balancePaise = (order: Order): number => totalPaise(order) - paidPaise(order);
