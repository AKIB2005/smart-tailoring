import type { FormEvent } from 'react';
type Props = { busy?: boolean; amount: string; note: string; onAmount: (value: string) => void; onNote: (value: string) => void; onSubmit: (event: FormEvent) => void };
export function PaymentForm({ busy, amount, note, onAmount, onNote, onSubmit }: Props) {
 return <form className="formgrid" onSubmit={onSubmit}><label>Payment amount (₹)<input disabled={busy} inputMode="decimal" placeholder="0.00" value={amount} onChange={e=>onAmount(e.target.value)}/></label><label>Payment note<input disabled={busy} placeholder="Cash, UPI or a reference" value={note} onChange={e=>onNote(e.target.value)}/></label><button disabled={busy} className="primary">{busy?'Saving…':'Add payment'}</button></form>;
}
