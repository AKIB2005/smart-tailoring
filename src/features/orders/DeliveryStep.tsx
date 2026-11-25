import { parseRupees } from '../../domain/validation';
import { addDays, day, money } from '../../app/shared';
/** Billing step has no persistence responsibility; the wizard owns its draft. */
export function DeliveryStep({ due, advance, total, onDue, onAdvance }: { due: string; advance: string; total: number; onDue: (value:string)=>void; onAdvance: (value:string)=>void }) {
 return <><h2>Due date and bill</h2><label>Promised delivery date<input type="date" min={day()} value={due} onChange={e=>onDue(e.target.value)}/></label><div className="actions" aria-label="Delivery date shortcuts">{[3,7,10,14].map(n=><button type="button" key={n} onClick={()=>onDue(addDays(day(),n))}>{n===7?'1 week':`${n} days`}</button>)}</div><div className="bill-summary"><div><span>Stitching total</span><strong>{money(total)}</strong></div><div><span>Delivery</span><strong style={{fontSize:16}}>{due}</strong></div></div><label>Advance received (₹)<input inputMode="decimal" value={advance} onChange={e=>onAdvance(e.target.value)}/></label><p style={{marginTop:18}}>Balance <strong>{money(total-(parseRupees(advance) ?? 0))}</strong></p><p>Confirm the amount received before saving your order.</p></>;
}
