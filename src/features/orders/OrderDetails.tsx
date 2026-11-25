import { SubmissionGuard } from '../../app/submission';
import { Dialog } from '../../app/Dialog';
import { PaymentForm } from '../payments/PaymentForm';
import { ReceiptPreview } from '../receipts/ReceiptPreview';
import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { balancePaise, paidPaise, totalPaise, type Order } from '../../domain/model';
import { parseRupees } from '../../domain/validation';
import { day, id, money, status, wa, type Props } from '../../app/shared';
export function OrderDetails({ data, commit }: Props) {
 const { orderId }=useParams(); const navigate=useNavigate(); const o=data.orders.find(x=>x.id===orderId);
 const [amount,setAmount]=useState(''); const [note,setNote]=useState(''); const [due,setDue]=useState(o?.dueDate ?? ''); const [err,setErr]=useState(''); const [receipt,setReceipt]=useState(false); const [archiving,setArchiving]=useState(false); const [busy,setBusy]=useState(false); const lock=useRef(false); const paymentSubmitted=useRef(new SubmissionGuard());
 if (!o) return <div className="empty-state"><h1>Order not found.</h1><Link className="primary" to="/orders">Back to order book</Link></div>;
 const c=data.customers.find(x=>x.id===o.customerId)!;
 async function change(next: Order) {
  if (lock.current) return false; lock.current=true; setBusy(true);
  try { return await commit({ ...data, orders:data.orders.map(x=>x.id===next.id ? next : x) }); }
  finally { lock.current=false; setBusy(false); }
 }
 async function pay(e: FormEvent) {
  e.preventDefault(); if (lock.current) return;
  const p=parseRupees(amount); if (p===null || p<=0 || p>balancePaise(o!)) { setErr('Enter an amount greater than zero and no more than the balance.'); return; }
  if (await paymentSubmitted.current.run(()=>change({...o!,payments:[...o!.payments,{id:id(),amountPaise:p,date:day(),note:note.trim() || 'Payment'}]}))) { setAmount('');setNote('');setErr(''); }
 }
 async function archive() { if (await change({...o!,status:'archived',archivedFrom:o!.status==='completed'?'completed':'pending'})) navigate('/orders'); }
 return <><Link className="back-link" to="/orders">← Back to order book</Link><div className="heading"><div><span className="eyebrow">ORDER / {o.id.slice(0,8)}</span><h1>{c.name}</h1><p>{c.phone} · <span className={`status status-${status(o).toLowerCase().replace(' ','-')}`}>{status(o)}</span></p></div><button onClick={()=>setReceipt(true)}>View receipt</button></div>
 {receipt && <Dialog title="Receipt preview" onClose={()=>setReceipt(false)}><ReceiptPreview order={o} customer={c}/></Dialog>}
 {archiving && <Dialog title="Archive this order?" onClose={()=>setArchiving(false)}><div style={{padding:24}}><p>The measurements, payments and history will be retained. You can restore this order from the archive.</p><div className="actions"><button disabled={busy} onClick={()=>setArchiving(false)}>Keep order</button><button disabled={busy} className="primary" onClick={()=>void archive()}>Archive order</button></div></div></Dialog>}
 <div className="detail-grid"><div><section className="card"><span className="eyebrow">EVERY PROMISE, KEPT</span><h2>Delivery timeline</h2><ol className="timeline"><li className="complete">Order placed<small>{o.orderDate}</small></li><li className="complete">{o.status==='completed'?'Stitching complete':'In the workroom'}<small>{o.items.reduce((s,i)=>s+i.quantity,0)} garments</small></li><li className={o.status==='completed'?'complete':''}>{o.status==='completed'?'Delivered':'Promised delivery'}<small>{o.dueDate}</small></li></ol><label>Change delivery date<input type="date" min={o.orderDate} value={due} onChange={e=>setDue(e.target.value)}/></label><div className="actions"><button disabled={busy} onClick={()=>{if(due && due>=o.orderDate) {setErr('');void change({...o,dueDate:due});}else setErr('Choose a valid delivery date.');}}>Save date</button>{o.status!=='archived' && <button disabled={busy} className="primary" onClick={()=>void change({...o,status:o.status==='completed'?'pending':'completed'})}>{o.status==='completed'?'Reopen order':'Mark delivered'}</button>}{o.status==='archived'?<button disabled={busy} onClick={()=>void change({...o,status:o.archivedFrom ?? 'pending',archivedFrom:undefined})}>Restore order</button>:<button disabled={busy} onClick={()=>setArchiving(true)}>Archive order</button>}</div><p style={{marginTop:20,marginBottom:0,fontSize:12}}><a href={wa(c.phone,`Hello ${c.name}, your order ${o.id.slice(0,8)} is ${o.status==='completed'?'delivered':`due ${o.dueDate}`}. Balance: ${money(balancePaise(o))}.`)} target="_blank" rel="noreferrer">Open WhatsApp message ↗</a></p></section>
 <section className="card"><span className="eyebrow">THE FITTING RECORD</span><h2>Garments & measurements</h2>{o.items.map(i=><div className="history" key={i.id}><strong style={{textTransform:'capitalize'}}>{i.quantity} × {i.garment} · {money(i.unitPricePaise)} each</strong><div className="measurement-chips">{Object.entries(i.measurements).map(([k,v])=><span className="measurement-chip" key={k}>{k}<strong>{v} in</strong></span>)}</div></div>)}{o.notes && <p style={{marginTop:18}}>Notes: {o.notes}</p>}</section></div>
 <section className="card"><span className="eyebrow">CLEAR ACCOUNTS, BETTER CRAFT</span><h2>The bill</h2><div className="bill-summary"><div><span>Total</span><strong>{money(totalPaise(o))}</strong></div><div><span>Received</span><strong>{money(paidPaise(o))}</strong></div><div><span>Balance</span><strong>{money(balancePaise(o))}</strong></div></div><div className="payment-progress" role="img" aria-label={`${money(paidPaise(o))} received of ${money(totalPaise(o))}`}><span style={{width:`${totalPaise(o)?paidPaise(o)/totalPaise(o)*100:100}%`}}/></div><h3>Payment history</h3>{o.payments.length ? o.payments.map(p=><div className="payment-line" key={p.id}><span>{p.note}<small>{p.date}</small></span><strong>{money(p.amountPaise)}</strong></div>):<p className="empty">No payments recorded yet.</p>}{balancePaise(o)>0 && <div style={{marginTop:24}}><PaymentForm busy={busy} amount={amount} note={note} onAmount={v=>{paymentSubmitted.current.reset();setAmount(v);}} onNote={setNote} onSubmit={pay}/></div>}{balancePaise(o)===0 && <p className="badge" style={{marginTop:20}}>✓ Fully settled</p>}</section></div>{err && <p role="alert" className="alert">{err}</p>}</>;
}
